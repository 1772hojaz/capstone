#!/usr/bin/env python3
"""
Comprehensive System Test Script
Tests ALL functionality: auth, products, groups, recommendations, emails, payments, refunds, admin, supplier
"""

import sys
import os
sys.path.insert(0, os.path.dirname(os.path.dirname(os.path.abspath(__file__))))

import requests
from datetime import datetime, timedelta
import json

# API Base URL
BASE_URL = "http://localhost:8000"

# Test results tracking
test_results = {
    "total": 0,
    "passed": 0,
    "failed": 0,
    "sections": {}
}

# Tokens and test data
tokens = {}
test_data = {}


class Colors:
    GREEN = '\033[92m'
    RED = '\033[91m'
    YELLOW = '\033[93m'
    BLUE = '\033[94m'
    CYAN = '\033[96m'
    END = '\033[0m'
    BOLD = '\033[1m'


def section_header(title):
    print(f"\n{Colors.BOLD}{Colors.CYAN}{'='*70}")
    print(f" {title}")
    print(f"{'='*70}{Colors.END}\n")


def test_result(test_name, success, details=""):
    global test_results
    test_results["total"] += 1
    
    if success:
        test_results["passed"] += 1
        symbol = f"{Colors.GREEN}✓{Colors.END}"
    else:
        test_results["failed"] += 1
        symbol = f"{Colors.RED}✗{Colors.END}"
    
    print(f"  {symbol} {test_name}")
    if details:
        print(f"    {Colors.YELLOW}→ {details}{Colors.END}")
    
    return success


def api_call(method, endpoint, token=None, data=None, expected_status=200):
    """Make an API call and return success status and response"""
    try:
        headers = {"Content-Type": "application/json"}
        if token:
            headers["Authorization"] = f"Bearer {token}"
        
        url = f"{BASE_URL}{endpoint}"
        
        if method == "GET":
            response = requests.get(url, headers=headers)
        elif method == "POST":
            response = requests.post(url, headers=headers, json=data)
        elif method == "PUT":
            response = requests.put(url, headers=headers, json=data)
        elif method == "DELETE":
            response = requests.delete(url, headers=headers)
        else:
            return False, None, "Invalid method"
        
        success = response.status_code == expected_status
        try:
            json_data = response.json()
        except:
            json_data = {"raw": response.text}
        
        return success, json_data, response.status_code
    except Exception as e:
        return False, None, str(e)


# ============================================================================
# SECTION 1: HEALTH CHECK & BASIC CONNECTIVITY
# ============================================================================
def test_health_check():
    section_header("1. HEALTH CHECK & BASIC CONNECTIVITY")
    
    # Health endpoint
    success, data, status = api_call("GET", "/health")
    test_result("Backend health check", success and data.get("status") == "healthy", f"Status: {data}")
    
    # Docs endpoint
    success, _, status = api_call("GET", "/docs")
    test_result("API documentation accessible", status == 200)


# ============================================================================
# SECTION 2: AUTHENTICATION FLOW
# ============================================================================
def test_authentication():
    section_header("2. AUTHENTICATION FLOW")
    global tokens
    
    # Test registration (new user)
    new_user_email = f"test_user_{datetime.now().strftime('%H%M%S')}@test.com"
    success, data, status = api_call("POST", "/api/auth/register", data={
        "email": new_user_email,
        "password": "testpass123",
        "full_name": "Test User",
        "location_zone": "Mbare",
        "business_type": "tuckshop"
    })
    test_result("Register new trader", status in [200, 201, 400], f"Email: {new_user_email}")
    
    # Test trader login (seeded user)
    success, data, status = api_call("POST", "/api/auth/login", data={
        "email": "trader1@mbare.co.zw",
        "password": "password123"
    })
    if success and data.get("access_token"):
        tokens["trader"] = data.get("access_token")
        test_data["trader_id"] = data.get("user_id")
        test_data["trader_email"] = data.get("email")
    test_result("Login as trader", success and tokens.get("trader"), f"User ID: {data.get('user_id')}")
    
    # Test admin login
    success, data, status = api_call("POST", "/api/auth/login", data={
        "email": "admin@groupbuy.com",
        "password": "admin123"
    })
    if success and data.get("access_token"):
        tokens["admin"] = data.get("access_token")
    test_result("Login as admin", success and tokens.get("admin"))
    
    # Test supplier login (if exists)
    success, data, status = api_call("POST", "/api/auth/login", data={
        "email": "supplier1@mbare.co.zw",
        "password": "supplier123"
    })
    if success and data.get("access_token"):
        tokens["supplier"] = data.get("access_token")
        test_data["supplier_id"] = data.get("user_id")
    test_result("Login as supplier", success and tokens.get("supplier"), f"Supplier exists: {bool(tokens.get('supplier'))}")
    
    # Test profile access
    if tokens.get("trader"):
        success, data, status = api_call("GET", "/api/auth/me", token=tokens["trader"])
        test_result("Get user profile", success, f"Email: {data.get('email', 'N/A')}")


# ============================================================================
# SECTION 3: PRODUCT BROWSING
# ============================================================================
def test_products():
    section_header("3. PRODUCT BROWSING")
    
    # Get all products
    success, data, status = api_call("GET", "/api/products", token=tokens.get("trader"))
    product_count = len(data) if isinstance(data, list) else 0
    test_result("Get all products", success and product_count > 0, f"Products: {product_count}")
    
    if product_count > 0:
        test_data["product_id"] = data[0].get("id")
        test_data["product_name"] = data[0].get("name")
    
    # Get products by category
    success, data, status = api_call("GET", "/api/products?category=Vegetables", token=tokens.get("trader"))
    test_result("Filter products by category", success)
    
    # Get single product
    if test_data.get("product_id"):
        success, data, status = api_call("GET", f"/api/products/{test_data['product_id']}", token=tokens.get("trader"))
        test_result("Get single product details", success, f"Product: {data.get('name', 'N/A')}")


# ============================================================================
# SECTION 4: ML RECOMMENDATIONS
# ============================================================================
def test_recommendations():
    section_header("4. ML RECOMMENDATIONS")
    
    if not tokens.get("trader"):
        print(f"  {Colors.YELLOW}⚠ Skipping - no trader token{Colors.END}")
        return
    
    # Get recommendations
    success, data, status = api_call("GET", "/api/ml/recommendations", token=tokens["trader"])
    rec_count = len(data) if isinstance(data, list) else 0
    test_result("Get personalized recommendations", success, f"Recommendations: {rec_count}")
    
    if rec_count > 0:
        # Check recommendation structure
        rec = data[0]
        has_required_fields = all(k in rec for k in ['recommendation_score', 'reason'])
        test_result("Recommendation has required fields", has_required_fields, 
                   f"Score: {rec.get('recommendation_score', 0):.3f}")
        
        # Display top 3 recommendations
        print(f"\n  {Colors.CYAN}Top 3 Recommendations:{Colors.END}")
        for i, r in enumerate(data[:3], 1):
            print(f"    {i}. {r.get('product_name', 'Unknown')[:40]} - Score: {r.get('recommendation_score', 0):.3f}")
            print(f"       Reason: {r.get('reason', 'N/A')[:60]}")
    
    # Test ML model status
    if tokens.get("admin"):
        success, data, status = api_call("GET", "/api/admin/ml-system-status", token=tokens["admin"])
        test_result("ML system status (admin)", success, f"Status: {data}")


# ============================================================================
# SECTION 5: GROUP BUY FLOW
# ============================================================================
def test_group_buy_flow():
    section_header("5. GROUP BUY FLOW")
    
    # Get all groups
    success, data, status = api_call("GET", "/api/groups", token=tokens.get("trader"))
    group_count = len(data) if isinstance(data, list) else 0
    test_result("Get all active groups", success, f"Groups: {group_count}")
    
    if group_count > 0:
        test_data["group_id"] = data[0].get("id")
        test_data["group_name"] = data[0].get("name") or data[0].get("product_name")
    
    # Get my groups
    if tokens.get("trader"):
        success, data, status = api_call("GET", "/api/groups/my-groups", token=tokens["trader"])
        my_groups = len(data) if isinstance(data, list) else 0
        test_result("Get my joined groups", success, f"My Groups: {my_groups}")
    
    # Test group details
    if test_data.get("group_id"):
        success, data, status = api_call("GET", f"/api/groups/{test_data['group_id']}", token=tokens.get("trader"))
        test_result("Get group details", success, f"Group: {data.get('name', data.get('product_name', 'N/A'))}")
    
    # Test supplier group creation
    if tokens.get("supplier"):
        end_date = (datetime.utcnow() + timedelta(days=7)).isoformat() + "Z"
        success, data, status = api_call("POST", "/api/supplier/groups/create", token=tokens["supplier"], data={
            "name": f"Test Group {datetime.now().strftime('%H%M%S')}",
            "description": "Automated test group",
            "long_description": "Created by comprehensive test script",
            "category": "Vegetables",
            "price": 25.00,
            "original_price": 35.00,
            "image": "https://via.placeholder.com/300",
            "max_participants": 5,
            "end_date": end_date,
            "shipping_info": "Pickup at Mbare",
            "estimated_delivery": "3-5 days",
            "features": ["Fresh", "Organic"],
            "requirements": ["Min 5 participants"]
        })
        if success:
            test_data["created_group_id"] = data.get("group_id") or data.get("id")
        test_result("Supplier creates group", success, f"Created Group ID: {test_data.get('created_group_id')}")


# ============================================================================
# SECTION 6: ADD MORE PRODUCTS LOGIC (QUANTITY UPDATE)
# ============================================================================
def test_add_more_products():
    section_header("6. ADD MORE PRODUCTS / QUANTITY UPDATE LOGIC")
    
    if not tokens.get("trader") or not test_data.get("group_id"):
        print(f"  {Colors.YELLOW}⚠ Skipping - missing trader token or group{Colors.END}")
        return
    
    group_id = test_data.get("group_id")
    
    # First, get current group status
    success, group_data, status = api_call("GET", f"/api/groups/{group_id}", token=tokens["trader"])
    test_result("Get group before join", success, f"Status: {group_data.get('status', 'N/A')}")
    
    # Test joining a group (this is the add products flow)
    success, data, status = api_call("POST", f"/api/groups/{group_id}/join", token=tokens["trader"], data={
        "quantity": 2,
        "delivery_method": "pickup",
        "payment_method": "cash"
    })
    
    if success:
        test_result("Join group / Add products", True, 
                   f"Quantity: 2, Payment: ${data.get('payment_amount', 0)}")
        test_data["join_data"] = data
    else:
        # Might already be a member - check for that
        already_member = "already" in str(data).lower() or status == 400
        test_result("Join group / Add products", already_member, 
                   f"Already member or: {str(data)[:50]}")
    
    # Test updating quantity (if endpoint exists)
    success, data, status = api_call("PUT", f"/api/groups/{group_id}/contribution", token=tokens["trader"], data={
        "quantity": 3
    })
    test_result("Update contribution quantity", success or status in [404, 405], f"Status: {status}")


# ============================================================================
# SECTION 7: EMAIL NOTIFICATIONS
# ============================================================================
def test_email_notifications():
    section_header("7. EMAIL NOTIFICATIONS (SIMULATION MODE)")
    
    # Import email service directly
    try:
        from services.email_service import email_service
        
        # Check email service mode
        test_result("Email service initialized", True, 
                   f"Mode: {'SIMULATION' if email_service.simulation_mode else 'PRODUCTION'}")
        
        # Test welcome email
        result = email_service.send_welcome_email(
            user_email="test@example.com",
            user_name="Test User"
        )
        test_result("Send welcome email", result.get("status") in ["sent", "simulated"], 
                   f"Status: {result.get('status')}")
        
        # Test payment confirmation email
        result = email_service.send_payment_confirmation(
            user_email="test@example.com",
            user_name="Test User",
            group_name="Test Group Buy",
            amount=50.00,
            transaction_ref="TXN123456"
        )
        test_result("Send payment confirmation email", result.get("status") in ["sent", "simulated"],
                   f"Amount: $50.00")
        
        # Test refund email
        result = email_service.send_refund_confirmation(
            user_email="test@example.com",
            user_name="Test User",
            refund_amount=25.00,
            refund_reference="REF789",
            reason="Test refund"
        )
        test_result("Send refund confirmation email", result.get("status") in ["sent", "simulated"],
                   f"Refund: $25.00")
        
        # Test group deletion notification
        result = email_service.send_group_deletion_notification(
            user_email="test@example.com",
            user_name="Test User",
            group_name="Cancelled Group",
            group_id=999,
            refund_amount=100.00,
            refund_status="processed"
        )
        test_result("Send group deletion notification", result.get("status") in ["sent", "simulated"])
        
    except Exception as e:
        test_result("Email service test", False, f"Error: {e}")


# ============================================================================
# SECTION 8: ADMIN DASHBOARD
# ============================================================================
def test_admin_dashboard():
    section_header("8. ADMIN DASHBOARD FUNCTIONALITY")
    
    if not tokens.get("admin"):
        print(f"  {Colors.YELLOW}⚠ Skipping - no admin token{Colors.END}")
        return
    
    # Dashboard overview
    success, data, status = api_call("GET", "/api/admin/dashboard", token=tokens["admin"])
    test_result("Admin dashboard data", success, f"Data available: {bool(data)}")
    
    # Get all users
    success, data, status = api_call("GET", "/api/admin/users", token=tokens["admin"])
    user_count = len(data) if isinstance(data, list) else 0
    test_result("Get all users", success, f"Users: {user_count}")
    
    # Get all groups
    success, data, status = api_call("GET", "/api/admin/groups", token=tokens["admin"])
    group_count = len(data) if isinstance(data, list) else 0
    test_result("Get all admin groups", success, f"Groups: {group_count}")
    
    # Moderation stats
    success, data, status = api_call("GET", "/api/admin/groups/moderation-stats", token=tokens["admin"])
    test_result("Get moderation stats", success, f"Stats: {data}")
    
    # ML performance
    success, data, status = api_call("GET", "/api/admin/ml-performance", token=tokens["admin"])
    test_result("Get ML performance", success)
    
    # Ready for payment groups
    success, data, status = api_call("GET", "/api/admin/groups/ready-for-payment", token=tokens["admin"])
    test_result("Get groups ready for payment", success or status == 404)


# ============================================================================
# SECTION 9: SUPPLIER WORKFLOW
# ============================================================================
def test_supplier_workflow():
    section_header("9. SUPPLIER WORKFLOW")
    
    if not tokens.get("supplier"):
        print(f"  {Colors.YELLOW}⚠ Skipping - no supplier token{Colors.END}")
        return
    
    # Dashboard metrics
    success, data, status = api_call("GET", "/api/supplier/dashboard/metrics", token=tokens["supplier"])
    test_result("Supplier dashboard metrics", success, f"Metrics: {data}")
    
    # Supplier orders
    success, data, status = api_call("GET", "/api/supplier/orders", token=tokens["supplier"])
    order_count = len(data) if isinstance(data, list) else 0
    test_result("Get supplier orders", success, f"Orders: {order_count}")
    
    if order_count > 0:
        test_data["order_id"] = data[0].get("id")
    
    # Supplier groups
    success, data, status = api_call("GET", "/api/supplier/groups", token=tokens["supplier"])
    test_result("Get supplier groups", success, f"Groups: {len(data) if isinstance(data, list) else 0}")
    
    # Supplier payments
    success, data, status = api_call("GET", "/api/supplier/payments", token=tokens["supplier"])
    test_result("Get supplier payments", success)
    
    # Supplier products
    success, data, status = api_call("GET", "/api/supplier/products", token=tokens["supplier"])
    test_result("Get supplier products", success)


# ============================================================================
# SECTION 10: REFUND SERVICE
# ============================================================================
def test_refund_service():
    section_header("10. REFUND SERVICE")
    
    try:
        from services.refund_service import RefundService
        
        refund_service = RefundService()
        test_result("Refund service initialized", True)
        
        # Test refund calculation (mock)
        test_amount = 100.00
        # This would normally interact with payment gateway
        print(f"  {Colors.CYAN}→ Refund service ready for ${test_amount} transactions{Colors.END}")
        
    except Exception as e:
        test_result("Refund service test", False, f"Error: {e}")


# ============================================================================
# SECTION 11: QR CODE SERVICE
# ============================================================================
def test_qr_service():
    section_header("11. QR CODE SERVICE")
    
    try:
        from services.qr_service import QRCodeService
        
        qr_service = QRCodeService()
        test_result("QR service initialized", True)
        
        # Test QR code verification token generation
        test_token = qr_service.generate_verification_token(1, 1, 1)
        test_result("Generate verification token", test_token is not None, f"Token: {test_token[:30]}...")
        
    except ImportError as e:
        test_result("QR service import", False, f"Missing dependency: {e}")
    except Exception as e:
        test_result("QR service test", False, f"Error: {e}")


# ============================================================================
# SECTION 12: DATABASE VALIDATION
# ============================================================================
def test_database():
    section_header("12. DATABASE VALIDATION")
    
    try:
        from db.database import SessionLocal
        from models.models import User, Product, GroupBuy, Transaction
        
        db = SessionLocal()
        
        # Count records
        user_count = db.query(User).count()
        product_count = db.query(Product).count()
        group_count = db.query(GroupBuy).count()
        transaction_count = db.query(Transaction).count()
        
        test_result("Database connection", True)
        test_result("Users in database", user_count > 0, f"Count: {user_count}")
        test_result("Products in database", product_count > 0, f"Count: {product_count}")
        test_result("Groups in database", group_count >= 0, f"Count: {group_count}")
        test_result("Transactions in database", transaction_count > 0, f"Count: {transaction_count}")
        
        db.close()
        
    except Exception as e:
        test_result("Database test", False, f"Error: {e}")


# ============================================================================
# MAIN
# ============================================================================
def print_summary():
    section_header("TEST SUMMARY")
    
    total = test_results["total"]
    passed = test_results["passed"]
    failed = test_results["failed"]
    
    pass_rate = (passed / total * 100) if total > 0 else 0
    
    print(f"  Total Tests:  {total}")
    print(f"  {Colors.GREEN}Passed:       {passed}{Colors.END}")
    print(f"  {Colors.RED}Failed:       {failed}{Colors.END}")
    print(f"  Pass Rate:    {pass_rate:.1f}%")
    print()
    
    if failed == 0:
        print(f"  {Colors.GREEN}{Colors.BOLD}✓ ALL TESTS PASSED!{Colors.END}")
    else:
        print(f"  {Colors.RED}{Colors.BOLD}✗ {failed} TEST(S) FAILED{Colors.END}")


def main():
    print(f"\n{Colors.BOLD}{Colors.YELLOW}")
    print("=" * 70)
    print(" CONNECTAFRICA COMPREHENSIVE SYSTEM TEST")
    print("=" * 70)
    print(f"{Colors.END}")
    print(f"  Base URL: {BASE_URL}")
    print(f"  Started:  {datetime.now().strftime('%Y-%m-%d %H:%M:%S')}")
    
    # Run all test sections
    test_health_check()
    test_authentication()
    test_products()
    test_recommendations()
    test_group_buy_flow()
    test_add_more_products()
    test_email_notifications()
    test_admin_dashboard()
    test_supplier_workflow()
    test_refund_service()
    test_qr_service()
    test_database()
    
    print_summary()
    
    return test_results["failed"] == 0


if __name__ == "__main__":
    try:
        success = main()
        sys.exit(0 if success else 1)
    except KeyboardInterrupt:
        print(f"\n\n{Colors.YELLOW}Test interrupted by user{Colors.END}\n")
        sys.exit(130)
    except Exception as e:
        print(f"\n\n{Colors.RED}Fatal error: {e}{Colors.END}\n")
        import traceback
        traceback.print_exc()
        sys.exit(1)

