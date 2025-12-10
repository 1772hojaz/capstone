from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy.orm import Session
from sqlalchemy import func
from pydantic import BaseModel
from typing import List, Optional
import os
import qrcode
import json
from datetime import datetime, timedelta
import base64
import io
import secrets
import logging
from cryptography.fernet import Fernet
from db.database import get_db
from models.models import User, AdminGroup, Contribution, GroupBuy, AdminGroupJoin, QRCodePickup, SupplierOrder
from authentication.auth import verify_token, verify_trader, verify_supplier

router = APIRouter()
logger = logging.getLogger(__name__)

# Pydantic Models for Front-end compatibility
class GroupResponse(BaseModel):
    id: int
    name: str
    price: float
    image_url: str
    description: str
    participants: int
    moq: Optional[int] = None
    category: str
    created: str
    maxParticipants: Optional[int] = None
    originalPrice: Optional[float] = None
    endDate: Optional[str] = None
    matchScore: Optional[int] = None
    reason: Optional[str] = None
    adminCreated: bool = True
    adminName: str = "Admin"
    savings: Optional[float] = None
    discountPercentage: Optional[float] = None
    shippingInfo: Optional[str] = None
    estimatedDelivery: Optional[str] = None
    features: Optional[List[str]] = None
    requirements: Optional[List[str]] = None
    longDescription: Optional[str] = None
    status: Optional[str] = None
    orderStatus: Optional[str] = None
    joined: bool = False
    current_amount: Optional[float] = None
    target_amount: Optional[float] = None

class ProductInfo(BaseModel):
    name: str
    description: str
    manufacturer: Optional[str] = None
    totalStock: Optional[int] = None
    regularPrice: Optional[float] = None

class GroupDetailResponse(BaseModel):
    id: int
    name: str
    price: float
    originalPrice: float
    image_url: str
    description: str
    longDescription: str
    participants: int
    maxParticipants: int
    category: str
    created: str
    endDate: str
    matchScore: int
    reason: str
    adminCreated: bool
    adminName: str
    savings: float
    discountPercentage: int
    shippingInfo: str
    estimatedDelivery: str
    features: List[str]
    requirements: List[str]
    product: ProductInfo
    progressPercentage: Optional[float] = None
    remainingNeeded: Optional[int] = None
    current_amount: Optional[float] = None
    target_amount: Optional[float] = None
    amount_progress: Optional[float] = None

class GroupCreateRequest(BaseModel):
    name: str
    description: str
    category: str
    price: float
    originalPrice: float
    image_url: str
    maxParticipants: int
    endDate: str
    longDescription: str
    features: List[str]
    requirements: List[str]
    shippingInfo: str
    estimatedDelivery: str
    manufacturer: Optional[str] = None
    total_stock: Optional[int] = None
    product_name: Optional[str] = None
    product_description: Optional[str] = None

    class Config:
        json_schema_extra = {
            "example": {
                "name": "Bulk Rice Purchase",
                "description": "High-quality rice for traders",
                "category": "Food & Staples",
                "price": 150.00,
                "originalPrice": 180.00,
                "image": "/uploads/group_1.jpg",
                "maxParticipants": 20,
                "endDate": "2024-01-30T23:59:59Z",
                "longDescription": "Premium long-grain rice perfect for bulk reselling in local markets. Each participant gets 10kg packaging.",
                "features": ["Premium quality", "Bulk packaging", "Market ready"],
                "requirements": ["Valid trading license", "Minimum order 10kg"],
                "shippingInfo": "Free delivery within Harare CBD",
                "estimatedDelivery": "2024-02-05",
                "manufacturer": "Premium Rice Co.",
                "total_stock": 500
            }
        }

class JoinGroupRequest(BaseModel):
    quantity: int = 1
    delivery_method: str  # "pickup" or "delivery"
    payment_method: str   # "cash" or "card"
    special_instructions: Optional[str] = None
    payment_transaction_id: Optional[str] = None  # For card payments
    payment_reference: Optional[str] = None       # For card payments

    class Config:
        json_schema_extra = {
            "example": {
                "quantity": 1,
                "delivery_method": "pickup",
                "payment_method": "cash",
                "special_instructions": "Please call before delivery"
            }
        }

class UpdateQuantityRequest(BaseModel):
    quantity_increase: int
    payment_transaction_id: Optional[str] = None
    payment_reference: Optional[str] = None

    class Config:
        json_schema_extra = {
            "example": {
                "quantity_increase": 2,
                "payment_transaction_id": "tx_123456789",
                "payment_reference": "quantity_increase_123_1234567890"
            }
        }

class UpdateContributionRequest(BaseModel):
    quantity: int

    class Config:
        json_schema_extra = {
            "example": {
                "quantity": 5
            }
        }

class QRCodeResponse(BaseModel):
    qr_code_data: str  # Base64 encoded QR code image
    qr_content: str    # Encrypted QR code content for validation
    expires_at: str
    pickup_instructions: str

class QRValidationRequest(BaseModel):
    qr_content: str
    scanner_location: str
    staff_id: Optional[str] = None

class QRValidationResponse(BaseModel):
    valid: bool
    message: str
    pickup_details: Optional[dict] = None

class PickupStatusResponse(BaseModel):
    can_pickup: bool
    qr_available: bool
    pickup_instructions: Optional[str] = None
    qr_code: Optional[str] = None
    expires_at: Optional[str] = None

# Global cache for QR codes (for testing - in production use database)
qr_code_cache = {}

# QR Code Configuration
QR_ENCRYPTION_KEY = os.getenv("QR_ENCRYPTION_KEY", "pBPfREtwhKH-Ky87_uy0I6zQ0sJeslOzzpFQWkoyr2U=")
QR_EXPIRY_HOURS = 24  # QR codes expire after 24 hours

# Helper Functions
def encrypt_qr_data(data: dict) -> str:
    """Encrypt QR code data for security"""
    f = Fernet(QR_ENCRYPTION_KEY.encode())
    json_data = json.dumps(data)
    encrypted = f.encrypt(json_data.encode())
    return base64.urlsafe_b64encode(encrypted).decode()

def decrypt_qr_data(encrypted_data: str) -> dict:
    """Decrypt QR code data"""
    try:
        print(f"DEBUG: Attempting to decrypt: {encrypted_data[:50]}...")
        f = Fernet(QR_ENCRYPTION_KEY.encode())
        encrypted = base64.urlsafe_b64decode(encrypted_data.encode())
        print("DEBUG: Base64 decoded successfully")
        decrypted = f.decrypt(encrypted)
        print("DEBUG: Fernet decrypted successfully")
        result = json.loads(decrypted.decode())
        print(f"DEBUG: JSON parsed successfully: {result}")
        return result
    except Exception as e:
        print(f"DEBUG: Decryption failed with error: {e}")
        raise HTTPException(status_code=400, detail="Invalid QR code data")

def generate_qr_code_image(qr_content: str) -> str:
    """Generate QR code image as base64 string"""
    qr = qrcode.QRCode(
        version=1,
        error_correction=qrcode.constants.ERROR_CORRECT_L,
        box_size=10,
        border=4,
    )
    qr.add_data(qr_content)
    qr.make(fit=True)

    img = qr.make_image(fill_color="black", back_color="white")
    
    # Convert to base64
    buffer = io.BytesIO()
    img.save(buffer, format="PNG")
    img_base64 = base64.b64encode(buffer.getvalue()).decode()

    # Return plain base64 (frontend will prefix with data URI as needed)
    return img_base64

def get_creator_display_name(creator: User) -> str:
    """Get the appropriate display name for a group creator"""
    if not creator:
        return "Admin"
    
    if creator.is_admin:
        return "Admin"
    elif creator.is_supplier and creator.company_name:
        return creator.company_name
    else:
        return creator.full_name


@router.get("/{group_id}/qr-code")
async def get_group_qr_code(
    group_id: int,
    user: User = Depends(verify_trader),
    db: Session = Depends(get_db)
):
    """Generate and return a QR code (base64 PNG) for a user's pickup of a group-buy.
    
    Includes contribution details if user has a contribution in the group.

    Returns JSON with fields:
    - qr_code: base64 PNG (no data: prefix)
    - qr_content: encrypted payload used for validation
    - expires_at: ISO timestamp when QR expires
    - pickup_instructions: human readable pickup instructions/location
    - is_used: whether this QR code has been used for pickup
    - status: ready/used status
    - contribution_id: (optional) if user has a contribution
    - quantity: (optional) contribution quantity
    - product_name: (optional) product name
    - is_collected: (optional) collection status
    """
    try:
        # Check if user has a contribution in this group (for additional details)
        contribution = db.query(Contribution).filter(
            Contribution.group_buy_id == group_id,
            Contribution.user_id == user.id
        ).first()
        
        # First, check if user already has a QR code for this group
        # Get the most recent valid QR code for this group
        existing_qr = db.query(QRCodePickup).filter(
            QRCodePickup.user_id == user.id,
            QRCodePickup.group_buy_id == group_id,
            QRCodePickup.expires_at > datetime.utcnow()  # Only get non-expired QR codes
        ).order_by(QRCodePickup.generated_at.desc()).first()
        
        if existing_qr:
            print(f"DEBUG: Found existing valid QR code - ID: {existing_qr.id}, Used: {existing_qr.is_used}")
            # Return existing QR code with current status
            qr_image_base64 = generate_qr_code_image(existing_qr.qr_code_data)
            
            response = {
                # "qr_code_id": existing_qr.id,  # Removed - traders don't need this
                "qr_code": qr_image_base64,
                "qr_id": existing_qr.qr_code_data,
                "expires_at": existing_qr.expires_at.isoformat() + 'Z',
                "is_used": existing_qr.is_used,
                "used_at": existing_qr.used_at.isoformat() if existing_qr.used_at else None,
                "pickup_location": existing_qr.pickup_location,
                "status": "used" if existing_qr.is_used else "ready",
                "status_text": "Yes" if existing_qr.is_used else "No"
            }
            
            # Add contribution details if available
            if contribution:
                group_buy = db.query(GroupBuy).filter(GroupBuy.id == group_id).first()
                response["contribution_id"] = contribution.id
                response["quantity"] = contribution.quantity
                response["product_name"] = group_buy.product.name if (group_buy and group_buy.product) else "Unknown"
                response["is_collected"] = contribution.is_collected if hasattr(contribution, 'is_collected') else False
            
            return response
        
        # If no existing QR code, create a new one
        # Try to find the group in AdminGroup or GroupBuy tables
        group = db.query(AdminGroup).filter(AdminGroup.id == group_id).first()
        pickup_location = None

        if not group:
            # fallback to GroupBuy if present in the system models
            gb = db.query(GroupBuy).filter(GroupBuy.id == group_id).first()
            if not gb:
                raise HTTPException(status_code=404, detail="Group not found")

            # determine pickup location from group buy
            pickup_location = getattr(gb, 'location_zone', None) or 'Default Pickup Point'
            
        else:
            pickup_location = getattr(group, 'pickup_location', None) or getattr(group, 'location_zone', None) or 'Default Pickup Point'
            

        # Prepare payload to encode in the QR (contains minimal info)
        expires_at = (datetime.utcnow() + timedelta(hours=QR_EXPIRY_HOURS)).isoformat() + 'Z'
        payload = {
            "group_id": group_id,
            "user_id": user.id,
            "expires_at": expires_at,
            "issued_at": datetime.utcnow().isoformat() + 'Z'
        }

        qr_content = encrypt_qr_data(payload)
        # Generate a short ID for the QR code
        qr_id = "QR-" + secrets.token_hex(4).upper()
        
        # Store the QR data in database instead of cache
        qr_record = QRCodePickup(
            qr_code_data=qr_id,  # Store the QR ID as the data
            user_id=user.id,
            group_buy_id=group_id,
            pickup_location=pickup_location,
            expires_at=datetime.fromisoformat(expires_at.replace('Z', '+00:00')),
            is_used=False
        )
        db.add(qr_record)
        db.commit()
        db.refresh(qr_record)
        
        # Store encrypted data as used_location (temporary solution)
        qr_record.used_location = qr_content  # Store encrypted data here temporarily
        db.commit()
        
        print(f"DEBUG: Stored QR data in database - ID: {qr_id}, Record ID: {qr_record.id}")
        
        qr_image_base64 = generate_qr_code_image(qr_id)

        response = {
            # "qr_code_id": qr_record.id,  # Removed - traders don't need this
            "qr_code": qr_image_base64,
            "qr_id": qr_id,
            "expires_at": expires_at,
            "is_used": qr_record.is_used,
            "used_at": qr_record.used_at.isoformat() if qr_record.used_at else None,
            "pickup_location": pickup_location,
            "status": "used" if qr_record.is_used else "ready",
            "status_text": "Yes" if qr_record.is_used else "No"
        }
        
        # Add contribution details if available
        if contribution:
            group_buy = db.query(GroupBuy).filter(GroupBuy.id == group_id).first()
            response["contribution_id"] = contribution.id
            response["quantity"] = contribution.quantity
            response["product_name"] = group_buy.product.name if (group_buy and group_buy.product) else "Unknown"
            response["is_collected"] = contribution.is_collected if hasattr(contribution, 'is_collected') else False
        
        return response
    except HTTPException:
        raise
    except Exception as e:
        print(f"Error generating QR code for group {group_id}: {e}")
        raise HTTPException(status_code=500, detail="Failed to generate QR code")

@router.get("/my-groups")
async def get_my_groups(
    user: User = Depends(verify_trader),
    db: Session = Depends(get_db)
):
    """Get all groups the current user has joined"""
    try:
        groups_data = []
        
        # Get user's contributions and the associated group buys (GroupBuy groups)
        contributions = db.query(Contribution).filter(
            Contribution.user_id == user.id
        ).all()
        
        for contrib in contributions:
            group_buy = contrib.group_buy
            if group_buy:
                # Get pickup location for this group
                pickup_location = "Downtown Market"  # Default
                if hasattr(group_buy, 'location_zone'):
                    if group_buy.location_zone == "Downtown":
                        pickup_location = "Downtown Market"
                    elif group_buy.location_zone == "Uptown":
                        pickup_location = "Uptown Market"
                    elif group_buy.location_zone == "Suburbs":
                        pickup_location = "Suburban Collection Point"
                    else:
                        pickup_location = f"{group_buy.location_zone} Market"
                
                # Calculate progress
                progress = f"{group_buy.total_quantity}/{group_buy.product.moq} ({group_buy.moq_progress:.1f}%)"
                
                # Format due date
                due_date = group_buy.deadline.strftime("%b %d, %Y") if group_buy.deadline else "No deadline"
                
                # Determine status based on group state and supplier status
                if group_buy.status == "cancelled" or group_buy.supplier_status == "supplier_rejected":
                    status = "cancelled"
                    order_status = "Cancelled - Refund processing" if contrib.refund_status == "pending" else "Cancelled"
                elif group_buy.supplier_status == "ready_for_collection":
                    status = "ready_for_pickup"
                    order_status = "Ready for pickup - Generate QR code"
                elif group_buy.supplier_status == "collected":
                    status = "collected"
                    order_status = "Collected"
                elif group_buy.supplier_status == "supplier_accepted":
                    status = "in_fulfillment"
                    order_status = "Accepted by supplier - In fulfillment"
                elif group_buy.supplier_status == "pending_supplier":
                    status = "pending_supplier"
                    order_status = "Waiting for supplier confirmation"
                elif group_buy.status == "completed":
                    status = "completed"
                    order_status = "Completed - Processing"
                elif group_buy.status == "active" and group_buy.moq_progress >= 100:
                    status = "payment_pending"
                    order_status = "Payment pending"
                elif group_buy.status == "active":
                    status = "active"
                    order_status = "Active - collecting participants"
                else:
                    status = "unknown"
                    order_status = "Status unknown"
                
                # Determine if group is completed (ready for pickup or delivered)
                is_completed = status in ["ready_for_pickup", "completed", "delivered", "collected"]
                
                group_data = {
                    "id": group_buy.id,
                    "name": group_buy.product.name,
                    "product_name": group_buy.product.name,  # Add for frontend compatibility
                    "product_image_url": group_buy.product.image_url,  # Add for frontend compatibility
                    "description": group_buy.product.description or f"Group buy for {group_buy.product.name}",
                    "price": f"${group_buy.product.bulk_price:.2f}",
                    "originalPrice": f"${group_buy.product.unit_price:.2f}",
                    "image": group_buy.product.image_url or "https://via.placeholder.com/300x200?text=Product",
                    "status": status,
                    "is_completed": is_completed,  # For frontend filtering
                    "progress": progress,
                    "dueDate": due_date,
                    "pickupLocation": pickup_location,
                    "orderStatus": order_status,
                    "savings": f"${(group_buy.product.unit_price - group_buy.product.bulk_price):.2f}",
                    "participants": group_buy.participants_count,
                    "maxParticipants": group_buy.product.moq,
                    "created": group_buy.created_at.strftime("%b %d, %Y") if group_buy.created_at else "",
                    "matchScore": 95,  # Default high score for joined groups
                    "reason": "You joined this group",
                    "adminCreated": True,
                    "adminName": get_creator_display_name(group_buy.creator),
                    "discountPercentage": int(group_buy.product.savings_factor * 100),
                    "shippingInfo": "Free shipping when group goal is reached",
                    "estimatedDelivery": "2-3 weeks after group completion",
                    "features": ["Bulk pricing", "Quality guaranteed", "Group savings"],
                    "requirements": [f"Minimum {group_buy.product.moq} participants required"],
                    "longDescription": group_buy.product.description or f"Join this group buy to get {group_buy.product.name} at discounted bulk pricing.",
                    "category": group_buy.product.category or "General",
                    "endDate": group_buy.deadline.strftime("%Y-%m-%dT%H:%M:%SZ") if group_buy.deadline else None,
                    "quantity": contrib.quantity,  # Add user's quantity
                    "total_paid": round(contrib.paid_amount or 0, 2),  # User's contribution amount
                    # Money tracking (primary)
                    "current_amount": round(group_buy.current_amount, 2),
                    "target_amount": round(group_buy.target_amount, 2),
                    "amount_progress": round(group_buy.amount_progress, 1),
                    # Supplier workflow fields
                    "supplierStatus": group_buy.supplier_status,
                    "supplierResponseAt": group_buy.supplier_response_at.isoformat() if group_buy.supplier_response_at else None,
                    "readyForCollectionAt": group_buy.ready_for_collection_at.isoformat() if group_buy.ready_for_collection_at else None,
                    "supplierNotes": group_buy.supplier_notes,
                    # Contribution tracking
                    "contributionId": contrib.id,
                    "isCollected": contrib.is_collected,
                    "collectedAt": contrib.collected_at.isoformat() if contrib.collected_at else None,
                    "hasQRCode": bool(contrib.qr_code_token),
                    "refundStatus": contrib.refund_status,
                    "refundedAt": contrib.refunded_at.isoformat() if contrib.refunded_at else None
                }
                groups_data.append(group_data)
        
        # Get user's AdminGroup joins (AdminGroup groups)
        admin_group_joins = db.query(AdminGroupJoin).filter(
            AdminGroupJoin.user_id == user.id
        ).all()
        
        for join in admin_group_joins:
            admin_group = join.admin_group
            if admin_group:
                # Get pickup location for this admin group
                pickup_location = admin_group.shipping_info or "Downtown Market"  # Default
                
                # Calculate progress
                progress = f"{admin_group.participants}/{admin_group.max_participants or 'unlimited'}"
                
                # Format due date
                due_date = admin_group.end_date.strftime("%b %d, %Y") if admin_group.end_date else "No deadline"
                
                # Determine status based on admin group state and associated SupplierOrder
                supplier_order = db.query(SupplierOrder).filter(SupplierOrder.admin_group_id == admin_group.id).first()
                
                # Debug logging for trader status
                logger.info(f"🔍 Trader group status check for '{admin_group.name}' (ID: {admin_group.id})")
                logger.info(f"   SupplierOrder exists: {supplier_order is not None}")
                if supplier_order:
                    logger.info(f"   SupplierOrder status: {supplier_order.status}")
                    logger.info(f"   SupplierOrder ID: {supplier_order.id}")
                
                # Check if THIS SPECIFIC TRADER's QR code has been used
                user_qr_collected = db.query(QRCodePickup).filter(
                    QRCodePickup.user_id == user.id,
                    QRCodePickup.group_buy_id == admin_group.id,
                    QRCodePickup.is_used == True
                ).first() is not None
                
                logger.info(f"   User {user.id} has collected: {user_qr_collected}")
                
                # Determine status - CHECK INDIVIDUAL COLLECTION FIRST
                # Individual trader's collection status takes precedence
                if user_qr_collected:
                    # THIS trader has collected their product
                    status = "completed"
                    order_status = "Completed - Item collected"
                    logger.info(f"   ✅ Setting trader status to: completed (user has collected)")
                elif supplier_order and (supplier_order.status in ["ready_for_pickup", "delivered", "completed"]):
                    status = "ready_for_pickup"
                    order_status = "Ready for pickup - Generate QR code"
                    logger.info(f"   ✅ Setting trader status to: ready_for_pickup")
                elif supplier_order and supplier_order.status in ["pending", "confirmed"]:
                    # Order exists but not yet ready for pickup
                    status = "active"
                    order_status = "Processing - Order confirmed"
                    logger.info(f"   🟢 Setting trader status to: active (order pending)")
                elif not admin_group.is_active and not supplier_order:
                    # Only show as cancelled if inactive AND no order exists
                    status = "cancelled"
                    order_status = "Cancelled"
                    logger.info(f"   ⚠️  Setting trader status to: cancelled")
                elif admin_group.end_date and admin_group.end_date < datetime.utcnow():
                    status = "completed"
                    order_status = "Completed - Ready for pickup"
                    logger.info(f"   📋 Setting trader status to: completed")
                else:
                    status = "active"
                    order_status = "Active - Payment completed"
                    logger.info(f"   🟢 Setting trader status to: active")
                
                # Calculate financial metrics for AdminGroup
                target_amount = admin_group.price * admin_group.max_participants
                # Calculate actual current amount from all joins (quantity * price is more accurate)
                total_quantity_sum = db.query(func.sum(AdminGroupJoin.quantity)).filter(
                    AdminGroupJoin.admin_group_id == admin_group.id
                ).scalar() or 0
                current_amount = float(total_quantity_sum) * admin_group.price
                amount_progress = (current_amount / target_amount * 100) if target_amount > 0 else 0
                
                # Determine if group is completed (ready for pickup or delivered)
                is_completed = status in ["ready_for_pickup", "completed", "delivered", "collected"]
                
                group_data = {
                    "id": admin_group.id,
                    "name": admin_group.name,
                    "product_name": admin_group.name,  # Add for frontend compatibility
                    "product_image_url": admin_group.image,  # Add for frontend compatibility
                    "description": admin_group.description or f"Admin group buy for {admin_group.name}",
                    "price": f"${admin_group.price:.2f}",
                    "originalPrice": f"${admin_group.original_price:.2f}",
                    "image": admin_group.image or "https://via.placeholder.com/300x200?text=Product",
                    "status": status,
                    "is_completed": is_completed,  # For frontend filtering
                    "progress": progress,
                    "dueDate": due_date,
                    "pickupLocation": pickup_location,
                    "orderStatus": order_status,
                    "savings": f"${admin_group.savings:.2f}",
                    "participants": admin_group.participants,
                    "maxParticipants": admin_group.max_participants,
                    "created": admin_group.created.strftime("%b %d, %Y") if admin_group.created else "",
                    "matchScore": 95,  # Default high score for joined groups
                    "reason": "You joined this admin group",
                    "adminCreated": True,
                    "adminName": admin_group.admin_name or "Admin",
                    "discountPercentage": admin_group.discount_percentage,
                    "shippingInfo": admin_group.shipping_info or "Pickup at designated location",
                    "estimatedDelivery": admin_group.estimated_delivery or "2-3 weeks after group completion",
                    "features": admin_group.features or ["Bulk pricing", "Quality guaranteed", "Group savings"],
                    "requirements": admin_group.requirements or [],
                    "longDescription": admin_group.long_description or admin_group.description,
                    "category": admin_group.category or "General",
                    "endDate": admin_group.end_date.strftime("%Y-%m-%dT%H:%M:%SZ") if admin_group.end_date else None,
                    "quantity": join.quantity,  # Add user's quantity
                    # Always calculate from quantity * price to ensure accuracy
                    "total_paid": round(admin_group.price * join.quantity, 2),  # User's total contribution
                    # Money tracking (same as GroupBuy for consistency)
                    "current_amount": round(current_amount, 2),
                    "target_amount": round(target_amount, 2),
                    "amount_progress": round(amount_progress, 1)
                }
                groups_data.append(group_data)
        
        # For admin users, also include all completed groups (for testing purposes)
        # Actually, let's show all completed groups for everyone during testing
        # Get all completed groups that user hasn't already joined
        completed_groups = db.query(GroupBuy).filter(
            GroupBuy.status == "completed"
        ).all()
        
        user_joined_group_ids = {contrib.group_buy_id for contrib in contributions}
        
        for group_buy in completed_groups:
            if group_buy.id not in user_joined_group_ids:
                # Get pickup location for this group
                pickup_location = "Downtown Market"  # Default
                if hasattr(group_buy, 'location_zone'):
                    if group_buy.location_zone == "Downtown":
                        pickup_location = "Downtown Market"
                    elif group_buy.location_zone == "Uptown":
                        pickup_location = "Uptown Market"
                    elif group_buy.location_zone == "Suburbs":
                        pickup_location = "Suburban Collection Point"
                    else:
                        pickup_location = f"{group_buy.location_zone} Market"
                
                # Calculate progress
                progress = f"{group_buy.total_quantity}/{group_buy.product.moq} ({group_buy.moq_progress:.1f}%)"
                
                # Format due date
                due_date = group_buy.deadline.strftime("%b %d, %Y") if group_buy.deadline else "No deadline"
                
                group_data = {
                    "id": group_buy.id,
                    "name": group_buy.product.name,
                    "description": group_buy.product.description or f"Group buy for {group_buy.product.name}",
                    "price": f"${group_buy.product.bulk_price:.2f}",
                    "originalPrice": f"${group_buy.product.unit_price:.2f}",
                    "image": group_buy.product.image_url or "https://via.placeholder.com/300x200?text=Product",
                    "status": "ready_for_pickup",  # All completed groups are ready for pickup
                    "progress": progress,
                    "dueDate": due_date,
                    "pickupLocation": pickup_location,
                    "orderStatus": "Ready for pickup (Testing)",
                    "savings": f"${(group_buy.product.unit_price - group_buy.product.bulk_price):.2f}",
                    "participants": group_buy.participants_count,
                    "maxParticipants": group_buy.product.moq,
                    "created": group_buy.created_at.strftime("%b %d, %Y") if group_buy.created_at else "",
                    "matchScore": 95,
                    "reason": "Completed group (Testing)",
                    "adminCreated": True,
                    "adminName": get_creator_display_name(group_buy.creator),
                    "discountPercentage": int(group_buy.product.savings_factor * 100),
                    "shippingInfo": "Free shipping when group goal is reached",
                    "estimatedDelivery": "2-3 weeks after group completion",
                    "features": ["Bulk pricing", "Quality guaranteed", "Group savings"],
                    "requirements": [f"Minimum {group_buy.product.moq} participants required"],
                    "longDescription": group_buy.product.description or f"Join this group buy to get {group_buy.product.name} at discounted bulk pricing.",
                    "category": group_buy.product.category or "General",
                    "endDate": group_buy.deadline.strftime("%Y-%m-%dT%H:%M:%SZ") if group_buy.deadline else None,
                    # Money tracking (primary)
                    "current_amount": round(group_buy.current_amount, 2),
                    "target_amount": round(group_buy.target_amount, 2),
                    "amount_progress": round(group_buy.amount_progress, 1)
                }
                groups_data.append(group_data)
        
        return groups_data
        
    except Exception as e:
        print(f"Error getting user groups: {e}")
        raise HTTPException(status_code=500, detail=f"Error retrieving groups: {str(e)}")


@router.get("/refunds")
async def get_my_refunds(
    user: User = Depends(verify_token),
    db: Session = Depends(get_db)
):
    """Get all refunds for the current user"""
    from services.refund_service import RefundService
    
    refunds = RefundService.get_user_refunds(db, user.id)
    return {"refunds": refunds}

@router.get("/past-groups-summary")
async def get_past_groups_summary(
    user: User = Depends(verify_token),
    db: Session = Depends(get_db)
):
    """Get summary statistics for user's past group participation"""
    try:
        # Get all completed groups the user participated in
        completed_contributions = db.query(Contribution).filter(
            Contribution.user_id == user.id,
            Contribution.is_fully_paid
        ).join(GroupBuy).filter(
            GroupBuy.status == "completed"
        ).all()
        
        if not completed_contributions:
            return {
                "completed_groups": 0,
                "all_time_savings": 0.0,
                "success_rate": 0.0,
                "avg_savings_per_group": 0.0
            }
        
        completed_groups = len(completed_contributions)
        
        # Calculate total savings
        total_savings = 0.0
        successful_groups = 0
        
        for contrib in completed_contributions:
            if contrib.group_buy and contrib.group_buy.product:
                # Savings per unit * quantity contributed
                unit_savings = contrib.group_buy.product.unit_price - contrib.group_buy.product.bulk_price
                total_savings += unit_savings * contrib.quantity
                
                # Count as successful if group reached MOQ
                if contrib.group_buy.moq_progress >= 100:
                    successful_groups += 1
        
        # Calculate success rate
        success_rate = (successful_groups / completed_groups) * 100 if completed_groups > 0 else 0
        
        # Calculate average savings per group
        avg_savings_per_group = total_savings / completed_groups if completed_groups > 0 else 0
        return {
            "completed_groups": completed_groups,
            "all_time_savings": round(total_savings, 2),
            "success_rate": round(success_rate, 1),
            "avg_savings_per_group": round(avg_savings_per_group, 2)
        }
        
    except Exception as e:
        print(f"Error getting past groups summary: {e}")
        raise HTTPException(status_code=500, detail=f"Error retrieving summary: {str(e)}")

@router.get(
    "/",
    response_model=List[GroupResponse],
    summary="Get All Active Groups",
    description="""
    Retrieve all active group-buy opportunities (both admin-created and user-created).

    Returns a list of groups with basic information including pricing, participants,
    and availability status. Groups are filtered to show only active ones.
    """,
    response_description="List of active group-buy opportunities",
    tags=["Groups"]
)
async def get_all_groups(
    db: Session = Depends(get_db),
    current_user: User = Depends(verify_token)
):
    """Get all active groups for browsing (both AdminGroups and GroupBuy groups)"""
    result = []
    
    # Get active AdminGroups
    admin_groups = db.query(AdminGroup).filter(AdminGroup.is_active).all()
    for group in admin_groups:
        # Check if user has joined this admin group
        joined = db.query(AdminGroupJoin).filter(
            AdminGroupJoin.admin_group_id == group.id,
            AdminGroupJoin.user_id == current_user.id
        ).first() is not None
        
        # Calculate money tracking for AdminGroups
        target_amount = group.price * group.max_participants
        # Calculate current amount from all joins (quantity * price is more accurate)
        total_quantity_sum = db.query(func.sum(AdminGroupJoin.quantity)).filter(
            AdminGroupJoin.admin_group_id == group.id
        ).scalar() or 0
        current_amount = float(total_quantity_sum) * group.price
        
        # Calculate dynamic status based on deadline and progress
        now = datetime.utcnow()
        if group.end_date and group.end_date < now:
            # Group deadline has passed
            if group.participants >= group.max_participants:
                group_status = "completed"
                order_status = "Completed - Ready for fulfillment"
            else:
                group_status = "expired"
                order_status = "Expired - Goal not reached"
        elif group.participants >= group.max_participants:
            # Goal reached, still within deadline
            group_status = "ready_for_payment"
            order_status = "Goal reached - Ready for payment"
        else:
            # Still active and accepting participants
            group_status = "active"
            order_status = "Open for joining"
        
        result.append(GroupResponse(
            id=group.id,
            name=group.name,
            price=group.price,
            image_url=group.image,
            description=group.description,
            participants=group.participants,
            moq=group.max_participants,
            category=group.category,
            created=group.created.isoformat(),
            maxParticipants=group.max_participants,
            originalPrice=group.original_price,
            endDate=group.end_date.isoformat() if group.end_date else None,
            matchScore=85,  # Default match score
            reason="Admin-created group buy",
            adminCreated=True,
            adminName=group.admin_name,
            savings=group.savings,
            discountPercentage=group.discount_percentage,
            shippingInfo=group.shipping_info,
            estimatedDelivery=group.estimated_delivery,
            features=json.loads(group.features) if isinstance(group.features, str) else (group.features or []),
            requirements=json.loads(group.requirements) if isinstance(group.requirements, str) else (group.requirements or []),
            longDescription=group.long_description,
            status=group_status,
            orderStatus=order_status,
            joined=joined,
            current_amount=current_amount,
            target_amount=target_amount
        ))
    
    # Get all GroupBuy groups (not just active ones - we'll filter by status dynamically)
    group_buy_groups = db.query(GroupBuy).join(GroupBuy.product).all()
    
    for group in group_buy_groups:
        # Calculate participants count
        participants_count = db.query(Contribution).filter(
            Contribution.group_buy_id == group.id
        ).count()
        
        # Check if user has joined this group buy
        joined = db.query(Contribution).filter(
            Contribution.group_buy_id == group.id,
            Contribution.user_id == current_user.id
        ).first() is not None
        
        # Calculate dynamic status
        now = datetime.utcnow()
        moq = group.product.moq if group.product else 10
        
        if group.deadline < now:
            # Deadline has passed
            if participants_count >= moq:
                group_status = "completed"
                order_status = "Completed - Ready for fulfillment"
            else:
                group_status = "expired"
                order_status = "Expired - Minimum order not reached"
        elif participants_count >= moq:
            # MOQ reached, still within deadline
            group_status = "ready_for_payment"
            order_status = "Goal reached - Ready for payment"
        else:
            # Still active
            group_status = "active"
            order_status = "Open for joining"
        
        # Only include active, ready_for_payment, and recently completed groups (not expired or old completed)
        if group_status in ["active", "ready_for_payment", "completed"]:
            if group_status == "completed" and (now - group.deadline).days > 30:
                # Skip old completed groups (older than 30 days)
                continue
                
            result.append(GroupResponse(
                id=group.id,
                name=group.product.name if group.product else f"Group Buy #{group.id}",
                price=group.product.bulk_price if group.product else 0,
                image_url=group.product.image_url if group.product and group.product.image_url else "https://via.placeholder.com/300x200?text=Product",
                description=group.product.description if group.product else "User-created group buy",
                participants=participants_count,
                moq=moq,
                category=group.product.category if group.product else "General",
                created=group.created_at.isoformat(),
                maxParticipants=None,  # GroupBuy doesn't have max participants
                originalPrice=group.product.unit_price if group.product else 0,
                endDate=group.deadline.isoformat(),
                matchScore=75,  # Default match score for user-created groups
                reason="User-created group buy",
                adminCreated=False,
                adminName=get_creator_display_name(group.creator),
                savings=(group.product.unit_price - group.product.bulk_price) if group.product else 0,
                discountPercentage=round(group.product.savings_factor * 100) if group.product else 0,
                shippingInfo="Pickup at designated location",
                estimatedDelivery="2-3 weeks after group completion",
                features=["Bulk pricing", "Community driven", "Flexible quantities"],
                requirements=[f"Minimum {moq} total units required"],
                longDescription=group.product.description if group.product else f"Join this community group buy for {group.product.name if group.product else 'quality products'} at bulk prices.",
                status=group_status,
                orderStatus=order_status,
                joined=joined,
                current_amount=round(group.current_amount, 2),
                target_amount=round(group.target_amount, 2)
            ))
    
    return result

@router.get(
    "/{group_id}",
    response_model=GroupDetailResponse,
    summary="Get Group Details",
    description="""
    Retrieve detailed information about a specific group-buy opportunity.

    Includes comprehensive information such as features, requirements, shipping details,
    and participant information. Used by the group detail page.
    """,
    response_description="Detailed group information including all specifications",
    tags=["Groups"],
    responses={
        200: {
            "description": "Group details retrieved successfully",
            "content": {
                "application/json": {
                    "example": {
                        "id": 1,
                        "name": "Bulk Rice Purchase",
                        "price": 150.00,
                        "originalPrice": 180.00,
                        "image": "/uploads/group_1.jpg",
                        "description": "High-quality rice for traders",
                        "longDescription": "Premium long-grain rice perfect for bulk reselling in local markets",
                        "participants": 5,
                        "maxParticipants": 20,
                        "category": "Food & Staples",
                        "created": "2024-01-15T10:30:00",
                        "endDate": "2024-01-30T23:59:59",
                        "matchScore": 85,
                        "reason": "High demand product with good profit margins",
                        "adminCreated": True,
                        "adminName": "Admin",
                        "savings": 30.00,
                        "discountPercentage": 17,
                        "shippingInfo": "Free delivery within Harare CBD",
                        "estimatedDelivery": "2024-02-05",
                        "features": ["Premium quality", "Bulk packaging", "Market ready"],
                        "requirements": ["Valid trading license", "Minimum order 10kg"]
                    }
                }
            }
        },
        404: {"description": "Group not found"},
        403: {"description": "Not authorized to view this group"}
    }
)
async def get_group_detail(
    group_id: int,
    db: Session = Depends(get_db)
):
    """Get detailed information about a specific group (AdminGroup or GroupBuy)"""
    
    # First try to find as AdminGroup
    admin_group = db.query(AdminGroup).filter(AdminGroup.id == group_id).first()
    if admin_group:
        # Calculate money tracking for AdminGroups
        target_amount = admin_group.price * admin_group.max_participants
        # Calculate current amount from all joins (quantity * price is more accurate)
        total_quantity_sum = db.query(func.sum(AdminGroupJoin.quantity)).filter(
            AdminGroupJoin.admin_group_id == admin_group.id
        ).scalar() or 0
        current_amount = float(total_quantity_sum) * admin_group.price
        
        return GroupDetailResponse(
            id=admin_group.id,
            name=admin_group.name,
            price=admin_group.price,
            originalPrice=admin_group.original_price,
            image_url=admin_group.image,
            description=admin_group.description,
            longDescription=admin_group.long_description or admin_group.description,
            participants=admin_group.participants,
            maxParticipants=admin_group.max_participants,
            category=admin_group.category,
            created=admin_group.created.isoformat(),
            endDate=admin_group.end_date.isoformat(),
            matchScore=85,  # Default match score
            reason="Admin-created group buy",
            adminCreated=True,
            adminName=admin_group.admin_name,  # For AdminGroups, this is already set correctly
            savings=admin_group.savings,
            discountPercentage=admin_group.discount_percentage,
            shippingInfo=admin_group.shipping_info,
            estimatedDelivery=admin_group.estimated_delivery,
            features=admin_group.features or [],
            requirements=admin_group.requirements or [],
            current_amount=current_amount,
            target_amount=target_amount,
            product=ProductInfo(
                name=admin_group.product_name or admin_group.name,
                description=admin_group.product_description or admin_group.description,
                manufacturer=admin_group.manufacturer,
                totalStock=admin_group.total_stock,
                regularPrice=admin_group.original_price
            )
        )
    
    # If not AdminGroup, try GroupBuy
    group_buy = db.query(GroupBuy).join(GroupBuy.product).filter(GroupBuy.id == group_id).first()
    if group_buy:
        # Calculate participants count
        participants_count = db.query(Contribution).filter(
            Contribution.group_buy_id == group_id
        ).count()
        
        # Calculate progress
        progress_percentage = group_buy.moq_progress
        remaining_needed = max(0, group_buy.product.moq - group_buy.total_quantity) if group_buy.product else 0
        
        return GroupDetailResponse(
            id=group_buy.id,
            name=group_buy.product.name if group_buy.product else f"Group Buy #{group_buy.id}",
            price=group_buy.product.bulk_price if group_buy.product else 0,
            originalPrice=group_buy.product.unit_price if group_buy.product else 0,
            image_url=group_buy.product.image_url if group_buy.product and group_buy.product.image_url else "https://via.placeholder.com/300x200?text=Product",
            description=group_buy.product.description if group_buy.product else "User-created group buy",
            longDescription=group_buy.product.description if group_buy.product else "Join this community group buy for quality products at bulk prices.",
            participants=participants_count,
            maxParticipants=group_buy.product.moq if group_buy.product else None,
            category=group_buy.product.category if group_buy.product else "General",
            created=group_buy.created_at.isoformat(),
            endDate=group_buy.deadline.isoformat(),
            matchScore=75,  # Default match score for user-created groups
            reason="User-created group buy",
            adminCreated=False,
            adminName=get_creator_display_name(group_buy.creator),
            savings=(group_buy.product.unit_price - group_buy.product.bulk_price) if group_buy.product else 0,
            discountPercentage=round(group_buy.product.savings_factor * 100) if group_buy.product else 0,
            shippingInfo="Pickup at designated location",
            estimatedDelivery="2-3 weeks after group completion",
            features=["Bulk pricing", "Community driven", "Flexible quantities"],
            requirements=[f"Minimum {group_buy.product.moq if group_buy.product else 10} total units required"],
            product=ProductInfo(
                name=group_buy.product.name if group_buy.product else f"Group Buy #{group_buy.id}",
                description=group_buy.product.description if group_buy.product else "User-created group buy",
                manufacturer=group_buy.product.manufacturer if group_buy.product else None,
                totalStock=group_buy.product.total_stock if group_buy.product else None,
                regularPrice=group_buy.product.unit_price if group_buy.product else 0
            ),
            progressPercentage=progress_percentage,
            remainingNeeded=remaining_needed,
            current_amount=round(group_buy.current_amount, 2),
            target_amount=round(group_buy.target_amount, 2),
            amount_progress=round(group_buy.amount_progress, 1)
        )
    
    # If neither found
    raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Group not found")

@router.put("/{group_id}/contribution")
async def update_contribution(
    group_id: int,
    request: UpdateContributionRequest,
    user: User = Depends(verify_trader),
    db: Session = Depends(get_db)
):
    """Update the user's contribution quantity for a group-buy.

    Allows users to increase their quantity commitment to a group they're already part of.
    Only works for active groups and quantities greater than current contribution.
    """
    try:
        # Find the user's existing contribution for this group
        contribution = db.query(Contribution).filter(
            Contribution.group_buy_id == group_id,
            Contribution.user_id == user.id
        ).first()

        if not contribution:
            raise HTTPException(
                status_code=status.HTTP_404_NOT_FOUND,
                detail="You haven't joined this group yet"
            )

        # Check if group is still active
        group_buy = contribution.group_buy
        if group_buy.status != "active":
            raise HTTPException(
                status_code=status.HTTP_400_BAD_REQUEST,
                detail="Cannot update contribution for non-active groups"
            )

        # Validate new quantity
        if request.quantity <= 0:
            raise HTTPException(
                status_code=status.HTTP_400_BAD_REQUEST,
                detail="Quantity must be greater than 0"
            )

        if request.quantity <= contribution.quantity:
            raise HTTPException(
                status_code=status.HTTP_400_BAD_REQUEST,
                detail="New quantity must be greater than current quantity"
            )

        # Calculate the additional amount needed
        additional_quantity = request.quantity - contribution.quantity
        unit_price = group_buy.product.bulk_price
        additional_amount = additional_quantity * unit_price

        # Update contribution
        old_quantity = contribution.quantity

        contribution.quantity = request.quantity
        contribution.contribution_amount = request.quantity * unit_price

        # Update group totals
        group_buy.total_quantity += additional_quantity
        group_buy.total_contributions += additional_amount

        db.commit()

        return {
            "message": "Contribution updated successfully",
            "old_quantity": old_quantity,
            "new_quantity": request.quantity,
            "additional_quantity": additional_quantity,
            "additional_amount": round(additional_amount, 2),
            "group_progress": round(group_buy.moq_progress, 1)
        }

    except HTTPException:
        raise
    except Exception as e:
        print(f"Error updating contribution for group {group_id}: {e}")
        db.rollback()
        raise HTTPException(status_code=500, detail="Failed to update contribution")

@router.post("/{group_id}/join")
async def join_group(
    group_id: int,
    request: JoinGroupRequest,
    user: User = Depends(verify_trader),
    db: Session = Depends(get_db)
):
    """Join a group-buy by creating a contribution or join record with Flutterwave payment integration.

    Allows users to join an active group-buy by specifying quantity and delivery preferences.
    Handles both AdminGroup and GroupBuy groups.
    Initiates payment via Flutterwave and confirms join after payment.
    """
    from payment.flutterwave_service import flutterwave_service
    import uuid
    
    try:
        # First, try to find the group as an AdminGroup
        admin_group = db.query(AdminGroup).filter(
            AdminGroup.id == group_id,
            AdminGroup.is_active
        ).first()

        if admin_group:
            # Handle AdminGroup join
            # Check if user has already joined this group
            existing_join = db.query(AdminGroupJoin).filter(
                AdminGroupJoin.user_id == user.id,
                AdminGroupJoin.admin_group_id == group_id
            ).first()

            if existing_join:
                raise HTTPException(
                    status_code=status.HTTP_400_BAD_REQUEST,
                    detail="You have already joined this group"
                )

            # Validate quantity
            if request.quantity <= 0:
                raise HTTPException(
                    status_code=status.HTTP_400_BAD_REQUEST,
                    detail="Quantity must be greater than 0"
                )

            # Check stock availability
            if admin_group.total_stock is not None and admin_group.total_stock <= 0:
                raise HTTPException(
                    status_code=status.HTTP_400_BAD_REQUEST,
                    detail="This product is out of stock"
                )

            # Check if requested quantity exceeds available stock
            if admin_group.total_stock is not None and request.quantity > admin_group.total_stock:
                raise HTTPException(
                    status_code=status.HTTP_400_BAD_REQUEST,
                    detail=f"Requested quantity ({request.quantity}) exceeds available stock ({admin_group.total_stock})"
                )

            # Check if group has space (if max_participants is set)
            if admin_group.max_participants and admin_group.participants >= admin_group.max_participants:
                raise HTTPException(
                    status_code=status.HTTP_400_BAD_REQUEST,
                    detail="Group is full"
                )

            # Calculate contribution amount
            contribution_amount = request.quantity * admin_group.price
            # For now, require full payment upfront (can adjust to 50% later)
            payment_amount = contribution_amount
            
            # Initialize Flutterwave payment
            tx_ref = f"admin_group_{group_id}_user_{user.id}_{uuid.uuid4().hex[:8]}"
            
            try:
                payment_result = flutterwave_service.initialize_payment(
                    amount=payment_amount,
                    email=user.email,
                    tx_ref=tx_ref,
                    currency="USD",
                    redirect_url=f"{os.getenv('BACKEND_URL', 'http://localhost:8000')}/api/payment/callback?group_id={group_id}"
                )
                
                # Check if payment initialization was successful
                payment_status = payment_result.get("status")
                
                # If payment initialization failed, reject the join
                if payment_status != "success":
                    error_message = payment_result.get("message", "Payment initialization failed")
                    logger.error(f"[JOIN GROUP] Payment failed for group {group_id}, user {user.id}: {error_message}")
                    raise HTTPException(
                        status_code=status.HTTP_402_PAYMENT_REQUIRED,
                        detail=f"Payment initialization failed: {error_message}. Please check your payment credentials or contact support."
                    )
                
                transaction_id = payment_result.get("data", {}).get("id", tx_ref)
                payment_link = payment_result.get("data", {}).get("link")
                
            except HTTPException:
                raise
            except Exception as e:
                logger.error(f"[JOIN GROUP] Payment exception for group {group_id}: {e}")
                raise HTTPException(
                    status_code=status.HTTP_402_PAYMENT_REQUIRED,
                    detail="Payment service unavailable. Please try again later or contact support."
                )

            # Create PENDING join record (not the real join yet!)
            # The actual join will be created after payment confirmation
            from models.models import PendingJoin
            
            # Check if there's already a pending join for this user/group
            existing_pending = db.query(PendingJoin).filter(
                PendingJoin.user_id == user.id,
                PendingJoin.group_id == group_id,
                PendingJoin.group_type == "admin_group",
                PendingJoin.payment_status == "pending"
            ).first()
            
            if existing_pending:
                # Update existing pending join with new payment details
                existing_pending.tx_ref = tx_ref
                existing_pending.payment_amount = payment_amount
                existing_pending.quantity = request.quantity
                existing_pending.delivery_method = request.delivery_method
                existing_pending.special_instructions = request.special_instructions
                existing_pending.expires_at = datetime.utcnow() + timedelta(minutes=30)
                pending_join = existing_pending
            else:
                # Create new pending join
                pending_join = PendingJoin(
                    user_id=user.id,
                    group_id=group_id,
                    group_type="admin_group",
                    quantity=request.quantity,
                    delivery_method=request.delivery_method,
                    payment_method="flutterwave",
                    special_instructions=request.special_instructions,
                    tx_ref=tx_ref,
                    payment_amount=payment_amount,
                    payment_status="pending",
                    expires_at=datetime.utcnow() + timedelta(minutes=30)
                )
                db.add(pending_join)
            
            db.commit()
            
            logger.info(f"[JOIN GROUP] Created pending join for user {user.id}, group {group_id}, tx_ref: {tx_ref}")

            return {
                "message": "Payment initialized! Please complete payment to join the group.",
                "pending_join_id": pending_join.id,
                "quantity": request.quantity,
                "payment_amount": round(payment_amount, 2),
                "payment_status": "pending",
                "transaction_id": transaction_id,
                "tx_ref": tx_ref,  # Frontend needs this
                "payment_url": payment_link,  # Frontend needs this
                "group_progress": f"{admin_group.participants}/{admin_group.max_participants or 'unlimited'}"
            }

        # If not an AdminGroup, try GroupBuy
        group_buy = db.query(GroupBuy).join(GroupBuy.product).filter(
            GroupBuy.id == group_id,
            GroupBuy.status == "active",
            GroupBuy.deadline > datetime.utcnow()
        ).first()

        if group_buy:
            # Check if user has already joined this group
            existing_contribution = db.query(Contribution).filter(
                Contribution.user_id == user.id,
                Contribution.group_buy_id == group_id
            ).first()

            if existing_contribution:
                raise HTTPException(
                    status_code=status.HTTP_400_BAD_REQUEST,
                    detail="You have already joined this group"
                )

            # Validate quantity
            if request.quantity <= 0:
                raise HTTPException(
                    status_code=status.HTTP_400_BAD_REQUEST,
                    detail="Quantity must be greater than 0"
                )

            # Calculate contribution amount
            contribution_amount = request.quantity * group_buy.product.bulk_price
            payment_amount = contribution_amount  # Full payment upfront
            
            # Initialize Flutterwave payment
            tx_ref = f"group_buy_{group_id}_user_{user.id}_{uuid.uuid4().hex[:8]}"
            
            try:
                payment_result = flutterwave_service.initialize_payment(
                    amount=payment_amount,
                    email=user.email,
                    tx_ref=tx_ref,
                    currency="USD",
                    redirect_url=f"{os.getenv('BACKEND_URL', 'http://localhost:8000')}/api/payment/callback?group_id={group_id}"
                )
                
                payment_status = payment_result.get("status")
                
                # If payment initialization failed, reject the join
                if payment_status != "success":
                    error_message = payment_result.get("message", "Payment initialization failed")
                    logger.error(f"[JOIN GROUP] Payment failed for GroupBuy {group_id}, user {user.id}: {error_message}")
                    raise HTTPException(
                        status_code=status.HTTP_402_PAYMENT_REQUIRED,
                        detail=f"Payment initialization failed: {error_message}. Please contact support."
                    )
                
                transaction_id = payment_result.get("data", {}).get("id", tx_ref)
                payment_link = payment_result.get("data", {}).get("link")
                
            except HTTPException:
                raise
            except Exception as e:
                logger.error(f"[JOIN GROUP] Payment exception for GroupBuy {group_id}: {e}")
                raise HTTPException(
                    status_code=status.HTTP_402_PAYMENT_REQUIRED,
                    detail="Payment service unavailable. Please try again later or contact support."
                )

            # Create PENDING join record (not the real contribution yet!)
            # The actual contribution will be created after payment confirmation
            from models.models import PendingJoin
            
            # Check if there's already a pending join for this user/group
            existing_pending = db.query(PendingJoin).filter(
                PendingJoin.user_id == user.id,
                PendingJoin.group_id == group_id,
                PendingJoin.group_type == "group_buy",
                PendingJoin.payment_status == "pending"
            ).first()
            
            if existing_pending:
                # Update existing pending join with new payment details
                existing_pending.tx_ref = tx_ref
                existing_pending.payment_amount = payment_amount
                existing_pending.quantity = request.quantity
                existing_pending.delivery_method = request.delivery_method
                existing_pending.special_instructions = request.special_instructions
                existing_pending.expires_at = datetime.utcnow() + timedelta(minutes=30)
                pending_join = existing_pending
            else:
                # Create new pending join
                pending_join = PendingJoin(
                    user_id=user.id,
                    group_id=group_id,
                    group_type="group_buy",
                    quantity=request.quantity,
                    delivery_method=request.delivery_method,
                    payment_method="flutterwave",
                    special_instructions=request.special_instructions,
                    tx_ref=tx_ref,
                    payment_amount=payment_amount,
                    payment_status="pending",
                    expires_at=datetime.utcnow() + timedelta(minutes=30)
                )
                db.add(pending_join)
            
            db.commit()
            
            logger.info(f"[JOIN GROUP] Created pending join for user {user.id}, group_buy {group_id}, tx_ref: {tx_ref}")

            return {
                "message": "Payment initialized! Please complete payment to join the group.",
                "pending_join_id": pending_join.id,
                "quantity": request.quantity,
                "payment_amount": round(payment_amount, 2),
                "payment_status": "pending",
                "transaction_id": transaction_id,
                "tx_ref": tx_ref,  # Frontend needs this
                "payment_url": payment_link,  # Frontend needs this
                "group_progress": f"{group_buy.total_quantity}/{group_buy.product.moq} ({group_buy.moq_progress:.1f}%)",
                "group_status": group_buy.status
            }

        # If neither AdminGroup nor GroupBuy found
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Group not found or no longer active"
        )

    except HTTPException as he:
        # Log the specific HTTP exception details
        logger.error(f"[JOIN GROUP] HTTPException for group {group_id}: {he.status_code} - {he.detail}")
        raise
    except Exception as e:
        logger.error(f"[JOIN GROUP] Unexpected error joining group {group_id}: {e}")
        print(f"Error joining group {group_id}: {e}")
        db.rollback()
        raise HTTPException(status_code=500, detail="Failed to join group")

@router.post("/{group_id}/update-quantity")
async def update_group_quantity(
    group_id: int,
    request: UpdateQuantityRequest,
    user: User = Depends(verify_token),
    db: Session = Depends(get_db)
):
    """Update the user's quantity commitment for a group-buy by increasing it.

    Allows users to increase their quantity commitment to a group they're already part of.
    Requires payment for the additional quantity.
    """
    try:
        # First, try to find the group as an AdminGroup
        admin_group = db.query(AdminGroup).filter(
            AdminGroup.id == group_id,
            AdminGroup.is_active
        ).first()

        if admin_group:
            # Handle AdminGroup quantity update
            # Check if user has already joined this group
            existing_join = db.query(AdminGroupJoin).filter(
                AdminGroupJoin.user_id == user.id,
                AdminGroupJoin.admin_group_id == group_id
            ).first()

            if not existing_join:
                raise HTTPException(
                    status_code=status.HTTP_404_NOT_FOUND,
                    detail="You haven't joined this group yet"
                )

            # Validate quantity increase
            if request.quantity_increase <= 0:
                raise HTTPException(
                    status_code=status.HTTP_400_BAD_REQUEST,
                    detail="Quantity increase must be greater than 0"
                )

            # Check stock availability
            if admin_group.total_stock is not None and admin_group.total_stock <= 0:
                raise HTTPException(
                    status_code=status.HTTP_400_BAD_REQUEST,
                    detail="This product is out of stock"
                )

            # Check if requested quantity increase exceeds available stock
            if admin_group.total_stock is not None and request.quantity_increase > admin_group.total_stock:
                raise HTTPException(
                    status_code=status.HTTP_400_BAD_REQUEST,
                    detail=f"Requested quantity increase ({request.quantity_increase}) exceeds available stock ({admin_group.total_stock})"
                )
            
            # Check if adding this quantity would exceed the target amount
            if admin_group.max_participants:
                # Calculate current total quantity in the group
                current_total_qty = db.query(func.sum(AdminGroupJoin.quantity)).filter(
                    AdminGroupJoin.admin_group_id == group_id
                ).scalar() or 0
                
                # Calculate how much room is left
                remaining_capacity = admin_group.max_participants - current_total_qty
                
                if request.quantity_increase > remaining_capacity:
                    raise HTTPException(
                        status_code=status.HTTP_400_BAD_REQUEST,
                        detail=f"Cannot add {request.quantity_increase} units. Only {remaining_capacity} units remaining to reach the group target."
                    )

            # Update the join record
            old_quantity = existing_join.quantity
            existing_join.quantity += request.quantity_increase

            # Calculate additional amount needed
            unit_price = admin_group.price
            additional_amount = request.quantity_increase * unit_price
            
            # Update paid_amount to reflect the new total
            old_paid = existing_join.paid_amount or 0
            existing_join.paid_amount = old_paid + additional_amount

            # Update payment info if provided
            if request.payment_transaction_id:
                existing_join.payment_transaction_id = request.payment_transaction_id
            if request.payment_reference:
                existing_join.payment_reference = request.payment_reference

            # Create transaction record for the additional quantity
            if admin_group.product_id:
                from models.models import Transaction
                transaction = Transaction(
                    user_id=user.id,
                    group_buy_id=None,  # Admin groups don't have group_buy_id
                    product_id=admin_group.product_id,
                    quantity=request.quantity_increase,
                    amount=additional_amount,
                    transaction_type="quantity_increase",
                    location_zone=user.location_zone or "Unknown"
                )
                db.add(transaction)

            db.commit()

            return {
                "message": "Quantity updated successfully",
                "old_quantity": old_quantity,
                "new_quantity": existing_join.quantity,
                "quantity_increase": request.quantity_increase,
                "additional_amount": round(additional_amount, 2),
                "group_progress": f"{admin_group.participants}/{admin_group.max_participants or 'unlimited'}"
            }

        # If not an AdminGroup, try GroupBuy
        group_buy = db.query(GroupBuy).join(GroupBuy.product).filter(
            GroupBuy.id == group_id,
            GroupBuy.status == "active",
            GroupBuy.deadline > datetime.utcnow()
        ).first()

        if group_buy:
            # Handle GroupBuy quantity update
            # Check if user has already joined this group
            existing_contribution = db.query(Contribution).filter(
                Contribution.user_id == user.id,
                Contribution.group_buy_id == group_id
            ).first()

            if not existing_contribution:
                raise HTTPException(
                    status_code=status.HTTP_404_NOT_FOUND,
                    detail="You haven't joined this group yet"
                )

            # Validate quantity increase
            if request.quantity_increase <= 0:
                raise HTTPException(
                    status_code=status.HTTP_400_BAD_REQUEST,
                    detail="Quantity increase must be greater than 0"
                )
            
            # Check if adding this quantity would exceed the target (MOQ)
            if group_buy.product.moq:
                remaining_to_target = group_buy.product.moq - group_buy.total_quantity
                
                if remaining_to_target <= 0:
                    raise HTTPException(
                        status_code=status.HTTP_400_BAD_REQUEST,
                        detail="Group has already reached its target. No more units can be added."
                    )
                
                if request.quantity_increase > remaining_to_target:
                    raise HTTPException(
                        status_code=status.HTTP_400_BAD_REQUEST,
                        detail=f"Cannot add {request.quantity_increase} units. Only {remaining_to_target} units remaining to reach the group target."
                    )

            # Calculate additional amount needed
            unit_price = group_buy.product.bulk_price
            additional_amount = request.quantity_increase * unit_price

            # Update contribution
            old_quantity = existing_contribution.quantity
            existing_contribution.quantity += request.quantity_increase
            existing_contribution.contribution_amount += additional_amount

            # Update group totals
            group_buy.total_quantity += request.quantity_increase
            group_buy.total_contributions += additional_amount
            
            # Update money tracking
            group_buy.current_amount += additional_amount
            if group_buy.target_amount > 0:
                group_buy.amount_progress = (group_buy.current_amount / group_buy.target_amount) * 100

            # Create transaction record for the additional quantity
            from models.models import Transaction
            transaction = Transaction(
                user_id=user.id,
                group_buy_id=group_id,
                product_id=group_buy.product_id,
                quantity=request.quantity_increase,
                amount=additional_amount,
                transaction_type="quantity_increase",
                location_zone=user.location_zone or "Unknown"
            )
            db.add(transaction)

            db.commit()

            return {
                "message": "Quantity updated successfully",
                "old_quantity": old_quantity,
                "new_quantity": existing_contribution.quantity,
                "quantity_increase": request.quantity_increase,
                "additional_amount": round(additional_amount, 2),
                "group_progress": f"{group_buy.total_quantity}/{group_buy.product.moq} ({group_buy.moq_progress:.1f}%)"
            }

        # If neither AdminGroup nor GroupBuy found
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Group not found or no longer active"
        )

    except HTTPException:
        raise
    except Exception as e:
        print(f"Error updating quantity for group {group_id}: {e}")
        db.rollback()
        raise HTTPException(status_code=500, detail="Failed to update quantity")

@router.post("/", response_model=GroupResponse)
async def create_admin_group(
    request: GroupCreateRequest,
    user: User = Depends(verify_token),
    db: Session = Depends(get_db)
):
    """Create a new admin-managed group-buy opportunity.

    Only admin users can create admin groups. This creates a new group-buy
    that traders can join through the regular group browsing interface.
    """
    # Check if user is admin
    if not user.is_admin:
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail="Only administrators can create admin groups"
        )

    try:
        # Parse end_date
        from datetime import datetime
        end_date = datetime.fromisoformat(request.endDate.replace('Z', '+00:00'))

        # Create the admin group
        admin_group = AdminGroup(
            name=request.name,
            description=request.description,
            long_description=request.longDescription,
            category=request.category,
            price=request.price,
            original_price=request.originalPrice,
            image=request.image,
            max_participants=request.maxParticipants,
            end_date=end_date,
            admin_name=get_creator_display_name(user),
            shipping_info=request.shippingInfo,
            estimated_delivery=request.estimatedDelivery,
            features=request.features,
            requirements=request.requirements,
            manufacturer=request.manufacturer,
            total_stock=request.total_stock,
            is_active=True
        )

        db.add(admin_group)
        db.commit()
        db.refresh(admin_group)

        return GroupResponse(
            id=admin_group.id,
            name=admin_group.name,
            price=admin_group.price,
            image=admin_group.image,
            description=admin_group.description,
            participants=admin_group.participants,
            category=admin_group.category,
            created=admin_group.created.isoformat(),
            maxParticipants=admin_group.max_participants,
            originalPrice=admin_group.original_price,
            endDate=admin_group.end_date.isoformat() if admin_group.end_date else None,
            matchScore=85,  # Default match score for admin groups
            reason="Admin-created group buy",
            adminCreated=True,
            adminName=get_creator_display_name(user),
            savings=admin_group.savings,
            discountPercentage=admin_group.discount_percentage,
            shippingInfo=admin_group.shipping_info,
            estimatedDelivery=admin_group.estimated_delivery,
            features=admin_group.features or [],
            requirements=admin_group.requirements or [],
            longDescription=admin_group.long_description,
            status="active",
            orderStatus="Open for joining"
        )

    except Exception as e:
        print(f"Error creating admin group: {e}")
        db.rollback()
        raise HTTPException(status_code=500, detail="Failed to create admin group")


# Supplier Group Management Endpoints

@router.get("/supplier/groups/active")
async def get_supplier_active_groups(
    user: User = Depends(verify_supplier),
    db: Session = Depends(get_db)
):
    """Get all active groups created by the authenticated supplier"""
    try:
        # Verify user is a supplier
        if not user.is_supplier:
            raise HTTPException(
                status_code=status.HTTP_403_FORBIDDEN,
                detail="Only suppliers can access this endpoint"
            )

        # Get active GroupBuy groups created by this supplier
        active_groups = db.query(GroupBuy).join(GroupBuy.product).filter(
            GroupBuy.creator_id == user.id,
            GroupBuy.status == "active",
            GroupBuy.deadline > datetime.utcnow()
        ).all()

        result = []
        for group in active_groups:
            # Calculate participants count
            participants_count = db.query(Contribution).filter(
                Contribution.group_buy_id == group.id
            ).count()

            result.append({
                "id": group.id,
                "name": group.product.name if group.product else f"Group Buy #{group.id}",
                "description": group.product.description if group.product else "User-created group buy",
                "category": group.product.category if group.product else "General",
                "members": participants_count,
                "targetMembers": group.product.moq if group.product else 10,
                "dueDate": group.deadline.strftime("%Y-%m-%d") if group.deadline else None,
                "totalAmount": round(group.total_contributions, 2),
                "product": {
                    "name": group.product.name if group.product else f"Group Buy #{group.id}",
                    "image": group.product.image_url if group.product and group.product.image_url else "/api/placeholder/150/100",
                    "bulkPrice": group.product.bulk_price if group.product else 0,
                    "regularPrice": group.product.unit_price if group.product else 0
                },
                "status": "active",
                "progress": f"{participants_count}/{group.product.moq if group.product else 10}",
                "progressPercentage": group.moq_progress,
                "created_at": group.created_at.isoformat() if group.created_at else None
            })

        return result

    except HTTPException:
        raise
    except Exception as e:
        print(f"Error getting supplier active groups: {e}")
        raise HTTPException(status_code=500, detail="Failed to retrieve active groups")


@router.get("/supplier/groups/ready-for-payment")
async def get_supplier_completed_group_orders(
    user: User = Depends(verify_supplier),
    db: Session = Depends(get_db)
):
    """Get all completed groups created by the authenticated supplier that are ready for payment processing"""
    try:
        # Verify user is a supplier
        if not user.is_supplier:
            raise HTTPException(
                status_code=status.HTTP_403_FORBIDDEN,
                detail="Only suppliers can access this endpoint"
            )

        # Get completed GroupBuy groups created by this supplier
        completed_groups = db.query(GroupBuy).join(GroupBuy.product).filter(
            GroupBuy.creator_id == user.id,
            GroupBuy.status == "completed"
        ).all()

        result = []
        for group in completed_groups:
            # Calculate participants count
            participants_count = db.query(Contribution).filter(
                Contribution.group_buy_id == group.id
            ).count()

            result.append({
                "id": group.id,
                "name": group.product.name if group.product else f"Group Buy #{group.id}",
                "description": group.product.description if group.product else "User-created group buy",
                "category": group.product.category if group.product else "General",
                "members": participants_count,
                "targetMembers": group.product.moq if group.product else 10,
                "dueDate": group.deadline.strftime("%Y-%m-%d") if group.deadline else None,
                "total_value": round(group.total_contributions, 2),
                "total_savings": round(group.total_contributions * (group.product.savings_factor if group.product else 0), 2),
                "product": {
                    "name": group.product.name if group.product else f"Group Buy #{group.id}",
                    "image": group.product.image_url if group.product and group.product.image_url else "/api/placeholder/150/100",
                    "bulkPrice": group.product.bulk_price if group.product else 0,
                    "regularPrice": group.product.unit_price if group.product else 0,
                    "manufacturer": None  # GroupBuy products don't have manufacturer info
                },
                "status": "completed",
                "progress": f"{participants_count}/{group.product.moq if group.product else 10}",
                "progressPercentage": 100.0,  # Completed groups are at 100%
                "created_at": group.created_at.isoformat() if group.created_at else None,
                "completed_at": group.deadline.isoformat() if group.deadline else None
            })

        return result

    except HTTPException:
        raise
    except Exception as e:
        print(f"Error getting supplier completed groups: {e}")
        raise HTTPException(status_code=500, detail="Failed to retrieve completed groups")


@router.get("/supplier/groups/moderation-stats")
async def get_supplier_group_moderation_stats(
    user: User = Depends(verify_supplier),
    db: Session = Depends(get_db)
):
    """Get moderation statistics for groups created by the authenticated supplier"""
    try:
        # Verify user is a supplier
        if not user.is_supplier:
            raise HTTPException(
                status_code=status.HTTP_403_FORBIDDEN,
                detail="Only suppliers can access this endpoint"
            )

        # Get active groups count
        active_groups = db.query(GroupBuy).filter(
            GroupBuy.creator_id == user.id,
            GroupBuy.status == "active",
            GroupBuy.deadline > datetime.utcnow()
        ).count()

        # Get completed groups count
        completed_groups = db.query(GroupBuy).filter(
            GroupBuy.creator_id == user.id,
            GroupBuy.status == "completed"
        ).count()

        # Get total members across all supplier's groups
        total_members = 0
        supplier_groups = db.query(GroupBuy).filter(GroupBuy.creator_id == user.id).all()
        for group in supplier_groups:
            members_count = db.query(Contribution).filter(
                Contribution.group_buy_id == group.id
            ).count()
            total_members += members_count

        # Calculate pending orders (groups that need action)
        # For suppliers, this could be groups that are completed but not yet processed
        pending_orders = completed_groups  # All completed groups need payment processing

        return {
            "active_groups": active_groups,
            "ready_for_payment": completed_groups,
            "total_members": total_members,
            "pending_orders": pending_orders,
            "required_action": pending_orders  # Groups requiring payment processing
        }

    except HTTPException:
        raise
    except Exception as e:
        print(f"Error getting supplier group moderation stats: {e}")
        raise HTTPException(status_code=500, detail="Failed to retrieve moderation stats")


@router.post("/supplier/groups/create")
async def create_supplier_group(
    request: GroupCreateRequest,
    user: User = Depends(verify_supplier),
    db: Session = Depends(get_db)
):
    """Create a new group-buy opportunity for suppliers.

    Suppliers can create GroupBuy groups using their own products.
    This creates a new group-buy that traders can join.
    """
    # Check if user is a supplier
    if not user.is_supplier:
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail="Only suppliers can create groups"
        )

    try:
        # Parse end_date
        from datetime import datetime
        end_date = datetime.fromisoformat(request.endDate.replace('Z', '+00:00'))

        # For supplier groups, we need to create both a Product and a GroupBuy
        # First, create or find the product
        from models.models import Product

        # Check if product already exists (by name), or create new one
        product = db.query(Product).filter(
            Product.name == (request.product_name or request.name)
        ).first()

        if not product:
            # Create new product
            product = Product(
                name=request.product_name or request.name,
                description=request.product_description or request.description,
                category=request.category,
                unit_price=request.originalPrice,
                bulk_price=request.price,
                moq=request.maxParticipants,
                image_url=request.image
            )
            db.add(product)
            db.flush()  # Get the product ID

        # Create the GroupBuy with money tracking
        target_amount = product.moq * product.bulk_price
        group_buy = GroupBuy(
            product_id=product.id,
            creator_id=user.id,
            deadline=end_date,
            status="active",
            total_quantity=0,
            total_contributions=0.0,
            current_amount=0.0,
            target_amount=target_amount,
            amount_progress=0.0,
            location_zone=user.location_zone or "Default"
        )

        db.add(group_buy)
        db.commit()
        db.refresh(group_buy)

        return GroupResponse(
            id=group_buy.id,
            name=product.name,
            price=product.bulk_price,
            image=product.image_url,
            description=product.description,
            participants=0,  # New group has no participants yet
            moq=product.moq,
            category=product.category,
            created=group_buy.created_at.isoformat(),
            maxParticipants=None,  # GroupBuy doesn't have max participants
            originalPrice=product.unit_price,
            endDate=group_buy.deadline.isoformat(),
            matchScore=75,  # Default match score for supplier-created groups
            reason="Supplier-created group buy",
            adminCreated=False,
            adminName=get_creator_display_name(user),
            savings=product.unit_price - product.bulk_price,
            discountPercentage=round(product.savings_factor * 100),
            shippingInfo="Pickup at designated location",
            estimatedDelivery="2-3 weeks after group completion",
            features=["Bulk pricing", "Supplier verified", "Quality guaranteed"],
            requirements=[f"Minimum {product.moq} total units required"],
            longDescription=product.description,
            status="active",
            orderStatus="Open for joining"
        )

    except Exception as e:
        print(f"Error creating supplier group: {e}")
        db.rollback()
        raise HTTPException(status_code=500, detail="Failed to create supplier group")


@router.get("/supplier/groups/{group_id}")
async def get_supplier_group_details(
    group_id: int,
    user: User = Depends(verify_supplier),
    db: Session = Depends(get_db)
):
    """Get detailed information about a specific group created by the supplier"""
    try:
        # Verify user is a supplier
        if not user.is_supplier:
            raise HTTPException(
                status_code=status.HTTP_403_FORBIDDEN,
                detail="Only suppliers can access this endpoint"
            )

        # Get the group and verify ownership
        group_buy = db.query(GroupBuy).filter(
            GroupBuy.id == group_id,
            GroupBuy.creator_id == user.id
        ).first()

        if not group_buy:
            raise HTTPException(
                status_code=status.HTTP_404_NOT_FOUND,
                detail="Group not found or you don't have permission to view it"
            )

        # Calculate participants count
        participants_count = db.query(Contribution).filter(
            Contribution.group_buy_id == group_id
        ).count()

        return {
            "id": group_buy.id,
            "name": group_buy.product.name,
            "description": group_buy.product.description,
            "long_description": group_buy.product.description,
            "category": group_buy.product.category,
            "price": group_buy.product.bulk_price,
            "original_price": group_buy.product.unit_price,
            "image": group_buy.product.image_url,
            "participants": participants_count,
            "max_participants": group_buy.product.moq,
            "end_date": group_buy.deadline.isoformat() if group_buy.deadline else None,
            "status": group_buy.status,
            "total_quantity": group_buy.total_quantity,
            "total_contributions": group_buy.total_contributions,
            "moq_progress": group_buy.moq_progress,
            "created_at": group_buy.created_at.isoformat() if group_buy.created_at else None,
            "product": {
                "name": group_buy.product.name,
                "description": group_buy.product.description,
                "manufacturer": None,  # Product model doesn't have manufacturer field
                "total_stock": None,  # Product model doesn't have total_stock field
                "regular_price": group_buy.product.unit_price
            }
        }

    except HTTPException:
        raise
    except Exception as e:
        print(f"Error getting supplier group details: {e}")
        raise HTTPException(status_code=500, detail="Failed to retrieve group details")


@router.post("/supplier/groups/{group_id}/process-payment")
async def process_supplier_group_payment(
    group_id: int,
    user: User = Depends(verify_supplier),
    db: Session = Depends(get_db)
):
    """Process payment for a completed supplier group"""
    try:
        # Verify user is a supplier
        if not user.is_supplier:
            raise HTTPException(
                status_code=status.HTTP_403_FORBIDDEN,
                detail="Only suppliers can access this endpoint"
            )

        # Get the group and verify ownership
        group_buy = db.query(GroupBuy).filter(
            GroupBuy.id == group_id,
            GroupBuy.creator_id == user.id,
            GroupBuy.status == "completed"
        ).first()

        if not group_buy:
            raise HTTPException(
                status_code=status.HTTP_404_NOT_FOUND,
                detail="Completed group not found or you don't have permission to process payment"
            )

        # Create order from the completed group
        from routers.supplier_orders import create_order_from_completed_group
        order = create_order_from_completed_group(db, group_id)

        if not order:
            raise HTTPException(
                status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
                detail="Failed to create order from completed group"
            )

        # Here you would integrate with payment processing
        # For now, just mark as paid
        # In a real implementation, this would:
        # 1. Calculate supplier earnings (after platform fees)
        # 2. Process payment to supplier
        # 3. Update payment status

        return {
            "message": "Payment processed successfully and order created",
            "group_id": group_id,
            "order_id": order.id,
            "order_number": order.order_number,
            "amount": round(group_buy.total_contributions, 2),
            "status": "completed"
        }

    except HTTPException:
        raise
    except Exception as e:
        print(f"Error processing supplier group payment: {e}")
        raise HTTPException(status_code=500, detail="Failed to process payment")


@router.post("/supplier/groups/{group_id}/qr/generate")
async def generate_supplier_group_qr(
    group_id: int,
    user: User = Depends(verify_supplier),
    db: Session = Depends(get_db)
):
    """Generate QR code for supplier group pickup"""
    try:
        # Verify user is a supplier
        if not user.is_supplier:
            raise HTTPException(
                status_code=status.HTTP_403_FORBIDDEN,
                detail="Only suppliers can access this endpoint"
            )

        # Get the group and verify ownership
        group_buy = db.query(GroupBuy).filter(
            GroupBuy.id == group_id,
            GroupBuy.creator_id == user.id
        ).first()

        if not group_buy:
            raise HTTPException(
                status_code=status.HTTP_404_NOT_FOUND,
                detail="Group not found or you don't have permission"
            )

        # Generate QR code data (similar to existing QR generation)
        # This would be similar to the existing QR code generation logic
        # For now, return a placeholder
        return {
            "qr_code_data": f"SUPPLIER-GROUP-{group_id}",
            "message": "QR code generated for supplier group"
        }

    except HTTPException:
        raise
    except Exception as e:
        print(f"Error generating supplier group QR: {e}")
        raise HTTPException(status_code=500, detail="Failed to generate QR code")
