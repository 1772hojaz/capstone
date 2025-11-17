#!/usr/bin/env python3
"""Test what happens when a new product is uploaded"""

from db.database import SessionLocal
from models.models import User, Product, GroupBuy
from ml.ml import get_recommendations_for_user, feature_store
from datetime import datetime, timedelta

db = SessionLocal()

print("="*70)
print("TESTING NEW PRODUCT RECOMMENDATIONS")
print("="*70)

# Check current feature store
print(f"\n1. Current ML Model State:")
print(f"   Products in trained model: {len(feature_store.get('product_ids', []))}")
print(f"   Users in trained model: {len(feature_store.get('user_ids', []))}")

# Get existing products
existing_products = db.query(Product).all()
print(f"   Products in database: {len(existing_products)}")

# Check if there are any products NOT in the feature store
product_ids_in_model = set(feature_store.get('product_ids', []))
product_ids_in_db = set([p.id for p in existing_products])
new_products = product_ids_in_db - product_ids_in_model

print(f"\n2. Products NOT in trained model: {len(new_products)}")
if new_products:
    print(f"   New product IDs: {list(new_products)[:10]}")
    for pid in list(new_products)[:5]:
        product = db.query(Product).filter(Product.id == pid).first()
        if product:
            print(f"   - {product.name} (ID: {pid}, Category: {product.category})")

# Create a NEW product to simulate recent upload
print(f"\n3. Simulating NEW Product Upload:")
new_product = Product(
    name="Test New Mango (Just Uploaded)",
    description="Fresh mangoes just added to the system",
    category="Fruits",
    unit_price=3.00,
    bulk_price=2.50,
    moq=50,
    image_url="https://example.com/mango.jpg",
    is_active=True
)
db.add(new_product)
db.commit()
db.refresh(new_product)
print(f"   Created new product: {new_product.name} (ID: {new_product.id})")
print(f"   Category: {new_product.category}, Price: ${new_product.bulk_price}")

# Create a GroupBuy for this new product
new_group_buy = GroupBuy(
    product_id=new_product.id,
    creator_id=1,  # Admin user
    location_zone="Mbare",
    deadline=datetime.utcnow() + timedelta(days=7),
    status="active",
    total_quantity=0,
    total_contributions=0.0
)
db.add(new_group_buy)
db.commit()
db.refresh(new_group_buy)
print(f"   Created GroupBuy for new product (GB ID: {new_group_buy.id})")

# Check if it's in the feature store
print(f"\n4. Checking if new product is in trained model:")
if new_product.id in product_ids_in_model:
    print(f"   ✓ Product IS in trained model")
else:
    print(f"   ✗ Product is NOT in trained model (Expected for newly uploaded product)")
    print(f"   This is the COLD START PROBLEM we need to solve!")

# Test recommendations for a user
print(f"\n5. Getting recommendations for a test user:")
test_user = db.query(User).filter(User.is_admin == False).first()
print(f"   User: {test_user.email}")

recommendations = get_recommendations_for_user(test_user, db)

# Check if new product appears in recommendations
new_product_in_recs = any(r.get('product_id') == new_product.id for r in recommendations)

print(f"\n6. Results:")
print(f"   Total recommendations: {len(recommendations)}")
print(f"   New product appears in recommendations: {'YES ✓' if new_product_in_recs else 'NO ✗'}")

if new_product_in_recs:
    for i, rec in enumerate(recommendations):
        if rec.get('product_id') == new_product.id:
            print(f"\n   New product recommendation:")
            print(f"   Position: #{i+1}")
            print(f"   Score: {rec.get('recommendation_score', 0):.3f}")
            print(f"   Reason: {rec.get('reason', 'No reason')}")
else:
    print(f"\n   ✗ NEW PRODUCT NOT RECOMMENDED")
    print(f"   Reason: Product not in trained model (feature_store)")
    print(f"   This is exactly the cold start problem!")
    print(f"\n   Top recommendations instead:")
    for i, rec in enumerate(recommendations[:3], 1):
        print(f"   {i}. {rec.get('product_name')} (Score: {rec.get('recommendation_score', 0):.3f})")

print(f"\n{'='*70}")
print("CONCLUSION:")
print("="*70)
if new_product_in_recs:
    print("✓ System CAN recommend new products (using simple rules)")
else:
    print("✗ System CANNOT fully recommend new products")
    print("  Recommendation: Implement Cold Start Handler")
    print("  The handler will use:")
    print("  - Category matching with user preferences")
    print("  - Price similarity analysis")
    print("  - Product metadata (description, category)")
    print("  - Popularity bootstrapping")
print("="*70)

# Cleanup
db.delete(new_group_buy)
db.delete(new_product)
db.commit()
print("\nTest product and group buy cleaned up.")

db.close()

