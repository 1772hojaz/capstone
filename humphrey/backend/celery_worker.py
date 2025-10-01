"""
Celery worker configuration for background tasks.
Handles scheduled model retraining and async processing.
"""

import os
from celery import Celery
from celery.schedules import crontab
import logging

logger = logging.getLogger(__name__)

# Celery configuration
CELERY_BROKER_URL = os.getenv("CELERY_BROKER_URL", "redis://localhost:6379/1")
CELERY_RESULT_BACKEND = os.getenv("CELERY_RESULT_BACKEND", "redis://localhost:6379/2")

# Initialize Celery app
celery = Celery(
    'spacs_africa',
    broker=CELERY_BROKER_URL,
    backend=CELERY_RESULT_BACKEND
)

# Celery configuration
celery.conf.update(
    task_serializer='json',
    accept_content=['json'],
    result_serializer='json',
    timezone='UTC',
    enable_utc=True,
    task_track_started=True,
    task_time_limit=3600,  # 1 hour max
    worker_prefetch_multiplier=1,
    worker_max_tasks_per_child=1000,
)

# ========================================
# Background Tasks
# ========================================

@celery.task(name='retrain_clustering_model')
def retrain_clustering_model():
    """
    Retrain the user clustering model with latest data.
    Scheduled to run nightly.
    """
    logger.info("Starting clustering model retraining...")
    
    try:
        from database import get_db_context
        from clustering import UserClusteringEngine, extract_user_features, update_user_clusters
        from sqlalchemy.orm import Session
        
        with get_db_context() as db:
            # Extract user features
            feature_data = extract_user_features(db)
            
            if len(feature_data) < 10:
                logger.warning("Not enough users for clustering. Skipping retraining.")
                return {"status": "skipped", "reason": "insufficient_data"}
            
            # Train clustering model
            engine = UserClusteringEngine(n_clusters=5)
            metrics = engine.fit(feature_data, auto_k=True)
            
            # Update user cluster assignments
            update_user_clusters(db, engine, feature_data)
            
            # Save model
            model_path = engine.save_model()
            
            # Save metrics to database
            from database import execute_raw_sql
            import json
            
            metadata_query = """
                INSERT INTO model_metadata (
                    model_type, model_version, parameters, metrics, 
                    training_date, is_active, notes
                ) VALUES (
                    'clustering', :version, :parameters::jsonb, :metrics::jsonb,
                    NOW(), TRUE, :notes
                )
            """
            
            execute_raw_sql(metadata_query, {
                'version': engine.model_version,
                'parameters': json.dumps({'n_clusters': engine.n_clusters}),
                'metrics': json.dumps(metrics),
                'notes': f'Automated retraining. Model saved to {model_path}'
            })
            
            logger.info(f"Clustering model retrained successfully: {metrics}")
            return {"status": "success", "metrics": metrics, "model_path": model_path}
            
    except Exception as e:
        logger.error(f"Error retraining clustering model: {e}")
        return {"status": "error", "error": str(e)}


@celery.task(name='generate_user_recommendations')
def generate_user_recommendations(user_id: str):
    """
    Generate recommendations for a specific user.
    Can be triggered on-demand or scheduled.
    """
    logger.info(f"Generating recommendations for user {user_id}")
    
    try:
        from database import get_db_context
        from recommender import GroupRecommenderEngine
        from explainability import generate_recommendation_explanation
        from uuid import UUID
        import json
        
        with get_db_context() as db:
            engine = GroupRecommenderEngine()
            recommendations = engine.generate_recommendations(db, UUID(user_id))
            
            # Save recommendations to database
            from database import execute_raw_sql
            from datetime import datetime, timedelta
            
            for rec in recommendations:
                # Generate explanation
                explanation = generate_recommendation_explanation(rec)
                
                # Insert recommendation
                query = """
                    INSERT INTO recommendations (
                        user_id, product_id, group_id, recommendation_type, score, 
                        explanation, feature_importance, status, expires_at
                    ) VALUES (
                        :user_id::uuid, :product_id::uuid, :group_id::uuid, :rec_type,
                        :score, :explanation, :feature_importance::jsonb, 'pending',
                        :expires_at
                    )
                """
                
                execute_raw_sql(query, {
                    'user_id': user_id,
                    'product_id': rec['product_id'],
                    'group_id': rec.get('group_id'),
                    'rec_type': rec['recommendation_type'],
                    'score': rec['score'],
                    'explanation': explanation,
                    'feature_importance': json.dumps({}),
                    'expires_at': datetime.now() + timedelta(days=7)
                })
            
            logger.info(f"Generated {len(recommendations)} recommendations for user {user_id}")
            return {"status": "success", "count": len(recommendations)}
            
    except Exception as e:
        logger.error(f"Error generating recommendations for user {user_id}: {e}")
        return {"status": "error", "error": str(e)}


@celery.task(name='generate_all_recommendations')
def generate_all_recommendations():
    """
    Generate recommendations for all active users.
    Scheduled to run daily.
    """
    logger.info("Generating recommendations for all users...")
    
    try:
        from database import execute_raw_sql
        
        # Get all active users with clusters
        query = """
            SELECT DISTINCT u.id::text as user_id
            FROM users u
            JOIN user_clusters uc ON u.id = uc.user_id
            WHERE u.is_active = TRUE
        """
        
        users = execute_raw_sql(query)
        
        # Generate recommendations for each user (async)
        results = []
        for user in users:
            result = generate_user_recommendations.delay(user['user_id'])
            results.append(result)
        
        logger.info(f"Queued recommendation generation for {len(users)} users")
        return {"status": "success", "users_queued": len(users)}
        
    except Exception as e:
        logger.error(f"Error generating all recommendations: {e}")
        return {"status": "error", "error": str(e)}


@celery.task(name='update_feature_store')
def update_feature_store():
    """
    Update feature store for all users based on recent transactions.
    Scheduled to run every few hours.
    """
    logger.info("Updating feature store...")
    
    try:
        from database import execute_raw_sql
        
        query = """
            INSERT INTO feature_store (
                user_id, purchase_frequency, avg_transaction_value, 
                price_sensitivity, total_transactions, total_spent, 
                last_purchase_date, updated_at
            )
            SELECT 
                t.user_id,
                COUNT(*)::DECIMAL / NULLIF(
                    EXTRACT(EPOCH FROM (MAX(t.transaction_date) - MIN(t.transaction_date))) / 604800, 
                    0
                ) as purchase_frequency,
                AVG(t.total_price) as avg_transaction_value,
                SUM(CASE WHEN t.transaction_type = 'bulk' THEN 1 ELSE 0 END)::DECIMAL / 
                    NULLIF(COUNT(*), 0) as price_sensitivity,
                COUNT(*) as total_transactions,
                SUM(t.total_price) as total_spent,
                MAX(t.transaction_date) as last_purchase_date,
                NOW() as updated_at
            FROM transactions t
            GROUP BY t.user_id
            ON CONFLICT (user_id) DO UPDATE SET
                purchase_frequency = EXCLUDED.purchase_frequency,
                avg_transaction_value = EXCLUDED.avg_transaction_value,
                price_sensitivity = EXCLUDED.price_sensitivity,
                total_transactions = EXCLUDED.total_transactions,
                total_spent = EXCLUDED.total_spent,
                last_purchase_date = EXCLUDED.last_purchase_date,
                updated_at = NOW()
        """
        
        execute_raw_sql(query)
        
        logger.info("Feature store updated successfully")
        return {"status": "success"}
        
    except Exception as e:
        logger.error(f"Error updating feature store: {e}")
        return {"status": "error", "error": str(e)}


@celery.task(name='cleanup_expired_recommendations')
def cleanup_expired_recommendations():
    """
    Mark expired recommendations and close deadline-passed groups.
    Runs hourly.
    """
    logger.info("Cleaning up expired recommendations and groups...")
    
    try:
        from database import execute_raw_sql
        
        # Expire old recommendations
        rec_query = """
            UPDATE recommendations
            SET status = 'expired'
            WHERE status = 'pending'
            AND expires_at < NOW()
        """
        
        execute_raw_sql(rec_query)
        
        # Close groups past deadline
        group_query = """
            UPDATE bulk_groups
            SET status = 'closed'
            WHERE status = 'open'
            AND deadline < NOW()
        """
        
        execute_raw_sql(group_query)
        
        logger.info("Cleanup completed successfully")
        return {"status": "success"}
        
    except Exception as e:
        logger.error(f"Error during cleanup: {e}")
        return {"status": "error", "error": str(e)}


# ========================================
# Scheduled Tasks (Celery Beat)
# ========================================

celery.conf.beat_schedule = {
    'retrain-clustering-nightly': {
        'task': 'retrain_clustering_model',
        'schedule': crontab(hour=2, minute=0),  # 2 AM daily
    },
    'generate-recommendations-daily': {
        'task': 'generate_all_recommendations',
        'schedule': crontab(hour=3, minute=0),  # 3 AM daily
    },
    'update-features-every-6-hours': {
        'task': 'update_feature_store',
        'schedule': crontab(minute=0, hour='*/6'),  # Every 6 hours
    },
    'cleanup-expired-hourly': {
        'task': 'cleanup_expired_recommendations',
        'schedule': crontab(minute=0),  # Every hour
    },
}


if __name__ == '__main__':
    # Run worker
    celery.start()
