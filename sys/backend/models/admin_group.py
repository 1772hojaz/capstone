from sqlalchemy import Column, Integer, String, Float, DateTime, Boolean, Text, JSON
from sqlalchemy.orm import relationship
from datetime import datetime, timedelta
from db.database import Base

class AdminGroup(Base):
    __tablename__ = "admin_groups"
    
    id = Column(Integer, primary_key=True, index=True)
    
    # Basic information
    name = Column(String, nullable=False)
    description = Column(Text, nullable=False)
    long_description = Column(Text)
    category = Column(String, nullable=False)
    
    # Pricing
    price = Column(Float, nullable=False)
    original_price = Column(Float, nullable=False)
    
    # Media
    image = Column(String, nullable=False)  # URL to the main image
    additional_images = Column(JSON, default=list)  # List of additional image URLs
    
    # Group details
    max_participants = Column(Integer, default=50)
    participants = Column(Integer, default=0)
    created = Column(DateTime, default=datetime.utcnow)
    end_date = Column(DateTime, nullable=False)
    
    # Admin details
    admin_name = Column(String, default="Admin")
    admin_contact = Column(String)
    
    # Shipping and delivery
    shipping_info = Column(String, default="Free shipping when group goal is reached")
    estimated_delivery = Column(String, default="2-3 weeks after group completion")
    
    # Additional details
    features = Column(JSON)  # List of features
    requirements = Column(JSON)  # List of requirements
    
    # Status
    is_active = Column(Boolean, default=True)
    
    # Product details
    product_name = Column(String)
    product_description = Column(Text)
    total_stock = Column(Integer)  # Total available stock
    specifications = Column(Text)  # Product specifications
    manufacturer = Column(String)  # Manufacturer or brand
    
    # Location
    pickup_location = Column(String)  # Primary pickup location
    available_pickup_locations = Column(JSON, default=list)  # List of available pickup location IDs
    
    # Relationships
    joins = relationship("AdminGroupJoin", back_populates="admin_group", cascade="all, delete-orphan")
    
    @property
    def savings(self):
        """Calculate total savings"""
        return self.original_price - self.price if self.original_price > self.price else 0
    
    @property
    def discount_percentage(self):
        """Calculate discount percentage"""
        if not self.original_price:
            return 0
        return int(((self.original_price - self.price) / self.original_price) * 100)
    
    @property
    def days_remaining(self):
        """Calculate days remaining until group buy ends"""
        return (self.end_date - datetime.utcnow()).days if self.end_date > datetime.utcnow() else 0
    
    @property
    def is_available(self):
        """Check if the group buy is still available"""
        return self.is_active and (self.end_date > datetime.utcnow()) and (self.participants < self.max_participants if self.max_participants else True)
