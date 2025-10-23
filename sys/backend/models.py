from sqlalchemy import Column, Integer, String, Float, DateTime, Boolean, ForeignKey, Text, JSON
from sqlalchemy.orm import relationship
from database import Base
from datetime import datetime

class User(Base):
    __tablename__ = "users"
    
    id = Column(Integer, primary_key=True, index=True)
    email = Column(String, unique=True, index=True, nullable=False)
    hashed_password = Column(String, nullable=False)
    full_name = Column(String)
    is_admin = Column(Boolean, default=False)
    location_zone = Column(String, nullable=False)
    cluster_id = Column(Integer, nullable=True)
    
    # User preferences for better recommendations
    preferred_categories = Column(JSON, default=list)  # List of preferred product categories
    budget_range = Column(String, default="medium")  # low, medium, high
    experience_level = Column(String, default="beginner")  # beginner, intermediate, advanced
    preferred_group_sizes = Column(JSON, default=list)  # List of preferred group sizes [small, medium, large]
    participation_frequency = Column(String, default="occasional")  # occasional, regular, frequent
    
    created_at = Column(DateTime, default=datetime.utcnow)
    
    # Relationships
    created_groups = relationship("GroupBuy", back_populates="creator", foreign_keys="GroupBuy.creator_id")
    contributions = relationship("Contribution", back_populates="user")
    transactions = relationship("Transaction", back_populates="user")
    chat_messages = relationship("ChatMessage", back_populates="user")

class Product(Base):
    __tablename__ = "products"
    
    id = Column(Integer, primary_key=True, index=True)
    name = Column(String, nullable=False, index=True)
    description = Column(Text)
    image_url = Column(String)
    unit_price = Column(Float, nullable=False)  # USD
    bulk_price = Column(Float, nullable=False)  # USD
    unit_price_zig = Column(Float)  # ZiG currency
    bulk_price_zig = Column(Float)  # ZiG currency
    moq = Column(Integer, nullable=False)  # Minimum Order Quantity
    category = Column(String)
    is_active = Column(Boolean, default=True)
    created_at = Column(DateTime, default=datetime.utcnow)
    
    # Relationships
    group_buys = relationship("GroupBuy", back_populates="product")
    
    @property
    def savings_factor(self):
        """Calculate savings factor: (unit_price - bulk_price) / unit_price"""
        if self.unit_price > 0:
            return (self.unit_price - self.bulk_price) / self.unit_price
        return 0.0

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
    
    @property
    def moq_progress(self):
        """Calculate progress toward MOQ"""
        if self.product and self.product.moq > 0:
            return (self.total_quantity / self.product.moq) * 100
        return 0.0
    
    @property
    def participants_count(self):
        """Count number of participants"""
        return len(self.contributions)

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

class Transaction(Base):
    __tablename__ = "transactions"
    
    id = Column(Integer, primary_key=True, index=True)
    user_id = Column(Integer, ForeignKey("users.id"), nullable=False)
    group_buy_id = Column(Integer, ForeignKey("group_buys.id"), nullable=True)
    product_id = Column(Integer, ForeignKey("products.id"), nullable=False)
    quantity = Column(Integer, nullable=False)
    amount = Column(Float, nullable=False)
    transaction_type = Column(String)  # upfront, final, refund
    created_at = Column(DateTime, default=datetime.utcnow)
    
    # Relationships
    user = relationship("User", back_populates="transactions")
    
    # Store for ML retraining
    location_zone = Column(String)
    cluster_id = Column(Integer)

class ChatMessage(Base):
    __tablename__ = "chat_messages"
    
    id = Column(Integer, primary_key=True, index=True)
    group_buy_id = Column(Integer, ForeignKey("group_buys.id"), nullable=False)
    user_id = Column(Integer, ForeignKey("users.id"), nullable=False)
    message = Column(Text, nullable=False)
    created_at = Column(DateTime, default=datetime.utcnow)
    
    # Relationships
    group_buy = relationship("GroupBuy", back_populates="chat_messages")
    user = relationship("User", back_populates="chat_messages")

class MLModel(Base):
    __tablename__ = "ml_models"
    
    id = Column(Integer, primary_key=True, index=True)
    model_type = Column(String, nullable=False)  # clustering, recommendation
    model_path = Column(String, nullable=False)
    metrics = Column(JSON)  # Store silhouette score, precision@k, etc.
    trained_at = Column(DateTime, default=datetime.utcnow)
    is_active = Column(Boolean, default=True)

class RecommendationEvent(Base):
    __tablename__ = "recommendation_events"
    
    id = Column(Integer, primary_key=True, index=True)
    user_id = Column(Integer, ForeignKey("users.id"), nullable=False)
    group_buy_id = Column(Integer, ForeignKey("group_buys.id"), nullable=False)
    recommendation_score = Column(Float, nullable=False)
    recommendation_reasons = Column(JSON)  # List of reason strings
    shown_at = Column(DateTime, default=datetime.utcnow, nullable=False)
    clicked = Column(Boolean, default=False)
    clicked_at = Column(DateTime, nullable=True)
    joined = Column(Boolean, default=False)
    joined_at = Column(DateTime, nullable=True)
    
    # Relationships
    user = relationship("User", backref="recommendation_events")
    group_buy = relationship("GroupBuy", backref="recommendation_events")

class AdminGroup(Base):
    __tablename__ = "admin_groups"
    
    id = Column(Integer, primary_key=True, index=True)
    name = Column(String, nullable=False)
    description = Column(Text, nullable=False)
    long_description = Column(Text)
    category = Column(String, nullable=False)
    price = Column(Float, nullable=False)
    original_price = Column(Float, nullable=False)
    image = Column(String, nullable=False)
    max_participants = Column(Integer, default=50)
    participants = Column(Integer, default=0)
    created = Column(DateTime, default=datetime.utcnow)
    end_date = Column(DateTime, nullable=False)
    admin_name = Column(String, default="Admin")
    shipping_info = Column(String, default="Free shipping when group goal is reached")
    estimated_delivery = Column(String, default="2-3 weeks after group completion")
    features = Column(JSON)  # List of feature strings
    requirements = Column(JSON)  # List of requirement strings
    is_active = Column(Boolean, default=True)
    
    @property
    def savings(self):
        return self.original_price - self.price
    
    @property
    def discount_percentage(self):
        if self.original_price > 0:
            return int(((self.original_price - self.price) / self.original_price) * 100)
        return 0

class AdminGroupJoin(Base):
    __tablename__ = "admin_group_joins"
    
    id = Column(Integer, primary_key=True, index=True)
    admin_group_id = Column(Integer, ForeignKey("admin_groups.id"), nullable=False)
    user_id = Column(Integer, ForeignKey("users.id"), nullable=False)
    quantity = Column(Integer, nullable=False, default=1)
    delivery_method = Column(String, nullable=False)  # "pickup" or "delivery"
    payment_method = Column(String, nullable=False)   # "cash" or "card"
    special_instructions = Column(Text, nullable=True)
    joined_at = Column(DateTime, default=datetime.utcnow)
    
    # Relationships
    admin_group = relationship("AdminGroup", backref="joins")
    user = relationship("User", backref="admin_group_joins")

class QRCodePickup(Base):
    __tablename__ = "qr_code_pickups"
    
    id = Column(Integer, primary_key=True, index=True)
    qr_code_data = Column(String, nullable=False, unique=True)  # Encrypted QR code content
    user_id = Column(Integer, ForeignKey("users.id"), nullable=False)
    group_buy_id = Column(Integer, ForeignKey("group_buys.id"), nullable=False)
    pickup_location = Column(String, nullable=False)  # Branch location
    generated_at = Column(DateTime, default=datetime.utcnow)
    expires_at = Column(DateTime, nullable=False)
    is_used = Column(Boolean, default=False)
    used_at = Column(DateTime, nullable=True)
    used_by_staff = Column(String, nullable=True)  # Staff member who scanned
    used_location = Column(String, nullable=True)  # Actual pickup location
    
    # Relationships
    user = relationship("User", backref="qr_pickups")
    group_buy = relationship("GroupBuy", backref="qr_pickups")

class PickupLocation(Base):
    __tablename__ = "pickup_locations"
    
    id = Column(String, primary_key=True)  # Location code like "HARARE_A", "BULAWAYO_B"
    name = Column(String, nullable=False)
    address = Column(Text, nullable=False)
    city = Column(String, nullable=False)
    province = Column(String, nullable=False)
    phone = Column(String, nullable=False)
    operating_hours = Column(String, nullable=False)
    is_active = Column(Boolean, default=True)
    created_at = Column(DateTime, default=datetime.utcnow)

