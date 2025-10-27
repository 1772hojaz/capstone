from sqlalchemy import Column, String, Text, Boolean, DateTime, ForeignKey, Float, Integer
from sqlalchemy.orm import relationship
from datetime import datetime
from db.database import Base

class PickupLocation(Base):
    __tablename__ = "pickup_locations"
    
    # Using string ID for easier reference (e.g., 'store-001')
    id = Column(String, primary_key=True, index=True)
    
    # Location details
    name = Column(String, nullable=False)
    description = Column(Text)
    address = Column(Text, nullable=False)
    city = Column(String, nullable=False)
    province = Column(String, nullable=False)
    postal_code = Column(String)
    country = Column(String, default="Zimbabwe")
    
    # Contact information
    phone = Column(String, nullable=False)
    email = Column(String)
    contact_person = Column(String)
    
    # Operating hours (stored as JSON for flexibility)
    # Example: {"monday": "09:00-17:00", "tuesday": "09:00-17:00", ...}
    operating_hours = Column(String, nullable=False)
    
    # Location coordinates (for mapping)
    latitude = Column(Float, nullable=True)
    longitude = Column(Float, nullable=True)
    
    # Additional information
    facilities = Column(Text)  # Available facilities (e.g., parking, wheelchair access)
    notes = Column(Text)  # Any additional notes or special instructions
    
    # Status
    is_active = Column(Boolean, default=True)
    is_primary = Column(Boolean, default=False)  # Primary/default pickup location
    
    # Timestamps
    created_at = Column(DateTime, default=datetime.utcnow)
    updated_at = Column(DateTime, default=datetime.utcnow, onupdate=datetime.utcnow)
    
    # Relationships
    qr_pickups = relationship("QRCodePickup", back_populates="pickup_location")
    
    @property
    def full_address(self):
        """Get the full formatted address"""
        parts = [
            self.address,
            self.city,
            self.province,
            self.postal_code,
            self.country
        ]
        return ", ".join(filter(None, parts))
    
    @property
    def coordinates(self):
        """Get coordinates as a tuple (latitude, longitude)"""
        if self.latitude is not None and self.longitude is not None:
            return (self.latitude, self.longitude)
        return None
    
    @property
    def operating_hours_dict(self):
        """Parse operating hours from string to dictionary"""
        try:
            # Assuming operating_hours is stored as a JSON string
            import json
            return json.loads(self.operating_hours)
        except:
            return {}
    
    @property
    def is_open_now(self):
        """Check if the location is currently open based on operating hours"""
        try:
            import pytz
            from datetime import datetime
            
            # Get current time in the location's timezone (assuming Harare time for Zimbabwe)
            tz = pytz.timezone('Africa/Harare')
            now = datetime.now(tz)
            day_name = now.strftime("%A").lower()  # e.g., 'monday'
            
            # Get operating hours for today
            hours = self.operating_hours_dict.get(day_name, "")
            if not hours or hours.lower() == 'closed':
                return False
                
            # Parse opening and closing times
            open_time_str, close_time_str = hours.split('-')
            open_time = datetime.strptime(open_time_str.strip(), "%H:%M").time()
            close_time = datetime.strptime(close_time_str.strip(), "%H:%M").time()
            
            # Convert current time to time object for comparison
            current_time = now.time()
            
            return open_time <= current_time <= close_time
            
        except Exception as e:
            # If there's any error in the check, default to returning the active status
            return self.is_active
