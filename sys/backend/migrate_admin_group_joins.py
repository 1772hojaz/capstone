#!/usr/bin/env python3
"""
Database migration script to add payment columns to admin_group_joins table
Adds payment_transaction_id and payment_reference columns for card payments
"""

from db.database import engine
from sqlalchemy import text

def migrate_admin_group_joins():
    """Add payment columns to admin_group_joins table"""

    print("🔄 Migrating admin_group_joins table...")

    # Connect to database
    conn = engine.connect()

    try:
        # Check admin_group_joins table
        print("\n📋 Checking admin_group_joins table...")
        result = conn.execute(text("PRAGMA table_info(admin_group_joins)"))
        existing_columns = [row[1] for row in result.fetchall()]

        print(f"📊 Found {len(existing_columns)} columns in admin_group_joins table")

        # Columns to add to admin_group_joins table
        columns_to_add = [
            ("payment_transaction_id", "VARCHAR"),
            ("payment_reference", "VARCHAR")
        ]

        added_count = 0
        for col_name, col_def in columns_to_add:
            if col_name not in existing_columns:
                try:
                    alter_sql = f"ALTER TABLE admin_group_joins ADD COLUMN {col_name} {col_def}"
                    conn.execute(text(alter_sql))
                    print(f"✅ Added column to admin_group_joins: {col_name}")
                    added_count += 1
                except Exception as e:
                    print(f"⚠️  Failed to add {col_name} to admin_group_joins: {e}")
            else:
                print(f"⏭️  Column {col_name} already exists in admin_group_joins")

        print(f"\n✅ admin_group_joins table migration complete! Added {added_count} columns")

        # Verify the migration
        result = conn.execute(text("PRAGMA table_info(admin_group_joins)"))
        final_columns = [row[1] for row in result.fetchall()]
        print(f"📊 Final admin_group_joins column count: {len(final_columns)}")

        conn.commit()

    except Exception as e:
        print(f"❌ Migration failed: {e}")
        conn.rollback()
        raise
    finally:
        conn.close()

if __name__ == "__main__":
    migrate_admin_group_joins()