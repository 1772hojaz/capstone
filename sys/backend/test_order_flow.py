#!/usr/bin/env python3
"""Test the admin-supplier order flow"""
import requests
import json

BASE_URL = "http://localhost:8000"

def login(email, password):
    """Login and get token"""
    resp = requests.post(f"{BASE_URL}/api/auth/login", json={
        "email": email,
        "password": password
    })
    if resp.status_code == 200:
        return resp.json().get("access_token")
    print(f"Login failed for {email}: {resp.text}")
    return None

def test_order_flow():
    print("=" * 60)
    print("Testing Admin-Supplier Order Flow")
    print("=" * 60)
    
    # Step 1: Login as admin
    print("\n1. Logging in as admin...")
    admin_token = login("admin@groupbuy.com", "admin123")
    if not admin_token:
        print("   FAIL: Could not login as admin")
        return
    print("   OK: Admin logged in")
    
    # Step 2: Get groups ready for payment
    print("\n2. Getting groups ready for payment...")
    headers = {"Authorization": f"Bearer {admin_token}"}
    resp = requests.get(f"{BASE_URL}/api/admin/groups/ready-for-payment", headers=headers)
    if resp.status_code != 200:
        print(f"   FAIL: {resp.status_code} - {resp.text}")
        return
    groups = resp.json()
    print(f"   OK: Found {len(groups)} groups ready for payment")
    
    if not groups:
        print("   INFO: No groups ready for payment. Testing with first active group...")
        resp = requests.get(f"{BASE_URL}/api/admin/groups/active", headers=headers)
        if resp.status_code == 200:
            groups = resp.json()
            print(f"   OK: Found {len(groups)} active groups")
    
    if not groups:
        print("   INFO: No groups available. Test complete.")
        return
    
    # Step 3: Process payment for first group
    group = groups[0]
    group_id = group.get("id")
    print(f"\n3. Processing payment for group {group_id} ({group.get('name', 'Unknown')})...")
    resp = requests.post(f"{BASE_URL}/api/admin/groups/{group_id}/process-payment", headers=headers)
    print(f"   Response: {resp.status_code}")
    result = resp.json() if resp.status_code in [200, 400, 404] else {"error": resp.text}
    print(f"   Result: {json.dumps(result, indent=2)}")
    
    # Step 4: Check if order was created
    print("\n4. Checking SupplierOrder in database...")
    from db.database import SessionLocal
    from models.models import SupplierOrder
    
    db = SessionLocal()
    order = db.query(SupplierOrder).filter(SupplierOrder.admin_group_id == group_id).first()
    if order:
        print(f"   OK: Order found")
        print(f"      Order ID: {order.id}")
        print(f"      Order Number: {order.order_number}")
        print(f"      Status: {order.status}")
        print(f"      Supplier ID: {order.supplier_id}")
        print(f"      Total Value: ${order.total_value:.2f}")
    else:
        print("   FAIL: No order found for this group")
    db.close()
    
    # Step 5: Login as supplier and check orders
    print("\n5. Logging in as supplier...")
    # Try to find a supplier
    db = SessionLocal()
    from models.models import User
    supplier = db.query(User).filter(User.is_supplier == True).first()
    db.close()
    
    if supplier:
        print(f"   Found supplier: {supplier.email}")
        supplier_token = login(supplier.email, "supplier123")  # Common test password
        if not supplier_token:
            supplier_token = login(supplier.email, "password123")  # Try another
        
        if supplier_token:
            print("   OK: Supplier logged in")
            
            # Step 6: Get supplier orders
            print("\n6. Getting supplier orders...")
            headers = {"Authorization": f"Bearer {supplier_token}"}
            resp = requests.get(f"{BASE_URL}/api/supplier/orders", headers=headers)
            if resp.status_code == 200:
                orders = resp.json()
                print(f"   OK: Found {len(orders)} orders visible to supplier")
                for o in orders[:3]:  # Show first 3
                    print(f"      - {o.get('order_number')}: {o.get('status')} - ${o.get('total_value', 0):.2f}")
            else:
                print(f"   FAIL: {resp.status_code} - {resp.text}")
        else:
            print("   WARN: Could not login as supplier")
    else:
        print("   WARN: No supplier found in database")
    
    print("\n" + "=" * 60)
    print("Test Complete")
    print("=" * 60)

if __name__ == "__main__":
    test_order_flow()

