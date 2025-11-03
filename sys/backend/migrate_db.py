#!/usr/bin/env python3
"""
Database migration script to add missing User columns and AdminGroup product_id
Adds supplier and preference fields to existing users table
Adds product_id column to admin_groups table
"""

from db.database import engine
from sqlalchemy import text

def migrate_database():
    """Add missing columns to users and admin_groups tables"""

    print("🔄 Migrating database schema...")

    # Connect to database
    conn = engine.connect()

    try:
        # Migrate users table
        print("\n📋 Checking users table...")
        result = conn.execute(text("PRAGMA table_info(users)"))
        existing_columns = [row[1] for row in result.fetchall()]

        print(f"📊 Found {len(existing_columns)} columns in users table")

        # Columns to add to users table
        columns_to_add = [
            ("is_supplier", "BOOLEAN DEFAULT 0"),
            ("company_name", "VARCHAR"),
            ("business_address", "TEXT"),
            ("tax_id", "VARCHAR"),
            ("phone_number", "VARCHAR"),
            ("supplier_rating", "FLOAT DEFAULT 0.0"),
            ("total_orders_fulfilled", "INTEGER DEFAULT 0"),
            ("preferred_categories", "JSON DEFAULT '[]'"),
            ("budget_range", "VARCHAR DEFAULT 'medium'"),
            ("experience_level", "VARCHAR DEFAULT 'beginner'"),
            ("preferred_group_sizes", "JSON DEFAULT '[]'"),
            ("participation_frequency", "VARCHAR DEFAULT 'occasional'"),
            ("email_notifications", "BOOLEAN DEFAULT 1"),
            ("push_notifications", "BOOLEAN DEFAULT 1"),
            ("sms_notifications", "BOOLEAN DEFAULT 0"),
            ("weekly_summary", "BOOLEAN DEFAULT 1"),
            ("price_alerts_enabled", "BOOLEAN DEFAULT 0"),
            ("show_recommendations", "BOOLEAN DEFAULT 1"),
            ("auto_join_groups", "BOOLEAN DEFAULT 1")
        ]

        added_count = 0
        for col_name, col_def in columns_to_add:
            if col_name not in existing_columns:
                try:
                    alter_sql = f"ALTER TABLE users ADD COLUMN {col_name} {col_def}"
                    conn.execute(text(alter_sql))
                    print(f"✅ Added column to users: {col_name}")
                    added_count += 1
                except Exception as e:
                    print(f"⚠️  Failed to add {col_name} to users: {e}")
            else:
                print(f"⏭️  Column {col_name} already exists in users")

        print(f"\n✅ Users table migration complete! Added {added_count} columns")

        # Migrate admin_groups table
        print("\n📋 Checking admin_groups table...")
        result = conn.execute(text("PRAGMA table_info(admin_groups)"))
        existing_columns = [row[1] for row in result.fetchall()]

        print(f"📊 Found {len(existing_columns)} columns in admin_groups table")

        # Check if product_id column exists
        if "product_id" not in existing_columns:
            try:
                alter_sql = "ALTER TABLE admin_groups ADD COLUMN product_id INTEGER REFERENCES products(id)"
                conn.execute(text(alter_sql))
                print("✅ Added column to admin_groups: product_id")
            except Exception as e:
                print(f"⚠️  Failed to add product_id to admin_groups: {e}")
        else:
            print("⏭️  Column product_id already exists in admin_groups")

        # Verify the migration
        result = conn.execute(text("PRAGMA table_info(users)"))
        final_user_columns = [row[1] for row in result.fetchall()]
        print(f"📊 Final users column count: {len(final_user_columns)}")

        result = conn.execute(text("PRAGMA table_info(admin_groups)"))
        final_admin_columns = [row[1] for row in result.fetchall()]
        print(f"📊 Final admin_groups column count: {len(final_admin_columns)}")

        conn.commit()

    except Exception as e:
        print(f"❌ Migration failed: {e}")
        conn.rollback()
        raise
    finally:
        conn.close()

if __name__ == "__main__":
    migrate_database()