#!/usr/bin/env python3
"""
Daily ETL jobs for analytics: update user behavior features, group performance metrics,
interaction matrix, user similarities, and refresh the feature store.
"""
from sqlalchemy.orm import Session
from sqlalchemy import func
from datetime import datetime, timedelta
import asyncio
import logging

from db.database import SessionLocal
from models.analytics_models import (
    EventsRaw,
    UserBehaviorFeatures,
    GroupPerformanceMetrics,
    UserGroupInteractionMatrix,
    UserSimilarity,
    FeatureStore,
)
from models.models import AdminGroup, User, Transaction

logger = logging.getLogger(__name__)

def _with_session(fn):
    def wrapper(*args, **kwargs):
        db = SessionLocal()
        try:
            return fn(db, *args, **kwargs)
        finally:
            db.close()
    return wrapper

def update_user_features_daily(db: Session):
    """Aggregate user behavior from events_raw into user_behavior_features."""
    try:
        user_ids = [u.id for u in db.query(User.id).all()]
        for uid in user_ids:
            features = db.query(UserBehaviorFeatures).filter(UserBehaviorFeatures.user_id == uid).first()
            if not features:
                features = UserBehaviorFeatures(user_id=uid)
                db.add(features)

            total_events = db.query(func.count(EventsRaw.id)).filter(EventsRaw.user_id == uid).scalar() or 0
            total_page_views = db.query(func.count(EventsRaw.id)).filter(EventsRaw.user_id == uid, EventsRaw.event_type == 'page_view').scalar() or 0
            total_group_views = db.query(func.count(EventsRaw.id)).filter(EventsRaw.user_id == uid, EventsRaw.event_type == 'group_view').scalar() or 0
            total_group_clicks = db.query(func.count(EventsRaw.id)).filter(EventsRaw.user_id == uid, EventsRaw.event_type == 'group_join_click').scalar() or 0
            total_joins = db.query(func.count(EventsRaw.id)).filter(EventsRaw.user_id == uid, EventsRaw.event_type == 'group_join_complete').scalar() or 0
            total_payments = db.query(func.count(EventsRaw.id)).filter(EventsRaw.user_id == uid, EventsRaw.event_type == 'payment_success').scalar() or 0

            features.total_events = total_events
            features.total_page_views = total_page_views
            features.total_group_views = total_group_views
            features.total_group_clicks = total_group_clicks
            features.total_joins = total_joins
            features.total_payments = total_payments

            features.browse_to_click_rate = (total_group_clicks / total_group_views) if total_group_views else 0.0
            features.click_to_join_rate = (total_joins / total_group_clicks) if total_group_clicks else 0.0
            features.join_to_payment_rate = (total_payments / total_joins) if total_joins else 0.0

            features.engagement_score = min(1.0, (total_page_views / 100) * 0.2 + (total_group_views / 50) * 0.3 + (total_joins / 10) * 0.5)
            features.last_computed = datetime.utcnow()

        db.commit()
        logger.info("✅ User behavior features updated")
    except Exception as e:
        db.rollback()
        logger.exception(f"Failed to update user features: {e}")

def update_group_metrics_daily(db: Session):
    """Aggregate group performance metrics from events and transactions."""
    try:
        group_ids = [g.id for g in db.query(AdminGroup.id).all()]
        for gid in group_ids:
            metrics = db.query(GroupPerformanceMetrics).filter(GroupPerformanceMetrics.admin_group_id == gid).first()
            if not metrics:
                metrics = GroupPerformanceMetrics(admin_group_id=gid)
                db.add(metrics)

            total_views = db.query(func.count(EventsRaw.id)).filter(EventsRaw.event_type == 'group_view', EventsRaw.properties['group_id'].as_integer() == gid).scalar() or 0  # type: ignore
            total_clicks = db.query(func.count(EventsRaw.id)).filter(EventsRaw.event_type == 'group_join_click', EventsRaw.properties['group_id'].as_integer() == gid).scalar() or 0  # type: ignore
            total_joins = db.query(func.count(EventsRaw.id)).filter(EventsRaw.event_type == 'group_join_complete', EventsRaw.properties['group_id'].as_integer() == gid).scalar() or 0  # type: ignore

            metrics.total_views = total_views
            metrics.total_clicks = total_clicks
            metrics.total_joins = total_joins
            metrics.view_to_click_rate = (total_clicks / total_views) if total_views else 0.0
            metrics.click_to_join_rate = (total_joins / total_clicks) if total_clicks else 0.0
            metrics.overall_conversion_rate = (total_joins / total_views) if total_views else 0.0
            metrics.last_updated = datetime.utcnow()
        db.commit()
        logger.info("✅ Group performance metrics updated")
    except Exception as e:
        db.rollback()
        logger.exception(f"Failed to update group metrics: {e}")

def refresh_feature_store(db: Session):
    """Persist a few useful aggregates to the feature store for quick reads."""
    try:
        top_active_users = db.query(UserBehaviorFeatures.user_id).order_by(UserBehaviorFeatures.engagement_score.desc()).limit(50).all()
        key = "top_active_users"
        record = db.query(FeatureStore).filter(FeatureStore.feature_key == key).first()
        payload = {"user_ids": [u.user_id for u in top_active_users]}
        if not record:
            record = FeatureStore(feature_key=key, feature_value=payload, feature_type='system', entity_id=0)
            db.add(record)
        else:
            record.feature_value = payload
            record.computed_at = datetime.utcnow()
        db.commit()
        logger.info("✅ Feature store refreshed")
    except Exception as e:
        db.rollback()
        logger.exception(f"Failed to refresh feature store: {e}")

async def run_daily_analytics_jobs_once():
    db = SessionLocal()
    try:
        update_user_features_daily(db)
        update_group_metrics_daily(db)
        refresh_feature_store(db)
    finally:
        db.close()

async def run_daily_analytics_scheduler(interval_hours: int = 24):
    """Run analytics ETL jobs every N hours."""
    logger.info(f"🔄 Starting analytics ETL scheduler (every {interval_hours}h)")
    # Initial delay to allow app to warm up
    await asyncio.sleep(10)
    while True:
        try:
            await run_daily_analytics_jobs_once()
        except Exception as e:
            logger.exception(f"Analytics ETL cycle failed: {e}")
        await asyncio.sleep(interval_hours * 3600)
*** End Patch*** }>>()[0m assistant to=functions.apply_patchurados պաշտ! ***!

