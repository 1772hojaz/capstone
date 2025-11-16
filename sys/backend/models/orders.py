# Order and OrderItem models for supplier order management
from sqlalchemy import Column, Integer, String, Float, DateTime, Text, ForeignKey, func
from sqlalchemy.orm import relationship
from db.database import Base

class Order(Base):
    __tablename__ = "orders"

    id = Column(Integer, primary_key=True, index=True)
    order_number = Column(String(50), unique=True, index=True, nullable=False)
    supplier_id = Column(Integer, ForeignKey("users.id"), nullable=False)
    group_id = Column(Integer, nullable=True)  # Can reference either group_buys.id or admin_groups.id
    group_type = Column(String(20), nullable=False, default="group_buy")  # "group_buy" or "admin_group"
    group_name = Column(String(255), nullable=False)
    trader_count = Column(Integer, default=0)
    delivery_location = Column(String(255))
    total_value = Column(Float, nullable=False)
    total_savings = Column(Float, default=0.0)
    status = Column(String(50), default="pending")  # pending, confirmed, rejected, completed, cancelled
    delivery_method = Column(String(100))  # pickup, delivery, shipping
    scheduled_delivery_date = Column(DateTime)
    special_instructions = Column(Text)
    created_at = Column(DateTime(timezone=True), server_default=func.now())
    updated_at = Column(DateTime(timezone=True), onupdate=func.now())

    # Relationships
    supplier = relationship("User", back_populates="orders")
    # Note: We can't have direct foreign key relationships to both tables,
    # so we'll handle this in the application logic
    items = relationship("OrderItem", back_populates="order", cascade="all, delete-orphan")

class OrderItem(Base):
    __tablename__ = "order_items"

    id = Column(Integer, primary_key=True, index=True)
    order_id = Column(Integer, ForeignKey("orders.id"), nullable=False)
    product_name = Column(String(255), nullable=False)
    quantity = Column(Integer, nullable=False)
    unit_price = Column(Float, nullable=False)
    total_amount = Column(Float, nullable=False)

    # Relationships
    order = relationship("Order", back_populates="items")