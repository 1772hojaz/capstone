from sqlalchemy import Column, Integer, String, DateTime, Boolean, ForeignKey, Text
from sqlalchemy.orm import relationship
from datetime import datetime, timedelta
from db.database import Base

class QRCodePickup(Base):
    __tablename__ = "qr_code_pickups"
    
    id = Column(Integer, primary_key=True, index=True)
    
    # QR Code data
    qr_code_data = Column(String, nullable=False, unique=True)
    qr_code_image_url = Column(String)  # URL to the generated QR code image
    
    # User and group buy references
    user_id = Column(Integer, ForeignKey("users.id"), nullable=False)
    group_buy_id = Column(Integer, ForeignKey("group_buys.id"), nullable=False)
    
    # Pickup information
    pickup_location_id = Column(String, ForeignKey("pickup_locations.id"), nullable=True)
    pickup_location_name = Column(String, nullable=False)
    pickup_instructions = Column(Text, nullable=True)
    
    # Status tracking
    status = Column(String, default="pending")  # pending, ready_for_pickup, picked_up, cancelled
    
    # Timestamps
    generated_at = Column(DateTime, default=datetime.utcnow)
    expires_at = Column(DateTime, nullable=False)  # Default 30 days from generation
    ready_at = Column(DateTime, nullable=True)  # When the order is ready for pickup
    picked_up_at = Column(DateTime, nullable=True)
    
    # Staff verification
    verified_by = Column(String, nullable=True)  # Staff member who verified the pickup
    verification_notes = Column(Text, nullable=True)
    
    # Relationships
    user = relationship("User", back_populates="qr_pickups")
    group_buy = relationship("GroupBuy", back_populates="qr_pickups")
    pickup_location = relationship("PickupLocation", back_populates="qr_pickups")
    
    def __init__(self, **kwargs):
        # Set default expiry to 30 days from now
        if 'expires_at' not in kwargs:
            kwargs['expires_at'] = datetime.utcnow() + timedelta(days=30)
        super().__init__(**kwargs)
    
    @property
    def is_expired(self):
        """Check if the QR code has expired"""
        return datetime.utcnow() > self.expires_at
    
    @property
    def is_valid(self):
        """Check if the QR code is still valid for use"""
        return (
            not self.is_expired and 
            self.status in ["pending", "ready_for_pickup"] and
            (self.group_buy is None or self.group_buy.status == "completed")
        )
    
    @property
    def can_be_used(self):
        """Check if the QR code can be used for pickup"""
        return (
            self.is_valid and 
            self.status == "ready_for_pickup" and
            not self.picked_up_at
        )
    
    def mark_as_picked_up(self, verified_by: str, notes: str = None):
        """Mark the order as picked up"""
        self.status = "picked_up"
        self.picked_up_at = datetime.utcnow()
        self.verified_by = verified_by
        self.verification_notes = notes
