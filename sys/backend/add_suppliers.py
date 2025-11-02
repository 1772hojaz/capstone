#!/usr/bin/env python3
"""
Add sample suppliers to the database
"""

from db.database import SessionLocal
from models.models import User
from authentication.auth import hash_password

def add_suppliers():
    """Add sample suppliers to the database"""

    db = SessionLocal()

    try:
        # Check if suppliers already exist
        existing_suppliers = db.query(User).filter(User.is_supplier == True).count()
        if existing_suppliers > 0:
            print(f"Suppliers already exist: {existing_suppliers}")
            return

        # Sample suppliers
        suppliers_data = [
            {
                "email": "supplier1@mbare.co.zw",
                "password": "supplier123",
                "full_name": "John Supplier",
                "location_zone": "Mbare",
                "company_name": "Mbare Fresh Produce Ltd",
                "business_address": "123 Mbare Market, Harare",
                "tax_id": "SUP001",
                "phone_number": "+263 77 123 4567"
            },
            {
                "email": "supplier2@mbare.co.zw",
                "password": "supplier123",
                "full_name": "Mary Vegetables",
                "location_zone": "Glen View",
                "company_name": "Glen View Organics",
                "business_address": "456 Glen View Road, Harare",
                "tax_id": "SUP002",
                "phone_number": "+263 77 234 5678"
            },
            {
                "email": "supplier3@mbare.co.zw",
                "password": "supplier123",
                "full_name": "David Fruits",
                "location_zone": "Highfield",
                "company_name": "Highfield Fruit Suppliers",
                "business_address": "789 Highfield Shopping Center, Harare",
                "tax_id": "SUP003",
                "phone_number": "+263 77 345 6789"
            }
        ]

        suppliers = []
        for supplier_data in suppliers_data:
            supplier = User(
                email=supplier_data["email"],
                hashed_password=hash_password(supplier_data["password"]),
                full_name=supplier_data["full_name"],
                location_zone=supplier_data["location_zone"],
                is_supplier=True,
                company_name=supplier_data["company_name"],
                business_address=supplier_data["business_address"],
                tax_id=supplier_data["tax_id"],
                phone_number=supplier_data["phone_number"]
            )
            suppliers.append(supplier)
            db.add(supplier)

        db.commit()

        print(f"✅ Created {len(suppliers)} suppliers:")
        for supplier in suppliers:
            print(f"   - {supplier.email} / {suppliers_data[suppliers.index(supplier)]['password']}")

    except Exception as e:
        print(f"Error: {e}")
        db.rollback()
    finally:
        db.close()

if __name__ == "__main__":
    add_suppliers()