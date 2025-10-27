from sqlalchemy import Column, Integer, String, Float, DateTime, Text, ForeignKey, Boolean
from sqlalchemy.orm import relationship
from datetime import datetime
from db.database import Base

class AdminGroupJoin(Base):
    __tablename__ = "admin_group_joins"
    
    id = Column(Integer, primary_key=True, index=True)
    admin_group_id = Column(Integer, ForeignKey("admin_groups.id"), nullable=False)
    user_id = Column(Integer, ForeignKey("users.id"), nullable=False)
    
    # Order details
    quantity = Column(Integer, nullable=False, default=1)
    unit_price = Column(Float, nullable=False)
    total_price = Column(Float, nullable=False)
    
    # Delivery information
    delivery_method = Column(String, nullable=False)  # pickup, delivery
    delivery_address = Column(Text, nullable=True)  # Required if delivery_method is 'delivery'
    
    # Payment information
    payment_method = Column(String, nullable=False)
    payment_status = Column(String, default="pending")  # pending, paid, failed, refunded
    payment_reference = Column(String, nullable=True)
    
    # Order status
    status = Column(String, default="pending")  # pending, confirmed, shipped, delivered, cancelled
    tracking_number = Column(String, nullable=True)
    
    # Additional information
    special_instructions = Column(Text, nullable=True)
    is_gift = Column(Boolean, default=False)
    gift_message = Column(Text, nullable=True)
    
    # Timestamps
    joined_at = Column(DateTime, default=datetime.utcnow)
    payment_confirmed_at = Column(DateTime, nullable=True)
    shipped_at = Column(DateTime, nullable=True)
    delivered_at = Column(DateTime, nullable=True)
    
    # Relationships
    admin_group = relationship("AdminGroup", back_populates="joins")
    user = relationship("User", back_populates="admin_group_joins")
    
    @property
    def is_paid(self):
        """Check if the payment is completed"""
        return self.payment_status == "paid"
    
    @property
    def is_delivered(self):
        """Check if the order has been delivered"""
        return self.status == "delivered" and self.delivered_at is not None
    
    @property
    def estimated_delivery_date(self):
        """Calculate estimated delivery date"""
        if not self.admin_group:
            return None
        
        # Simple estimation: 2-3 weeks from order date if not specified
        if self.admin_group.estimated_delivery:
            return self.admin_group.estimated_delivery
        
        return (self.joined_at + timedelta(weeks=3)).strftime("%B %d, %Y")
