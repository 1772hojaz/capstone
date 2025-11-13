"""
Auto-Complete Groups Worker
Scheduled task to automatically complete groups when MOQ is met and deadline conditions are satisfied
Creates supplier orders when groups transition to completed status
"""

from datetime import datetime
from sqlalchemy.orm import Session
from sqlalchemy import and_

from db.database import SessionLocal
from models.models import GroupBuy, Contribution, SupplierOrder, SupplierOrderItem, SupplierProduct


def check_and_complete_groups():
    """
    Check all active groups and complete them if conditions are met:
    1. MOQ is met (total_quantity >= product.moq)
    2. Either deadline is reached OR MOQ was met before deadline
    3. All contributions are fully paid
    """
    db: Session = SessionLocal()
    try:
        # Get all active groups
        active_groups = db.query(GroupBuy).filter(
            GroupBuy.status == "active"
        ).all()
        
        completed_count = 0
        
        for group in active_groups:
            try:
                # Check if MOQ is met
                if not group.product or group.total_quantity < group.product.moq:
                    continue
                
                # Check if deadline reached OR MOQ met (MOQ met condition is implicit if we're here)
                now = datetime.utcnow()
                moq_met = group.total_quantity >= group.product.moq
                deadline_reached = group.deadline and group.deadline <= now
                
                # Group should complete if: MOQ is met AND (deadline reached OR MOQ just met)
                if not moq_met:
                    continue
                
                # Only auto-complete if deadline reached (for MOQ met before deadline, manual check)
                # OR if MOQ was recently met (you can add time-based logic here)
                if not deadline_reached:
                    # For now, we'll auto-complete when deadline is reached
                    # Groups that meet MOQ before deadline can be manually completed by admin
                    continue
                
                # Check if all contributions are fully paid
                all_paid = all(c.is_fully_paid for c in group.contributions)
                if not all_paid:
                    print(f"Group {group.id}: MOQ met but not all contributions are paid")
                    continue
                
                # Complete the group
                group.status = "completed"
                group.completed_at = datetime.utcnow()
                group.supplier_status = "pending_supplier"
                
                # Create supplier order
                create_supplier_order_for_group(db, group)
                
                db.commit()
                completed_count += 1
                
                print(f"✅ Group {group.id} auto-completed. MOQ: {group.product.moq}, Quantity: {group.total_quantity}")
                
            except Exception as e:
                print(f"Error processing group {group.id}: {e}")
                db.rollback()
                continue
        
        print(f"Auto-complete check completed. {completed_count} groups transitioned to completed status.")
        
    except Exception as e:
        print(f"Error in check_and_complete_groups: {e}")
        db.rollback()
    finally:
        db.close()


def create_supplier_order_for_group(db: Session, group_buy: GroupBuy):
    """
    Create a supplier order when a group is completed
    
    Args:
        db: Database session
        group_buy: GroupBuy that was just completed
    """
    try:
        # Find the supplier for this product
        supplier_product = db.query(SupplierProduct).filter(
            SupplierProduct.product_id == group_buy.product_id,
            SupplierProduct.is_active == True
        ).first()
        
        if not supplier_product:
            print(f"⚠️  No active supplier found for product {group_buy.product_id} in group {group_buy.id}")
            return
        
        # Generate order number
        order_number = f"ORD-{group_buy.id}-{int(datetime.utcnow().timestamp())}"
        
        # Calculate total value
        total_value = group_buy.total_paid
        total_savings = group_buy.total_quantity * (group_buy.product.unit_price - group_buy.product.bulk_price)
        
        # Create supplier order
        supplier_order = SupplierOrder(
            supplier_id=supplier_product.supplier_id,
            group_buy_id=group_buy.id,
            order_number=order_number,
            status="pending",
            total_value=total_value,
            total_savings=total_savings,
            delivery_location=group_buy.location_zone,
            delivery_method="delivery",
            admin_verification_status="pending"
        )
        
        db.add(supplier_order)
        db.flush()  # Get the order ID
        
        # Create order item
        order_item = SupplierOrderItem(
            supplier_order_id=supplier_order.id,
            supplier_product_id=supplier_product.id,
            quantity=group_buy.total_quantity,
            unit_price=group_buy.product.bulk_price,
            total_amount=total_value
        )
        
        db.add(order_item)
        db.commit()
        
        print(f"✅ Created supplier order {order_number} for group {group_buy.id}")
        
        # TODO: Send notification to supplier about new order
        
    except Exception as e:
        print(f"Error creating supplier order for group {group_buy.id}: {e}")
        db.rollback()
        raise


def manually_complete_group(db: Session, group_buy_id: int) -> dict:
    """
    Manually complete a group (can be called by admin)
    Used when MOQ is met before deadline
    
    Args:
        db: Database session
        group_buy_id: Group Buy ID to complete
        
    Returns:
        Success/failure dictionary
    """
    try:
        group = db.query(GroupBuy).filter(GroupBuy.id == group_buy_id).first()
        
        if not group:
            return {"success": False, "message": "Group not found"}
        
        if group.status != "active":
            return {"success": False, "message": f"Group is already {group.status}"}
        
        # Check MOQ
        if group.total_quantity < group.product.moq:
            return {
                "success": False,
                "message": f"MOQ not met. Current: {group.total_quantity}, Required: {group.product.moq}"
            }
        
        # Check if all paid
        all_paid = all(c.is_fully_paid for c in group.contributions)
        if not all_paid:
            return {"success": False, "message": "Not all contributions are fully paid"}
        
        # Complete the group
        group.status = "completed"
        group.completed_at = datetime.utcnow()
        group.supplier_status = "pending_supplier"
        
        # Create supplier order
        create_supplier_order_for_group(db, group)
        
        db.commit()
        
        return {
            "success": True,
            "message": "Group completed successfully",
            "group_id": group.id,
            "supplier_status": "pending_supplier"
        }
        
    except Exception as e:
        db.rollback()
        return {"success": False, "message": str(e)}


if __name__ == "__main__":
    # Run the auto-complete check
    check_and_complete_groups()

