"""
Database initialization script with sample data
"""
from db.database import engine, SessionLocal, Base
from models.models import User, Product, GroupBuy, PickupLocation
from authentication.auth import hash_password
# datetime imports removed - no longer needed for admin groups
# random is not required here because seeding is delegated to the Mbare scripts
# Use the Mbare seeders for realistic product and trader data
from db.seed_mbare_products import seed_mbare_products
from db.seed_mbare_data import main as seed_mbare_data_main

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
        
        # Create admin user
        admin = User(
            email="admin@groupbuy.com",
            hashed_password=hash_password("admin123"),
            full_name="System Administrator",
            location_zone="Downtown",
            is_admin=True
        )
        db.add(admin)
        db.commit()
        print("Created admin user: admin@groupbuy.com")

        # Use the Mbare seed scripts to populate realistic products, traders, transactions
        print("\n📦 Seeding Mbare products (via seed_mbare_products.py)...")
        try:
            seed_mbare_products()
        except Exception as e:
            print(f"⚠️  Warning: seed_mbare_products failed: {e}")

        print("\n🌾 Seeding Mbare traders and transactions (via seed_mbare_data.py)...")
        try:
            seed_mbare_data_main()
        except Exception as e:
            print(f"⚠️  Warning: seed_mbare_data failed: {e}")
        
        # Create sample pickup locations
        pickup_locations_data = [
            {
                "id": "HARARE_A",
                "name": "Harare Central Branch",
                "address": "123 Main Street, Harare CBD",
                "city": "Harare",
                "province": "Harare",
                "phone": "+263 24 2123456",
                "operating_hours": "Mon-Fri 8:00-17:00, Sat 8:00-13:00"
            },
            {
                "id": "HARARE_B",
                "name": "Harare East Branch",
                "address": "456 East Avenue, Harare East",
                "city": "Harare",
                "province": "Harare",
                "phone": "+263 24 2789456",
                "operating_hours": "Mon-Fri 8:00-17:00, Sat 8:00-13:00"
            },
            {
                "id": "BULAWAYO_A",
                "name": "Bulawayo Central Branch",
                "address": "789 Central Avenue, Bulawayo CBD",
                "city": "Bulawayo",
                "province": "Bulawayo",
                "phone": "+263 29 2123456",
                "operating_hours": "Mon-Fri 8:00-17:00, Sat 8:00-13:00"
            },
            {
                "id": "GWERU_A",
                "name": "Gweru Main Branch",
                "address": "321 Main Street, Gweru CBD",
                "city": "Gweru",
                "province": "Midlands",
                "phone": "+263 54 2123456",
                "operating_hours": "Mon-Fri 8:00-17:00, Sat 8:00-13:00"
            },
            {
                "id": "MUTARE_A",
                "name": "Mutare Central Branch",
                "address": "654 Herbert Chitepo Street, Mutare CBD",
                "city": "Mutare",
                "province": "Manicaland",
                "phone": "+263 20 2123456",
                "operating_hours": "Mon-Fri 8:00-17:00, Sat 8:00-13:00"
            }
        ]
        
        pickup_locations = []
        for loc_data in pickup_locations_data:
            location = PickupLocation(**loc_data)
            pickup_locations.append(location)
            db.add(location)
        
        db.commit()
        print(f"Created {len(pickup_locations)} pickup locations")
        
        # Admin groups are now created by the Mbare seeding scripts
        
        # Auto-train ML models with initial data
        print("\n🤖 Training ML models...")
        try:
            # Use the async training coroutine by running it in an event loop
            import asyncio
            from ml import train_clustering_model_with_progress
            try:
                training_results = asyncio.run(train_clustering_model_with_progress(db))
                print("✅ ML models trained successfully!")
                print("   - Silhouette Score: {:.3f}".format(training_results.get('silhouette_score', float('nan'))))
                print("   - Clusters: {}".format(training_results.get('n_clusters', 'unknown')))
            except Exception as inner_ml_error:
                print(f"⚠️  Warning: Could not train ML models: {inner_ml_error}")
                print("   You can train them manually from the admin dashboard")
        except Exception as ml_error:
            print(f"⚠️  Warning: Could not import training routine: {ml_error}")
            print("   You can train them manually from the admin dashboard")
        
        print("\n✅ Database initialized successfully!")
        # Summarize using live counts to avoid undefined names
        traders_count = db.query(User).filter(~User.is_admin).count()
        products_count = db.query(Product).count()
        active_gb_count = db.query(GroupBuy).filter(GroupBuy.status == "active").count()
        completed_gb_count = db.query(GroupBuy).filter(GroupBuy.status == "completed").count()

        print("\n📊 Summary:")
        print("   - Admin: admin@groupbuy.com / admin123")
        print(f"   - Traders: {traders_count} (example: trader1@mbare.co.zw / password123)")
        print(f"   - Products: {products_count}")
        print(f"   - Active Group-Buys: {active_gb_count}")
        print(f"   - Completed Group-Buys: {completed_gb_count}")
        
    except Exception as e:
        print(f"Error: {e}")
        db.rollback()
    finally:
        db.close()

if __name__ == "__main__":
    init_database()
