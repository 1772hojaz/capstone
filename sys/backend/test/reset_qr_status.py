#!/usr/bin/env python3
"""
Script to reset QR code status for John Mbare Trader
"""
import sys
import os

# Add the backend directory to the path
sys.path.append(os.path.dirname(os.path.abspath(__file__)))

from db.database import SessionLocal
from models.models import QRCodePickup, User

def reset_qr_code_status():
    """Reset the QR code status for John Mbare Trader from used to not used"""

    db = SessionLocal()
    try:
        # Find the user by email
        user = db.query(User).filter(User.email == "trader1@mbare.co.zw").first()

        if not user:
            print("❌ User with email 'trader1@mbare.co.zw' not found")
            return False

        print(f"✅ Found user: {user.full_name} (ID: {user.id})")

        # Find QR codes for this user that are currently marked as used
        # Look for QR codes generated around 11/7/2025 and expiring around 11/8/2025
        qr_codes = db.query(QRCodePickup).filter(
            QRCodePickup.user_id == user.id,
            QRCodePickup.is_used
        ).all()

        if not qr_codes:
            print("❌ No used QR codes found for this user")
            return False

        print(f"📋 Found {len(qr_codes)} used QR code(s) for this user:")

        for qr in qr_codes:
            print(f"   - QR ID: {qr.id}")
            print(f"   - Generated: {qr.generated_at}")
            print(f"   - Expires: {qr.expires_at}")
            print(f"   - Currently used: {qr.is_used}")
            print(f"   - Used at: {qr.used_at}")
            print(f"   - Used by: {qr.used_by_staff}")
            print()

        # Reset the QR code status
        updated_count = 0
        for qr in qr_codes:
            qr.is_used = False
            qr.used_at = None
            qr.used_by_staff = None
            qr.used_location = None
            updated_count += 1

        db.commit()

        print(f"✅ Successfully reset {updated_count} QR code(s) to unused status")
        return True

    except Exception as e:
        print(f"❌ Error updating QR code status: {e}")
        db.rollback()
        return False
    finally:
        db.close()

if __name__ == "__main__":
    print("🔄 Resetting QR Code Status for John Mbare Trader...")
    print("=" * 50)

    success = reset_qr_code_status()

    if success:
        print("\n🎉 QR code status reset completed successfully!")
        print("The QR code is now marked as 'Not Used'")
    else:
        print("\n❌ Failed to reset QR code status")
        sys.exit(1)