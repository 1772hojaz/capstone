#!/usr/bin/env python3
"""
Seed Admin Groups with Mock Data
- Creates diverse admin-created group buys
- Includes various Zimbabwe product categories
- Simulates active, ready, and completed groups
"""

from datetime import datetime, timedelta
from db.database import SessionLocal
from models.models import AdminGroup, AdminGroupJoin, User
from sqlalchemy import func

def seed_admin_groups(clear_existing=False):
    """Seed database with admin group buy mock data"""
    db = SessionLocal()
    
    try:
        print("\n🌱 Seeding Admin Groups...")
        
        # Check if admin groups already exist
        existing_count = db.query(func.count(AdminGroup.id)).scalar()
        if existing_count > 0:
            if clear_existing:
                print(f"🗑️  Clearing {existing_count} existing admin groups...")
                db.query(AdminGroup).delete()
                db.commit()
                print("✅ Cleared existing admin groups")
            else:
                print(f"⚠️  Found {existing_count} existing admin groups. Skipping seed to avoid duplicates.")
                print("   Run 'python seed_admin_groups.py --clear' to clear and reseed.")
                return
        
        # Get or create admin user
        admin = db.query(User).filter(User.is_admin == True).first()
        if not admin:
            print("⚠️  No admin user found. Creating one...")
            from authentication.auth import hash_password
            admin = User(
                email="admin@connectsphere.com",
                hashed_password=hash_password("admin123"),
                full_name="System Admin",
                is_admin=True,
                location_zone="Harare"
            )
            db.add(admin)
            db.commit()
            db.refresh(admin)
        
        # Check if we have enough traders for joins
        trader_count = db.query(func.count(User.id)).filter(~User.is_admin, ~User.is_supplier).scalar() or 0
        required_traders = 100  # Roughly 25 + 30 + 40 = 95 traders needed
        
        if trader_count < required_traders:
            print(f"⚠️  Only {trader_count} traders found. Creating {required_traders - trader_count} more traders...")
            from authentication.auth import hash_password
            
            for i in range(trader_count, required_traders):
                trader = User(
                    email=f"trader{i+1}@mbare.co.zw",
                    hashed_password=hash_password("password123"),
                    full_name=f"Trader {i+1}",
                    location_zone="Harare",
                    is_admin=False,
                    is_supplier=False
                )
                db.add(trader)
            
            db.commit()
            print(f"✅ Created {required_traders - trader_count} traders")
        
        # Active Groups
        active_groups = [
            {
                "name": "Mealie Meal 10kg Bags - Bulk Order",
                "description": "Premium roller meal (mealie meal) - Zimbabwe's staple food. Perfect for traders and small shops.",
                "long_description": "High-quality roller meal sourced from National Foods Zimbabwe. Each 10kg bag is carefully packed and inspected. Perfect for resale or bulk storage. Save up to 15% compared to retail prices when buying in bulk.",
                "category": "Cooking Essentials",
                "price": 7.20,
                "original_price": 8.50,
                "image": "https://images.unsplash.com/photo-1586201375761-83865001e31c?w=400",
                "max_participants": 20,
                "participants": 15,
                "end_date": datetime.now() + timedelta(days=7),
                "product_name": "Roller Meal 10kg (Mealie Meal)",
                "product_description": "High-quality roller meal - staple food",
                "total_stock": 500,
                "manufacturer": "National Foods Zimbabwe",
                "shipping_info": "Free delivery to Mbare Market. Other locations: $3 delivery fee.",
                "estimated_delivery": "3-5 business days after group closes",
                "features": ["Premium quality", "Locally produced", "Quality inspected", "Freshly milled"],
                "requirements": ["Minimum 5 bags per order", "Payment within 24 hours", "Pickup at designated location"]
            },
            {
                "name": "Mazoe Orange Crush - 2L Bottles",
                "description": "Zimbabwe's favorite orange concentrate. Perfect for resale and events.",
                "long_description": "Original Mazoe Orange Crush - Zimbabwe's iconic beverage. Made by Schweppes Zimbabwe with real orange juice. Each 2L bottle makes approximately 10 liters of refreshing orange drink. Ideal for tuckshops, events, and resale.",
                "category": "Beverages",
                "price": 4.80,
                "original_price": 5.50,
                "image": "https://images.unsplash.com/photo-1600271886742-f049cd451bba?w=400",
                "max_participants": 15,
                "participants": 8,
                "end_date": datetime.now() + timedelta(days=5),
                "product_name": "Mazoe Orange Crush 2L",
                "product_description": "Original orange concentrate",
                "total_stock": 200,
                "manufacturer": "Schweppes Zimbabwe",
                "shipping_info": "Delivery available to all Harare zones. $2 per case delivery fee.",
                "estimated_delivery": "2-3 business days after group closes",
                "features": ["Made with real oranges", "No artificial colors", "Makes 10L per bottle", "Iconic Zim brand"],
                "requirements": ["Minimum 6 bottles per order", "Cash or mobile money", "Original packaging maintained"]
            },
            {
                "name": "Chitenge Fabric - 6 Yards per Piece",
                "description": "Beautiful African print chitenge fabric. Various designs available. Perfect for resale.",
                "long_description": "Premium quality chitenge fabric from Textiles Zimbabwe. Each piece is 6 yards of vibrant African print fabric. Multiple designs and colors available. Perfect for dressmaking, resale, or traditional wear. These fabrics are highly sought after in markets.",
                "category": "Clothing & Textiles",
                "price": 9.50,
                "original_price": 12.00,
                "image": "https://images.unsplash.com/photo-1509319117617-d5c8f3f5d0a5?w=400",
                "max_participants": 30,
                "participants": 22,
                "end_date": datetime.now() + timedelta(days=9),
                "product_name": "Chitenge Fabric 6 Yards",
                "product_description": "Premium African print fabric",
                "total_stock": 300,
                "manufacturer": "Textiles Zimbabwe",
                "shipping_info": "Free delivery for orders above 20 pieces. Otherwise $5 flat fee.",
                "estimated_delivery": "5-7 business days after group closes",
                "features": ["100% cotton", "Vibrant colors", "Multiple designs", "6 yards per piece", "Fade resistant"],
                "requirements": ["Minimum 3 pieces per order", "Advance payment required", "Design selection at pickup"]
            },
            {
                "name": "Compound D Fertilizer - 50kg Bags",
                "description": "Agricultural fertilizer for maize and cereals. Boosts crop yield significantly.",
                "long_description": "NPK fertilizer specifically formulated for maize and cereal crops. Manufactured by Zimbabwe Fertilizer Company (ZFC). Each 50kg bag covers approximately 1 hectare. Proven to increase yields by 30-40% when properly applied. Essential for the upcoming planting season.",
                "category": "Seeds & Fertilizers",
                "price": 60.00,
                "original_price": 68.00,
                "image": "https://images.unsplash.com/photo-1625246333195-78d9c38ad449?w=400",
                "max_participants": 15,
                "participants": 12,
                "end_date": datetime.now() + timedelta(days=6),
                "product_name": "Compound D Fertilizer 50kg",
                "product_description": "NPK fertilizer for cereals",
                "total_stock": 150,
                "manufacturer": "Zimbabwe Fertilizer Company",
                "shipping_info": "Delivery to farm gate or depot. Freight varies by distance.",
                "estimated_delivery": "7-10 business days after group closes",
                "features": ["NPK formula", "Suitable for maize", "50kg bags", "Boosts yield 30-40%", "ZFC certified"],
                "requirements": ["Minimum 10 bags per order", "Proof of farming activity", "Secure storage required"]
            },
            {
                "name": "Stone Sculptures - Handcrafted Art",
                "description": "Authentic Zimbabwean stone sculptures. Various sizes and designs. Perfect for tourists and collectors.",
                "long_description": "Handcrafted stone sculptures from Tengenenge Art Community. Each piece is unique, carved by skilled Zimbabwean artists using traditional Shona sculpting techniques. Sizes range from small (2kg) to large (20kg). These artworks are highly valued by tourists and collectors worldwide.",
                "category": "Arts & Crafts",
                "price": 170.00,
                "original_price": 200.00,
                "image": "https://images.unsplash.com/photo-1578632292335-df3abbb0d586?w=400",
                "max_participants": 10,
                "participants": 5,
                "end_date": datetime.now() + timedelta(days=11),
                "product_name": "Handcrafted Stone Sculpture",
                "product_description": "Traditional Shona sculpture",
                "total_stock": 20,
                "manufacturer": "Tengenenge Artists",
                "shipping_info": "Careful packaging included. Delivery $10 per sculpture within Harare.",
                "estimated_delivery": "14 business days (made to order)",
                "features": ["Authentic Shona art", "Unique pieces", "Various sizes", "Certificate of authenticity", "Export ready"],
                "requirements": ["50% deposit required", "Balance on delivery", "Fragile - careful handling"]
            }
        ]
        
        # Ready for Payment Groups
        ready_groups = [
            {
                "name": "Exercise Books (48 Pages) - Bulk for Schools",
                "description": "Quality exercise books for schools. Group target reached, ready for payment processing.",
                "long_description": "Standard 48-page exercise books manufactured by ZimPapers. Suitable for primary and secondary schools. Each book has lined pages and durable covers. Perfect for bulk orders for schools, tuckshops, or stationery traders.",
                "category": "Stationery & Books",
                "price": 0.50,
                "original_price": 0.65,
                "image": "https://images.unsplash.com/photo-1544716278-ca5e3f4abd8c?w=400",
                "max_participants": 25,
                "participants": 25,
                "end_date": datetime.now() - timedelta(days=1),
                "product_name": "Exercise Books 48 Pages",
                "product_description": "School exercise books",
                "total_stock": 5000,
                "manufacturer": "ZimPapers",
                "shipping_info": "Free delivery for orders above 500 books.",
                "estimated_delivery": "Immediate pickup available or 2-day delivery",
                "features": ["48 pages", "Lined paper", "Durable covers", "Standard size", "ZimPapers quality"],
                "requirements": ["Minimum 100 books per trader", "Cash payment preferred", "Original packaging"]
            },
            {
                "name": "Geisha Bath Soap - 100g Bars",
                "description": "Popular bath soap. Group target reached, ready for payment.",
                "long_description": "Geisha bath soap by Unilever Zimbabwe. Each bar is 100g of quality bath soap with moisturizing properties. Well-known brand that sells quickly in markets and tuckshops. Perfect for traders looking for fast-moving consumer goods.",
                "category": "Household Items",
                "price": 0.95,
                "original_price": 1.20,
                "image": "https://images.unsplash.com/photo-1585229598949-79301e4a5249?w=400",
                "max_participants": 30,
                "participants": 30,
                "end_date": datetime.now() - timedelta(days=2),
                "product_name": "Geisha Bath Soap 100g",
                "product_description": "Quality bath soap",
                "total_stock": 1000,
                "manufacturer": "Unilever Zimbabwe",
                "shipping_info": "Delivery within Harare and Chitungwiza. $5 flat fee.",
                "estimated_delivery": "Next business day after payment confirmation",
                "features": ["100g bars", "Moisturizing", "Fresh fragrance", "Popular brand", "Good lather"],
                "requirements": ["Minimum 50 bars per order", "Payment within 48 hours", "Sealed boxes only"]
            }
        ]
        
        # Completed Groups
        completed_groups = [
            {
                "name": "Kapenta (Dried Fish) - 5kg Packs",
                "description": "High-quality dried kapenta from Lake Kariba. Bulk order successfully completed.",
                "long_description": "Premium dried kapenta (small fish) from Lake Kariba. Each 5kg pack contains carefully sun-dried, high-protein fish. Kapenta is a staple protein source in Zimbabwe and sells quickly. This batch is from the Kariba Fishing Co-operative, known for quality.",
                "category": "Fish & Kapenta",
                "price": 40.00,
                "original_price": 45.00,
                "image": "https://images.unsplash.com/photo-1559181567-c3190ca9959b?w=400",
                "max_participants": 30,
                "participants": 30,
                "end_date": datetime.now() - timedelta(days=15),
                "product_name": "Dried Kapenta 5kg Pack",
                "product_description": "Lake Kariba kapenta",
                "total_stock": 200,
                "manufacturer": "Kariba Fishing Co-op",
                "shipping_info": "Delivered in sealed bags. $4 delivery fee per order.",
                "estimated_delivery": "Completed - ready for pickup",
                "features": ["Lake Kariba origin", "Sun dried", "High protein", "5kg packs", "Sealed packaging"],
                "requirements": ["Refrigerated storage recommended", "Payment completed", "Pickup within 7 days"]
            },
            {
                "name": "Charcoal - 20kg Bags",
                "description": "Quality hardwood charcoal. Group buy completed successfully.",
                "long_description": "Premium hardwood charcoal in 20kg bags. Made from sustainably sourced hardwood. Burns longer and produces less smoke than ordinary charcoal. Perfect for braais, cooking, and resale. Popular item in all seasons.",
                "category": "Fuel & Energy",
                "price": 30.00,
                "original_price": 32.00,
                "image": "https://images.unsplash.com/photo-1605731414904-e0b4c74c6551?w=400",
                "max_participants": 40,
                "participants": 40,
                "end_date": datetime.now() - timedelta(days=10),
                "product_name": "Hardwood Charcoal 20kg",
                "product_description": "Quality cooking charcoal",
                "total_stock": 400,
                "manufacturer": "Charcoal Producers",
                "shipping_info": "Self-collection or delivery. $8 per 10 bags delivery.",
                "estimated_delivery": "Completed - available for pickup",
                "features": ["Hardwood source", "Long burning", "Low smoke", "20kg bags", "Quality sorted"],
                "requirements": ["Dry storage needed", "Payment completed", "Pickup within 14 days"]
            }
        ]
        
        # Create all groups with proper states
        created_count = 0
        
        # Active groups - is_active=True, end_date in future
        for group_data in active_groups:
            admin_group = AdminGroup(
                name=group_data["name"],
                description=group_data["description"],
                long_description=group_data["long_description"],
                category=group_data["category"],
                price=group_data["price"],
                original_price=group_data["original_price"],
                image=group_data["image"],
                max_participants=group_data["max_participants"],
                participants=group_data["participants"],
                end_date=group_data["end_date"],
                admin_name="Admin",
                supplier_id=admin.id,
                product_name=group_data["product_name"],
                product_description=group_data["product_description"],
                total_stock=group_data["total_stock"],
                manufacturer=group_data.get("manufacturer", ""),
                shipping_info=group_data["shipping_info"],
                estimated_delivery=group_data["estimated_delivery"],
                features=group_data["features"],
                requirements=group_data["requirements"],
                is_active=True  # Active groups
            )
            db.add(admin_group)
            created_count += 1
        
        # Ready for payment groups - is_active=True, participants >= max_participants
        # Need to create joins so total quantity >= total_stock
        for group_data in ready_groups:
            admin_group = AdminGroup(
                name=group_data["name"],
                description=group_data["description"],
                long_description=group_data["long_description"],
                category=group_data["category"],
                price=group_data["price"],
                original_price=group_data["original_price"],
                image=group_data["image"],
                max_participants=group_data["max_participants"],
                participants=group_data["participants"],  # Should equal max_participants
                end_date=group_data["end_date"],
                admin_name="Admin",
                supplier_id=admin.id,
                product_name=group_data["product_name"],
                product_description=group_data["product_description"],
                total_stock=group_data["total_stock"],
                manufacturer=group_data.get("manufacturer", ""),
                shipping_info=group_data["shipping_info"],
                estimated_delivery=group_data["estimated_delivery"],
                features=group_data["features"],
                requirements=group_data["requirements"],
                is_active=True  # Still active, but ready for payment
            )
            db.add(admin_group)
            db.flush()  # Get the group ID
            
            # Create joins so total quantity >= total_stock
            # Distribute stock across participants
            num_participants = group_data["participants"]
            total_stock_value = group_data["total_stock"]
            quantity_per_participant = total_stock_value // num_participants
            remainder = total_stock_value % num_participants
            
            # Get some traders to join this group
            traders = db.query(User).filter(~User.is_admin, ~User.is_supplier).limit(num_participants).all()
            
            for i, trader in enumerate(traders):
                quantity = quantity_per_participant + (1 if i < remainder else 0)
                join = AdminGroupJoin(
                    admin_group_id=admin_group.id,
                    user_id=trader.id,
                    quantity=quantity,
                    delivery_method="pickup",
                    payment_method="cash",
                    paid_amount=quantity * group_data["price"]
                )
                db.add(join)
            
            created_count += 1
        
        # Completed groups - is_active=False
        # Also create joins to show they were successfully completed
        for group_data in completed_groups:
            admin_group = AdminGroup(
                name=group_data["name"],
                description=group_data["description"],
                long_description=group_data["long_description"],
                category=group_data["category"],
                price=group_data["price"],
                original_price=group_data["original_price"],
                image=group_data["image"],
                max_participants=group_data["max_participants"],
                participants=group_data["participants"],
                end_date=group_data["end_date"],
                admin_name="Admin",
                supplier_id=admin.id,
                product_name=group_data["product_name"],
                product_description=group_data["product_description"],
                total_stock=group_data["total_stock"],
                manufacturer=group_data.get("manufacturer", ""),
                shipping_info=group_data["shipping_info"],
                estimated_delivery=group_data["estimated_delivery"],
                features=group_data["features"],
                requirements=group_data["requirements"],
                is_active=False  # Completed/processed groups
            )
            db.add(admin_group)
            db.flush()  # Get the group ID
            
            # Create joins to show completion
            num_participants = group_data["participants"]
            total_stock_value = group_data["total_stock"]
            quantity_per_participant = total_stock_value // num_participants
            remainder = total_stock_value % num_participants
            
            # Get some traders to join this group (different from ready groups)
            traders = db.query(User).filter(~User.is_admin, ~User.is_supplier).offset(num_participants * 2).limit(num_participants).all()
            
            for i, trader in enumerate(traders):
                quantity = quantity_per_participant + (1 if i < remainder else 0)
                join = AdminGroupJoin(
                    admin_group_id=admin_group.id,
                    user_id=trader.id,
                    quantity=quantity,
                    delivery_method="pickup",
                    payment_method="cash",
                    paid_amount=quantity * group_data["price"]
                )
                db.add(join)
            
            created_count += 1
        
        db.commit()
        
        # Count total joins created
        total_joins = sum(g["participants"] for g in ready_groups + completed_groups)
        
        print(f"✅ Successfully created {created_count} admin groups")
        print(f"   - {len(active_groups)} active groups")
        print(f"   - {len(ready_groups)} ready for payment (with {sum(g['participants'] for g in ready_groups)} joins)")
        print(f"   - {len(completed_groups)} completed groups (with {sum(g['participants'] for g in completed_groups)} joins)")
        print(f"   - Total {total_joins} group joins created")
        print("\n🎉 Admin groups seeded successfully!")
        
    except Exception as e:
        print(f"❌ Error seeding admin groups: {e}")
        db.rollback()
        raise
    finally:
        db.close()

if __name__ == "__main__":
    import sys
    clear_existing = "--clear" in sys.argv or "-c" in sys.argv
    seed_admin_groups(clear_existing=clear_existing)

