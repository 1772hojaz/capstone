"""
Migration script to add supplier_id column to admin_groups table
"""
from db.database import engine
from sqlalchemy import text

def add_supplier_id_column():
    """Add supplier_id column to admin_groups table"""
    try:
        with engine.connect() as connection:
            # Check if column exists
            result = connection.execute(text("PRAGMA table_info(admin_groups)"))
            columns = [row[1] for row in result]
            
            if 'supplier_id' not in columns:
                print("Adding supplier_id column to admin_groups table...")
                connection.execute(text(
                    "ALTER TABLE admin_groups ADD COLUMN supplier_id INTEGER REFERENCES users(id)"
                ))
                connection.commit()
                print("✅ Column added successfully!")
            else:
                print("✅ Column already exists")
                
    except Exception as e:
        print(f"❌ Error adding column: {e}")
        raise

if __name__ == "__main__":
    add_supplier_id_column()

