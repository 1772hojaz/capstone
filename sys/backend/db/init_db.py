"""
Database initialization script with sample data
"""
from db.database import engine, SessionLocal, Base
from models.models import (
    User, Product, GroupBuy, PickupLocation, SupplierProduct, 
    ProductPricingTier, SupplierPickupLocation, SupplierOrder,
    SupplierOrderItem, SupplierInvoice, SupplierPayment, SupplierNotification
)
from authentication.auth import hash_password
# datetime imports removed - no longer needed for admin groups
# random is not required here because seeding is delegated to the Mbare scripts
# Use the Mbare seeders for realistic product and trader data
from db.seed_mbare_products import seed_mbare_products
from db.seed_mbare_data import main as seed_mbare_data_main
import random
from datetime import datetime, timedelta, UTC

def create_suppliers_and_related_data(db):
    """Create suppliers and populate all supplier-related tables"""
    
    print("\n🏪 Creating suppliers and supplier ecosystem...")
    
    # Create supplier users
    suppliers_data = [
        {
            "email": "supplier1@mbare.co.zw",
            "full_name": "Mbare Fruits Supplier",
            "location_zone": "Mbare",
            "business_type": "fruits_wholesale"
        },
        {
            "email": "supplier2@mbare.co.zw", 
            "full_name": "Mbare Vegetables Co",
            "location_zone": "Mbare",
            "business_type": "vegetables_wholesale"
        },
        {
            "email": "supplier3@mbare.co.zw",
            "full_name": "Mbare Grains & Legumes",
            "location_zone": "Mbare", 
            "business_type": "grains_legumes"
        },
        {
            "email": "supplier4@mbare.co.zw",
            "full_name": "Mbare Poultry Farm",
            "location_zone": "Glen View",
            "business_type": "poultry"
        },
        {
            "email": "supplier5@mbare.co.zw",
            "full_name": "Mbare Fish & Protein",
            "location_zone": "Highfield",
            "business_type": "fish_protein"
        }
    ]
    
    suppliers = []
    for supplier_data in suppliers_data:
        supplier = User(
            email=supplier_data["email"],
            hashed_password=hash_password("supplier123"),
            full_name=supplier_data["full_name"],
            location_zone=supplier_data["location_zone"],
            is_admin=False,
            is_supplier=True
        )
        db.add(supplier)
        suppliers.append({
            "user": supplier,
            "business_type": supplier_data["business_type"]
        })
    
    db.commit()
    print(f"✅ Created {len(suppliers)} supplier users")
    
    # Create supplier pickup locations
    supplier_locations = []
    for i, supplier_info in enumerate(suppliers):
        location = SupplierPickupLocation(
            supplier_id=supplier_info["user"].id,
            name=f"{supplier_info['user'].full_name} - Main Warehouse",
            address=f"Plot {i+1}, Mbare Industrial Area, Harare",
            city="Harare",
            province="Harare",
            phone=f"+263 24 2{i+1:02d} 1234",
            operating_hours="Mon-Fri 6:00-18:00, Sat 6:00-14:00",
            is_active=True
        )
        db.add(location)
        supplier_locations.append(location)
    
    db.commit()
    print(f"✅ Created {len(supplier_locations)} supplier pickup locations")
    
    # Get all products and assign them to suppliers based on category
    products = db.query(Product).all()
    
    # Category to supplier mapping
    category_suppliers = {
        "Fruits": [s for s in suppliers if s["business_type"] == "fruits_wholesale"],
        "Vegetables": [s for s in suppliers if s["business_type"] == "vegetables_wholesale"],
        "Grains": [s for s in suppliers if s["business_type"] == "grains_legumes"],
        "Legumes": [s for s in suppliers if s["business_type"] == "grains_legumes"],
        "Poultry": [s for s in suppliers if s["business_type"] == "poultry"],
        "Fish": [s for s in suppliers if s["business_type"] == "fish_protein"],
        "Protein": [s for s in suppliers if s["business_type"] == "fish_protein"]
    }
    
    supplier_products_created = 0
    pricing_tiers_created = 0
    
    for product in products:
        # Find appropriate suppliers for this product category
        category_suppliers_list = category_suppliers.get(product.category, suppliers[:2])  # Default to first 2 suppliers
        
        if not category_suppliers_list:
            continue
            
        # Randomly assign 1-2 suppliers per product
        assigned_suppliers = random.sample(category_suppliers_list, min(len(category_suppliers_list), random.randint(1, 2)))
        
        for supplier_info in assigned_suppliers:
            # Create SupplierProduct
            supplier_product = SupplierProduct(
                supplier_id=supplier_info["user"].id,
                product_id=product.id,
                sku=f"MB-{supplier_info['user'].id:02d}-{product.id:03d}",
                stock_level=random.randint(100, 1000),
                min_bulk_quantity=product.moq // 2,
                is_active=True
            )
            db.add(supplier_product)
            supplier_products_created += 1
    
    db.commit()  # Commit supplier products first
    
    # Now create pricing tiers for each supplier product
    for supplier_product in db.query(SupplierProduct).all():
        # Create pricing tiers for this supplier product
        base_price = supplier_product.product.bulk_price
        tiers = [
            {"min_qty": 1, "max_qty": 9, "price": base_price * 1.2},  # Retail
            {"min_qty": 10, "max_qty": 49, "price": base_price * 1.1},  # Small bulk
            {"min_qty": 50, "max_qty": 99, "price": base_price},  # Standard bulk
            {"min_qty": 100, "max_qty": None, "price": base_price * 0.9}  # Large bulk
        ]
        
        for tier in tiers:
            pricing_tier = ProductPricingTier(
                supplier_product_id=supplier_product.id,
                min_quantity=tier["min_qty"],
                max_quantity=tier["max_qty"],
                unit_price=tier["price"],
                description="Retail pricing" if tier["min_qty"] == 1 else f"Bulk ({tier['min_qty']}+ units) pricing"
            )
            db.add(pricing_tier)
            pricing_tiers_created += 1
    
    print(f"✅ Created {supplier_products_created} supplier-product relationships")
    print(f"✅ Created {pricing_tiers_created} product pricing tiers")
    
    # Create some sample supplier orders
    orders_created = 0
    order_items_created = 0
    
    # Get some traders to create orders for
    traders = db.query(User).filter(~User.is_supplier, ~User.is_admin).limit(10).all()
    
    for trader in traders:
        # Create 1-3 orders per trader
        num_orders = random.randint(1, 3)
        
        for _ in range(num_orders):
            # Random supplier
            supplier_info = random.choice(suppliers)
            
            # Get supplier's products
            supplier_products = db.query(SupplierProduct).filter(
                SupplierProduct.supplier_id == supplier_info["user"].id
            ).all()
            
            if not supplier_products:
                continue
                
            # Create order
            order = SupplierOrder(
                supplier_id=supplier_info["user"].id,
                order_number=f"SO-{supplier_info['user'].id:02d}-{trader.id:03d}-{random.randint(1000, 9999)}",
                status=random.choice(["pending", "confirmed", "shipped", "delivered"]),
                total_value=random.uniform(500, 5000),
                total_savings=random.uniform(50, 500),
                delivery_method=random.choice(["pickup", "delivery"]),
                delivery_location=f"{trader.location_zone} Area, Harare",
                special_instructions="Handle with care - fresh produce",
                created_at=datetime.now(UTC) - timedelta(days=random.randint(1, 30))
            )
            db.add(order)
            db.commit()  # Commit order to get ID
            orders_created += 1
            
            # Create order items
            num_items = random.randint(2, 5)
            selected_products = random.sample(supplier_products, min(num_items, len(supplier_products)))
            
            for sp in selected_products:
                quantity = random.randint(10, 100)
                unit_price = sp.product.bulk_price * random.uniform(0.9, 1.1)
                total_amount = quantity * unit_price
                
                order_item = SupplierOrderItem(
                    supplier_order_id=order.id,
                    supplier_product_id=sp.id,
                    quantity=quantity,
                    unit_price=unit_price,
                    total_amount=total_amount
                )
                db.add(order_item)
                order_items_created += 1
            
            db.commit()  # Commit order items
    
    # Create supplier invoices and payments
    invoices_created = 0
    payments_created = 0
    
    orders = db.query(SupplierOrder).filter(SupplierOrder.status == "delivered").limit(20).all()
    
    for order in orders:
        # Create invoice
        invoice = SupplierInvoice(
            supplier_id=order.supplier_id,
            order_id=order.id,
            invoice_number=f"INV-{order.supplier_id:02d}-{order.id:04d}",
            amount=order.total_value,
            tax_amount=order.total_value * 0.15,  # 15% VAT
            total_amount=order.total_value * 1.15,
            status="paid",
            due_date=order.created_at + timedelta(days=30),
            paid_at=order.created_at + timedelta(days=random.randint(1, 15))
        )
        db.add(invoice)
        invoices_created += 1
        
        # Create payment
        payment = SupplierPayment(
            supplier_id=order.supplier_id,
            amount=invoice.total_amount,
            payment_method=random.choice(["bank_transfer", "mobile_money", "cash"]),
            reference_number=f"PAY-{order.supplier_id:02d}-{order.id:04d}",
            status="completed",
            processed_at=invoice.paid_at
        )
        db.add(payment)
        payments_created += 1
    
    db.commit()
    print(f"✅ Created {invoices_created} supplier invoices")
    print(f"✅ Created {payments_created} supplier payments")
    
    # Create supplier notifications
    notifications_created = 0
    notification_types = [
        ("order", "New order received"),
        ("payment", "Payment processed"),
        ("system", "System maintenance scheduled")
    ]
    
    for supplier_info in suppliers:
        # Create 2-5 notifications per supplier
        num_notifications = random.randint(2, 5)
        
        for _ in range(num_notifications):
            notif_type, title = random.choice(notification_types)
            
            notification = SupplierNotification(
                supplier_id=supplier_info["user"].id,
                title=title,
                message=f"This is a {notif_type} notification for {supplier_info['user'].full_name}",
                type=notif_type,
                is_read=random.choice([True, False])
            )
            db.add(notification)
            notifications_created += 1
    
    db.commit()
    print(f"✅ Created {notifications_created} supplier notifications")
    
    return len(suppliers)

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

        # Create some regular traders first (before suppliers)
        print("👥 Creating sample traders...")
        traders_data = [
            {
                "email": "trader1@mbare.co.zw",
                "full_name": "John Mbare Trader",
                "location_zone": "Mbare",
            },
            {
                "email": "trader2@mbare.co.zw", 
                "full_name": "Mary Vegetable Vendor",
                "location_zone": "Glen View",
            },
            {
                "email": "trader3@mbare.co.zw",
                "full_name": "Peter Fruit Stall",
                "location_zone": "Highfield",
            },
            {
                "email": "trader4@mbare.co.zw",
                "full_name": "Sarah Grocer",
                "location_zone": "Warren Park",
            },
            {
                "email": "trader5@mbare.co.zw",
                "full_name": "David Hawker",
                "location_zone": "Budiriro",
            }
        ]
        
        for trader_data in traders_data:
            trader = User(
                email=trader_data["email"],
                hashed_password=hash_password("password123"),
                full_name=trader_data["full_name"],
                location_zone=trader_data["location_zone"],
                is_admin=False,
                is_supplier=False
            )
            db.add(trader)
        db.commit()
        print("✅ Created 5 sample traders")

        # Use the Mbare seed scripts to populate realistic products, traders, transactions
        print("\n📦 Seeding Mbare products (via seed_mbare_products.py)...")
        try:
            seed_mbare_products()
        except Exception as e:
            print(f"⚠️  Warning: seed_mbare_products failed: {e}")

        # Create suppliers and all related data
        try:
            suppliers_count = create_suppliers_and_related_data(db)
            print(f"✅ Created {suppliers_count} suppliers with complete ecosystem")
        except Exception as e:
            print(f"⚠️  Warning: supplier creation failed: {e}")

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
        suppliers_count = db.query(User).filter(User.is_supplier).count()
        products_count = db.query(Product).count()
        active_gb_count = db.query(GroupBuy).filter(GroupBuy.status == "active").count()
        completed_gb_count = db.query(GroupBuy).filter(GroupBuy.status == "completed").count()
        supplier_products_count = db.query(SupplierProduct).count()
        orders_count = db.query(SupplierOrder).count()

        print("\n📊 Summary:")
        print("   - Admin: admin@groupbuy.com / admin123")
        print(f"   - Traders: {traders_count} (example: trader1@mbare.co.zw / password123)")
        print(f"   - Suppliers: {suppliers_count} (example: supplier1@mbare.co.zw / supplier123)")
        print(f"   - Products: {products_count}")
        print(f"   - Supplier-Product Relationships: {supplier_products_count}")
        print(f"   - Supplier Orders: {orders_count}")
        print(f"   - Active Group-Buys: {active_gb_count}")
        print(f"   - Completed Group-Buys: {completed_gb_count}")
        
    except Exception as e:
        print(f"Error: {e}")
        db.rollback()
    finally:
        db.close()

if __name__ == "__main__":
    init_database()
