from fastapi import APIRouter, Depends, HTTPException, status, UploadFile, File
from sqlalchemy.orm import Session
from sqlalchemy import func, desc, or_
from pydantic import BaseModel
from typing import List, Optional
from datetime import datetime, timedelta
import json
import logging
import os
import cloudinary
import cloudinary.uploader
import cloudinary.api

from db.database import get_db
from models.models import User, SupplierProduct, ProductPricingTier, SupplierOrder, SupplierOrderItem, Product, GroupBuy, SupplierPickupLocation, SupplierInvoice, SupplierPayment, SupplierNotification, AdminGroup, AdminGroupJoin, Transaction
from authentication.auth import verify_token, verify_supplier

# Configure logging
logging.basicConfig(level=logging.INFO)
logger = logging.getLogger(__name__)

# Configure Cloudinary
cloudinary.config(
    cloud_name=os.getenv('CLOUDINARY_CLOUD_NAME'),
    api_key=os.getenv('CLOUDINARY_API_KEY'),
    api_secret=os.getenv('CLOUDINARY_API_SECRET')
)

router = APIRouter()

# Pydantic Models
class SupplierProductCreate(BaseModel):
    product_id: int
    sku: str
    stock_level: int
    min_bulk_quantity: int
    pricing_tiers: List[dict]  # [{"min_quantity": int, "max_quantity": int, "unit_price": float, "description": str}]

class SupplierProductResponse(BaseModel):
    id: int
    product_id: int
    product_name: str
    sku: str
    stock_level: int
    min_bulk_quantity: int
    pricing_tiers: List[dict]
    is_active: bool

class SupplierOrderResponse(BaseModel):
    id: int
    order_number: str
    group_id: Optional[int]
    group_name: str
    trader_count: int
    delivery_location: str
    products: List[dict]
    total_value: float
    total_savings: float
    status: str
    created_at: datetime

class DashboardMetrics(BaseModel):
    pending_orders: int
    active_groups: int
    monthly_revenue: float
    total_savings_generated: float
    top_products: List[dict]

class OrderActionRequest(BaseModel):
    action: str  # "confirm" or "reject"
    reason: Optional[str] = None
    delivery_method: Optional[str] = None
    scheduled_delivery_date: Optional[datetime] = None
    special_instructions: Optional[str] = None


class ShipDeliveryRequest(BaseModel):
    tracking_number: Optional[str] = None
    tracking_url: Optional[str] = None
    notes: Optional[str] = None

class PickupLocationCreate(BaseModel):
    name: str
    address: str
    city: str
    province: str
    phone: str
    operating_hours: str

class PickupLocationResponse(BaseModel):
    id: int
    name: str
    address: str
    city: str
    province: str
    phone: str
    operating_hours: str
    is_active: bool

class InvoiceResponse(BaseModel):
    id: int
    invoice_number: str
    order_id: int
    amount: float
    tax_amount: float
    total_amount: float
    status: str
    due_date: datetime
    paid_at: Optional[datetime]
    pdf_url: Optional[str]

class PaymentResponse(BaseModel):
    id: int
    amount: float
    payment_method: str
    reference_number: Optional[str]
    status: str
    processed_at: Optional[datetime]
    created_at: datetime

class NotificationResponse(BaseModel):
    id: int
    title: str
    message: str
    type: str
    is_read: bool
    created_at: datetime

class ImageUploadResponse(BaseModel):
    image_url: str
    public_id: str

# Enhanced error handling and validation functions
def handle_supplier_error(operation: str, error: Exception, supplier_id: int = None):
    """Centralized error handling for supplier operations"""
    error_msg = str(error)
    logger.error(f"Supplier operation '{operation}' failed for supplier {supplier_id}: {error_msg}")
    
    if isinstance(error, HTTPException):
        raise error
    elif "foreign key" in error_msg.lower():
        raise HTTPException(status_code=400, detail="Invalid reference to related data")
    elif "unique constraint" in error_msg.lower():
        raise HTTPException(status_code=409, detail="Duplicate entry - record already exists")
    elif "not null constraint" in error_msg.lower():
        raise HTTPException(status_code=400, detail="Missing required information")
    else:
        raise HTTPException(status_code=500, detail=f"Failed to {operation}")

def validate_supplier_permissions(user: User, resource_supplier_id: int = None, resource_name: str = "resource"):
    """Enhanced permission validation for supplier operations"""
    if not user.is_supplier:
        logger.warning(f"Non-supplier user {user.id} attempted supplier operation")
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail="Supplier access required"
        )
    
    if resource_supplier_id and resource_supplier_id != user.id:
        logger.warning(f"Supplier {user.id} attempted unauthorized access to {resource_name} owned by supplier {resource_supplier_id}")
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail=f"You don't have permission to access this {resource_name}"
        )
    
    # Check if supplier is verified for sensitive operations
    if not user.is_verified and resource_name in ["payment", "invoice", "order"]:
        logger.warning(f"Unverified supplier {user.id} attempted sensitive operation: {resource_name}")
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail="Account verification required for this operation"
        )
    
    return user

def validate_business_data(data: dict, required_fields: List[str] = None):
    """Validate business-related data inputs"""
    errors = []
    
    if required_fields:
        for field in required_fields:
            if not data.get(field):
                errors.append(f"'{field}' is required")
    
    # Validate email format
    if 'email' in data and data['email']:
        import re
        email_pattern = r'^[a-zA-Z0-9._%+-]+@[a-zA-Z0-9.-]+\.[a-zA-Z]{2,}$'
        if not re.match(email_pattern, data['email']):
            errors.append("Invalid email format")
    
    # Validate phone number format
    if 'phone_number' in data and data['phone_number']:
        phone_clean = re.sub(r'[^\d+]', '', data['phone_number'])
        if len(phone_clean) < 10:
            errors.append("Phone number must be at least 10 digits")
    
    # Validate price values
    for field in ['price', 'original_price', 'unit_price', 'bulk_price']:
        if field in data and data[field] is not None:
            try:
                price = float(data[field])
                if price < 0:
                    errors.append(f"'{field}' must be a positive number")
                if price > 1000000:  # Reasonable upper limit
                    errors.append(f"'{field}' exceeds maximum allowed value")
            except (ValueError, TypeError):
                errors.append(f"'{field}' must be a valid number")
    
    # Validate quantities
    for field in ['max_participants', 'total_stock', 'quantity']:
        if field in data and data[field] is not None:
            try:
                qty = int(data[field])
                if qty < 0:
                    errors.append(f"'{field}' must be a positive integer")
                if qty > 100000:  # Reasonable upper limit
                    errors.append(f"'{field}' exceeds maximum allowed value")
            except (ValueError, TypeError):
                errors.append(f"'{field}' must be a valid integer")
    
    if errors:
        raise HTTPException(status_code=400, detail={"validation_errors": errors})
    
    return True

# Helper function to verify supplier with enhanced validation
def verify_supplier(user: User = Depends(verify_token)):
    return validate_supplier_permissions(user)

# Dashboard endpoints
@router.get("/dashboard/metrics", response_model=DashboardMetrics)
async def get_supplier_dashboard_metrics(
    supplier: User = Depends(verify_supplier),
    db: Session = Depends(get_db)
):
    """Get dashboard metrics for supplier"""
    try:
        # Pending orders
        pending_orders = db.query(SupplierOrder).filter(
            SupplierOrder.supplier_id == supplier.id,
            SupplierOrder.status == "pending"
        ).count()

        # Active groups using supplier's products
        supplier_product_ids = db.query(SupplierProduct.product_id).filter(
            SupplierProduct.supplier_id == supplier.id
        ).subquery()

        active_groups = db.query(GroupBuy).filter(
            GroupBuy.product_id.in_(supplier_product_ids),
            GroupBuy.status == "active"
        ).count()

        # Monthly revenue (last 30 days)
        thirty_days_ago = datetime.utcnow() - timedelta(days=30)
        monthly_revenue = db.query(SupplierOrder).filter(
            SupplierOrder.supplier_id == supplier.id,
            SupplierOrder.status.in_(["confirmed", "shipped", "delivered"]),
            SupplierOrder.created_at >= thirty_days_ago
        ).with_entities(SupplierOrder.total_value).all()

        total_monthly_revenue = sum(order.total_value for order in monthly_revenue)

        # Total savings generated
        total_savings = db.query(SupplierOrder).filter(
            SupplierOrder.supplier_id == supplier.id,
            SupplierOrder.status.in_(["confirmed", "shipped", "delivered"])
        ).with_entities(SupplierOrder.total_savings).all()

        total_savings_generated = sum(order.total_savings for order in total_savings)

        # Top products by revenue
        top_products_query = db.query(
            SupplierOrderItem.supplier_product_id,
            SupplierProduct.product_id,
            Product.name,
            func.sum(SupplierOrderItem.total_amount).label('revenue')
        ).join(
            SupplierOrder, SupplierOrderItem.supplier_order_id == SupplierOrder.id
        ).join(
            SupplierProduct, SupplierOrderItem.supplier_product_id == SupplierProduct.id
        ).join(
            Product, SupplierProduct.product_id == Product.id
        ).filter(
            SupplierOrder.supplier_id == supplier.id,
            SupplierOrder.status.in_(["confirmed", "shipped", "delivered"])
        ).group_by(
            SupplierOrderItem.supplier_product_id,
            SupplierProduct.product_id,
            Product.name
        ).order_by(
            desc('revenue')
        ).limit(5).all()

        top_products = [
            {
                "name": product_name,
                "revenue": revenue
            }
            for _, _, product_name, revenue in top_products_query
        ]

        return DashboardMetrics(
            pending_orders=pending_orders,
            active_groups=active_groups,
            monthly_revenue=round(total_monthly_revenue, 2),
            total_savings_generated=round(total_savings_generated, 2),
            top_products=top_products
        )

    except Exception as e:
        print(f"Error getting dashboard metrics: {e}")
        raise HTTPException(status_code=500, detail="Failed to retrieve dashboard metrics")

# Product management endpoints
@router.get("/products", response_model=List[SupplierProductResponse])
async def get_supplier_products(
    supplier: User = Depends(verify_supplier),
    db: Session = Depends(get_db)
):
    """Get all products managed by the supplier"""
    supplier_products = db.query(SupplierProduct).filter(
        SupplierProduct.supplier_id == supplier.id
    ).all()

    result = []
    for sp in supplier_products:
        pricing_tiers = [
            {
                "min_quantity": tier.min_quantity,
                "max_quantity": tier.max_quantity,
                "unit_price": tier.unit_price,
                "description": tier.description
            }
            for tier in sp.pricing_tiers
        ]

        result.append(SupplierProductResponse(
            id=sp.id,
            product_id=sp.product_id,
            product_name=sp.product.name,
            sku=sp.sku,
            stock_level=sp.stock_level,
            min_bulk_quantity=sp.min_bulk_quantity,
            pricing_tiers=pricing_tiers,
            is_active=sp.is_active
        ))

    return result

@router.post("/products", response_model=SupplierProductResponse)
async def create_supplier_product(
    product_data: SupplierProductCreate,
    supplier: User = Depends(verify_supplier),
    db: Session = Depends(get_db)
):
    """Create a new supplier product with pricing tiers"""
    try:
        # Check if product exists
        product = db.query(Product).filter(Product.id == product_data.product_id).first()
        if not product:
            raise HTTPException(status_code=404, detail="Product not found")

        # Check if supplier already manages this product
        existing = db.query(SupplierProduct).filter(
            SupplierProduct.supplier_id == supplier.id,
            SupplierProduct.product_id == product_data.product_id
        ).first()
        if existing:
            raise HTTPException(status_code=400, detail="Product already managed by supplier")

        # Create supplier product
        supplier_product = SupplierProduct(
            supplier_id=supplier.id,
            product_id=product_data.product_id,
            sku=product_data.sku,
            stock_level=product_data.stock_level,
            min_bulk_quantity=product_data.min_bulk_quantity
        )

        db.add(supplier_product)
        db.flush()  # Get the ID

        # Create pricing tiers
        for tier_data in product_data.pricing_tiers:
            tier = ProductPricingTier(
                supplier_product_id=supplier_product.id,
                min_quantity=tier_data["min_quantity"],
                max_quantity=tier_data.get("max_quantity"),
                unit_price=tier_data["unit_price"],
                description=tier_data.get("description")
            )
            db.add(tier)

        db.commit()
        db.refresh(supplier_product)

        pricing_tiers = [
            {
                "min_quantity": tier.min_quantity,
                "max_quantity": tier.max_quantity,
                "unit_price": tier.unit_price,
                "description": tier.description
            }
            for tier in supplier_product.pricing_tiers
        ]

        return SupplierProductResponse(
            id=supplier_product.id,
            product_id=supplier_product.product_id,
            product_name=supplier_product.product.name,
            sku=supplier_product.sku,
            stock_level=supplier_product.stock_level,
            min_bulk_quantity=supplier_product.min_bulk_quantity,
            pricing_tiers=pricing_tiers,
            is_active=supplier_product.is_active
        )

    except HTTPException:
        raise
    except Exception as e:
        db.rollback()
        print(f"Error creating supplier product: {e}")
        raise HTTPException(status_code=500, detail="Failed to create supplier product")

@router.put("/products/{supplier_product_id}/pricing")
async def update_product_pricing(
    supplier_product_id: int,
    pricing_tiers: List[dict],
    supplier: User = Depends(verify_supplier),
    db: Session = Depends(get_db)
):
    """Update pricing tiers for a supplier product"""
    try:
        # Verify ownership
        supplier_product = db.query(SupplierProduct).filter(
            SupplierProduct.id == supplier_product_id,
            SupplierProduct.supplier_id == supplier.id
        ).first()
        if not supplier_product:
            raise HTTPException(status_code=404, detail="Supplier product not found")

        # Delete existing tiers
        db.query(ProductPricingTier).filter(
            ProductPricingTier.supplier_product_id == supplier_product_id
        ).delete()

        # Create new tiers
        for tier_data in pricing_tiers:
            tier = ProductPricingTier(
                supplier_product_id=supplier_product_id,
                min_quantity=tier_data["min_quantity"],
                max_quantity=tier_data.get("max_quantity"),
                unit_price=tier_data["unit_price"],
                description=tier_data.get("description")
            )
            db.add(tier)

        db.commit()
        return {"message": "Pricing tiers updated successfully"}

    except HTTPException:
        raise
    except Exception as e:
        db.rollback()
        print(f"Error updating pricing: {e}")
        raise HTTPException(status_code=500, detail="Failed to update pricing")

# Order management endpoints
@router.get("/orders", response_model=List[SupplierOrderResponse])
async def get_supplier_orders(
    status_filter: Optional[str] = None,
    supplier: User = Depends(verify_supplier),
    db: Session = Depends(get_db)
):
    """Get orders for the supplier"""
    query = db.query(SupplierOrder).filter(SupplierOrder.supplier_id == supplier.id)

    if status_filter:
        query = query.filter(SupplierOrder.status == status_filter)

    orders = query.order_by(SupplierOrder.created_at.desc()).all()

    result = []
    for order in orders:
        # Get group info
        group_name = "Direct Order"  # Default for orders not linked to groups
        trader_count = 1  # Default for direct orders

        if order.group_buy_id:
            # Query the GroupBuy object
            group_buy = db.query(GroupBuy).filter(GroupBuy.id == order.group_buy_id).first()
            if group_buy:
                group_name = f"Group Buy #{group_buy.id}"
                trader_count = group_buy.total_quantity  # Use total_quantity instead of participants_count
        elif order.admin_group_id:
            # Query the AdminGroup object
            admin_group = db.query(AdminGroup).filter(AdminGroup.id == order.admin_group_id).first()
            if admin_group:
                group_name = admin_group.name
                # Count actual joins for admin groups
                trader_count = db.query(func.count(AdminGroupJoin.id)).filter(
                    AdminGroupJoin.admin_group_id == admin_group.id
                ).scalar() or 0

        # Get products
        products = []
        for item in order.order_items:
            products.append({
                "name": item.supplier_product.product.name,
                "quantity": item.quantity,
                "unit_price": item.unit_price,
                "total_amount": item.total_amount
            })

        result.append(SupplierOrderResponse(
            id=order.id,
            order_number=order.order_number,
            group_id=order.group_buy_id or order.admin_group_id,
            group_name=group_name,
            trader_count=trader_count,
            delivery_location=order.delivery_location or "TBD",
            products=products,
            total_value=order.total_value,
            total_savings=order.total_savings,
            status=order.status,
            created_at=order.created_at
        ))

    return result

@router.post("/orders/{order_id}/action")
async def process_order_action(
    order_id: int,
    action_request: OrderActionRequest,
    supplier: User = Depends(verify_supplier),
    db: Session = Depends(get_db)
):
    """Confirm or reject a supplier order"""
    try:
        order = db.query(SupplierOrder).filter(
            SupplierOrder.id == order_id,
            SupplierOrder.supplier_id == supplier.id
        ).first()
        if not order:
            raise HTTPException(status_code=404, detail="Order not found")

        if order.status != "pending":
            raise HTTPException(status_code=400, detail="Order has already been processed")

        if action_request.action == "confirm":
            order.status = "confirmed"
            order.confirmed_at = datetime.utcnow()
            order.delivery_method = action_request.delivery_method
            order.scheduled_delivery_date = action_request.scheduled_delivery_date
            order.special_instructions = action_request.special_instructions
            message = "Order confirmed successfully"

        elif action_request.action == "reject":
            if not action_request.reason:
                raise HTTPException(status_code=400, detail="Rejection reason required")
            
            order.status = "rejected"
            order.rejection_reason = action_request.reason
            
            # Auto-trigger refunds when order is rejected
            from services.refund_service import RefundService
            from services.email_service import email_service
            
            refund_results = {"refunds_processed": 0, "refunds_failed": 0}
            
            try:
                # Check if this order is linked to a GroupBuy or AdminGroup
                if order.group_buy_id:
                    # Process refunds for GroupBuy
                    refund_results = RefundService.process_group_refunds(
                        db=db,
                        group_buy_id=order.group_buy_id,
                        reason=f"Supplier rejected order: {action_request.reason}"
                    )
                elif order.admin_group_id:
                    # Process refunds for AdminGroup
                    refund_results = RefundService.process_admin_group_refunds(
                        db=db,
                        admin_group_id=order.admin_group_id,
                        reason=f"Supplier rejected order: {action_request.reason}"
                    )
                
                # Send refund confirmation emails to users
                for refund in refund_results.get("successful_refunds", []):
                    try:
                        user = db.query(User).filter(User.id == refund["user_id"]).first()
                        if user and user.email:
                            email_service.send_refund_confirmation(
                                user_email=user.email,
                                user_name=user.full_name or "Valued Customer",
                                refund_amount=refund["amount"],
                                refund_reference=f"REF-{order.order_number}",
                                reason=f"Supplier rejected order: {action_request.reason}"
                            )
                    except Exception as e:
                        print(f"Failed to send refund email to user {refund['user_id']}: {e}")
                
                message = f"Order rejected and {refund_results['refunds_processed']} refund(s) processed automatically"
                
            except Exception as e:
                print(f"Failed to process automatic refunds: {e}")
                message = f"Order rejected but automatic refund failed: {str(e)}"

        else:
            raise HTTPException(status_code=400, detail="Invalid action")

        db.commit()
        return {
            "message": message,
            "refund_summary": refund_results if action_request.action == "reject" else None
        }

    except HTTPException:
        raise
    except Exception as e:
        db.rollback()
        print(f"Error processing order action: {e}")
        raise HTTPException(status_code=500, detail="Failed to process order action")


@router.post("/orders/{order_id}/ship")
async def mark_order_shipped(
    order_id: int,
    ship_data: ShipDeliveryRequest,
    supplier: User = Depends(verify_supplier),
    db: Session = Depends(get_db)
):
    """Mark a confirmed order as shipped"""
    try:
        order = db.query(SupplierOrder).filter(
            SupplierOrder.id == order_id,
            SupplierOrder.supplier_id == supplier.id
        ).first()
        if not order:
            raise HTTPException(status_code=404, detail="Order not found")

        if order.status != "confirmed":
            raise HTTPException(status_code=400, detail="Only confirmed orders can be marked as shipped")

        order.status = "shipped"
        order.shipped_at = datetime.utcnow()
        if ship_data.tracking_number:
            order.tracking_number = ship_data.tracking_number
        if ship_data.tracking_url:
            order.tracking_url = ship_data.tracking_url
        if ship_data.notes:
            order.shipment_notes = ship_data.notes

        db.commit()
        return {"message": "Order marked as shipped"}
    except HTTPException:
        raise
    except Exception as e:
        db.rollback()
        print(f"Error marking order shipped: {e}")
        raise HTTPException(status_code=500, detail="Failed to mark order as shipped")


@router.post("/orders/{order_id}/deliver")
async def mark_order_delivered(
    order_id: int,
    deliver_data: ShipDeliveryRequest,
    supplier: User = Depends(verify_supplier),
    db: Session = Depends(get_db)
):
    """Mark a shipped order as delivered"""
    try:
        order = db.query(SupplierOrder).filter(
            SupplierOrder.id == order_id,
            SupplierOrder.supplier_id == supplier.id
        ).first()
        if not order:
            raise HTTPException(status_code=404, detail="Order not found")

        if order.status != "shipped":
            raise HTTPException(status_code=400, detail="Only shipped orders can be marked as delivered")

        order.status = "delivered"
        order.delivered_at = datetime.utcnow()
        if deliver_data.notes:
            order.delivery_notes = deliver_data.notes

        db.commit()
        return {"message": "Order marked as delivered"}
    except HTTPException:
        raise
    except Exception as e:
        db.rollback()
        print(f"Error marking order delivered: {e}")
        raise HTTPException(status_code=500, detail="Failed to mark order as delivered")

# Pickup Location Management
@router.get("/pickup-locations", response_model=List[PickupLocationResponse])
async def get_supplier_pickup_locations(
    supplier: User = Depends(verify_supplier),
    db: Session = Depends(get_db)
):
    """Get all pickup locations for the supplier"""
    locations = db.query(SupplierPickupLocation).filter(
        SupplierPickupLocation.supplier_id == supplier.id
    ).all()
    
    return [
        PickupLocationResponse(
            id=loc.id,
            name=loc.name,
            address=loc.address,
            city=loc.city,
            province=loc.province,
            phone=loc.phone,
            operating_hours=loc.operating_hours,
            is_active=loc.is_active
        )
        for loc in locations
    ]

@router.post("/pickup-locations", response_model=PickupLocationResponse)
async def create_pickup_location(
    location_data: PickupLocationCreate,
    supplier: User = Depends(verify_supplier),
    db: Session = Depends(get_db)
):
    """Create a new pickup location"""
    try:
        location = SupplierPickupLocation(
            supplier_id=supplier.id,
            name=location_data.name,
            address=location_data.address,
            city=location_data.city,
            province=location_data.province,
            phone=location_data.phone,
            operating_hours=location_data.operating_hours
        )
        
        db.add(location)
        db.commit()
        db.refresh(location)
        
        return PickupLocationResponse(
            id=location.id,
            name=location.name,
            address=location.address,
            city=location.city,
            province=location.province,
            phone=location.phone,
            operating_hours=location.operating_hours,
            is_active=location.is_active
        )
    except Exception as e:
        db.rollback()
        print(f"Error creating pickup location: {e}")
        raise HTTPException(status_code=500, detail="Failed to create pickup location")

@router.put("/pickup-locations/{location_id}")
async def update_pickup_location(
    location_id: int,
    location_data: PickupLocationCreate,
    supplier: User = Depends(verify_supplier),
    db: Session = Depends(get_db)
):
    """Update a pickup location"""
    try:
        location = db.query(SupplierPickupLocation).filter(
            SupplierPickupLocation.id == location_id,
            SupplierPickupLocation.supplier_id == supplier.id
        ).first()
        
        if not location:
            raise HTTPException(status_code=404, detail="Pickup location not found")
        
        location.name = location_data.name
        location.address = location_data.address
        location.city = location_data.city
        location.province = location_data.province
        location.phone = location_data.phone
        location.operating_hours = location_data.operating_hours
        
        db.commit()
        return {"message": "Pickup location updated successfully"}
    except HTTPException:
        raise
    except Exception as e:
        db.rollback()
        print(f"Error updating pickup location: {e}")
        raise HTTPException(status_code=500, detail="Failed to update pickup location")

@router.delete("/pickup-locations/{location_id}")
async def delete_pickup_location(
    location_id: int,
    supplier: User = Depends(verify_supplier),
    db: Session = Depends(get_db)
):
    """Delete a pickup location"""
    try:
        location = db.query(SupplierPickupLocation).filter(
            SupplierPickupLocation.id == location_id,
            SupplierPickupLocation.supplier_id == supplier.id
        ).first()
        
        if not location:
            raise HTTPException(status_code=404, detail="Pickup location not found")
        
        db.delete(location)
        db.commit()
        return {"message": "Pickup location deleted successfully"}
    except HTTPException:
        raise
    except Exception as e:
        db.rollback()
        print(f"Error deleting pickup location: {e}")
        raise HTTPException(status_code=500, detail="Failed to delete pickup location")

# Invoice Management
@router.get("/invoices", response_model=List[InvoiceResponse])
async def get_supplier_invoices(
    status: Optional[str] = None,
    supplier: User = Depends(verify_supplier),
    db: Session = Depends(get_db)
):
    """Get supplier invoices"""
    query = db.query(SupplierInvoice).filter(SupplierInvoice.supplier_id == supplier.id)
    
    if status:
        query = query.filter(SupplierInvoice.status == status)
    
    invoices = query.order_by(SupplierInvoice.created_at.desc()).all()
    
    return [
        InvoiceResponse(
            id=inv.id,
            invoice_number=inv.invoice_number,
            order_id=inv.order_id,
            amount=inv.amount,
            tax_amount=inv.tax_amount,
            total_amount=inv.total_amount,
            status=inv.status,
            due_date=inv.due_date,
            paid_at=inv.paid_at,
            pdf_url=inv.pdf_url
        )
        for inv in invoices
    ]

@router.post("/orders/{order_id}/invoice", response_model=InvoiceResponse)
async def generate_invoice(
    order_id: int,
    supplier: User = Depends(verify_supplier),
    db: Session = Depends(get_db)
):
    """Generate invoice for a confirmed order"""
    try:
        order = db.query(SupplierOrder).filter(
            SupplierOrder.id == order_id,
            SupplierOrder.supplier_id == supplier.id,
            SupplierOrder.status == "confirmed"
        ).first()
        
        if not order:
            raise HTTPException(status_code=404, detail="Order not found or not eligible for invoicing")
        
        # Check if invoice already exists
        existing_invoice = db.query(SupplierInvoice).filter(
            SupplierInvoice.order_id == order_id
        ).first()
        
        if existing_invoice:
            raise HTTPException(status_code=400, detail="Invoice already exists for this order")
        
        # Calculate amounts
        subtotal = order.total_value
        tax_rate = 0.15  # 15% tax
        tax_amount = subtotal * tax_rate
        total_amount = subtotal + tax_amount
        
        # Generate invoice number
        invoice_number = f"INV-{supplier.id}-{order.id}-{int(datetime.utcnow().timestamp())}"
        
        # Set due date (30 days from now)
        due_date = datetime.utcnow() + timedelta(days=30)
        
        invoice = SupplierInvoice(
            supplier_id=supplier.id,
            order_id=order_id,
            invoice_number=invoice_number,
            amount=subtotal,
            tax_amount=tax_amount,
            total_amount=total_amount,
            due_date=due_date
        )
        
        db.add(invoice)
        db.commit()
        db.refresh(invoice)
        
        return InvoiceResponse(
            id=invoice.id,
            invoice_number=invoice.invoice_number,
            order_id=invoice.order_id,
            amount=invoice.amount,
            tax_amount=invoice.tax_amount,
            total_amount=invoice.total_amount,
            status=invoice.status,
            due_date=invoice.due_date,
            paid_at=invoice.paid_at,
            pdf_url=invoice.pdf_url
        )
    except HTTPException:
        raise
    except Exception as e:
        db.rollback()
        print(f"Error generating invoice: {e}")
        raise HTTPException(status_code=500, detail="Failed to generate invoice")

# Payment Management
@router.get("/payments", response_model=List[PaymentResponse])
async def get_supplier_payments(
    supplier: User = Depends(verify_supplier),
    db: Session = Depends(get_db)
):
    """Get supplier payment history"""
    payments = db.query(SupplierPayment).filter(
        SupplierPayment.supplier_id == supplier.id
    ).order_by(SupplierPayment.created_at.desc()).all()
    
    return [
        PaymentResponse(
            id=pay.id,
            amount=pay.amount,
            payment_method=pay.payment_method,
            reference_number=pay.reference_number,
            status=pay.status,
            processed_at=pay.processed_at,
            created_at=pay.created_at
        )
        for pay in payments
    ]

@router.get("/payments/dashboard")
async def get_payment_dashboard(
    supplier: User = Depends(verify_supplier),
    db: Session = Depends(get_db)
):
    """Get payment dashboard data"""
    try:
        # Get total earnings
        total_earnings = db.query(SupplierPayment).filter(
            SupplierPayment.supplier_id == supplier.id,
            SupplierPayment.status == "completed"
        ).with_entities(SupplierPayment.amount).all()
        
        total_earnings_sum = sum(pay.amount for pay in total_earnings)
        
        # Get pending payments
        pending_payments = db.query(SupplierPayment).filter(
            SupplierPayment.supplier_id == supplier.id,
            SupplierPayment.status == "pending"
        ).with_entities(SupplierPayment.amount).all()
        
        pending_amount = sum(pay.amount for pay in pending_payments)
        
        # Get monthly breakdown (last 6 months)
        six_months_ago = datetime.utcnow() - timedelta(days=180)
        monthly_payments_query = db.query(SupplierPayment).filter(
            SupplierPayment.supplier_id == supplier.id,
            SupplierPayment.status == "completed",
            SupplierPayment.processed_at >= six_months_ago
        ).all()
        
        # Group by month in Python
        monthly_data = {}
        for payment in monthly_payments_query:
            if payment.processed_at:
                month_key = payment.processed_at.strftime('%Y-%m')
                if month_key not in monthly_data:
                    monthly_data[month_key] = 0
                monthly_data[month_key] += payment.amount
        
        monthly_data = [
            {"month": month, "amount": amount}
            for month, amount in sorted(monthly_data.items())
        ]
        
        # Get next payout date (simplified - every 15th and last day of month)
        today = datetime.utcnow().date()
        if today.day < 15:
            next_payout = datetime(today.year, today.month, 15)
        else:
            # Last day of month
            if today.month == 12:
                next_payout = datetime(today.year + 1, 1, 31)
            else:
                next_payout = datetime(today.year, today.month + 1, 1) - timedelta(days=1)
        
        return {
            "total_earnings": round(total_earnings_sum, 2),
            "pending_payments": round(pending_amount, 2),
            "monthly_breakdown": monthly_data,
            "next_payout_date": next_payout.isoformat(),
            "processing_fee_rate": 0.016  # 1.6%
        }
    except Exception as e:
        print(f"Error getting payment dashboard: {e}")
        raise HTTPException(status_code=500, detail="Failed to retrieve payment dashboard")


# Group Buy Management
@router.get("/groups")
async def get_supplier_groups(
    status_filter: Optional[str] = None,
    supplier: User = Depends(verify_supplier),
    db: Session = Depends(get_db)
):
    """
    Get all group buys for the supplier
    Status filter: active, completed, cancelled
    """
    try:
        # Get AdminGroup instances where supplier is the creator
        # Note: GroupBuy is for community groups created by traders, not suppliers
        groups = []
        
        admin_groups = db.query(AdminGroup).filter(
            AdminGroup.supplier_id == supplier.id
        ).all()
        
        for ag in admin_groups:
            # AdminGroup uses is_active field, not status
            # Skip filtering by status for now or check is_active
            if status_filter == "active" and not ag.is_active:
                continue
            elif status_filter == "cancelled" and ag.is_active:
                continue
                
            # Get product details
            product = db.query(Product).filter(Product.id == ag.product_id).first()
            
            # Count participants
            participants_count = db.query(AdminGroupJoin).filter(
                AdminGroupJoin.admin_group_id == ag.id
            ).count()
            
            # Calculate dynamic status
            now = datetime.utcnow()
            if ag.end_date and ag.end_date < now:
                status = "completed" if participants_count >= ag.max_participants else "expired"
            elif participants_count >= ag.max_participants:
                status = "ready_for_payment"
            else:
                status = "active" if ag.is_active else "cancelled"
            
            groups.append({
                "id": ag.id,
                "name": ag.name,
                "category": ag.category or (product.category if product else "Unknown"),
                "price": float(ag.price) if ag.price else 0.0,
                "original_price": float(ag.original_price) if ag.original_price else 0.0,
                "participants": participants_count,
                "max_participants": ag.max_participants or 50,
                "status": status,
                "end_date": ag.end_date.isoformat() if ag.end_date else None,
                "created_at": ag.created.isoformat() if ag.created else None
            })
        
        # Sort by created_at (newest first)
        groups.sort(key=lambda x: x['created_at'] if x['created_at'] else '', reverse=True)
        
        return groups
        
    except Exception as e:
        logger.error(f"Error getting supplier groups: {e}", exc_info=True)
        raise HTTPException(status_code=500, detail="Failed to retrieve groups")

# Notification Management
@router.get("/notifications", response_model=List[NotificationResponse])
async def get_supplier_notifications(
    unread_only: bool = False,
    supplier: User = Depends(verify_supplier),
    db: Session = Depends(get_db)
):
    """Get supplier notifications"""
    query = db.query(SupplierNotification).filter(
        SupplierNotification.supplier_id == supplier.id
    )
    
    if unread_only:
        query = query.filter(~SupplierNotification.is_read)
    
    notifications = query.order_by(SupplierNotification.created_at.desc()).all()
    
    return [
        NotificationResponse(
            id=notif.id,
            title=notif.title,
            message=notif.message,
            type=notif.type,
            is_read=notif.is_read,
            created_at=notif.created_at
        )
        for notif in notifications
    ]

@router.put("/notifications/{notification_id}/read")
async def mark_notification_read(
    notification_id: int,
    supplier: User = Depends(verify_supplier),
    db: Session = Depends(get_db)
):
    """Mark a notification as read"""
    try:
        notification = db.query(SupplierNotification).filter(
            SupplierNotification.id == notification_id,
            SupplierNotification.supplier_id == supplier.id
        ).first()
        
        if not notification:
            raise HTTPException(status_code=404, detail="Notification not found")
        
        notification.is_read = True
        db.commit()
        return {"message": "Notification marked as read"}
    except HTTPException:
        raise
    except Exception as e:
        db.rollback()
        print(f"Error marking notification read: {e}")
        raise HTTPException(status_code=500, detail="Failed to mark notification as read")

@router.put("/notifications/mark-all-read")
async def mark_all_notifications_read(
    supplier: User = Depends(verify_supplier),
    db: Session = Depends(get_db)
):
    """Mark all notifications as read"""
    try:
        db.query(SupplierNotification).filter(
            SupplierNotification.supplier_id == supplier.id,
            ~SupplierNotification.is_read
        ).update({"is_read": True})
        
        db.commit()
        return {"message": "All notifications marked as read"}
    except Exception as e:
        db.rollback()
        print(f"Error marking all notifications read: {e}")
        raise HTTPException(status_code=500, detail="Failed to mark notifications as read")

# Bulk CSV Upload
@router.post("/products/bulk-upload")
async def bulk_upload_products(
    file: UploadFile = File(...),
    supplier: User = Depends(verify_supplier),
    db: Session = Depends(get_db)
):
    """Bulk upload products via CSV"""
    try:
        if not file.filename.endswith('.csv'):
            raise HTTPException(status_code=400, detail="File must be a CSV")
        
        content = await file.read()
        csv_content = content.decode('utf-8')
        
        # Parse CSV
        lines = csv_content.strip().split('\n')
        if len(lines) < 2:
            raise HTTPException(status_code=400, detail="CSV must have header and at least one data row")
        
        # Parse header
        header = lines[0].split(',')
        expected_headers = ['product_id', 'sku', 'stock_level', 'min_bulk_quantity', 'pricing_tiers']
        
        if header != expected_headers:
            raise HTTPException(status_code=400, detail=f"Invalid CSV headers. Expected: {', '.join(expected_headers)}")
        
        success_count = 0
        error_count = 0
        errors = []
        
        for i, line in enumerate(lines[1:], 2):  # Start from line 2 (after header)
            try:
                fields = line.split(',')
                if len(fields) != len(expected_headers):
                    errors.append(f"Line {i}: Incorrect number of fields")
                    error_count += 1
                    continue
                
                product_id = int(fields[0])
                sku = fields[1]
                stock_level = int(fields[2])
                min_bulk_quantity = int(fields[3])
                
                # Parse pricing tiers (JSON format)
                pricing_tiers = json.loads(fields[4])
                
                # Validate product exists
                product = db.query(Product).filter(Product.id == product_id).first()
                if not product:
                    errors.append(f"Line {i}: Product ID {product_id} not found")
                    error_count += 1
                    continue
                
                # Check if supplier already manages this product
                existing = db.query(SupplierProduct).filter(
                    SupplierProduct.supplier_id == supplier.id,
                    SupplierProduct.product_id == product_id
                ).first()
                
                if existing:
                    # Update existing
                    existing.sku = sku
                    existing.stock_level = stock_level
                    existing.min_bulk_quantity = min_bulk_quantity
                    
                    # Delete existing pricing tiers
                    db.query(ProductPricingTier).filter(
                        ProductPricingTier.supplier_product_id == existing.id
                    ).delete()
                else:
                    # Create new
                    existing = SupplierProduct(
                        supplier_id=supplier.id,
                        product_id=product_id,
                        sku=sku,
                        stock_level=stock_level,
                        min_bulk_quantity=min_bulk_quantity
                    )
                    db.add(existing)
                    db.flush()
                
                # Add pricing tiers
                for tier_data in pricing_tiers:
                    tier = ProductPricingTier(
                        supplier_product_id=existing.id,
                        min_quantity=tier_data["min_quantity"],
                        max_quantity=tier_data.get("max_quantity"),
                        unit_price=tier_data["unit_price"],
                        description=tier_data.get("description")
                    )
                    db.add(tier)
                
                success_count += 1
                
            except Exception as e:
                errors.append(f"Line {i}: {str(e)}")
                error_count += 1
        
        db.commit()
        
        return {
            "message": f"Bulk upload completed. {success_count} products updated/created, {error_count} errors",
            "success_count": success_count,
            "error_count": error_count,
            "errors": errors[:10]  # Limit to first 10 errors
        }
        
    except HTTPException:
        raise
    except Exception as e:
        db.rollback()
        print(f"Error in bulk upload: {e}")
        raise HTTPException(status_code=500, detail="Failed to process bulk upload")

@router.post("/upload-image", response_model=ImageUploadResponse)
async def upload_supplier_image(
    file: UploadFile = File(...),
    supplier: User = Depends(verify_supplier)
):
    """Upload an image to Cloudinary and return the URL for suppliers"""
    try:
        # Validate file type
        if not file.content_type.startswith('image/'):
            raise HTTPException(status_code=400, detail="File must be an image")

        # Validate file size (5MB limit)
        file_content = await file.read()
        if len(file_content) > 5 * 1024 * 1024:  # 5MB
            raise HTTPException(status_code=400, detail="File size must be less than 5MB")

        # Upload to Cloudinary
        result = cloudinary.uploader.upload(
            file_content,
            folder="supplier_products",
            resource_type="image",
            quality="auto",
            format="webp"
        )

        return ImageUploadResponse(
            image_url=result['secure_url'],
            public_id=result['public_id']
        )

    except cloudinary.exceptions.Error as e:
        print(f"Cloudinary error: {e}")
        raise HTTPException(status_code=500, detail="Failed to upload image")
    except Exception as e:
        print(f"Error uploading image: {e}")
        raise HTTPException(status_code=500, detail="Failed to upload image")

# Group Moderation Endpoints (Similar to Admin)
@router.get("/groups/active", response_model=List[dict])
async def get_supplier_active_groups_for_moderation(
    supplier: User = Depends(verify_supplier),
    db: Session = Depends(get_db)
):
    """Get active groups created by supplier for moderation"""
    try:
        result = []

        # Get groups created by this supplier (based on admin_name)
        supplier_name = supplier.company_name or supplier.full_name or "Supplier"
        supplier_created_groups = db.query(AdminGroup).filter(
            AdminGroup.is_active,
            AdminGroup.admin_name == supplier_name
        ).all()

        for group in supplier_created_groups:
            # Get participant count from AdminGroupJoin
            participant_count = db.query(func.count(AdminGroupJoin.id)).filter(
                AdminGroupJoin.admin_group_id == group.id
            ).scalar() or 0

            # Calculate total amount
            total_amount = participant_count * group.price

            result.append({
                "id": group.id,
                "name": group.name,
                "creator": group.admin_name or "Admin",
                "category": group.category,
                "members": participant_count,
                "targetMembers": group.max_participants or 0,
                "totalAmount": f"${total_amount:.2f}",
                "dueDate": group.end_date.strftime("%Y-%m-%d") if group.end_date else "No deadline",
                "description": group.description,
                "status": "active",
                "product": {
                    "name": group.product_name or group.name,
                    "description": group.product_description or group.long_description or group.description,
                    "regularPrice": f"${group.original_price:.2f}" if group.original_price else f"${group.price:.2f}",
                    "bulkPrice": f"${group.price:.2f}",
                    "image": group.image or "https://via.placeholder.com/300x200?text=Product",
                    "totalStock": group.total_stock or "N/A",
                    "specifications": group.specifications or "Supplier managed group buy",
                    "manufacturer": group.manufacturer or "Various",
                    "warranty": "As per product"
                }
            })

        return result

    except Exception as e:
        print(f"Error getting active groups for supplier {supplier.id}: {e}")
        raise HTTPException(status_code=500, detail="Failed to fetch active groups")

@router.get("/groups/pending-orders", response_model=List[dict])
async def get_supplier_pending_group_orders(
    supplier: User = Depends(verify_supplier),
    db: Session = Depends(get_db)
):
    """Get pending group orders created by supplier"""
    try:
        result = []
        supplier_name = supplier.company_name or supplier.full_name or "Supplier"

        # Get supplier-created groups that are pending (not yet ready for payment)
        supplier_pending_groups = db.query(AdminGroup).filter(
            AdminGroup.is_active,
            AdminGroup.admin_name == supplier_name,
            or_(
                AdminGroup.max_participants.is_(None),
                AdminGroup.participants < AdminGroup.max_participants
            )
        ).all()

        for group in supplier_pending_groups:
            # Get participant count from AdminGroupJoin
            participant_count = db.query(func.count(AdminGroupJoin.id)).filter(
                AdminGroupJoin.admin_group_id == group.id
            ).scalar() or 0

            # Calculate total amount
            total_amount = participant_count * group.price

            result.append({
                "id": group.id,
                "name": group.name,
                "creator": group.admin_name or "Admin",
                "category": group.category,
                "members": participant_count,
                "targetMembers": group.max_participants or 0,
                "totalAmount": f"${total_amount:.2f}",
                "dueDate": group.end_date.strftime("%Y-%m-%d") if group.end_date else "No deadline",
                "description": group.description,
                "status": "pending",
                "product": {
                    "name": group.product_name or group.name,
                    "description": group.product_description or group.long_description or group.description,
                    "regularPrice": f"${group.original_price:.2f}" if group.original_price else f"${group.price:.2f}",
                    "bulkPrice": f"${group.price:.2f}",
                    "image": group.image or "https://via.placeholder.com/300x200?text=Product",
                    "totalStock": group.total_stock or "N/A",
                    "specifications": group.specifications or "Supplier managed group buy",
                    "manufacturer": group.manufacturer or "Various",
                    "warranty": "As per product"
                }
            })

        return result

    except Exception as e:
        print(f"Error getting pending group orders for supplier {supplier.id}: {e}")
        raise HTTPException(status_code=500, detail="Failed to fetch pending group orders")

@router.get("/groups/ready-for-payment", response_model=List[dict])
async def get_supplier_ready_for_payment_groups(
    supplier: User = Depends(verify_supplier),
    db: Session = Depends(get_db)
):
    """Get groups ready for payment processing created by supplier"""
    try:
        result = []
        supplier_name = supplier.company_name or supplier.full_name or "Supplier"

        # Get supplier-created groups that are ready for payment
        supplier_ready_groups = db.query(AdminGroup).filter(
            AdminGroup.is_active,
            AdminGroup.admin_name == supplier_name,
            AdminGroup.max_participants.isnot(None),
            AdminGroup.participants >= AdminGroup.max_participants
        ).all()

        for group in supplier_ready_groups:
            # Get participant count from AdminGroupJoin
            participant_count = db.query(func.count(AdminGroupJoin.id)).filter(
                AdminGroupJoin.admin_group_id == group.id
            ).scalar() or 0

            # Calculate total amount
            total_amount = participant_count * group.price

            result.append({
                "id": group.id,
                "name": group.name,
                "creator": group.admin_name or "Admin",
                "category": group.category,
                "members": participant_count,
                "targetMembers": group.max_participants or 0,
                "totalAmount": f"${total_amount:.2f}",
                "dueDate": group.end_date.strftime("%Y-%m-%d") if group.end_date else "No deadline",
                "description": group.description,
                "status": "ready_for_payment",
                "product": {
                    "name": group.product_name or group.name,
                    "description": group.product_description or group.long_description or group.description,
                    "regularPrice": f"${group.original_price:.2f}" if group.original_price else f"${group.price:.2f}",
                    "bulkPrice": f"${group.price:.2f}",
                    "image": group.image or "https://via.placeholder.com/300x200?text=Product",
                    "totalStock": group.total_stock or "N/A",
                    "specifications": group.specifications or "Supplier managed group buy",
                    "manufacturer": group.manufacturer or "Various",
                    "warranty": "As per product"
                }
            })

        return result

    except Exception as e:
        print(f"Error getting ready for payment groups for supplier {supplier.id}: {e}")
        raise HTTPException(status_code=500, detail="Failed to fetch ready for payment groups")

@router.get("/groups/moderation-stats")
async def get_supplier_group_moderation_stats(
    supplier: User = Depends(verify_supplier),
    db: Session = Depends(get_db)
):
    """Get group moderation statistics for supplier"""
    try:
        supplier_name = supplier.company_name or supplier.full_name or "Supplier"

        # Count groups created by this supplier
        supplier_created_groups_count = db.query(func.count(AdminGroup.id)).filter(
            AdminGroup.is_active,
            AdminGroup.admin_name == supplier_name
        ).scalar() or 0

        # Calculate total members for supplier-created groups
        supplier_created_members = db.query(func.sum(AdminGroup.participants)).filter(
            AdminGroup.is_active,
            AdminGroup.admin_name == supplier_name
        ).scalar() or 0

        # Count pending groups created by supplier
        supplier_pending_groups_count = db.query(func.count(AdminGroup.id)).filter(
            AdminGroup.is_active,
            AdminGroup.admin_name == supplier_name,
            or_(
                AdminGroup.max_participants.is_(None),
                AdminGroup.participants < AdminGroup.max_participants
            )
        ).scalar() or 0

        # Ready for payment count (supplier-created groups that have reached target)
        ready_for_payment_count = db.query(func.count(AdminGroup.id)).filter(
            AdminGroup.is_active,
            AdminGroup.admin_name == supplier_name,
            AdminGroup.max_participants.isnot(None),
            AdminGroup.participants >= AdminGroup.max_participants
        ).scalar() or 0

        # Required action count (supplier-created groups that have expired)
        required_action_count = db.query(func.count(AdminGroup.id)).filter(
            AdminGroup.is_active,
            AdminGroup.admin_name == supplier_name,
            AdminGroup.end_date < datetime.utcnow()
        ).scalar() or 0

        return {
            "active_groups": supplier_created_groups_count,
            "total_members": supplier_created_members or 0,
            "ready_for_payment": ready_for_payment_count,
            "required_action": required_action_count,
            "pending_orders": supplier_pending_groups_count
        }

    except Exception as e:
        print(f"Error getting moderation stats for supplier {supplier.id}: {e}")
        raise HTTPException(status_code=500, detail="Failed to fetch moderation stats")

@router.get("/groups/{group_id}")
async def get_supplier_group_details(
    group_id: int,
    supplier: User = Depends(verify_supplier),
    db: Session = Depends(get_db)
):
    """Get detailed information about a specific group created by supplier"""
    try:
        # First check if it's an AdminGroup
        group = db.query(AdminGroup).filter(AdminGroup.id == group_id).first()
        
        if group:
            # Verify supplier created this group
            supplier_name = supplier.company_name or supplier.full_name or "Supplier"
            if group.admin_name != supplier_name:
                raise HTTPException(status_code=403, detail="You can only access groups you created")

            # Get participant count from AdminGroupJoin
            participant_count = db.query(func.count(AdminGroupJoin.id)).filter(
                AdminGroupJoin.admin_group_id == group.id
            ).scalar() or 0

            return {
                "id": group.id,
                "name": group.name,
                "description": group.description,
                "long_description": group.long_description,
                "category": group.category,
                "price": group.price,
                "original_price": group.original_price,
                "image": group.image,
                "max_participants": group.max_participants,
                "participants": participant_count,
                "end_date": group.end_date.isoformat() if group.end_date else None,
                "admin_name": group.admin_name,
                "shipping_info": group.shipping_info,
                "estimated_delivery": group.estimated_delivery,
                "features": group.features or [],
                "requirements": group.requirements or [],
                "is_active": group.is_active,
                "created": group.created.isoformat() if group.created else None,
                "group_type": "admin_group"
            }
        
        raise HTTPException(status_code=404, detail="Group not found")

    except HTTPException:
        raise
    except Exception as e:
        print(f"Error getting group {group_id} details for supplier {supplier.id}: {e}")
        raise HTTPException(status_code=500, detail="Failed to get group details")

@router.post("/groups/{group_id}/process-payment")
async def process_supplier_group_payment(
    group_id: int,
    supplier: User = Depends(verify_supplier),
    db: Session = Depends(get_db)
):
    """Process payment for a completed group created by supplier"""
    try:
        # First check if it's an AdminGroup
        group = db.query(AdminGroup).filter(AdminGroup.id == group_id).first()
        
        if group:
            # Verify supplier created this group
            supplier_name = supplier.company_name or supplier.full_name or "Supplier"
            if group.admin_name != supplier_name:
                raise HTTPException(status_code=403, detail="You can only process payments for groups you created")

            # Check if group is ready for payment
            participant_count = db.query(func.count(AdminGroupJoin.id)).filter(
                AdminGroupJoin.admin_group_id == group.id
            ).scalar() or 0
            
            if participant_count < (group.max_participants or 0):
                raise HTTPException(status_code=400, detail="Group hasn't reached target participants yet")

            # Calculate total amount
            total_amount = participant_count * group.price
            
            # Create supplier payment record
            payment = SupplierPayment(
                supplier_id=supplier.id,
                amount=total_amount,
                payment_method="bank_transfer",
                reference_number=f"GROUP-{group.id}-{supplier.id}",
                status="pending"
            )
            
            db.add(payment)
            db.commit()
            
            return {
                "message": "Payment processed successfully",
                "payment_id": payment.id,
                "amount": total_amount,
                "status": "pending",
                "reference": payment.reference_number
            }
        
        raise HTTPException(status_code=404, detail="Group not found")

    except HTTPException:
        raise
    except Exception as e:
        db.rollback()
        print(f"Error processing payment for group {group_id}: {e}")
        raise HTTPException(status_code=500, detail="Failed to process payment")

class UpdateSupplierGroupRequest(BaseModel):
    name: Optional[str] = None
    description: Optional[str] = None
    long_description: Optional[str] = None
    category: Optional[str] = None
    price: Optional[float] = None
    original_price: Optional[float] = None
    image: Optional[str] = None
    max_participants: Optional[int] = None
    end_date: Optional[str] = None
    shipping_info: Optional[str] = None
    estimated_delivery: Optional[str] = None
    product_name: Optional[str] = None
    product_description: Optional[str] = None
    total_stock: Optional[int] = None
    specifications: Optional[str] = None
    manufacturer: Optional[str] = None

@router.put("/groups/{group_id}")
async def update_supplier_group(
    group_id: int,
    group_data: UpdateSupplierGroupRequest,
    supplier: User = Depends(verify_supplier),
    db: Session = Depends(get_db)
):
    """Update a supplier-managed group with comprehensive field support"""
    try:
        # Find the AdminGroup
        group = db.query(AdminGroup).filter(AdminGroup.id == group_id).first()
        if not group:
            raise HTTPException(
                status_code=status.HTTP_404_NOT_FOUND,
                detail="Group not found"
            )

        # Verify supplier owns this group (created by supplier)
        supplier_name = supplier.company_name or supplier.full_name or "Supplier"
        if group.admin_name != supplier_name:
            raise HTTPException(
                status_code=status.HTTP_403_FORBIDDEN,
                detail="You don't have permission to update this group"
            )

        # Update fields if provided
        if group_data.name is not None:
            group.name = group_data.name
        if group_data.description is not None:
            group.description = group_data.description
        if group_data.long_description is not None:
            group.long_description = group_data.long_description
        if group_data.category is not None:
            group.category = group_data.category
        if group_data.price is not None:
            group.price = group_data.price
        if group_data.original_price is not None:
            group.original_price = group_data.original_price
        if group_data.image is not None:
            group.image = group_data.image
        if group_data.max_participants is not None:
            group.max_participants = group_data.max_participants
        if group_data.end_date is not None:
            try:
                group.end_date = datetime.fromisoformat(group_data.end_date.replace('Z', '+00:00'))
            except ValueError:
                raise HTTPException(
                    status_code=status.HTTP_400_BAD_REQUEST,
                    detail="Invalid date format. Use ISO format (YYYY-MM-DDTHH:MM:SS)"
                )
        if group_data.shipping_info is not None:
            group.shipping_info = group_data.shipping_info
        if group_data.estimated_delivery is not None:
            group.estimated_delivery = group_data.estimated_delivery
        if group_data.product_name is not None:
            group.product_name = group_data.product_name
        if group_data.product_description is not None:
            group.product_description = group_data.product_description
        if group_data.total_stock is not None:
            group.total_stock = group_data.total_stock
        if group_data.specifications is not None:
            group.specifications = group_data.specifications
        if group_data.manufacturer is not None:
            group.manufacturer = group_data.manufacturer

        db.commit()
        db.refresh(group)

        return {
            "message": "Group updated successfully",
            "group_id": group_id,
            "updated_fields": [field for field, value in group_data.dict().items() if value is not None]
        }

    except HTTPException:
        raise
    except Exception as e:
        print(f"Error updating supplier group {group_id}: {e}")
        db.rollback()
        raise HTTPException(status_code=500, detail="Failed to update group")

@router.put("/groups/{group_id}/image")
async def update_supplier_group_image(
    group_id: int,
    image_url: str,
    supplier: User = Depends(verify_supplier),
    db: Session = Depends(get_db)
):
    """Update the image for a supplier-managed group"""
    try:
        # Find the AdminGroup
        group = db.query(AdminGroup).filter(AdminGroup.id == group_id).first()
        if not group:
            raise HTTPException(
                status_code=status.HTTP_404_NOT_FOUND,
                detail="Group not found"
            )

        # Verify supplier owns this group (created by supplier)
        supplier_name = supplier.company_name or supplier.full_name or "Supplier"
        if group.admin_name != supplier_name:
            raise HTTPException(
                status_code=status.HTTP_403_FORBIDDEN,
                detail="You don't have permission to update this group"
            )

        # Update the group image
        group.image = image_url
        db.commit()

        return {
            "message": "Group image updated successfully",
            "group_id": group_id,
            "image_url": image_url
        }

    except HTTPException:
        raise
    except Exception as e:
        print(f"Error updating supplier group image {group_id}: {e}")
        db.rollback()
        raise HTTPException(status_code=500, detail="Failed to update group image")

@router.delete("/groups/{group_id}")
async def delete_supplier_group(
    group_id: int,
       supplier: User = Depends(verify_supplier),
    db: Session = Depends(get_db)
):
    """Delete a supplier-managed group"""
    try:
        # Find the AdminGroup
        group = db.query(AdminGroup).filter(AdminGroup.id == group_id).first()
        if not group:
            raise HTTPException(
                status_code=status.HTTP_404_NOT_FOUND,
                detail="Group not found"
            )

        # Verify supplier owns this group
        supplier_name = supplier.company_name or supplier.full_name or "Supplier"
        if group.admin_name != supplier_name:
            raise HTTPException(
                status_code=status.HTTP_403_FORBIDDEN,
                detail="You don't have permission to delete this group"
            )

        # Check if group has participants
        joins = db.query(AdminGroupJoin).filter(
            AdminGroupJoin.admin_group_id == group_id
        ).all()

        refunded = []
        manual_refund_required = []

        if joins:
            # Process refunds for joined participants where possible
            for join in joins:
                try:
                    # Calculate refund amount (price * quantity)
                    refund_amount = (group.price or 0.0) * (join.quantity or 0)

                    # Only create an internal refund transaction if we have a linked product
                    # and therefore a sensible product_id to attach. For admin groups without
                    # a product_id or where external payment is used, record for manual review.
                    if getattr(group, 'product_id', None):
                        txn = Transaction(
                            user_id=join.user_id,
                            group_buy_id=None,
                            product_id=group.product_id,
                            quantity=join.quantity or 0,
                            amount=-1 * round(refund_amount, 2),
                            transaction_type="refund",
                            location_zone=(getattr(join.user, 'location_zone', None) or "Unknown")
                        )
                        db.add(txn)
                        refunded.append({
                            "user_id": join.user_id,
                            "quantity": join.quantity,
                            "refund_amount": round(refund_amount, 2)
                        })
                    else:
                        # Mark for manual refund if we can't create an internal transaction
                        manual_refund_required.append({
                            "user_id": join.user_id,
                            "quantity": join.quantity,
                            "reason": "No linked product_id - requires manual refund"
                        })

                    # Remove the join record
                    db.delete(join)
                except Exception as e:
                    print(f"Error refunding join {join.id} for group {group_id}: {e}")
                    db.rollback()
                    raise HTTPException(status_code=500, detail="Failed while processing refunds")

        # Finally delete the group itself
        try:
            db.delete(group)
            db.commit()
        except Exception as e:
            print(f"Error deleting supplier group {group_id}: {e}")
            db.rollback()
            raise HTTPException(status_code=500, detail="Failed to delete group after refunds")

        return {
            "message": "Group deleted successfully",
            "group_id": group_id,
            "refunded_count": len(refunded),
            "refunded": refunded,
            "manual_refund_required": manual_refund_required
        }

    except HTTPException:
        raise
    except Exception as e:
        print(f"Error deleting supplier group {group_id}: {e}")
        db.rollback()
        raise HTTPException(status_code=500, detail="Failed to delete group")

# Advanced Analytics Endpoints
@router.get("/analytics/overview")
async def get_supplier_analytics_overview(
    supplier: User = Depends(verify_supplier),
    db: Session = Depends(get_db)
):
    """Get comprehensive analytics overview for supplier"""
    try:
        # Time periods
        today = datetime.utcnow().date()
        week_ago = today - timedelta(days=7)
        month_ago = today - timedelta(days=30)
        quarter_ago = today - timedelta(days=90)
        year_ago = today - timedelta(days=365)

        supplier_name = supplier.company_name or supplier.full_name or "Supplier"

        # Revenue analytics
        revenue_data = {}
        for period_name, start_date in [
            ("week", week_ago), ("month", month_ago), 
            ("quarter", quarter_ago), ("year", year_ago)
        ]:
            revenue = db.query(func.sum(SupplierOrder.total_value)).filter(
                SupplierOrder.supplier_id == supplier.id,
                SupplierOrder.status.in_(["confirmed", "shipped", "delivered"]),
                SupplierOrder.created_at >= datetime.combine(start_date, datetime.min.time())
            ).scalar() or 0
            revenue_data[period_name] = float(revenue)

        # Group performance analytics
        supplier_groups = db.query(AdminGroup).filter(
            AdminGroup.admin_name == supplier_name,
            AdminGroup.is_active
        ).all()

        group_performance = []
        total_participants = 0
        total_completion_rate = 0

        for group in supplier_groups:
            participant_count = db.query(func.count(AdminGroupJoin.id)).filter(
                AdminGroupJoin.admin_group_id == group.id
            ).scalar() or 0
            
            completion_rate = 0
            if group.max_participants and group.max_participants > 0:
                completion_rate = (participant_count / group.max_participants) * 100
            
            total_participants += participant_count
            if completion_rate > 0:
                total_completion_rate += completion_rate

            group_performance.append({
                "group_id": group.id,
                "name": group.name,
                "participants": participant_count,
                "target": group.max_participants or 0,
                "completion_rate": round(completion_rate, 1),
                "revenue": participant_count * group.price,
                "created_date": group.created.isoformat() if group.created else None,
                "category": group.category
            })

        avg_completion_rate = (total_completion_rate / len(supplier_groups)) if supplier_groups else 0

        # Product performance analytics
        product_analytics = db.query(
            SupplierProduct.id,
            Product.name,
            Product.category,
            func.count(SupplierOrderItem.id).label('orders_count'),
            func.sum(SupplierOrderItem.quantity).label('total_quantity'),
            func.sum(SupplierOrderItem.total_amount).label('total_revenue')
        ).join(
            SupplierOrder, SupplierOrderItem.supplier_order_id == SupplierOrder.id
        ).join(
            SupplierProduct, SupplierOrderItem.supplier_product_id == SupplierProduct.id
        ).join(
            Product, SupplierProduct.product_id == Product.id
        ).filter(
            SupplierOrder.supplier_id == supplier.id,
            SupplierOrder.status.in_(["confirmed", "shipped", "delivered"]),
            SupplierOrder.created_at >= datetime.combine(month_ago, datetime.min.time())
        ).group_by(
            SupplierProduct.id, Product.name, Product.category
        ).order_by(
            func.sum(SupplierOrderItem.total_amount).desc()
        ).limit(10).all()

        top_products = [
            {
                "name": name,
                "category": category,
                "orders_count": orders_count,
                "total_quantity": total_quantity,
                "total_revenue": float(total_revenue)
            }
            for _, name, category, orders_count, total_quantity, total_revenue in product_analytics
        ]

        # Customer engagement metrics
        unique_customers = db.query(func.count(func.distinct(AdminGroupJoin.user_id))).join(
            AdminGroup, AdminGroupJoin.admin_group_id == AdminGroup.id
        ).filter(
            AdminGroup.admin_name == supplier_name,
            AdminGroupJoin.joined_at >= datetime.combine(month_ago, datetime.min.time())
        ).scalar() or 0

        repeat_customers = db.query(
            AdminGroupJoin.user_id,
            func.count(AdminGroupJoin.id).label('group_count')
        ).join(
            AdminGroup, AdminGroupJoin.admin_group_id == AdminGroup.id
        ).filter(
            AdminGroup.admin_name == supplier_name,
            AdminGroupJoin.joined_at >= datetime.combine(month_ago, datetime.min.time())
        ).group_by(AdminGroupJoin.user_id).having(
            func.count(AdminGroupJoin.id) > 1
        ).count()

        # Market trend analytics
        category_performance = db.query(
            AdminGroup.category,
            func.count(AdminGroup.id).label('group_count'),
            func.avg(AdminGroup.participants).label('avg_participants'),
            func.sum(AdminGroup.participants * AdminGroup.price).label('total_revenue')
        ).filter(
            AdminGroup.admin_name == supplier_name,
            AdminGroup.created >= datetime.combine(quarter_ago, datetime.min.time())
        ).group_by(AdminGroup.category).all()

        category_trends = [
            {
                "category": category,
                "group_count": group_count,
                "avg_participants": round(float(avg_participants or 0), 1),
                "total_revenue": float(total_revenue or 0)
            }
            for category, group_count, avg_participants, total_revenue in category_performance
        ]

        return {
            "revenue_analytics": revenue_data,
            "group_performance": {
                "total_groups": len(supplier_groups),
                "total_participants": total_participants,
                "avg_completion_rate": round(avg_completion_rate, 1),
                "groups": group_performance[:10]  # Top 10 groups
            },
            "product_performance": top_products,
            "customer_metrics": {
                "unique_customers_month": unique_customers,
                "repeat_customers_month": repeat_customers,
                "customer_retention_rate": round((repeat_customers / unique_customers * 100), 1) if unique_customers > 0 else 0
            },
            "category_trends": category_trends,
            "summary_metrics": {
                "monthly_revenue": revenue_data["month"],
                "quarterly_growth": round(((revenue_data["quarter"] - revenue_data["month"]) / revenue_data["month"] * 100), 1) if revenue_data["month"] > 0 else 0,
                "active_groups": len(supplier_groups),
                "avg_group_size": round(total_participants / len(supplier_groups), 1) if supplier_groups else 0
            }
        }

    except Exception as e:
        print(f"Error getting supplier analytics: {e}")
        raise HTTPException(status_code=500, detail="Failed to retrieve analytics data")

@router.get("/analytics/revenue-trend")
async def get_supplier_revenue_trend(
    days: int = 30,
    supplier: User = Depends(verify_supplier),
    db: Session = Depends(get_db)
):
    """Get daily revenue trend for the specified number of days"""
    try:
        start_date = datetime.utcnow().date() - timedelta(days=days)
        
        # Get daily revenue data
        daily_revenue = db.query(
            func.date(SupplierOrder.created_at).label('date'),
            func.sum(SupplierOrder.total_value).label('revenue'),
            func.count(SupplierOrder.id).label('orders_count')
        ).filter(
            SupplierOrder.supplier_id == supplier.id,
            SupplierOrder.status.in_(["confirmed", "shipped", "delivered"]),
            SupplierOrder.created_at >= datetime.combine(start_date, datetime.min.time())
        ).group_by(
            func.date(SupplierOrder.created_at)
        ).order_by(func.date(SupplierOrder.created_at)).all()

        # Fill in missing days with zero revenue
        revenue_trend = {}
        current_date = start_date
        while current_date <= datetime.utcnow().date():
            revenue_trend[current_date.isoformat()] = {"revenue": 0, "orders": 0}
            current_date += timedelta(days=1)

        # Update with actual data
        for date, revenue, orders in daily_revenue:
            revenue_trend[date.isoformat()] = {
                "revenue": float(revenue),
                "orders": orders
            }

        return {
            "period_days": days,
            "daily_data": revenue_trend,
            "total_revenue": sum(data["revenue"] for data in revenue_trend.values()),
            "total_orders": sum(data["orders"] for data in revenue_trend.values()),
            "avg_daily_revenue": sum(data["revenue"] for data in revenue_trend.values()) / days
        }

    except Exception as e:
        print(f"Error getting revenue trend: {e}")
        raise HTTPException(status_code=500, detail="Failed to retrieve revenue trend")

@router.get("/analytics/group-insights")
async def get_supplier_group_insights(
    supplier: User = Depends(verify_supplier),
    db: Session = Depends(get_db)
):
    """Get detailed insights about group performance and user behavior"""
    try:
        supplier_name = supplier.company_name or supplier.full_name or "Supplier"
        
        # Group completion insights
        groups_data = db.query(
            AdminGroup.id,
            AdminGroup.name,
            AdminGroup.max_participants,
            AdminGroup.price,
            AdminGroup.created,
            AdminGroup.end_date,
            func.count(AdminGroupJoin.id).label('current_participants')
        ).outerjoin(
            AdminGroupJoin, AdminGroup.id == AdminGroupJoin.admin_group_id
        ).filter(
            AdminGroup.admin_name == supplier_name
        ).group_by(
            AdminGroup.id, AdminGroup.name, AdminGroup.max_participants, 
            AdminGroup.price, AdminGroup.created, AdminGroup.end_date
        ).all()

        group_insights = []
        for group in groups_data:
            completion_rate = 0
            if group.max_participants and group.max_participants > 0:
                completion_rate = (group.current_participants / group.max_participants) * 100

            # Calculate time to reach current participation
            time_active = (datetime.utcnow() - group.created).days if group.created else 0
            participation_velocity = group.current_participants / max(time_active, 1)

            # Estimate completion time
            remaining_participants = max(0, (group.max_participants or 0) - group.current_participants)
            estimated_days_to_complete = remaining_participants / max(participation_velocity, 0.1) if participation_velocity > 0 else None

            group_insights.append({
                "group_id": group.id,
                "name": group.name,
                "current_participants": group.current_participants,
                "target_participants": group.max_participants or 0,
                "completion_rate": round(completion_rate, 1),
                "revenue_potential": group.current_participants * group.price,
                "max_revenue_potential": (group.max_participants or 0) * group.price,
                "time_active_days": time_active,
                "participation_velocity": round(participation_velocity, 2),
                "estimated_days_to_complete": round(estimated_days_to_complete, 1) if estimated_days_to_complete else None,
                "end_date": group.end_date.isoformat() if group.end_date else None,
                "status": "completed" if completion_rate >= 100 else "active" if group.current_participants > 0 else "low_engagement"
            })

        # Performance benchmarks
        avg_completion_rate = sum(g["completion_rate"] for g in group_insights) / len(group_insights) if group_insights else 0
        
        # Calculate average time to first participant in Python
        first_participants = db.query(
            AdminGroupJoin.joined_at,
            AdminGroup.created
        ).join(
            AdminGroup, AdminGroupJoin.admin_group_id == AdminGroup.id
        ).filter(
            AdminGroup.admin_name == supplier_name
        ).all()
        
        time_diffs = []
        for joined_at, created in first_participants:
            if joined_at and created:
                time_diff = (joined_at - created).total_seconds() / 86400  # Convert to days
                time_diffs.append(time_diff)
        
        avg_time_to_first_participant = sum(time_diffs) / len(time_diffs) if time_diffs else 0

        return {
            "group_insights": group_insights,
            "performance_benchmarks": {
                "avg_completion_rate": round(avg_completion_rate, 1),
                "avg_time_to_first_participant_days": round(float(avg_time_to_first_participant), 1),
                "total_groups": len(group_insights),
                "completed_groups": len([g for g in group_insights if g["status"] == "completed"]),
                "low_engagement_groups": len([g for g in group_insights if g["status"] == "low_engagement"])
            },
            "recommendations": [
                "Consider reducing target size for low-engagement groups",
                "Promote groups nearing completion to boost participation",
                "Analyze successful groups to replicate strategies"
            ] if group_insights else []
        }

    except Exception as e:
        print(f"Error getting group insights: {e}")
        raise HTTPException(status_code=500, detail="Failed to retrieve group insights")

# Enhanced Notification System
class SupplierNotificationManager:
    """Centralized notification management for suppliers"""
    
    @staticmethod
    def create_notification(
        db: Session,
        supplier_id: int,
        title: str,
        message: str,
        notification_type: str = "info",
        priority: str = "normal",
        action_url: str = None,
        metadata: dict = None
    ):
        """Create a new notification for supplier"""
        try:
            notification = SupplierNotification(
                supplier_id=supplier_id,
                title=title,
                message=message,
                type=notification_type,
                priority=priority,
                action_url=action_url,
                metadata=metadata or {},
                created_at=datetime.utcnow()
            )
            db.add(notification)
            db.commit()
            logger.info(f"Created notification for supplier {supplier_id}: {title}")
            return notification
        except Exception as e:
            logger.error(f"Failed to create notification for supplier {supplier_id}: {e}")
            db.rollback()
            return None
    
    @staticmethod
    def notify_group_milestone(db: Session, supplier_id: int, group_id: int, milestone: str, participants: int, target: int):
        """Send notification for group milestones"""
        milestones = {
            "first_participant": {
                "title": "🎉 First Participant Joined!",
                "message": "Your group has received its first participant! Keep promoting to reach your target."
            },
            "quarter_full": {
                "title": "📈 25% Target Reached",
                "message": f"Great progress! Your group now has {participants} out of {target} participants."
            },
            "half_full": {
                "title": "🚀 Halfway There!",
                "message": f"Excellent! Your group is 50% complete with {participants} participants."
            },
            "three_quarter_full": {
                "title": "🔥 75% Complete!",
                "message": f"Almost there! Your group has {participants} out of {target} participants."
            },
            "near_completion": {
                "title": "⚡ Nearly Complete!",
                "message": f"Just {target - participants} more participants needed to reach your target!"
            },
            "completed": {
                "title": "🎊 Group Completed!",
                "message": f"Congratulations! Your group has reached {participants} participants and is ready for processing."
            }
        }
        
        if milestone in milestones:
            notification_data = milestones[milestone]
            SupplierNotificationManager.create_notification(
                db, supplier_id, notification_data["title"], notification_data["message"],
                "success", "high", f"/groups/{group_id}", {"group_id": group_id, "participants": participants}
            )
    
    @staticmethod
    def notify_order_status(db: Session, supplier_id: int, order_id: int, status: str, details: dict = None):
        """Send notification for order status changes"""
        status_messages = {
            "pending": {
                "title": "📋 New Order Received",
                "message": "You have a new order waiting for your confirmation.",
                "type": "info",
                "priority": "high"
            },
            "confirmed": {
                "title": "✅ Order Confirmed",
                "message": "Order has been confirmed and is being prepared for delivery.",
                "type": "success",
                "priority": "normal"
            },
            "shipped": {
                "title": "🚚 Order Shipped",
                "message": "Order has been shipped and is on its way to customers.",
                "type": "info",
                "priority": "normal"
            },
            "delivered": {
                "title": "📦 Order Delivered",
                "message": "Order has been successfully delivered to customers.",
                "type": "success",
                "priority": "normal"
            },
            "cancelled": {
                "title": "❌ Order Cancelled",
                "message": "Order has been cancelled. Please review the details.",
                "type": "warning",
                "priority": "high"
            }
        }
        
        if status in status_messages:
            msg_data = status_messages[status]
            SupplierNotificationManager.create_notification(
                db, supplier_id, msg_data["title"], msg_data["message"],
                msg_data["type"], msg_data["priority"], f"/orders/{order_id}",
                {"order_id": order_id, "status": status, **(details or {})}
            )
    
    @staticmethod
    def notify_payment_update(db: Session, supplier_id: int, payment_id: int, amount: float, status: str):
        """Send notification for payment updates"""
        status_messages = {
            "pending": {
                "title": "⏳ Payment Processing",
                "message": f"Your payment of ${amount:.2f} is being processed.",
                "type": "info"
            },
            "completed": {
                "title": "💰 Payment Received",
                "message": f"Payment of ${amount:.2f} has been successfully processed.",
                "type": "success"
            },
            "failed": {
                "title": "⚠️ Payment Failed",
                "message": f"Payment of ${amount:.2f} failed to process. Please check your account details.",
                "type": "error"
            }
        }
        
        if status in status_messages:
            msg_data = status_messages[status]
            SupplierNotificationManager.create_notification(
                db, supplier_id, msg_data["title"], msg_data["message"],
                msg_data["type"], "high", f"/payments/{payment_id}",
                {"payment_id": payment_id, "amount": amount, "status": status}
            )

@router.post("/notifications/bulk-create")
async def create_bulk_notifications(
    notifications_data: List[dict],
    supplier: User = Depends(verify_supplier),
    db: Session = Depends(get_db)
):
    """Create multiple notifications at once (for system events)"""
    try:
        created_notifications = []
        for notification in notifications_data:
            created = SupplierNotificationManager.create_notification(
                db, supplier.id, 
                notification.get("title", "Notification"),
                notification.get("message", ""),
                notification.get("type", "info"),
                notification.get("priority", "normal"),
                notification.get("action_url"),
                notification.get("metadata")
            )
            if created:
                created_notifications.append(created.id)
        
        return {
            "message": f"Created {len(created_notifications)} notifications",
            "notification_ids": created_notifications
        }
    
    except Exception as e:
        handle_supplier_error("create bulk notifications", e, supplier.id)

@router.get("/notifications/summary")
async def get_supplier_notifications_summary(
    supplier: User = Depends(verify_supplier),
    db: Session = Depends(get_db)
):
    """Get notification summary and counts"""
    try:
        # Count notifications by type and read status
        total_notifications = db.query(func.count(SupplierNotification.id)).filter(
            SupplierNotification.supplier_id == supplier.id
        ).scalar() or 0
        
        unread_notifications = db.query(func.count(SupplierNotification.id)).filter(
            SupplierNotification.supplier_id == supplier.id,
            ~SupplierNotification.is_read
        ).scalar() or 0
        
        high_priority_unread = db.query(func.count(SupplierNotification.id)).filter(
            SupplierNotification.supplier_id == supplier.id,
            ~SupplierNotification.is_read,
            SupplierNotification.priority == "high"
        ).scalar() or 0
        
        # Recent notifications (last 24 hours)
        yesterday = datetime.utcnow() - timedelta(hours=24)
        recent_notifications = db.query(func.count(SupplierNotification.id)).filter(
            SupplierNotification.supplier_id == supplier.id,
            SupplierNotification.created_at >= yesterday
        ).scalar() or 0
        
        # Notification types breakdown
        type_breakdown = db.query(
            SupplierNotification.type,
            func.count(SupplierNotification.id).label('count')
        ).filter(
            SupplierNotification.supplier_id == supplier.id,
            ~SupplierNotification.is_read
        ).group_by(SupplierNotification.type).all()
        
        type_counts = {notification_type: count for notification_type, count in type_breakdown}
        
        return {
            "total_notifications": total_notifications,
            "unread_notifications": unread_notifications,
            "high_priority_unread": high_priority_unread,
            "recent_notifications_24h": recent_notifications,
            "unread_by_type": type_counts,
            "needs_attention": high_priority_unread > 0
        }
    
    except Exception as e:
        handle_supplier_error("get notifications summary", e, supplier.id)

@router.post("/notifications/test")
async def create_test_notifications(
    supplier: User = Depends(verify_supplier),
    db: Session = Depends(get_db)
):
    """Create test notifications for demonstration (development/testing only)"""
    try:
        test_notifications = [
            {
                "title": "🎉 Welcome to Supplier Dashboard!",
                "message": "Your supplier account is now active. Start creating group buying opportunities!",
                "type": "success",
                "priority": "normal"
            },
            {
                "title": "📋 Action Required: Verify Account",
                "message": "Please complete your account verification to access all features.",
                "type": "warning",
                "priority": "high"
            },
            {
                "title": "📊 Weekly Performance Report",
                "message": "Your weekly performance report is ready for review.",
                "type": "info",
                "priority": "normal"
            },
            {
                "title": "🚀 Group Milestone Reached",
                "message": "One of your groups has reached 75% of its participation target!",
                "type": "success",
                "priority": "high"
            }
        ]
        
        created_count = 0
        for notification in test_notifications:
            created = SupplierNotificationManager.create_notification(
                db, supplier.id,
                notification["title"],
                notification["message"],
                notification["type"],
                notification["priority"]
            )
            if created:
                created_count += 1
        
        return {
            "message": f"Created {created_count} test notifications",
            "created_count": created_count
        }
    
    except Exception as e:
        handle_supplier_error("create test notifications", e, supplier.id)

# New endpoint for creating groups
class CreateGroupRequest(BaseModel):
    name: str
    description: str
    long_description: Optional[str] = None
    category: str
    price: float
    original_price: float
    image: str
    max_participants: int
    end_date: str
    shipping_info: Optional[str] = None
    estimated_delivery: Optional[str] = None
    features: Optional[List[str]] = None
    requirements: Optional[List[str]] = None
    manufacturer: Optional[str] = None
    total_stock: Optional[int] = None

@router.post("/groups/create")
async def create_supplier_group(
    group_data: CreateGroupRequest,
    supplier: User = Depends(verify_supplier),
    db: Session = Depends(get_db)
):
    """Create a new supplier-managed group buying opportunity"""
    try:
        # Debug: Log the received data
        print(f"DEBUG: Received supplier group data: {group_data.dict()}")

        # Validate required fields (same as admin)
        if not group_data.name or not group_data.name.strip():
            raise HTTPException(status_code=400, detail="Group name is required")
        if not group_data.description or not group_data.description.strip():
            raise HTTPException(status_code=400, detail="Group description is required")
        if not group_data.category or not group_data.category.strip():
            raise HTTPException(status_code=400, detail="Category is required")
        if not isinstance(group_data.price, (int, float)) or group_data.price <= 0:
            raise HTTPException(status_code=400, detail="Price must be a positive number")
        if not isinstance(group_data.original_price, (int, float)) or group_data.original_price <= 0:
            raise HTTPException(status_code=400, detail="Original price must be a positive number")
        if not group_data.image or not group_data.image.strip():
            raise HTTPException(status_code=400, detail="Image URL is required")
        if not isinstance(group_data.max_participants, int) or group_data.max_participants <= 0:
            raise HTTPException(status_code=400, detail="Max participants must be a positive integer")
        if not group_data.end_date or not group_data.end_date.strip():
            raise HTTPException(status_code=400, detail="End date is required")

        # Parse end_date from ISO string
        try:
            end_date_obj = datetime.fromisoformat(group_data.end_date.replace('Z', '+00:00'))
        except (ValueError, AttributeError):
            raise HTTPException(status_code=400, detail="Invalid end_date format")

        # Use supplier's name as admin_name
        supplier_name = supplier.company_name or supplier.full_name or "Supplier"

        # Create the admin group (supplier-managed)
        new_group = AdminGroup(
            name=group_data.name,
            description=group_data.description,
            long_description=group_data.long_description,
            category=group_data.category,
            price=group_data.price,
            original_price=group_data.original_price,
            image=group_data.image,
            max_participants=group_data.max_participants,
            end_date=end_date_obj,
            admin_name=supplier_name,
            supplier_id=supplier.id,  # Track who created this group
            shipping_info=group_data.shipping_info,
            estimated_delivery=group_data.estimated_delivery,
            features=group_data.features,
            requirements=group_data.requirements,
            manufacturer=group_data.manufacturer,
            total_stock=group_data.total_stock,
            is_active=True,
            participants=0  # Start with 0 participants
        )

        db.add(new_group)
        db.commit()
        db.refresh(new_group)

        return {
            "message": "Group created successfully",
            "group_id": new_group.id,
            "group": {
                "id": new_group.id,
                "name": new_group.name,
                "category": new_group.category,
                "price": new_group.price,
                "max_participants": new_group.max_participants,
                "end_date": new_group.end_date.isoformat(),
                "image": new_group.image
            }
        }

    except HTTPException:
        raise
    except Exception as e:
        print(f"Error creating supplier group: {e}")
        db.rollback()
        raise HTTPException(status_code=500, detail="Failed to create group")
