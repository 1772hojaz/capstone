from sqlalchemy import Column, Integer, String, Boolean, JSON, DateTime
from sqlalchemy.orm import relationship
from datetime import datetime
from db.database import Base

class User(Base):
    __tablename__ = "users"
    
    id = Column(Integer, primary_key=True, index=True)
    email = Column(String, unique=True, index=True, nullable=False)
    hashed_password = Column(String, nullable=False)
    full_name = Column(String)
    is_admin = Column(Boolean, default=False)
    is_active = Column(Boolean, default=True)
    location_zone = Column(String, nullable=False)
    cluster_id = Column(Integer, nullable=True)
    created_at = Column(DateTime, default=datetime.utcnow)
    updated_at = Column(DateTime, default=datetime.utcnow, onupdate=datetime.utcnow)
    
    # User preferences for better recommendations
    preferred_categories = Column(JSON, default=lambda: [])  # List of preferred product categories
    budget_range = Column(String, default="medium")  # low, medium, high
    experience_level = Column(String, default="beginner")  # beginner, intermediate, advanced
    preferred_group_sizes = Column(JSON, default=lambda: [])  # List of preferred group sizes [small, medium, large]
    participation_frequency = Column(String, default="occasional")  # occasional, regular, frequent
    
    # Notification preferences
    email_notifications = Column(Boolean, default=True)
    push_notifications = Column(Boolean, default=True) 
    sms_notifications = Column(Boolean, default=False)
    weekly_summary = Column(Boolean, default=True)
    price_alerts_enabled = Column(Boolean, default=False)
    
    # Relationships
    created_groups = relationship("GroupBuy", back_populates="creator", foreign_keys="GroupBuy.creator_id")
    contributions = relationship("Contribution", back_populates="user")
    transactions = relationship("Transaction", back_populates="user")
    chat_messages = relationship("ChatMessage", back_populates="user")
    qr_pickups = relationship("QRCodePickup", back_populates="user")
    admin_group_joins = relationship("AdminGroupJoin", back_populates="user")
    # Recommendation events generated/shown to the user
    recommendation_events = relationship("RecommendationEvent", back_populates="user")
