#!/usr/bin/env python3
"""Debug script to test recommendation flow"""

from db.database import SessionLocal
from models.models import User, GroupBuy, AdminGroup
from ml.ml import get_hybrid_recommendations, get_fallback_recommendations, get_admin_group_recommendations
from datetime import datetime

def debug_recommendations():
    db = SessionLocal()

    # Find a regular trader
    trader = db.query(User).filter(
        User.is_admin == False,
        User.is_supplier == False
    ).first()

    print("=" * 60)
    print("Debugging Recommendations API")
    print("=" * 60)

    if trader:
        print(f"Testing with user: {trader.full_name} (ID: {trader.id})")
        
        # Check GroupBuys
        active_gbs = db.query(GroupBuy).filter(
            GroupBuy.status == "active",
            GroupBuy.deadline > datetime.utcnow()
        ).count()
        print(f"\nActive GroupBuys: {active_gbs}")
        
        # Check AdminGroups
        active_admin = db.query(AdminGroup).filter(AdminGroup.is_active == True).count()
        print(f"Active AdminGroups: {active_admin}")
        
        # Test get_hybrid_recommendations
        print("\n--- Testing get_hybrid_recommendations ---")
        try:
            recs = get_hybrid_recommendations(trader.id, db)
            print(f"Results: {len(recs)} recommendations")
            if recs:
                for r in recs[:3]:
                    name = r.get("product_name", r.get("name", "Unknown"))
                    score = r.get("recommendation_score", r.get("match_score", 0))
                    print(f"  - {name} (Score: {score})")
            else:
                print("  NO RECOMMENDATIONS RETURNED!")
        except Exception as e:
            print(f"Error: {e}")
            import traceback
            traceback.print_exc()
        
        # Test get_fallback_recommendations  
        print("\n--- Testing get_fallback_recommendations ---")
        try:
            recs = get_fallback_recommendations(trader, db)
            print(f"Results: {len(recs)} recommendations")
            if not recs:
                print("  No fallback recommendations (no active GroupBuys?)")
        except Exception as e:
            print(f"Error: {e}")
        
        # Test get_admin_group_recommendations
        print("\n--- Testing get_admin_group_recommendations ---")
        try:
            admin_groups = db.query(AdminGroup).filter(AdminGroup.is_active == True).all()
            recs = get_admin_group_recommendations(trader, admin_groups, db)
            print(f"Results: {len(recs)} recommendations")
            if recs:
                for r in recs[:3]:
                    name = r.get("product_name", r.get("name", "Unknown"))
                    score = r.get("recommendation_score", r.get("match_score", 0))
                    print(f"  - {name} (Score: {score})")
        except Exception as e:
            print(f"Error: {e}")
            import traceback
            traceback.print_exc()
    
    db.close()
    print("\n" + "=" * 60)

if __name__ == "__main__":
    debug_recommendations()

