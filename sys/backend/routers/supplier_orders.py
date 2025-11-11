# Supplier Orders API endpoints
from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy.orm import Session
from typing import List, Optional
from datetime import datetime
import uuid

from db.database import get_db
from models.orders import Order, OrderItem
from models.groups import GroupBuy, Contribution
from models.models import User, Transaction, AdminGroup, AdminGroupJoin
from authentication.auth import get_current_user
from payment.flutterwave_service import flutterwave_service

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
        
        # ADDED: Automatic refund trigger when supplier rejects order
        refund_result = None
        if order.group_id:
            try:
                # Get admin user for refund authorization
                admin_user = db.query(User).filter(User.is_admin).first()
                if not admin_user:
                    print("Warning: No admin user found for automatic refund authorization")
                else:
                    refunded = []
                    manual_refund_required = []
                    flutterwave_refunds = []
                    ledger_refunds = []
                    
                    # Try to find as GroupBuy first
                    group_buy = db.query(GroupBuy).filter(GroupBuy.id == order.group_id).first()
                    if group_buy:
                        # Handle GroupBuy refunds
                        contributions = db.query(Contribution).filter(
                            Contribution.group_buy_id == order.group_id
                        ).all()
                        
                        for contribution in contributions:
                            try:
                                refund_amount = contribution.contribution_amount
                                
                                # Try Flutterwave refund first if payment_transaction_id exists
                                flutterwave_success = False
                                if hasattr(contribution, 'payment_transaction_id') and contribution.payment_transaction_id:
                                    try:
                                        flutterwave_result = flutterwave_service.refund_payment(
                                            transaction_id=contribution.payment_transaction_id,
                                            amount=refund_amount
                                        )
                                        
                                        if flutterwave_result.get("status") == "success":
                                            flutterwave_success = True
                                            flutterwave_refunds.append({
                                                "user_id": contribution.user_id,
                                                "quantity": contribution.quantity,
                                                "refund_amount": round(refund_amount, 2),
                                                "transaction_id": contribution.payment_transaction_id
                                            })
                                        else:
                                            print(f"Flutterwave refund failed for contribution {contribution.id}: {flutterwave_result}")
                                    except Exception as fw_e:
                                        print(f"Flutterwave refund error for contribution {contribution.id}: {fw_e}")
                                
                                # If Flutterwave failed or no transaction ID, create ledger refund
                                if not flutterwave_success:
                                    transaction = Transaction(
                                        user_id=contribution.user_id,
                                        group_buy_id=order.group_id,
                                        product_id=group_buy.product_id,
                                        quantity=contribution.quantity,
                                        amount=-1 * round(refund_amount, 2),  # Negative amount for refund
                                        transaction_type="refund",
                                        location_zone=contribution.user.location_zone or "Unknown"
                                    )
                                    db.add(transaction)
                                    ledger_refunds.append({
                                        "user_id": contribution.user_id,
                                        "quantity": contribution.quantity,
                                        "refund_amount": round(refund_amount, 2)
                                    })
                                
                                # Mark contribution as refunded
                                if contribution.is_fully_paid:
                                    contribution.paid_amount = 0.0
                                    contribution.is_fully_paid = False
                                
                                refunded.append({
                                    "user_id": contribution.user_id,
                                    "quantity": contribution.quantity,
                                    "refund_amount": round(refund_amount, 2),
                                    "method": "flutterwave" if flutterwave_success else "ledger"
                                })
                                
                            except Exception as e:
                                print(f"Error refunding contribution {contribution.id}: {e}")
                                manual_refund_required.append({
                                    "user_id": contribution.user_id,
                                    "quantity": contribution.quantity,
                                    "reason": f"Error processing refund: {str(e)}"
                                })
                    else:
                        # Handle AdminGroup refunds
                        admin_group = db.query(AdminGroup).filter(AdminGroup.id == order.group_id).first()
                        if admin_group:
                            joins = db.query(AdminGroupJoin).filter(
                                AdminGroupJoin.admin_group_id == order.group_id
                            ).all()
                            
                            for join in joins:
                                try:
                                    refund_amount = join.quantity * admin_group.price
                                    
                                    # Try Flutterwave refund first if payment_transaction_id exists
                                    flutterwave_success = False
                                    if hasattr(join, 'payment_transaction_id') and join.payment_transaction_id:
                                        try:
                                            flutterwave_result = flutterwave_service.refund_payment(
                                                transaction_id=join.payment_transaction_id,
                                                amount=refund_amount
                                            )
                                            
                                            if flutterwave_result.get("status") == "success":
                                                flutterwave_success = True
                                                flutterwave_refunds.append({
                                                    "user_id": join.user_id,
                                                    "quantity": join.quantity,
                                                    "refund_amount": round(refund_amount, 2),
                                                    "transaction_id": join.payment_transaction_id
                                                })
                                            else:
                                                print(f"Flutterwave refund failed for join {join.id}: {flutterwave_result}")
                                        except Exception as fw_e:
                                            print(f"Flutterwave refund error for join {join.id}: {fw_e}")
                                    
                                    # If Flutterwave failed or no transaction ID, create ledger refund
                                    if not flutterwave_success:
                                        transaction = Transaction(
                                            user_id=join.user_id,
                                            group_buy_id=order.group_id,
                                            product_id=admin_group.product_id,
                                            quantity=join.quantity,
                                            amount=-1 * round(refund_amount, 2),  # Negative amount for refund
                                            transaction_type="refund",
                                            location_zone=join.user.location_zone or "Unknown"
                                        )
                                        db.add(transaction)
                                        ledger_refunds.append({
                                            "user_id": join.user_id,
                                            "quantity": join.quantity,
                                            "refund_amount": round(refund_amount, 2)
                                        })
                                    
                                    # Mark join as refunded
                                    if hasattr(join, 'is_fully_paid') and join.is_fully_paid:
                                        join.paid_amount = 0.0
                                        join.is_fully_paid = False
                                    
                                    refunded.append({
                                        "user_id": join.user_id,
                                        "quantity": join.quantity,
                                        "refund_amount": round(refund_amount, 2),
                                        "method": "flutterwave" if flutterwave_success else "ledger"
                                    })
                                    
                                except Exception as e:
                                    print(f"Error refunding join {join.id}: {e}")
                                    manual_refund_required.append({
                                        "user_id": join.user_id,
                                        "quantity": join.quantity,
                                        "reason": f"Error processing refund: {str(e)}"
                                    })
                    
                    refund_result = {
                        "refunded_count": len(refunded),
                        "refunded": refunded,
                        "flutterwave_refunds": flutterwave_refunds,
                        "ledger_refunds": ledger_refunds,
                        "manual_refund_required": manual_refund_required
                    }
                    
                    print(f"Automatic refunds processed for rejected order {order_id}: {len(refunded)} participants refunded")
                    
            except Exception as e:
                print(f"Error processing automatic refunds for rejected order {order_id}: {e}")
                import traceback
                traceback.print_exc()

    order.updated_at = datetime.utcnow()
    db.commit()

    response = {"message": f"Order {action}ed successfully", "order_id": order_id, "status": order.status}
    if refund_result:
        response["automatic_refund_result"] = refund_result
    
    return response

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
    """Create an order record when an AdminGroup reaches its target participants"""

    # Get the completed admin group
    admin_group = db.query(AdminGroup).filter(AdminGroup.id == group_id).first()
    if not admin_group:
        return None

    # Check if order already exists for this group
    existing_order = db.query(Order).filter(Order.admin_group_id == group_id).first()
    if existing_order:
        return existing_order

    # Get all joins for this admin group
    joins = db.query(AdminGroupJoin).filter(AdminGroupJoin.admin_group_id == group_id).all()

    if not joins:
        return None

    # Calculate totals
    total_value = sum(join.quantity * admin_group.price for join in joins)
    trader_count = len(set(join.user_id for join in joins))

    # Generate unique order number
    order_number = f"ORD-AG-{group_id}-{uuid.uuid4().hex[:8].upper()}"

    # Find the supplier who created this group
    supplier_name = admin_group.admin_name
    supplier = db.query(User).filter(
        User.is_supplier,
        (User.full_name == supplier_name) | (User.company_name == supplier_name) | (User.email == supplier_name)
    ).first()

    if not supplier:
        print(f"Warning: Could not find supplier for admin group {group_id} with name {supplier_name}")
        return None

    # Create order
    order = Order(
        order_number=order_number,
        supplier_id=supplier.id,
        admin_group_id=group_id,
        group_name=admin_group.name,
        trader_count=trader_count,
        delivery_location=admin_group.location_zone or "TBD",
        total_value=total_value,
        total_savings=0.0,  # Admin groups may not have savings calculation
        status="pending"
    )

    db.add(order)
    db.flush()  # Get the order ID

    # Create order items (grouping by product if needed, but for now assume single product per group)
    order_item = OrderItem(
        order_id=order.id,
        product_name=admin_group.name,
        quantity=sum(join.quantity for join in joins),
        unit_price=admin_group.price,
        total_amount=total_value
    )

    db.add(order_item)
    db.commit()

    return order