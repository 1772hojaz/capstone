# Supplier Orders API endpoints
from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy.orm import Session
from typing import List, Optional
from datetime import datetime
import uuid

from db.database import get_db
from models.orders import Order, OrderItem
from models.groups import GroupBuy, Contribution
from models.models import User
from authentication.auth import get_current_user

router = APIRouter()

@router.get("/orders", response_model=List[dict])
async def get_supplier_orders(
    status_filter: Optional[str] = None,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user)
):
    """Get orders for the authenticated supplier"""
    if not current_user.is_supplier:
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail="Only suppliers can access orders"
        )

    query = db.query(Order).filter(Order.supplier_id == current_user.id)

    if status_filter:
        query = query.filter(Order.status == status_filter)

    orders = query.order_by(Order.created_at.desc()).all()

    result = []
    for order in orders:
        # Get order items
        items = []
        for item in order.items:
            items.append({
                "name": item.product_name,
                "quantity": item.quantity,
                "unit_price": item.unit_price,
                "total_amount": item.total_amount
            })

        result.append({
            "id": order.id,
            "order_number": order.order_number,
            "group_id": order.group_id,
            "group_name": order.group_name,
            "trader_count": order.trader_count,
            "delivery_location": order.delivery_location,
            "products": items,
            "total_value": order.total_value,
            "total_savings": order.total_savings,
            "status": order.status,
            "created_at": order.created_at.isoformat() if order.created_at else None
        })

    return result

@router.post("/orders/{order_id}/action")
async def process_order_action(
    order_id: int,
    action_data: dict,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user)
):
    """Process order actions (confirm, reject) with optional delivery scheduling"""
    if not current_user.is_supplier:
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail="Only suppliers can process orders"
        )

    order = db.query(Order).filter(
        Order.id == order_id,
        Order.supplier_id == current_user.id
    ).first()

    if not order:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Order not found"
        )

    action = action_data.get("action")
    if action not in ["confirm", "reject"]:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="Invalid action. Must be 'confirm' or 'reject'"
        )

    if action == "confirm":
        order.status = "confirmed"

        # Handle delivery scheduling if provided
        if "delivery_method" in action_data:
            order.delivery_method = action_data["delivery_method"]
        if "scheduled_delivery_date" in action_data:
            try:
                order.scheduled_delivery_date = datetime.fromisoformat(action_data["scheduled_delivery_date"])
            except ValueError:
                raise HTTPException(
                    status_code=status.HTTP_400_BAD_REQUEST,
                    detail="Invalid delivery date format"
                )
        if "special_instructions" in action_data:
            order.special_instructions = action_data["special_instructions"]

    elif action == "reject":
        order.status = "rejected"
        # Could store rejection reason if needed

    order.updated_at = datetime.utcnow()
    db.commit()

    return {"message": f"Order {action}ed successfully", "order_id": order_id, "status": order.status}

# Function to create order from completed group
async def create_order_from_completed_group(db: Session, group_id: int):
    """Create an order record when a group buy is completed"""

    # Get the completed group
    group = db.query(GroupBuy).filter(GroupBuy.id == group_id).first()
    if not group:
        return None

    # Check if order already exists for this group
    existing_order = db.query(Order).filter(Order.group_id == group_id).first()
    if existing_order:
        return existing_order

    # Get all contributions for this group
    contributions = db.query(Contribution).filter(Contribution.group_id == group_id).all()

    if not contributions:
        return None

    # Calculate totals
    total_value = sum(c.quantity * group.price for c in contributions)
    total_savings = sum(c.quantity * (group.original_price - group.price) for c in contributions)
    trader_count = len(set(c.user_id for c in contributions))

    # Generate unique order number
    order_number = f"ORD-{group_id}-{uuid.uuid4().hex[:8].upper()}"

    # Create order
    order = Order(
        order_number=order_number,
        supplier_id=group.admin_id,  # Assuming admin_id is the supplier
        group_id=group.id,
        group_name=group.name,
        trader_count=trader_count,
        delivery_location=group.pickup_location or "TBD",
        total_value=total_value,
        total_savings=total_savings,
        status="pending"
    )

    db.add(order)
    db.flush()  # Get the order ID

    # Create order items (grouping by product if needed, but for now assume single product per group)
    order_item = OrderItem(
        order_id=order.id,
        product_name=group.product_name or group.name,
        quantity=sum(c.quantity for c in contributions),
        unit_price=group.price,
        total_amount=total_value
    )

    db.add(order_item)
    db.commit()

    return order