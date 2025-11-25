#!/usr/bin/env python3
"""
Update Product Images with Real URLs
Replaces placeholder images with actual high-quality product images from Unsplash
"""

import sqlite3
from typing import Dict

def get_product_image_mapping() -> Dict[str, str]:
    """
    Map product names to high-quality Unsplash image URLs
    Format: https://images.unsplash.com/photo-[id]?w=500&h=400&fit=crop&q=80
    """
    return {
        # Fruits
        "Apples": "https://images.unsplash.com/photo-1568702846914-96b305d2aaeb?w=500&h=400&fit=crop&q=80",
        "Avocado": "https://images.unsplash.com/photo-1523049673857-eb18f1d7b578?w=500&h=400&fit=crop&q=80",
        "Banana": "https://images.unsplash.com/photo-1571771894821-ce9b6c11b08e?w=500&h=400&fit=crop&q=80",
        "Lemon": "https://images.unsplash.com/photo-1590502593747-42a996133562?w=500&h=400&fit=crop&q=80",
        "Oranges": "https://images.unsplash.com/photo-1580052614034-c55d20bfee3b?w=500&h=400&fit=crop&q=80",
        "Pawpaw": "https://images.unsplash.com/photo-1563269643-c4c8a18c0275?w=500&h=400&fit=crop&q=80",
        "Pineapples": "https://images.unsplash.com/photo-1550258987-190a2d41a8ba?w=500&h=400&fit=crop&q=80",
        "Strawberries": "https://images.unsplash.com/photo-1464965911861-746a04b4bca6?w=500&h=400&fit=crop&q=80",
        "Watermelon": "https://images.unsplash.com/photo-1587049352846-4a222e784210?w=500&h=400&fit=crop&q=80",
        "Sour Fruit (Masawu)": "https://images.unsplash.com/photo-1610832958506-aa56368176cf?w=500&h=400&fit=crop&q=80",
        "Baobab Fruit (Mauyu)": "https://images.unsplash.com/photo-1618897996318-5a901fa6ca71?w=500&h=400&fit=crop&q=80",
        "Snot Apple (Matohwe)": "https://images.unsplash.com/photo-1570913149827-d2ac84ab3f9a?w=500&h=400&fit=crop&q=80",
        "Sugarcane": "https://images.unsplash.com/photo-1607623814075-e51df1bdc82f?w=500&h=400&fit=crop&q=80",
        "Test New Mango (Just Uploaded)": "https://images.unsplash.com/photo-1553279768-865429fa0078?w=500&h=400&fit=crop&q=80",
        "FRESH STRAWBERRIES - Just Added": "https://images.unsplash.com/photo-1543528176-61b239494933?w=500&h=400&fit=crop&q=80",
        
        # Vegetables
        "Baby Marrow": "https://images.unsplash.com/photo-1592841200221-a6898f307baa?w=500&h=400&fit=crop&q=80",
        "Beetroot": "https://images.unsplash.com/photo-1563285507-1d9a3c6b9a67?w=500&h=400&fit=crop&q=80",
        "Broccoli": "https://images.unsplash.com/photo-1459411621453-7b03977f4bfc?w=500&h=400&fit=crop&q=80",
        "Butternut": "https://images.unsplash.com/photo-1570690919246-81b5faf2f0f5?w=500&h=400&fit=crop&q=80",
        "Butternut (Bulk)": "https://images.unsplash.com/photo-1477506350614-fcdc29a3b157?w=500&h=400&fit=crop&q=80",
        "Button Mushroom": "https://images.unsplash.com/photo-1607281026360-f55f2c7ee50c?w=500&h=400&fit=crop&q=80",
        "Cabbage": "https://images.unsplash.com/photo-1594282486552-05b4d80fbb9f?w=500&h=400&fit=crop&q=80",
        "Carrots": "https://images.unsplash.com/photo-1598170845058-32b9d6a5da37?w=500&h=400&fit=crop&q=80",
        "Carrots (Bulk)": "https://images.unsplash.com/photo-1445282768818-728615cc910a?w=500&h=400&fit=crop&q=80",
        "Cauliflower": "https://images.unsplash.com/photo-1568584711271-81f99c25b3e5?w=500&h=400&fit=crop&q=80",
        "Chili Pepper": "https://images.unsplash.com/photo-1583663848850-46af132dc08e?w=500&h=400&fit=crop&q=80",
        "Covo": "https://images.unsplash.com/photo-1622796651168-f8b1ba46db51?w=500&h=400&fit=crop&q=80",
        "Cucumber (Bulk)": "https://images.unsplash.com/photo-1604977042946-1eecc30f269e?w=500&h=400&fit=crop&q=80",
        "Garlic": "https://images.unsplash.com/photo-1589927986089-35812388d1f4?w=500&h=400&fit=crop&q=80",
        "Ginger": "https://images.unsplash.com/photo-1617393273175-941be0b0cf01?w=500&h=400&fit=crop&q=80",
        "Gogoya Taro": "https://images.unsplash.com/photo-1585238341710-cf2c55662d6e?w=500&h=400&fit=crop&q=80",
        "Green Beans (Bulk)": "https://images.unsplash.com/photo-1574316071802-0d684efa7bf5?w=500&h=400&fit=crop&q=80",
        "Green Maize": "https://images.unsplash.com/photo-1551754655-cd27e38d2076?w=500&h=400&fit=crop&q=80",
        "Green Pepper (Bulk)": "https://images.unsplash.com/photo-1563565375-f3fdfdbefa83?w=500&h=400&fit=crop&q=80",
        "Large Potatoes": "https://images.unsplash.com/photo-1518977676601-b53f82aba655?w=500&h=400&fit=crop&q=80",
        "Lettuce": "https://images.unsplash.com/photo-1556801712-76c8eb07bbc9?w=500&h=400&fit=crop&q=80",
        "Medium Potatoes": "https://images.unsplash.com/photo-1587740908075-3e0b33c55e88?w=500&h=400&fit=crop&q=80",
        "Okra": "https://images.unsplash.com/photo-1609735257609-fa67e4cc99bc?w=500&h=400&fit=crop&q=80",
        "Onions": "https://images.unsplash.com/photo-1508747703725-719777637510?w=500&h=400&fit=crop&q=80",
        "Oyster Mushroom": "https://images.unsplash.com/photo-1611171711912-e058589e5229?w=500&h=400&fit=crop&q=80",
        "Peas (Bulk)": "https://images.unsplash.com/photo-1611484670658-a192c1f3fd6e?w=500&h=400&fit=crop&q=80",
        "Pumpkins": "https://images.unsplash.com/photo-1570586437263-ab629fccc818?w=500&h=400&fit=crop&q=80",
        "Rape": "https://images.unsplash.com/photo-1622796651346-86f5463f5819?w=500&h=400&fit=crop&q=80",
        "Red Pepper": "https://images.unsplash.com/photo-1525607551316-4a8e16d1f9ba?w=500&h=400&fit=crop&q=80",
        "Sweet Potatoes": "https://images.unsplash.com/photo-1596097635254-f5521ffe7a1f?w=500&h=400&fit=crop&q=80",
        "Sweet Potatoes (Bulk)": "https://images.unsplash.com/photo-1606330859902-0e1f99e47416?w=500&h=400&fit=crop&q=80",
        "Tomatoes": "https://images.unsplash.com/photo-1546470427-e26264be0b7d?w=500&h=400&fit=crop&q=80",
        "Tomatoes (Small)": "https://images.unsplash.com/photo-1592924357228-91a4daadcfea?w=500&h=400&fit=crop&q=80",
        "Tomatoes (Units)": "https://images.unsplash.com/photo-1607305387299-a3d9611cd469?w=500&h=400&fit=crop&q=80",
        "Tsunga": "https://images.unsplash.com/photo-1593266889077-9d47deedff22?w=500&h=400&fit=crop&q=80",
        "Yams (Madhumbe)": "https://images.unsplash.com/photo-1595509903697-66e37eaeb3ba?w=500&h=400&fit=crop&q=80",
        "Yellow Pepper": "https://images.unsplash.com/photo-1601493700631-2b16ec4b4716?w=500&h=400&fit=crop&q=80",
        
        # Dried Vegetables
        "Dried Black Jack": "https://images.unsplash.com/photo-1565299715199-866c917206bb?w=500&h=400&fit=crop&q=80",
        "Dried Cabbage": "https://images.unsplash.com/photo-1584270354949-c26b0d5b4a0c?w=500&h=400&fit=crop&q=80",
        "Dried Covo": "https://images.unsplash.com/photo-1628772604502-3bb5d6c15e33?w=500&h=400&fit=crop&q=80",
        "Dried Cow Peas Leaves": "https://images.unsplash.com/photo-1570735969228-e3b4f8fc1e7f?w=500&h=400&fit=crop&q=80",
        
        # Grains
        "Cooked Dried Maize (Mumhare)": "https://images.unsplash.com/photo-1586201375761-83865001e31c?w=500&h=400&fit=crop&q=80",
        "Dried Maize": "https://images.unsplash.com/photo-1605664136484-59d5b6ce0899?w=500&h=400&fit=crop&q=80",
        "Finger Millet (Zviyo)": "https://images.unsplash.com/photo-1586201375761-83865001e31c?w=500&h=400&fit=crop&q=80",
        "Pearl Millet (Mhunga)": "https://images.unsplash.com/photo-1599475956988-b6c5c6e5b685?w=500&h=400&fit=crop&q=80",
        "Popcorn": "https://images.unsplash.com/photo-1621939514649-280e2ee25f60?w=500&h=400&fit=crop&q=80",
        "Traditional Rice (Dehulled)": "https://images.unsplash.com/photo-1536304993881-ff6e9eefa2a6?w=500&h=400&fit=crop&q=80",
        "White Sorghum (Mapfunde)": "https://images.unsplash.com/photo-1593117618036-43e11e8f3ec2?w=500&h=400&fit=crop&q=80",
        
        # Legumes
        "Cooked Dried Groundnuts": "https://images.unsplash.com/photo-1582202020926-37ee20e83522?w=500&h=400&fit=crop&q=80",
        "Cow Peas (Nyemba)": "https://images.unsplash.com/photo-1614963622108-1ca9b789a9e1?w=500&h=400&fit=crop&q=80",
        "Groundnuts (Nzungu)": "https://images.unsplash.com/photo-1560707304-4f70ba4e1143?w=500&h=400&fit=crop&q=80",
        "Soya Beans": "https://images.unsplash.com/photo-1525607551316-4a8e16d1f9ba?w=500&h=400&fit=crop&q=80",
        "Sugar Beans": "https://images.unsplash.com/photo-1608181924569-0d9d19c8e43e?w=500&h=400&fit=crop&q=80",
        
        # Poultry
        "Broilers": "https://images.unsplash.com/photo-1548550023-2bdb3c5beed7?w=500&h=400&fit=crop&q=80",
        "Eggs": "https://images.unsplash.com/photo-1582722872445-44dc5f7e3c8f?w=500&h=400&fit=crop&q=80",
        "Guinea Fowl Hanga": "https://images.unsplash.com/photo-1609934031691-13cd73a5dd7e?w=500&h=400&fit=crop&q=80",
        "Off Layers": "https://images.unsplash.com/photo-1563281577-a7be47e20db9?w=500&h=400&fit=crop&q=80",
        "Roadrunner Chickens": "https://images.unsplash.com/photo-1587593810167-a84920ea0781?w=500&h=400&fit=crop&q=80",
        "Turkey": "https://images.unsplash.com/photo-1574680096145-d05b474e2155?w=500&h=400&fit=crop&q=80",
        
        # Protein
        "Mopane Worms (Madora)": "https://images.unsplash.com/photo-1619566663072-ecc6e18f4b73?w=500&h=400&fit=crop&q=80",
        
        # Fish
        "Kapenta (Matemba)": "https://images.unsplash.com/photo-1544943910-4c1dc44aab44?w=500&h=400&fit=crop&q=80",
    }

def update_product_images():
    """Update all product images in the database"""
    
    # Connect to database
    conn = sqlite3.connect('groupbuy.db')
    cursor = conn.cursor()
    
    # Get image mapping
    image_map = get_product_image_mapping()
    
    print("=" * 80)
    print("UPDATING PRODUCT IMAGES")
    print("=" * 80)
    
    updated_count = 0
    missing_count = 0
    
    try:
        # Get all products
        cursor.execute("SELECT id, name FROM products")
        products = cursor.fetchall()
        
        print(f"\nFound {len(products)} products in database")
        print("\nUpdating images...")
        print("-" * 80)
        
        for product_id, product_name in products:
            if product_name in image_map:
                new_image_url = image_map[product_name]
                
                # Update the product image
                cursor.execute(
                    "UPDATE products SET image_url = ? WHERE id = ?",
                    (new_image_url, product_id)
                )
                
                print(f"✅ [{product_id:2d}] {product_name:<40} Updated")
                updated_count += 1
            else:
                print(f"⚠️  [{product_id:2d}] {product_name:<40} No image mapping found")
                missing_count += 1
        
        # Commit changes
        conn.commit()
        
        print("-" * 80)
        print(f"\n✅ Successfully updated {updated_count} product images")
        
        if missing_count > 0:
            print(f"⚠️  {missing_count} products without image mappings (kept existing)")
        
        # Verify updates
        print("\n" + "=" * 80)
        print("VERIFICATION - Sample Products")
        print("=" * 80)
        
        cursor.execute("""
            SELECT id, name, category, image_url 
            FROM products 
            WHERE id IN (1, 10, 20, 30, 40, 50, 60, 70) 
            ORDER BY id
        """)
        
        samples = cursor.fetchall()
        for prod_id, name, category, image_url in samples:
            is_updated = "unsplash.com" in image_url
            status = "✅" if is_updated else "❌"
            print(f"{status} [{prod_id:2d}] {name[:30]:<30} | {category[:15]:<15}")
            print(f"      {image_url[:70]}...")
        
        print("\n" + "=" * 80)
        print("IMAGE UPDATE COMPLETE!")
        print("=" * 80)
        
    except Exception as e:
        print(f"\n❌ Error updating images: {e}")
        conn.rollback()
        raise
    finally:
        conn.close()

if __name__ == "__main__":
    update_product_images()

