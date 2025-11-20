#!/usr/bin/env python3
"""
Script to populate Fresh Produce Ltd supplier with products and group buys
"""

from datetime import datetime, timedelta
from sqlalchemy.orm import Session
from models.models import User, AdminGroup
from db.database import SessionLocal

def populate_fresh_produce():
    """Populate Fresh Produce Ltd with relevant products and group buys"""
    
    db: Session = SessionLocal()
    
    try:
        # Find the Fresh Produce Ltd supplier
        supplier = db.query(User).filter(
            User.email == "fresh@produce.co.zw"
        ).first()
        
        if not supplier:
            print("✗ Error: Fresh Produce Ltd supplier not found")
            print("  Run 'python recreate_db.py' first to create the supplier")
            return False
        
        print(f"✓ Found supplier: {supplier.company_name} (ID: {supplier.id})")
        
        # Delete existing admin groups for this supplier
        db.query(AdminGroup).filter(AdminGroup.supplier_id == supplier.id).delete()
        db.commit()
        
        # Group buy data for Fresh Produce Ltd
        groups_data = [
            {
                "name": "Organic Tomatoes",
                "category": "Vegetables",
                "description": "Fresh organic tomatoes from local farms",
                "long_description": "Premium organic tomatoes grown without pesticides. Perfect for salads, cooking, and sauces. Harvested at peak ripeness for maximum flavor.",
                "image_url": "https://images.unsplash.com/photo-1592924357228-91a4daadcfea?w=800",
                "unit_price": 5.00,
                "bulk_price": 3.50,
                "total_stock": 500,
                "unit": "kg",
                "target_amount": 100,
                "discount_percentage": 30,
                "features": ["Organic", "Locally Grown", "Pesticide-Free", "Fresh Daily"],
                "requirements": ["Keep refrigerated", "Use within 5 days"],
                "shipping_info": "Same-day delivery within Harare",
                "estimated_delivery": "1-2 days"
            },
            {
                "name": "Fresh Lettuce Bundle",
                "category": "Vegetables",
                "description": "Crisp green lettuce, perfect for salads",
                "long_description": "Farm-fresh lettuce bundles delivered daily. Crispy, nutritious, and perfect for healthy salads. Each bundle contains 3-4 heads of lettuce.",
                "image_url": "https://images.unsplash.com/photo-1622206151226-18ca2c9ab4a1?w=800",
                "unit_price": 4.00,
                "bulk_price": 2.80,
                "total_stock": 300,
                "unit": "bundle",
                "target_amount": 80,
                "discount_percentage": 30,
                "features": ["Crispy & Fresh", "Daily Harvest", "Rich in Vitamins", "Local Farms"],
                "requirements": ["Store in cool place", "Best consumed within 3 days"],
                "shipping_info": "Morning delivery available",
                "estimated_delivery": "Next day"
            },
            {
                "name": "Sweet Potatoes",
                "category": "Vegetables",
                "description": "Nutritious orange sweet potatoes",
                "long_description": "High-quality orange-fleshed sweet potatoes rich in vitamins and minerals. Perfect for baking, roasting, or making healthy snacks.",
                "image_url": "https://images.unsplash.com/photo-1591205410656-1dfe8675d531?w=800",
                "unit_price": 3.50,
                "bulk_price": 2.50,
                "total_stock": 600,
                "unit": "kg",
                "target_amount": 150,
                "discount_percentage": 29,
                "features": ["High in Vitamins", "Long Shelf Life", "Versatile", "Locally Grown"],
                "requirements": ["Store in cool dry place", "Lasts up to 2 weeks"],
                "shipping_info": "Bulk delivery available",
                "estimated_delivery": "2-3 days"
            },
            {
                "name": "Fresh Spinach",
                "category": "Vegetables",
                "description": "Organic baby spinach leaves",
                "long_description": "Tender baby spinach leaves packed with iron and nutrients. Perfect for salads, smoothies, and cooking. Grown using organic farming methods.",
                "image_url": "https://images.unsplash.com/photo-1576045057995-568f588f82fb?w=800",
                "unit_price": 6.00,
                "bulk_price": 4.20,
                "total_stock": 200,
                "unit": "kg",
                "target_amount": 60,
                "discount_percentage": 30,
                "features": ["Organic", "Rich in Iron", "Fresh Daily", "Pre-washed"],
                "requirements": ["Keep refrigerated", "Use within 4 days"],
                "shipping_info": "Temperature-controlled delivery",
                "estimated_delivery": "Same day"
            },
            {
                "name": "Mixed Bell Peppers",
                "category": "Vegetables",
                "description": "Colorful bell peppers - red, yellow, green",
                "long_description": "A vibrant mix of red, yellow, and green bell peppers. Sweet, crunchy, and packed with vitamin C. Perfect for stir-fries, salads, and grilling.",
                "image_url": "https://images.unsplash.com/photo-1563565375-f3fdfdbefa83?w=800",
                "unit_price": 8.00,
                "bulk_price": 5.60,
                "total_stock": 250,
                "unit": "kg",
                "target_amount": 70,
                "discount_percentage": 30,
                "features": ["Colorful Mix", "High in Vitamin C", "Crunchy & Sweet", "Fresh Picked"],
                "requirements": ["Store in refrigerator", "Best within 1 week"],
                "shipping_info": "Careful handling guaranteed",
                "estimated_delivery": "1-2 days"
            },
            {
                "name": "Fresh Carrots",
                "category": "Vegetables",
                "description": "Sweet and crunchy orange carrots",
                "long_description": "Farm-fresh carrots with natural sweetness. Rich in beta-carotene and perfect for snacking, juicing, or cooking. Grown in nutrient-rich soil.",
                "image_url": "https://images.unsplash.com/photo-1598170845058-32b9d6a5da37?w=800",
                "unit_price": 3.00,
                "bulk_price": 2.10,
                "total_stock": 400,
                "unit": "kg",
                "target_amount": 120,
                "discount_percentage": 30,
                "features": ["Sweet & Crunchy", "High in Beta-Carotene", "Long Shelf Life", "Washed & Ready"],
                "requirements": ["Store in cool place", "Lasts up to 3 weeks"],
                "shipping_info": "Standard delivery",
                "estimated_delivery": "2-3 days"
            },
            {
                "name": "Fresh Green Beans",
                "category": "Vegetables",
                "description": "Tender green beans ready to cook",
                "long_description": "Crisp, tender green beans harvested at peak freshness. Perfect for steaming, stir-frying, or adding to casseroles. Rich in fiber and vitamins.",
                "image_url": "https://images.unsplash.com/photo-1604909052743-94e838986d24?w=800",
                "unit_price": 5.50,
                "bulk_price": 3.85,
                "total_stock": 300,
                "unit": "kg",
                "target_amount": 90,
                "discount_percentage": 30,
                "features": ["Tender & Fresh", "Quick Cooking", "High in Fiber", "Pre-trimmed"],
                "requirements": ["Refrigerate immediately", "Best within 5 days"],
                "shipping_info": "Fresh delivery",
                "estimated_delivery": "Next day"
            },
            {
                "name": "Butternut Squash",
                "category": "Vegetables",
                "description": "Sweet butternut squash perfect for roasting",
                "long_description": "Large, sweet butternut squash with smooth texture. Ideal for soups, roasting, or making nutritious purees. Each squash weighs 1-2 kg.",
                "image_url": "https://images.unsplash.com/photo-1570040902841-5d9a24f6c599?w=800",
                "unit_price": 4.50,
                "bulk_price": 3.15,
                "total_stock": 200,
                "unit": "kg",
                "target_amount": 60,
                "discount_percentage": 30,
                "features": ["Sweet & Creamy", "Nutrient-Dense", "Long Storage", "Versatile"],
                "requirements": ["Store in cool dry place", "Lasts several weeks"],
                "shipping_info": "Careful packaging",
                "estimated_delivery": "2-3 days"
            },
            {
                "name": "Fresh Cucumbers",
                "category": "Vegetables",
                "description": "Crisp cucumbers for salads",
                "long_description": "Garden-fresh cucumbers with crispy texture and mild flavor. Perfect for salads, pickling, or refreshing snacks. Grown without chemicals.",
                "image_url": "https://images.unsplash.com/photo-1604977042946-1eecc30f269e?w=800",
                "unit_price": 3.50,
                "bulk_price": 2.45,
                "total_stock": 350,
                "unit": "kg",
                "target_amount": 100,
                "discount_percentage": 30,
                "features": ["Crispy & Refreshing", "Chemical-Free", "Hydrating", "Perfect Size"],
                "requirements": ["Keep refrigerated", "Use within 1 week"],
                "shipping_info": "Fresh delivery",
                "estimated_delivery": "1-2 days"
            },
            {
                "name": "Fresh Broccoli",
                "category": "Vegetables",
                "description": "Nutritious broccoli crowns",
                "long_description": "Fresh broccoli crowns packed with vitamins, minerals, and antioxidants. Perfect for steaming, roasting, or adding to stir-fries. Harvested at optimal size.",
                "image_url": "https://images.unsplash.com/photo-1584270354949-c26b0d5b4a0c?w=800",
                "unit_price": 7.00,
                "bulk_price": 4.90,
                "total_stock": 180,
                "unit": "kg",
                "target_amount": 50,
                "discount_percentage": 30,
                "features": ["Vitamin-Rich", "Antioxidant Power", "Fresh Crowns", "Quick-Cook"],
                "requirements": ["Refrigerate immediately", "Best within 5 days"],
                "shipping_info": "Temperature-controlled",
                "estimated_delivery": "Same day"
            }
        ]
        
        print(f"\nCreating {len(groups_data)} group buys...")
        groups_created = 0
        
        for group_data in groups_data:
            # Calculate dates
            end_date = datetime.utcnow() + timedelta(days=7)  # 7 days to join
            
            admin_group = AdminGroup(
                name=group_data["name"],
                description=group_data["description"],
                long_description=group_data["long_description"],
                category=group_data["category"],
                price=group_data["bulk_price"],
                original_price=group_data["unit_price"],
                image=group_data["image_url"],
                max_participants=50,
                participants=0,
                end_date=end_date,
                supplier_id=supplier.id,
                admin_name=supplier.company_name,
                shipping_info=group_data["shipping_info"],
                estimated_delivery=group_data["estimated_delivery"],
                total_stock=group_data["total_stock"],
                features=group_data["features"],
                requirements=group_data["requirements"],
                is_active=True
            )
            db.add(admin_group)
            groups_created += 1
        
        db.commit()
        print(f"✓ Created {groups_created} group buys")
        
        print("\n" + "="*60)
        print("SUCCESS! Fresh Produce Ltd is now fully populated")
        print("="*60)
        print(f"\nSummary:")
        print(f"  Supplier: {supplier.company_name}")
        print(f"  Email: {supplier.email}")
        print(f"  Active Group Buys: {groups_created}")
        print(f"\nLogin Credentials:")
        print(f"  Email: fresh@produce.co.zw")
        print(f"  Password: supplier123")
        print(f"  Login URL: /supplier/login")
        print(f"\nNote: These group buys will appear in:")
        print(f"  - Trader's 'Browse Groups' page (/all-groups)")
        print(f"  - Admin's 'Group Moderation' page (/moderation)")
        print("\n" + "="*60)
        
        return True
        
    except Exception as e:
        print(f"\n✗ Error: {e}")
        import traceback
        traceback.print_exc()
        db.rollback()
        return False
    finally:
        db.close()


if __name__ == "__main__":
    print("="*60)
    print("POPULATE FRESH PRODUCE LTD")
    print("="*60)
    print()
    
    success = populate_fresh_produce()
    
    if success:
        print("\n✓ You can now login as Fresh Produce Ltd and see all products!")
    else:
        print("\n✗ Failed to populate Fresh Produce Ltd")

