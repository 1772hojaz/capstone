"""
ML Model Scheduler - Auto-retrain daily and maintain best models only
"""
import asyncio
from datetime import datetime, timedelta
from sqlalchemy.orm import Session
from database import SessionLocal
from models import MLModel, Transaction
from ml import train_clustering_model
import os

class MLModelScheduler:
    def __init__(self):
        self.is_running = False
        self.training_interval = 24 * 60 * 60  # 24 hours in seconds
        
    async def start(self):
        """Start the background scheduler"""
        self.is_running = True
        print("🔄 ML Model Scheduler started - will retrain every 24 hours")
        
        while self.is_running:
            try:
                await asyncio.sleep(self.training_interval)
                await self.auto_retrain()
            except Exception as e:
                print(f"⚠️  Scheduler error: {e}")
                await asyncio.sleep(3600)  # Wait 1 hour on error
    
    async def auto_retrain(self):
        """Auto-retrain HYBRID models and keep only the best one"""
        db = SessionLocal()
        try:
            # Check if we have new data since last training
            last_model = db.query(MLModel).filter(
                MLModel.model_type == "hybrid_recommender"
            ).order_by(MLModel.trained_at.desc()).first()
            
            # Count transactions since last training
            if last_model:
                new_transactions = db.query(Transaction).filter(
                    Transaction.created_at > last_model.trained_at
                ).count()
                
                if new_transactions < 5:
                    print(f"⏭️  Skipping retraining - only {new_transactions} new transactions since last training")
                    return
                
                print(f"📊 Detected {new_transactions} new transactions since last training")
            
            # Check if we have enough total data
            total_transactions = db.query(Transaction).count()
            if total_transactions < 10:
                print(f"⏭️  Skipping retraining - only {total_transactions} transactions (minimum 10 required)")
                return
            
            print(f"\n🤖 Auto-retraining HYBRID recommender (database has {total_transactions} transactions)...")
            
            # Train new hybrid model from DATABASE
            training_results = train_clustering_model(db)
            new_score = training_results['silhouette_score']
            
            print(f"✅ New hybrid model trained:")
            print(f"   - Silhouette Score: {new_score:.3f}")
            print(f"   - Clusters: {training_results['n_clusters']}")
            print(f"   - NMF Rank: {training_results.get('nmf_rank', 'N/A')}")
            print(f"   - TF-IDF Vocab: {training_results.get('tfidf_vocab_size', 'N/A')}")
            
            # Get the newly created model
            new_model = db.query(MLModel).filter(
                MLModel.model_type == "hybrid_recommender"
            ).order_by(MLModel.trained_at.desc()).first()
            
            # Compare with previous models and delete poor performers
            await self.cleanup_poor_models(db, new_model)
            
            # Reload models in memory
            print("🔄 Reloading models in memory...")
            from ml import load_models
            load_models()
            
        except Exception as e:
            print(f"❌ Auto-retraining failed: {e}")
            import traceback
            traceback.print_exc()
            db.rollback()
        finally:
            db.close()
    
    async def cleanup_poor_models(self, db: Session, best_model: MLModel):
        """Delete models with lower performance than the best one"""
        try:
            best_score = best_model.metrics.get('silhouette_score', 0)
            
            # Get all other clustering models
            all_models = db.query(MLModel).filter(
                MLModel.model_type == "clustering",
                MLModel.id != best_model.id
            ).all()
            
            deleted_count = 0
            kept_models = []
            
            for model in all_models:
                model_score = model.metrics.get('silhouette_score', 0)
                
                # Delete if performance is worse
                if model_score < best_score:
                    # Delete model file if exists
                    if os.path.exists(model.model_path):
                        try:
                            os.remove(model.model_path)
                        except:
                            pass
                    
                    db.delete(model)
                    deleted_count += 1
                    print(f"   🗑️  Deleted poor model (score: {model_score:.3f} < {best_score:.3f})")
                else:
                    kept_models.append(model)
            
            # If we have models with equal or better scores, keep only the most recent one
            if kept_models:
                # Sort by score (desc) then by date (desc)
                kept_models.sort(key=lambda m: (
                    m.metrics.get('silhouette_score', 0), 
                    m.trained_at
                ), reverse=True)
                
                # Keep the best one, delete the rest
                for model in kept_models[1:]:
                    if os.path.exists(model.model_path):
                        try:
                            os.remove(model.model_path)
                        except:
                            pass
                    db.delete(model)
                    deleted_count += 1
                    print(f"   🗑️  Deleted redundant model (score: {model.metrics.get('silhouette_score', 0):.3f})")
            
            db.commit()
            
            if deleted_count > 0:
                print(f"   ♻️  Cleaned up {deleted_count} suboptimal model(s)")
                print(f"   ⭐ Best model score: {best_score:.3f}")
            else:
                print(f"   ✅ No cleanup needed - current model is optimal")
                
        except Exception as e:
            print(f"   ⚠️  Cleanup error: {e}")
            db.rollback()
    
    async def stop(self):
        """Stop the scheduler"""
        self.is_running = False
        print("🛑 ML Model Scheduler stopped")

# Global scheduler instance
scheduler = MLModelScheduler()

async def start_scheduler():
    """Start the ML scheduler"""
    await scheduler.start()

async def trigger_immediate_retrain():
    """Trigger an immediate retraining (for manual calls)"""
    await scheduler.auto_retrain()
