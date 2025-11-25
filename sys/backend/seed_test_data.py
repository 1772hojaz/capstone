#!/usr/bin/env python3
"""
Seed test data for payment testing
"""
import sys
from datetime import datetime, timedelta
from sqlalchemy.orm import Session
from db.database import SessionLocal, engine
from models.models import User, Product, AdminGroup, GroupBuy
from authentication.auth import hash_password

def seed_test_data():
    """Create test users, products, and groups"""
    db = SessionLocal()
    
    try:
        print("\n🌱 Seeding test data...\n")
        
        # ============================================
        # 1. GET OR CREATE USERS
        # ============================================
        print("👥 Checking users...")
        
        # Get or create admin user
        admin = db.query(User).filter(User.email == "admin@test.com").first()
        if not admin:
            admin = User(
                email="admin@test.com",
                hashed_password=hash_password("admin123"),
                full_name="Admin User",
                is_admin=True,
                is_supplier=False,
                location_zone="Harare CBD",
                is_active=True
            )
            db.add(admin)
            db.commit()
            print("   ✅ Created admin user")
        else:
            print("   ✓ Admin user already exists")
        
        # Get or create trader users
        traders = []
        trader_data = [
            ("trader1@test.com", "John", "Doe"),
            ("trader2@test.com", "Jane", "Smith"),
            ("trader3@test.com", "Bob", "Johnson"),
            ("trader4@test.com", "Alice", "Williams"),
            ("trader5@test.com", "Charlie", "Brown"),
        ]
        
        for email, first_name, last_name in trader_data:
            trader = db.query(User).filter(User.email == email).first()
            if not trader:
                trader = User(
                    email=email,
                    hashed_password=hash_password("trader123"),
                    full_name=f"{first_name} {last_name}",
                    is_admin=False,
                    is_supplier=False,
                    location_zone="Mbare",
                    is_active=True
                )
                db.add(trader)
            traders.append(trader)
        
        db.commit()
        print(f"   ✅ Ready: 1 admin + {len(traders)} traders")
        
        # ============================================
        # 2. CREATE PRODUCTS
        # ============================================
        print("\n📦 Creating products...")
        
        products_data = [
            ("Cerevita 500g", "Nutritious cereal for the whole family", 5.00, 4.00, "Groceries", "https://images.unsplash.com/photo-1525385133512-2f3bdd039054?w=500&h=500&fit=crop"),
            ("Rice 5kg Pack", "Premium white rice - perfect for daily meals", 15.00, 12.00, "Groceries", "https://images.unsplash.com/photo-1586201375761-83865001e31c?w=500&h=500&fit=crop"),
            ("Cooking Oil 2L", "Pure vegetable oil for healthy cooking", 8.00, 6.50, "Groceries", "https://images.unsplash.com/photo-1474979266404-7eaacbcd87c5?w=500&h=500&fit=crop"),
            ("Sugar 2kg", "White refined sugar for baking and beverages", 4.00, 3.20, "Groceries", "https://images.unsplash.com/photo-1514680708538-9f69490c8815?w=500&h=500&fit=crop"),
            ("Flour 10kg", "All-purpose flour for all your baking needs", 12.00, 9.50, "Groceries", "https://images.unsplash.com/photo-1628288896721-3b0b031c5b49?w=500&h=500&fit=crop"),
            ("Beans 2kg", "Dried beans - protein-rich and nutritious", 6.00, 4.80, "Groceries", "https://images.unsplash.com/photo-1589894404039-acf46fd3452a?w=500&h=500&fit=crop"),
            ("Pasta 500g", "Italian-style pasta for delicious meals", 3.50, 2.80, "Groceries", "https://images.unsplash.com/photo-1551462147-ff29053bfc14?w=500&h=500&fit=crop"),
            ("Tomato Sauce 500ml", "Rich tomato sauce for your favorite dishes", 2.50, 2.00, "Groceries", "https://images.unsplash.com/photo-1572453800999-e8d2d1589b7c?w=500&h=500&fit=crop"),
            ("Milk Powder 1kg", "Full cream milk powder - instant and creamy", 10.00, 8.00, "Dairy", "https://images.unsplash.com/photo-1563636619-e9143da7973b?w=500&h=500&fit=crop"),
            ("Coffee 250g", "Premium ground coffee for the perfect brew", 7.00, 5.50, "Beverages", "https://images.unsplash.com/photo-1511920170033-f8396924c348?w=500&h=500&fit=crop"),
            ("Tea Bags 100pk", "Quality tea bags for your daily tea time", 4.50, 3.60, "Beverages", "https://images.unsplash.com/photo-1564890369478-c89ca6d9cda9?w=500&h=500&fit=crop"),
            ("Canned Tomatoes 400g", "Fresh canned tomatoes for sauces", 2.00, 1.60, "Groceries", "https://images.unsplash.com/photo-1592804838732-d429c26c2db9?w=500&h=500&fit=crop"),
            ("Chicken Seasoning 100g", "Flavorful chicken seasoning blend", 3.00, 2.40, "Spices", "https://images.unsplash.com/photo-1596040033229-a0b73b5c3c2c?w=500&h=500&fit=crop"),
            ("Salt 1kg", "Iodized table salt for daily use", 1.50, 1.20, "Spices", "https://images.unsplash.com/photo-1588166524941-3bf61a9c41db?w=500&h=500&fit=crop"),
            ("Washing Powder 2kg", "Powerful cleaning for bright whites", 6.50, 5.20, "Household", "https://images.unsplash.com/photo-1610557892470-55d9e80c0bce?w=500&h=500&fit=crop"),
        ]
        
        products = []
        for name, desc, regular, bulk, category, image in products_data:
            product = Product(
                name=name,
                description=desc,
                unit_price=regular,
                bulk_price=bulk,
                category=category,
                image_url=image,
                total_stock=100,
                moq=5,
                is_active=True
            )
            db.add(product)
            products.append(product)
        
        db.commit()
        print(f"   ✅ Created {len(products)} products")
        
        # ============================================
        # 3. CREATE ADMIN GROUPS
        # ============================================
        print("\n🏪 Creating admin groups...")
        
        admin_groups_data = [
            ("Cerevita Special Deal", products_data[0][0], products_data[0][2], products_data[0][3], 10, 2),
            ("Rice Bulk Buy", products_data[1][0], products_data[1][2], products_data[1][3], 20, 8),
            ("Cooking Oil Mega Deal", products_data[2][0], products_data[2][2], products_data[2][3], 15, 12),
            ("Sugar Value Pack", products_data[3][0], products_data[3][2], products_data[3][3], 12, 3),
            ("Flour Wholesale", products_data[4][0], products_data[4][2], products_data[4][3], 10, 0),
            ("Beans Bulk Order", products_data[5][0], products_data[5][2], products_data[5][3], 18, 5),
            ("Pasta Party Pack", products_data[6][0], products_data[6][2], products_data[6][3], 25, 15),
            ("Milk Powder Special", products_data[8][0], products_data[8][2], products_data[8][3], 12, 4),
            ("Coffee Lover's Deal", products_data[9][0], products_data[9][2], products_data[9][3], 8, 6),
            ("Tea Bulk Buy", products_data[10][0], products_data[10][2], products_data[10][3], 20, 1),
        ]
        
        for i, (title, product_name, regular, bulk, max_part, current_part) in enumerate(admin_groups_data):
            # Find matching product
            product = next((p for p in products if product_name in p.name), products[i])
            
            admin_group = AdminGroup(
                name=title,
                description=f"Great deal on {product_name}",
                category=product.category,
                product_id=product.id,
                price=bulk,
                original_price=regular,
                max_participants=max_part,
                participants=current_part,
                end_date=datetime.utcnow() + timedelta(days=7),
                image=product.image_url,
                is_active=True,
                supplier_id=admin.id
            )
            db.add(admin_group)
        
        db.commit()
        print(f"   ✅ Created {len(admin_groups_data)} admin groups")
        
        # ============================================
        # 4. CREATE GROUP BUYS (Community-created)
        # ============================================
        print("\n🤝 Creating community group buys...")
        
        # Create 5 community group buys
        community_groups_data = [
            (9, traders[0].id, "Mbare", 5, 27.50, 55.00),  # Coffee
            (6, traders[1].id, "Glen Norah", 10, 8.40, 42.00),  # Pasta
            (11, traders[2].id, "Harare CBD", 7, 6.40, 32.00),  # Canned Tomatoes
            (13, traders[3].id, "Highfield", 12, 3.60, 12.00),  # Salt
            (14, traders[4].id, "Mbare", 8, 15.60, 52.00),  # Washing Powder
        ]
        
        for product_idx, creator_id, zone, days, current, target in community_groups_data:
            gb = GroupBuy(
                product_id=products[product_idx].id,
                creator_id=creator_id,
                location_zone=zone,
                deadline=datetime.utcnow() + timedelta(days=days),
                current_amount=current,
                target_amount=target,
                amount_progress=(current / target * 100) if target > 0 else 0,
                status="active"
            )
            db.add(gb)
        
        db.commit()
        print(f"   ✅ Created {len(community_groups_data)} community group buys")
        
        # ============================================
        # SUMMARY
        # ============================================
        print("\n" + "="*60)
        print("✅ TEST DATA CREATED SUCCESSFULLY!")
        print("="*60)
        print("\n📊 Summary:")
        print(f"   👤 Admin: admin@test.com / admin123")
        print(f"   👥 Traders: trader1@test.com - trader5@test.com / trader123")
        print(f"   📦 Products: {len(products)} (with images)")
        print(f"   🏪 Admin Groups: {len(admin_groups_data)}")
        print(f"   🤝 Community Group Buys: {len(community_groups_data)}")
        print("\n🚀 You can now:")
        print("   1. Login as admin or trader")
        print("   2. Browse available groups")
        print("   3. Test joining groups with payment")
        print("   4. View recommendations on trader dashboard")
        print("="*60 + "\n")
        
    except Exception as e:
        print(f"\n❌ Error seeding data: {e}")
        db.rollback()
        raise
    finally:
        db.close()

if __name__ == "__main__":
    seed_test_data()

