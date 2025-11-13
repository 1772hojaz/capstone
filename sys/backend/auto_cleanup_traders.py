"""
Auto cleanup - removes last N traders without confirmation
"""
from db.database import SessionLocal
from models.models import User, Transaction
from models.analytics_models import EventsRaw, UserBehaviorFeatures

def auto_cleanup_traders(n_traders=200):
    db = SessionLocal()
    
    try:
        print("=" * 70)
        print("AUTO CLEANUP - REMOVING LAST BATCH OF TRADERS")
        print("=" * 70)
        
        # Get traders to remove
        all_traders = db.query(User).filter(
            User.is_admin == False,
            User.is_supplier == False
        ).order_by(User.id.desc()).all()
        
        total_traders = len(all_traders)
        print(f"\n📊 Total Traders: {total_traders}")
        
        if total_traders == 0:
            print("\n✅ No traders to remove!")
            return
        
        traders_to_remove = all_traders[:min(n_traders, total_traders)]
        trader_ids = [t.id for t in traders_to_remove]
        
        print(f"🗑️  Removing {len(trader_ids)} traders...")
        
        # Delete in order
        print("  Deleting analytics events...")
        deleted = db.query(EventsRaw).filter(EventsRaw.user_id.in_(trader_ids)).delete(synchronize_session=False)
        print(f"    ✅ {deleted:,} events deleted")
        
        print("  Deleting user features...")
        deleted = db.query(UserBehaviorFeatures).filter(UserBehaviorFeatures.user_id.in_(trader_ids)).delete(synchronize_session=False)
        print(f"    ✅ {deleted} features deleted")
        
        print("  Deleting transactions...")
        deleted = db.query(Transaction).filter(Transaction.user_id.in_(trader_ids)).delete(synchronize_session=False)
        print(f"    ✅ {deleted:,} transactions deleted")
        
        print("  Deleting trader accounts...")
        deleted = db.query(User).filter(User.id.in_(trader_ids)).delete(synchronize_session=False)
        print(f"    ✅ {deleted} traders deleted")
        
        db.commit()
        
        remaining = db.query(User).filter(
            User.is_admin == False,
            User.is_supplier == False
        ).count()
        
        print("\n" + "=" * 70)
        print("✅ CLEANUP COMPLETE!")
        print("=" * 70)
        print(f"  Remaining Traders: {remaining}")
        print("=" * 70)
        
    except Exception as e:
        print(f"\n❌ Error: {e}")
        db.rollback()
    finally:
        db.close()

if __name__ == "__main__":
    auto_cleanup_traders(n_traders=200)

