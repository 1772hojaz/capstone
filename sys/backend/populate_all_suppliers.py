#!/usr/bin/env python3
"""
Script to populate ALL suppliers with mock group buys
"""

from datetime import datetime, timedelta
from sqlalchemy.orm import Session
from models.models import User, AdminGroup
from db.database import SessionLocal

# Mock data for each supplier
SUPPLIERS_DATA = {
    "Ethiopian Coffee Co.": {
        "email": "info@ethiopiancoffee.co.zw",
        "groups": [
            {
                "name": "Premium Ethiopian Coffee Beans",
                "category": "Beverages",
                "description": "Authentic Ethiopian Arabica coffee beans",
                "long_description": "Hand-picked Ethiopian Arabica coffee beans from the Sidamo region. Rich, full-bodied flavor with notes of chocolate and berries. Perfect for espresso or pour-over brewing.",
                "image": "https://images.unsplash.com/photo-1447933601403-0c6688de566e?w=800",
                "unit_price": 25.00,
                "bulk_price": 18.00,
                "total_stock": 200,
                "features": ["Single Origin", "Arabica Beans", "Fair Trade", "Fresh Roasted"],
                "requirements": ["Store in airtight container", "Use within 3 months"],
                "shipping_info": "Vacuum-sealed packaging",
                "estimated_delivery": "2-3 days"
            },
            {
                "name": "Ethiopian Coffee Gift Set",
                "category": "Beverages",
                "description": "Complete coffee experience package",
                "long_description": "Includes 500g premium coffee beans, traditional Ethiopian coffee pot (Jebena), and 6 small cups. Perfect gift for coffee lovers.",
                "image": "https://images.unsplash.com/photo-1511920170033-f8396924c348?w=800",
                "unit_price": 45.00,
                "bulk_price": 32.00,
                "total_stock": 50,
                "features": ["Traditional Jebena", "Premium Beans", "Gift Packaged", "Cultural Experience"],
                "requirements": ["Handle ceramic with care"],
                "shipping_info": "Carefully packaged",
                "estimated_delivery": "3-5 days"
            }
        ]
    },
    "Organic Foods Zimbabwe": {
        "email": "organic@foods.co.zw",
        "groups": [
            {
                "name": "Organic Brown Rice",
                "category": "Grains & Cereals",
                "description": "Certified organic brown rice",
                "long_description": "Locally grown organic brown rice, rich in fiber and nutrients. Perfect for healthy meals. Grown without pesticides or chemical fertilizers.",
                "image": "https://images.unsplash.com/photo-1586201375761-83865001e31c?w=800",
                "unit_price": 8.00,
                "bulk_price": 5.60,
                "total_stock": 500,
                "features": ["Certified Organic", "High in Fiber", "Locally Grown", "Chemical-Free"],
                "requirements": ["Store in cool dry place", "Lasts up to 1 year"],
                "shipping_info": "Sealed bags",
                "estimated_delivery": "2-3 days"
            },
            {
                "name": "Organic Honey",
                "category": "Cooking Essentials",
                "description": "Pure organic honey from local beekeepers",
                "long_description": "Raw, unprocessed organic honey collected from wildflowers. Rich in antioxidants and natural enzymes. Support local beekeepers!",
                "image": "https://images.unsplash.com/photo-1587049352846-4a222e784387?w=800",
                "unit_price": 15.00,
                "bulk_price": 10.50,
                "total_stock": 300,
                "features": ["Raw & Unprocessed", "Wildflower Honey", "Local Beekeepers", "Natural Enzymes"],
                "requirements": ["Store at room temperature", "Indefinite shelf life"],
                "shipping_info": "Glass jars",
                "estimated_delivery": "1-2 days"
            }
        ]
    },
    "Fresh Produce Ltd": {
        "email": "fresh@produce.co.zw",
        "groups": []  # Already populated
    },
    "Mediterranean Imports": {
        "email": "mediterranean@imports.co.zw",
        "groups": [
            {
                "name": "Extra Virgin Olive Oil",
                "category": "Cooking Essentials",
                "description": "Premium imported olive oil from Greece",
                "long_description": "Cold-pressed extra virgin olive oil from Greek olive groves. Perfect for salads, cooking, and dipping. Rich in healthy fats and antioxidants.",
                "image": "https://images.unsplash.com/photo-1474979266404-7eaacbcd87c5?w=800",
                "unit_price": 20.00,
                "bulk_price": 14.00,
                "total_stock": 200,
                "features": ["Cold-Pressed", "Greek Import", "Extra Virgin", "High Polyphenols"],
                "requirements": ["Store away from light", "Use within 1 year"],
                "shipping_info": "Dark glass bottles",
                "estimated_delivery": "2-3 days"
            },
            {
                "name": "Mediterranean Spice Collection",
                "category": "Cooking Essentials",
                "description": "Authentic Mediterranean herbs and spices",
                "long_description": "Collection includes oregano, thyme, rosemary, basil, and za'atar. Bring authentic Mediterranean flavors to your kitchen.",
                "image": "https://images.unsplash.com/photo-1596040033229-a0b13dce7d4f?w=800",
                "unit_price": 18.00,
                "bulk_price": 12.60,
                "total_stock": 150,
                "features": ["Authentic Blend", "5 Premium Spices", "Aromatic", "Long-lasting"],
                "requirements": ["Store in cool dry place", "Best within 6 months"],
                "shipping_info": "Sealed containers",
                "estimated_delivery": "2-3 days"
            }
        ]
    },
    "Local Poultry Farm": {
        "email": "local@poultry.co.zw",
        "groups": [
            {
                "name": "Free-Range Chicken (Whole)",
                "category": "Meat & Poultry",
                "description": "Farm-fresh free-range chickens",
                "long_description": "Healthy free-range chickens raised on natural feed without antibiotics. Tender, flavorful meat. Average weight 1.5-2kg per bird.",
                "image": "https://images.unsplash.com/photo-1587593810167-a84920ea0781?w=800",
                "unit_price": 12.00,
                "bulk_price": 8.40,
                "total_stock": 100,
                "features": ["Free-Range", "No Antibiotics", "Natural Feed", "Fresh Daily"],
                "requirements": ["Keep frozen", "Cook within 2 days if thawed"],
                "shipping_info": "Frozen delivery",
                "estimated_delivery": "Same day"
            },
            {
                "name": "Fresh Eggs (30 pack)",
                "category": "Dairy Products",
                "description": "Free-range farm eggs",
                "long_description": "Fresh eggs from free-range hens. Rich golden yolks, superior taste. Collected daily from our farm.",
                "image": "https://images.unsplash.com/photo-1582722872445-44dc5f7e3c8f?w=800",
                "unit_price": 10.00,
                "bulk_price": 7.00,
                "total_stock": 200,
                "features": ["Free-Range Hens", "Daily Collection", "Rich Yolks", "Grade A"],
                "requirements": ["Refrigerate immediately", "Best within 3 weeks"],
                "shipping_info": "Protective cartons",
                "estimated_delivery": "Same day"
            }
        ]
    },
    "Green Valley Farms": {
        "email": "green@valley.co.zw",
        "groups": [
            {
                "name": "Organic Bananas",
                "category": "Fruits",
                "description": "Sweet organic bananas",
                "long_description": "Organic bananas grown on our sustainable farm. Perfect ripeness, naturally sweet. Rich in potassium and vitamins.",
                "image": "https://images.unsplash.com/photo-1603833665858-e61d17a86224?w=800",
                "unit_price": 4.00,
                "bulk_price": 2.80,
                "total_stock": 400,
                "features": ["Organic", "Naturally Sweet", "High Potassium", "Perfect Ripeness"],
                "requirements": ["Store at room temperature", "Best within 1 week"],
                "shipping_info": "Careful handling",
                "estimated_delivery": "1-2 days"
            },
            {
                "name": "Mixed Tropical Fruits",
                "category": "Fruits",
                "description": "Assorted tropical fruit basket",
                "long_description": "A delicious mix of mangoes, papayas, pineapples, and avocados. All locally grown and freshly harvested. Perfect for healthy snacking.",
                "image": "https://images.unsplash.com/photo-1619566636858-adf3ef46400b?w=800",
                "unit_price": 15.00,
                "bulk_price": 10.50,
                "total_stock": 150,
                "features": ["Locally Grown", "Fresh Harvest", "Variety Pack", "Nutrient-Rich"],
                "requirements": ["Store in cool place", "Consume within 5 days"],
                "shipping_info": "Protective packaging",
                "estimated_delivery": "1-2 days"
            }
        ]
    },
    "Artisan Bakery Co.": {
        "email": "artisan@bakery.co.zw",
        "groups": [
            {
                "name": "Sourdough Bread Loaves",
                "category": "Grocery",
                "description": "Traditional sourdough bread",
                "long_description": "Handcrafted sourdough bread made with natural starter. Crispy crust, soft interior, complex flavors. No preservatives or additives.",
                "image": "https://images.unsplash.com/photo-1549931319-a545dcf3bc7c?w=800",
                "unit_price": 6.00,
                "bulk_price": 4.20,
                "total_stock": 100,
                "features": ["Handcrafted", "Natural Starter", "No Preservatives", "Traditional Recipe"],
                "requirements": ["Best consumed within 3 days", "Can be frozen"],
                "shipping_info": "Paper bags",
                "estimated_delivery": "Same day"
            },
            {
                "name": "Artisan Pastry Selection",
                "category": "Grocery",
                "description": "Assorted fresh pastries",
                "long_description": "A delightful selection of croissants, danishes, and muffins. Freshly baked daily using premium ingredients. Perfect for breakfast or snacks.",
                "image": "https://images.unsplash.com/photo-1509440159596-0249088772ff?w=800",
                "unit_price": 12.00,
                "bulk_price": 8.40,
                "total_stock": 80,
                "features": ["Freshly Baked", "Premium Ingredients", "Variety", "Buttery Layers"],
                "requirements": ["Best same day", "Can refrigerate for 2 days"],
                "shipping_info": "Bakery boxes",
                "estimated_delivery": "Same day"
            }
        ]
    },
    "Ocean Fresh Imports": {
        "email": "ocean@fresh.co.zw",
        "groups": [
            {
                "name": "Frozen Prawns",
                "category": "Fish & Kapenta",
                "description": "Premium frozen prawns",
                "long_description": "Large tiger prawns, individually quick frozen. Perfect for grilling, stir-fries, or curries. Sustainably sourced.",
                "image": "https://images.unsplash.com/photo-1565680018434-b513d5e5fd47?w=800",
                "unit_price": 22.00,
                "bulk_price": 15.40,
                "total_stock": 150,
                "features": ["Tiger Prawns", "IQF Frozen", "Large Size", "Sustainably Sourced"],
                "requirements": ["Keep frozen", "Thaw in refrigerator"],
                "shipping_info": "Temperature-controlled",
                "estimated_delivery": "Same day"
            },
            {
                "name": "Smoked Salmon",
                "category": "Fish & Kapenta",
                "description": "Premium smoked salmon fillets",
                "long_description": "Cold-smoked Atlantic salmon fillets. Rich, delicate flavor. Perfect for breakfast, salads, or appetizers. Vacuum-sealed freshness.",
                "image": "https://images.unsplash.com/photo-1574781330855-d0db8cc6a79c?w=800",
                "unit_price": 28.00,
                "bulk_price": 19.60,
                "total_stock": 100,
                "features": ["Cold-Smoked", "Atlantic Salmon", "Vacuum-Sealed", "Premium Quality"],
                "requirements": ["Keep refrigerated", "Use within 1 week"],
                "shipping_info": "Chilled delivery",
                "estimated_delivery": "Same day"
            }
        ]
    },
    "TechHub Electronics": {
        "email": "techhub@electronics.co.zw",
        "groups": [
            {
                "name": "Wireless Bluetooth Earbuds",
                "category": "Electronics & Appliances",
                "description": "Premium wireless earbuds with charging case",
                "long_description": "High-quality Bluetooth 5.0 earbuds with noise cancellation. 24-hour battery life with charging case. Crystal clear sound, comfortable fit.",
                "image": "https://images.unsplash.com/photo-1590658268037-6bf12165a8df?w=800",
                "unit_price": 45.00,
                "bulk_price": 31.50,
                "total_stock": 200,
                "features": ["Bluetooth 5.0", "Noise Cancellation", "24hr Battery", "Charging Case"],
                "requirements": ["1 year warranty", "Keep away from water"],
                "shipping_info": "Secure packaging",
                "estimated_delivery": "2-3 days"
            },
            {
                "name": "USB-C Fast Charger",
                "category": "Electronics & Appliances",
                "description": "65W USB-C fast charging adapter",
                "long_description": "Universal 65W USB-C charger compatible with laptops, tablets, and phones. Fast charging technology, multiple safety protections. Compact design.",
                "image": "https://images.unsplash.com/photo-1583863788434-e58a36330cf0?w=800",
                "unit_price": 25.00,
                "bulk_price": 17.50,
                "total_stock": 300,
                "features": ["65W Power", "Universal Compatible", "Fast Charging", "Safety Protected"],
                "requirements": ["1 year warranty", "Surge protection"],
                "shipping_info": "Standard delivery",
                "estimated_delivery": "2-3 days"
            }
        ]
    },
    "Premium Roasters Ltd": {
        "email": "premium@roasters.co.zw",
        "groups": [
            {
                "name": "Specialty Coffee Blend",
                "category": "Beverages",
                "description": "Premium roasted coffee blend",
                "long_description": "Our signature blend of Central American and African beans. Medium roast, balanced flavor profile. Perfect for all brewing methods.",
                "image": "https://images.unsplash.com/photo-1559056199-641a0ac8b55e?w=800",
                "unit_price": 22.00,
                "bulk_price": 15.40,
                "total_stock": 250,
                "features": ["Specialty Grade", "Freshly Roasted", "Balanced Profile", "Versatile Brewing"],
                "requirements": ["Store in airtight container", "Best within 2 months"],
                "shipping_info": "Resealable bags",
                "estimated_delivery": "2-3 days"
            },
            {
                "name": "Coffee Brewing Equipment Set",
                "category": "Household Items",
                "description": "Complete coffee brewing kit",
                "long_description": "Professional-grade pour-over set including dripper, filters, coffee scale, and gooseneck kettle. Everything you need for perfect coffee at home.",
                "image": "https://images.unsplash.com/photo-1517668808822-9ebb02f2a0e6?w=800",
                "unit_price": 65.00,
                "bulk_price": 45.50,
                "total_stock": 50,
                "features": ["Professional Grade", "Complete Set", "Precision Scale", "Gooseneck Kettle"],
                "requirements": ["Hand wash recommended", "1 year warranty"],
                "shipping_info": "Careful packaging",
                "estimated_delivery": "3-5 days"
            }
        ]
    }
}

def populate_all_suppliers():
    """Populate all suppliers with their respective group buys"""
    
    db: Session = SessionLocal()
    
    try:
        total_groups_created = 0
        suppliers_populated = 0
        
        for company_name, supplier_data in SUPPLIERS_DATA.items():
            if not supplier_data["groups"]:  # Skip if already populated
                print(f"\n⊙ Skipping {company_name} (already populated)")
                continue
                
            # Find supplier
            supplier = db.query(User).filter(
                User.email == supplier_data["email"]
            ).first()
            
            if not supplier:
                print(f"\n✗ Supplier not found: {company_name}")
                continue
            
            print(f"\n→ Populating {company_name}...")
            
            # Delete existing groups for this supplier
            deleted = db.query(AdminGroup).filter(
                AdminGroup.supplier_id == supplier.id
            ).delete()
            db.commit()
            
            if deleted > 0:
                print(f"  Cleared {deleted} existing groups")
            
            # Create new groups
            groups_created = 0
            for group_data in supplier_data["groups"]:
                end_date = datetime.utcnow() + timedelta(days=7)
                
                admin_group = AdminGroup(
                    name=group_data["name"],
                    description=group_data["description"],
                    long_description=group_data["long_description"],
                    category=group_data["category"],
                    price=group_data["bulk_price"],
                    original_price=group_data["unit_price"],
                    image=group_data["image"],
                    max_participants=50,
                    participants=0,
                    end_date=end_date,
                    supplier_id=supplier.id,
                    admin_name=company_name,
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
            print(f"  ✓ Created {groups_created} group buys")
            total_groups_created += groups_created
            suppliers_populated += 1
        
        print("\n" + "="*70)
        print("SUCCESS! All suppliers populated with mock data")
        print("="*70)
        print(f"\nSummary:")
        print(f"  Suppliers populated: {suppliers_populated}")
        print(f"  Total group buys created: {total_groups_created}")
        print(f"\nAll group buys are now available in:")
        print(f"  - Trader's 'Browse Groups' (/all-groups)")
        print(f"  - Admin's 'Group Moderation' (/moderation)")
        print("\n" + "="*70)
        
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
    print("="*70)
    print("POPULATE ALL SUPPLIERS WITH MOCK DATA")
    print("="*70)
    
    success = populate_all_suppliers()
    
    if success:
        print("\n✓ All suppliers are now ready with mock data!")
        print("\nSupplier Login Credentials:")
        print("  Password for all: supplier123")
        print("\nSupplier Emails:")
        for company, data in SUPPLIERS_DATA.items():
            if data["groups"]:  # Only show if it has groups
                print(f"  - {data['email']}")
    else:
        print("\n✗ Failed to populate suppliers")

