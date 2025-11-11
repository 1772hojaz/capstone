"""
Migration script to add UserBehaviorFeatures table
"""
from db.database import engine
from models.models import UserBehaviorFeatures
from sqlalchemy import text

def migrate_user_behavior_features():
    """Add UserBehaviorFeatures table to existing database"""

    print("🔄 Adding UserBehaviorFeatures table...")

    try:
        # Create the table
        UserBehaviorFeatures.__table__.create(engine, checkfirst=True)
        print("✅ UserBehaviorFeatures table created successfully")

        # Optional: Populate with default data for existing users
        with engine.connect() as conn:
            # Get all existing users
            result = conn.execute(text("SELECT id FROM users WHERE is_admin = false AND is_supplier = false"))
            user_ids = [row[0] for row in result]

            if user_ids:
                # Insert default behavior features for existing users
                values = []
                for user_id in user_ids:
                    values.append(f"({user_id}, 0.5, 0.5, NULL, NULL, 0, CURRENT_TIMESTAMP)")

                if values:
                    insert_sql = f"""
                    INSERT INTO user_behavior_features
                    (user_id, engagement_score, price_sensitivity_score, top_category_1, top_category_2, days_since_last_activity, last_updated)
                    VALUES {', '.join(values)}
                    ON CONFLICT (user_id) DO NOTHING
                    """
                    conn.execute(text(insert_sql))
                    conn.commit()
                    print(f"✅ Added default behavior features for {len(user_ids)} existing users")

    except Exception as e:
        print(f"❌ Error creating UserBehaviorFeatures table: {e}")
        raise

if __name__ == "__main__":
    migrate_user_behavior_features()