"""
Cleanup Script: Remove Non-Trader Analytics Data

This script removes all analytics events and features for admin and supplier users.
Only trader (regular user) data should remain in the analytics system.

Run this once after implementing the trader-only restriction.
"""

from db.database import SessionLocal
from models.analytics_models import EventsRaw, UserBehaviorFeatures
from models.models import User
from sqlalchemy import and_

def cleanup_non_trader_analytics():
    """Remove analytics data for admins and suppliers"""
    db = SessionLocal()
    try:
        # Get all admin and supplier user IDs
        non_trader_users = db.query(User.id).filter(
            (User.is_admin == True) | (User.is_supplier == True)
        ).all()
        
        non_trader_ids = [u.id for u in non_trader_users]
        
        if not non_trader_ids:
            print("✅ No admin/supplier users found. Database is clean!")
            return
        
        print(f"🔍 Found {len(non_trader_ids)} admin/supplier users")
        
        # Delete events from non-traders
        deleted_events = db.query(EventsRaw).filter(
            EventsRaw.user_id.in_(non_trader_ids)
        ).delete(synchronize_session=False)
        
        print(f"🗑️  Deleted {deleted_events} events from admins/suppliers")
        
        # Delete behavior features for non-traders
        deleted_features = db.query(UserBehaviorFeatures).filter(
            UserBehaviorFeatures.user_id.in_(non_trader_ids)
        ).delete(synchronize_session=False)
        
        print(f"🗑️  Deleted {deleted_features} behavior feature records")
        
        db.commit()
        
        # Count remaining events
        remaining_events = db.query(EventsRaw).count()
        remaining_features = db.query(UserBehaviorFeatures).count()
        
        print(f"\n✅ Cleanup Complete!")
        print(f"   📊 Remaining events: {remaining_events} (traders only)")
        print(f"   📊 Remaining features: {remaining_features} (traders only)")
        
    except Exception as e:
        db.rollback()
        print(f"❌ Error during cleanup: {e}")
        raise
    finally:
        db.close()

if __name__ == "__main__":
    print("="*60)
    print("🧹 Cleaning up non-trader analytics data...")
    print("="*60)
    cleanup_non_trader_analytics()

