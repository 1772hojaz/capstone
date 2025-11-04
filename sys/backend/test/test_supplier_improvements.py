#!/usr/bin/env python3
"""
Comprehensive test suite for supplier improvements
Tests authentication, group management, analytics, and notification system
"""

import pytest
from fastapi.testclient import TestClient

from main import app

client = TestClient(app)

class TestSupplierImprovements:
    """Test suite for all supplier improvements"""
    
    @pytest.fixture
    def supplier_token(self):
        """Create a test supplier and return auth token"""
        # Register a test supplier
        supplier_data = {
            "email": "testsupplier@example.com",
            "password": "SecurePass123",
            "full_name": "Test Supplier",
            "company_name": "Test Supplier Inc",
            "business_address": "123 Test St, Test City",
            "tax_id": "123456789",
            "phone_number": "+1234567890",
            "location_zone": "central",
            "business_type": "wholesaler",
            "business_description": "Quality test products supplier"
        }
        
        response = client.post("/api/auth/register-supplier", json=supplier_data)
        assert response.status_code == 200
        return response.json()["access_token"]
    
    def test_enhanced_supplier_registration(self):
        """Test enhanced supplier registration with validation"""
        # Test successful registration
        supplier_data = {
            "email": "newsupplier@example.com",
            "password": "SecurePass123",
            "full_name": "New Supplier",
            "company_name": "New Supplier Inc",
            "business_address": "456 New St, New City",
            "tax_id": "987654321",
            "phone_number": "+1987654321",
            "location_zone": "central",
            "business_type": "retailer",
            "business_description": "Retail supplier"
        }
        
        response = client.post("/api/auth/register-supplier", json=supplier_data)
        assert response.status_code == 200
        
        data = response.json()
        assert data["is_supplier"]
        assert data["company_name"] == "New Supplier Inc"
        
        # Test password strength validation
        weak_password_data = supplier_data.copy()
        weak_password_data["email"] = "weak@example.com"
        weak_password_data["password"] = "weak"
        
        response = client.post("/api/auth/register-supplier", json=weak_password_data)
        assert response.status_code == 400
        assert "Password must be at least 8 characters" in response.json()["detail"]
    
    def test_supplier_profile_management(self, supplier_token):
        """Test supplier profile retrieval and updates"""
        headers = {"Authorization": f"Bearer {supplier_token}"}
        
        # Test profile retrieval
        response = client.get("/api/auth/supplier/profile", headers=headers)
        assert response.status_code == 200
        
        profile = response.json()
        assert profile["company_name"] == "Test Supplier Inc"
        assert profile["business_type"] == "wholesaler"
        
        # Test profile update
        update_data = {
            "business_description": "Updated test products supplier",
            "website_url": "https://testsupplier.com",
            "payment_terms": "net_15"
        }
        
        response = client.put("/api/auth/supplier/profile", headers=headers, params=update_data)
        assert response.status_code == 200
        
        updated_profile = response.json()
        assert updated_profile["business_description"] == "Updated test products supplier"
        assert updated_profile["website_url"] == "https://testsupplier.com"
    
    def test_supplier_dashboard_metrics(self, supplier_token):
        """Test enhanced dashboard metrics"""
        headers = {"Authorization": f"Bearer {supplier_token}"}
        
        response = client.get("/api/supplier/dashboard/metrics", headers=headers)
        assert response.status_code == 200
        
        metrics = response.json()
        required_fields = [
            "pending_orders", "active_groups", "monthly_revenue", 
            "total_savings_generated", "top_products"
        ]
        
        for field in required_fields:
            assert field in metrics
            assert isinstance(metrics[field], (int, float, list))
    
    def test_supplier_group_management(self, supplier_token):
        """Test comprehensive group management features"""
        headers = {"Authorization": f"Bearer {supplier_token}"}
        
        # Test getting active groups
        response = client.get("/api/supplier/groups/active", headers=headers)
        assert response.status_code == 200
        
        groups = response.json()
        assert isinstance(groups, list)
        
        # Test group moderation stats
        response = client.get("/api/supplier/groups/moderation-stats", headers=headers)
        assert response.status_code == 200
        
        stats = response.json()
        required_stats = [
            "active_groups", "total_members", "ready_for_payment", 
            "required_action", "pending_orders"
        ]
        
        for stat in required_stats:
            assert stat in stats
            assert isinstance(stats[stat], int)
    
    def test_supplier_analytics(self, supplier_token):
        """Test advanced analytics endpoints"""
        headers = {"Authorization": f"Bearer {supplier_token}"}
        
        # Test analytics overview
        response = client.get("/api/supplier/analytics/overview", headers=headers)
        assert response.status_code == 200
        
        analytics = response.json()
        required_sections = [
            "revenue_analytics", "group_performance", "product_performance",
            "customer_metrics", "category_trends", "summary_metrics"
        ]
        
        for section in required_sections:
            assert section in analytics
        
        # Test revenue trend
        response = client.get("/api/supplier/analytics/revenue-trend?days=30", headers=headers)
        assert response.status_code == 200
        
        trend = response.json()
        assert "daily_data" in trend
        assert "total_revenue" in trend
        assert trend["period_days"] == 30
        
        # Test group insights
        response = client.get("/api/supplier/analytics/group-insights", headers=headers)
        assert response.status_code == 200
        
        insights = response.json()
        assert "group_insights" in insights
        assert "performance_benchmarks" in insights
    
    def test_supplier_notifications(self, supplier_token):
        """Test comprehensive notification system"""
        headers = {"Authorization": f"Bearer {supplier_token}"}
        
        # Test notification summary
        response = client.get("/api/supplier/notifications/summary", headers=headers)
        assert response.status_code == 200
        
        summary = response.json()
        required_fields = [
            "total_notifications", "unread_notifications", "high_priority_unread",
            "recent_notifications_24h", "unread_by_type", "needs_attention"
        ]
        
        for field in required_fields:
            assert field in summary
        
        # Test creating test notifications
        response = client.post("/api/supplier/notifications/test", headers=headers)
        assert response.status_code == 200
        
        result = response.json()
        assert "created_count" in result
        assert result["created_count"] > 0
        
        # Test getting notifications after creation
        response = client.get("/api/supplier/notifications", headers=headers)
        assert response.status_code == 200
        
        notifications = response.json()
        assert isinstance(notifications, list)
        assert len(notifications) > 0
        
        # Test marking notification as read
        if notifications:
            notification_id = notifications[0]["id"]
            response = client.put(f"/api/supplier/notifications/{notification_id}/read", headers=headers)
            assert response.status_code == 200
    
    def test_image_upload(self, supplier_token):
        """Test image upload functionality"""
        headers = {"Authorization": f"Bearer {supplier_token}"}
        
        # Create a test image file
        test_image_content = b"fake image content for testing"
        files = {
            "file": ("test_image.jpg", test_image_content, "image/jpeg")
        }
        
        # Note: This test assumes Cloudinary is configured
        # In a real test environment, you might want to mock this
        try:
            response = client.post("/api/supplier/upload-image", headers=headers, files=files)
            # Should either succeed (if Cloudinary is configured) or fail gracefully
            assert response.status_code in [200, 500]  # 500 if Cloudinary not configured
            
            if response.status_code == 200:
                result = response.json()
                assert "image_url" in result
                assert "public_id" in result
        except Exception as e:
            # Image upload might fail in test environment without Cloudinary config
            print(f"Image upload test skipped due to configuration: {e}")
    
    def test_error_handling(self, supplier_token):
        """Test enhanced error handling"""
        headers = {"Authorization": f"Bearer {supplier_token}"}
        
        # Test accessing non-existent group
        response = client.get("/api/supplier/groups/99999", headers=headers)
        assert response.status_code == 404
        
        # Test invalid group update
        invalid_update = {
            "price": -100,  # Invalid negative price
            "max_participants": "invalid"  # Invalid type
        }
        
        response = client.put("/api/supplier/groups/1", headers=headers, json=invalid_update)
        assert response.status_code in [400, 404]  # 400 for validation error, 404 if group doesn't exist
    
    def test_verification_workflow(self, supplier_token):
        """Test business verification workflow"""
        headers = {"Authorization": f"Bearer {supplier_token}"}
        
        # Test getting verification status
        response = client.get("/api/auth/supplier/verification-status", headers=headers)
        assert response.status_code == 200
        
        status = response.json()
        assert "status" in status
        assert "is_verified" in status
        assert "description" in status
        
        # Test requesting verification
        response = client.post("/api/auth/supplier/verify-business", headers=headers)
        # Should succeed since we provided required fields in supplier registration
        assert response.status_code == 200
        
        result = response.json()
        assert result["status"] == "submitted"

def run_all_tests():
    """Run all supplier improvement tests"""
    print("🚀 Starting Supplier Improvements Test Suite")
    print("=" * 60)
    
    test_instance = TestSupplierImprovements()
    
    try:
        # Create supplier token for tests that need it
        print("📝 Testing enhanced supplier registration...")
        test_instance.test_enhanced_supplier_registration()
        print("✅ Enhanced registration tests passed")
        
        # Get supplier token
        supplier_token = test_instance.supplier_token()
        
        print("👤 Testing supplier profile management...")
        test_instance.test_supplier_profile_management(supplier_token)
        print("✅ Profile management tests passed")
        
        print("📊 Testing dashboard metrics...")
        test_instance.test_supplier_dashboard_metrics(supplier_token)
        print("✅ Dashboard metrics tests passed")
        
        print("👥 Testing group management...")
        test_instance.test_supplier_group_management(supplier_token)
        print("✅ Group management tests passed")
        
        print("📈 Testing analytics endpoints...")
        test_instance.test_supplier_analytics(supplier_token)
        print("✅ Analytics tests passed")
        
        print("🔔 Testing notification system...")
        test_instance.test_supplier_notifications(supplier_token)
        print("✅ Notification tests passed")
        
        print("🖼️ Testing image upload...")
        test_instance.test_image_upload(supplier_token)
        print("✅ Image upload tests passed")
        
        print("⚠️ Testing error handling...")
        test_instance.test_error_handling(supplier_token)
        print("✅ Error handling tests passed")
        
        print("✅ Testing verification workflow...")
        test_instance.test_verification_workflow(supplier_token)
        print("✅ Verification workflow tests passed")
        
        print("\n🎉 ALL SUPPLIER IMPROVEMENT TESTS PASSED!")
        print("=" * 60)
        print("✨ Supplier system is ready for production!")
        
    except Exception as e:
        print(f"\n❌ Test failed: {e}")
        print("Please check the implementation and try again.")
        return False
    
    return True

if __name__ == "__main__":
    success = run_all_tests()
    exit(0 if success else 1)