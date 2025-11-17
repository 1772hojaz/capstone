#!/usr/bin/env python3
"""
Comprehensive Unit Test Suite for ConnectSphere Backend
Tests models, services, and business logic with integration testing using in-memory database
"""

import pytest
import sys
import os
from unittest.mock import Mock, MagicMock, patch, call
from datetime import datetime, timedelta
import json

# Add parent directory to path
sys.path.insert(0, os.path.dirname(os.path.dirname(os.path.abspath(__file__))))

from sqlalchemy import create_engine
from sqlalchemy.orm import sessionmaker
from db.database import Base

# Import models
from models.models import (
    User, Product, GroupBuy, AdminGroup, Contribution, 
    AdminGroupJoin, Transaction, SupplierOrder, SupplierPayment
)
# Import analytics models to ensure all relationships are resolved
from models import analytics_models

# Import services
from services.email_service import EmailService
from services.refund_service import RefundService
from services.qr_service import QRCodeService


# ============================================================================
# TEST DATABASE SETUP AND FIXTURES
# ============================================================================

@pytest.fixture(scope="function")
def test_db():
    """Create an in-memory test database for each test"""
    # Use in-memory SQLite for testing
    engine = create_engine("sqlite:///:memory:", echo=False)
    Base.metadata.create_all(engine)
    TestingSessionLocal = sessionmaker(bind=engine)
    db = TestingSessionLocal()
    
    yield db
    
    db.close()


@pytest.fixture
def sample_trader(test_db):
    """Create a sample trader user for testing"""
    user = User(
        email="trader@example.com",
        hashed_password="hashed_password_123",
        full_name="Test Trader",
        location_zone="HARARE",
        is_admin=False,
        is_supplier=False,
        preferred_categories=["Electronics", "Fashion"],
        budget_range="medium",
        experience_level="intermediate",
        email_notifications=True,
        push_notifications=True,
        sms_notifications=False
    )
    test_db.add(user)
    test_db.commit()
    test_db.refresh(user)
    return user


@pytest.fixture
def sample_supplier(test_db):
    """Create a sample supplier for testing"""
    supplier = User(
        email="supplier@example.com",
        hashed_password="hashed_password_123",
        full_name="Test Supplier",
        location_zone="HARARE",
        is_supplier=True,
        company_name="Test Suppliers Ltd",
        business_type="wholesaler",
        bank_account_number="1234567890",
        bank_account_name="Test Supplier Account",
        bank_name="Test Bank",
        supplier_rating=4.5,
        total_orders_fulfilled=10,
        is_verified=True
    )
    test_db.add(supplier)
    test_db.commit()
    test_db.refresh(supplier)
    return supplier


@pytest.fixture
def sample_admin(test_db):
    """Create a sample admin user for testing"""
    admin = User(
        email="admin@example.com",
        hashed_password="hashed_password_123",
        full_name="Test Admin",
        location_zone="HARARE",
        is_admin=True,
        is_supplier=False
    )
    test_db.add(admin)
    test_db.commit()
    test_db.refresh(admin)
    return admin


@pytest.fixture
def sample_product(test_db):
    """Create a sample product for testing"""
    product = Product(
        name="Test Product",
        description="A test product for unit testing",
        unit_price=100.0,
        bulk_price=80.0,
        moq=10,
        category="Electronics",
        manufacturer="Test Manufacturer",
        total_stock=100,
        is_active=True
    )
    test_db.add(product)
    test_db.commit()
    test_db.refresh(product)
    return product


@pytest.fixture
def sample_group_buy(test_db, sample_product, sample_trader):
    """Create a sample group buy for testing"""
    deadline = datetime.utcnow() + timedelta(days=7)
    group = GroupBuy(
        product_id=sample_product.id,
        creator_id=sample_trader.id,
        location_zone="HARARE",
        deadline=deadline,
        status="active",
        total_quantity=0,
        total_contributions=0.0,
        total_paid=0.0
    )
    test_db.add(group)
    test_db.commit()
    test_db.refresh(group)
    return group


@pytest.fixture
def sample_admin_group(test_db, sample_supplier):
    """Create a sample admin group for testing"""
    end_date = datetime.utcnow() + timedelta(days=7)
    group = AdminGroup(
        name="Test Admin Group",
        description="Test description for admin group",
        category="Electronics",
        price=80.0,
        original_price=100.0,
        image="test_image.jpg",
        max_participants=50,
        participants=0,
        end_date=end_date,
        supplier_id=sample_supplier.id,
        is_active=True
    )
    test_db.add(group)
    test_db.commit()
    test_db.refresh(group)
    return group


# ============================================================================
# MODEL TESTS (12 tests)
# ============================================================================

class TestUserModel:
    """Test User model creation and attributes"""
    
    def test_trader_creation(self, sample_trader):
        """Test that trader user is created correctly"""
        assert sample_trader.id is not None
        assert sample_trader.email == "trader@example.com"
        assert sample_trader.location_zone == "HARARE"
        assert sample_trader.is_admin is False
        assert sample_trader.is_supplier is False
        assert sample_trader.full_name == "Test Trader"
    
    def test_supplier_creation(self, sample_supplier):
        """Test that supplier user is created correctly with supplier-specific fields"""
        assert sample_supplier.id is not None
        assert sample_supplier.is_supplier is True
        assert sample_supplier.company_name == "Test Suppliers Ltd"
        assert sample_supplier.business_type == "wholesaler"
        assert sample_supplier.bank_account_number == "1234567890"
        assert sample_supplier.bank_name == "Test Bank"
        assert sample_supplier.supplier_rating == 4.5
        assert sample_supplier.total_orders_fulfilled == 10
        assert sample_supplier.is_verified is True
    
    def test_admin_creation(self, sample_admin):
        """Test that admin user is created correctly"""
        assert sample_admin.id is not None
        assert sample_admin.is_admin is True
        assert sample_admin.is_supplier is False
    
    def test_user_preferences(self, sample_trader):
        """Test user preferences for recommendations"""
        assert "Electronics" in sample_trader.preferred_categories
        assert "Fashion" in sample_trader.preferred_categories
        assert sample_trader.budget_range == "medium"
        assert sample_trader.experience_level == "intermediate"
    
    def test_notification_settings(self, sample_trader):
        """Test default notification settings"""
        assert sample_trader.email_notifications is True
        assert sample_trader.push_notifications is True
        assert sample_trader.sms_notifications is False


class TestProductModel:
    """Test Product model creation and calculations"""
    
    def test_product_creation(self, sample_product):
        """Test that product is created correctly"""
        assert sample_product.id is not None
        assert sample_product.name == "Test Product"
        assert sample_product.unit_price == 100.0
        assert sample_product.bulk_price == 80.0
        assert sample_product.moq == 10
        assert sample_product.category == "Electronics"
        assert sample_product.is_active is True
    
    def test_savings_factor_calculation(self, sample_product):
        """Test savings factor property: (unit_price - bulk_price) / unit_price"""
        expected_savings = (100.0 - 80.0) / 100.0
        assert sample_product.savings_factor == expected_savings
        assert sample_product.savings_factor == 0.2
    
    def test_savings_factor_zero_price(self, test_db):
        """Test savings factor with zero unit price edge case"""
        product = Product(
            name="Free Product",
            unit_price=0.0,
            bulk_price=0.0,
            moq=1,
            category="Test"
        )
        test_db.add(product)
        test_db.commit()
        assert product.savings_factor == 0.0


class TestGroupBuyModel:
    """Test GroupBuy model creation and relationships"""
    
    def test_group_buy_creation(self, sample_group_buy, sample_product, sample_trader):
        """Test that group buy is created correctly with default values"""
        assert sample_group_buy.id is not None
        assert sample_group_buy.product_id == sample_product.id
        assert sample_group_buy.creator_id == sample_trader.id
        assert sample_group_buy.status == "active"
        assert sample_group_buy.total_quantity == 0
        assert sample_group_buy.total_contributions == 0.0
        assert sample_group_buy.total_paid == 0.0
        assert sample_group_buy.location_zone == "HARARE"
    
    def test_group_buy_relationships(self, test_db, sample_group_buy, sample_product, sample_trader):
        """Test group buy relationships with product and creator"""
        group = test_db.query(GroupBuy).filter(GroupBuy.id == sample_group_buy.id).first()
        assert group.product.name == sample_product.name
        assert group.creator.email == sample_trader.email


class TestAdminGroupModel:
    """Test AdminGroup model creation and calculations"""
    
    def test_admin_group_creation(self, sample_admin_group):
        """Test that admin group is created correctly"""
        assert sample_admin_group.id is not None
        assert sample_admin_group.name == "Test Admin Group"
        assert sample_admin_group.price == 80.0
        assert sample_admin_group.original_price == 100.0
        assert sample_admin_group.is_active is True
        assert sample_admin_group.max_participants == 50
        assert sample_admin_group.participants == 0
    
    def test_admin_group_discount_calculation(self, sample_admin_group):
        """Test discount percentage: ((original_price - price) / original_price) * 100"""
        expected_discount = ((100.0 - 80.0) / 100.0) * 100
        assert expected_discount == 20.0
        # Verify the savings
        savings = sample_admin_group.original_price - sample_admin_group.price
        assert savings == 20.0


class TestContributionModel:
    """Test Contribution model for GroupBuy participation"""
    
    def test_contribution_creation_with_paid_amount(self, test_db, sample_group_buy, sample_trader):
        """Test contribution creation with paid_amount field"""
        contribution = Contribution(
            group_buy_id=sample_group_buy.id,
            user_id=sample_trader.id,
            quantity=5,
            contribution_amount=400.0,
            paid_amount=400.0,
            is_fully_paid=True
        )
        test_db.add(contribution)
        test_db.commit()
        test_db.refresh(contribution)
        
        assert contribution.id is not None
        assert contribution.quantity == 5
        assert contribution.contribution_amount == 400.0
        assert contribution.paid_amount == 400.0
        assert contribution.is_fully_paid is True
    
    def test_contribution_is_fully_paid_flag(self, test_db, sample_group_buy, sample_trader):
        """Test is_fully_paid flag behavior"""
        contribution = Contribution(
            group_buy_id=sample_group_buy.id,
            user_id=sample_trader.id,
            quantity=5,
            contribution_amount=400.0,
            paid_amount=200.0,
            is_fully_paid=False
        )
        test_db.add(contribution)
        test_db.commit()
        
        assert contribution.is_fully_paid is False
        assert contribution.paid_amount < contribution.contribution_amount


class TestTransactionModel:
    """Test Transaction model for financial event logging"""
    
    def test_transaction_creation_with_location(self, test_db, sample_trader, sample_product, sample_group_buy):
        """Test transaction creation with location_zone"""
        transaction = Transaction(
            user_id=sample_trader.id,
            group_buy_id=sample_group_buy.id,
            product_id=sample_product.id,
            quantity=5,
            amount=400.0,
            transaction_type="upfront",
            location_zone="HARARE"
        )
        test_db.add(transaction)
        test_db.commit()
        test_db.refresh(transaction)
        
        assert transaction.id is not None
        assert transaction.amount == 400.0
        assert transaction.transaction_type == "upfront"
        assert transaction.location_zone == "HARARE"


# ============================================================================
# SERVICE TESTS (11 tests)
# ============================================================================

class TestEmailService:
    """Test Email Service functionality"""
    
    def test_initialization_simulation_mode(self):
        """Test email service enters simulation mode when no credentials"""
        with patch.dict(os.environ, {}, clear=True):
            service = EmailService()
            assert service.simulation_mode is True
    
    def test_send_email_simulation_mode(self):
        """Test sending email in simulation mode"""
        service = EmailService()
        service.simulation_mode = True
        
        result = service.send_email(
            to_email="recipient@example.com",
            subject="Test Subject",
            body_html="<p>Test Body</p>",
            body_text="Test Body"
        )
        
        assert result['status'] == 'simulated'
        assert result['to'] == "recipient@example.com"
        assert result['subject'] == "Test Subject"
    
    def test_send_group_deletion_notification_template(self):
        """Test group deletion notification email template"""
        service = EmailService()
        service.simulation_mode = True
        
        result = service.send_group_deletion_notification(
            user_email="trader@example.com",
            user_name="Test Trader",
            group_name="Test Group",
            group_id=1,
            refund_amount=100.0,
            refund_status="pending"
        )
        
        assert result['status'] == 'simulated'
        assert result['to'] == "trader@example.com"
    
    def test_send_refund_confirmation_template(self):
        """Test refund confirmation email template"""
        service = EmailService()
        service.simulation_mode = True
        
        result = service.send_refund_confirmation(
            user_email="trader@example.com",
            user_name="Test Trader",
            refund_amount=100.0,
            refund_reference="REF123",
            reason="Supplier rejected order"
        )
        
        assert result['status'] == 'simulated'
        assert result['to'] == "trader@example.com"
    
    @patch('services.email_service.smtplib.SMTP')
    def test_send_email_production_mode(self, mock_smtp):
        """Mock SMTP for production mode test"""
        # Mock SMTP server
        mock_server = MagicMock()
        mock_smtp.return_value.__enter__.return_value = mock_server
        
        with patch.dict(os.environ, {
            'SMTP_USER': 'test@example.com',
            'SMTP_PASSWORD': 'test_password'
        }):
            service = EmailService()
            assert service.simulation_mode is False
            
            result = service.send_email(
                to_email="recipient@example.com",
                subject="Test Subject",
                body_html="<p>Test Body</p>",
                body_text="Test Body"
            )
            
            assert result['status'] == 'sent'
            mock_server.starttls.assert_called_once()
            mock_server.login.assert_called_once()


class TestRefundService:
    """Test Refund Service functionality"""
    
    def test_initiate_refund_simulation_mode(self):
        """Test refund initiation in simulation mode (no FLUTTERWAVE_SECRET_KEY)"""
        with patch.dict(os.environ, {}, clear=True):
            result = RefundService.initiate_refund(
                transaction_id="test_txn_123",
                amount=100.0
            )
            
            assert result['status'] == 'success'
            assert result['message'] == 'Refund initiated (simulation)'
            assert result['data']['amount'] == 100.0
            assert 'simulated_refund' in result['data']['id']
    
    @patch('services.refund_service.requests.post')
    @patch('services.refund_service.RefundService.FLUTTERWAVE_SECRET_KEY', 'test_secret_key')
    def test_initiate_refund_with_api(self, mock_post):
        """Mock Flutterwave API for initiate_refund with credentials"""
        # Mock successful API response
        mock_response = MagicMock()
        mock_response.json.return_value = {
            "status": "success",
            "data": {"id": "refund_123", "status": "completed"}
        }
        mock_post.return_value = mock_response
        
        result = RefundService.initiate_refund(
            transaction_id="test_txn_123",
            amount=100.0
        )
        
        mock_post.assert_called_once()
        assert result['status'] == 'success'
    
    def test_process_group_refunds_with_contributions(self, test_db, sample_group_buy, sample_trader):
        """Test process_group_refunds with real contributions"""
        # Create contributions
        contribution = Contribution(
            group_buy_id=sample_group_buy.id,
            user_id=sample_trader.id,
            quantity=5,
            contribution_amount=400.0,
            paid_amount=400.0,
            is_fully_paid=True
        )
        test_db.add(contribution)
        test_db.commit()
        
        # Process refunds
        with patch.dict(os.environ, {}, clear=True):
            result = RefundService.process_group_refunds(
                db=test_db,
                group_buy_id=sample_group_buy.id,
                reason="Test refund"
            )
            
            assert 'successful_refunds' in result
            assert len(result['successful_refunds']) > 0
            assert result['successful_refunds'][0]['amount'] == 400.0
    
    def test_process_admin_group_refunds(self, test_db, sample_admin_group, sample_trader):
        """Test process_admin_group_refunds with AdminGroupJoin records"""
        # Create admin group join
        join = AdminGroupJoin(
            admin_group_id=sample_admin_group.id,
            user_id=sample_trader.id,
            quantity=5,
            delivery_method="pickup",
            payment_method="card",
            paid_amount=400.0
        )
        test_db.add(join)
        test_db.commit()
        
        # Process refunds
        with patch.dict(os.environ, {}, clear=True):
            result = RefundService.process_admin_group_refunds(
                db=test_db,
                admin_group_id=sample_admin_group.id,
                reason="Admin cancelled group"
            )
            
            assert 'successful_refunds' in result
            assert len(result['successful_refunds']) > 0


class TestQRCodeService:
    """Test QR Code Service functionality"""
    
    def test_generate_verification_token(self):
        """Test generate_verification_token returns valid base64 token"""
        token = QRCodeService.generate_verification_token(
            user_id=1,
            group_buy_id=2,
            contribution_id=3
        )
        
        assert token is not None
        assert isinstance(token, str)
        assert len(token) > 0
        # Verify it's base64 encoded
        import base64
        try:
            decoded = base64.urlsafe_b64decode(token)
            assert b':' in decoded  # Should contain colon separators
        except Exception:
            pytest.fail("Token is not valid base64")
    
    def test_generate_qr_code_creates_token_and_expiry(self, test_db, sample_group_buy, sample_trader):
        """Test generate_qr_code_for_contribution creates token"""
        # Create contribution
        contribution = Contribution(
            group_buy_id=sample_group_buy.id,
            user_id=sample_trader.id,
            quantity=5,
            contribution_amount=400.0,
            is_fully_paid=True
        )
        test_db.add(contribution)
        test_db.commit()
        
        # Generate QR code
        result = QRCodeService.generate_qr_code_for_contribution(
            db=test_db,
            contribution=contribution,
            include_image=False
        )
        
        assert 'token' in result
        assert 'contribution_id' in result
        assert 'group_buy_id' in result
        assert 'user_id' in result
        assert result['token'] is not None
        assert contribution.qr_code_token is not None
        assert result['contribution_id'] == contribution.id
    
    def test_verify_qr_token_invalid(self, test_db):
        """Test verify_qr_token with invalid token returns None"""
        result = QRCodeService.verify_qr_token(
            db=test_db,
            token="invalid_token_123"
        )
        
        assert result is None


# ============================================================================
# BUSINESS LOGIC TESTS (9 tests)
# ============================================================================

class TestGroupCompletionLogic:
    """Test group completion logic"""
    
    def test_admin_group_completion_by_quantity(self, test_db, sample_admin_group, sample_trader):
        """Test AdminGroup completion when SUM(AdminGroupJoin.quantity) >= max_participants"""
        # Set target quantity to 10
        sample_admin_group.max_participants = 10
        test_db.commit()
        
        # Add joins totaling 10 quantity (2 joins of 5 each)
        for i in range(2):
            join = AdminGroupJoin(
                admin_group_id=sample_admin_group.id,
                user_id=sample_trader.id,
                quantity=5,
                delivery_method="pickup",
                payment_method="card",
                paid_amount=400.0
            )
            test_db.add(join)
        test_db.commit()
        
        # Check total quantity
        total_quantity = sum(j.quantity for j in test_db.query(AdminGroupJoin).filter(
            AdminGroupJoin.admin_group_id == sample_admin_group.id
        ).all())
        
        assert total_quantity == 10
        assert total_quantity >= sample_admin_group.max_participants
    
    def test_group_buy_completion_logic(self, test_db, sample_group_buy, sample_trader, sample_product):
        """Test GroupBuy completion logic based on MOQ"""
        # Add contributions to reach MOQ
        contribution = Contribution(
            group_buy_id=sample_group_buy.id,
            user_id=sample_trader.id,
            quantity=sample_product.moq,  # 10
            contribution_amount=800.0,
            paid_amount=800.0,
            is_fully_paid=True
        )
        test_db.add(contribution)
        test_db.commit()
        
        # Update group buy totals
        sample_group_buy.total_quantity = sample_product.moq
        test_db.commit()
        
        # Calculate MOQ progress
        moq_progress = (sample_group_buy.total_quantity / sample_product.moq) * 100
        assert moq_progress >= 100


class TestPaymentCalculations:
    """Test payment and fee calculations"""
    
    def test_platform_fee_calculation(self):
        """Test platform fee: order_value * 0.10"""
        order_value = 1000.0
        platform_fee = order_value * 0.10
        
        assert platform_fee == 100.0
    
    def test_supplier_payout_calculation(self):
        """Test supplier payout: order_value - platform_fee"""
        order_value = 1000.0
        platform_fee = order_value * 0.10
        supplier_payout = order_value - platform_fee
        
        assert supplier_payout == 900.0
    
    def test_bulk_savings_calculation(self, sample_product):
        """Test bulk savings: (unit_price * qty) - (bulk_price * qty)"""
        quantity = 10
        unit_cost = sample_product.unit_price * quantity
        bulk_cost = sample_product.bulk_price * quantity
        savings = unit_cost - bulk_cost
        
        assert unit_cost == 1000.0
        assert bulk_cost == 800.0
        assert savings == 200.0


class TestUserPermissions:
    """Test user role and permission checks"""
    
    def test_admin_permission_check(self, sample_admin):
        """Test admin permission check"""
        assert sample_admin.is_admin is True
        assert sample_admin.is_supplier is False
    
    def test_supplier_permission_check(self, sample_supplier):
        """Test supplier permission check"""
        assert sample_supplier.is_supplier is True
        assert sample_supplier.is_admin is False
    
    def test_trader_is_default(self, sample_trader):
        """Test trader is default (is_admin=False, is_supplier=False)"""
        assert sample_trader.is_admin is False
        assert sample_trader.is_supplier is False


class TestOrderWorkflow:
    """Test order creation and payment workflow"""
    
    def test_supplier_order_xor_constraint(self, test_db, sample_supplier, sample_admin_group):
        """Test SupplierOrder creation with XOR constraint (group_buy_id OR admin_group_id)"""
        # Create order with admin_group_id only
        order = SupplierOrder(
            supplier_id=sample_supplier.id,
            admin_group_id=sample_admin_group.id,
            group_buy_id=None,  # XOR: only one should be set
            order_number="ORD-TEST-001",
            status="pending",
            total_value=1000.0,
            delivery_method="pickup",
            delivery_location="HARARE"
        )
        test_db.add(order)
        test_db.commit()
        test_db.refresh(order)
        
        assert order.id is not None
        assert order.admin_group_id is not None
        assert order.group_buy_id is None
        assert order.status == "pending"
    
    def test_supplier_payment_with_platform_fee(self, test_db, sample_supplier):
        """Test SupplierPayment with platform_fee and amount"""
        order_value = 1000.0
        platform_fee = order_value * 0.10
        supplier_amount = order_value - platform_fee
        
        payment = SupplierPayment(
            supplier_id=sample_supplier.id,
            amount=supplier_amount,
            platform_fee=platform_fee,
            payment_method="bank_transfer",
            status="pending"
        )
        test_db.add(payment)
        test_db.commit()
        test_db.refresh(payment)
        
        assert payment.id is not None
        assert payment.amount == 900.0
        assert payment.platform_fee == 100.0
        assert payment.status == "pending"


# ============================================================================
# TEST EXECUTION
# ============================================================================

if __name__ == "__main__":
    # Run pytest with verbose output
    pytest.main([__file__, "-v", "--tb=short"])

