import numpy as np
import pandas as pd
from datetime import datetime, timedelta
from typing import List, Dict, Any
from faker import Faker
import random

class MbareMarketDataGenerator:
    def __init__(self, n_traders: int = 100, n_products: int = 74, n_days: int = 60):
        self.fake = Faker()
        self.n_traders = n_traders
        self.n_products = n_products
        self.n_days = n_days
        self.products = self._generate_products()
        
    def _generate_products(self) -> pd.DataFrame:
        # Product categories based on Mbare Musika market
        categories = {
            'Fruits': ['Apples', 'Bananas', 'Oranges', 'Mangoes', 'Pineapples', 'Avocados', 'Tomatoes', 'Onions'],
            'Vegetables': ['Cabbage', 'Rape', 'Covoice', 'Spinach', 'Carrots', 'Green Beans', 'Peas', 'Potatoes'],
            'Grains': ['Maize', 'Rice', 'Wheat', 'Millet', 'Sorghum', 'Beans', 'Peanuts', 'Cowpeas'],
            'Proteins': ['Kapenta', 'Meat', 'Chicken', 'Fish', 'Eggs', 'Milk', 'Yogurt', 'Cheese'],
            'Other': ['Cooking Oil', 'Sugar', 'Salt', 'Soap', 'Candles', 'Matches', 'Tea', 'Coffee']
        }
        
        products = []
        product_id = 0
        for category, items in categories.items():
            for item in items:
                base_price = round(random.uniform(0.5, 10.0), 2)  # Prices from $0.50 to $10.00
                products.append({
                    'product_id': product_id,
                    'name': item,
                    'category': category,
                    'base_price': base_price,
                    'wholesale_discount': random.uniform(0.1, 0.4),  # 10-40% discount for bulk
                    'shelf_life_days': random.choice([1, 2, 3, 7, 14, 30, 90, 180]),
                    'unit': self._get_unit_for_product(item)
                })
                product_id += 1
                
        return pd.DataFrame(products)
    
    def _get_unit_for_product(self, product_name: str) -> str:
        """Get appropriate unit of measurement for a product"""
        if product_name in ['Cooking Oil', 'Milk']:
            return 'liter'
        elif product_name in ['Rice', 'Beans', 'Maize', 'Wheat', 'Millet', 'Sorghum', 'Peanuts', 'Cowpeas', 'Sugar', 'Salt']:
            return 'kg'
        elif product_name in ['Eggs']:
            return 'dozen'
        else:
            return random.choice(['piece', 'bunch', 'packet'])
    
    def generate_transactions(self) -> pd.DataFrame:
        """Generate realistic market transactions"""
        transactions = []
        trader_ids = list(range(self.n_traders))
        product_ids = self.products['product_id'].tolist()
        
        # Generate temporal patterns (weekly seasonality)
        base_date = datetime.now() - timedelta(days=self.n_days)
        
        for day in range(self.n_days):
            current_date = base_date + timedelta(days=day)
            day_of_week = current_date.weekday()
            
            # Adjust transaction volume by day of week (more on market days)
            if day_of_week in [0, 3, 5]:  # Monday, Thursday, Saturday are market days
                daily_transactions = random.randint(40, 70)
            else:
                daily_transactions = random.randint(10, 30)
                
            for _ in range(daily_transactions):
                trader_id = random.choice(trader_ids)
                
                # Some products are more popular than others
                product_id = random.choices(
                    product_ids,
                    weights=self.products['base_price'].apply(lambda x: 1/(x**0.5)).tolist(),
                    k=1
                )[0]
                
                # Generate realistic quantities based on product type
                product_info = self.products[self.products['product_id'] == product_id].iloc[0]
                if product_info['unit'] == 'kg':
                    quantity = max(0.25, np.random.gamma(2, 2))  # 0.25kg to ~10kg
                elif product_info['unit'] == 'liter':
                    quantity = max(0.1, np.random.gamma(1, 1))  # 0.1L to ~5L
                elif product_info['unit'] == 'dozen':
                    quantity = max(1, int(np.random.poisson(2)))  # 1-6 dozen
                else:
                    quantity = max(1, int(np.random.poisson(3)))  # 1-10 items
                
                # Add some randomness to prices (simulating haggling, bulk discounts)
                unit_price = product_info['base_price'] * random.uniform(0.8, 1.2)
                
                transactions.append({
                    'timestamp': current_date,
                    'trader_id': trader_id,
                    'product_id': product_id,
                    'quantity': quantity,
                    'unit_price': round(unit_price, 2),
                    'day_of_week': day_of_week,
                    'is_wholesale': random.random() < 0.3  # 30% of transactions are wholesale
                })
                
        return pd.DataFrame(transactions)
    
    def generate_trader_profiles(self) -> pd.DataFrame:
        """Generate synthetic trader profiles with realistic attributes"""
        traders = []
        locations = ['Mbare', 'Highfield', 'Mufakose', 'Kuwadzana', 'Glen View', 'Budiriro', 'Dzivarasekwa', 'Kambuzuma']
        
        for i in range(self.n_traders):
            years_trading = max(1, int(np.random.exponential(5)))  # Most have 1-10 years experience
            
            traders.append({
                'trader_id': i,
                'name': self.fake.name(),
                'location_zone': random.choice(locations),
                'years_trading': years_trading,
                'weekly_budget': random.choice([50, 100, 200, 300, 500, 1000, 1500, 2000]),
                'preferred_categories': random.sample(
                    self.products['category'].unique().tolist(), 
                    k=random.randint(1, 3)
                ),
                'business_name': f"{self.fake.company()} {random.choice(['Trading', 'Enterprise', 'Ventures', '& Sons'])}",
                'phone_number': f"+26377{random.randint(2000000, 7999999)}",
                'registration_date': (datetime.now() - timedelta(days=random.randint(30, 365*5))).strftime('%Y-%m-%d')
            })
            
        return pd.DataFrame(traders)
    
    def generate_market_conditions(self) -> Dict[str, Any]:
        """Generate market conditions that affect pricing and availability"""
        conditions = {
            'exchange_rate': round(random.uniform(100, 500), 2),  # Simulated ZWL to USD rate
            'inflation_rate': round(random.uniform(1.0, 5.0), 2),  # Monthly %
            'fuel_price': round(random.uniform(1.5, 2.5), 2),  # USD per liter
            'electricity_availability': random.choice(['good', 'intermittent', 'poor']),
            'last_updated': datetime.now().strftime('%Y-%m-%d %H:%M:%S')
        }
        return conditions

# Example usage
if __name__ == "__main__":
    generator = MbareMarketDataGenerator(n_traders=50, n_days=90)
    
    # Generate and save sample data
    traders = generator.generate_trader_profiles()
    transactions = generator.generate_transactions()
    market_conditions = generator.generate_market_conditions()
    
    print(f"Generated {len(traders)} traders")
    print(f"Generated {len(transactions)} transactions")
    print("Sample trader:", traders.iloc[0].to_dict())
    print("Sample transaction:", transactions.iloc[0].to_dict())
    print("Market conditions:", market_conditions)
    
    # Save to CSV for inspection
    traders.to_csv('sample_traders.csv', index=False)
    transactions.to_csv('sample_transactions.csv', index=False)
    pd.DataFrame([market_conditions]).to_csv('market_conditions.csv', index=False)
