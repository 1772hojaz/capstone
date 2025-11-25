"""
Database Recreation Script
Deletes existing tables and recreates them with seed data matching frontend mockData.ts
"""

import sys
import os
from datetime import datetime, timedelta
from sqlalchemy import create_engine
from sqlalchemy.orm import sessionmaker

# Add parent directory to path
sys.path.append(os.path.dirname(os.path.abspath(__file__)))

from db.database import Base, engine, SessionLocal
from models.models import User, Product, GroupBuy, Contribution
from authentication.auth import hash_password

def drop_all_tables():
    """Drop all existing tables"""
    print("Dropping all existing tables...")
    Base.metadata.drop_all(bind=engine)
    print("✓ All tables dropped")

def create_all_tables():
    """Create all tables with new schema"""
    print("\nCreating all tables with new schema...")
    Base.metadata.create_all(bind=engine)
    print("✓ All tables created")

def seed_database():
    """Seed database with data matching frontend mockData.ts"""
    db = SessionLocal()
    
    try:
        print("\n" + "="*60)
        print("SEEDING DATABASE WITH MOCKDATA")
        print("="*60)
        
        # ==================== USERS ====================
        print("\n[1/4] Creating users...")
        
        # Test trader (from mockUser)
        trader = User(
            email="trader1@mbare.co.zw",
            hashed_password=hash_password("password123"),
            full_name="John Mbare",
            location_zone="Harare",
            is_admin=False,
            is_supplier=False,
            preferred_categories=["Beverages", "Fruits", "Meat & Poultry"],
            budget_range="medium",
            experience_level="intermediate",
            show_recommendations=True,
            auto_join_groups=True,
            price_alerts=False,
            email_notifications=True,
            push_notifications=True,
            sms_notifications=False,
            weekly_summary=True,
            price_alerts_enabled=False
        )
        db.add(trader)
        
        # Admin user
        admin = User(
            email="admin@connectsphere.com",
            hashed_password=hash_password("admin123"),
            full_name="System Admin",
            location_zone="Harare",
            is_admin=True,
            is_supplier=False,
        )
        db.add(admin)
        
        # Supplier users (from mockData supplier names) - using valid location zones
        suppliers_data = [
            {"email": "info@ethiopiancoffee.co.zw", "name": "Ethiopian Coffee Co.", "location": "Harare"},
            {"email": "organic@foods.co.zw", "name": "Organic Foods Zimbabwe", "location": "Harare"},
            {"email": "fresh@produce.co.zw", "name": "Fresh Produce Ltd", "location": "Harare"},
            {"email": "mediterranean@imports.co.zw", "name": "Mediterranean Imports", "location": "Harare"},
            {"email": "local@poultry.co.zw", "name": "Local Poultry Farm", "location": "Harare"},
            {"email": "green@valley.co.zw", "name": "Green Valley Farms", "location": "Harare"},
            {"email": "artisan@bakery.co.zw", "name": "Artisan Bakery Co.", "location": "Harare"},
            {"email": "ocean@fresh.co.zw", "name": "Ocean Fresh Imports", "location": "Harare"},
            {"email": "techhub@electronics.co.zw", "name": "TechHub Electronics", "location": "Harare"},
            {"email": "premium@roasters.co.zw", "name": "Premium Roasters Ltd", "location": "Harare"},
        ]
        
        suppliers = []
        for s_data in suppliers_data:
            supplier = User(
                email=s_data["email"],
                hashed_password=hash_password("supplier123"),
                full_name=s_data["name"],
                company_name=s_data["name"],
                location_zone=s_data["location"],
                is_admin=False,
                is_supplier=True,
                business_type="retailer",
                is_verified=True,
                verification_status="verified"
            )
            suppliers.append(supplier)
            db.add(supplier)
        
        db.commit()
        db.refresh(trader)
        db.refresh(admin)
        for supplier in suppliers:
            db.refresh(supplier)
        
        print(f"✓ Created {len(suppliers) + 2} users (1 trader, 1 admin, {len(suppliers)} suppliers)")
        
        # ==================== PRODUCTS ====================
        print("\n[2/4] Creating products from mockData...")
        
        # Products matching frontend mockData exactly
        products_data = [
            {
                "name": "Premium Arabica Coffee Beans",
                "description": "Freshly roasted premium Arabica coffee beans from Ethiopia. Rich aroma and smooth taste. Perfect for coffee enthusiasts.",
                "category": "Beverages",
                "unit_price": 34.99,
                "bulk_price": 24.99,
                "moq": 50,
                "image_url": "https://images.unsplash.com/photo-1559056199-641a0ac8b55e?w=800&auto=format&fit=crop",
                "manufacturer": "Ethiopian Coffee Co."
            },
            {
                "name": "Organic Quinoa - 5kg Pack",
                "description": "Premium organic quinoa, rich in protein and fiber. Perfect for healthy meals and meal prep.",
                "category": "Grains & Cereals",
                "unit_price": 65.00,
                "bulk_price": 45.00,
                "moq": 50,
                "image_url": "https://images.unsplash.com/photo-1586201375761-83865001e31c?w=800&auto=format&fit=crop",
                "manufacturer": "Organic Foods Zimbabwe"
            },
            {
                "name": "Fresh Avocados - Box of 30",
                "description": "Premium grade avocados, perfectly ripe. Great for salads, smoothies, and guacamole.",
                "category": "Fruits",
                "unit_price": 28.00,
                "bulk_price": 18.50,
                "moq": 50,
                "image_url": "https://images.unsplash.com/photo-1523049673857-eb18f1d7b578?w=800&auto=format&fit=crop",
                "manufacturer": "Fresh Produce Ltd"
            },
            {
                "name": "Premium Olive Oil - 2L",
                "description": "Extra virgin olive oil from Greece. Cold-pressed and perfect for cooking and salads.",
                "category": "Others",
                "unit_price": 49.99,
                "bulk_price": 32.99,
                "moq": 40,
                "image_url": "https://images.unsplash.com/photo-1474979266404-7eaacbcd87c5?w=800&auto=format&fit=crop",
                "manufacturer": "Mediterranean Imports"
            },
            {
                "name": "Whole Chicken - Free Range",
                "description": "Locally raised free-range chickens. Fresh and healthy, average 2kg per chicken.",
                "category": "Meat & Poultry",
                "unit_price": 12.99,
                "bulk_price": 8.99,
                "moq": 100,
                "image_url": "https://images.unsplash.com/photo-1587593810167-a84920ea0781?w=800&auto=format&fit=crop",
                "manufacturer": "Local Poultry Farm"
            },
            {
                "name": "Organic Tomatoes - 10kg",
                "description": "Fresh organic tomatoes from local farms. Perfect for sauces, salads, and cooking.",
                "category": "Vegetables",
                "unit_price": 18.00,
                "bulk_price": 12.00,
                "moq": 30,
                "image_url": "https://images.unsplash.com/photo-1546470427-e26264be0b95?w=800&auto=format&fit=crop",
                "manufacturer": "Green Valley Farms"
            },
            {
                "name": "Artisan Bread Assortment",
                "description": "Mix of sourdough, whole wheat, and multigrain breads. Freshly baked daily.",
                "category": "Bakery",
                "unit_price": 22.00,
                "bulk_price": 15.50,
                "moq": 40,
                "image_url": "https://images.unsplash.com/photo-1509440159596-0249088772ff?w=800&auto=format&fit=crop",
                "manufacturer": "Artisan Bakery Co."
            },
            {
                "name": "Fresh Salmon Fillets - 1kg",
                "description": "Premium Atlantic salmon fillets. Rich in Omega-3, perfect for grilling or baking.",
                "category": "Seafood",
                "unit_price": 59.00,
                "bulk_price": 42.00,
                "moq": 35,
                "image_url": "https://images.unsplash.com/photo-1519708227418-c8fd9a32b7a2?w=800&auto=format&fit=crop",
                "manufacturer": "Ocean Fresh Imports"
            },
            {
                "name": "Wireless Bluetooth Headphones",
                "description": "Premium noise-cancelling wireless headphones with 30-hour battery life.",
                "category": "Electronics",
                "unit_price": 129.99,
                "bulk_price": 89.99,
                "moq": 75,
                "image_url": "https://images.unsplash.com/photo-1505740420928-5e560c06d30e?w=800&auto=format&fit=crop",
                "manufacturer": "TechHub Electronics"
            },
            {
                "name": "Premium Coffee Beans - 5kg",
                "description": "Freshly roasted Arabica coffee beans.",
                "category": "Food",
                "unit_price": 50.00,
                "bulk_price": 35.00,
                "moq": 30,
                "image_url": "https://images.unsplash.com/photo-1447933601403-0c6688de566e?w=800&auto=format&fit=crop",
                "manufacturer": "Premium Roasters Ltd"
            }
        ]
        
        products = []
        for idx, p_data in enumerate(products_data):
            product = Product(
                name=p_data["name"],
                description=p_data["description"],
                category=p_data["category"],
                unit_price=p_data["unit_price"],
                bulk_price=p_data["bulk_price"],
                moq=p_data["moq"],
                image_url=p_data["image_url"],
                manufacturer=p_data["manufacturer"],
                is_active=True,
                total_stock=1000  # Default stock
            )
            products.append(product)
            db.add(product)
        
        db.commit()
        for product in products:
            db.refresh(product)
        
        print(f"✓ Created {len(products)} products with exact mockData details")
        
        # ==================== GROUP BUYS ====================
        print("\n[3/4] Creating group buys with money tracking...")
        
        # Map products to suppliers
        product_supplier_map = {
            0: 0,  # Coffee -> Ethiopian Coffee
            1: 1,  # Quinoa -> Organic Foods
            2: 2,  # Avocados -> Fresh Produce
            3: 3,  # Olive Oil -> Mediterranean
            4: 4,  # Chicken -> Local Poultry
            5: 5,  # Tomatoes -> Green Valley
            6: 6,  # Bread -> Artisan Bakery
            7: 7,  # Salmon -> Ocean Fresh
            8: 8,  # Headphones -> TechHub
            9: 9,  # Coffee Beans -> Premium Roasters
        }
        
        # Group buys matching mockData
        groups_data = [
            {
                "product_idx": 0,
                "location": "Downtown Market, Harare",
                "deadline": datetime.now() + timedelta(days=6),
                "participants": 35,
                "status": "active",
                "supplier_status": None
            },
            {
                "product_idx": 1,
                "location": "Mbare Market",
                "deadline": datetime.now() + timedelta(days=3),
                "participants": 48,
                "status": "active",
                "supplier_status": None
            },
            {
                "product_idx": 2,
                "location": "Avondale Farmers Market",
                "deadline": datetime.now() - timedelta(days=1),  # Past deadline
                "participants": 50,
                "status": "ready_for_pickup",
                "supplier_status": "ready_for_collection"
            },
            {
                "product_idx": 3,
                "location": "Borrowdale Shopping Center",
                "deadline": datetime.now() + timedelta(days=9),
                "participants": 22,
                "status": "active",
                "supplier_status": None
            },
            {
                "product_idx": 4,
                "location": "Multiple locations available",
                "deadline": datetime.now() + timedelta(days=1),
                "participants": 60,
                "status": "active",
                "supplier_status": None
            },
            {
                "product_idx": 5,
                "location": "Mbare Market",
                "deadline": datetime.now() + timedelta(days=2),
                "participants": 15,
                "status": "active",
                "supplier_status": None
            },
            {
                "product_idx": 6,
                "location": "Avondale",
                "deadline": datetime.now(),
                "participants": 38,
                "status": "active",
                "supplier_status": None
            },
            {
                "product_idx": 7,
                "location": "Sam Levy's Village",
                "deadline": datetime.now() + timedelta(days=1),
                "participants": 28,
                "status": "active",
                "supplier_status": None
            },
            {
                "product_idx": 8,
                "location": "TechHub Store - Eastgate Mall",
                "deadline": datetime.now() - timedelta(days=14),
                "participants": 75,
                "status": "completed",
                "supplier_status": "collected"
            },
            {
                "product_idx": 9,
                "location": "Downtown Coffee Hub",
                "deadline": datetime.now() + timedelta(days=1),
                "participants": 30,
                "status": "active",
                "supplier_status": None
            }
        ]
        
        group_buys = []
        for idx, g_data in enumerate(groups_data):
            product = products[g_data["product_idx"]]
            supplier_idx = product_supplier_map[g_data["product_idx"]]
            supplier = suppliers[supplier_idx]
            
            # Calculate money tracking values
            target_amount = product.moq * product.bulk_price
            current_amount = g_data["participants"] * product.bulk_price
            amount_progress = (current_amount / target_amount) * 100 if target_amount > 0 else 0
            
            group_buy = GroupBuy(
                product_id=product.id,
                creator_id=supplier.id,
                location_zone=g_data["location"],
                deadline=g_data["deadline"],
                total_quantity=g_data["participants"],
                total_contributions=current_amount,
                total_paid=current_amount,
                current_amount=current_amount,
                target_amount=target_amount,
                amount_progress=amount_progress,
                status=g_data["status"],
                supplier_status=g_data["supplier_status"],
                created_at=datetime.now() - timedelta(days=10-idx)
            )
            group_buys.append(group_buy)
            db.add(group_buy)
        
        db.commit()
        for group_buy in group_buys:
            db.refresh(group_buy)
        
        print(f"✓ Created {len(group_buys)} group buys with money tracking")
        
        # ==================== CONTRIBUTIONS ====================
        print("\n[4/4] Creating contributions for trader...")
        
        # Trader joins specific groups from mockMyGroups
        contributions_data = [
            {"group_idx": 0, "quantity": 2},  # Coffee - active
            {"group_idx": 2, "quantity": 1},  # Avocados - ready_for_pickup
            {"group_idx": 4, "quantity": 3},  # Chicken - active
            {"group_idx": 8, "quantity": 1},  # Headphones - completed
            {"group_idx": 9, "quantity": 2},  # Coffee Beans - active (goal reached)
        ]
        
        for contrib_data in contributions_data:
            group_buy = group_buys[contrib_data["group_idx"]]
            product = products[groups_data[contrib_data["group_idx"]]["product_idx"]]
            
            contribution_amount = contrib_data["quantity"] * product.bulk_price
            
            contribution = Contribution(
                group_buy_id=group_buy.id,
                user_id=trader.id,
                quantity=contrib_data["quantity"],
                contribution_amount=contribution_amount,
                paid_amount=contribution_amount,
                is_fully_paid=True,
                joined_at=datetime.now() - timedelta(days=5)
            )
            db.add(contribution)
        
        db.commit()
        print(f"✓ Created {len(contributions_data)} contributions for trader")
        
        print("\n" + "="*60)
        print("DATABASE SEEDING COMPLETED SUCCESSFULLY!")
        print("="*60)
        print("\nSummary:")
        print(f"  Users: {len(suppliers) + 2} (1 trader, 1 admin, {len(suppliers)} suppliers)")
        print(f"  Products: {len(products)}")
        print(f"  Group Buys: {len(group_buys)}")
        print(f"  Contributions: {len(contributions_data)}")
        print("\nTest Credentials:")
        print("  Trader: trader1@mbare.co.zw / password123")
        print("  Admin: admin@connectsphere.com / admin123")
        print("  Suppliers: [supplier_email] / supplier123")
        print("\n" + "="*60 + "\n")
        
    except Exception as e:
        print(f"\n✗ Error during seeding: {e}")
        db.rollback()
        raise
    finally:
        db.close()

def main():
    """Main function to recreate database"""
    print("\n" + "="*60)
    print("DATABASE RECREATION SCRIPT")
    print("="*60)
    print("\nThis will:")
    print("  1. Drop all existing tables")
    print("  2. Create new tables with updated schema")
    print("  3. Seed with data from frontend mockData.ts")
    print("\n" + "="*60)
    
    try:
        # Step 1: Drop all tables
        drop_all_tables()
        
        # Step 2: Create all tables
        create_all_tables()
        
        # Step 3: Seed database
        seed_database()
        
        print("\n✓ Database recreation completed successfully!")
        print("\nYou can now:")
        print("  1. Start the backend: cd sys/backend && python main.py")
        print("  2. Toggle USE_MOCK_DATA to false in frontend")
        print("  3. Test the connection!\n")
        
    except Exception as e:
        print(f"\n✗ Error: {e}")
        import traceback
        traceback.print_exc()
        sys.exit(1)

if __name__ == "__main__":
    main()

