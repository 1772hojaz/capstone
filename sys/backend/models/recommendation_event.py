from sqlalchemy import Column, Integer, Float, Boolean, DateTime, ForeignKey, JSON
from sqlalchemy.orm import relationship
from datetime import datetime
from db.database import Base

class RecommendationEvent(Base):
    __tablename__ = "recommendation_events"
    
    id = Column(Integer, primary_key=True, index=True)
    user_id = Column(Integer, ForeignKey("users.id"), nullable=False)
    group_buy_id = Column(Integer, ForeignKey("group_buys.id"), nullable=False)
    
    # Recommendation details
    recommendation_score = Column(Float, nullable=False)  # Score from 0 to 1
    recommendation_reasons = Column(JSON)  # List of reasons for recommendation
    
    # Interaction tracking
    shown_at = Column(DateTime, default=datetime.utcnow, nullable=False)
    clicked = Column(Boolean, default=False)
    clicked_at = Column(DateTime, nullable=True)
    joined = Column(Boolean, default=False)
    joined_at = Column(DateTime, nullable=True)
    
    # Relationships
    user = relationship("User", back_populates="recommendation_events")
    group_buy = relationship("GroupBuy", back_populates="recommendation_events")
