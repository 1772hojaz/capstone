"""
Database migration script to add supplier workflow columns
Run this once to update the database schema
"""

import sqlite3
from datetime import datetime

# Path to your database
DB_PATH = "groupbuy.db"

def migrate_database():
    """Add new columns for supplier workflow"""
    conn = sqlite3.connect(DB_PATH)
    cursor = conn.cursor()
    
    print("🔄 Starting database migration...")
    
    try:
        # Check if columns already exist
        cursor.execute("PRAGMA table_info(group_buys)")
        columns = [row[1] for row in cursor.fetchall()]
        
        # Add columns to group_buys table
        if 'supplier_status' not in columns:
            print("  ➕ Adding supplier_status to group_buys...")
            cursor.execute("ALTER TABLE group_buys ADD COLUMN supplier_status TEXT")
        else:
            print("  ✓ supplier_status already exists")
            
        if 'supplier_response_at' not in columns:
            print("  ➕ Adding supplier_response_at to group_buys...")
            cursor.execute("ALTER TABLE group_buys ADD COLUMN supplier_response_at TIMESTAMP")
        else:
            print("  ✓ supplier_response_at already exists")
            
        if 'ready_for_collection_at' not in columns:
            print("  ➕ Adding ready_for_collection_at to group_buys...")
            cursor.execute("ALTER TABLE group_buys ADD COLUMN ready_for_collection_at TIMESTAMP")
        else:
            print("  ✓ ready_for_collection_at already exists")
            
        if 'supplier_notes' not in columns:
            print("  ➕ Adding supplier_notes to group_buys...")
            cursor.execute("ALTER TABLE group_buys ADD COLUMN supplier_notes TEXT")
        else:
            print("  ✓ supplier_notes already exists")
        
        # Check contributions table
        cursor.execute("PRAGMA table_info(contributions)")
        contrib_columns = [row[1] for row in cursor.fetchall()]
        
        # Add columns to contributions table
        if 'is_collected' not in contrib_columns:
            print("  ➕ Adding is_collected to contributions...")
            cursor.execute("ALTER TABLE contributions ADD COLUMN is_collected BOOLEAN DEFAULT 0")
        else:
            print("  ✓ is_collected already exists")
            
        if 'collected_at' not in contrib_columns:
            print("  ➕ Adding collected_at to contributions...")
            cursor.execute("ALTER TABLE contributions ADD COLUMN collected_at TIMESTAMP")
        else:
            print("  ✓ collected_at already exists")
            
        if 'qr_code_token' not in contrib_columns:
            print("  ➕ Adding qr_code_token to contributions...")
            cursor.execute("ALTER TABLE contributions ADD COLUMN qr_code_token TEXT")
        else:
            print("  ✓ qr_code_token already exists")
            
        if 'refund_status' not in contrib_columns:
            print("  ➕ Adding refund_status to contributions...")
            cursor.execute("ALTER TABLE contributions ADD COLUMN refund_status TEXT")
        else:
            print("  ✓ refund_status already exists")
            
        if 'refunded_at' not in contrib_columns:
            print("  ➕ Adding refunded_at to contributions...")
            cursor.execute("ALTER TABLE contributions ADD COLUMN refunded_at TIMESTAMP")
        else:
            print("  ✓ refunded_at already exists")
        
        # Check supplier_orders table
        cursor.execute("PRAGMA table_info(supplier_orders)")
        supplier_order_columns = [row[1] for row in cursor.fetchall()]
        
        # Add columns to supplier_orders table
        if 'admin_verification_status' not in supplier_order_columns:
            print("  ➕ Adding admin_verification_status to supplier_orders...")
            cursor.execute("ALTER TABLE supplier_orders ADD COLUMN admin_verification_status TEXT DEFAULT 'pending'")
        else:
            print("  ✓ admin_verification_status already exists")
            
        if 'admin_verified_at' not in supplier_order_columns:
            print("  ➕ Adding admin_verified_at to supplier_orders...")
            cursor.execute("ALTER TABLE supplier_orders ADD COLUMN admin_verified_at TIMESTAMP")
        else:
            print("  ✓ admin_verified_at already exists")
            
        if 'qr_codes_generated' not in supplier_order_columns:
            print("  ➕ Adding qr_codes_generated to supplier_orders...")
            cursor.execute("ALTER TABLE supplier_orders ADD COLUMN qr_codes_generated BOOLEAN DEFAULT 0")
        else:
            print("  ✓ qr_codes_generated already exists")
        
        conn.commit()
        print("\n✅ Database migration completed successfully!")
        
    except Exception as e:
        print(f"\n❌ Error during migration: {e}")
        conn.rollback()
        raise
    finally:
        conn.close()

if __name__ == "__main__":
    print("=" * 60)
    print("Database Migration: Supplier Workflow Enhancement")
    print("=" * 60)
    migrate_database()
    print("\n🎉 Migration complete! You can now restart the backend server.")
    print("=" * 60)

