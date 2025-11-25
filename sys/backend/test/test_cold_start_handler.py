#!/usr/bin/env python3
"""Test the Cold Start Handler for new products"""

import sys
import os
sys.path.insert(0, os.path.dirname(os.path.dirname(os.path.abspath(__file__))))

from db.database import SessionLocal
from models.models import User, Product, GroupBuy
from ml.ml import get_recommendations_for_user
from datetime import datetime, timedelta

db = SessionLocal()

print("="*70)
print("TESTING COLD START HANDLER")
print("="*70)

# Create a new product to simulate upload
print("\n1. Creating NEW Product (simulating upload):")
new_product = Product(
    name="FRESH STRAWBERRIES - Just Added",
    description="Premium fresh strawberries just harvested. Sweet and juicy. Perfect for bulk buyers.",
    category="Fruits",
    unit_price=4.00,
    bulk_price=3.20,
    moq=40,
    image_url="https://example.com/strawberries.jpg",
    is_active=True
)
db.add(new_product)
db.commit()
db.refresh(new_product)
print(f"   Created: {new_product.name} (ID: {new_product.id})")
print(f"   Category: {new_product.category}, Price: ${new_product.bulk_price}")

# Create a GroupBuy for this new product
new_group_buy = GroupBuy(
    product_id=new_product.id,
    creator_id=1,
    location_zone="Mbare",
    deadline=datetime.utcnow() + timedelta(days=5),
    status="active",
    total_quantity=15,
    total_contributions=0.0
)
db.add(new_group_buy)
db.commit()
db.refresh(new_group_buy)
print(f"   Created GroupBuy (ID: {new_group_buy.id})")

# Get a test user who likes Fruits
print("\n2. Finding test user:")
test_user = db.query(User).filter(User.is_admin == False).first()
print(f"   User: {test_user.email} (ID: {test_user.id})")

# Get recommendations
print("\n3. Getting recommendations WITH Cold Start Handler:")
recommendations = get_recommendations_for_user(test_user, db)

# Find the new product in recommendations
new_product_rec = None
new_product_position = None
for i, rec in enumerate(recommendations, 1):
    if rec.get('product_id') == new_product.id:
        new_product_rec = rec
        new_product_position = i
        break

print(f"\n4. RESULTS:")
print("="*70)

if new_product_rec:
    print(f"✓ NEW PRODUCT FOUND IN RECOMMENDATIONS!")
    print(f"\n   Position: #{new_product_position} out of {len(recommendations)}")
    print(f"   Score: {new_product_rec.get('recommendation_score', 0):.3f}")
    print(f"   Reason: {new_product_rec.get('reason', 'No reason')}")
    print(f"   Category: {new_product_rec.get('category')}")
    
    # Compare with other recommendations
    print(f"\n5. COMPARISON WITH OTHER RECOMMENDATIONS:")
    print("   Top 3 Recommendations:")
    for i, rec in enumerate(recommendations[:3], 1):
        is_new = " [NEW!]" if rec.get('product_id') == new_product.id else ""
        print(f"   {i}. {rec.get('product_name')[:40]:40s} | Score: {rec.get('recommendation_score', 0):.3f}{is_new}")
        print(f"      Reason: {rec.get('reason', 'No reason')}")
    
    # Analyze if cold start worked
    print(f"\n6. COLD START ANALYSIS:")
    score = new_product_rec.get('recommendation_score', 0)
    reason = new_product_rec.get('reason', '')
    
    if score > 0.6:
        print(f"   ✓ EXCELLENT: Score is {score:.3f} (competitive with established products)")
    elif score > 0.5:
        print(f"   ✓ GOOD: Score is {score:.3f} (better than default)")
    else:
        print(f"   ✗ POOR: Score is {score:.3f} (still using default)")
    
    if "category" in reason.lower() or "Matches" in reason:
        print(f"   ✓ Category matching WORKING")
    else:
        print(f"   ⚠ Category matching not evident")
    
    if "price" in reason.lower():
        print(f"   ✓ Price similarity analysis WORKING")
    else:
        print(f"   ⚠ Price similarity not evident")
    
    if "New product" in reason:
        print(f"   ✓ Properly identified as NEW product")
    
else:
    print(f"✗ NEW PRODUCT NOT FOUND IN RECOMMENDATIONS")
    print(f"   This suggests the cold start handler may not be working")
    print(f"\n   Received {len(recommendations)} recommendations:")
    for i, rec in enumerate(recommendations[:5], 1):
        print(f"   {i}. {rec.get('product_name')} (Score: {rec.get('recommendation_score', 0):.3f})")

print("\n" + "="*70)
print("COLD START HANDLER TEST COMPLETE")
print("="*70)

# Cleanup
try:
    db.delete(new_group_buy)
    db.delete(new_product)
    db.commit()
    print("\nTest product and group buy cleaned up.")
except Exception as e:
    print(f"\nCleanup warning: {e}")
    db.rollback()

db.close()

