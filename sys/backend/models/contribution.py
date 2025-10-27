from sqlalchemy import Column, Integer, Float, Boolean, DateTime, ForeignKey
from sqlalchemy.orm import relationship
from datetime import datetime
from db.database import Base

class Contribution(Base):
    __tablename__ = "contributions"
    
    id = Column(Integer, primary_key=True, index=True)
    group_buy_id = Column(Integer, ForeignKey("group_buys.id"), nullable=False)
    user_id = Column(Integer, ForeignKey("users.id"), nullable=False)
    quantity = Column(Integer, nullable=False)
    contribution_amount = Column(Float, nullable=False)
    paid_amount = Column(Float, default=0.0)
    is_fully_paid = Column(Boolean, default=False)
    joined_at = Column(DateTime, default=datetime.utcnow)
    
    # Relationships
    group_buy = relationship("GroupBuy", back_populates="contributions")
    user = relationship("User", back_populates="contributions")
