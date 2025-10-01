"""
Synthetic Data Generator for SPACS AFRICA.
Creates realistic test data for cold-start scenarios.
"""

import random
import numpy as np
from datetime import datetime, timedelta
from typing import List, Dict
from uuid import uuid4
import logging
from faker import Faker

logger = logging.getLogger(__name__)
fake = Faker()

# African locations for realistic data
AFRICAN_CITIES = [
    {"name": "Lagos", "lat": 6.5244, "lng": 3.3792, "country": "Nigeria"},
    {"name": "Nairobi", "lat": -1.2864, "lng": 36.8172, "country": "Kenya"},
    {"name": "Accra", "lat": 5.6037, "lng": -0.1870, "country": "Ghana"},
    {"name": "Kampala", "lat": 0.3476, "lng": 32.5825, "country": "Uganda"},
    {"name": "Dar es Salaam", "lat": -6.7924, "lng": 39.2083, "country": "Tanzania"},
]

# Business types for informal traders
BUSINESS_TYPES = [
    "Corner Shop", "Market Stall", "Street Vendor", 
    "Mini Mart", "Roadside Kiosk", "Neighborhood Store"
]


class SyntheticDataGenerator:
    """Generate realistic synthetic data for testing and cold-start."""
    
    def __init__(self, seed: int = 42):
        """Initialize generator with random seed."""
        self.seed = seed
        random.seed(seed)
        np.random.seed(seed)
        Faker.seed(seed)
        
    def generate_users(self, num_users: int = 100) -> List[Dict]:
        """
        Generate synthetic user/trader data.
        
        Args:
            num_users: Number of users to generate
            
        Returns:
            List of user dictionaries
        """
        users = []
        
        for i in range(num_users):
            location = random.choice(AFRICAN_CITIES)
            # Add some location variance
            lat_variance = random.uniform(-0.1, 0.1)
            lng_variance = random.uniform(-0.1, 0.1)
            
            user = {
                'id': str(uuid4()),
                'email': fake.email(),
                'password_hash': '$2b$12$LQv3c1yqBWVHxkd0LHAkCOYz6TtxMQJqhN8/LewY5GyYzpLaEg7dO',  # "password123"
                'full_name': fake.name(),
                'business_name': f"{fake.first_name()}'s {random.choice(BUSINESS_TYPES)}",
                'phone': fake.phone_number()[:20],
                'location_lat': location['lat'] + lat_variance,
                'location_lng': location['lng'] + lng_variance,
                'location_name': f"{location['name']}, {location['country']}",
                'is_admin': False,
                'is_active': True
            }
            users.append(user)
        
        logger.info(f"Generated {num_users} synthetic users")
        return users
    
    def generate_transactions(
        self, 
        users: List[Dict], 
        products: List[Dict], 
        num_transactions: int = 500
    ) -> List[Dict]:
        """
        Generate synthetic transaction data with realistic patterns.
        
        Args:
            users: List of user dictionaries
            products: List of product dictionaries
            num_transactions: Number of transactions to generate
            
        Returns:
            List of transaction dictionaries
        """
        transactions = []
        
        # Create purchase patterns for users
        user_product_affinity = {}
        for user in users:
            # Each user has affinity for 2-5 products
            num_preferred = random.randint(2, 5)
            preferred_products = random.sample(products, num_preferred)
            user_product_affinity[user['id']] = preferred_products
        
        # Generate transactions
        for i in range(num_transactions):
            user = random.choice(users)
            
            # 70% chance to buy from preferred products, 30% random
            if random.random() < 0.7 and user['id'] in user_product_affinity:
                product = random.choice(user_product_affinity[user['id']])
            else:
                product = random.choice(products)
            
            # Quantity follows a log-normal distribution
            quantity = max(1, int(np.random.lognormal(1.5, 0.8)))
            
            # 20% chance it's a bulk purchase
            is_bulk = random.random() < 0.2
            unit_price = float(product['bulk_price']) if is_bulk else float(product['base_price'])
            total_price = unit_price * quantity
            
            # Transaction date in the past 90 days
            days_ago = random.randint(0, 90)
            transaction_date = datetime.now() - timedelta(days=days_ago)
            
            transaction = {
                'id': str(uuid4()),
                'user_id': user['id'],
                'product_id': product['id'],
                'quantity': quantity,
                'unit_price': unit_price,
                'total_price': total_price,
                'transaction_type': 'bulk' if is_bulk else 'individual',
                'transaction_date': transaction_date,
                'bulk_group_id': None  # Will be set if part of a group
            }
            transactions.append(transaction)
        
        logger.info(f"Generated {num_transactions} synthetic transactions")
        return transactions
    
    def generate_bulk_groups(
        self, 
        users: List[Dict], 
        products: List[Dict], 
        num_groups: int = 20
    ) -> List[Dict]:
        """
        Generate synthetic bulk purchase groups.
        
        Args:
            users: List of user dictionaries
            products: List of product dictionaries
            num_groups: Number of groups to generate
            
        Returns:
            List of bulk group dictionaries
        """
        groups = []
        
        for i in range(num_groups):
            product = random.choice(products)
            created_by = random.choice(users)
            
            # Group parameters
            target_quantity = random.choice([50, 100, 150, 200, 250])
            current_quantity = random.randint(0, target_quantity)
            
            # Calculate discount
            base_price = float(product['base_price'])
            bulk_price = float(product['bulk_price'])
            discount_percentage = ((base_price - bulk_price) / base_price) * 100
            
            # Status based on progress
            if current_quantity >= target_quantity:
                status = 'completed'
            elif current_quantity >= target_quantity * 0.8:
                status = 'closed'
            else:
                status = 'open'
            
            # Deadline: 3-14 days from now for open groups
            if status == 'open':
                deadline = datetime.now() + timedelta(days=random.randint(3, 14))
            else:
                deadline = datetime.now() - timedelta(days=random.randint(1, 30))
            
            group = {
                'id': str(uuid4()),
                'product_id': product['id'],
                'group_name': f"{product['name']} Bulk Group {i+1}",
                'target_quantity': target_quantity,
                'current_quantity': current_quantity,
                'discount_percentage': round(discount_percentage, 2),
                'status': status,
                'deadline': deadline,
                'created_by': created_by['id']
            }
            groups.append(group)
        
        logger.info(f"Generated {num_groups} synthetic bulk groups")
        return groups
    
    def generate_group_memberships(
        self, 
        groups: List[Dict], 
        users: List[Dict]
    ) -> List[Dict]:
        """
        Generate group membership data.
        
        Args:
            groups: List of bulk group dictionaries
            users: List of user dictionaries
            
        Returns:
            List of group membership dictionaries
        """
        memberships = []
        
        for group in groups:
            # Number of members based on current quantity
            num_members = random.randint(
                max(1, group['current_quantity'] // 20),
                max(2, group['current_quantity'] // 10)
            )
            
            # Select random members
            selected_users = random.sample(
                users, 
                min(num_members, len(users))
            )
            
            total_committed = 0
            for user in selected_users:
                # Distribute quantities to reach current_quantity
                remaining = group['current_quantity'] - total_committed
                if remaining <= 0:
                    break
                    
                quantity = random.randint(
                    1,
                    max(1, min(remaining, group['current_quantity'] // num_members + 10))
                )
                
                membership = {
                    'id': str(uuid4()),
                    'group_id': group['id'],
                    'user_id': user['id'],
                    'quantity_committed': quantity,
                    'joined_at': group['deadline'] - timedelta(days=random.randint(1, 10))
                }
                memberships.append(membership)
                total_committed += quantity
        
        logger.info(f"Generated {len(memberships)} group memberships")
        return memberships
    
    def calculate_user_features(
        self, 
        users: List[Dict], 
        transactions: List[Dict]
    ) -> List[Dict]:
        """
        Calculate feature store data from transactions.
        
        Args:
            users: List of user dictionaries
            transactions: List of transaction dictionaries
            
        Returns:
            List of feature store dictionaries
        """
        features = []
        
        for user in users:
            user_transactions = [t for t in transactions if t['user_id'] == user['id']]
            
            if not user_transactions:
                # Default features for users with no transactions
                features.append({
                    'user_id': user['id'],
                    'purchase_frequency': 0.0,
                    'avg_transaction_value': 0.0,
                    'price_sensitivity': random.uniform(0.4, 0.8),
                    'product_preferences': {},
                    'location_encoded': hash(user['location_name']) % 10,
                    'total_transactions': 0,
                    'total_spent': 0.0,
                    'last_purchase_date': None
                })
                continue
            
            # Calculate statistics
            total_transactions = len(user_transactions)
            total_spent = sum(t['total_price'] for t in user_transactions)
            avg_transaction_value = total_spent / total_transactions
            
            # Purchase frequency (transactions per week)
            dates = [t['transaction_date'] for t in user_transactions]
            date_range = (max(dates) - min(dates)).days
            purchase_frequency = (total_transactions / max(date_range / 7, 1)) if date_range > 0 else total_transactions
            
            # Price sensitivity (ratio of bulk to individual purchases)
            bulk_count = sum(1 for t in user_transactions if t['transaction_type'] == 'bulk')
            price_sensitivity = bulk_count / total_transactions if total_transactions > 0 else 0.5
            
            # Product preferences
            product_counts = {}
            for t in user_transactions:
                product_counts[t['product_id']] = product_counts.get(t['product_id'], 0) + 1
            
            # Normalize to preferences (0-1)
            max_count = max(product_counts.values()) if product_counts else 1
            product_preferences = {
                pid: count / max_count for pid, count in product_counts.items()
            }
            
            features.append({
                'user_id': user['id'],
                'purchase_frequency': round(purchase_frequency, 4),
                'avg_transaction_value': round(avg_transaction_value, 2),
                'price_sensitivity': round(price_sensitivity, 4),
                'product_preferences': product_preferences,
                'location_encoded': hash(user['location_name']) % 10,
                'total_transactions': total_transactions,
                'total_spent': round(total_spent, 2),
                'last_purchase_date': max(dates)
            })
        
        logger.info(f"Calculated features for {len(features)} users")
        return features


def insert_synthetic_data_to_db(
    users: List[Dict],
    transactions: List[Dict],
    groups: List[Dict],
    memberships: List[Dict],
    features: List[Dict]
):
    """
    Insert all synthetic data into the database.
    
    Args:
        users: List of user dictionaries
        transactions: List of transaction dictionaries
        groups: List of bulk group dictionaries
        memberships: List of membership dictionaries
        features: List of feature store dictionaries
    """
    from database import get_db_context
    from sqlalchemy import text
    import json
    
    with get_db_context() as db:
        # Insert users
        for user in users:
            query = text("""
                INSERT INTO users (
                    id, email, password_hash, full_name, business_name, phone,
                    location_lat, location_lng, location_name, is_admin, is_active
                ) VALUES (
                    :id::uuid, :email, :password_hash, :full_name, :business_name, :phone,
                    :location_lat, :location_lng, :location_name, :is_admin, :is_active
                ) ON CONFLICT (email) DO NOTHING
            """)
            db.execute(query, user)
        
        # Insert transactions
        for trans in transactions:
            query = text("""
                INSERT INTO transactions (
                    id, user_id, product_id, quantity, unit_price, total_price,
                    transaction_type, transaction_date
                ) VALUES (
                    :id::uuid, :user_id::uuid, :product_id::uuid, :quantity, 
                    :unit_price, :total_price, :transaction_type, :transaction_date
                )
            """)
            db.execute(query, trans)
        
        # Insert bulk groups
        for group in groups:
            query = text("""
                INSERT INTO bulk_groups (
                    id, product_id, group_name, target_quantity, current_quantity,
                    discount_percentage, status, deadline, created_by
                ) VALUES (
                    :id::uuid, :product_id::uuid, :group_name, :target_quantity, :current_quantity,
                    :discount_percentage, :status, :deadline, :created_by::uuid
                )
            """)
            db.execute(query, group)
        
        # Insert memberships
        for membership in memberships:
            query = text("""
                INSERT INTO group_memberships (
                    id, group_id, user_id, quantity_committed, joined_at
                ) VALUES (
                    :id::uuid, :group_id::uuid, :user_id::uuid, :quantity_committed, :joined_at
                ) ON CONFLICT DO NOTHING
            """)
            db.execute(query, membership)
        
        # Insert features
        for feature in features:
            query = text("""
                INSERT INTO feature_store (
                    user_id, purchase_frequency, avg_transaction_value, price_sensitivity,
                    product_preferences, location_encoded, total_transactions, total_spent, last_purchase_date
                ) VALUES (
                    :user_id::uuid, :purchase_frequency, :avg_transaction_value, :price_sensitivity,
                    :product_preferences::jsonb, :location_encoded, :total_transactions, :total_spent, :last_purchase_date
                ) ON CONFLICT (user_id) DO UPDATE SET
                    purchase_frequency = EXCLUDED.purchase_frequency,
                    avg_transaction_value = EXCLUDED.avg_transaction_value,
                    price_sensitivity = EXCLUDED.price_sensitivity,
                    product_preferences = EXCLUDED.product_preferences,
                    location_encoded = EXCLUDED.location_encoded,
                    total_transactions = EXCLUDED.total_transactions,
                    total_spent = EXCLUDED.total_spent,
                    last_purchase_date = EXCLUDED.last_purchase_date
            """)
            # Convert product_preferences dict to JSON
            feature_copy = feature.copy()
            feature_copy['product_preferences'] = json.dumps(feature['product_preferences'])
            db.execute(query, feature_copy)
        
        db.commit()
    
    logger.info("Successfully inserted all synthetic data into database")


if __name__ == "__main__":
    # Test synthetic data generation
    print("Testing Synthetic Data Generator...\n")
    
    generator = SyntheticDataGenerator(seed=42)
    
    # Note: Products must exist in DB first
    print("✓ Synthetic data generator initialized")
    print("Note: Full data generation requires database connection with products")
