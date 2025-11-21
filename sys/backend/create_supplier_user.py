#!/usr/bin/env python3
"""
Create a supplier user in the database
"""
from db.database import SessionLocal
from models.models import User
from authentication.auth import hash_password

db = SessionLocal()

print("\n=== Creating Supplier User ===\n")

# Check if supplier already exists
existing = db.query(User).filter(User.email == "supplier@test.com").first()

if existing:
    print(f"❌ Supplier user already exists: {existing.email}")
    print(f"   Role: Supplier={existing.is_supplier}, Admin={existing.is_admin}")
    print("\nTo reset, delete this user first.")
else:
    # Create supplier user
    supplier = User(
        email="supplier@test.com",
        hashed_password=hash_password("supplier123"),
        full_name="Test Supplier",
        is_admin=False,
        is_supplier=True,
        is_active=True,
        location_zone="Mbare",
        
        # Supplier-specific fields
        company_name="Mbare Wholesale Suppliers",
        business_address="123 Market Street, Mbare, Harare",
        phone_number="+263712345678",
        business_type="wholesaler",
        business_description="Wholesale supplier of quality groceries and household items",
        website_url="https://mbarewholesale.co.zw",
        supplier_rating=4.5,
        is_verified=True,
        verification_status="verified",
        
        # Banking information
        bank_account_name="Mbare Wholesale Suppliers",
        bank_account_number="1234567890",
        bank_name="Test Bank",
        payment_terms="net_30"
    )
    
    db.add(supplier)
    db.commit()
    
    print("✅ Supplier user created successfully!")
    print("\n📊 Login Details:")
    print(f"   Email: supplier@test.com")
    print(f"   Password: supplier123")
    print(f"   Company: {supplier.company_name}")
    print(f"   Business Type: {supplier.business_type}")
    print(f"   Verification Status: {supplier.verification_status}")
    print("\n🚀 You can now:")
    print("   1. Login at /supplier/login")
    print("   2. Access supplier dashboard")
    print("   3. Manage orders and products")
    print("   4. View group buy requests")

db.close()
print("\n" + "="*50 + "\n")

