from fastapi import APIRouter, Depends, HTTPException, status, UploadFile, File
from sqlalchemy.orm import Session
from pydantic import BaseModel
from typing import List, Optional
from datetime import datetime, timedelta
import json
from db.database import get_db
from models.models import User, SupplierProduct, ProductPricingTier, SupplierOrder, SupplierOrderItem, Product, GroupBuy, SupplierPickupLocation, SupplierInvoice, SupplierPayment, SupplierNotification
from authentication.auth import verify_token

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