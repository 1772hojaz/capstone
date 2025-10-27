from sqlalchemy import Column, Integer, String, Float, DateTime, ForeignKey, Boolean
from sqlalchemy.orm import relationship
from datetime import datetime, timedelta
from db.database import Base

class GroupBuy(Base):
    __tablename__ = "group_buys"
    
    id = Column(Integer, primary_key=True, index=True)
    product_id = Column(Integer, ForeignKey("products.id"), nullable=False)
    creator_id = Column(Integer, ForeignKey("users.id"), nullable=False)
    location_zone = Column(String, nullable=False)
    deadline = Column(DateTime, nullable=False)
    total_quantity = Column(Integer, default=0)
    total_contributions = Column(Float, default=0.0)
    total_paid = Column(Float, default=0.0)
    status = Column(String, default="active")  # active, completed, cancelled
    created_at = Column(DateTime, default=datetime.utcnow)
    completed_at = Column(DateTime, nullable=True)
    
    # Relationships
    product = relationship("Product", back_populates="group_buys")
    creator = relationship("User", back_populates="created_groups", foreign_keys=[creator_id])
    contributions = relationship("Contribution", back_populates="group_buy", cascade="all, delete-orphan")
    chat_messages = relationship("ChatMessage", back_populates="group_buy", cascade="all, delete-orphan")
    qr_pickups = relationship("QRCodePickup", back_populates="group_buy")
    # Recommendation events related to this group-buy (why it was recommended/shown)
    recommendation_events = relationship("RecommendationEvent", back_populates="group_buy")
    
    @property
    def moq_progress(self):
        """Calculate progress toward MOQ"""
        if not self.product:
            return 0
        return min((self.total_quantity / self.product.moq) * 100, 100)
    
    @property
    def participants_count(self):
        """Count number of participants"""
        return len({c.user_id for c in self.contributions})
