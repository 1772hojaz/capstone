#!/usr/bin/env python3
"""Test API endpoint directly"""
import requests
import json

# Login first to get a token
login_url = "http://localhost:8000/api/auth/login"
login_data = {"email": "trader1@mbare.co.zw", "password": "password123"}

print("Testing API endpoint...")
print("=" * 60)

try:
    # Login
    login_response = requests.post(login_url, json=login_data)
    print(f"Login status: {login_response.status_code}")
    
    if login_response.status_code == 200:
        token = login_response.json().get("access_token")
        print(f"Got token: {token[:30]}...")
        
        # Get recommendations
        rec_url = "http://localhost:8000/api/ml/recommendations"
        headers = {"Authorization": f"Bearer {token}"}
        
        rec_response = requests.get(rec_url, headers=headers)
        print(f"\nRecommendations API status: {rec_response.status_code}")
        
        if rec_response.status_code == 200:
            recs = rec_response.json()
            print(f"Recommendations count: {len(recs)}")
            if recs:
                print("\nFirst 3 recommendations:")
                for i, rec in enumerate(recs[:3], 1):
                    print(f"  {i}. {rec.get('product_name')}")
                    print(f"     - group_buy_id: {rec.get('group_buy_id')}")
                    print(f"     - recommendation_score: {rec.get('recommendation_score')}")
                    print(f"     - savings_factor: {rec.get('savings_factor')}")
                    print(f"     - bulk_price: {rec.get('bulk_price')}")
                    print(f"     - reason: {rec.get('reason')}")
            else:
                print("NO RECOMMENDATIONS RETURNED!")
        else:
            print(f"Error: {rec_response.text}")
    else:
        print(f"Login failed: {login_response.text}")
        
except requests.exceptions.ConnectionError:
    print("ERROR: Cannot connect to backend. Is the server running on port 8000?")
except Exception as e:
    print(f"Error: {e}")
    import traceback
    traceback.print_exc()

