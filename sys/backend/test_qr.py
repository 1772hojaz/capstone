#!/usr/bin/env python3
"""
Test script for QR code generation and scanning workflow
"""

import requests
import json

BASE_URL = "http://localhost:8000"

def test_qr_workflow():
    print("="*80)
    print("🧪 Testing QR Code Generation and Scanning Workflow")
    print("="*80)

    # Step 1: Login as admin to get token
    print("\n1. 🔐 Logging in as admin...")
    login_data = {
        "email": "admin@groupbuy.com",
        "password": "admin123"
    }

    try:
        response = requests.post(f"{BASE_URL}/api/auth/login", json=login_data)
        response.raise_for_status()
        admin_token = response.json()["access_token"]
        print("✅ Admin login successful")
    except Exception as e:
        print(f"❌ Admin login failed: {e}")
        return

    # Step 2: Login as trader to get token
    print("\n2. 🔐 Logging in as trader...")
    trader_login_data = {
        "email": "testtrader@mbare.co.zw",
        "password": "password123"
    }

    try:
        response = requests.post(f"{BASE_URL}/api/auth/login", json=trader_login_data)
        response.raise_for_status()
        trader_token = response.json()["access_token"]
        print("✅ Trader login successful")
    except Exception as e:
        print(f"❌ Trader login failed: {e}")
        return

    # Step 3: Get trader's groups
    print("\n3. 📋 Getting trader's groups...")
    headers = {"Authorization": f"Bearer {trader_token}"}

    try:
        response = requests.get(f"{BASE_URL}/api/groups/my-groups", headers=headers)
        response.raise_for_status()
        groups = response.json()
        print(f"✅ Found {len(groups)} groups for trader")

        if not groups:
            print("❌ No groups found for trader")
            return

        # Use first group
        group_id = groups[0]["id"]
        print(f"📋 Using group ID: {group_id}")

    except Exception as e:
        print(f"❌ Failed to get trader groups: {e}")
        return

    # Step 4: Generate QR code for the group
    print("\n4. 📱 Generating QR code for group pickup...")
    headers = {"Authorization": f"Bearer {trader_token}"}

    try:
        response = requests.get(f"{BASE_URL}/api/groups/{group_id}/qr-code", headers=headers)
        response.raise_for_status()
        qr_data = response.json()
        qr_code_data = qr_data["qr_id"]  # Changed from qr_code_data to qr_id
        print(f"✅ QR code generated: {qr_code_data}")

    except Exception as e:
        print(f"❌ QR code generation failed: {e}")
        return

    # Step 5: Admin scans the QR code
    print("\n5. 📷 Admin scanning QR code...")
    headers = {"Authorization": f"Bearer {admin_token}"}
    scan_data = {"qr_code_data": qr_code_data}

    try:
        response = requests.post(f"{BASE_URL}/api/admin/qr/scan", json=scan_data, headers=headers)
        response.raise_for_status()
        scan_result = response.json()
        print("✅ QR scan successful!")
        print(f"📊 Scan result: {json.dumps(scan_result, indent=2)}")

    except Exception as e:
        print(f"❌ QR scan failed: {e}")
        print(f"Response: {response.text if 'response' in locals() else 'No response'}")
        return

    print("\n" + "="*80)
    print("🎉 QR Code Workflow Test Complete!")
    print("="*80)

if __name__ == "__main__":
    test_qr_workflow()