from sqlalchemy import Column, Integer, String, Float, Boolean, Text, JSON, DateTime
from sqlalchemy.orm import relationship
from datetime import datetime
from db.database import Base

class Product(Base):
    __tablename__ = "products"
    
    id = Column(Integer, primary_key=True, index=True)
    name = Column(String, nullable=False, index=True)
    description = Column(Text)
    image_url = Column(String)
    unit_price = Column(Float, nullable=False)
    bulk_price = Column(Float, nullable=False)
    moq = Column(Integer, nullable=False)  # Minimum Order Quantity
    category = Column(String)
    is_active = Column(Boolean, default=True)
    created_at = Column(DateTime, default=datetime.utcnow)
    
    # Relationships
    group_buys = relationship("GroupBuy", back_populates="product")
    
    @property
    def savings_factor(self):
        """Calculate savings factor: (unit_price - bulk_price) / unit_price"""
        if not self.unit_price:
            return 0
        return (self.unit_price - self.bulk_price) / self.unit_price
