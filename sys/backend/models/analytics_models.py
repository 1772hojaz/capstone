"""
Analytics Database Schema - Add these tables to your models

Run this migration to add analytics tracking tables:
```
python backend/migrate_db.py analytics
```
"""

from sqlalchemy import Column, Integer, String, Float, DateTime, Boolean, ForeignKey, Text, Index, ARRAY, func
from sqlalchemy.dialects.postgresql import JSONB as PG_JSONB  # type: ignore
from sqlalchemy.dialects.postgresql import UUID as PG_UUID  # type: ignore
from sqlalchemy.dialects.postgresql import ARRAY as PG_ARRAY  # type: ignore
from sqlalchemy.orm import relationship
from db.database import Base
from datetime import datetime
import uuid
import os

# DB compatibility: use PostgreSQL types if DATABASE_URL is Postgres; otherwise fall back
DATABASE_URL = os.getenv("DATABASE_URL", "sqlite:///./groupbuy.db").lower()
IS_POSTGRES = DATABASE_URL.startswith("postgresql")

from sqlalchemy import JSON
JSONType = PG_JSONB if IS_POSTGRES else JSON  # Use SQLAlchemy's JSON type for SQLite
UUIDType = PG_UUID(as_uuid=True) if IS_POSTGRES else String(36)
ARRAYString = PG_ARRAY(String) if IS_POSTGRES else Text  # fallback to Text-encoded JSON array

# === RAW EVENT TRACKING ===

class EventsRaw(Base):
    """
    Immutable append-only event store for TRADER user interactions ONLY.
    This is the source of truth for all behavioral data.
    
    NOTE: This table ONLY tracks traders (non-admin, non-supplier users).
    Events from admins and suppliers are automatically filtered out.
    """
    __tablename__ = "events_raw"
    
    id = Column(UUIDType, primary_key=True, default=uuid.uuid4 if IS_POSTGRES else None)
    event_id = Column(String(100), unique=True, nullable=False, index=True)
    event_type = Column(String(50), nullable=False, index=True)
    
    # User identification
    user_id = Column(Integer, ForeignKey("users.id", ondelete="SET NULL"), nullable=True, index=True)
    anonymous_id = Column(String(100), nullable=True, index=True)
    session_id = Column(String(100), nullable=False, index=True)
    
    # Timestamp
    timestamp = Column(DateTime(timezone=True), nullable=False, index=True)
    
    # Event data
    properties = Column(JSONType, nullable=True)
    
    # Context data
    url = Column(Text)
    path = Column(String(500), index=True)
    referrer = Column(Text)
    user_agent = Column(Text)
    screen_resolution = Column(String(50))
    viewport_size = Column(String(50))
    timezone = Column(String(100))
    language = Column(String(20))
    platform = Column(String(50))
    connection_type = Column(String(20))
    
    # Processing metadata
    created_at = Column(DateTime(timezone=True), default=datetime.utcnow)
    processed_at = Column(DateTime(timezone=True), nullable=True)
    
    # Relationships
    user = relationship("User", backref="events")
    
    # Indexes for common query patterns
    if IS_POSTGRES:
        __table_args__ = (
            Index('idx_events_user_timestamp', 'user_id', 'timestamp'),
            Index('idx_events_session_timestamp', 'session_id', 'timestamp'),
            Index('idx_events_type_timestamp', 'event_type', 'timestamp'),
            Index('idx_events_properties_gin', 'properties', postgresql_using='gin'),
        )
    else:
        __table_args__ = (
            Index('idx_events_user_timestamp', 'user_id', 'timestamp'),
            Index('idx_events_session_timestamp', 'session_id', 'timestamp'),
            Index('idx_events_type_timestamp', 'event_type', 'timestamp'),
        )

# === USER BEHAVIOR FEATURES ===

class UserBehaviorFeatures(Base):
    """
    Aggregated TRADER behavior features computed from events.
    Updated daily by ETL pipeline.
    
    NOTE: Only contains data for traders (non-admin, non-supplier users).
    """
    __tablename__ = "user_behavior_features"
    
    user_id = Column(Integer, ForeignKey("users.id", ondelete="CASCADE"), primary_key=True)
    
    # Activity metrics
    total_sessions = Column(Integer, default=0)
    total_events = Column(Integer, default=0)
    avg_session_duration_seconds = Column(Float, default=0.0)
    total_page_views = Column(Integer, default=0)
    
    # Engagement metrics
    total_group_views = Column(Integer, default=0)
    unique_groups_viewed = Column(Integer, default=0)
    total_group_clicks = Column(Integer, default=0)
    total_joins = Column(Integer, default=0)
    total_payments = Column(Integer, default=0)
    
    # Conversion metrics
    browse_to_click_rate = Column(Float, default=0.0)
    click_to_join_rate = Column(Float, default=0.0)
    join_to_payment_rate = Column(Float, default=0.0)
    overall_conversion_rate = Column(Float, default=0.0)
    
    # Category preferences (weighted by interactions)
    top_category_1 = Column(String(100))
    top_category_2 = Column(String(100))
    top_category_3 = Column(String(100))
    category_scores = Column(JSONType, default={})  # {category: score}
    
    # Price behavior
    avg_price_viewed = Column(Float, default=0.0)
    avg_price_joined = Column(Float, default=0.0)
    min_price_joined = Column(Float)
    max_price_joined = Column(Float)
    price_sensitivity_score = Column(Float, default=0.5)  # 0=price-sensitive, 1=price-insensitive
    
    # Temporal patterns
    peak_activity_hour = Column(Integer)  # 0-23
    peak_activity_day = Column(Integer)  # 0=Monday, 6=Sunday
    is_weekend_shopper = Column(Boolean, default=False)
    avg_time_to_decision_seconds = Column(Float, default=0.0)  # Time from view to join
    
    # Search behavior
    total_searches = Column(Integer, default=0)
    avg_search_results = Column(Float, default=0.0)
    search_to_click_rate = Column(Float, default=0.0)
    
    # Social behavior
    total_shares = Column(Integer, default=0)
    total_recommendations_clicked = Column(Integer, default=0)
    recommendation_click_rate = Column(Float, default=0.0)
    
    # Recency
    last_view = Column(DateTime(timezone=True))
    last_click = Column(DateTime(timezone=True))
    last_join = Column(DateTime(timezone=True))
    last_payment = Column(DateTime(timezone=True))
    days_since_last_activity = Column(Integer)
    
    # Lifetime value
    total_amount_spent = Column(Float, default=0.0)
    avg_order_value = Column(Float, default=0.0)
    total_quantity_purchased = Column(Integer, default=0)
    
    # Engagement scores (0-1)
    engagement_score = Column(Float, default=0.0)
    loyalty_score = Column(Float, default=0.0)
    churn_risk_score = Column(Float, default=0.0)
    propensity_to_buy_score = Column(Float, default=0.5)
    
    # Metadata
    last_computed = Column(DateTime(timezone=True), default=datetime.utcnow)
    created_at = Column(DateTime(timezone=True), default=datetime.utcnow)
    
    # Relationships
    user = relationship("User", backref="behavior_features")
    
    # Indexes
    __table_args__ = (
        Index('idx_behavior_engagement', 'engagement_score'),
        Index('idx_behavior_churn', 'churn_risk_score'),
        Index('idx_behavior_last_activity', 'days_since_last_activity'),
    )

# === GROUP PERFORMANCE METRICS ===

class GroupPerformanceMetrics(Base):
    """
    Aggregated metrics for each group/product.
    Updated daily by ETL pipeline.
    """
    __tablename__ = "group_performance_metrics"
    
    admin_group_id = Column(Integer, ForeignKey("admin_groups.id", ondelete="CASCADE"), primary_key=True)
    
    # View metrics
    total_views = Column(Integer, default=0)
    unique_viewers = Column(Integer, default=0)
    avg_view_duration_seconds = Column(Float, default=0.0)
    
    # Engagement metrics
    total_clicks = Column(Integer, default=0)
    total_joins = Column(Integer, default=0)
    total_payments = Column(Integer, default=0)
    total_shares = Column(Integer, default=0)
    
    # Conversion metrics
    view_to_click_rate = Column(Float, default=0.0)
    click_to_join_rate = Column(Float, default=0.0)
    join_to_payment_rate = Column(Float, default=0.0)
    overall_conversion_rate = Column(Float, default=0.0)
    
    # Performance indicators
    avg_time_to_first_view_hours = Column(Float, default=0.0)  # From creation
    avg_time_to_join_hours = Column(Float, default=0.0)  # From first view
    avg_time_to_payment_hours = Column(Float, default=0.0)  # From join
    
    # Popularity metrics
    popularity_score = Column(Float, default=0.0, index=True)
    trending_score = Column(Float, default=0.0, index=True)  # Recent activity weighted
    virality_score = Column(Float, default=0.0)  # Share rate
    
    # Progress metrics
    current_progress = Column(Float, default=0.0)  # participants / max_participants
    fill_velocity = Column(Float, default=0.0)  # participants per day
    estimated_completion_days = Column(Float)
    
    # Revenue metrics
    total_revenue = Column(Float, default=0.0)
    avg_revenue_per_participant = Column(Float, default=0.0)
    
    # Demographic patterns (most common attributes of participants)
    dominant_location = Column(String(100))
    dominant_experience_level = Column(String(50))
    dominant_budget_range = Column(String(50))
    
    # Metadata
    last_updated = Column(DateTime(timezone=True), default=datetime.utcnow, onupdate=datetime.utcnow)
    created_at = Column(DateTime(timezone=True), default=datetime.utcnow)
    
    # Relationships
    admin_group = relationship("AdminGroup", back_populates="performance_metrics")
    
    # Indexes
    __table_args__ = (
        Index('idx_group_popularity', 'popularity_score'),
        Index('idx_group_trending', 'trending_score'),
        Index('idx_group_conversion', 'overall_conversion_rate'),
    )

# === USER-GROUP INTERACTIONS ===

class UserGroupInteractionMatrix(Base):
    """
    User-group interaction matrix for collaborative filtering.
    Tracks detailed interaction history for each user-group pair.
    """
    __tablename__ = "user_group_interaction_matrix"
    
    id = Column(Integer, primary_key=True, index=True)
    user_id = Column(Integer, ForeignKey("users.id", ondelete="CASCADE"), nullable=False, index=True)
    admin_group_id = Column(Integer, ForeignKey("admin_groups.id", ondelete="CASCADE"), nullable=False, index=True)
    
    # View interactions
    has_viewed = Column(Boolean, default=False)
    view_count = Column(Integer, default=0)
    total_view_duration_seconds = Column(Float, default=0.0)
    first_viewed_at = Column(DateTime(timezone=True))
    last_viewed_at = Column(DateTime(timezone=True))
    
    # Click interactions
    has_clicked = Column(Boolean, default=False)
    click_count = Column(Integer, default=0)
    first_clicked_at = Column(DateTime(timezone=True))
    last_clicked_at = Column(DateTime(timezone=True))
    
    # Join interactions
    has_joined = Column(Boolean, default=False)
    joined_at = Column(DateTime(timezone=True))
    quantity_joined = Column(Integer, default=0)
    
    # Payment interactions
    has_paid = Column(Boolean, default=False)
    paid_at = Column(DateTime(timezone=True))
    amount_paid = Column(Float)
    
    # Social interactions
    has_shared = Column(Boolean, default=False)
    share_count = Column(Integer, default=0)
    
    # Source tracking
    first_source = Column(String(50))  # 'browse', 'recommendation', 'search', 'direct'
    last_source = Column(String(50))
    
    # Computed scores
    implicit_rating = Column(Float, default=0.0, index=True)  # 0-5 scale
    engagement_score = Column(Float, default=0.0)  # 0-1 scale
    
    # Time-based features
    time_to_click_seconds = Column(Float)  # From first view
    time_to_join_seconds = Column(Float)  # From first click
    time_to_payment_seconds = Column(Float)  # From join
    
    # Metadata
    created_at = Column(DateTime(timezone=True), default=datetime.utcnow)
    updated_at = Column(DateTime(timezone=True), default=datetime.utcnow, onupdate=datetime.utcnow)
    
    # Relationships
    user = relationship("User", backref="group_interactions")
    admin_group = relationship("AdminGroup", back_populates="user_interactions")
    
    # Unique constraint
    __table_args__ = (
        Index('idx_interaction_user_group', 'user_id', 'admin_group_id', unique=True),
        Index('idx_interaction_rating', 'implicit_rating'),
        Index('idx_interaction_engagement', 'engagement_score'),
    )

# === USER SIMILARITY GRAPH ===

class UserSimilarity(Base):
    """
    Precomputed user similarity scores for fast recommendations.
    Updated by ETL pipeline using collaborative filtering.
    """
    __tablename__ = "user_similarity"
    
    id = Column(Integer, primary_key=True, index=True)
    user_id = Column(Integer, ForeignKey("users.id", ondelete="CASCADE"), nullable=False, index=True)
    similar_user_id = Column(Integer, ForeignKey("users.id", ondelete="CASCADE"), nullable=False, index=True)
    
    # Similarity metrics
    similarity_score = Column(Float, nullable=False, index=True)  # 0-1
    similarity_type = Column(String(50), nullable=False)  # 'collaborative', 'demographic', 'behavioral', 'hybrid'
    
    # Component scores
    jaccard_similarity = Column(Float)  # Based on common groups
    cosine_similarity = Column(Float)  # Based on preference vectors
    demographic_similarity = Column(Float)  # Based on user attributes
    behavioral_similarity = Column(Float)  # Based on interaction patterns
    
    # Supporting data
    common_groups_count = Column(Integer, default=0)
    common_categories = Column(ARRAYString)
    
    # Metadata
    computed_at = Column(DateTime(timezone=True), default=datetime.utcnow)
    
    # Relationships
    user = relationship("User", foreign_keys=[user_id], backref="similar_users")
    similar_user = relationship("User", foreign_keys=[similar_user_id])
    
    # Indexes and constraints
    __table_args__ = (
        Index('idx_similarity_user_score', 'user_id', 'similarity_score'),
        Index('idx_similarity_pair', 'user_id', 'similar_user_id', unique=True),
    )

# === FEATURE STORE ===

class FeatureStore(Base):
    """
    Precomputed features for real-time serving.
    Key-value store for ML model features.
    """
    __tablename__ = "feature_store"
    
    id = Column(Integer, primary_key=True, index=True)
    feature_key = Column(String(200), unique=True, nullable=False, index=True)
    feature_value = Column(JSONType, nullable=False)
    feature_type = Column(String(50), nullable=False, index=True)  # 'user', 'item', 'user_item', 'context'
    entity_id = Column(Integer, index=True)  # user_id or group_id depending on type
    
    # Versioning and expiration
    version = Column(Integer, default=1)
    computed_at = Column(DateTime(timezone=True), default=datetime.utcnow)
    expires_at = Column(DateTime(timezone=True), index=True)
    
    # Metadata
    created_at = Column(DateTime(timezone=True), default=datetime.utcnow)
    
    # Indexes
    __table_args__ = (
        Index('idx_feature_type_entity', 'feature_type', 'entity_id'),
        Index('idx_feature_expiration', 'expires_at'),
    )

# === SESSION TRACKING ===

class SessionMetrics(Base):
    """
    Detailed session-level metrics for understanding user journeys.
    """
    __tablename__ = "session_metrics"
    
    session_id = Column(String(100), primary_key=True)
    user_id = Column(Integer, ForeignKey("users.id", ondelete="SET NULL"), nullable=True, index=True)
    anonymous_id = Column(String(100), nullable=True, index=True)
    
    # Session timing
    started_at = Column(DateTime(timezone=True), nullable=False)
    ended_at = Column(DateTime(timezone=True))
    duration_seconds = Column(Float)
    
    # Session metrics
    total_events = Column(Integer, default=0)
    total_page_views = Column(Integer, default=0)
    total_group_views = Column(Integer, default=0)
    total_clicks = Column(Integer, default=0)
    total_searches = Column(Integer, default=0)
    
    # Conversion tracking
    had_join = Column(Boolean, default=False)
    had_payment = Column(Boolean, default=False)
    total_revenue = Column(Float, default=0.0)
    
    # Entry/exit
    entry_page = Column(String(500))
    exit_page = Column(String(500))
    referrer = Column(Text)
    
    # Device info
    device_type = Column(String(50))  # 'mobile', 'tablet', 'desktop'
    browser = Column(String(100))
    os = Column(String(100))
    
    # Location
    city = Column(String(100))
    country = Column(String(100))
    
    # Metadata
    created_at = Column(DateTime(timezone=True), default=datetime.utcnow)
    
    # Relationships
    user = relationship("User", backref="sessions")
    
    # Indexes
    __table_args__ = (
        Index('idx_session_user_started', 'user_id', 'started_at'),
        Index('idx_session_conversion', 'had_join', 'had_payment'),
    )

# === SEARCH TRACKING ===

class SearchQuery(Base):
    """
    Track all search queries for understanding user intent.
    """
    __tablename__ = "search_queries"
    
    id = Column(Integer, primary_key=True, index=True)
    user_id = Column(Integer, ForeignKey("users.id", ondelete="SET NULL"), nullable=True, index=True)
    session_id = Column(String(100), nullable=False, index=True)
    
    # Query details
    query = Column(Text, nullable=False)
    normalized_query = Column(Text, index=True)  # Lowercase, trimmed
    filters_applied = Column(JSONType, default={})
    sort_by = Column(String(50))
    
    # Results
    result_count = Column(Integer, default=0)
    clicked_result_ids = Column(ARRAYString)  # Groups clicked from results (JSON array for SQLite)
    clicked_result_positions = Column(ARRAYString)  # Positions of clicked results (JSON array for SQLite)
    
    # Timing
    searched_at = Column(DateTime(timezone=True), nullable=False, default=datetime.utcnow, index=True)
    time_to_first_click_seconds = Column(Float)
    
    # Success metrics
    had_click = Column(Boolean, default=False)
    had_join = Column(Boolean, default=False)
    
    # Relationships
    user = relationship("User", backref="searches")
    
    # Indexes
    __table_args__ = (
        Index('idx_search_query', 'normalized_query'),
        Index('idx_search_user_time', 'user_id', 'searched_at'),
        Index('idx_search_success', 'had_click', 'had_join'),
    )
