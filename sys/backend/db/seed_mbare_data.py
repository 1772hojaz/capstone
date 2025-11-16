#!/usr/bin/env python3
"""
Seed Database with Mbare Musika Realistic Data
- Creates synthetic traders based on real Mbare trader profiles
- Generates realistic transactions for 74 Mbare products
- Ensures diversity in purchasing patterns
"""

import sys
import os
sys.path.append(os.path.dirname(os.path.dirname(os.path.abspath(__file__))))

import random
from datetime import datetime, timedelta
from db.database import SessionLocal
from models.models import User, GroupBuy, Transaction, Product, Contribution, AdminGroup, AdminGroupJoin
from authentication.auth import hash_password
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
    
    print("\n📊 Creating {} Mbare traders with diverse profiles...".format(n_traders))
    
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
    
    print("\n💳 Generating {} weeks of rich transaction history...".format(weeks))
    
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
    
    print("📦 Using {} products across {} categories".format(len(products), len(product_by_category)))
    
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
            print("  Week {}/{}: {} transactions...".format(week + 1, weeks, transactions_created))
    
    db.commit()
    print("✅ Created {} transactions over {} weeks".format(transactions_created, weeks))
    print("   Average per trader: {:.1f} transactions".format(transactions_created / len(traders_info)))
    
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
    
    print("\n🛍️  Creating {} active group-buys...".format(n_groupbuys))
    
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
    print("✅ Created {} active group-buys".format(created))

def create_admin_groups_with_contributions(db, traders_info):
    """Create AdminGroups with Mbare products and realistic contributions"""
    
    print("\n👥 Creating AdminGroups with Mbare products and contributions...")
    
    # Select popular Mbare products for AdminGroups
    popular_products = [
        ("Strawberries", "Fruits"),
        ("Okra", "Vegetables"), 
        ("Carrots (Bulk)", "Vegetables"),
        ("Sugar Beans", "Legumes"),
        ("Oyster Mushroom", "Vegetables"),
        ("Tomatoes", "Vegetables"),
        ("Cabbage", "Vegetables"),
        ("Apples", "Fruits")
    ]
    
    admin_groups_data = []
    for product_name, category in popular_products:
        product = db.query(Product).filter(Product.name == product_name).first()
        if product:
            # Calculate group pricing (bulk discount)
            discount_pct = random.uniform(0.15, 0.25)  # 15-25% discount
            group_price = product.bulk_price * (1 - discount_pct)
            original_price = product.unit_price
            
            # Group size based on product type
            if category in ["Fruits", "Vegetables"]:
                max_participants = random.randint(15, 25)
            else:
                max_participants = random.randint(10, 20)
            
            admin_groups_data.append({
                "name": product_name,
                "description": "Premium {} from Mbare Musika market".format(product_name),
                "long_description": "Fresh {} sourced directly from Mbare Musika. High-quality produce with bulk pricing for serious traders. Perfect for retail and wholesale.".format(product_name),
                "category": category,
                "price": round(group_price, 2),
                "original_price": round(original_price, 2),
                "image": "https://via.placeholder.com/300x200?text={}".format(product_name.replace(' ', '+')),
                "max_participants": max_participants,
                "end_date": datetime.utcnow() + timedelta(days=random.randint(5, 14)),
                "admin_name": "ConnectSphere Admin",
                "shipping_info": "Free delivery within Harare metropolitan area",
                "estimated_delivery": "2-3 weeks after group completion",
                "features": ["Fresh from Mbare", "Bulk pricing", "Quality guaranteed", "Market ready"],
                "requirements": ["Valid trading license", "Minimum order commitment"],
                "is_active": True,
                "created": datetime.utcnow()
            })
    
    # Create AdminGroups
    admin_groups = []
    for ag_data in admin_groups_data:
        admin_group = AdminGroup(**ag_data)
        db.add(admin_group)
        admin_groups.append(admin_group)
    
    db.commit()
    print("✅ Created {} AdminGroups".format(len(admin_groups)))
    
    # Create realistic contributions to AdminGroups
    contributions_created = 0
    for admin_group in admin_groups:
        # Each AdminGroup gets 40-80% participation
        target_participants = int(admin_group.max_participants * random.uniform(0.4, 0.8))
        
        # Select random traders who might be interested
        interested_traders = []
        for trader_info in traders_info:
            # Higher chance for traders in Mbare or nearby zones
            if trader_info["zone"] in ["Mbare", "Glen View", "Highfield"]:
                if random.random() < 0.7:  # 70% chance
                    interested_traders.append(trader_info)
            else:
                if random.random() < 0.4:  # 40% chance
                    interested_traders.append(trader_info)
        
        # Limit to target participants
        selected_traders = interested_traders[:target_participants]
        
        for trader_info in selected_traders:
            # Create AdminGroupJoin record (not Contribution)
            admin_group_join = AdminGroupJoin(
                admin_group_id=admin_group.id,
                user_id=trader_info["id"],
                quantity=random.randint(5, 20),  # Realistic quantities
                delivery_method=random.choice(["pickup", "delivery"]),
                payment_method=random.choice(["cash", "card"])
            )
            db.add(admin_group_join)
            contributions_created += 1
        
        # Update AdminGroup participant count
        admin_group.participants = len(selected_traders)
    
    db.commit()
    print("✅ Created {} AdminGroupJoin records to AdminGroups".format(contributions_created))
    
    return len(admin_groups), contributions_created

def create_completed_groupbuy_for_trader1(db, traders_info):
    """Create at least one completed group-buy specifically for trader1@mbare.co.zw"""
    
    print("\n🎯 Creating completed group-buy for trader1@mbare.co.zw...")
    
    # Find trader1 (user_id=1)
    trader1_info = next((t for t in traders_info if t["id"] == 1), None)
    if not trader1_info:
        print("❌ Trader1 not found in traders_info")
        return 0
    
    # Get a popular Mbare product
    products = db.query(Product).all()
    popular_products = [p for p in products if p.name in [
        "Strawberries", "Okra", "Carrots (Bulk)", "Sugar Beans", 
        "Oyster Mushroom", "Tomatoes", "Cabbage", "Apples"
    ]]
    
    if not popular_products:
        popular_products = products[:5]  # Fallback to first 5 products
    
    selected_product = random.choice(popular_products)
    
    # Create completed group-buy
    completed_date = datetime.utcnow() - timedelta(days=random.randint(1, 7))
    
    completed_gb = GroupBuy(
        product_id=selected_product.id,
        creator_id=1,  # trader1
        location_zone=trader1_info["zone"],
        total_quantity=selected_product.moq,  # Full MOQ achieved
        deadline=completed_date + timedelta(days=random.randint(3, 7)),  # Deadline was in future
        status="completed",
        completed_at=completed_date
    )
    db.add(completed_gb)
    db.commit()  # Need to commit to get the ID
    
    # Create contributions from multiple traders including trader1
    contributions_created = 0
    total_quantity = 0
    
    # Trader1 contributes first
    trader1_quantity = random.randint(10, min(30, selected_product.moq // 3))
    trader1_contribution = Contribution(
        user_id=1,  # trader1
        group_buy_id=completed_gb.id,
        quantity=trader1_quantity,
        contribution_amount=selected_product.bulk_price * trader1_quantity,
        paid_amount=selected_product.bulk_price * trader1_quantity,
        is_fully_paid=True,
        joined_at=completed_date - timedelta(days=random.randint(2, 5))
    )
    db.add(trader1_contribution)
    contributions_created += 1
    total_quantity += trader1_quantity
    
    # Add 3-6 other traders to reach MOQ
    remaining_quantity = selected_product.moq - trader1_quantity
    other_traders = [t for t in traders_info if t["id"] != 1][:random.randint(3, 6)]
    
    for trader_info in other_traders:
        if remaining_quantity <= 0:
            break
            
        # Each contributes a portion
        max_contribution = min(remaining_quantity, selected_product.moq // 4)
        quantity = random.randint(5, max_contribution)
        
        contribution = Contribution(
            user_id=trader_info["id"],
            group_buy_id=completed_gb.id,
            quantity=quantity,
            contribution_amount=selected_product.bulk_price * quantity,
            paid_amount=selected_product.bulk_price * quantity,
            is_fully_paid=True,
            joined_at=completed_date - timedelta(days=random.randint(2, 5))
        )
        db.add(contribution)
        contributions_created += 1
        total_quantity += quantity
        remaining_quantity -= quantity
    
    # Update group-buy with final quantities
    completed_gb.total_quantity = total_quantity
    # participants_count is a property, don't set it directly
    
    db.commit()
    
    print("✅ Created completed group-buy '{}' with {} participants".format(
        selected_product.name, contributions_created))
    print("   - Product: {}".format(selected_product.name))
    print("   - Total quantity: {}".format(total_quantity))
    print("   - Trader1 contributed: {}".format(trader1_quantity))
    
    return 1

def create_contributions_for_groupbuys(db, traders_info):
    """Create realistic contributions to existing GroupBuys"""
    
    print("\n🤝 Creating contributions to GroupBuys...")
    
    active_groupbuys = db.query(GroupBuy).filter(GroupBuy.status == "active").all()
    contributions_created = 0
    
    for gb in active_groupbuys:
        # Each GroupBuy gets 30-70% participation
        target_participants = int(gb.product.moq * random.uniform(0.3, 0.7) / 10)  # Scale down
        
        # Select random traders
        selected_traders = random.sample(traders_info, min(target_participants, len(traders_info)))
        
        for trader_info in selected_traders:
            # Create contribution record
            quantity = random.randint(5, min(20, gb.product.moq // 2))
            contribution = Contribution(
                user_id=trader_info["id"],
                group_buy_id=gb.id,
                quantity=quantity,
                contribution_amount=gb.product.bulk_price * quantity,
                paid_amount=gb.product.bulk_price * quantity,
                is_fully_paid=True,
                joined_at=datetime.utcnow() - timedelta(days=random.randint(1, 7))
            )
            db.add(contribution)
            contributions_created += 1
        
        # Update GroupBuy quantities
        gb.total_quantity = sum(c.quantity for c in gb.contributions)
    
    db.commit()
    print("✅ Created {} contributions to GroupBuys".format(contributions_created))
    
    return contributions_created

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
            print("\n⚠️  Database already seeded:")
            print("   - {} traders".format(existing_traders))
            print("   - {} transactions".format(existing_transactions))
            
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
        
        print("\n✅ Found {} products in database".format(len(products)))
        
        # Check if traders already exist
        existing_traders_count = db.query(User).filter(~User.is_admin).count()
        if existing_traders_count > 0:
            print("\n✅ Found {} existing traders, skipping trader creation".format(existing_traders_count))
            traders_info = []
            for i in range(1, existing_traders_count + 1):
                trader = db.query(User).filter(User.id == i).first()
                if trader:
                    traders_info.append({
                        "id": trader.id,
                        "zone": trader.location_zone,
                        "business": "existing",  # We don't have this info
                        "preferences": generate_trader_preferences("tuckshop")  # Default preferences
                    })
        else:
            # Seed traders
            traders_info = seed_mbare_traders(db, n_traders=100)
        
        # Check if transactions already exist
        existing_transactions = db.query(Transaction).count()
        if existing_transactions > 0:
            print("\n✅ Found {} existing transactions, skipping transaction creation".format(existing_transactions))
        else:
            # Seed transactions (12 weeks of history)
            seed_mbare_transactions(db, traders_info, weeks=12)
        
        # Create active group-buys
        create_active_group_buys(db, n_groupbuys=25)
        
        # Create completed group-buy for trader1
        create_completed_groupbuy_for_trader1(db, traders_info)
        
        # Create AdminGroups with Mbare products and contributions
        create_admin_groups_with_contributions(db, traders_info)
        
        # Create contributions to existing GroupBuys
        create_contributions_for_groupbuys(db, traders_info)
        
        # Summary
        print("\n" + "="*60)
        print("✅ Seeding Complete!")
        print("="*60)
        
        final_traders = db.query(User).filter(~User.is_admin).count()
        final_transactions = db.query(Transaction).count()
        final_groupbuys = db.query(GroupBuy).filter(GroupBuy.status == "active").count()
        completed_groupbuys = db.query(GroupBuy).filter(GroupBuy.status == "completed").count()
        
        print("\n📊 Database Statistics:")
        print("   - Traders: {}".format(final_traders))
        print("   - Products: {}".format(len(products)))
        print("   - Transactions: {}".format(final_transactions))
        print("   - Active Group-Buys: {}".format(final_groupbuys))
        print("   - Completed Group-Buys: {}".format(completed_groupbuys))
        print("\n🎯 Ready for hybrid recommender training!")
        print("   Minimum requirements met: ✅")
        print("   - Products: {} ≥ 5".format(len(products)))
        print("   - Traders: {} ≥ 4".format(final_traders))
        print("   - Transactions: {} ≥ 10".format(final_transactions))
        
    except Exception as e:
        print("\n❌ Error: {}".format(e))
        import traceback
        traceback.print_exc()
        db.rollback()
    finally:
        db.close()

if __name__ == "__main__":
    main()
