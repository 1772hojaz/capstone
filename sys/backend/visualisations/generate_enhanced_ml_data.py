"""
Enhanced ML Training Data Generation with Distinct Personas
Using behavioral economics and market research principles for realistic patterns
"""
import os
import sys
import random
from datetime import datetime, timedelta
import numpy as np
from scipy.special import softmax
from sqlalchemy.orm import Session
import uuid

sys.path.append(os.path.dirname(__file__))

from db.database import SessionLocal
from models.models import User, Product, Transaction
from models.analytics_models import EventsRaw

# Configuration
RANDOM_SEED = 42
N_TRADERS = 200
WEEKS = 180
TARGET_TRANSACTIONS = 50000

# Zimbabwe location zones with economic profiles
LOCATION_ZONES = {
    # High-activity urban markets
    "Harare CBD": {"activity": 1.5, "budget": 1.3, "sophistication": "high"},
    "Mbare": {"activity": 2.0, "budget": 0.8, "sophistication": "medium"},
    
    # Medium-activity suburbs
    "Highfield": {"activity": 1.2, "budget": 0.9, "sophistication": "medium"},
    "Glen View": {"activity": 1.1, "budget": 0.85, "sophistication": "medium"},
    "Budiriro": {"activity": 1.0, "budget": 0.8, "sophistication": "low"},
    "Warren Park": {"activity": 1.1, "budget": 0.9, "sophistication": "medium"},
    "Kuwadzana": {"activity": 1.0, "budget": 0.85, "sophistication": "medium"},
    
    # Lower-activity areas
    "Dzivarasekwa": {"activity": 0.9, "budget": 0.75, "sophistication": "low"},
    "Mufakose": {"activity": 0.95, "budget": 0.8, "sophistication": "low"},
    "Epworth": {"activity": 0.8, "budget": 0.7, "sophistication": "low"},
    
    # Secondary cities
    "Bulawayo": {"activity": 1.3, "budget": 1.0, "sophistication": "high"},
    "Chitungwiza": {"activity": 1.1, "budget": 0.85, "sophistication": "medium"},
}

# ==============================================================================
# TRADER PERSONAS - Based on real market research
# ==============================================================================
TRADER_PERSONAS = {
    "bulk_wholesaler": {
        "description": "Large-scale buyers for resale",
        "proportion": 0.15,  # 15% of traders
        "behavior": {
            "activity_multiplier": 2.5,
            "budget_multiplier": 3.0,
            "quantity_multiplier": 3.0,
            "price_sensitivity": 0.8,  # Very price sensitive
            "category_focus": 2,  # Specializes in 2 categories
            "exploration_rate": 0.1,  # Rarely tries new products
            "repeat_purchase_prob": 0.85,  # Highly loyal
            "preferred_categories": ["Vegetables", "Fruits", "Grains"],
            "experience": "advanced",
            "budget_range": "high"
        }
    },
    
    "small_retailer": {
        "description": "Small shop owners, regular buyers",
        "proportion": 0.25,  # 25% of traders
        "behavior": {
            "activity_multiplier": 1.8,
            "budget_multiplier": 1.5,
            "quantity_multiplier": 2.0,
            "price_sensitivity": 0.7,
            "category_focus": 3,
            "exploration_rate": 0.2,
            "repeat_purchase_prob": 0.7,
            "preferred_categories": ["Vegetables", "Fruits", "Poultry", "Grains"],
            "experience": "intermediate",
            "budget_range": "medium"
        }
    },
    
    "frequent_individual": {
        "description": "Regular individual buyers, family providers",
        "proportion": 0.20,  # 20% of traders
        "behavior": {
            "activity_multiplier": 1.5,
            "budget_multiplier": 1.0,
            "quantity_multiplier": 1.0,
            "price_sensitivity": 0.5,
            "category_focus": 4,  # Buys diverse items
            "exploration_rate": 0.3,
            "repeat_purchase_prob": 0.6,
            "preferred_categories": ["Vegetables", "Fruits", "Legumes", "Poultry"],
            "experience": "intermediate",
            "budget_range": "medium"
        }
    },
    
    "occasional_buyer": {
        "description": "Infrequent buyers, opportunistic",
        "proportion": 0.20,  # 20% of traders
        "behavior": {
            "activity_multiplier": 0.6,
            "budget_multiplier": 0.7,
            "quantity_multiplier": 0.8,
            "price_sensitivity": 0.3,  # Less price sensitive
            "category_focus": 5,  # Buys whatever is available
            "exploration_rate": 0.5,  # High exploration
            "repeat_purchase_prob": 0.3,  # Low loyalty
            "preferred_categories": ["Fruits", "Vegetables", "Legumes"],
            "experience": "beginner",
            "budget_range": "low"
        }
    },
    
    "category_specialist": {
        "description": "Focuses on specific product categories",
        "proportion": 0.12,  # 12% of traders
        "behavior": {
            "activity_multiplier": 1.3,
            "budget_multiplier": 1.2,
            "quantity_multiplier": 1.5,
            "price_sensitivity": 0.9,  # Very price sensitive in their niche
            "category_focus": 1,  # Extreme specialization
            "exploration_rate": 0.05,  # Rarely ventures out
            "repeat_purchase_prob": 0.9,  # Extremely loyal
            "preferred_categories": None,  # Will be assigned specific category
            "experience": "advanced",
            "budget_range": "medium"
        }
    },
    
    "bargain_hunter": {
        "description": "Price-sensitive, opportunistic buyers",
        "proportion": 0.08,  # 8% of traders
        "behavior": {
            "activity_multiplier": 1.0,
            "budget_multiplier": 0.6,
            "quantity_multiplier": 1.2,
            "price_sensitivity": 0.95,  # Extremely price sensitive
            "category_focus": 6,  # Buys whatever is cheap
            "exploration_rate": 0.6,  # Always looking for deals
            "repeat_purchase_prob": 0.2,  # No loyalty, follows price
            "preferred_categories": ["Vegetables", "Fruits", "Grains", "Dried Vegetables"],
            "experience": "intermediate",
            "budget_range": "low"
        }
    }
}


class EnhancedTraderGenerator:
    """Generate realistic trader behavior with distinct personas"""
    
    def __init__(self, n_traders=200, weeks=180, seed=42):
        self.n_traders = n_traders
        self.weeks = weeks
        self.rng = np.random.default_rng(seed)
        
    def assign_personas(self):
        """Assign personas to traders based on proportions"""
        personas = []
        persona_list = list(TRADER_PERSONAS.keys())
        proportions = [TRADER_PERSONAS[p]["proportion"] for p in persona_list]
        
        for _ in range(self.n_traders):
            persona_type = self.rng.choice(persona_list, p=proportions)
            personas.append(persona_type)
        
        return personas
    
    def create_trader_profile(self, persona_type, trader_id):
        """Create a detailed trader profile based on persona"""
        persona = TRADER_PERSONAS[persona_type]
        behavior = persona["behavior"]
        
        # Select location with bias towards certain personas
        location_list = list(LOCATION_ZONES.keys())
        if persona_type == "bulk_wholesaler":
            # Wholesalers prefer high-activity zones
            location = self.rng.choice(["Harare CBD", "Mbare", "Bulawayo"])
        elif persona_type == "occasional_buyer":
            # Occasional buyers in lower-activity zones
            location = self.rng.choice(["Epworth", "Dzivarasekwa", "Mufakose"])
        else:
            location = self.rng.choice(location_list)
        
        location_profile = LOCATION_ZONES[location]
        
        # Category specialization
        if persona_type == "category_specialist":
            # Assign one specific category
            all_categories = ["Fruits", "Vegetables", "Grains", "Legumes", "Poultry", "Fish"]
            specialized_cat = self.rng.choice(all_categories)
            preferred_categories = [specialized_cat]
        else:
            n_cats = behavior["category_focus"]
            all_categories = ["Fruits", "Vegetables", "Grains", "Legumes", "Poultry", "Fish", "Protein", "Dried Vegetables"]
            preferred_categories = list(self.rng.choice(all_categories, min(n_cats, len(all_categories)), replace=False))
        
        # Calculate effective multipliers
        activity_level = (
            behavior["activity_multiplier"] * 
            location_profile["activity"] *
            self.rng.gamma(shape=2, scale=0.5)  # Individual variation
        )
        
        budget = (
            behavior["budget_multiplier"] * 
            location_profile["budget"] *
            self.rng.lognormal(mean=3.5, sigma=0.5)
        )
        
        return {
            "persona_type": persona_type,
            "location": location,
            "preferred_categories": preferred_categories,
            "activity_level": activity_level,
            "budget": budget,
            "price_sensitivity": behavior["price_sensitivity"],
            "quantity_multiplier": behavior["quantity_multiplier"],
            "exploration_rate": behavior["exploration_rate"],
            "repeat_purchase_prob": behavior["repeat_purchase_prob"],
            "experience": behavior["experience"],
            "budget_range": behavior["budget_range"]
        }
    
    def generate_transactions(self, products, trader_profiles):
        """Generate transactions with realistic behavioral patterns"""
        transactions = []
        product_to_category = {p.id: p.category for p in products}
        
        # Power-law product popularity (but modulated by personas)
        base_popularity = self.rng.power(a=0.7, size=len(products))
        
        start_date = datetime.utcnow() - timedelta(weeks=self.weeks)
        
        print(f"\n🔄 Generating transactions with behavioral personas...")
        
        # Track purchase history for repeat purchase behavior
        trader_purchase_history = {i: [] for i in range(self.n_traders)}
        
        for trader_id in range(self.n_traders):
            if (trader_id + 1) % 20 == 0:
                print(f"  Progress: {trader_id + 1}/{self.n_traders} traders")
            
            profile = trader_profiles[trader_id]
            
            for week in range(self.weeks):
                # Lifecycle stage (traders become more active over time, then may decline)
                lifecycle_factor = self._get_lifecycle_factor(week, self.weeks)
                
                # Weekly seasonality (stronger for certain personas)
                seasonality = 1 + 0.3 * np.sin(2 * np.pi * week / 4.3)
                
                # Monthly budget cycles (money runs out towards end of month)
                month_cycle = 1 + 0.2 * np.sin(2 * np.pi * (week % 4) / 4)
                
                # Determine number of purchases this week
                base_purchases = self.rng.negative_binomial(n=8, p=0.4) + 1
                n_purchases = int(max(1, min(20, 
                    base_purchases * 
                    profile["activity_level"] * 
                    lifecycle_factor *
                    seasonality *
                    month_cycle
                )))
                
                weekly_budget = profile["budget"] * 0.1 * month_cycle
                spent = 0.0
                
                for _ in range(n_purchases):
                    if spent >= weekly_budget * 1.2:
                        break
                    
                    # Decide: repeat purchase or explore?
                    if (trader_purchase_history[trader_id] and 
                        self.rng.random() < profile["repeat_purchase_prob"]):
                        # Repeat purchase from history
                        product_id = self.rng.choice([p["product_id"] for p in trader_purchase_history[trader_id][-20:]])
                        product = next((p for p in products if p.id == product_id), None)
                        if not product:
                            continue
                    else:
                        # Explore new product
                        product_probs = self._calculate_product_probabilities(
                            profile, product_to_category, base_popularity, products
                        )
                        product_idx = self.rng.choice(len(products), p=product_probs)
                        product = products[product_idx]
                    
                    # 5% cart abandonment (higher for occasional buyers)
                    abandon_prob = 0.05 if profile["persona_type"] != "occasional_buyer" else 0.15
                    if self.rng.random() < abandon_prob:
                        continue
                    
                    # Quantity based on persona and category
                    base_quantity = self._get_typical_quantity(product.category)
                    quantity = max(1, int(
                        self.rng.poisson(lam=base_quantity) * 
                        profile["quantity_multiplier"]
                    ))
                    
                    # Price sensitivity affects effective price
                    price_modifier = 2.0 / (1 + np.exp(-profile["budget"] / 50))
                    price_sensitivity_factor = 1.0 - (profile["price_sensitivity"] * 0.3)
                    effective_price = float(
                        product.bulk_price * 
                        price_modifier *
                        price_sensitivity_factor
                    )
                    
                    purchase_amount = float(quantity * effective_price)
                    
                    if spent + purchase_amount > weekly_budget * 1.5:
                        continue
                    
                    spent += purchase_amount
                    timestamp = self._generate_timestamp(start_date, week, profile)
                    
                    transactions.append({
                        "trader_id": trader_id,
                        "product_id": product.id,
                        "quantity": int(quantity),
                        "price": float(effective_price),
                        "amount": float(purchase_amount),
                        "timestamp": timestamp,
                        "week": int(week),
                        "persona_type": profile["persona_type"]
                    })
                    
                    # Track purchase history
                    trader_purchase_history[trader_id].append({
                        "product_id": product.id,
                        "category": product.category,
                        "timestamp": timestamp
                    })
        
        print(f"  ✅ Generated {len(transactions)} transactions with persona diversity")
        self._print_persona_stats(transactions)
        return transactions
    
    def _get_lifecycle_factor(self, week, total_weeks):
        """Model user lifecycle: ramp-up, peak, potential decline"""
        # Early stage: ramping up (weeks 0-12)
        if week < 12:
            return 0.5 + (week / 12) * 0.5
        # Peak stage: (weeks 12-150)
        elif week < total_weeks * 0.8:
            return 1.0
        # Late stage: potential decline (last 20%)
        else:
            decline_factor = (week - total_weeks * 0.8) / (total_weeks * 0.2)
            return 1.0 - (decline_factor * 0.3 * self.rng.random())
    
    def _calculate_product_probabilities(self, profile, product_to_category, 
                                         base_popularity, products):
        """Calculate product selection probabilities based on persona"""
        utilities = np.zeros(len(products))
        preferred_cats = set(c.lower() for c in profile["preferred_categories"])
        
        for idx, product in enumerate(products):
            # Base utility from category preference
            category_match = product.category.lower() in preferred_cats
            base_util = 2.0 if category_match else 0.5
            
            # Price utility (modulated by price sensitivity)
            price_util = -profile["price_sensitivity"] * np.log(max(1e-6, product.bulk_price))
            
            # Popularity utility
            pop_util = 0.3 * base_popularity[idx]
            
            # Exploration bonus (random utility)
            exploration_scale = profile["exploration_rate"]
            random_util = self.rng.gumbel(scale=exploration_scale)
            
            utilities[idx] = base_util + price_util + pop_util + random_util
        
        return softmax(utilities)
    
    def _get_typical_quantity(self, category):
        """Typical purchase quantities by category"""
        quantity_params = {
            'Grains': 8, 'Legumes': 7, 'Poultry': 3,
            'Fruits': 5, 'Vegetables': 6, 'Dried Vegetables': 4,
            'Protein': 2, 'Fish': 3, 'Food': 5
        }
        return quantity_params.get(category, 4)
    
    def _generate_timestamp(self, start_date, week, profile):
        """Generate realistic timestamp based on trader behavior"""
        # Different personas shop at different times
        if profile["persona_type"] == "bulk_wholesaler":
            # Early morning (6-10 AM)
            hour = int(np.clip(self.rng.normal(loc=8, scale=1), 6, 10))
        elif profile["persona_type"] == "occasional_buyer":
            # Anytime (6 AM - 6 PM)
            hour = int(self.rng.integers(6, 18))
        else:
            # Peak hours (9 AM - 2 PM)
            hour = int(np.clip(self.rng.normal(loc=11, scale=2), 9, 14))
        
        # Day of week (busier mid-week)
        day_probs = [0.10, 0.16, 0.18, 0.18, 0.16, 0.14, 0.08]
        day_of_week = self.rng.choice(7, p=day_probs)
        minute = int(self.rng.integers(0, 60))
        
        days_offset = week * 7 + day_of_week
        return start_date + timedelta(days=int(days_offset), hours=int(hour), minutes=int(minute))
    
    def _print_persona_stats(self, transactions):
        """Print persona distribution statistics"""
        from collections import Counter
        persona_counts = Counter(tx["persona_type"] for tx in transactions)
        
        print("\n  📊 Persona Distribution:")
        for persona, count in persona_counts.most_common():
            percentage = (count / len(transactions)) * 100
            print(f"    - {persona}: {count:,} transactions ({percentage:.1f}%)")


def create_traders_with_personas(db: Session, n_traders: int, trader_profiles):
    """Create trader accounts with persona-based profiles"""
    print(f"\n👥 Creating {n_traders} traders with behavioral personas...")
    
    traders = []
    existing_count = db.query(User).filter(
        User.is_admin == False,
        User.is_supplier == False
    ).count()
    
    for i, profile in enumerate(trader_profiles):
        trader = User(
            email=f"trader_persona_{existing_count + i + 1}@mltraining.local",
            hashed_password="$2b$12$dummy_hash_for_ml_training_only",
            full_name=f"{profile['persona_type'].replace('_', ' ').title()} #{i + 1}",
            is_admin=False,
            is_supplier=False,
            is_active=True,
            location_zone=profile["location"],
            preferred_categories=profile["preferred_categories"],
            budget_range=profile["budget_range"],
            experience_level=profile["experience"],
            preferred_group_sizes=["small", "medium", "large"][:profile.get("category_focus", 3)],
            participation_frequency="frequent" if profile["activity_level"] > 1.5 
                                   else "regular" if profile["activity_level"] > 0.8 
                                   else "occasional"
        )
        
        db.add(trader)
        traders.append(trader)
        
        if (i + 1) % 50 == 0:
            db.flush()
            print(f"  Progress: {i + 1}/{n_traders} traders")
    
    db.commit()
    print(f"  ✅ Created {n_traders} traders with diverse personas")
    return traders


def create_transactions_and_events_enhanced(db: Session, transactions_data, trader_objects, products):
    """Create database transactions with persona metadata"""
    print(f"\n💾 Saving {len(transactions_data)} transactions...")
    
    product_map = {p.id: p for p in products}
    
    from collections import defaultdict
    trader_transactions = defaultdict(list)
    for tx in transactions_data:
        trader_transactions[tx['trader_id']].append(tx)
    
    transaction_count = 0
    event_count = 0
    
    for trader_idx, trader in enumerate(trader_objects):
        trader_txs = trader_transactions[trader_idx]
        
        for tx_data in trader_txs:
            product = product_map[tx_data['product_id']]
            
            transaction = Transaction(
                user_id=trader.id,
                product_id=product.id,
                quantity=tx_data['quantity'],
                amount=tx_data['amount'],
                transaction_type="upfront",
                location_zone=trader.location_zone,
                cluster_id=trader.cluster_id,
                created_at=tx_data['timestamp']
            )
            db.add(transaction)
            transaction_count += 1
            
            # Analytics events
            view_event = EventsRaw(
                id=str(uuid.uuid4()),
                event_id=f"view_{transaction_count}_{uuid.uuid4().hex[:8]}",
                event_type="product_view",
                user_id=trader.id,
                session_id=f"session_{trader.id}_{tx_data['week']}",
                timestamp=tx_data['timestamp'] - timedelta(minutes=random.randint(5, 30)),
                properties={
                    "product_id": product.id,
                    "product_name": product.name,
                    "category": product.category,
                    "price": product.bulk_price,
                    "persona": tx_data["persona_type"]
                },
                path=f"/products/{product.id}",
                created_at=tx_data['timestamp']
            )
            db.add(view_event)
            event_count += 1
            
            purchase_event = EventsRaw(
                id=str(uuid.uuid4()),
                event_id=f"purchase_{transaction_count}_{uuid.uuid4().hex[:8]}",
                event_type="purchase",
                user_id=trader.id,
                session_id=f"session_{trader.id}_{tx_data['week']}",
                timestamp=tx_data['timestamp'],
                properties={
                    "product_id": product.id,
                    "product_name": product.name,
                    "quantity": tx_data['quantity'],
                    "amount": tx_data['amount'],
                    "category": product.category,
                    "persona": tx_data["persona_type"]
                },
                path=f"/checkout",
                created_at=tx_data['timestamp']
            )
            db.add(purchase_event)
            event_count += 1
        
        if (trader_idx + 1) % 20 == 0:
            db.flush()
            print(f"  Progress: {trader_idx + 1}/{len(trader_objects)} traders")
    
    db.commit()
    print(f"  ✅ Saved {transaction_count} transactions and {event_count} events")
    return transaction_count, event_count


def generate_enhanced_training_data():
    """Generate enhanced ML training data with distinct personas"""
    print("=" * 70)
    print("ENHANCED ML TRAINING DATA GENERATION")
    print("=" * 70)
    print("Using behavioral personas for better cluster separation")
    print("=" * 70)
    
    db = SessionLocal()
    
    try:
        # Get products
        products = db.query(Product).filter(Product.is_active == True).all()
        print(f"\n📦 Found {len(products)} active products")
        
        # Initialize generator
        generator = EnhancedTraderGenerator(n_traders=N_TRADERS, weeks=WEEKS, seed=RANDOM_SEED)
        
        # Assign personas
        persona_assignments = generator.assign_personas()
        
        # Create trader profiles
        trader_profiles = [
            generator.create_trader_profile(persona_assignments[i], i)
            for i in range(N_TRADERS)
        ]
        
        # Create traders
        traders = create_traders_with_personas(db, N_TRADERS, trader_profiles)
        
        # Generate transactions
        transactions_data = generator.generate_transactions(products, trader_profiles)
        
        # Save to database
        tx_count, event_count = create_transactions_and_events_enhanced(
            db, transactions_data, traders, products
        )
        
        # Summary
        print("\n" + "=" * 70)
        print("✅ ENHANCED DATA GENERATION COMPLETE!")
        print("=" * 70)
        print(f"  👥 Traders: {N_TRADERS} with 6 distinct personas")
        print(f"  💳 Transactions: {tx_count:,}")
        print(f"  📊 Events: {event_count:,}")
        print(f"  📅 Period: {WEEKS} weeks")
        print("\n  🎯 Expected Improvements:")
        print("    - Silhouette Score: 0.4-0.6 (vs 0.18)")
        print("    - Clusters: 5-8 distinct segments")
        print("    - Better separation between personas")
        print("=" * 70)
        print("\n💡 Next: python retrain_ml_models.py")
        print("=" * 70)
        
    except Exception as e:
        print(f"\n❌ Error: {e}")
        import traceback
        traceback.print_exc()
        db.rollback()
    finally:
        db.close()


if __name__ == "__main__":
    generate_enhanced_training_data()

