"""
Generate realistic ML training data using stochastic transaction generation
Based on the notebook logic for Mbare Musika informal market patterns

Generates:
- 200 traders with diverse profiles
- 50,000+ transactions
- Realistic user behavior patterns
- Analytics events for ML training
"""
import os
import sys
import random
from datetime import datetime, timedelta
import numpy as np
from scipy.special import softmax
from sqlalchemy.orm import Session
import uuid

# Add backend to path
sys.path.append(os.path.dirname(__file__))

from db.database import SessionLocal
from models.models import User, Product, GroupBuy, Contribution, Transaction
from models.analytics_models import EventsRaw, UserBehaviorFeatures

# Configuration
RANDOM_SEED = 42
N_TRADERS = 200
WEEKS = 180  # 3.5 years of richer historical data
TARGET_TRANSACTIONS = 50000

# Zimbabwe location zones (from existing data)
LOCATION_ZONES = [
    "Harare CBD", "Mbare", "Highfield", "Glen View", "Budiriro", "Warren Park",
    "Kuwadzana", "Dzivarasekwa", "Mufakose", "Kambuzuma", "Hatcliffe", "Epworth",
    "Chitungwiza", "Norton", "Ruwa", "Bulawayo", "Gweru", "Mutare", "Masvingo", "Kwekwe"
]

# User experience and budget levels
EXPERIENCE_LEVELS = ["beginner", "intermediate", "advanced"]
BUDGET_RANGES = ["low", "medium", "high"]
PREFERRED_GROUP_SIZES = [["small"], ["medium"], ["large"], ["small", "medium"], ["medium", "large"]]

random.seed(RANDOM_SEED)
np.random.seed(RANDOM_SEED)


class StochasticTransactionGenerator:
    """
    Generate realistic trader behavior using stochastic processes
    Mimics Mbare Musika informal market patterns
    """
    
    def __init__(self, n_traders=200, weeks=24, seed=42):
        self.n_traders = n_traders
        self.weeks = weeks
        self.rng = np.random.default_rng(seed)
        
    def generate_trader_profiles(self, categories):
        """Generate diverse trader profiles with preferences and constraints"""
        n_categories = len(categories)
        
        # Category preferences (using Dirichlet for sum-to-1 probabilities)
        alpha = self.rng.gamma(shape=2, scale=0.5, size=n_categories)
        preferences = self.rng.dirichlet(alpha, size=self.n_traders)
        
        # Activity levels (how often they shop)
        activity_levels = self.rng.gamma(shape=2, scale=0.5, size=self.n_traders)
        
        # Budget constraints (log-normal distribution)
        budget_constraints = self.rng.lognormal(mean=3.5, sigma=0.8, size=self.n_traders)
        
        return {
            'preferences': preferences,
            'activity_levels': activity_levels,
            'budget_constraints': budget_constraints,
            'category_mapping': {cat: i for i, cat in enumerate(categories)}
        }
    
    def generate_transactions(self, products, trader_profiles):
        """Generate realistic transaction sequences"""
        transactions = []
        product_to_category = {p.id: p.category for p in products}
        
        # Power-law product popularity (80/20 rule)
        product_popularity = self.rng.power(a=0.7, size=len(products))
        
        start_date = datetime.utcnow() - timedelta(weeks=self.weeks)
        
        print(f"\n🔄 Generating transactions for {self.n_traders} traders over {self.weeks} weeks...")
        
        for trader_id in range(self.n_traders):
            if (trader_id + 1) % 20 == 0:
                print(f"  Progress: {trader_id + 1}/{self.n_traders} traders")
            
            trader_prefs = trader_profiles['preferences'][trader_id]
            activity_level = trader_profiles['activity_levels'][trader_id]
            budget = trader_profiles['budget_constraints'][trader_id]
            
            for week in range(self.weeks):
                # Negative binomial for transaction count (overdispersed Poisson)
                # Increased activity: n=8 instead of 6 for more purchases
                n_purchases = self.rng.negative_binomial(n=8, p=0.4) + 1
                n_purchases = min(n_purchases, 20)  # Allow more purchases per week
                
                # Weekly seasonality with stronger peaks
                seasonality = 1 + 0.3 * np.sin(2 * np.pi * week / 4.3)
                n_purchases = int(max(1, n_purchases * activity_level * seasonality * 1.2))  # 20% boost
                
                weekly_budget = budget * 0.1
                spent = 0.0
                
                for _ in range(n_purchases):
                    if spent >= weekly_budget * 1.2:
                        break
                    
                    # Calculate product selection probabilities
                    product_probs = self._calculate_product_probabilities(
                        trader_prefs, trader_profiles['category_mapping'],
                        product_to_category, product_popularity, products
                    )
                    
                    product_idx = self.rng.choice(len(products), p=product_probs)
                    product = products[product_idx]
                    
                    # 5% cart abandonment
                    if self.rng.random() < 0.05:
                        continue
                    
                    # Quantity based on product category
                    base_quantity = self._get_typical_quantity(product.category)
                    quantity = max(1, self.rng.poisson(lam=base_quantity))
                    
                    # Price sensitivity based on budget
                    price_sensitivity = 2.0 / (1 + np.exp(-budget/50))
                    effective_price = float(product.bulk_price * price_sensitivity)
                    purchase_amount = float(quantity * effective_price)
                    
                    if spent + purchase_amount > weekly_budget * 1.5:
                        continue
                    
                    spent += purchase_amount
                    timestamp = self._generate_timestamp(start_date, week)
                    
                    transactions.append({
                        'trader_id': trader_id,
                        'product_id': product.id,
                        'quantity': int(quantity),
                        'price': float(effective_price),
                        'amount': float(purchase_amount),
                        'timestamp': timestamp,
                        'week': int(week)
                    })
        
        print(f"  ✅ Generated {len(transactions)} transactions")
        return transactions
    
    def _calculate_product_probabilities(self, trader_prefs, category_mapping,
                                        product_to_category, product_popularity, products):
        """Calculate product selection probabilities using utility model"""
        utilities = np.zeros(len(products))
        
        for idx, product in enumerate(products):
            category_idx = category_mapping[product.category]
            base_util = trader_prefs[category_idx]
            price_util = -0.4 * np.log(max(1e-6, product.bulk_price))
            pop_util = 0.3 * product_popularity[idx]
            random_util = self.rng.gumbel(scale=0.1)
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
    
    def _generate_timestamp(self, start_date, week):
        """Generate realistic timestamp with weekly patterns"""
        # Day of week probabilities (busier mid-week)
        day_probs = [0.12, 0.16, 0.16, 0.16, 0.16, 0.14, 0.10]
        day_of_week = self.rng.choice(7, p=day_probs)
        
        # Business hours with peak around 11 AM
        hour = int(np.clip(self.rng.normal(loc=11, scale=2.5), 6, 18))
        minute = int(self.rng.integers(0, 60))
        
        days_offset = week * 7 + day_of_week
        return start_date + timedelta(days=int(days_offset), hours=int(hour), minutes=int(minute))


def create_traders(db: Session, n_traders: int):
    """Create trader user accounts with diverse profiles"""
    print(f"\n👥 Creating {n_traders} trader accounts...")
    
    traders = []
    existing_count = db.query(User).filter(
        User.is_admin == False,
        User.is_supplier == False
    ).count()
    
    for i in range(n_traders):
        # Generate diverse profiles
        location = random.choice(LOCATION_ZONES)
        experience = random.choice(EXPERIENCE_LEVELS)
        budget = random.choice(BUDGET_RANGES)
        group_sizes = random.choice(PREFERRED_GROUP_SIZES)
        
        # Category preferences (realistic distribution)
        n_preferred = random.randint(1, 4)
        all_categories = ["Fruits", "Vegetables", "Grains", "Legumes", "Poultry", "Fish", "Food"]
        preferred_cats = random.sample(all_categories, n_preferred)
        
        trader = User(
            email=f"trader_{existing_count + i + 1}@mltraining.local",
            hashed_password="$2b$12$dummy_hash_for_ml_training_only",  # Not for real auth
            full_name=f"Trader {existing_count + i + 1}",
            is_admin=False,
            is_supplier=False,
            is_active=True,
            location_zone=location,
            preferred_categories=preferred_cats,
            budget_range=budget,
            experience_level=experience,
            preferred_group_sizes=group_sizes,
            participation_frequency=random.choice(["occasional", "regular", "frequent"])
        )
        
        db.add(trader)
        traders.append(trader)
        
        if (i + 1) % 50 == 0:
            db.flush()
            print(f"  Progress: {i + 1}/{n_traders} traders created")
    
    db.commit()
    print(f"  ✅ Created {n_traders} traders")
    return traders


def create_transactions_and_events(db: Session, transactions_data, trader_objects, products):
    """Create database transactions and analytics events"""
    print(f"\n💾 Saving {len(transactions_data)} transactions to database...")
    
    # Create product lookup
    product_map = {p.id: p for p in products}
    
    # Group transactions by trader for efficient processing
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
            
            # Create transaction record
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
            
            # Create analytics events
            # 1. Product view event
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
                    "price": product.bulk_price
                },
                path=f"/products/{product.id}",
                created_at=tx_data['timestamp']
            )
            db.add(view_event)
            event_count += 1
            
            # 2. Purchase event
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
                    "category": product.category
                },
                path=f"/checkout",
                created_at=tx_data['timestamp']
            )
            db.add(purchase_event)
            event_count += 1
        
        if (trader_idx + 1) % 20 == 0:
            db.flush()
            print(f"  Progress: {trader_idx + 1}/{len(trader_objects)} traders processed")
            print(f"    Transactions: {transaction_count}, Events: {event_count}")
    
    db.commit()
    print(f"  ✅ Saved {transaction_count} transactions and {event_count} events")
    return transaction_count, event_count


def generate_training_data():
    """Main function to generate all training data"""
    print("=" * 70)
    print("ML TRAINING DATA GENERATION")
    print("=" * 70)
    print(f"Target: {N_TRADERS} traders, {TARGET_TRANSACTIONS}+ transactions")
    print("=" * 70)
    
    db = SessionLocal()
    
    try:
        # 1. Get all products
        products = db.query(Product).filter(Product.is_active == True).all()
        print(f"\n📦 Found {len(products)} active products")
        
        if len(products) < 10:
            print("❌ Not enough products. Please seed the database first.")
            return
        
        # 2. Create traders
        traders = create_traders(db, N_TRADERS)
        
        # 3. Generate trader profiles
        categories = list(set(p.category for p in products))
        transaction_gen = StochasticTransactionGenerator(n_traders=N_TRADERS, weeks=WEEKS, seed=RANDOM_SEED)
        trader_profiles = transaction_gen.generate_trader_profiles(categories)
        
        # 4. Generate transactions
        transactions_data = transaction_gen.generate_transactions(products, trader_profiles)
        
        print(f"\n📊 Transaction Statistics:")
        print(f"  Total transactions: {len(transactions_data)}")
        print(f"  Avg per trader: {len(transactions_data) / N_TRADERS:.1f}")
        print(f"  Date range: {min(tx['timestamp'] for tx in transactions_data)} to {max(tx['timestamp'] for tx in transactions_data)}")
        
        # 5. Save to database
        tx_count, event_count = create_transactions_and_events(db, transactions_data, traders, products)
        
        # 6. Summary
        print("\n" + "=" * 70)
        print("✅ DATA GENERATION COMPLETE!")
        print("=" * 70)
        print(f"  👥 Traders created: {N_TRADERS}")
        print(f"  💳 Transactions: {tx_count}")
        print(f"  📊 Analytics events: {event_count}")
        print(f"  📅 Time period: {WEEKS} weeks ({WEEKS * 7} days)")
        print("=" * 70)
        print("\n💡 Next steps:")
        print("  1. Run ETL pipeline: python analytics/etl_pipeline.py")
        print("  2. Train ML models: python ml/ml.py")
        print("  3. Test recommendations in the app!")
        print("=" * 70)
        
    except Exception as e:
        print(f"\n❌ Error: {e}")
        import traceback
        traceback.print_exc()
        db.rollback()
    finally:
        db.close()


if __name__ == "__main__":
    generate_training_data()

