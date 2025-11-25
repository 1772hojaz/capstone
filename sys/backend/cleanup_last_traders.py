"""
Clean up the last batch of traders and their associated data
"""
from db.database import SessionLocal
from models.models import User, Transaction
from models.analytics_models import EventsRaw, UserBehaviorFeatures
from sqlalchemy import func, and_

def cleanup_last_traders(n_traders=200):
    db = SessionLocal()
    
    try:
        print("=" * 70)
        print("DATABASE CLEANUP - REMOVE LAST BATCH OF TRADERS")
        print("=" * 70)
        
        # Get all trader IDs (non-admin, non-supplier)
        all_traders = db.query(User).filter(
            User.is_admin == False,
            User.is_supplier == False
        ).order_by(User.id.desc()).all()
        
        total_traders = len(all_traders)
        print(f"\n📊 Current Database State:")
        print(f"  Total Traders: {total_traders}")
        
        if total_traders < n_traders:
            print(f"\n⚠️  Only {total_traders} traders exist, will remove all of them")
            traders_to_remove = all_traders
        else:
            print(f"  Traders to Remove: {n_traders} (most recent)")
            traders_to_remove = all_traders[:n_traders]
        
        if not traders_to_remove:
            print("\n✅ No traders to remove!")
            return
        
        trader_ids = [t.id for t in traders_to_remove]
        
        print(f"\n🗑️  Removing {len(trader_ids)} traders and their data...")
        
        # Count associated data before deletion
        tx_count = db.query(Transaction).filter(Transaction.user_id.in_(trader_ids)).count()
        event_count = db.query(EventsRaw).filter(EventsRaw.user_id.in_(trader_ids)).count()
        feature_count = db.query(UserBehaviorFeatures).filter(UserBehaviorFeatures.user_id.in_(trader_ids)).count()
        
        print(f"\n  Data to be removed:")
        print(f"    - Traders: {len(trader_ids)}")
        print(f"    - Transactions: {tx_count:,}")
        print(f"    - Analytics Events: {event_count:,}")
        print(f"    - User Features: {feature_count}")
        
        # Confirm deletion
        print(f"\n⚠️  This will permanently delete:")
        print(f"    • {len(trader_ids)} trader accounts")
        print(f"    • {tx_count:,} transactions")
        print(f"    • {event_count:,} analytics events")
        
        response = input("\n  Continue? (yes/no): ").strip().lower()
        
        if response != 'yes':
            print("\n❌ Cleanup cancelled by user")
            return
        
        print("\n🔄 Deleting data...")
        
        # Delete in correct order (foreign key constraints)
        # 1. Analytics Events
        if event_count > 0:
            deleted = db.query(EventsRaw).filter(EventsRaw.user_id.in_(trader_ids)).delete(synchronize_session=False)
            print(f"  ✅ Deleted {deleted:,} analytics events")
        
        # 2. User Behavior Features
        if feature_count > 0:
            deleted = db.query(UserBehaviorFeatures).filter(UserBehaviorFeatures.user_id.in_(trader_ids)).delete(synchronize_session=False)
            print(f"  ✅ Deleted {deleted} user behavior features")
        
        # 3. Transactions
        if tx_count > 0:
            deleted = db.query(Transaction).filter(Transaction.user_id.in_(trader_ids)).delete(synchronize_session=False)
            print(f"  ✅ Deleted {deleted:,} transactions")
        
        # 4. Finally, delete the traders themselves
        deleted = db.query(User).filter(User.id.in_(trader_ids)).delete(synchronize_session=False)
        print(f"  ✅ Deleted {deleted} trader accounts")
        
        db.commit()
        
        # Verify cleanup
        remaining_traders = db.query(User).filter(
            User.is_admin == False,
            User.is_supplier == False
        ).count()
        
        remaining_tx = db.query(Transaction).count()
        remaining_events = db.query(EventsRaw).count()
        
        print("\n" + "=" * 70)
        print("✅ CLEANUP COMPLETE!")
        print("=" * 70)
        print(f"\n📊 Updated Database State:")
        print(f"  Remaining Traders: {remaining_traders}")
        print(f"  Remaining Transactions: {remaining_tx:,}")
        print(f"  Remaining Events: {remaining_events:,}")
        print("\n💡 Ready for: python generate_enhanced_ml_data.py")
        print("=" * 70)
        
    except Exception as e:
        print(f"\n❌ Error during cleanup: {e}")
        import traceback
        traceback.print_exc()
        db.rollback()
    finally:
        db.close()


if __name__ == "__main__":
    cleanup_last_traders(n_traders=200)

