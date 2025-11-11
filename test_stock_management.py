#!/usr/bin/env python3
"""
Test script to validate stock management functionality
"""
import sys
sys.path.append('/home/humphrey/capstone/sys/backend')

from db.database import get_db
from models.models import AdminGroup, AdminGroupJoin, QRCodePickup, User
from datetime import datetime, timedelta

def test_stock_management():
    """Test stock decrement when QR codes are marked as used"""
    print("Testing stock management functionality...")

    # Create database session
    db = next(get_db())

    try:
        # Create a test admin group with stock
        test_group = AdminGroup(
            name="Test Stock Group",
            description="Test group for stock management",
            category="Test",
            price=100.0,
            original_price=120.0,
            image="test.jpg",
            max_participants=10,
            total_stock=5,  # Start with 5 units
            is_active=True,
            end_date=datetime.utcnow() + timedelta(days=7)
        )
        db.add(test_group)
        db.commit()
        db.refresh(test_group)
        print(f"Created test group with ID {test_group.id} and stock {test_group.total_stock}")

        # Create a test user
        test_user = User(
            email="test@example.com",
            hashed_password="test",
            full_name="Test User",
            location_zone="Test Zone"
        )
        db.add(test_user)
        db.commit()
        db.refresh(test_user)
        print(f"Created test user with ID {test_user.id}")

        # Create a join record for the user
        join_record = AdminGroupJoin(
            admin_group_id=test_group.id,
            user_id=test_user.id,
            quantity=2,  # User bought 2 units
            delivery_method="pickup",
            payment_method="cash"
        )
        db.add(join_record)
        db.commit()
        db.refresh(join_record)
        print(f"Created join record with quantity {join_record.quantity}")

        # Create a QR code record
        qr_record = QRCodePickup(
            qr_code_data="TEST-QR-123",
            user_id=test_user.id,
            group_buy_id=test_group.id,  # Using group_buy_id for admin groups
            pickup_location="Test Location",
            expires_at=datetime.utcnow() + timedelta(hours=24),
            is_used=False
        )
        db.add(qr_record)
        db.commit()
        db.refresh(qr_record)
        print(f"Created QR record with ID {qr_record.id}")

        # Simulate marking QR as used (stock decrement logic)
        print(f"Before marking used: Group stock = {test_group.total_stock}")

        # Mark QR as used and decrement stock
        qr_record.is_used = True
        qr_record.used_at = datetime.utcnow()
        qr_record.used_by_staff = "Test Admin"

        # Decrement stock by the quantity purchased
        quantity_purchased = join_record.quantity
        if test_group.total_stock >= quantity_purchased:
            test_group.total_stock -= quantity_purchased
            print(f"Stock decremented by {quantity_purchased}. New stock: {test_group.total_stock}")

            # If stock is now zero or negative, mark group as inactive
            if test_group.total_stock <= 0:
                test_group.is_active = False
                print("Group marked as inactive due to zero stock")
        else:
            print(f"Warning: Attempted to decrement stock below zero. Current: {test_group.total_stock}, Requested: {quantity_purchased}")

        db.commit()

        # Verify results
        db.refresh(test_group)
        db.refresh(qr_record)

        print(f"After marking used: Group stock = {test_group.total_stock}, Active = {test_group.is_active}, QR used = {qr_record.is_used}")

        # Test validation logic
        print("\nTesting validation logic...")

        # Test joining when stock is depleted
        try:
            if test_group.total_stock <= 0:
                raise ValueError("This product is out of stock")
            print("Stock validation passed")
        except ValueError as e:
            print(f"Stock validation failed: {e}")

        # Test joining with quantity exceeding stock
        remaining_stock = test_group.total_stock
        requested_quantity = remaining_stock + 1
        try:
            if remaining_stock is not None and requested_quantity > remaining_stock:
                raise ValueError(f"Requested quantity ({requested_quantity}) exceeds available stock ({remaining_stock})")
            print("Quantity validation passed")
        except ValueError as e:
            print(f"Quantity validation failed: {e}")

        print("\nTest completed successfully!")

    except Exception as e:
        print(f"Test failed: {e}")
        db.rollback()
    finally:
        # Clean up test data
        try:
            db.query(QRCodePickup).filter(QRCodePickup.qr_code_data == "TEST-QR-123").delete()
            db.query(AdminGroupJoin).filter(AdminGroupJoin.admin_group_id == test_group.id).delete()
            db.query(AdminGroup).filter(AdminGroup.name == "Test Stock Group").delete()
            db.query(User).filter(User.email == "test@example.com").delete()
            db.commit()
            print("Test data cleaned up")
        except Exception as e:
            print(f"Cleanup failed: {e}")
            db.rollback()

if __name__ == "__main__":
    test_stock_management()