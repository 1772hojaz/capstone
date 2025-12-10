#!/usr/bin/env python3
"""Test that new users get recommendations immediately"""

from db.database import SessionLocal
from models.models import User, Transaction
from ml.ml import get_hybrid_recommendations

db = SessionLocal()

# Find a user with NO transactions (simulates new signup)
users_with_tx = set(tx.user_id for tx in db.query(Transaction.user_id).distinct().all())
new_user = db.query(User).filter(
    ~User.id.in_(users_with_tx),
    User.is_admin == False,
    User.is_supplier == False
).first()

print("=" * 60)
print("New User Recommendation Test (Cold Start)")
print("=" * 60)

if new_user:
    print(f"\nTesting NEW USER (simulates fresh signup):")
    print(f"  User: {new_user.full_name} (ID: {new_user.id})")
    print(f"  Transactions: 0")
    print(f"  Preferred Categories: {new_user.preferred_categories}")
    
    # Get recommendations
    recs = get_hybrid_recommendations(new_user.id, db)
    print(f"\n✅ Recommendations received: {len(recs)} items")
    
    if recs:
        print("\nTop 3 recommendations:")
        for i, r in enumerate(recs[:3], 1):
            name = r.get("product_name", "Unknown")
            reason = r.get("reason", "N/A")
            score = r.get("recommendation_score", 0)
            print(f"  {i}. {name} (Score: {score:.2f})")
            print(f"     Why: {reason}")
        
        print("\n✅ SUCCESS: New users get recommendations IMMEDIATELY!")
    else:
        print("\n❌ PROBLEM: No recommendations returned for new user!")
else:
    print("\nNo new users found for testing")
    print("All users have transaction history")

print("\n" + "=" * 60)
db.close()

