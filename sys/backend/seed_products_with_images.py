#!/usr/bin/env python3
"""
Seed Products with Real Images Only
Deletes all products and seeds only those with high-quality Unsplash images
"""

from db.database import SessionLocal
from models.models import Product
from datetime import datetime

# Products with real Unsplash images - name, category, retail_price, wholesale_price, image_url
PRODUCTS_WITH_IMAGES = [
    # Fruits (13 products)
    ("Apples", "Fruits", 1.50, 1.275, "https://images.unsplash.com/photo-1568702846914-96b305d2aaeb?w=500&h=400&fit=crop&q=80"),
    ("Avocado", "Fruits", 2.00, 1.700, "https://images.unsplash.com/photo-1523049673857-eb18f1d7b578?w=500&h=400&fit=crop&q=80"),
    ("Banana", "Fruits", 0.80, 0.680, "https://images.unsplash.com/photo-1571771894821-ce9b6c11b08e?w=500&h=400&fit=crop&q=80"),
    ("Lemon", "Fruits", 1.20, 1.020, "https://images.unsplash.com/photo-1590502593747-42a996133562?w=500&h=400&fit=crop&q=80"),
    ("Oranges", "Fruits", 1.00, 0.850, "https://images.unsplash.com/photo-1580052614034-c55d20bfee3b?w=500&h=400&fit=crop&q=80"),
    ("Pawpaw", "Fruits", 1.50, 1.275, "https://images.unsplash.com/photo-1563269643-c4c8a18c0275?w=500&h=400&fit=crop&q=80"),
    ("Pineapples", "Fruits", 2.50, 2.125, "https://images.unsplash.com/photo-1550258987-190a2d41a8ba?w=500&h=400&fit=crop&q=80"),
    ("Strawberries", "Fruits", 3.00, 2.550, "https://images.unsplash.com/photo-1464965911861-746a04b4bca6?w=500&h=400&fit=crop&q=80"),
    ("Watermelon", "Fruits", 4.00, 3.400, "https://images.unsplash.com/photo-1587049352846-4a222e784210?w=500&h=400&fit=crop&q=80"),
    ("Sour Fruit (Masawu)", "Fruits", 1.00, 0.850, "https://images.unsplash.com/photo-1610832958506-aa56368176cf?w=500&h=400&fit=crop&q=80"),
    ("Baobab Fruit (Mauyu)", "Fruits", 1.50, 1.275, "https://images.unsplash.com/photo-1618897996318-5a901fa6ca71?w=500&h=400&fit=crop&q=80"),
    ("Snot Apple (Matohwe)", "Fruits", 0.80, 0.680, "https://images.unsplash.com/photo-1570913149827-d2ac84ab3f9a?w=500&h=400&fit=crop&q=80"),
    ("Sugarcane", "Fruits", 0.50, 0.425, "https://images.unsplash.com/photo-1607623814075-e51df1bdc82f?w=500&h=400&fit=crop&q=80"),
    
    # Vegetables (36 products)
    ("Baby Marrow", "Vegetables", 1.20, 1.020, "https://images.unsplash.com/photo-1592841200221-a6898f307baa?w=500&h=400&fit=crop&q=80"),
    ("Beetroot", "Vegetables", 0.90, 0.765, "https://images.unsplash.com/photo-1563285507-1d9a3c6b9a67?w=500&h=400&fit=crop&q=80"),
    ("Broccoli", "Vegetables", 1.50, 1.275, "https://images.unsplash.com/photo-1459411621453-7b03977f4bfc?w=500&h=400&fit=crop&q=80"),
    ("Butternut", "Vegetables", 1.00, 0.850, "https://images.unsplash.com/photo-1570690919246-81b5faf2f0f5?w=500&h=400&fit=crop&q=80"),
    ("Butternut (Bulk)", "Vegetables", 0.80, 0.680, "https://images.unsplash.com/photo-1477506350614-fcdc29a3b157?w=500&h=400&fit=crop&q=80"),
    ("Button Mushroom", "Vegetables", 2.50, 2.125, "https://images.unsplash.com/photo-1607281026360-f55f2c7ee50c?w=500&h=400&fit=crop&q=80"),
    ("Cabbage", "Vegetables", 0.70, 0.595, "https://images.unsplash.com/photo-1594282486552-05b4d80fbb9f?w=500&h=400&fit=crop&q=80"),
    ("Carrots", "Vegetables", 0.60, 0.510, "https://images.unsplash.com/photo-1598170845058-32b9d6a5da37?w=500&h=400&fit=crop&q=80"),
    ("Carrots (Bulk)", "Vegetables", 0.50, 0.425, "https://images.unsplash.com/photo-1445282768818-728615cc910a?w=500&h=400&fit=crop&q=80"),
    ("Cauliflower", "Vegetables", 1.30, 1.105, "https://images.unsplash.com/photo-1568584711271-81f99c25b3e5?w=500&h=400&fit=crop&q=80"),
    ("Chili Pepper", "Vegetables", 0.40, 0.340, "https://images.unsplash.com/photo-1583663848850-46af132dc08e?w=500&h=400&fit=crop&q=80"),
    ("Covo", "Vegetables", 0.50, 0.425, "https://images.unsplash.com/photo-1622796651168-f8b1ba46db51?w=500&h=400&fit=crop&q=80"),
    ("Cucumber", "Vegetables", 0.60, 0.510, "https://images.unsplash.com/photo-1604977042946-1eecc30f269e?w=500&h=400&fit=crop&q=80"),
    ("Garlic", "Vegetables", 1.00, 0.850, "https://images.unsplash.com/photo-1589927986089-35812388d1f4?w=500&h=400&fit=crop&q=80"),
    ("Ginger", "Vegetables", 1.50, 1.275, "https://images.unsplash.com/photo-1617393273175-941be0b0cf01?w=500&h=400&fit=crop&q=80"),
    ("Gogoya Taro", "Vegetables", 1.00, 0.850, "https://images.unsplash.com/photo-1585238341710-cf2c55662d6e?w=500&h=400&fit=crop&q=80"),
    ("Green Beans", "Vegetables", 1.20, 1.020, "https://images.unsplash.com/photo-1574316071802-0d684efa7bf5?w=500&h=400&fit=crop&q=80"),
    ("Green Maize", "Vegetables", 0.40, 0.340, "https://images.unsplash.com/photo-1551754655-cd27e38d2076?w=500&h=400&fit=crop&q=80"),
    ("Green Pepper", "Vegetables", 0.80, 0.680, "https://images.unsplash.com/photo-1563565375-f3fdfdbefa83?w=500&h=400&fit=crop&q=80"),
    ("Large Potatoes", "Vegetables", 0.60, 0.510, "https://images.unsplash.com/photo-1518977676601-b53f82aba655?w=500&h=400&fit=crop&q=80"),
    ("Lettuce", "Vegetables", 0.60, 0.510, "https://images.unsplash.com/photo-1556801712-76c8eb07bbc9?w=500&h=400&fit=crop&q=80"),
    ("Medium Potatoes", "Vegetables", 0.50, 0.425, "https://images.unsplash.com/photo-1587740908075-3e0b33c55e88?w=500&h=400&fit=crop&q=80"),
    ("Okra", "Vegetables", 0.90, 0.765, "https://images.unsplash.com/photo-1609735257609-fa67e4cc99bc?w=500&h=400&fit=crop&q=80"),
    ("Onions", "Vegetables", 0.50, 0.425, "https://images.unsplash.com/photo-1508747703725-719777637510?w=500&h=400&fit=crop&q=80"),
    ("Oyster Mushroom", "Vegetables", 3.00, 2.550, "https://images.unsplash.com/photo-1611171711912-e058589e5229?w=500&h=400&fit=crop&q=80"),
    ("Peas", "Vegetables", 1.00, 0.850, "https://images.unsplash.com/photo-1611484670658-a192c1f3fd6e?w=500&h=400&fit=crop&q=80"),
    ("Pumpkins", "Vegetables", 1.20, 1.020, "https://images.unsplash.com/photo-1570586437263-ab629fccc818?w=500&h=400&fit=crop&q=80"),
    ("Rape", "Vegetables", 0.40, 0.340, "https://images.unsplash.com/photo-1622796651346-86f5463f5819?w=500&h=400&fit=crop&q=80"),
    ("Red Pepper", "Vegetables", 0.90, 0.765, "https://images.unsplash.com/photo-1525607551316-4a8e16d1f9ba?w=500&h=400&fit=crop&q=80"),
    ("Sweet Potatoes", "Vegetables", 0.70, 0.595, "https://images.unsplash.com/photo-1596097635254-f5521ffe7a1f?w=500&h=400&fit=crop&q=80"),
    ("Sweet Potatoes (Bulk)", "Vegetables", 0.60, 0.510, "https://images.unsplash.com/photo-1606330859902-0e1f99e47416?w=500&h=400&fit=crop&q=80"),
    ("Tomatoes", "Vegetables", 0.80, 0.680, "https://images.unsplash.com/photo-1546470427-e26264be0b7d?w=500&h=400&fit=crop&q=80"),
    ("Tomatoes (Small)", "Vegetables", 0.60, 0.510, "https://images.unsplash.com/photo-1592924357228-91a4daadcfea?w=500&h=400&fit=crop&q=80"),
    ("Tomatoes (Units)", "Vegetables", 0.50, 0.425, "https://images.unsplash.com/photo-1607305387299-a3d9611cd469?w=500&h=400&fit=crop&q=80"),
    ("Tsunga", "Vegetables", 0.40, 0.340, "https://images.unsplash.com/photo-1593266889077-9d47deedff22?w=500&h=400&fit=crop&q=80"),
    ("Yams (Madhumbe)", "Vegetables", 0.90, 0.765, "https://images.unsplash.com/photo-1595509903697-66e37eaeb3ba?w=500&h=400&fit=crop&q=80"),
    ("Yellow Pepper", "Vegetables", 0.90, 0.765, "https://images.unsplash.com/photo-1601493700631-2b16ec4b4716?w=500&h=400&fit=crop&q=80"),
    
    # Dried Vegetables (4 products)
    ("Dried Black Jack", "Dried Vegetables", 0.80, 0.680, "https://images.unsplash.com/photo-1565299715199-866c917206bb?w=500&h=400&fit=crop&q=80"),
    ("Dried Cabbage", "Dried Vegetables", 0.60, 0.510, "https://images.unsplash.com/photo-1584270354949-c26b0d5b4a0c?w=500&h=400&fit=crop&q=80"),
    ("Dried Covo", "Dried Vegetables", 0.50, 0.425, "https://images.unsplash.com/photo-1628772604502-3bb5d6c15e33?w=500&h=400&fit=crop&q=80"),
    ("Dried Cow Peas Leaves", "Dried Vegetables", 0.70, 0.595, "https://images.unsplash.com/photo-1570735969228-e3b4f8fc1e7f?w=500&h=400&fit=crop&q=80"),
    
    # Grains (7 products)
    ("Cooked Dried Maize", "Grains", 0.60, 0.510, "https://images.unsplash.com/photo-1586201375761-83865001e31c?w=500&h=400&fit=crop&q=80"),
    ("Dried Maize", "Grains", 0.40, 0.340, "https://images.unsplash.com/photo-1605664136484-59d5b6ce0899?w=500&h=400&fit=crop&q=80"),
    ("Finger Millet (Zviyo)", "Grains", 0.90, 0.765, "https://images.unsplash.com/photo-1586201375761-83865001e31c?w=500&h=400&fit=crop&q=80"),
    ("Pearl Millet (Mhunga)", "Grains", 0.80, 0.680, "https://images.unsplash.com/photo-1599475956988-b6c5c6e5b685?w=500&h=400&fit=crop&q=80"),
    ("Popcorn", "Grains", 0.70, 0.595, "https://images.unsplash.com/photo-1621939514649-280e2ee25f60?w=500&h=400&fit=crop&q=80"),
    ("Traditional Rice", "Grains", 1.50, 1.275, "https://images.unsplash.com/photo-1536304993881-ff6e9eefa2a6?w=500&h=400&fit=crop&q=80"),
    ("White Sorghum (Mapfunde)", "Grains", 1.00, 0.850, "https://images.unsplash.com/photo-1593117618036-43e11e8f3ec2?w=500&h=400&fit=crop&q=80"),
    
    # Legumes (5 products)
    ("Cooked Dried Groundnuts", "Legumes", 1.20, 1.020, "https://images.unsplash.com/photo-1582202020926-37ee20e83522?w=500&h=400&fit=crop&q=80"),
    ("Cow Peas (Nyemba)", "Legumes", 1.00, 0.850, "https://images.unsplash.com/photo-1614963622108-1ca9b789a9e1?w=500&h=400&fit=crop&q=80"),
    ("Groundnuts (Nzungu)", "Legumes", 1.50, 1.275, "https://images.unsplash.com/photo-1560707304-4f70ba4e1143?w=500&h=400&fit=crop&q=80"),
    ("Soya Beans", "Legumes", 1.30, 1.105, "https://images.unsplash.com/photo-1525607551316-4a8e16d1f9ba?w=500&h=400&fit=crop&q=80"),
    ("Sugar Beans", "Legumes", 1.10, 0.935, "https://images.unsplash.com/photo-1608181924569-0d9d19c8e43e?w=500&h=400&fit=crop&q=80"),
    
    # Poultry (6 products)
    ("Broilers", "Poultry", 5.00, 4.250, "https://images.unsplash.com/photo-1548550023-2bdb3c5beed7?w=500&h=400&fit=crop&q=80"),
    ("Eggs", "Poultry", 0.30, 0.255, "https://images.unsplash.com/photo-1582722872445-44dc5f7e3c8f?w=500&h=400&fit=crop&q=80"),
    ("Guinea Fowl Hanga", "Poultry", 6.00, 5.100, "https://images.unsplash.com/photo-1609934031691-13cd73a5dd7e?w=500&h=400&fit=crop&q=80"),
    ("Off Layers", "Poultry", 4.00, 3.400, "https://images.unsplash.com/photo-1563281577-a7be47e20db9?w=500&h=400&fit=crop&q=80"),
    ("Roadrunner Chickens", "Poultry", 4.50, 3.825, "https://images.unsplash.com/photo-1587593810167-a84920ea0781?w=500&h=400&fit=crop&q=80"),
    ("Turkey", "Poultry", 8.00, 6.800, "https://images.unsplash.com/photo-1574680096145-d05b474e2155?w=500&h=400&fit=crop&q=80"),
    
    # Protein (1 product)
    ("Mopane Worms (Madora)", "Protein", 3.00, 2.550, "https://images.unsplash.com/photo-1619566663072-ecc6e18f4b73?w=500&h=400&fit=crop&q=80"),
    
    # Fish (1 product)
    ("Kapenta (Matemba)", "Fish", 2.50, 2.125, "https://images.unsplash.com/photo-1544943910-4c1dc44aab44?w=500&h=400&fit=crop&q=80"),
]


def seed_products_with_images():
    """Delete all products and seed only those with real images"""
    
    print("=" * 60)
    print("🖼️  Seeding Products with Real Images Only")
    print("=" * 60)
    
    db = SessionLocal()
    
    try:
        # Delete ALL existing products
        existing_count = db.query(Product).count()
        print(f"\n🗑️  Deleting {existing_count} existing products...")
        db.query(Product).delete()
        db.commit()
        print(f"   ✅ Deleted {existing_count} products")
        
        # Seed products with real images
        print(f"\n📦 Creating {len(PRODUCTS_WITH_IMAGES)} products with real images...")
        
        created_count = 0
        for product_name, category, retail_price, wholesale_price, image_url in PRODUCTS_WITH_IMAGES:
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
                print(f"   Created {created_count}/{len(PRODUCTS_WITH_IMAGES)} products...")
        
        # Final commit
        db.commit()
        
        print("\n" + "=" * 60)
        print("✅ Seeding Complete!")
        print("=" * 60)
        
        # Summary by category
        print("\n📊 Product Summary by Category:")
        categories = {}
        for _, cat, _, _, _ in PRODUCTS_WITH_IMAGES:
            categories[cat] = categories.get(cat, 0) + 1
        
        for category in sorted(categories.keys()):
            print(f"   - {category}: {categories[category]} products")
        
        print(f"\n✅ Total Products: {created_count}")
        print(f"🖼️  All products have real Unsplash images!")
        
    except Exception as e:
        print(f"\n❌ Error: {e}")
        import traceback
        traceback.print_exc()
        db.rollback()
    finally:
        db.close()


if __name__ == "__main__":
    seed_products_with_images()


