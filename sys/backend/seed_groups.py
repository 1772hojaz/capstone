#!/usr/bin/env python3
"""
Seed Admin Groups - No users joined by default
"""

from db.database import SessionLocal
from models.models import AdminGroup, Product
from datetime import datetime, timedelta
import json

def seed_groups():
    db = SessionLocal()
    
    try:
        # Get products to create groups for
        products = db.query(Product).filter(Product.is_active == True).limit(12).all()
        
        print("=" * 60)
        print("Creating Admin Groups (No users joined)")
        print("=" * 60)
        
        groups_created = 0
        
        for i, product in enumerate(products):
            # Calculate discount (15-35%)
            discount = 0.15 + (i % 5) * 0.05
            bulk_price = round(product.unit_price * (1 - discount), 2)
            
            # Vary end dates
            days_until_end = 7 + (i * 3) % 21
            
            group = AdminGroup(
                name=f"{product.name} Group Buy",
                description=f"Join this group to get {product.name} at wholesale prices! Save up to {int(discount * 100)}% when we reach our group goal.",
                long_description=f"Premium quality {product.name} from Mbare Musika. Perfect for traders looking to stock up at bulk prices. This group buy allows you to access wholesale pricing without meeting the full MOQ yourself.",
                category=product.category,
                price=bulk_price,
                original_price=product.unit_price,
                image=product.image_url,
                max_participants=30 + (i * 5) % 50,
                participants=0,  # NO users joined by default
                end_date=datetime.utcnow() + timedelta(days=days_until_end),
                admin_name="ConnectAfrica Admin",
                shipping_info="Pickup at Mbare Musika or delivery available",
                estimated_delivery="3-5 days after group completion",
            features=[
                "Wholesale pricing",
                "Quality guaranteed",
                "Flexible quantities",
                f"Save {int(discount * 100)}% off retail"
            ],
            requirements=[
                "Minimum purchase: 5 units",
                "Payment required to join",
                "Valid trader account"
            ],
                is_active=True,
                product_id=product.id,
                product_name=product.name,
                product_description=product.description,
                total_stock=100 + (i * 50),
                manufacturer="Mbare Musika Suppliers",
                pickup_location="Mbare Musika Market, Harare"
            )
            
            db.add(group)
            groups_created += 1
            print(f"  ✅ {product.name} Group Buy - ${bulk_price:.2f} (was ${product.unit_price:.2f}) - {days_until_end} days left")
        
        db.commit()
        
        print("\n" + "=" * 60)
        print(f"✅ Created {groups_created} groups with 0 participants each!")
        print("=" * 60)
        
    except Exception as e:
        print(f"Error: {e}")
        import traceback
        traceback.print_exc()
        db.rollback()
    finally:
        db.close()


if __name__ == "__main__":
    seed_groups()


