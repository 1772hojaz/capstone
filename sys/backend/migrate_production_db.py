#!/usr/bin/env python3
"""
Production Database Migration Script
Adds all missing columns to users table for production deployment
"""

from sqlalchemy import create_engine, text
from db.database import DATABASE_URL, SessionLocal, Base
import sys

def migrate_production_database():
    """Add missing columns to users table"""
    db = SessionLocal()
    
    try:
        print("\n" + "="*60)
        print("  PRODUCTION DATABASE MIGRATION")
        print("="*60)
        print("\n🔄 Checking database schema...\n")
        
        # Get current columns
        result = db.execute(text("PRAGMA table_info(users)"))
        existing_columns = {row[1] for row in result}
        
        print(f"📊 Found {len(existing_columns)} existing columns in users table")
        
        # Define required columns with their SQL definitions
        required_columns = {
            'password_reset_token': 'ALTER TABLE users ADD COLUMN password_reset_token VARCHAR',
            'password_reset_expires': 'ALTER TABLE users ADD COLUMN password_reset_expires DATETIME',
            'email_verified': 'ALTER TABLE users ADD COLUMN email_verified BOOLEAN DEFAULT 0',
        }
        
        # Check which columns need to be added
        missing_columns = []
        for column_name in required_columns:
            if column_name not in existing_columns:
                missing_columns.append(column_name)
        
        if not missing_columns:
            print("✅ All required columns already exist!")
            print("   No migration needed.\n")
            return
        
        print(f"\n📝 Missing columns detected: {', '.join(missing_columns)}\n")
        
        # Add missing columns
        for column_name in missing_columns:
            print(f"   Adding column: {column_name}...", end=" ")
            try:
                db.execute(text(required_columns[column_name]))
                db.commit()
                print("✅")
            except Exception as e:
                print(f"❌ Error: {e}")
                db.rollback()
                raise
        
        # Set email_verified = 1 for all existing users (grandfather clause)
        if 'email_verified' in missing_columns:
            print("\n📧 Setting existing users as email verified...", end=" ")
            result = db.execute(text(
                "UPDATE users SET email_verified = 1 WHERE email_verified IS NULL OR email_verified = 0"
            ))
            db.commit()
            print(f"✅ Updated {result.rowcount} users")
        
        # Create pending_registrations table if it doesn't exist
        print("\n📝 Creating pending_registrations table...", end=" ")
        try:
            Base.metadata.tables['pending_registrations'].create(
                bind=create_engine(DATABASE_URL), 
                checkfirst=True
            )
            print("✅")
        except Exception as e:
            print(f"⚠️  Already exists or error: {e}")
        
        print("\n" + "="*60)
        print("  ✅ MIGRATION COMPLETED SUCCESSFULLY!")
        print("="*60)
        print("\n📋 Summary:")
        print(f"   • Added {len(missing_columns)} new columns")
        print("   • Existing users marked as email verified")
        print("   • pending_registrations table ready")
        print("\n✨ Server is ready to start!\n")
        
    except Exception as e:
        print(f"\n❌ Migration failed: {e}")
        db.rollback()
        sys.exit(1)
    finally:
        db.close()

if __name__ == "__main__":
    migrate_production_database()


