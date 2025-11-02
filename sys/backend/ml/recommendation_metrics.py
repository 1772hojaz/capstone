"""
Recommendation Performance Tracking
Track and visualize recommendation effectiveness
"""
from pydantic import BaseModel
from typing import List, Optional
from datetime import datetime, timedelta

class RecommendationMetrics(BaseModel):
    """Metrics for recommendation system performance"""
    # Engagement Metrics
    total_recommendations_shown: int
    total_clicks: int
    total_joins: int
    click_through_rate: float  # clicks / shown
    conversion_rate: float  # joins / clicks
    
    # Quality Metrics
    avg_recommendation_score: float
    recommendations_per_user: float
    
    # Factor Effectiveness (which factors lead to joins)
    purchase_history_effectiveness: float
    cluster_popularity_effectiveness: float
    moq_progress_effectiveness: float
    deadline_proximity_effectiveness: float
    savings_effectiveness: float
    
    # Time-based
    period_start: datetime
    period_end: datetime
    
class RecommendationEvent(BaseModel):
    """Track individual recommendation events"""
    user_id: int
    group_buy_id: int
    recommendation_score: float
    recommendation_reasons: List[str]
    shown_at: datetime
    clicked: bool = False
    clicked_at: Optional[datetime] = None
    joined: bool = False
    joined_at: Optional[datetime] = None
    
class FactorAnalysis(BaseModel):
    """Analysis of which recommendation factors work best"""
    factor_name: str
    times_included: int
    times_clicked: int
    times_joined: int
    effectiveness_score: float  # joins / times_included

class RecommendationVisualization(BaseModel):
    """Comprehensive recommendation performance data for visualization"""
    # Overall Metrics
    overall_metrics: RecommendationMetrics
    
    # Factor Performance
    factor_analysis: List[FactorAnalysis]
    
    # Trend Data (last 7 days)
    daily_ctr: List[float]  # Click-through rate per day
    daily_conversion: List[float]  # Conversion rate per day
    daily_recommendations: List[int]  # Recommendations shown per day
    date_labels: List[str]  # Date labels for charts
    
    # Score Distribution
    score_ranges: List[str]  # "0.0-0.2", "0.2-0.4", etc.
    score_distribution: List[int]  # Count in each range
    
    # Top Performing Products
    top_products: List[dict]  # product_name, recommendation_count, join_count
