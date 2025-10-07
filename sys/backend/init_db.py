"""
Database initialization script with sample data
"""
from database import engine, SessionLocal, Base
from models import User, Product, GroupBuy, Contribution, Transaction
from auth import hash_password
from datetime import datetime, timedelta
import random

def init_database():
    """Initialize database with sample data"""
    print("Creating database tables...")
    Base.metadata.create_all(bind=engine)
    
    db = SessionLocal()
    
    try:
        # Check if data already exists
        if db.query(User).first():
            print("Database already initialized!")
            return
        
        print("Creating sample data...")
        
        # Location zones
        zones = ["Downtown", "Uptown", "Suburbs", "EastSide", "WestSide"]
        
        # Create admin user
        admin = User(
            email="admin@groupbuy.com",
            hashed_password=hash_password("admin123"),
            full_name="System Administrator",
            location_zone="Downtown",
            is_admin=True
        )
        db.add(admin)
        
        # Create sample traders
        traders = []
        for i in range(50):
            trader = User(
                email=f"trader{i+1}@example.com",
                hashed_password=hash_password("password123"),
                full_name=f"Trader {i+1}",
                location_zone=random.choice(zones),
                is_admin=False
            )
            traders.append(trader)
            db.add(trader)
        
        db.commit()
        print(f"Created {len(traders)} traders")
        
        # Create sample products
        products_data = [
            {
                "name": "Rice 50kg Bag",
                "description": "Premium quality rice in bulk",
                "unit_price": 150.0,
                "bulk_price": 120.0,
                "moq": 100,
                "category": "Groceries",
                "image_url": "https://via.placeholder.com/300?text=Rice"
            },
            {
                "name": "Cooking Oil 25L",
                "description": "Refined sunflower cooking oil",
                "unit_price": 80.0,
                "bulk_price": 65.0,
                "moq": 50,
                "category": "Groceries",
                "image_url": "https://via.placeholder.com/300?text=Oil"
            },
            {
                "name": "Sugar 50kg Bag",
                "description": "White refined sugar in bulk",
                "unit_price": 120.0,
                "bulk_price": 95.0,
                "moq": 80,
                "category": "Groceries",
                "image_url": "https://via.placeholder.com/300?text=Sugar"
            },
            {
                "name": "Maize Meal 25kg",
                "description": "Fine maize meal for household use",
                "unit_price": 60.0,
                "bulk_price": 48.0,
                "moq": 120,
                "category": "Groceries",
                "image_url": "https://via.placeholder.com/300?text=Maize"
            },
            {
                "name": "Laundry Detergent 10kg",
                "description": "High-quality washing powder",
                "unit_price": 45.0,
                "bulk_price": 35.0,
                "moq": 60,
                "category": "Household",
                "image_url": "https://via.placeholder.com/300?text=Detergent"
            },
            {
                "name": "Toilet Paper 48-Pack",
                "description": "Soft toilet tissue paper in bulk",
                "unit_price": 30.0,
                "bulk_price": 22.0,
                "moq": 100,
                "category": "Household",
                "image_url": "https://via.placeholder.com/300?text=Toilet+Paper"
            },
            {
                "name": "Canned Tomatoes 24-Pack",
                "description": "Canned tomatoes for cooking",
                "unit_price": 50.0,
                "bulk_price": 38.0,
                "moq": 50,
                "category": "Groceries",
                "image_url": "https://via.placeholder.com/300?text=Tomatoes"
            },
            {
                "name": "Pasta 20kg Box",
                "description": "Assorted pasta varieties",
                "unit_price": 70.0,
                "bulk_price": 55.0,
                "moq": 40,
                "category": "Groceries",
                "image_url": "https://via.placeholder.com/300?text=Pasta"
            }
        ]
        
        products = []
        for p_data in products_data:
            product = Product(**p_data)
            products.append(product)
            db.add(product)
        
        db.commit()
        print(f"Created {len(products)} products")
        
        # Create sample group-buys
        group_buys = []
        for i in range(15):
            product = random.choice(products)
            creator = random.choice(traders)
            
            group = GroupBuy(
                product_id=product.id,
                creator_id=creator.id,
                location_zone=creator.location_zone,
                deadline=datetime.utcnow() + timedelta(days=random.randint(3, 14)),
                status="active"
            )
            group_buys.append(group)
            db.add(group)
        
        db.commit()
        print(f"Created {len(group_buys)} active group-buys")
        
        # Create sample contributions and transactions
        for group in group_buys[:10]:  # Add contributions to first 10 groups
            num_participants = random.randint(3, 10)
            selected_traders = random.sample(traders, num_participants)
            
            for trader in selected_traders:
                quantity = random.randint(1, 10)
                contribution_amount = quantity * group.product.bulk_price * (1 - group.product.savings_factor)
                upfront = contribution_amount * 0.5
                
                contrib = Contribution(
                    group_buy_id=group.id,
                    user_id=trader.id,
                    quantity=quantity,
                    contribution_amount=contribution_amount,
                    paid_amount=upfront,
                    is_fully_paid=random.choice([True, False])
                )
                db.add(contrib)
                
                # Update group totals
                group.total_quantity += quantity
                group.total_contributions += contribution_amount
                group.total_paid += upfront
                
                # Create transaction
                transaction = Transaction(
                    user_id=trader.id,
                    group_buy_id=group.id,
                    product_id=group.product_id,
                    quantity=quantity,
                    amount=upfront,
                    transaction_type="upfront",
                    location_zone=trader.location_zone
                )
                db.add(transaction)
        
        db.commit()
        print("Created sample contributions and transactions")
        
        # Create some historical completed group-buys for ML training
        for i in range(10):
            product = random.choice(products)
            creator = random.choice(traders)
            
            completed_group = GroupBuy(
                product_id=product.id,
                creator_id=creator.id,
                location_zone=creator.location_zone,
                deadline=datetime.utcnow() - timedelta(days=random.randint(1, 30)),
                status="completed",
                completed_at=datetime.utcnow() - timedelta(days=random.randint(1, 30))
            )
            db.add(completed_group)
            db.commit()
            
            # Add contributions for completed groups
            num_participants = random.randint(5, 12)
            selected_traders = random.sample(traders, num_participants)
            
            for trader in selected_traders:
                quantity = random.randint(2, 15)
                contribution_amount = quantity * product.bulk_price
                
                contrib = Contribution(
                    group_buy_id=completed_group.id,
                    user_id=trader.id,
                    quantity=quantity,
                    contribution_amount=contribution_amount,
                    paid_amount=contribution_amount,
                    is_fully_paid=True
                )
                db.add(contrib)
                
                completed_group.total_quantity += quantity
                completed_group.total_contributions += contribution_amount
                completed_group.total_paid += contribution_amount
                
                # Create historical transaction
                transaction = Transaction(
                    user_id=trader.id,
                    group_buy_id=completed_group.id,
                    product_id=product.id,
                    quantity=quantity,
                    amount=contribution_amount,
                    transaction_type="final",
                    location_zone=trader.location_zone,
                    created_at=datetime.utcnow() - timedelta(days=random.randint(1, 30))
                )
                db.add(transaction)
        
        db.commit()
        print("Created historical completed group-buys")
        
        # Auto-train ML models with initial data
        print("\n🤖 Training ML models...")
        try:
            from ml import train_clustering_model
            training_results = train_clustering_model(db)
            print(f"✅ ML models trained successfully!")
            print(f"   - Silhouette Score: {training_results['silhouette_score']:.3f}")
            print(f"   - Clusters: {training_results['n_clusters']}")
        except Exception as ml_error:
            print(f"⚠️  Warning: Could not train ML models: {ml_error}")
            print("   You can train them manually from the admin dashboard")
        
        print("\n✅ Database initialized successfully!")
        print(f"\n📊 Summary:")
        print(f"   - Admin: admin@groupbuy.com / admin123")
        print(f"   - Traders: {len(traders)} (trader1@example.com / password123, etc.)")
        print(f"   - Products: {len(products)}")
        print(f"   - Active Group-Buys: 15")
        print(f"   - Completed Group-Buys: 10")
        
    except Exception as e:
        print(f"Error: {e}")
        db.rollback()
    finally:
        db.close()

if __name__ == "__main__":
    init_database()
