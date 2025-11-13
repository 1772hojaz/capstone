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

        # Dynamically lookup correct group information
        group_name = order.group_name or "Unknown Group"
        trader_count = order.trader_count or 0
        delivery_location = order.delivery_location or "TBD"

        if order.group_id:
            # Try to get the group from GroupBuy table
            group = db.query(GroupBuy).filter(GroupBuy.id == order.group_id).first()
            if group:
                group_name = group.name or group.product.name if group.product else "Unknown Group"
                trader_count = len(group.contributions) if group.contributions else 0
                delivery_location = group.location_zone or "TBD"
            else:
                # Try AdminGroup if not found in GroupBuy
                from models.models import AdminGroup
                admin_group = db.query(AdminGroup).filter(AdminGroup.id == order.group_id).first()
                if admin_group:
                    group_name = admin_group.name
                    # For admin groups, count the joins
                    trader_count = len(admin_group.joins) if hasattr(admin_group, 'joins') else 0
                    delivery_location = admin_group.location_zone or "TBD"

        result.append({
            "id": order.id,
            "order_number": order.order_number,
            "group_id": order.group_id,
            "group_name": group_name,
            "trader_count": trader_count,
            "delivery_location": delivery_location,
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

        # Update the corresponding GroupBuy status to "ready_for_payment" for admin processing
        if order.group_id:
            # Try to find and update GroupBuy status
            group_buy = db.query(GroupBuy).filter(GroupBuy.id == order.group_id).first()
            if group_buy:
                group_buy.status = "ready_for_payment"
                print(f"Updated GroupBuy {group_buy.id} status to 'ready_for_payment' after order confirmation")

    elif action == "reject":
        order.status = "rejected"
        # Could store rejection reason if needed

    order.updated_at = datetime.utcnow()
    db.commit()

    return {"message": f"Order {action}ed successfully", "order_id": order_id, "status": order.status}

# Function to create order from completed group
def create_order_from_completed_group(db: Session, group_id: int):
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
    contributions = db.query(Contribution).filter(Contribution.group_buy_id == group_id).all()

    if not contributions:
        return None

    # Calculate totals
    total_value = sum(c.quantity * group.product.bulk_price for c in contributions)
    total_savings = sum(c.quantity * (group.product.unit_price - group.product.bulk_price) for c in contributions)
    trader_count = len(set(c.user_id for c in contributions))

    # Generate unique order number
    order_number = f"ORD-{group_id}-{uuid.uuid4().hex[:8].upper()}"

    # Create order
    order = Order(
        order_number=order_number,
        supplier_id=group.creator_id,  # Group creator is the supplier
        group_id=group.id,
        group_name=group.product.name,
        trader_count=trader_count,
        delivery_location=group.location_zone,
        total_value=total_value,
        total_savings=total_savings,
        status="pending"
    )

    db.add(order)
    db.flush()  # Get the order ID

    # Create order items (grouping by product if needed, but for now assume single product per group)
    order_item = OrderItem(
        order_id=order.id,
        product_name=group.product.name,
        quantity=sum(c.quantity for c in contributions),
        unit_price=group.product.bulk_price,
        total_amount=total_value
    )

    db.add(order_item)
    db.commit()

    return order

# Function to create order from completed admin group
def create_order_from_admin_group(db: Session, group_id: int):
    """Create an order record when an admin group is completed"""

    # Import AdminGroup here to avoid circular imports
    from models.models import AdminGroup, AdminGroupJoin

    # Get the completed admin group
    admin_group = db.query(AdminGroup).filter(AdminGroup.id == group_id).first()
    if not admin_group:
        return None

    # Check if order already exists for this admin group
    existing_order = db.query(Order).filter(Order.group_id == group_id).first()
    if existing_order:
        return existing_order

    # Get all joins for this admin group
    joins = db.query(AdminGroupJoin).filter(AdminGroupJoin.admin_group_id == group_id).all()

    if not joins:
        return None

    # Calculate totals
    total_value = sum(j.quantity * admin_group.price for j in joins)
    total_savings = sum(j.quantity * (admin_group.original_price - admin_group.price) for j in joins)
    trader_count = len(set(j.user_id for j in joins))

    # Generate unique order number
    order_number = f"ADM-{group_id}-{uuid.uuid4().hex[:8].upper()}"

    # For admin groups, determine the supplier
    # If the admin group has a linked product, use that product's supplier
    supplier_id = 1  # Default admin user ID
    if admin_group.product_id:
        from models.models import Product
        product = db.query(Product).filter(Product.id == admin_group.product_id).first()
        if product and product.supplier_id:
            supplier_id = product.supplier_id

    # Create order
    order = Order(
        order_number=order_number,
        supplier_id=supplier_id,  # Admin or designated supplier for admin groups
        group_id=group_id,
        group_name=admin_group.name,
        trader_count=trader_count,
        delivery_location=admin_group.shipping_info or "TBD",
        total_value=total_value,
        total_savings=total_savings,
        status="pending"
    )

    db.add(order)
    db.flush()  # Get the order ID

    # Create order items (single item for admin groups)
    order_item = OrderItem(
        order_id=order.id,
        product_name=admin_group.product_name or admin_group.name,
        quantity=sum(j.quantity for j in joins),
        unit_price=admin_group.price,
        total_amount=total_value
    )

    db.add(order_item)
    db.commit()

    return order