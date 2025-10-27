#!/usr/bin/env python3
"""
Seed Database with Mbare Musika Realistic Data
- Creates synthetic traders based on real Mbare trader profiles
- Generates realistic transactions for 74 Mbare products
- Ensures diversity in purchasing patterns
"""

import random
from datetime import datetime, timedelta
from db.database import SessionLocal
from models import User, Product, Transaction, GroupBuy
from api.v1.endpoints.auth import hash_password
import numpy as np

# Set seed for reproducibility
random.seed(42)
np.random.seed(42)

def seed_mbare_traders(db, n_traders=100):
    """Create realistic Mbare trader profiles - 100 traders with rich data"""
    
    # Harare zones where Mbare traders operate
    zones = [
        "Mbare", "Glen View", "Glen Norah", "Highfield", "Dzivarasekwa",
        "Kuwadzana", "Mufakose", "Warren Park", "Budiriro", "Hatcliffe",
        "Kambuzuma", "Mabvuku", "Tafara", "Epworth", "Chitungwiza"
    ]
    
    # Trader business types (influences what they buy)
    business_types = [
        "tuckshop", "market_stall", "hawker", "wholesaler", "retailer",
        "restaurant", "grocer", "fruit_vendor", "vegetable_vendor"
    ]
    
    print(f"\n📊 Creating {n_traders} Mbare traders with diverse profiles...")
    
    traders = []
    for i in range(n_traders):
        location_zone = random.choice(zones)
        business = random.choice(business_types)
        full_name = f"Trader {i+1} ({business.replace('_', ' ').title()})"
        
        trader = User(
            email=f"trader{i+1}@mbare.co.zw",
            hashed_password=hash_password("password123"),
            full_name=full_name,
            location_zone=location_zone,
            is_admin=False
        )
        db.add(trader)
        traders.append({
            "id": i + 1,
            "zone": location_zone,
            "business": business,
            "preferences": generate_trader_preferences(business)
        })
    
    db.commit()
    print(f"✅ Created {len(traders)} traders across {len(zones)} zones")
    return traders

def generate_trader_preferences(business_type):
    """Generate realistic product preferences based on business type"""
    
    # Base preferences
    prefs = {
        "staples": random.uniform(0.6, 1.0),
        "fmcg": random.uniform(0.4, 0.9),
        "beverages": random.uniform(0.2, 0.7),
        "cooking": random.uniform(0.5, 0.9),
        "fresh": random.uniform(0.3, 0.8)
    }
    
    # Adjust based on business type
    if business_type == "tuckshop":
        prefs["beverages"] *= 1.5
        prefs["fmcg"] *= 1.3
    elif business_type == "wholesaler":
        prefs["staples"] *= 1.4
        prefs["cooking"] *= 1.3
    elif business_type == "hawker":
        prefs["fresh"] *= 1.6
        prefs["beverages"] *= 1.2
    
    # Normalize
    total = sum(prefs.values())
    return {k: v/total for k, v in prefs.items()}

def seed_mbare_transactions(db, traders_info, weeks=16):
    """Generate realistic transaction history for Mbare traders - RICHER DATA"""
    
    print(f"\n💳 Generating {weeks} weeks of rich transaction history...")
    
    # Get all products
    products = db.query(Product).all()
    if len(products) < 10:
        print("⚠️  Not enough products in database. Please seed products first.")
        return
    
    # Create category mapping
    product_by_category = {}
    for p in products:
        cat = p.category or "general"
        if cat not in product_by_category:
            product_by_category[cat] = []
        product_by_category[cat].append(p)
    
    print(f"📦 Using {len(products)} products across {len(product_by_category)} categories")
    
    start_date = datetime.utcnow() - timedelta(weeks=weeks)
    transactions_created = 0
    
    for week in range(weeks):
        week_start = start_date + timedelta(weeks=week)
        
        # Each trader makes 3-12 purchases per week (INCREASED from 2-8)
        for trader_info in traders_info:
            n_purchases = random.randint(3, 12)  # More transactions
            
            for _ in range(n_purchases):
                # Select products based on trader preferences
                selected_products = select_products_by_preference(
                    products, 
                    product_by_category,
                    trader_info["preferences"],
                    count=random.randint(1, 5)  # More products per purchase
                )
                
                for product in selected_products:
                    # Realistic quantity based on product type
                    if product.category == "staples":
                        quantity = random.randint(5, 50)  # Bulk staples
                    elif product.category == "fresh":
                        quantity = random.randint(10, 100)  # Fresh in kg/units
                    else:
                        quantity = random.randint(2, 20)  # Other products
                    
                    # Price with some variance (wholesale vs retail mix)
                    base_price = product.bulk_price if quantity >= product.moq else product.unit_price
                    price_paid = base_price * random.uniform(0.95, 1.05)
                    
                    # Random day within the week
                    purchase_date = week_start + timedelta(
                        days=random.randint(0, 6),
                        hours=random.randint(6, 18),
                        minutes=random.randint(0, 59)
                    )
                    
                    transaction = Transaction(
                        user_id=trader_info["id"],
                        product_id=product.id,
                        quantity=quantity,
                        amount=price_paid * quantity,
                        transaction_type="purchase",
                        created_at=purchase_date,
                        location_zone=trader_info["zone"],
                        cluster_id=None
                    )
                    db.add(transaction)
                    transactions_created += 1
        
        # Commit every week to avoid huge memory usage
        if (week + 1) % 4 == 0:
            db.commit()
            print(f"  Week {week + 1}/{weeks}: {transactions_created} transactions...")
    
    db.commit()
    print(f"✅ Created {transactions_created} transactions over {weeks} weeks")
    print(f"   Average per trader: {transactions_created / len(traders_info):.1f} transactions")
    
    return transactions_created

def select_products_by_preference(products, product_by_category, preferences, count=3):
    """Select products based on trader's category preferences"""
    
    selected = []
    attempts = 0
    max_attempts = count * 5
    
    while len(selected) < count and attempts < max_attempts:
        attempts += 1
        
        # Pick category based on preferences
        categories = list(preferences.keys())
        weights = [preferences.get(cat, 0.1) for cat in categories]
        
        # Normalize weights
        total_weight = sum(weights)
        if total_weight > 0:
            weights = [w / total_weight for w in weights]
        else:
            weights = [1.0 / len(weights)] * len(weights)
        
        try:
            chosen_category = np.random.choice(categories, p=weights)
        except:
            chosen_category = random.choice(categories)
        
        # Get products in this category
        category_products = product_by_category.get(chosen_category, [])
        if not category_products:
            # Fallback to any product
            category_products = products
        
        # Select random product
        product = random.choice(category_products)
        
        # Avoid duplicates
        if product not in selected:
            selected.append(product)
    
    return selected

def create_active_group_buys(db, n_groupbuys=20):
    """Create some active group-buys for testing recommendations"""
    
    print(f"\n🛍️  Creating {n_groupbuys} active group-buys...")
    
    products = db.query(Product).all()
    traders = db.query(User).filter(~User.is_admin).all()
    zones = ["Mbare", "Glen View", "Highfield", "Dzivarasekwa", "Kuwadzana"]
    
    created = 0
    for _ in range(n_groupbuys):
        product = random.choice(products)
        creator = random.choice(traders)
        zone = random.choice(zones)
        
        # Deadline 3-14 days in future
        deadline = datetime.utcnow() + timedelta(days=random.randint(3, 14))
        
        # Current quantity 20-70% of MOQ
        current_qty = int(product.moq * random.uniform(0.2, 0.7))
        
        gb = GroupBuy(
            product_id=product.id,
            creator_id=creator.id,
            location_zone=zone,
            total_quantity=current_qty,
            deadline=deadline,
            status="active"
        )
        db.add(gb)
        created += 1
    
    db.commit()
    print(f"✅ Created {created} active group-buys")

def main():
    """Main seeding function"""
    
    print("="*60)
    print("🌾 Seeding Mbare Musika Database")
    print("="*60)
    
    db = SessionLocal()
    
    try:
        # Check if already seeded
        existing_traders = db.query(User).filter(~User.is_admin).count()
        existing_transactions = db.query(Transaction).count()
        
        if existing_traders > 50 and existing_transactions > 100:
            print(f"\n⚠️  Database already seeded:")
            print(f"   - {existing_traders} traders")
            print(f"   - {existing_transactions} transactions")
            
            response = input("\nRe-seed anyway? This will ADD more data (y/N): ")
            if response.lower() != 'y':
                print("Cancelled.")
                return
        
        # Check products
        products = db.query(Product).all()
        if len(products) < 10:
            print("\n❌ Error: Not enough products in database")
            print("   Please run the Mbare products seeding script first")
            print("   Expected: 74 Mbare Musika products")
            return
        
        print(f"\n✅ Found {len(products)} products in database")
        
        # Seed traders
        traders_info = seed_mbare_traders(db, n_traders=100)
        
        # Seed transactions (12 weeks of history)
        seed_mbare_transactions(db, traders_info, weeks=12)
        
        # Create active group-buys
        create_active_group_buys(db, n_groupbuys=25)
        
        # Summary
        print("\n" + "="*60)
        print("✅ Seeding Complete!")
        print("="*60)
        
        final_traders = db.query(User).filter(~User.is_admin).count()
        final_transactions = db.query(Transaction).count()
        final_groupbuys = db.query(GroupBuy).filter(GroupBuy.status == "active").count()
        
        print(f"\n📊 Database Statistics:")
        print(f"   - Traders: {final_traders}")
        print(f"   - Products: {len(products)}")
        print(f"   - Transactions: {final_transactions}")
        print(f"   - Active Group-Buys: {final_groupbuys}")
        print(f"\n🎯 Ready for hybrid recommender training!")
        print(f"   Minimum requirements met: ✅")
        print(f"   - Products: {len(products)} ≥ 5")
        print(f"   - Traders: {final_traders} ≥ 4")
        print(f"   - Transactions: {final_transactions} ≥ 10")
        
    except Exception as e:
        print(f"\n❌ Error: {e}")
        import traceback
        traceback.print_exc()
        db.rollback()
    finally:
        db.close()

if __name__ == "__main__":
    main()
