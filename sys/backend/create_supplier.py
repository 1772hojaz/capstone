#!/usr/bin/env python3
"""
Script to create a new supplier user
Usage: python create_supplier.py
"""

import sys
from sqlalchemy.orm import Session
from models.models import User
from db.database import SessionLocal
from authentication.auth import hash_password

def create_supplier(
    email: str,
    password: str,
    full_name: str,
    company_name: str,
    business_address: str,
    phone_number: str,
    location_zone: str = "Harare",
    business_type: str = "retailer",
    business_description: str = "",
    bank_account_name: str = "",
    bank_account_number: str = "",
    bank_name: str = ""
):
    """Create a new supplier user in the database"""
    
    db: Session = SessionLocal()
    
    try:
        # Check if email already exists
        existing_user = db.query(User).filter(User.email == email).first()
        if existing_user:
            print(f"✗ Error: Email {email} is already registered")
            return False
        
        # Check if company name already exists
        existing_company = db.query(User).filter(
            User.company_name == company_name,
            User.is_supplier.is_(True)
        ).first()
        if existing_company:
            print(f"✗ Error: Company name '{company_name}' is already registered")
            return False
        
        # Create new supplier
        new_supplier = User(
            email=email,
            hashed_password=hash_password(password),
            full_name=full_name,
            company_name=company_name,
            business_address=business_address,
            phone_number=phone_number,
            location_zone=location_zone,
            business_type=business_type,
            business_description=business_description,
            bank_account_name=bank_account_name,
            bank_account_number=bank_account_number,
            bank_name=bank_name,
            payment_terms="net_30",
            is_supplier=True,
            is_admin=False,
            is_verified=True,  # Auto-verify for test purposes
            verification_status="verified"
        )
        
        db.add(new_supplier)
        db.commit()
        db.refresh(new_supplier)
        
        print(f"\n✓ Supplier created successfully!")
        print(f"\nDetails:")
        print(f"  Email: {email}")
        print(f"  Password: {password}")
        print(f"  Company: {company_name}")
        print(f"  Location: {location_zone}")
        print(f"\nYou can now login at /supplier/login")
        
        return True
        
    except Exception as e:
        print(f"\n✗ Error creating supplier: {e}")
        db.rollback()
        return False
    finally:
        db.close()


if __name__ == "__main__":
    print("="*60)
    print("CREATE NEW SUPPLIER")
    print("="*60)
    
    # Example usage - modify these values or make it interactive
    supplier_data = {
        "email": "newbusiness@example.co.zw",
        "password": "supplier123",
        "full_name": "Jane Doe",
        "company_name": "New Business Ltd",
        "business_address": "123 Market Street, Harare",
        "phone_number": "+263771234567",
        "location_zone": "Harare",
        "business_type": "wholesaler",
        "business_description": "Quality products supplier",
        "bank_account_name": "New Business Ltd",
        "bank_account_number": "1234567890",
        "bank_name": "Standard Bank"
    }
    
    # Option 1: Use the data above
    # create_supplier(**supplier_data)
    
    # Option 2: Interactive mode
    print("\nEnter supplier details:")
    email = input("Email: ").strip()
    password = input("Password: ").strip()
    full_name = input("Full Name: ").strip()
    company_name = input("Company Name: ").strip()
    business_address = input("Business Address: ").strip()
    phone_number = input("Phone Number: ").strip()
    location_zone = input("Location Zone (default: Harare): ").strip() or "Harare"
    business_type = input("Business Type (retailer/wholesaler/manufacturer): ").strip() or "retailer"
    
    print("\nOptional banking details (press Enter to skip):")
    bank_account_name = input("Bank Account Name: ").strip()
    bank_account_number = input("Bank Account Number: ").strip()
    bank_name = input("Bank Name: ").strip()
    
    create_supplier(
        email=email,
        password=password,
        full_name=full_name,
        company_name=company_name,
        business_address=business_address,
        phone_number=phone_number,
        location_zone=location_zone,
        business_type=business_type,
        business_description=f"{business_type.capitalize()} of quality products",
        bank_account_name=bank_account_name,
        bank_account_number=bank_account_number,
        bank_name=bank_name
    )

