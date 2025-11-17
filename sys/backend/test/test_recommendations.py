#!/usr/bin/env python3
"""Test script to check if recommendations make sense"""

from db.database import SessionLocal
from models.models import User, Product, Transaction, GroupBuy
from ml.ml import get_recommendations_for_user
from datetime import datetime

db = SessionLocal()

print("="*70)
print("TESTING RECOMMENDATION SYSTEM")
print("="*70)

# Get sample users
print("\n1. Sample Users in Database:")
users = db.query(User).filter(User.is_admin == False).limit(5).all()
for u in users:
    tx_count = db.query(Transaction).filter(Transaction.user_id == u.id).count()
    print(f"   User ID: {u.id} | Email: {u.email[:20]}... | Zone: {u.location_zone} | Cluster: {u.cluster_id} | Transactions: {tx_count}")

# Get sample products
print("\n2. Sample Products:")
products = db.query(Product).limit(5).all()
for p in products:
    print(f"   ID: {p.id} | {p.name:30s} | Category: {p.category:15s} | Bulk Price: ${p.bulk_price:.2f}")

# Check active group buys
active_groups = db.query(GroupBuy).filter(
    GroupBuy.status == "active",
    GroupBuy.deadline > datetime.utcnow()
).all()
print(f"\n3. Active Group Buys: {len(active_groups)}")
if active_groups:
    for gb in active_groups[:5]:
        print(f"   GB ID: {gb.id} | Product: {gb.product.name if gb.product else 'Unknown':30s} | Zone: {gb.location_zone} | Progress: {gb.moq_progress:.1f}%")

# Test recommendations for a user with transaction history
print("\n4. Testing Recommendations:")
test_user = users[0]
print(f"\nGetting recommendations for User ID: {test_user.id} ({test_user.email})")
print(f"   User's Location Zone: {test_user.location_zone}")
print(f"   User's Cluster: {test_user.cluster_id}")

# Check user's purchase history
user_transactions = db.query(Transaction).filter(Transaction.user_id == test_user.id).all()
if user_transactions:
    print(f"   User has {len(user_transactions)} transactions")
    # Show what categories they've bought
    product_ids = [tx.product_id for tx in user_transactions]
    purchased_products = db.query(Product).filter(Product.id.in_(product_ids)).all()
    categories = {}
    for p in purchased_products:
        categories[p.category] = categories.get(p.category, 0) + 1
    print(f"   Top purchased categories: {dict(sorted(categories.items(), key=lambda x: x[1], reverse=True)[:3])}")

# Get recommendations
try:
    recommendations = get_recommendations_for_user(test_user, db)
    print(f"\n   Received {len(recommendations)} recommendations:")
    print("\n   Top 5 Recommendations:")
    print("   " + "-"*68)
    for i, rec in enumerate(recommendations[:5], 1):
        score = rec.get('recommendation_score', 0)
        product_name = rec.get('product_name', 'Unknown')
        category = rec.get('category', 'N/A')
        savings = rec.get('savings', 0)
        reason = rec.get('reason', 'No reason')
        moq_progress = rec.get('moq_progress', 0)
        
        print(f"   {i}. {product_name[:35]:35s} | Score: {score:.3f}")
        print(f"      Category: {category:15s} | Savings: {savings:.0f}% | MOQ: {moq_progress:.0f}%")
        print(f"      Reason: {reason}")
        print()
    
    # Analysis
    print("\n5. Recommendation Quality Analysis:")
    
    # Check if recommendations match user's purchase history
    rec_categories = [r.get('category') for r in recommendations[:5]]
    matching_categories = sum(1 for cat in rec_categories if cat in categories)
    print(f"   - Recommendations matching user's purchase categories: {matching_categories}/5")
    
    # Check variety
    unique_categories = len(set(rec_categories))
    print(f"   - Category variety in top 5: {unique_categories} unique categories")
    
    # Check if scores are reasonable
    scores = [r.get('recommendation_score', 0) for r in recommendations[:5]]
    print(f"   - Score range: {min(scores):.3f} to {max(scores):.3f}")
    
    # Check if there's personalization (scores should vary)
    if len(set(scores)) > 1:
        print(f"   - ✓ Scores are personalized (vary by recommendation)")
    else:
        print(f"   - ⚠ All scores are the same - may need improvement")
    
except Exception as e:
    print(f"   ERROR: {e}")
    import traceback
    traceback.print_exc()

print("\n" + "="*70)
print("RECOMMENDATION TEST COMPLETE")
print("="*70)

db.close()

