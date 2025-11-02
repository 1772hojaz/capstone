#!/usr/bin/env python3
"""
Test script to verify improved recommendation scores after database reset
"""

from db.database import SessionLocal
from models.models import User
from ml.ml import get_recommendations_for_user, load_models
import random

def main():
    print("="*80)
    print("🎯 Testing Hybrid Recommender with 100 Traders Dataset")
    print("="*80)
    
    # Load models
    print("\n📦 Loading ML models...")
    load_models()
    print("✅ Models loaded\n")
    
    db = SessionLocal()
    
    # Get all traders
    traders = db.query(User).filter(~User.is_admin).all()
    print(f"👥 Total traders in database: {len(traders)}\n")
    
    # Test 5 random traders
    sample_traders = random.sample(traders, min(5, len(traders)))
    
    print("Testing recommendations for 5 random traders:")
    print("="*80)
    
    all_scores = []
    
    for i, trader in enumerate(sample_traders, 1):
        print(f"\n{i}. {trader.full_name}")
        print(f"   Email: {trader.email}")
        print(f"   Location: {trader.location_zone}")
        
        # Get recommendations
        recs = get_recommendations_for_user(trader, db)
        
        if not recs:
            print("   ⚠️  No recommendations generated")
            continue
        
        print("   📊 Top 5 Recommendations:")
        print("   " + "-"*76)
        
        for j, rec in enumerate(recs[:5], 1):
            score = rec['recommendation_score'] * 100
            all_scores.append(score)
            
            cf = rec.get('cf_score', 0) * 100
            cbf = rec.get('cbf_score', 0) * 100
            pop = rec.get('popularity_score', 0) * 100
            
            product_name = rec['product_name'][:35]
            
            print(f"   {j}. {product_name:35} | {score:5.1f}% "
                  f"(CF:{cf:5.1f}% CBF:{cbf:5.1f}% Pop:{pop:5.1f}%)")
    
    db.close()
    
    # Summary statistics
    if all_scores:
        print("\n" + "="*80)
        print("📈 Recommendation Score Statistics")
        print("="*80)
        print(f"Total recommendations tested: {len(all_scores)}")
        print(f"Max score: {max(all_scores):.1f}%")
        print(f"Min score: {min(all_scores):.1f}%")
        print(f"Average score: {sum(all_scores)/len(all_scores):.1f}%")
        print()
        
        if max(all_scores) > 70:
            print("✅ SUCCESS: Recommendation scores improved! Max > 70%")
        elif max(all_scores) > 60:
            print("✅ GOOD: Recommendation scores improved from previous 58%")
        else:
            print("⚠️  Scores similar to before. May need more diverse data.")
    
    print("\n" + "="*80)
    print("🎯 Test Complete!")
    print("="*80)

if __name__ == "__main__":
    main()
