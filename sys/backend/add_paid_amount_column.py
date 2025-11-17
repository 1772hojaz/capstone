"""
Migration script to add paid_amount column to admin_group_joins table
"""
from db.database import engine
from sqlalchemy import text

def add_paid_amount_column():
    """Add paid_amount column to admin_group_joins table"""
    try:
        with engine.connect() as connection:
            # Check if column exists
            result = connection.execute(text("PRAGMA table_info(admin_group_joins)"))
            columns = [row[1] for row in result]
            
            if 'paid_amount' not in columns:
                print("Adding paid_amount column to admin_group_joins table...")
                connection.execute(text(
                    "ALTER TABLE admin_group_joins ADD COLUMN paid_amount FLOAT"
                ))
                connection.commit()
                print("✅ Column added successfully!")
            else:
                print("✅ Column already exists")
                
    except Exception as e:
        print(f"❌ Error adding column: {e}")
        raise

if __name__ == "__main__":
    add_paid_amount_column()

