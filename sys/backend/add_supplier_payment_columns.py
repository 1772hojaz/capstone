"""
Migration script to add missing columns to supplier_payments table
"""
from db.database import engine
from sqlalchemy import text

def add_supplier_payment_columns():
    """Add order_id, platform_fee, transfer_id, transfer_reference columns to supplier_payments table"""
    try:
        with engine.connect() as connection:
            # Check if columns exist
            result = connection.execute(text("PRAGMA table_info(supplier_payments)"))
            columns = [row[1] for row in result]
            
            columns_to_add = []
            if 'order_id' not in columns:
                columns_to_add.append(("order_id", "INTEGER REFERENCES supplier_orders(id)"))
            if 'platform_fee' not in columns:
                columns_to_add.append(("platform_fee", "FLOAT"))
            if 'transfer_id' not in columns:
                columns_to_add.append(("transfer_id", "VARCHAR"))
            if 'transfer_reference' not in columns:
                columns_to_add.append(("transfer_reference", "VARCHAR"))
            
            if columns_to_add:
                print(f"Adding {len(columns_to_add)} columns to supplier_payments table...")
                for col_name, col_type in columns_to_add:
                    connection.execute(text(
                        f"ALTER TABLE supplier_payments ADD COLUMN {col_name} {col_type}"
                    ))
                    print(f"  - Added {col_name}")
                connection.commit()
                print("✅ All columns added successfully!")
            else:
                print("✅ All columns already exist")
                
    except Exception as e:
        print(f"❌ Error adding columns: {e}")
        raise

if __name__ == "__main__":
    add_supplier_payment_columns()

