"""
Retrain ML models with improved clustering
"""
import asyncio
from db.database import SessionLocal
from ml.ml import train_clustering_model_with_progress

async def retrain():
    print("=" * 70)
    print("ML MODEL RETRAINING")
    print("=" * 70)
    print("Training hybrid recommender with improved clustering...")
    print()
    
    db = SessionLocal()
    try:
        results = await train_clustering_model_with_progress(db)
        
        print("\n" + "=" * 70)
        print("✅ TRAINING COMPLETE!")
        print("=" * 70)
        print(f"  Silhouette Score: {results['silhouette_score']:.3f}")
        print(f"  Number of Clusters: {results['n_clusters']}")
        print(f"  NMF Rank: {results.get('nmf_rank', 'N/A')}")
        print(f"  TF-IDF Vocabulary Size: {results.get('tfidf_vocab_size', 'N/A')}")
        print("=" * 70)
        
        print("\n💡 Improvements:")
        print("  ✅ Fixed category mapping for Mbare categories")
        print("  ✅ Weighted preference features 3x for better diversity")
        print("  ✅ Expanded cluster range (3-15 clusters)")
        print("  ✅ Better feature scaling")
        print("=" * 70)
        
    except Exception as e:
        print(f"❌ Training failed: {e}")
        import traceback
        traceback.print_exc()
    finally:
        db.close()

if __name__ == "__main__":
    asyncio.run(retrain())

