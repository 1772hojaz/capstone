from sqlalchemy import Column, Integer, String, Float, DateTime, Boolean, ForeignKey, Text, JSON, Index
from sqlalchemy.orm import relationship
from db.database import Base
from datetime import datetime
from pydantic import BaseModel
from .orders import Order, OrderItem

class User(Base):
    __tablename__ = "users"
    
    id = Column(Integer, primary_key=True, index=True)
    email = Column(String, unique=True, index=True, nullable=False)
    hashed_password = Column(String, nullable=False)
    full_name = Column(String)
    is_admin = Column(Boolean, default=False)
    is_supplier = Column(Boolean, default=False)
    is_active = Column(Boolean, default=True)
    location_zone = Column(String, nullable=False)
    cluster_id = Column(Integer, nullable=True)
    
    # Supplier-specific fields
    company_name = Column(String)
    business_address = Column(Text)
    tax_id = Column(String)
    phone_number = Column(String)
    business_type = Column(String, default="retailer")  # wholesaler, retailer, manufacturer, distributor
    business_description = Column(Text)
    website_url = Column(String)
    supplier_rating = Column(Float, default=0.0)
    total_orders_fulfilled = Column(Integer, default=0)
    is_verified = Column(Boolean, default=False)
    verification_status = Column(String, default="pending")  # pending, submitted, verified, rejected
    
    # Banking information
    bank_account_name = Column(String)
    bank_account_number = Column(String)
    bank_name = Column(String)
    payment_terms = Column(String, default="net_30")  # net_30, net_15, cod, prepaid
    
    # User preferences for better recommendations
    preferred_categories = Column(JSON, default=list)  # List of preferred product categories
    budget_range = Column(String, default="medium")  # low, medium, high
    experience_level = Column(String, default="beginner")  # beginner, intermediate, advanced
    preferred_group_sizes = Column(JSON, default=list)  # List of preferred group sizes [small, medium, large]
    participation_frequency = Column(String, default="occasional")  # occasional, regular, frequent
    
    # Notification preferences
    email_notifications = Column(Boolean, default=True)
    push_notifications = Column(Boolean, default=True) 
    sms_notifications = Column(Boolean, default=False)
    weekly_summary = Column(Boolean, default=True)
    price_alerts_enabled = Column(Boolean, default=False)
    
    # Additional preferences
    show_recommendations = Column(Boolean, default=True)
    auto_join_groups = Column(Boolean, default=True)
    price_alerts = Column(Boolean, default=False)  # Frontend naming compatibility
    
    created_at = Column(DateTime, default=datetime.utcnow)
    
    # Relationships
    created_groups = relationship("GroupBuy", back_populates="creator", foreign_keys="GroupBuy.creator_id")
    contributions = relationship("Contribution", back_populates="user")
    transactions = relationship("Transaction", back_populates="user")
    chat_messages = relationship("ChatMessage", back_populates="user")
    supplier_products = relationship("SupplierProduct", back_populates="supplier")
    supplier_orders = relationship("SupplierOrder", back_populates="supplier")
    orders = relationship("Order", back_populates="supplier")

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
    manufacturer = Column(String, nullable=True)  # Product manufacturer
    total_stock = Column(Integer, nullable=True)  # Total available stock
    is_active = Column(Boolean, default=True)
    created_at = Column(DateTime, default=datetime.utcnow)
    
    # Relationships
    group_buys = relationship("GroupBuy", back_populates="product")
    supplier_products = relationship("SupplierProduct", back_populates="product")
    
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
    
    # Money-based progress tracking (primary display)
    current_amount = Column(Float, default=0.0)  # Total money collected so far
    target_amount = Column(Float, default=0.0)  # Target amount needed
    amount_progress = Column(Float, default=0.0)  # Percentage (0-100)
    
    status = Column(String, default="active")  # active, completed, cancelled
    created_at = Column(DateTime, default=datetime.utcnow)
    completed_at = Column(DateTime, nullable=True)
    
    # Supplier workflow fields
    supplier_status = Column(String, nullable=True)  # pending_supplier, supplier_accepted, supplier_rejected, ready_for_collection, collected
    supplier_response_at = Column(DateTime, nullable=True)
    ready_for_collection_at = Column(DateTime, nullable=True)
    supplier_notes = Column(Text, nullable=True)
    
    # Relationships
    product = relationship("Product", back_populates="group_buys")
    creator = relationship("User", back_populates="created_groups", foreign_keys=[creator_id])
    contributions = relationship("Contribution", back_populates="group_buy", cascade="all, delete-orphan")
    chat_messages = relationship("ChatMessage", back_populates="group_buy", cascade="all, delete-orphan")
    orders = relationship("Order", back_populates="group")
    
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
    
    __table_args__ = (
        Index("idx_group_buys_status_deadline", "status", "deadline"),
        Index("idx_group_buys_location_status", "location_zone", "status"),
        Index("idx_group_buys_product", "product_id"),
        Index("idx_group_buys_creator", "creator_id"),
        Index("idx_group_buys_amount_progress", "amount_progress"),
    )

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
    
    # Collection and refund tracking
    is_collected = Column(Boolean, default=False)
    collected_at = Column(DateTime, nullable=True)
    qr_code_token = Column(String, nullable=True)  # Unique token for QR verification
    refund_status = Column(String, nullable=True)  # pending, completed, failed
    refunded_at = Column(DateTime, nullable=True)
    
    # Relationships
    group_buy = relationship("GroupBuy", back_populates="contributions")
    user = relationship("User", back_populates="contributions")
    
    __table_args__ = (
        Index("idx_contributions_user_group", "user_id", "group_buy_id"),
        Index("idx_contributions_group_joined", "group_buy_id", "joined_at"),
    )

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
    
    __table_args__ = (
        Index("idx_transactions_user_created", "user_id", "created_at"),
        Index("idx_transactions_product_created", "product_id", "created_at"),
        Index("idx_transactions_group_created", "group_buy_id", "created_at"),
    )

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
    supplier_id = Column(Integer, ForeignKey("users.id"), nullable=True)  # Track who created this group
    shipping_info = Column(String, default="Free shipping when group goal is reached")
    estimated_delivery = Column(String, default="2-3 weeks after group completion")
    features = Column(JSON)  # List of feature strings
    requirements = Column(JSON)  # List of requirement strings
    is_active = Column(Boolean, default=True)
    
    # Link to supplier's product if provided
    product_id = Column(Integer, ForeignKey("products.id"), nullable=True)
    
    # Additional product fields
    product_name = Column(String)
    product_description = Column(Text)
    total_stock = Column(Integer)
    specifications = Column(Text)
    manufacturer = Column(String)
    pickup_location = Column(String)
    
    @property
    def savings(self):
        return self.original_price - self.price
    
    @property
    def discount_percentage(self):
        if self.original_price > 0:
            return int(((self.original_price - self.price) / self.original_price) * 100)
        return 0

    # Relationships
    joins = relationship("AdminGroupJoin", back_populates="admin_group", cascade="all, delete-orphan")
    supplier_orders = relationship("SupplierOrder", backref="admin_group")
    product = relationship("Product", backref="admin_groups")
    performance_metrics = relationship("GroupPerformanceMetrics", back_populates="admin_group", cascade="all, delete-orphan", uselist=False, passive_deletes=True)
    user_interactions = relationship("UserGroupInteractionMatrix", back_populates="admin_group", cascade="all, delete-orphan", passive_deletes=True)

class AdminGroupJoin(Base):
    __tablename__ = "admin_group_joins"
    
    id = Column(Integer, primary_key=True, index=True)
    admin_group_id = Column(Integer, ForeignKey("admin_groups.id"), nullable=False)
    user_id = Column(Integer, ForeignKey("users.id"), nullable=False)
    quantity = Column(Integer, nullable=False, default=1)
    delivery_method = Column(String, nullable=False)  # "pickup" or "delivery"
    payment_method = Column(String, nullable=False)   # "cash" or "card"
    special_instructions = Column(Text, nullable=True)
    payment_transaction_id = Column(String, nullable=True)  # For card payments
    payment_reference = Column(String, nullable=True)       # For card payments
    paid_amount = Column(Float, nullable=True)              # Amount paid for this join
    joined_at = Column(DateTime, default=datetime.utcnow)
    
    # Relationships
    admin_group = relationship("AdminGroup", back_populates="joins")
    user = relationship("User", backref="admin_group_joins")

class QRCodePickup(Base):
    __tablename__ = "qr_code_pickups"
    
    id = Column(Integer, primary_key=True, index=True)
    qr_code_data = Column(String, nullable=False, unique=True)  # QR ID for trader codes, encrypted data for admin codes
    user_id = Column(Integer, ForeignKey("users.id"), nullable=False)
    group_buy_id = Column(Integer, ForeignKey("group_buys.id"), nullable=True)  # Nullable for admin groups
    pickup_location = Column(String, nullable=False)  # Branch location or encrypted data for trader codes
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

class SupplierProduct(Base):
    __tablename__ = "supplier_products"
    
    id = Column(Integer, primary_key=True, index=True)
    supplier_id = Column(Integer, ForeignKey("users.id"), nullable=False)
    product_id = Column(Integer, ForeignKey("products.id"), nullable=False)
    sku = Column(String, nullable=False)
    stock_level = Column(Integer, default=0)
    min_bulk_quantity = Column(Integer, default=1)
    is_active = Column(Boolean, default=True)
    created_at = Column(DateTime, default=datetime.utcnow)
    
    # Relationships
    supplier = relationship("User", back_populates="supplier_products")
    product = relationship("Product", back_populates="supplier_products")
    pricing_tiers = relationship("ProductPricingTier", back_populates="supplier_product", cascade="all, delete-orphan")

class ProductPricingTier(Base):
    __tablename__ = "product_pricing_tiers"
    
    id = Column(Integer, primary_key=True, index=True)
    supplier_product_id = Column(Integer, ForeignKey("supplier_products.id"), nullable=False)
    min_quantity = Column(Integer, nullable=False)
    max_quantity = Column(Integer, nullable=True)  # Null means unlimited
    unit_price = Column(Float, nullable=False)
    description = Column(String)
    created_at = Column(DateTime, default=datetime.utcnow)
    
    # Relationships
    supplier_product = relationship("SupplierProduct", back_populates="pricing_tiers")

class SupplierOrder(Base):
    __tablename__ = "supplier_orders"
    
    id = Column(Integer, primary_key=True, index=True)
    supplier_id = Column(Integer, ForeignKey("users.id"), nullable=False)
    group_buy_id = Column(Integer, ForeignKey("group_buys.id"), nullable=True)  # Link to group buy
    admin_group_id = Column(Integer, ForeignKey("admin_groups.id"), nullable=True)  # Link to admin group
    order_number = Column(String, unique=True, nullable=False)
    status = Column(String, default="pending")  # pending, confirmed, rejected, shipped, delivered
    total_value = Column(Float, nullable=False)
    total_savings = Column(Float, default=0.0)
    delivery_method = Column(String)  # delivery, pickup
    delivery_location = Column(String)
    scheduled_delivery_date = Column(DateTime, nullable=True)
    special_instructions = Column(Text)
    rejection_reason = Column(Text)
    created_at = Column(DateTime, default=datetime.utcnow)
    confirmed_at = Column(DateTime, nullable=True)
    shipped_at = Column(DateTime, nullable=True)
    delivered_at = Column(DateTime, nullable=True)
    
    # Admin verification fields
    admin_verification_status = Column(String, default="pending")  # pending, verified, rejected
    admin_verified_at = Column(DateTime, nullable=True)
    qr_codes_generated = Column(Boolean, default=False)
    
    # Relationships
    supplier = relationship("User", back_populates="supplier_orders")
    order_items = relationship("SupplierOrderItem", back_populates="supplier_order", cascade="all, delete-orphan")

class SupplierOrderItem(Base):
    __tablename__ = "supplier_order_items"
    
    id = Column(Integer, primary_key=True, index=True)
    supplier_order_id = Column(Integer, ForeignKey("supplier_orders.id"), nullable=False)
    supplier_product_id = Column(Integer, ForeignKey("supplier_products.id"), nullable=False)
    quantity = Column(Integer, nullable=False)
    unit_price = Column(Float, nullable=False)
    total_amount = Column(Float, nullable=False)
    
    # Relationships
    supplier_order = relationship("SupplierOrder", back_populates="order_items")
    supplier_product = relationship("SupplierProduct", backref="order_items")

class SupplierPickupLocation(Base):
    __tablename__ = "supplier_pickup_locations"
    
    id = Column(Integer, primary_key=True, index=True)
    supplier_id = Column(Integer, ForeignKey("users.id"), nullable=False)
    name = Column(String, nullable=False)
    address = Column(Text, nullable=False)
    city = Column(String, nullable=False)
    province = Column(String, nullable=False)
    phone = Column(String, nullable=False)
    operating_hours = Column(String, nullable=False)
    is_active = Column(Boolean, default=True)
    created_at = Column(DateTime, default=datetime.utcnow)
    
    # Relationships
    supplier = relationship("User", backref="pickup_locations")

class SupplierInvoice(Base):
    __tablename__ = "supplier_invoices"
    
    id = Column(Integer, primary_key=True, index=True)
    supplier_id = Column(Integer, ForeignKey("users.id"), nullable=False)
    order_id = Column(Integer, ForeignKey("supplier_orders.id"), nullable=False)
    invoice_number = Column(String, unique=True, nullable=False)
    amount = Column(Float, nullable=False)
    tax_amount = Column(Float, default=0.0)
    total_amount = Column(Float, nullable=False)
    status = Column(String, default="unpaid")  # unpaid, paid, overdue
    due_date = Column(DateTime, nullable=False)
    paid_at = Column(DateTime, nullable=True)
    pdf_url = Column(String)
    created_at = Column(DateTime, default=datetime.utcnow)
    
    # Relationships
    supplier = relationship("User", backref="invoices")
    order = relationship("SupplierOrder", backref="invoice")

class SupplierPayment(Base):
    __tablename__ = "supplier_payments"
    
    id = Column(Integer, primary_key=True, index=True)
    supplier_id = Column(Integer, ForeignKey("users.id"), nullable=False)
    order_id = Column(Integer, ForeignKey("supplier_orders.id"), nullable=True)  # Link to order
    amount = Column(Float, nullable=False)
    platform_fee = Column(Float, nullable=True)  # Platform fee deducted
    payment_method = Column(String, nullable=False)  # bank_transfer, mobile_money, cash
    reference_number = Column(String)
    transfer_id = Column(String, nullable=True)  # Flutterwave transfer ID
    transfer_reference = Column(String, nullable=True)  # Transfer reference
    status = Column(String, default="pending")  # pending, completed, failed
    processed_at = Column(DateTime, nullable=True)
    created_at = Column(DateTime, default=datetime.utcnow)
    
    # Relationships
    supplier = relationship("User", backref="payments")

class SupplierNotification(Base):
    __tablename__ = "supplier_notifications"
    
    id = Column(Integer, primary_key=True, index=True)
    supplier_id = Column(Integer, ForeignKey("users.id"), nullable=False)
    title = Column(String, nullable=False)
    message = Column(Text, nullable=False)
    type = Column(String, nullable=False)  # order, payment, system
    is_read = Column(Boolean, default=False)
    created_at = Column(DateTime, default=datetime.utcnow)
    
    # Relationships
    supplier = relationship("User", backref="notifications")

class QRScanHistory(Base):
    __tablename__ = "qr_scan_history"
    
    id = Column(Integer, primary_key=True, index=True)
    qr_code_data = Column(String, nullable=False)
    scanned_by_user_id = Column(Integer, ForeignKey("users.id"), nullable=True)  # Admin who scanned
    scanned_user_id = Column(Integer, ForeignKey("users.id"), nullable=False)   # User whose QR was scanned
    group_buy_id = Column(Integer, ForeignKey("group_buys.id"), nullable=True)
    product_id = Column(Integer, ForeignKey("products.id"), nullable=False)
    quantity = Column(Integer, nullable=False)
    amount = Column(Float, nullable=False)
    scanned_at = Column(DateTime, default=datetime.utcnow)
    pickup_location = Column(String, nullable=True)
    scan_result = Column(JSON)  # Store the full scan result for reference
    
    # Relationships
    scanned_by_user = relationship("User", foreign_keys=[scanned_by_user_id], backref="admin_scans")
    scanned_user = relationship("User", foreign_keys=[scanned_user_id], backref="qr_scans")
    group_buy = relationship("GroupBuy", backref="scan_history")
    product = relationship("Product", backref="scan_history")

# UserBehaviorFeatures moved to analytics_models.py to avoid duplication
# Import from there if needed: from models.analytics_models import UserBehaviorFeatures

class BenchmarkResult(Base):
    """Store ML model benchmark evaluation results"""
    __tablename__ = "benchmark_results"
    
    id = Column(Integer, primary_key=True, index=True)
    model_name = Column(String, index=True, nullable=False)  # "hybrid", "random", "popularity", etc.
    precision_at_5 = Column(Float, nullable=False)
    precision_at_10 = Column(Float, nullable=False)
    recall_at_5 = Column(Float, nullable=False)
    recall_at_10 = Column(Float, nullable=False)
    ndcg_at_5 = Column(Float, nullable=False)
    ndcg_at_10 = Column(Float, nullable=False)
    map_score = Column(Float, nullable=False)  # Mean Average Precision
    hit_rate = Column(Float, nullable=False)
    coverage = Column(Float, nullable=False)
    test_set_size = Column(Integer, nullable=False)
    evaluation_time = Column(Float, default=0.0)  # seconds
    run_at = Column(DateTime, default=datetime.utcnow, index=True)
    notes = Column(Text, nullable=True)
    
    __table_args__ = (
        Index("idx_benchmark_model_rundate", "model_name", "run_at"),
    )


# Pydantic models for API responses
class QRCodeGenerateRequest(BaseModel):
    user_id: int
    group_buy_id: int
    validity_days: int = 30
    pickup_location: str

class QRCodeGenerateResponse(BaseModel):
    qr_code_data: str
    expires_at: datetime
    message: str

class QRCodeScanResponse(BaseModel):
    user_info: dict
    product_info: dict
    purchase_info: dict
    qr_status: dict

class UserProductPurchaseInfo(BaseModel):
    user_id: int
    email: str
    full_name: str
    product_id: int
    product_name: str
    quantity_purchased: int
    total_amount: float
    purchase_date: datetime
    pickup_location: str

# Import analytics models after all base models are defined to avoid circular dependencies
try:
    from models.analytics_models import GroupPerformanceMetrics, UserGroupInteractionMatrix
except ImportError:
    # Analytics models may not be available in all configurations
    pass

