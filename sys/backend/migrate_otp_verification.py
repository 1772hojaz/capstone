#!/usr/bin/env python3
"""
Database Migration: OTP Email Verification System
Creates pending_registrations table for OTP-based email verification
"""

from sqlalchemy import create_engine, text
from db.database import DATABASE_URL, SessionLocal, Base
from models.models import PendingRegistration
import sys

def migrate_otp_verification():
    """Create pending_registrations table and update users table"""
    db = SessionLocal()
    
    try:
        print("\n🔄 Starting OTP verification migration...\n")
        
        # Create all tables (will create pending_registrations if it doesn't exist)
        print("📝 Creating pending_registrations table...")
        Base.metadata.create_all(bind=create_engine(DATABASE_URL))
        print("✅ Table created successfully")
        
        # Check current columns in users table
        result = db.execute(text("PRAGMA table_info(users)"))
        columns = [row[1] for row in result]
        
        # Add email_verified if it doesn't exist
        if 'email_verified' not in columns:
            print("\n📝 Adding email_verified column to users table...")
            db.execute(text("ALTER TABLE users ADD COLUMN email_verified BOOLEAN DEFAULT 1"))
            db.commit()
            print("✅ Added email_verified column")
        
        # Remove old verification columns if they exist
        # Note: SQLite doesn't support DROP COLUMN directly in older versions
        # We'll need to recreate the table
        if 'email_verification_token' in columns or 'email_verification_expires' in columns:
            print("\n📝 Removing old email verification columns...")
            print("⚠️  This requires recreating the users table...")
            
            # Get all current users data
            users_data = db.execute(text(
                "SELECT id, email, hashed_password, full_name, is_admin, is_supplier, "
                "is_active, location_zone, cluster_id, company_name, business_address, "
                "tax_id, phone_number, business_type, business_description, website_url, "
                "supplier_rating, total_orders_fulfilled, is_verified, verification_status, "
                "bank_account_name, bank_account_number, bank_name, payment_terms, "
                "preferred_categories, budget_range, experience_level, preferred_group_sizes, "
                "participation_frequency, email_notifications, push_notifications, "
                "sms_notifications, weekly_summary, price_alerts_enabled, show_recommendations, "
                "auto_join_groups, price_alerts, created_at, password_reset_token, "
                "password_reset_expires, email_verified FROM users"
            )).fetchall()
            
            # Backup table
            print("📦 Creating backup...")
            db.execute(text("DROP TABLE IF EXISTS users_backup"))
            db.execute(text("ALTER TABLE users RENAME TO users_backup"))
            db.commit()
            print("✅ Backup created")
            
            # Create new table without old verification columns
            print("🔨 Creating new users table...")
            Base.metadata.tables['users'].create(bind=create_engine(DATABASE_URL))
            
            # Restore data
            print("📥 Restoring user data...")
            for user in users_data:
                placeholders = ', '.join(['?' for _ in range(len(user))])
                db.execute(text(
                    f"INSERT INTO users (id, email, hashed_password, full_name, is_admin, "
                    f"is_supplier, is_active, location_zone, cluster_id, company_name, "
                    f"business_address, tax_id, phone_number, business_type, business_description, "
                    f"website_url, supplier_rating, total_orders_fulfilled, is_verified, "
                    f"verification_status, bank_account_name, bank_account_number, bank_name, "
                    f"payment_terms, preferred_categories, budget_range, experience_level, "
                    f"preferred_group_sizes, participation_frequency, email_notifications, "
                    f"push_notifications, sms_notifications, weekly_summary, price_alerts_enabled, "
                    f"show_recommendations, auto_join_groups, price_alerts, created_at, "
                    f"password_reset_token, password_reset_expires, email_verified) "
                    f"VALUES ({placeholders})"
                ), user)
            db.commit()
            print(f"✅ Restored {len(users_data)} users")
            
            # Drop backup
            print("🗑️  Removing backup table...")
            db.execute(text("DROP TABLE users_backup"))
            db.commit()
            print("✅ Old columns removed successfully")
        
        # Mark all existing users as verified (grandfather clause)
        print("\n📧 Marking existing users as verified...")
        db.execute(text(
            "UPDATE users SET email_verified = 1 WHERE email_verified IS NULL OR email_verified = 0"
        ))
        db.commit()
        
        verified_count = db.execute(text("SELECT COUNT(*) FROM users WHERE email_verified = 1")).scalar()
        print(f"✅ Marked {verified_count} existing users as verified\n")
        
        print("✅ Migration completed successfully!\n")
        print("="*60)
        print("  OTP VERIFICATION SYSTEM IS NOW ACTIVE")
        print("="*60)
        print("\nHow it works:")
        print("1. User fills registration form")
        print("2. System sends 6-digit OTP to their email")
        print("3. User must enter OTP within 10 minutes")
        print("4. Account is created only after OTP verification")
        print("\nNext steps:")
        print("1. Restart your backend server")
        print("2. Update frontend to handle OTP input")
        print("3. Test complete registration flow\n")
        
    except Exception as e:
        print(f"\n❌ Migration failed: {e}")
        db.rollback()
        sys.exit(1)
    finally:
        db.close()

if __name__ == "__main__":
    print("="*60)
    print("  OTP EMAIL VERIFICATION MIGRATION")
    print("="*60)
    migrate_otp_verification()

