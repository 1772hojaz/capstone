"""
Verify ML training data generation
"""
from sqlalchemy import func
from db.database import SessionLocal
from models.models import User, Product, Transaction
from models.analytics_models import EventsRaw, UserBehaviorFeatures, GroupPerformanceMetrics

def verify_data():
    db = SessionLocal()
    
    try:
        print("=" * 70)
        print("ML TRAINING DATA VERIFICATION")
        print("=" * 70)
        
        # Count traders
        traders = db.query(User).filter(
            User.is_admin == False,
            User.is_supplier == False
        ).count()
        
        # Count transactions
        transactions = db.query(Transaction).count()
        
        # Count events
        events = db.query(EventsRaw).count()
        
        # Count user features
        user_features = db.query(UserBehaviorFeatures).count()
        
        # Count products
        products = db.query(Product).filter(Product.is_active == True).count()
        
        # Get transaction stats
        total_amount = db.query(func.sum(Transaction.amount)).scalar() or 0
        
        avg_transaction_value = total_amount / transactions if transactions > 0 else 0
        
        # Get date range
        oldest_tx = db.query(Transaction).order_by(Transaction.created_at.asc()).first()
        newest_tx = db.query(Transaction).order_by(Transaction.created_at.desc()).first()
        
        print("\n📊 DATABASE STATISTICS:")
        print(f"  👥 Total Traders: {traders}")
        print(f"  📦 Active Products: {products}")
        print(f"  💳 Total Transactions: {transactions:,}")
        print(f"  📊 Analytics Events: {events:,}")
        print(f"  🧠 User Feature Records: {user_features}")
        
        print("\n💰 TRANSACTION STATISTICS:")
        print(f"  Total Amount: ${total_amount:,.2f}")
        print(f"  Avg Transaction Value: ${avg_transaction_value:.2f}")
        print(f"  Avg Transactions per Trader: {transactions/traders:.1f}")
        
        if oldest_tx and newest_tx:
            date_range = (newest_tx.created_at - oldest_tx.created_at).days
            print(f"\n📅 TIME RANGE:")
            print(f"  First Transaction: {oldest_tx.created_at}")
            print(f"  Last Transaction: {newest_tx.created_at}")
            print(f"  Date Range: {date_range} days ({date_range/7:.1f} weeks)")
        
        # Check data quality
        print("\n✅ DATA QUALITY CHECKS:")
        
        # Check for orphaned transactions
        orphaned_tx = db.query(Transaction).filter(
            ~Transaction.user_id.in_(db.query(User.id))
        ).count()
        print(f"  Orphaned Transactions: {orphaned_tx} {'✅' if orphaned_tx == 0 else '❌'}")
        
        # Check event variety
        event_types = db.query(EventsRaw.event_type, func.count(EventsRaw.id))\
            .group_by(EventsRaw.event_type).all()
        print(f"\n  Event Types:")
        for event_type, count in event_types:
            print(f"    - {event_type}: {count:,}")
        
        print("\n" + "=" * 70)
        print("✅ DATA VERIFICATION COMPLETE!")
        print("=" * 70)
        print("\n💡 Next Steps:")
        print("  1. Train ML models: python ml/ml.py")
        print("  2. Test recommendations in the app")
        print("  3. Monitor model performance metrics")
        print("=" * 70)
        
    except Exception as e:
        print(f"❌ Error: {e}")
        import traceback
        traceback.print_exc()
    finally:
        db.close()


if __name__ == "__main__":
    verify_data()

