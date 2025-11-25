"""
API Endpoint Testing Script
Tests all critical frontend-backend API connections
"""

import requests
import json
from datetime import datetime

# Configuration
BASE_URL = "http://localhost:8000"
TEST_TRADER_EMAIL = "trader@connectsphere.co.zw"
TEST_TRADER_PASSWORD = "password123"
TEST_SUPPLIER_EMAIL = "fresh@produce.co.zw"
TEST_SUPPLIER_PASSWORD = "password123"
TEST_ADMIN_EMAIL = "admin@connectsphere.co.zw"
TEST_ADMIN_PASSWORD = "admin123"

class Colors:
    GREEN = '\033[92m'
    RED = '\033[91m'
    YELLOW = '\033[93m'
    BLUE = '\033[94m'
    END = '\033[0m'

def print_test(name, status, details=""):
    symbol = "✓" if status else "✗"
    color = Colors.GREEN if status else Colors.RED
    print(f"{color}{symbol} {name}{Colors.END}")
    if details:
        print(f"  {details}")

def test_auth_endpoints():
    """Test authentication endpoints"""
    print(f"\n{Colors.BLUE}=== Testing Authentication Endpoints ==={Colors.END}\n")
    
    # Test trader login
    try:
        response = requests.post(
            f"{BASE_URL}/api/auth/login",
            json={"email": TEST_TRADER_EMAIL, "password": TEST_TRADER_PASSWORD}
        )
        trader_token = response.json().get("access_token") if response.status_code == 200 else None
        print_test("POST /api/auth/login (Trader)", response.status_code == 200, f"Token: {trader_token[:20]}..." if trader_token else "Failed")
    except Exception as e:
        print_test("POST /api/auth/login (Trader)", False, str(e))
        trader_token = None
    
    # Test supplier login
    try:
        response = requests.post(
            f"{BASE_URL}/api/auth/login",
            json={"email": TEST_SUPPLIER_EMAIL, "password": TEST_SUPPLIER_PASSWORD}
        )
        supplier_token = response.json().get("access_token") if response.status_code == 200 else None
        print_test("POST /api/auth/login (Supplier)", response.status_code == 200, f"Token: {supplier_token[:20]}..." if supplier_token else "Failed")
    except Exception as e:
        print_test("POST /api/auth/login (Supplier)", False, str(e))
        supplier_token = None
    
    # Test admin login
    try:
        response = requests.post(
            f"{BASE_URL}/api/auth/login",
            json={"email": TEST_ADMIN_EMAIL, "password": TEST_ADMIN_PASSWORD}
        )
        admin_token = response.json().get("access_token") if response.status_code == 200 else None
        print_test("POST /api/auth/login (Admin)", response.status_code == 200, f"Token: {admin_token[:20]}..." if admin_token else "Failed")
    except Exception as e:
        print_test("POST /api/auth/login (Admin)", False, str(e))
        admin_token = None
    
    return {
        "trader": trader_token,
        "supplier": supplier_token,
        "admin": admin_token
    }

def test_trader_endpoints(token):
    """Test trader-specific endpoints"""
    print(f"\n{Colors.BLUE}=== Testing Trader Endpoints ==={Colors.END}\n")
    
    headers = {"Authorization": f"Bearer {token}"}
    
    # Test get groups
    try:
        response = requests.get(f"{BASE_URL}/api/groups", headers=headers)
        print_test("GET /api/groups", response.status_code == 200, f"Groups: {len(response.json()) if response.status_code == 200 else 0}")
    except Exception as e:
        print_test("GET /api/groups", False, str(e))
    
    # Test get my groups
    try:
        response = requests.get(f"{BASE_URL}/api/groups/my-groups", headers=headers)
        print_test("GET /api/groups/my-groups", response.status_code == 200, f"My Groups: {len(response.json()) if response.status_code == 200 else 0}")
    except Exception as e:
        print_test("GET /api/groups/my-groups", False, str(e))
    
    # Test get recommendations
    try:
        response = requests.get(f"{BASE_URL}/api/ml/recommendations", headers=headers)
        print_test("GET /api/ml/recommendations", response.status_code == 200, f"Recommendations: {len(response.json()) if response.status_code == 200 else 0}")
    except Exception as e:
        print_test("GET /api/ml/recommendations", False, str(e))
    
    # Test get products
    try:
        response = requests.get(f"{BASE_URL}/api/products", headers=headers)
        print_test("GET /api/products", response.status_code == 200, f"Products: {len(response.json()) if response.status_code == 200 else 0}")
    except Exception as e:
        print_test("GET /api/products", False, str(e))

def test_supplier_endpoints(token):
    """Test supplier-specific endpoints"""
    print(f"\n{Colors.BLUE}=== Testing Supplier Endpoints ==={Colors.END}\n")
    
    headers = {"Authorization": f"Bearer {token}"}
    
    # Test dashboard metrics
    try:
        response = requests.get(f"{BASE_URL}/api/supplier/dashboard/metrics", headers=headers)
        print_test("GET /api/supplier/dashboard/metrics", response.status_code == 200, 
                   f"Metrics: {response.json() if response.status_code == 200 else 'Error'}")
    except Exception as e:
        print_test("GET /api/supplier/dashboard/metrics", False, str(e))
    
    # Test supplier orders
    try:
        response = requests.get(f"{BASE_URL}/api/supplier/orders", headers=headers)
        print_test("GET /api/supplier/orders", response.status_code == 200, 
                   f"Orders: {len(response.json()) if response.status_code == 200 else 0}")
    except Exception as e:
        print_test("GET /api/supplier/orders", False, str(e))
    
    # Test supplier groups
    try:
        response = requests.get(f"{BASE_URL}/api/supplier/groups", headers=headers)
        print_test("GET /api/supplier/groups", response.status_code == 200, 
                   f"Groups: {len(response.json()) if response.status_code == 200 else 0}")
    except Exception as e:
        print_test("GET /api/supplier/groups", False, str(e))
    
    # Test supplier payments
    try:
        response = requests.get(f"{BASE_URL}/api/supplier/payments", headers=headers)
        print_test("GET /api/supplier/payments", response.status_code == 200, 
                   f"Payments: {len(response.json()) if response.status_code == 200 else 0}")
    except Exception as e:
        print_test("GET /api/supplier/payments", False, str(e))
    
    # Test supplier products
    try:
        response = requests.get(f"{BASE_URL}/api/supplier/products", headers=headers)
        print_test("GET /api/supplier/products", response.status_code == 200, 
                   f"Products: {len(response.json()) if response.status_code == 200 else 0}")
    except Exception as e:
        print_test("GET /api/supplier/products", False, str(e))

def test_admin_endpoints(token):
    """Test admin-specific endpoints"""
    print(f"\n{Colors.BLUE}=== Testing Admin Endpoints ==={Colors.END}\n")
    
    headers = {"Authorization": f"Bearer {token}"}
    
    # Test dashboard
    try:
        response = requests.get(f"{BASE_URL}/api/admin/dashboard", headers=headers)
        print_test("GET /api/admin/dashboard", response.status_code == 200,
                   f"Dashboard Data Available: {bool(response.json()) if response.status_code == 200 else False}")
    except Exception as e:
        print_test("GET /api/admin/dashboard", False, str(e))
    
    # Test users
    try:
        response = requests.get(f"{BASE_URL}/api/admin/users", headers=headers)
        print_test("GET /api/admin/users", response.status_code == 200,
                   f"Users: {len(response.json()) if response.status_code == 200 else 0}")
    except Exception as e:
        print_test("GET /api/admin/users", False, str(e))
    
    # Test groups
    try:
        response = requests.get(f"{BASE_URL}/api/admin/groups", headers=headers)
        print_test("GET /api/admin/groups", response.status_code == 200,
                   f"Admin Groups: {len(response.json()) if response.status_code == 200 else 0}")
    except Exception as e:
        print_test("GET /api/admin/groups", False, str(e))
    
    # Test moderation stats
    try:
        response = requests.get(f"{BASE_URL}/api/admin/groups/moderation-stats", headers=headers)
        print_test("GET /api/admin/groups/moderation-stats", response.status_code == 200,
                   f"Stats: {response.json() if response.status_code == 200 else 'Error'}")
    except Exception as e:
        print_test("GET /api/admin/groups/moderation-stats", False, str(e))
    
    # Test ML performance
    try:
        response = requests.get(f"{BASE_URL}/api/admin/ml-performance", headers=headers)
        print_test("GET /api/admin/ml-performance", response.status_code == 200,
                   f"ML Models: {len(response.json()) if response.status_code == 200 else 0}")
    except Exception as e:
        print_test("GET /api/admin/ml-performance", False, str(e))
    
    # Test ML system status
    try:
        response = requests.get(f"{BASE_URL}/api/admin/ml-system-status", headers=headers)
        print_test("GET /api/admin/ml-system-status", response.status_code == 200,
                   f"System Health: {response.json() if response.status_code == 200 else 'Error'}")
    except Exception as e:
        print_test("GET /api/admin/ml-system-status", False, str(e))

def test_public_endpoints():
    """Test public endpoints"""
    print(f"\n{Colors.BLUE}=== Testing Public Endpoints ==={Colors.END}\n")
    
    # Test health check
    try:
        response = requests.get(f"{BASE_URL}/health")
        print_test("GET /health", response.status_code == 200, "Backend is healthy")
    except Exception as e:
        print_test("GET /health", False, str(e))
    
    # Test docs
    try:
        response = requests.get(f"{BASE_URL}/docs")
        print_test("GET /docs", response.status_code == 200, "API documentation accessible")
    except Exception as e:
        print_test("GET /docs", False, str(e))

def main():
    print(f"\n{Colors.YELLOW}{'='*60}")
    print("ConnectSphere Frontend-Backend API Connection Test")
    print(f"{'='*60}{Colors.END}\n")
    print(f"Base URL: {BASE_URL}")
    print(f"Test Time: {datetime.now().strftime('%Y-%m-%d %H:%M:%S')}\n")
    
    # Test public endpoints first
    test_public_endpoints()
    
    # Get tokens for all user types
    tokens = test_auth_endpoints()
    
    # Test trader endpoints
    if tokens["trader"]:
        test_trader_endpoints(tokens["trader"])
    else:
        print(f"\n{Colors.RED}⚠ Skipping trader tests - authentication failed{Colors.END}")
    
    # Test supplier endpoints
    if tokens["supplier"]:
        test_supplier_endpoints(tokens["supplier"])
    else:
        print(f"\n{Colors.RED}⚠ Skipping supplier tests - authentication failed{Colors.END}")
    
    # Test admin endpoints
    if tokens["admin"]:
        test_admin_endpoints(tokens["admin"])
    else:
        print(f"\n{Colors.RED}⚠ Skipping admin tests - authentication failed{Colors.END}")
    
    print(f"\n{Colors.YELLOW}{'='*60}")
    print("Test Complete!")
    print(f"{'='*60}{Colors.END}\n")

if __name__ == "__main__":
    try:
        main()
    except KeyboardInterrupt:
        print(f"\n\n{Colors.YELLOW}Test interrupted by user{Colors.END}\n")
    except Exception as e:
        print(f"\n\n{Colors.RED}Fatal error: {e}{Colors.END}\n")

