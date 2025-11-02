#!/usr/bin/env python3
"""
Create missing database tables for supplier functionality
"""

from db.database import engine, Base

def create_missing_tables():
    """Create all missing tables for supplier functionality"""

    print("🔄 Creating missing database tables...")

    try:
        # Create all tables defined in the models
        Base.metadata.create_all(bind=engine)

        print("✅ All missing tables created successfully!")

        # List all tables to verify
        from sqlalchemy import inspect
        inspector = inspect(engine)
        tables = inspector.get_table_names()
        print(f"📊 Database now contains {len(tables)} tables:")
        for table in sorted(tables):
            print(f"   - {table}")

    except Exception as e:
        print(f"❌ Error creating tables: {e}")
        raise

if __name__ == "__main__":
    create_missing_tables()