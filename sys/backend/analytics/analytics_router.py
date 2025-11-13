"""
Analytics Router - Backend API for tracking user behavior
"""
from fastapi import APIRouter, Depends, HTTPException, BackgroundTasks, Query
from sqlalchemy.orm import Session
from typing import List, Optional
from datetime import datetime, timedelta
from pydantic import BaseModel, Field
import uuid

from db.database import get_db
from models.analytics_models import EventsRaw, UserBehaviorFeatures, GroupPerformanceMetrics
from models.models import User, AdminGroup
from authentication.auth import get_current_user, verify_token

router = APIRouter(prefix="/api/analytics", tags=["analytics"])

# === PYDANTIC MODELS ===

class EventContext(BaseModel):
    url: str
    path: str
    referrer: Optional[str] = None
    user_agent: str
    screen_resolution: Optional[str] = None
    viewport_size: Optional[str] = None
    timezone: Optional[str] = None
    language: Optional[str] = None
    platform: Optional[str] = None
    connection_type: Optional[str] = None

class AnalyticsEvent(BaseModel):
    event_id: str
    event_type: str
    user_id: Optional[int] = None
    anonymous_id: str
    session_id: str
    timestamp: datetime
    properties: dict = Field(default_factory=dict)
    context: EventContext

class BatchEventsRequest(BaseModel):
    events: List[AnalyticsEvent]

class UserActivitySummary(BaseModel):
    user_id: int
    total_events: int
    total_sessions: int
    total_group_views: int
    total_joins: int
    engagement_score: float
    event_breakdown: dict

# === ENDPOINTS ===

@router.post("/track-batch")
async def track_batch_events(
    request: BatchEventsRequest,
    background_tasks: BackgroundTasks,
    db: Session = Depends(get_db)
):
    """
    Ingest a batch of analytics events.
    Optimized for high throughput with background processing.
    """
    try:
        # Process events in background to not block response
        background_tasks.add_task(process_events_batch, request.events, db)
        
        return {
            "status": "ok",
            "events_received": len(request.events),
            "message": "Events queued for processing"
        }
    except Exception as e:
        print(f"Error ingesting events: {str(e)}")
        raise HTTPException(status_code=500, detail=f"Failed to ingest events: {str(e)}")

def process_events_batch(events: List[AnalyticsEvent], db: Session):
    """
    Process and store events batch with idempotency.
    Runs in background to avoid blocking API responses.
    """
    try:
        events_to_insert = []
        
        for event in events:
            # Check if event already exists (idempotency by event_id)
            existing = db.query(EventsRaw).filter(
                EventsRaw.event_id == event.event_id
            ).first()
            
            if existing:
                continue  # Skip duplicate
            
            # Create event record
            event_record = EventsRaw(
                id=str(uuid.uuid4()),  # Generate UUID for SQLite compatibility
                event_id=event.event_id,
                event_type=event.event_type,
                user_id=event.user_id,
                anonymous_id=event.anonymous_id,
                session_id=event.session_id,
                timestamp=event.timestamp,
                properties=event.properties,
                url=event.context.url,
                path=event.context.path,
                referrer=event.context.referrer,
                user_agent=event.context.user_agent,
                screen_resolution=event.context.screen_resolution,
                viewport_size=event.context.viewport_size,
                timezone=event.context.timezone,
                language=event.context.language,
                platform=event.context.platform,
                connection_type=event.context.connection_type
            )
            
            events_to_insert.append(event_record)
        
        # Bulk insert for performance
        if events_to_insert:
            db.bulk_save_objects(events_to_insert)
            db.commit()
            print(f"✅ Inserted {len(events_to_insert)} events into events_raw")
            
            # Trigger incremental feature updates for affected users
            affected_user_ids = set(e.user_id for e in events if e.user_id)
            for user_id in affected_user_ids:
                update_user_features_incremental(user_id, db)
        
    except Exception as e:
        db.rollback()
        print(f"❌ Error processing events batch: {str(e)}")
        raise

def update_user_features_incremental(user_id: int, db: Session):
    """
    Incrementally update user behavior features based on new events.
    This runs after each batch to keep features fresh.
    """
    try:
        # Get or create user features
        features = db.query(UserBehaviorFeatures).filter(
            UserBehaviorFeatures.user_id == user_id
        ).first()
        
        if not features:
            features = UserBehaviorFeatures(user_id=user_id)
            db.add(features)
        
        # Get recent events (last hour) for incremental update
        one_hour_ago = datetime.utcnow() - timedelta(hours=1)
        recent_events = db.query(EventsRaw).filter(
            EventsRaw.user_id == user_id,
            EventsRaw.timestamp >= one_hour_ago
        ).all()
        
        # Update event counts
        for event in recent_events:
            if event.event_type == 'page_view':
                features.total_page_views += 1
            elif event.event_type == 'group_view':
                features.total_group_views += 1
                features.unique_groups_viewed = db.query(EventsRaw).filter(
                    EventsRaw.user_id == user_id,
                    EventsRaw.event_type == 'group_view'
                ).distinct(EventsRaw.properties['group_id']).count()
            elif event.event_type == 'group_join_click':
                features.total_group_clicks += 1
            elif event.event_type == 'group_join_complete':
                features.total_joins += 1
            elif event.event_type == 'payment_success':
                features.total_payments += 1
        
        # Update conversion rates
        if features.total_group_views > 0:
            features.browse_to_click_rate = features.total_group_clicks / features.total_group_views
        
        if features.total_group_clicks > 0:
            features.click_to_join_rate = features.total_joins / features.total_group_clicks
        
        if features.total_joins > 0:
            features.join_to_payment_rate = features.total_payments / features.total_joins
        
        # Update engagement score (simple formula)
        features.engagement_score = min(1.0, (
            (features.total_page_views / 100) * 0.2 +
            (features.total_group_views / 50) * 0.3 +
            (features.total_joins / 10) * 0.5
        ))
        
        features.last_computed = datetime.utcnow()
        db.commit()
        
    except Exception as e:
        db.rollback()
        print(f"⚠️  Error updating user features for user {user_id}: {str(e)}")

@router.get("/user-activity", response_model=UserActivitySummary)
async def get_user_activity(
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    """Get user's own activity summary."""
    from sqlalchemy import func
    
    # Get event counts by type
    event_counts = db.query(
        EventsRaw.event_type,
        func.count(EventsRaw.id).label('count')
    ).filter(
        EventsRaw.user_id == current_user.id
    ).group_by(
        EventsRaw.event_type
    ).all()
    
    # Get user features
    features = db.query(UserBehaviorFeatures).filter(
        UserBehaviorFeatures.user_id == current_user.id
    ).first()
    
    return UserActivitySummary(
        user_id=current_user.id,
        total_events=sum(row.count for row in event_counts),
        total_sessions=features.total_sessions if features else 0,
        total_group_views=features.total_group_views if features else 0,
        total_joins=features.total_joins if features else 0,
        engagement_score=features.engagement_score if features else 0.0,
        event_breakdown={row.event_type: row.count for row in event_counts}
    )

@router.get("/group-performance/{group_id}")
async def get_group_performance(
    group_id: int,
    current_user: User = Depends(verify_token),
    db: Session = Depends(get_db)
):
    """Get performance metrics for a specific group (admin only)."""
    
    # Check if group exists
    group = db.query(AdminGroup).filter(AdminGroup.id == group_id).first()
    if not group:
        raise HTTPException(status_code=404, detail="Group not found")
    
    # Get performance metrics
    metrics = db.query(GroupPerformanceMetrics).filter(
        GroupPerformanceMetrics.admin_group_id == group_id
    ).first()
    
    if not metrics:
        return {
            "group_id": group_id,
            "message": "No analytics data yet",
            "total_views": 0,
            "total_joins": 0,
            "conversion_rate": 0.0
        }
    
    return {
        "group_id": group_id,
        "group_name": group.name,
        "total_views": metrics.total_views,
        "unique_viewers": metrics.unique_viewers,
        "total_clicks": metrics.total_clicks,
        "total_joins": metrics.total_joins,
        "total_shares": metrics.total_shares,
        "view_to_click_rate": metrics.view_to_click_rate,
        "click_to_join_rate": metrics.click_to_join_rate,
        "overall_conversion_rate": metrics.overall_conversion_rate,
        "popularity_score": metrics.popularity_score,
        "trending_score": metrics.trending_score,
        "avg_time_to_join_hours": metrics.avg_time_to_join_hours,
        "last_updated": metrics.last_updated
    }

@router.get("/top-performing-groups")
async def get_top_performing_groups(
    limit: int = Query(10, ge=1, le=50),
    sort_by: str = Query("popularity", regex="^(popularity|trending|conversion)$"),
    current_user: User = Depends(verify_token),
    db: Session = Depends(get_db)
):
    """Get top performing groups by various metrics (admin only)."""
    
    # Determine sort column
    sort_column = GroupPerformanceMetrics.popularity_score
    if sort_by == "trending":
        sort_column = GroupPerformanceMetrics.trending_score
    elif sort_by == "conversion":
        sort_column = GroupPerformanceMetrics.overall_conversion_rate
    
    # Get top groups
    top_groups = db.query(
        GroupPerformanceMetrics, AdminGroup
    ).join(
        AdminGroup, GroupPerformanceMetrics.admin_group_id == AdminGroup.id
    ).order_by(
        sort_column.desc()
    ).limit(limit).all()
    
    results = []
    for metrics, group in top_groups:
        results.append({
            "group_id": group.id,
            "group_name": group.name,
            "category": group.category,
            "total_views": metrics.total_views,
            "total_joins": metrics.total_joins,
            "conversion_rate": metrics.overall_conversion_rate,
            "popularity_score": metrics.popularity_score,
            "trending_score": metrics.trending_score
        })
    
    return {
        "sort_by": sort_by,
        "total_results": len(results),
        "groups": results
    }

@router.get("/user-engagement-distribution")
async def get_user_engagement_distribution(
    current_user: User = Depends(verify_token),
    db: Session = Depends(get_db)
):
    """Get distribution of user engagement scores (admin only)."""
    from sqlalchemy import func, case
    
    # Count users in engagement score buckets
    engagement_buckets = db.query(
        func.count(UserBehaviorFeatures.user_id).label('count'),
        case(
            (UserBehaviorFeatures.engagement_score < 0.2, 'very_low'),
            (UserBehaviorFeatures.engagement_score < 0.4, 'low'),
            (UserBehaviorFeatures.engagement_score < 0.6, 'medium'),
            (UserBehaviorFeatures.engagement_score < 0.8, 'high'),
            else_='very_high'
        ).label('bucket')
    ).group_by('bucket').all()
    
    return {
        "distribution": {row.bucket: row.count for row in engagement_buckets},
        "total_users": sum(row.count for row in engagement_buckets)
    }

@router.post("/track-recommendation-interaction")
async def track_recommendation_interaction(
    group_id: int,
    interaction_type: str,  # 'view', 'click', 'join'
    recommendation_score: float,
    position: int,
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    """
    Track user interaction with recommendations for measuring recommendation quality.
    """
    try:
        # Update RecommendationEvent if it exists
        from models.models import RecommendationEvent
        
        event = db.query(RecommendationEvent).filter(
            RecommendationEvent.user_id == current_user.id,
            RecommendationEvent.group_buy_id == group_id
        ).order_by(RecommendationEvent.shown_at.desc()).first()
        
        if event:
            if interaction_type == 'click':
                event.clicked = True
                event.clicked_at = datetime.utcnow()
            elif interaction_type == 'join':
                event.joined = True
                event.joined_at = datetime.utcnow()
        else:
            # Create new event if doesn't exist
            event = RecommendationEvent(
                user_id=current_user.id,
                group_buy_id=group_id,
                recommendation_score=recommendation_score,
                recommendation_reasons=[f"Position {position} in recommendations"],
                shown_at=datetime.utcnow(),
                clicked=(interaction_type == 'click'),
                clicked_at=datetime.utcnow() if interaction_type == 'click' else None,
                joined=(interaction_type == 'join'),
                joined_at=datetime.utcnow() if interaction_type == 'join' else None
            )
            db.add(event)
        
        db.commit()
        
        return {
            "status": "ok",
            "message": f"Recommendation interaction tracked: {interaction_type}"
        }
        
    except Exception as e:
        db.rollback()
        raise HTTPException(status_code=500, detail=f"Failed to track interaction: {str(e)}")

@router.get("/health")
async def analytics_health_check(db: Session = Depends(get_db)):
    """Check health of analytics system."""
    from sqlalchemy import func
    
    try:
        # Check if tables exist and have data
        event_count = db.query(func.count(EventsRaw.id)).scalar()
        user_feature_count = db.query(func.count(UserBehaviorFeatures.user_id)).scalar()
        
        return {
            "status": "healthy",
            "total_events": event_count,
            "users_with_features": user_feature_count,
            "analytics_enabled": True
        }
    except Exception as e:
        return {
            "status": "error",
            "error": str(e),
            "analytics_enabled": False
        }
