#!/usr/bin/env python3
"""
Seed Mbare Musika Products
Creates 74 authentic Mbare market products with realistic pricing
"""

from database import SessionLocal
from models import Product

def seed_mbare_products():
    """Add authentic Mbare Musika products to database"""

    mbare_products = [
        # Staples (20 products)
        {"name": "Rice 50kg Bag", "description": "Premium long-grain rice", "unit_price": 150.0, "bulk_price": 120.0, "moq": 100, "category": "staples"},
        {"name": "Maize Meal 25kg", "description": "Fine maize meal for sadza", "unit_price": 60.0, "bulk_price": 48.0, "moq": 120, "category": "staples"},
        {"name": "Sugar 50kg Bag", "description": "Refined white sugar", "unit_price": 120.0, "bulk_price": 95.0, "moq": 80, "category": "staples"},
        {"name": "Cooking Oil 25L", "description": "Sunflower cooking oil", "unit_price": 80.0, "bulk_price": 65.0, "moq": 50, "category": "staples"},
        {"name": "Salt 25kg Bag", "description": "Iodized table salt", "unit_price": 25.0, "bulk_price": 20.0, "moq": 200, "category": "staples"},
        {"name": "Flour 25kg Bag", "description": "Wheat flour for baking", "unit_price": 55.0, "bulk_price": 45.0, "moq": 100, "category": "staples"},
        {"name": "Beans 25kg Bag", "description": "Dried sugar beans", "unit_price": 85.0, "bulk_price": 70.0, "moq": 80, "category": "staples"},
        {"name": "Pasta 20kg Box", "description": "Assorted pasta varieties", "unit_price": 70.0, "bulk_price": 55.0, "moq": 40, "category": "staples"},
        {"name": "Bread Flour 25kg", "description": "High-protein bread flour", "unit_price": 65.0, "bulk_price": 52.0, "moq": 90, "category": "staples"},
        {"name": "Semolina 25kg", "description": "Durum wheat semolina", "unit_price": 75.0, "bulk_price": 60.0, "moq": 70, "category": "staples"},
        {"name": "Rolled Oats 25kg", "description": "Breakfast oats", "unit_price": 90.0, "bulk_price": 72.0, "moq": 60, "category": "staples"},
        {"name": "Peanut Butter 20kg", "description": "Groundnut paste", "unit_price": 110.0, "bulk_price": 88.0, "moq": 50, "category": "staples"},
        {"name": "Tea Leaves 10kg", "description": "Black tea leaves", "unit_price": 180.0, "bulk_price": 144.0, "moq": 30, "category": "staples"},
        {"name": "Coffee 10kg", "description": "Ground coffee beans", "unit_price": 200.0, "bulk_price": 160.0, "moq": 25, "category": "staples"},
        {"name": "Baking Powder 5kg", "description": "Leavening agent", "unit_price": 45.0, "bulk_price": 36.0, "moq": 100, "category": "staples"},
        {"name": "Yeast 1kg Packs", "description": "Baking yeast (24x1kg)", "unit_price": 25.0, "bulk_price": 20.0, "moq": 120, "category": "staples"},
        {"name": "Spices Mix 5kg", "description": "Mixed cooking spices", "unit_price": 95.0, "bulk_price": 76.0, "moq": 40, "category": "staples"},
        {"name": "Tomato Paste 24x400g", "description": "Canned tomato paste", "unit_price": 50.0, "bulk_price": 38.0, "moq": 50, "category": "staples"},
        {"name": "Baking Soda 5kg", "description": "Sodium bicarbonate", "unit_price": 30.0, "bulk_price": 24.0, "moq": 150, "category": "staples"},
        {"name": "Corn Starch 10kg", "description": "Maize starch thickener", "unit_price": 55.0, "bulk_price": 44.0, "moq": 80, "category": "staples"},

        # FMCG - Fast Moving Consumer Goods (15 products)
        {"name": "Laundry Detergent 10kg", "description": "Washing powder", "unit_price": 45.0, "bulk_price": 35.0, "moq": 60, "category": "fmcg"},
        {"name": "Dish Soap 5L", "description": "Liquid dishwashing soap", "unit_price": 15.0, "bulk_price": 12.0, "moq": 200, "category": "fmcg"},
        {"name": "Toilet Paper 48-Pack", "description": "Soft toilet tissue", "unit_price": 30.0, "bulk_price": 22.0, "moq": 100, "category": "fmcg"},
        {"name": "Bath Soap 12-Pack", "description": "Assorted bath soaps", "unit_price": 35.0, "bulk_price": 28.0, "moq": 120, "category": "fmcg"},
        {"name": "Shampoo 1L Bottles", "description": "Hair shampoo (12x1L)", "unit_price": 25.0, "bulk_price": 20.0, "moq": 150, "category": "fmcg"},
        {"name": "Toothpaste 12-Pack", "description": "Colgate toothpaste tubes", "unit_price": 40.0, "bulk_price": 32.0, "moq": 100, "category": "fmcg"},
        {"name": "Deodorant 12-Pack", "description": "Assorted deodorants", "unit_price": 50.0, "bulk_price": 40.0, "moq": 80, "category": "fmcg"},
        {"name": "Feminine Hygiene 24-Pack", "description": "Sanitary pads", "unit_price": 45.0, "bulk_price": 36.0, "moq": 90, "category": "fmcg"},
        {"name": "Baby Diapers 40-Pack", "description": "Disposable baby diapers", "unit_price": 55.0, "bulk_price": 44.0, "moq": 70, "category": "fmcg"},
        {"name": "Insect Repellent 12x200ml", "description": "Mosquito repellent spray", "unit_price": 35.0, "bulk_price": 28.0, "moq": 120, "category": "fmcg"},
        {"name": "Air Freshener 12x300ml", "description": "Room air freshener", "unit_price": 30.0, "bulk_price": 24.0, "moq": 100, "category": "fmcg"},
        {"name": "Floor Cleaner 5L", "description": "Multi-surface cleaner", "unit_price": 20.0, "bulk_price": 16.0, "moq": 180, "category": "fmcg"},
        {"name": "Glass Cleaner 5L", "description": "Window and glass cleaner", "unit_price": 18.0, "bulk_price": 14.4, "moq": 200, "category": "fmcg"},
        {"name": "Bleach 5L", "description": "Household bleach", "unit_price": 12.0, "bulk_price": 9.6, "moq": 250, "category": "fmcg"},
        {"name": "Fabric Softener 5L", "description": "Clothes softener", "unit_price": 28.0, "bulk_price": 22.4, "moq": 150, "category": "fmcg"},

        # Beverages (10 products)
        {"name": "Soda 24x300ml", "description": "Assorted carbonated drinks", "unit_price": 35.0, "bulk_price": 28.0, "moq": 100, "category": "beverages"},
        {"name": "Mineral Water 24x500ml", "description": "Bottled drinking water", "unit_price": 25.0, "bulk_price": 20.0, "moq": 120, "category": "beverages"},
        {"name": "Fruit Juice 12x1L", "description": "Assorted fruit juices", "unit_price": 45.0, "bulk_price": 36.0, "moq": 80, "category": "beverages"},
        {"name": "Energy Drink 24x250ml", "description": "Caffeinated energy drinks", "unit_price": 50.0, "bulk_price": 40.0, "moq": 90, "category": "beverages"},
        {"name": "Beer 24x340ml", "description": "Local lager beer", "unit_price": 60.0, "bulk_price": 48.0, "moq": 70, "category": "beverages"},
        {"name": "Mahewu 20L", "description": "Fermented maize drink", "unit_price": 40.0, "bulk_price": 32.0, "moq": 50, "category": "beverages"},
        {"name": "Tea Bags 100-Pack", "description": "Black tea bags", "unit_price": 35.0, "bulk_price": 28.0, "moq": 150, "category": "beverages"},
        {"name": "Coffee Sachets 100-Pack", "description": "Instant coffee sachets", "unit_price": 45.0, "bulk_price": 36.0, "moq": 120, "category": "beverages"},
        {"name": "Sports Drink 12x500ml", "description": "Electrolyte replacement drinks", "unit_price": 40.0, "bulk_price": 32.0, "moq": 100, "category": "beverages"},
        {"name": "Milk 12x1L", "description": "UHT long-life milk", "unit_price": 55.0, "bulk_price": 44.0, "moq": 80, "category": "beverages"},

        # Cooking Essentials (10 products)
        {"name": "Onions 25kg", "description": "Fresh red onions", "unit_price": 35.0, "bulk_price": 28.0, "moq": 200, "category": "cooking"},
        {"name": "Tomatoes 25kg", "description": "Fresh ripe tomatoes", "unit_price": 40.0, "bulk_price": 32.0, "moq": 180, "category": "cooking"},
        {"name": "Potatoes 25kg", "description": "Fresh potatoes", "unit_price": 30.0, "bulk_price": 24.0, "moq": 220, "category": "cooking"},
        {"name": "Garlic 10kg", "description": "Fresh garlic bulbs", "unit_price": 85.0, "bulk_price": 68.0, "moq": 80, "category": "cooking"},
        {"name": "Ginger 10kg", "description": "Fresh ginger root", "unit_price": 90.0, "bulk_price": 72.0, "moq": 70, "category": "cooking"},
        {"name": "Chili Peppers 5kg", "description": "Fresh chili peppers", "unit_price": 45.0, "bulk_price": 36.0, "moq": 150, "category": "cooking"},
        {"name": "Green Peppers 10kg", "description": "Fresh bell peppers", "unit_price": 50.0, "bulk_price": 40.0, "moq": 120, "category": "cooking"},
        {"name": "Eggs 30-Dozen", "description": "Fresh chicken eggs", "unit_price": 75.0, "bulk_price": 60.0, "moq": 60, "category": "cooking"},
        {"name": "Chicken 20kg", "description": "Fresh whole chicken", "unit_price": 120.0, "bulk_price": 96.0, "moq": 40, "category": "cooking"},
        {"name": "Beef 20kg", "description": "Fresh beef cuts", "unit_price": 150.0, "bulk_price": 120.0, "moq": 35, "category": "cooking"},

        # Fresh Produce (10 products)
        {"name": "Cabbage 25kg", "description": "Fresh green cabbage", "unit_price": 25.0, "bulk_price": 20.0, "moq": 250, "category": "fresh"},
        {"name": "Carrots 25kg", "description": "Fresh carrots", "unit_price": 35.0, "bulk_price": 28.0, "moq": 200, "category": "fresh"},
        {"name": "Spinach 10kg", "description": "Fresh spinach leaves", "unit_price": 30.0, "bulk_price": 24.0, "moq": 180, "category": "fresh"},
        {"name": "Lettuce 10kg", "description": "Fresh lettuce heads", "unit_price": 40.0, "bulk_price": 32.0, "moq": 150, "category": "fresh"},
        {"name": "Bananas 20kg", "description": "Fresh bananas", "unit_price": 45.0, "bulk_price": 36.0, "moq": 120, "category": "fresh"},
        {"name": "Oranges 25kg", "description": "Fresh oranges", "unit_price": 50.0, "bulk_price": 40.0, "moq": 100, "category": "fresh"},
        {"name": "Apples 20kg", "description": "Fresh apples", "unit_price": 65.0, "bulk_price": 52.0, "moq": 80, "category": "fresh"},
        {"name": "Mangoes 20kg", "description": "Fresh mangoes", "unit_price": 55.0, "bulk_price": 44.0, "moq": 90, "category": "fresh"},
        {"name": "Pineapples 15kg", "description": "Fresh pineapples", "unit_price": 60.0, "bulk_price": 48.0, "moq": 70, "category": "fresh"},
        {"name": "Avocados 10kg", "description": "Fresh avocados", "unit_price": 70.0, "bulk_price": 56.0, "moq": 60, "category": "fresh"},

        # Household Items (9 products)
        {"name": "Plastic Plates 50-Pack", "description": "Disposable plastic plates", "unit_price": 15.0, "bulk_price": 12.0, "moq": 300, "category": "household"},
        {"name": "Plastic Cups 100-Pack", "description": "Disposable plastic cups", "unit_price": 20.0, "bulk_price": 16.0, "moq": 250, "category": "household"},
        {"name": "Matches 10-Carton", "description": "Safety matches (10x50 boxes)", "unit_price": 25.0, "bulk_price": 20.0, "moq": 200, "category": "household"},
        {"name": "Candles 24-Pack", "description": "Household candles", "unit_price": 30.0, "bulk_price": 24.0, "moq": 150, "category": "household"},
        {"name": "Batteries AA 24-Pack", "description": "AA alkaline batteries", "unit_price": 35.0, "bulk_price": 28.0, "moq": 120, "category": "household"},
        {"name": "Light Bulbs 10-Pack", "description": "LED light bulbs", "unit_price": 40.0, "bulk_price": 32.0, "moq": 100, "category": "household"},
        {"name": "Plastic Bags 100-Pack", "description": "Shopping plastic bags", "unit_price": 10.0, "bulk_price": 8.0, "moq": 500, "category": "household"},
        {"name": "Washing Line 10m", "description": "Clothesline rope", "unit_price": 15.0, "bulk_price": 12.0, "moq": 200, "category": "household"},
        {"name": "Bucket 20L", "description": "Plastic utility bucket", "unit_price": 25.0, "bulk_price": 20.0, "moq": 150, "category": "household"}
    ]

    print(f"🌾 Seeding {len(mbare_products)} Mbare Musika products...")

    db = SessionLocal()
    try:
        # Check existing products
        existing_count = db.query(Product).count()
        print(f"📦 Found {existing_count} existing products")

        # Add new products
        added = 0
        for product_data in mbare_products:
            # Check if product already exists
            existing = db.query(Product).filter(Product.name == product_data["name"]).first()
            if existing:
                continue

            product = Product(**product_data)
            db.add(product)
            added += 1

        db.commit()
        print(f"✅ Added {added} new Mbare products")

        final_count = db.query(Product).count()
        print(f"📊 Total products in database: {final_count}")

    except Exception as e:
        print(f"❌ Error: {e}")
        db.rollback()
    finally:
        db.close()

if __name__ == "__main__":
    seed_mbare_products()