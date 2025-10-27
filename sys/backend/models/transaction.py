from sqlalchemy import Column, Integer, Float, String, DateTime, ForeignKey
from sqlalchemy.orm import relationship
from datetime import datetime
from db.database import Base

class Transaction(Base):
    __tablename__ = "transactions"
    
    id = Column(Integer, primary_key=True, index=True)
    user_id = Column(Integer, ForeignKey("users.id"), nullable=False)
    group_buy_id = Column(Integer, ForeignKey("group_buys.id"), nullable=True)
    product_id = Column(Integer, ForeignKey("products.id"), nullable=False)
    quantity = Column(Integer, nullable=False)
    amount = Column(Float, nullable=False)
    transaction_type = Column(String)  # purchase, refund, etc.
    created_at = Column(DateTime, default=datetime.utcnow)
    
    # Location tracking for analytics
    location_zone = Column(String)
    cluster_id = Column(Integer)
    
    # Relationships
    user = relationship("User", back_populates="transactions")
