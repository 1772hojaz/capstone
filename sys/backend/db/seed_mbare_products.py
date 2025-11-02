#!/usr/bin/env python3
"""
Seed 74 Real Mbare Musika Products
Based on actual product catalog from tf_vs_sklearn_recommender_mbare.ipynb
"""

from db.database import SessionLocal
from models.models import Product
from datetime import datetime

# Real Mbare Musika product catalog (from notebook)
MBARE_PRODUCTS = [
    # Fruits
    ("Apples", "Fruits", 1.50, 1.275),
    ("Avocado", "Fruits", 2.00, 1.700),
    ("Banana", "Fruits", 0.80, 0.680),
    ("Lemon", "Fruits", 1.20, 1.020),
    ("Oranges", "Fruits", 1.00, 0.850),
    ("Pawpaw", "Fruits", 1.50, 1.275),
    ("Pineapples", "Fruits", 2.50, 2.125),
    ("Strawberries", "Fruits", 3.00, 2.550),
    ("Watermelon", "Fruits", 4.00, 3.400),
    ("Sour Fruit (Masawu)", "Fruits", 1.00, 0.850),
    ("Snot Apple (Matohwe)", "Fruits", 0.80, 0.680),
    ("Baobab Fruit (Mauyu)", "Fruits", 1.50, 1.275),
    ("Sugarcane", "Fruits", 0.50, 0.425),

    # Vegetables
    ("Baby Marrow", "Vegetables", 1.20, 1.020),
    ("Beetroot", "Vegetables", 0.90, 0.765),
    ("Broccoli", "Vegetables", 1.50, 1.275),
    ("Butternut", "Vegetables", 1.00, 0.850),
    ("Butternut (Bulk)", "Vegetables", 0.80, 0.680),
    ("Button Mushroom", "Vegetables", 2.50, 2.125),
    ("Cabbage", "Vegetables", 0.70, 0.595),
    ("Carrots", "Vegetables", 0.60, 0.510),
    ("Carrots (Bulk)", "Vegetables", 0.50, 0.425),
    ("Cauliflower", "Vegetables", 1.30, 1.105),
    ("Chili Pepper", "Vegetables", 0.40, 0.340),
    ("Covo", "Vegetables", 0.50, 0.425),
    ("Cucumber (Bulk)", "Vegetables", 0.60, 0.510),
    ("Garlic", "Vegetables", 1.00, 0.850),
    ("Ginger", "Vegetables", 1.50, 1.275),
    ("Green Beans (Bulk)", "Vegetables", 1.20, 1.020),
    ("Green Maize", "Vegetables", 0.40, 0.340),
    ("Green Pepper (Bulk)", "Vegetables", 0.80, 0.680),
    ("Lettuce", "Vegetables", 0.60, 0.510),
    ("Okra", "Vegetables", 0.90, 0.765),
    ("Onions", "Vegetables", 0.50, 0.425),
    ("Oyster Mushroom", "Vegetables", 3.00, 2.550),
    ("Peas (Bulk)", "Vegetables", 1.00, 0.850),
    ("Large Potatoes", "Vegetables", 0.60, 0.510),
    ("Medium Potatoes", "Vegetables", 0.50, 0.425),
    ("Rape", "Vegetables", 0.40, 0.340),
    ("Pumpkins", "Vegetables", 1.20, 1.020),
    ("Red Pepper", "Vegetables", 0.90, 0.765),
    ("Sweet Potatoes", "Vegetables", 0.70, 0.595),
    ("Sweet Potatoes (Bulk)", "Vegetables", 0.60, 0.510),
    ("Gogoya Taro", "Vegetables", 1.00, 0.850),
    ("Tomatoes", "Vegetables", 0.80, 0.680),
    ("Tomatoes (Small)", "Vegetables", 0.60, 0.510),
    ("Tomatoes (Units)", "Vegetables", 0.50, 0.425),
    ("Tsunga", "Vegetables", 0.40, 0.340),
    ("Yams (Madhumbe)", "Vegetables", 0.90, 0.765),
    ("Yellow Pepper", "Vegetables", 0.90, 0.765),

    # Grains
    ("Traditional Rice (Dehulled)", "Grains", 1.50, 1.275),
    ("Dried Maize", "Grains", 0.40, 0.340),
    ("White Sorghum (Mapfunde)", "Grains", 1.00, 0.850),
    ("Pearl Millet (Mhunga)", "Grains", 0.80, 0.680),
    ("Cooked Dried Maize (Mumhare)", "Grains", 0.60, 0.510),
    ("Popcorn", "Grains", 0.70, 0.595),
    ("Finger Millet (Zviyo)", "Grains", 0.90, 0.765),

    # Legumes
    ("Cooked Dried Groundnuts", "Legumes", 1.20, 1.020),
    ("Cow Peas (Nyemba)", "Legumes", 1.00, 0.850),
    ("Groundnuts (Nzungu)", "Legumes", 1.50, 1.275),
    ("Soya Beans", "Legumes", 1.30, 1.105),
    ("Sugar Beans", "Legumes", 1.10, 0.935),

    # Dried Vegetables
    ("Dried Black Jack", "Dried Vegetables", 0.80, 0.680),
    ("Dried Cabbage", "Dried Vegetables", 0.60, 0.510),
    ("Dried Covo", "Dried Vegetables", 0.50, 0.425),
    ("Dried Cow Peas Leaves", "Dried Vegetables", 0.70, 0.595),

    # Poultry
    ("Broilers", "Poultry", 5.00, 4.250),
    ("Eggs", "Poultry", 0.30, 0.255),
    ("Guinea Fowl Hanga", "Poultry", 6.00, 5.100),
    ("Off Layers", "Poultry", 4.00, 3.400),
    ("Roadrunner Chickens", "Poultry", 4.50, 3.825),
    ("Turkey", "Poultry", 8.00, 6.800),

    # Protein
    ("Mopane Worms (Madora)", "Protein", 3.00, 2.550),

    # Fish
    ("Kapenta (Matemba)", "Fish", 2.50, 2.125),
]


def seed_mbare_products():
    """Seed the database with 74 real Mbare Musika products"""
    
    print("=" * 60)
    print("🌽 Seeding Real Mbare Musika Products")
    print("=" * 60)
    
    db = SessionLocal()
    
    try:
        # Check if products already exist
        existing_count = db.query(Product).count()
        
        if existing_count >= 70:
            print(f"\n⚠️  Database already has {existing_count} products")
            response = input("Re-seed anyway? This will DELETE existing products (y/N): ")
            if response.lower() != 'y':
                print("Cancelled.")
                return
            
            # Delete existing products
            print(f"Deleting {existing_count} existing products...")
            db.query(Product).delete()
            db.commit()
        
        print(f"\n📦 Creating {len(MBARE_PRODUCTS)} Mbare Musika products...")
        
        created_count = 0
        for product_name, category, retail_price, wholesale_price in MBARE_PRODUCTS:
            # Calculate base price (midpoint)
            base_price = (retail_price + wholesale_price) / 2
            
            # MOQ based on product type
            if category in ["Grains", "Legumes"]:
                moq = 50  # Bulk staples
            elif category in ["Vegetables", "Fruits"]:
                moq = 30  # Fresh produce
            elif category == "Poultry":
                moq = 20  # Livestock
            elif category in ["Protein", "Fish"]:
                moq = 25  # Protein sources
            else:
                moq = 40  # Default
            
            # Create product description
            description = f"Fresh {product_name} from Mbare Musika market. High quality {category.lower()} perfect for retail and wholesale. Bulk discounts available."
            
            # Image URL (placeholder)
            image_url = f"https://via.placeholder.com/300x200?text={product_name.replace(' ', '+')}"
            
            product = Product(
                name=product_name,
                description=description,
                image_url=image_url,
                unit_price=retail_price,
                bulk_price=wholesale_price,
                unit_price_zig=retail_price * 28.5,  # Approximate ZiG exchange rate
                bulk_price_zig=wholesale_price * 28.5,
                moq=moq,
                category=category,
                is_active=True,
                created_at=datetime.utcnow()
            )
            
            db.add(product)
            created_count += 1
            
            # Commit in batches
            if created_count % 10 == 0:
                db.commit()
                print(f"  Created {created_count}/{len(MBARE_PRODUCTS)} products...")
        
        # Final commit
        db.commit()
        
        print("\n" + "=" * 60)
        print("✅ Seeding Complete!")
        print("=" * 60)
        
        # Summary by category
        print("\n📊 Product Summary by Category:")
        for category in sorted(set(cat for _, cat, _, _ in MBARE_PRODUCTS)):
            count = sum(1 for _, cat, _, _ in MBARE_PRODUCTS if cat == category)
            print(f"   - {category}: {count} products")
        
        print(f"\n✅ Total Products: {created_count}")
        print(f"\n🎯 Ready for Mbare trader seeding!")
        print(f"   Next step: python seed_mbare_data.py")
        
    except Exception as e:
        print(f"\n❌ Error: {e}")
        import traceback
        traceback.print_exc()
        db.rollback()
    finally:
        db.close()


if __name__ == "__main__":
    seed_mbare_products()
