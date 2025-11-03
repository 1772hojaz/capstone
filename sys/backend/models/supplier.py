from fastapi import APIRouter, Depends, HTTPException, status, UploadFile, File
from sqlalchemy.orm import Session
from sqlalchemy import func, or_
from pydantic import BaseModel
from typing import List, Optional
from datetime import datetime, timedelta
import json
import secrets
from db.database import get_db
from models.models import User, SupplierProduct, ProductPricingTier, SupplierOrder, SupplierOrderItem, Product, GroupBuy, SupplierPickupLocation, SupplierInvoice, SupplierPayment, SupplierNotification, AdminGroup, AdminGroupJoin, Contribution, QRCodePickup
from authentication.auth import verify_token

# Add Cloudinary imports for image upload
import cloudinary
import cloudinary.uploader
import cloudinary.api
import os

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

# Helper function to verify supplier
def verify_supplier(user: User = Depends(verify_token)):
    if not user.is_supplier:
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail="Supplier access required"
        )
    return user

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
            db.func.sum(SupplierOrderItem.total_amount).label('revenue')
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
            db.desc('revenue')
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
        group_name = "Unknown Group"
        trader_count = 0

        if order.group_buy:
            group_name = f"Group Buy #{order.group_buy.id}"
            trader_count = order.group_buy.participants_count
        elif order.admin_group:
            group_name = order.admin_group.name
            trader_count = order.admin_group.participants

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
            message = "Order rejected"

        else:
            raise HTTPException(status_code=400, detail="Invalid action")

        db.commit()
        return {"message": message}

    except HTTPException:
        raise
    except Exception as e:
        db.rollback()
        print(f"Error processing order action: {e}")
        raise HTTPException(status_code=500, detail="Failed to process order action")

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
        monthly_payments = db.query(
            db.func.strftime('%Y-%m', SupplierPayment.processed_at).label('month'),
            db.func.sum(SupplierPayment.amount).label('amount')
        ).filter(
            SupplierPayment.supplier_id == supplier.id,
            SupplierPayment.status == "completed",
            SupplierPayment.processed_at >= six_months_ago
        ).group_by('month').order_by('month').all()
        
        monthly_data = [
            {"month": month, "amount": amount}
            for month, amount in monthly_payments
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
    """Get active groups created by supplier or using supplier's products for moderation"""
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
                    "image": group.image or "/api/placeholder/300/200",
                    "totalStock": group.total_stock or "N/A",
                    "specifications": group.specifications or "Supplier managed group buy",
                    "manufacturer": group.manufacturer or "Various",
                    "warranty": "As per product"
                }
            })

        # Also get groups using supplier's products (if supplier has products)
        supplier_has_products = db.query(SupplierProduct).filter(
            SupplierProduct.supplier_id == supplier.id
        ).first() is not None

        if supplier_has_products:
            # Get supplier's product IDs
            supplier_product_ids = db.query(SupplierProduct.product_id).filter(
                SupplierProduct.supplier_id == supplier.id
            ).subquery()

            # Get active admin groups that use supplier's products (but not already included above)
            product_based_groups = db.query(AdminGroup).filter(
                AdminGroup.is_active,
                AdminGroup.product_id.isnot(None),
                AdminGroup.product_id.in_(supplier_product_ids),
                AdminGroup.admin_name != supplier_name  # Don't duplicate groups created by this supplier
            ).all()

            for group in product_based_groups:
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
                        "image": group.image or "/api/placeholder/300/200",
                        "totalStock": group.total_stock or "N/A",
                        "specifications": group.specifications or "Admin managed group buy",
                        "manufacturer": group.manufacturer or "Various",
                        "warranty": "As per product"
                    }
                })

            # Get active GroupBuy groups using supplier's products
            active_group_buys = db.query(GroupBuy).filter(
                GroupBuy.status == "active",
                GroupBuy.product_id.in_(supplier_product_ids),
                GroupBuy.deadline > datetime.utcnow()
            ).all()

            for group in active_group_buys:
                # Calculate participants count
                participants_count = db.query(Contribution).filter(
                    Contribution.group_buy_id == group.id
                ).count()

                # Calculate total amount
                total_amount = participants_count * group.product.bulk_price if group.product else 0

                result.append({
                    "id": group.id,
                    "name": group.product.name if group.product else f"Group Buy #{group.id}",
                    "creator": group.creator.full_name if group.creator else "User",
                    "category": group.product.category if group.product else "General",
                    "members": participants_count,
                    "targetMembers": group.product.moq if group.product else 10,
                    "totalAmount": f"${total_amount:.2f}",
                    "dueDate": group.deadline.strftime("%Y-%m-%d") if group.deadline else "No deadline",
                    "description": group.product.description if group.product else "User-created group buy",
                    "status": "active",
                    "product": {
                        "name": group.product.name if group.product else "Unknown Product",
                        "description": group.product.description if group.product else "User-created group buy",
                        "regularPrice": f"${group.product.unit_price:.2f}" if group.product else "$0.00",
                        "bulkPrice": f"${group.product.bulk_price:.2f}" if group.product else "$0.00",
                        "image": group.product.image_url if group.product and group.product.image_url else "/api/placeholder/300/200",
                        "totalStock": "N/A",
                        "specifications": "User managed group buy",
                        "manufacturer": "Various",
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
    """Get pending group orders (created by supplier or using supplier's products)"""
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
                    "image": group.image or "/api/placeholder/300/200",
                    "totalStock": group.total_stock or "N/A",
                    "specifications": group.specifications or "Supplier managed group buy",
                    "manufacturer": group.manufacturer or "Various",
                    "warranty": "As per product"
                }
            })

        # Check if supplier has products for additional groups
        supplier_has_products = db.query(SupplierProduct).filter(
            SupplierProduct.supplier_id == supplier.id
        ).first() is not None

        if supplier_has_products:
            # Get supplier's product IDs
            supplier_product_ids = db.query(SupplierProduct.product_id).filter(
                SupplierProduct.supplier_id == supplier.id
            ).subquery()

            # Get admin groups that are still pending and use supplier's products (but not created by supplier)
            pending_admin_groups = db.query(AdminGroup).filter(
                AdminGroup.is_active,
                AdminGroup.product_id.isnot(None),
                AdminGroup.product_id.in_(supplier_product_ids),
                AdminGroup.admin_name != supplier_name,  # Don't duplicate supplier-created groups
                or_(
                    AdminGroup.max_participants.is_(None),
                    AdminGroup.participants < AdminGroup.max_participants
                )
            ).all()

            for group in pending_admin_groups:
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
                        "image": group.image or "/api/placeholder/300/200",
                        "totalStock": group.total_stock or "N/A",
                        "specifications": group.specifications or "Admin managed group buy",
                        "manufacturer": group.manufacturer or "Various",
                        "warranty": "As per product"
                    }
                })

            # Get GroupBuy groups that are still pending and use supplier's products
            pending_group_buys = db.query(GroupBuy).filter(
                GroupBuy.status == "active",
                GroupBuy.product_id.in_(supplier_product_ids),
                GroupBuy.product_id.isnot(None),
                GroupBuy.total_quantity < GroupBuy.product.moq
            ).all()

            for group in pending_group_buys:
                # Calculate participants count
                participants_count = db.query(Contribution).filter(
                    Contribution.group_buy_id == group.id
                ).count()

                # Calculate total amount
                total_amount = participants_count * group.product.bulk_price if group.product else 0

                result.append({
                    "id": group.id,
                    "name": group.product.name if group.product else f"Group Buy #{group.id}",
                    "creator": group.creator.full_name if group.creator else "User",
                    "category": group.product.category if group.product else "General",
                    "members": participants_count,
                    "targetMembers": group.product.moq if group.product else 10,
                    "totalAmount": f"${total_amount:.2f}",
                    "dueDate": group.deadline.strftime("%Y-%m-%d") if group.deadline else "No deadline",
                    "description": group.product.description if group.product else "User-created group buy",
                    "status": "pending",
                    "product": {
                        "name": group.product.name if group.product else "Unknown Product",
                        "description": group.product.description if group.product else "User-created group buy",
                        "regularPrice": f"${group.product.unit_price:.2f}" if group.product else "$0.00",
                        "bulkPrice": f"${group.product.bulk_price:.2f}" if group.product else "$0.00",
                        "image": group.product.image_url if group.product and group.product.image_url else "/api/placeholder/300/200",
                        "totalStock": "N/A",
                        "specifications": "User managed group buy",
                        "manufacturer": "Various",
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
    """Get groups ready for payment processing (created by supplier or using supplier's products)"""
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
                    "image": group.image or "/api/placeholder/300/200",
                    "totalStock": group.total_stock or "N/A",
                    "specifications": group.specifications or "Supplier managed group buy",
                    "manufacturer": group.manufacturer or "Various",
                    "warranty": "As per product"
                }
            })

        # Check if supplier has products for additional groups
        supplier_has_products = db.query(SupplierProduct).filter(
            SupplierProduct.supplier_id == supplier.id
        ).first() is not None

        if supplier_has_products:
            # Get supplier's product IDs
            supplier_product_ids = db.query(SupplierProduct.product_id).filter(
                SupplierProduct.supplier_id == supplier.id
            ).subquery()

            # Get admin groups that have reached their target and use supplier's products (but not created by supplier)
            product_based_ready_groups = db.query(AdminGroup).filter(
                AdminGroup.is_active,
                AdminGroup.max_participants.isnot(None),
                AdminGroup.participants >= AdminGroup.max_participants,
                AdminGroup.product_id.isnot(None),
                AdminGroup.product_id.in_(supplier_product_ids),
                AdminGroup.admin_name != supplier_name  # Don't duplicate supplier-created groups
            ).all()

            for group in product_based_ready_groups:
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
                        "image": group.image or "/api/placeholder/300/200",
                        "totalStock": group.total_stock or "N/A",
                        "specifications": group.specifications or "Admin managed group buy",
                        "manufacturer": group.manufacturer or "Various",
                        "warranty": "As per product"
                    }
                })

            # Get GroupBuy groups that have reached MOQ and use supplier's products
            ready_group_buys = db.query(GroupBuy).filter(
                GroupBuy.status == "active",
                GroupBuy.product_id.in_(supplier_product_ids),
                GroupBuy.product_id.isnot(None),
                GroupBuy.total_quantity >= GroupBuy.product.moq
            ).all()

            for group in ready_group_buys:
                # Calculate participants count
                participants_count = db.query(Contribution).filter(
                    Contribution.group_buy_id == group.id
                ).count()

                # Calculate total amount
                total_amount = participants_count * group.product.bulk_price if group.product else 0

                result.append({
                    "id": group.id,
                    "name": group.product.name if group.product else f"Group Buy #{group.id}",
                    "creator": group.creator.full_name if group.creator else "User",
                    "category": group.product.category if group.product else "General",
                    "members": participants_count,
                    "targetMembers": group.product.moq if group.product else 10,
                    "totalAmount": f"${total_amount:.2f}",
                    "dueDate": group.deadline.strftime("%Y-%m-%d") if group.deadline else "No deadline",
                    "description": group.product.description if group.product else "User-created group buy",
                    "status": "ready_for_payment",
                    "product": {
                        "name": group.product.name if group.product else "Unknown Product",
                        "description": group.product.description if group.product else "User-created group buy",
                        "regularPrice": f"${group.product.unit_price:.2f}" if group.product else "$0.00",
                        "bulkPrice": f"${group.product.bulk_price:.2f}" if group.product else "$0.00",
                        "image": group.product.image_url if group.product and group.product.image_url else "/api/placeholder/300/200",
                        "totalStock": "N/A",
                        "specifications": "User managed group buy",
                        "manufacturer": "Various",
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

        # Check if supplier has any products for additional stats
        supplier_has_products = db.query(SupplierProduct).filter(
            SupplierProduct.supplier_id == supplier.id
        ).first() is not None

        additional_active_groups = 0
        additional_members = 0
        additional_ready_for_payment = 0
        additional_pending_groups_count = 0
        additional_required_action = 0

        if supplier_has_products:
            # Get supplier's product IDs
            supplier_product_ids = db.query(SupplierProduct.product_id).filter(
                SupplierProduct.supplier_id == supplier.id
            ).subquery()

            # Active groups using supplier's products (excluding those created by supplier)
            additional_active_groups = db.query(func.count(AdminGroup.id)).filter(
                AdminGroup.is_active,
                AdminGroup.product_id.isnot(None),
                AdminGroup.product_id.in_(supplier_product_ids),
                AdminGroup.admin_name != supplier_name
            ).scalar() or 0

            # Add GroupBuy active groups
            active_group_buy_count = db.query(func.count(GroupBuy.id)).filter(
                GroupBuy.status == "active",
                GroupBuy.product_id.in_(supplier_product_ids),
                GroupBuy.deadline > datetime.utcnow()
            ).scalar() or 0

            additional_active_groups += active_group_buy_count

            # Total members from additional groups
            additional_members_admin = db.query(func.sum(AdminGroup.participants)).filter(
                AdminGroup.is_active,
                AdminGroup.product_id.isnot(None),
                AdminGroup.product_id.in_(supplier_product_ids),
                AdminGroup.admin_name != supplier_name
            ).scalar() or 0

            # Count members in GroupBuy groups
            group_buy_members = 0
            active_group_buys = db.query(GroupBuy).filter(
                GroupBuy.status == "active",
                GroupBuy.product_id.in_(supplier_product_ids),
                GroupBuy.deadline > datetime.utcnow()
            ).all()

            for gb in active_group_buys:
                group_buy_members += db.query(func.count(Contribution.id)).filter(
                    Contribution.group_buy_id == gb.id
                ).scalar() or 0

            additional_members = additional_members_admin + group_buy_members

            # Ready for payment groups count
            additional_ready_admin = db.query(func.count(AdminGroup.id)).filter(
                AdminGroup.is_active,
                AdminGroup.max_participants.isnot(None),
                AdminGroup.participants >= AdminGroup.max_participants,
                AdminGroup.product_id.isnot(None),
                AdminGroup.product_id.in_(supplier_product_ids),
                AdminGroup.admin_name != supplier_name
            ).scalar() or 0

            additional_ready_group_buy = db.query(func.count(GroupBuy.id)).filter(
                GroupBuy.status == "active",
                GroupBuy.product_id.in_(supplier_product_ids),
                GroupBuy.product_id.isnot(None),
                GroupBuy.total_quantity >= GroupBuy.product.moq
            ).scalar() or 0

            additional_ready_for_payment = additional_ready_admin + additional_ready_group_buy

            # Pending groups count
            additional_pending_admin = db.query(func.count(AdminGroup.id)).filter(
                AdminGroup.is_active,
                AdminGroup.product_id.isnot(None),
                AdminGroup.product_id.in_(supplier_product_ids),
                AdminGroup.admin_name != supplier_name,
                or_(
                    AdminGroup.max_participants.is_(None),
                    AdminGroup.participants < AdminGroup.max_participants
                )
            ).scalar() or 0

            additional_pending_group_buy = db.query(func.count(GroupBuy.id)).filter(
                GroupBuy.status == "active",
                GroupBuy.product_id.in_(supplier_product_ids),
                GroupBuy.product_id.isnot(None),
                GroupBuy.total_quantity < GroupBuy.product.moq
            ).scalar() or 0

            additional_pending_groups_count = additional_pending_admin + additional_pending_group_buy

            # Required action count
            additional_required_admin = db.query(func.count(AdminGroup.id)).filter(
                AdminGroup.is_active,
                AdminGroup.end_date < datetime.utcnow(),
                AdminGroup.product_id.isnot(None),
                AdminGroup.product_id.in_(supplier_product_ids),
                AdminGroup.admin_name != supplier_name
            ).scalar() or 0

            additional_required_group_buy = db.query(func.count(GroupBuy.id)).filter(
                GroupBuy.status == "active",
                GroupBuy.product_id.in_(supplier_product_ids),
                GroupBuy.deadline < datetime.utcnow()
            ).scalar() or 0

            additional_required_action = additional_required_admin + additional_required_group_buy

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

        total_active_groups = supplier_created_groups_count + additional_active_groups
        total_members = supplier_created_members + additional_members
        ready_for_payment_count = additional_ready_for_payment  # Supplier-created groups don't auto-qualify for payment
        pending_orders_count = supplier_pending_groups_count + additional_pending_groups_count
        required_action_count = additional_required_action

        return {
            "active_groups": total_active_groups,
            "total_members": total_members,
            "ready_for_payment": ready_for_payment_count,
            "required_action": required_action_count,
            "pending_orders": pending_orders_count
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
    """Get detailed information about a specific group for supplier moderation"""
    try:
        # First check if it's an AdminGroup
        group = db.query(AdminGroup).filter(AdminGroup.id == group_id).first()
        
        if group:
            # Verify supplier supplies this product
            supplier_product = db.query(SupplierProduct).filter(
                SupplierProduct.supplier_id == supplier.id,
                SupplierProduct.product_id == group.product_id if hasattr(group, 'product_id') else None
            ).first()
            
            if not supplier_product:
                raise HTTPException(status_code=403, detail="You don't supply products for this group")

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
        
        # Check if it's a GroupBuy
        group_buy = db.query(GroupBuy).filter(GroupBuy.id == group_id).first()
        
        if group_buy:
            # Verify supplier supplies this product
            supplier_product = db.query(SupplierProduct).filter(
                SupplierProduct.supplier_id == supplier.id,
                SupplierProduct.product_id == group_buy.product_id
            ).first()
            
            if not supplier_product:
                raise HTTPException(status_code=403, detail="You don't supply products for this group")

            # Calculate participants count
            participants_count = db.query(Contribution).filter(
                Contribution.group_buy_id == group_id
            ).count()

            return {
                "id": group_buy.id,
                "name": group_buy.product.name if group_buy.product else f"Group Buy #{group_buy.id}",
                "description": group_buy.product.description if group_buy.product else "User-created group buy",
                "category": group_buy.product.category if group_buy.product else "General",
                "price": group_buy.product.bulk_price if group_buy.product else 0,
                "original_price": group_buy.product.unit_price if group_buy.product else 0,
                "image": group_buy.product.image_url if group_buy.product and group_buy.product.image_url else "/api/placeholder/300/200",
                "max_participants": group_buy.product.moq if group_buy.product else 10,
                "participants": participants_count,
                "end_date": group_buy.deadline.isoformat() if group_buy.deadline else None,
                "creator": group_buy.creator.full_name if group_buy.creator else "User",
                "total_quantity": group_buy.total_quantity,
                "total_contributions": group_buy.total_contributions,
                "status": group_buy.status,
                "created": group_buy.created_at.isoformat() if group_buy.created_at else None,
                "group_type": "group_buy"
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
    """Process payment for a completed group (supplier side)"""
    try:
        # First check if it's an AdminGroup
        group = db.query(AdminGroup).filter(AdminGroup.id == group_id).first()
        
        if group:
            # Verify supplier supplies this product
            supplier_product = db.query(SupplierProduct).filter(
                SupplierProduct.supplier_id == supplier.id,
                SupplierProduct.product_id == group.product_id if hasattr(group, 'product_id') else None
            ).first()
            
            if not supplier_product:
                raise HTTPException(status_code=403, detail="You don't supply products for this group")

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
        
        # Check if it's a GroupBuy
        group_buy = db.query(GroupBuy).filter(GroupBuy.id == group_id).first()
        
        if group_buy:
            # Verify supplier supplies this product
            supplier_product = db.query(SupplierProduct).filter(
                SupplierProduct.supplier_id == supplier.id,
                SupplierProduct.product_id == group_buy.product_id
            ).first()
            
            if not supplier_product:
                raise HTTPException(status_code=403, detail="You don't supply products for this group")

            # Check if group has reached MOQ
            if group_buy.total_quantity < (group_buy.product.moq if group_buy.product else 10):
                raise HTTPException(status_code=400, detail="Group hasn't reached minimum order quantity")

            # Create supplier payment record
            payment = SupplierPayment(
                supplier_id=supplier.id,
                amount=group_buy.total_contributions,
                payment_method="bank_transfer",
                reference_number=f"GROUPBUY-{group_buy.id}-{supplier.id}",
                status="pending"
            )
            
            db.add(payment)
            db.commit()
            
            return {
                "message": "Payment processed successfully",
                "payment_id": payment.id,
                "amount": group_buy.total_contributions,
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

@router.post("/groups/create")
async def create_supplier_group(
    group_data: dict,
    supplier: User = Depends(verify_supplier),
    db: Session = Depends(get_db)
):
    """Create a new group buy using supplier's products"""
    try:
        # Validate required fields
        required_fields = ['name', 'description', 'category', 'price', 'original_price', 'max_participants', 'end_date']
        for field in required_fields:
            if field not in group_data:
                raise HTTPException(status_code=400, detail=f"Missing required field: {field}")

        # Check if supplier manages the product (if product_id is provided)
        if 'product_id' in group_data:
            supplier_product = db.query(SupplierProduct).filter(
                SupplierProduct.supplier_id == supplier.id,
                SupplierProduct.product_id == group_data['product_id']
            ).first()
            if not supplier_product:
                raise HTTPException(status_code=403, detail="You don't manage this product")

        # Create the admin group (suppliers create admin-style groups)
        new_group = AdminGroup(
            name=group_data['name'],
            description=group_data['description'],
            long_description=group_data.get('long_description', group_data['description']),
            category=group_data['category'],
            price=float(group_data['price']),
            original_price=float(group_data.get('original_price', group_data['price'])),
            image=group_data.get('image') or '/api/placeholder/300/200',  # Default placeholder if no image
            max_participants=int(group_data['max_participants']),
            end_date=datetime.fromisoformat(group_data['end_date'].replace('Z', '+00:00')),
            admin_name=supplier.company_name or supplier.full_name or "Supplier",
            shipping_info=group_data.get('shipping_info', 'Free shipping when group goal is reached'),
            estimated_delivery=group_data.get('estimated_delivery', '2-3 weeks after group completion'),
            features=group_data.get('features', []),
            requirements=group_data.get('requirements', []),
            product_id=group_data.get('product_id'),  # Link to supplier's product if provided
            product_name=group_data.get('product_name'),
            product_description=group_data.get('product_description'),
            total_stock=group_data.get('total_stock'),
            specifications=group_data.get('specifications'),
            manufacturer=group_data.get('manufacturer'),
            pickup_location=group_data.get('pickup_location'),
            is_active=True
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
                "description": new_group.description,
                "category": new_group.category,
                "price": new_group.price,
                "original_price": new_group.original_price,
                "max_participants": new_group.max_participants,
                "end_date": new_group.end_date.isoformat() if new_group.end_date else None,
                "image": new_group.image,
                "is_active": new_group.is_active
            }
        }

    except HTTPException:
        raise
    except Exception as e:
        db.rollback()
        print(f"Error creating supplier group: {e}")
        raise HTTPException(status_code=500, detail="Failed to create group")