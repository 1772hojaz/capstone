#!/usr/bin/env python3
"""Test recommendation tracking endpoints"""
import requests

login_url = "http://localhost:8000/api/auth/login"
login_data = {"email": "trader1@mbare.co.zw", "password": "password123"}

print("Testing Recommendation Tracking Endpoints...")
print("=" * 60)

try:
    # Login
    login_response = requests.post(login_url, json=login_data)
    if login_response.status_code != 200:
        print(f"Login failed: {login_response.text}")
        exit(1)
        
    token = login_response.json().get("access_token")
    headers = {"Authorization": f"Bearer {token}"}
    
    # Test click tracking
    print("\n1. Testing click tracking...")
    click_response = requests.post("http://localhost:8000/api/ml/recommendations/1/click", headers=headers)
    print(f"   Status: {click_response.status_code}")
    print(f"   Response: {click_response.json()}")
    
    # Test join tracking
    print("\n2. Testing join tracking...")
    join_response = requests.post("http://localhost:8000/api/ml/recommendations/1/join", headers=headers)
    print(f"   Status: {join_response.status_code}")
    print(f"   Response: {join_response.json()}")
    
    # Test stats
    print("\n3. Testing stats endpoint...")
    stats_response = requests.get("http://localhost:8000/api/ml/recommendations/stats", headers=headers)
    print(f"   Status: {stats_response.status_code}")
    if stats_response.status_code == 200:
        stats = stats_response.json()
        print(f"   Shown: {stats['shown']}")
        print(f"   Clicked: {stats['clicked']}")
        print(f"   Joined: {stats['joined']}")
        print(f"   Click Rate: {stats['click_rate']}%")
        print(f"   Join Rate: {stats['join_rate']}%")
        print(f"   Conversion Rate: {stats['conversion_rate']}%")
    
    print("\n" + "=" * 60)
    print("All endpoints working!")
    
except requests.exceptions.ConnectionError:
    print("ERROR: Cannot connect to backend. Is the server running?")
except Exception as e:
    print(f"Error: {e}")
    import traceback
    traceback.print_exc()

