#!/usr/bin/env python3
"""Test how NEW TRADERS (users with no purchase history) get recommendations"""

import sys
import os
sys.path.insert(0, os.path.dirname(os.path.dirname(os.path.abspath(__file__))))

from db.database import SessionLocal
from models.models import User
from ml.ml import get_recommendations_for_user, calculate_user_similarity
from passlib.context import CryptContext

pwd_context = CryptContext(schemes=["bcrypt"], deprecated="auto")

db = SessionLocal()

print("="*70)
print("TESTING NEW TRADER RECOMMENDATIONS")
print("="*70)

# Create a BRAND NEW trader (simulating registration)
print("\n1. Creating BRAND NEW Trader:")
new_trader = User(
    email="newtrader@test.co.zw",
    hashed_password="$2b$12$dummyhashfortest",  # Dummy hash for testing
    full_name="Brand New Trader",
    location_zone="Mbare",
    is_admin=False,
    is_supplier=False,
    is_active=True,
    # REGISTRATION PREFERENCES (what new users provide during signup)
    preferred_categories=["Vegetables", "Grains", "Legumes"],  # Key!
    budget_range="medium",
    experience_level="beginner",
    preferred_group_sizes=["small", "medium"],
    participation_frequency="regular"
)
db.add(new_trader)
db.commit()
db.refresh(new_trader)

print(f"   Created: {new_trader.full_name} (ID: {new_trader.id})")
print(f"   Email: {new_trader.email}")
print(f"   Zone: {new_trader.location_zone}")
print(f"   Preferred Categories: {new_trader.preferred_categories}")
print(f"   Budget: {new_trader.budget_range}")
print(f"   Experience: {new_trader.experience_level}")

# Check if they have any purchase history
from models.models import Transaction
tx_count = db.query(Transaction).filter(Transaction.user_id == new_trader.id).count()
print(f"   Purchase History: {tx_count} transactions (ZERO - brand new!)")

# Find similar existing traders
print("\n2. Finding Similar Traders:")
existing_traders = db.query(User).filter(
    User.is_admin == False,
    User.id != new_trader.id,
    User.preferred_categories.isnot(None)
).limit(5).all()

print(f"   Comparing against {len(existing_traders)} existing traders...")
similar_traders = []
for trader in existing_traders:
    similarity = calculate_user_similarity(new_trader, trader)
    if similarity > 0.3:
        similar_traders.append((trader, similarity))
        print(f"   - {trader.email[:25]:25s} | Similarity: {similarity:.3f} | Categories: {trader.preferred_categories}")

similar_traders.sort(key=lambda x: x[1], reverse=True)

if similar_traders:
    print(f"\n   Found {len(similar_traders)} similar traders (similarity > 0.3)")
    print(f"   Most similar: {similar_traders[0][0].email} (score: {similar_traders[0][1]:.3f})")
else:
    print(f"\n   No similar traders found")

# Get recommendations for the new trader
print("\n3. Getting Recommendations for New Trader:")
print("   (Using similarity-based recommendation engine)")
recommendations = get_recommendations_for_user(new_trader, db)

print(f"\n4. RESULTS:")
print("="*70)

if recommendations:
    print(f"✓ NEW TRADER RECEIVED {len(recommendations)} RECOMMENDATIONS!")
    print(f"\n   Top 5 Recommendations:")
    for i, rec in enumerate(recommendations[:5], 1):
        print(f"\n   {i}. {rec.get('product_name', 'Unknown')[:40]:40s}")
        print(f"      Category: {rec.get('category', 'N/A'):15s} | Score: {rec.get('recommendation_score', 0):.3f}")
        print(f"      Reason: {rec.get('reason', 'No reason')}")
    
    # Analysis
    print(f"\n5. ANALYSIS:")
    print("="*70)
    
    # Check if recommended categories match preferences
    rec_categories = [r.get('category') for r in recommendations[:5]]
    matching_prefs = sum(1 for cat in rec_categories if cat in new_trader.preferred_categories)
    
    print(f"   User prefers: {', '.join(new_trader.preferred_categories)}")
    print(f"   Recommendations matching preferences: {matching_prefs}/5")
    
    if matching_prefs >= 3:
        print(f"   ✓ EXCELLENT personalization for new trader!")
    elif matching_prefs >= 2:
        print(f"   ✓ GOOD personalization")
    elif matching_prefs >= 1:
        print(f"   ⚠ SOME personalization")
    else:
        print(f"   ✗ NO personalization - recommendations not matching preferences")
    
    # Check recommendation quality
    avg_score = sum(r.get('recommendation_score', 0) for r in recommendations[:5]) / 5
    print(f"   Average score: {avg_score:.3f}")
    
    if avg_score > 0.6:
        print(f"   ✓ High confidence recommendations")
    elif avg_score > 0.4:
        print(f"   ✓ Moderate confidence recommendations")
    else:
        print(f"   ⚠ Low confidence recommendations")
    
    print(f"\n6. HOW IT WORKS:")
    print("="*70)
    print("   For NEW TRADERS (no purchase history):")
    print("   1. Uses REGISTRATION PREFERENCES (categories, budget, experience)")
    print("   2. Finds SIMILAR TRADERS based on preference similarity")
    print("   3. Recommends what SIMILAR TRADERS have joined")
    print("   4. Scores based on:")
    print("      - Similarity to other traders who joined")
    print("      - Number of similar traders who joined")
    print("      - Group MOQ progress")
    print("      - Deadline urgency")
    print("\n   This is COLLABORATIVE FILTERING based on user similarity!")
    
else:
    print(f"✗ NEW TRADER RECEIVED NO RECOMMENDATIONS")
    print(f"   This may indicate:")
    print(f"   - No active group buys available")
    print(f"   - No similar traders in system")

print("\n" + "="*70)
print("KEY INSIGHT:")
print("="*70)
print("NEW TRADERS get recommendations IMMEDIATELY upon registration by:")
print("- Collecting preferences during signup (categories, budget, etc.)")
print("- Finding similar existing traders")
print("- Recommending what those similar traders liked")
print("="*70)

# Cleanup
try:
    db.delete(new_trader)
    db.commit()
    print("\nTest trader cleaned up.")
except Exception as e:
    print(f"\nCleanup warning: {e}")
    db.rollback()

db.close()

