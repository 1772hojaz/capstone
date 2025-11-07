from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy.orm import Session
from pydantic import BaseModel
from typing import List, Optional
import os
import qrcode
import json
from datetime import datetime, timedelta
import base64
import io
import secrets
from cryptography.fernet import Fernet
from db.database import get_db
from models.models import User, AdminGroup, Contribution, GroupBuy, AdminGroupJoin, QRCodePickup
from authentication.auth import verify_token

router = APIRouter()

# Pydantic Models for Front-end compatibility
class GroupResponse(BaseModel):
    id: int
    name: str
    price: float
    image: str
    description: str
    participants: int
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

class GroupDetailResponse(BaseModel):
    id: int
    name: str
    price: float
    originalPrice: float
    image: str
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
    progressPercentage: Optional[float] = None
    remainingNeeded: Optional[int] = None

class GroupCreateRequest(BaseModel):
    name: str
    description: str
    category: str
    price: float
    originalPrice: float
    image: str
    maxParticipants: int
    endDate: str
    longDescription: str
    features: List[str]
    requirements: List[str]
    shippingInfo: str
    estimatedDelivery: str

    class Config:
        schema_extra = {
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
                "estimatedDelivery": "2024-02-05"
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
        schema_extra = {
            "example": {
                "quantity": 1,
                "delivery_method": "pickup",
                "payment_method": "cash",
                "special_instructions": "Please call before delivery"
            }
        }

class UpdateContributionRequest(BaseModel):
    quantity: int

    class Config:
        schema_extra = {
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
    user: User = Depends(verify_token),
    db: Session = Depends(get_db)
):
    """Generate and return a QR code (base64 PNG) for a user's pickup of a group-buy.

    Returns JSON with fields:
    - qr_code: base64 PNG (no data: prefix)
    - qr_content: encrypted payload used for validation
    - expires_at: ISO timestamp when QR expires
    - pickup_instructions: human readable pickup instructions/location
    - is_used: whether this QR code has been used for pickup
    - status: ready/used status
    """
    try:
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
            
            return {
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

        return {
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
    except HTTPException:
        raise
    except Exception as e:
        print(f"Error generating QR code for group {group_id}: {e}")
        raise HTTPException(status_code=500, detail="Failed to generate QR code")

@router.get("/my-groups")
async def get_my_groups(
    user: User = Depends(verify_token),
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
                
                # Determine status based on group state
                if group_buy.status == "completed":
                    status = "ready_for_pickup"
                    order_status = "Ready for pickup"
                elif group_buy.status == "active" and group_buy.moq_progress >= 100:
                    status = "payment_pending"
                    order_status = "Payment pending"
                elif group_buy.status == "active":
                    status = "active"
                    order_status = "Active - collecting participants"
                else:
                    status = "cancelled"
                    order_status = "Cancelled"
                
                group_data = {
                    "id": group_buy.id,
                    "name": group_buy.product.name,
                    "description": group_buy.product.description or f"Group buy for {group_buy.product.name}",
                    "price": f"${group_buy.product.bulk_price:.2f}",
                    "originalPrice": f"${group_buy.product.unit_price:.2f}",
                    "image": group_buy.product.image_url or "https://via.placeholder.com/300x200?text=Product",
                    "status": status,
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
                    "quantity": contrib.quantity  # Add user's quantity
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
                
                # Determine status based on admin group state
                if not admin_group.is_active:
                    status = "cancelled"
                    order_status = "Cancelled"
                elif admin_group.end_date and admin_group.end_date < datetime.utcnow():
                    status = "completed"
                    order_status = "Completed - Ready for pickup"
                else:
                    status = "active"
                    order_status = "Active - Payment completed"
                
                group_data = {
                    "id": admin_group.id,
                    "name": admin_group.name,
                    "description": admin_group.description or f"Admin group buy for {admin_group.name}",
                    "price": f"${admin_group.price:.2f}",
                    "originalPrice": f"${admin_group.original_price:.2f}",
                    "image": admin_group.image or "https://via.placeholder.com/300x200?text=Product",
                    "status": status,
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
                    "quantity": join.quantity  # Add user's quantity
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
                    "endDate": group_buy.deadline.strftime("%Y-%m-%dT%H:%M:%SZ") if group_buy.deadline else None
                }
                groups_data.append(group_data)
        
        return groups_data
        
    except Exception as e:
        print(f"Error getting user groups: {e}")
        raise HTTPException(status_code=500, detail=f"Error retrieving groups: {str(e)}")

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
        
        result.append(GroupResponse(
            id=group.id,
            name=group.name,
            price=group.price,
            image=group.image,
            description=group.description,
            participants=group.participants,
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
            features=group.features or [],
            requirements=group.requirements or [],
            longDescription=group.long_description,
            status="active",
            orderStatus="Open for joining",
            joined=joined
        ))
    
    # Get active GroupBuy groups
    group_buy_groups = db.query(GroupBuy).filter(
        GroupBuy.status == "active",
        GroupBuy.deadline > datetime.utcnow()
    ).all()
    
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
        
        result.append(GroupResponse(
            id=group.id,
            name=group.product.name if group.product else f"Group Buy #{group.id}",
            price=group.product.bulk_price if group.product else 0,
            image=group.product.image_url if group.product and group.product.image_url else "https://via.placeholder.com/300x200?text=Product",
            description=group.product.description if group.product else "User-created group buy",
            participants=participants_count,
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
            requirements=[f"Minimum {group.product.moq if group.product else 10} total units required"],
            longDescription=group.product.description if group.product else f"Join this community group buy for {group.product.name if group.product else 'quality products'} at bulk prices.",
            status="active",
            orderStatus="Open for joining",
            joined=joined
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
        return GroupDetailResponse(
            id=admin_group.id,
            name=admin_group.name,
            price=admin_group.price,
            originalPrice=admin_group.original_price,
            image=admin_group.image,
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
            requirements=admin_group.requirements or []
        )
    
    # If not AdminGroup, try GroupBuy
    group_buy = db.query(GroupBuy).filter(GroupBuy.id == group_id).first()
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
            image=group_buy.product.image_url if group_buy.product and group_buy.product.image_url else "https://via.placeholder.com/300x200?text=Product",
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
            progressPercentage=progress_percentage,
            remainingNeeded=remaining_needed
        )
    
    # If neither found
    raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Group not found")

@router.put("/{group_id}/contribution")
async def update_contribution(
    group_id: int,
    request: UpdateContributionRequest,
    user: User = Depends(verify_token),
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
    user: User = Depends(verify_token),
    db: Session = Depends(get_db)
):
    """Join a group-buy by creating a contribution or join record.

    Allows users to join an active group-buy by specifying quantity and delivery preferences.
    Handles both AdminGroup and GroupBuy groups.
    """
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

            # Check if group has space (if max_participants is set)
            if admin_group.max_participants and admin_group.participants >= admin_group.max_participants:
                raise HTTPException(
                    status_code=status.HTTP_400_BAD_REQUEST,
                    detail="Group is full"
                )

            # Calculate contribution amount (upfront payment - typically 50%)
            contribution_amount = request.quantity * admin_group.price
            upfront_amount = contribution_amount * 0.5  # 50% upfront

            # Create admin group join record
            join_record = AdminGroupJoin(
                user_id=user.id,
                admin_group_id=group_id,
                quantity=request.quantity,
                delivery_method=request.delivery_method,
                payment_method=request.payment_method,
                special_instructions=request.special_instructions,
                payment_transaction_id=request.payment_transaction_id,
                payment_reference=request.payment_reference
            )

            db.add(join_record)

            # Update group participant count
            admin_group.participants += 1

            # Create initial transaction record only if admin group has a linked product
            if admin_group.product_id:
                from models import Transaction
                transaction = Transaction(
                    user_id=user.id,
                    group_buy_id=None,  # Admin groups don't have group_buy_id
                    product_id=admin_group.product_id,
                    quantity=request.quantity,
                    amount=upfront_amount,
                    transaction_type="upfront",
                    location_zone=user.location_zone or "Unknown"
                )
                db.add(transaction)

            db.commit()

            return {
                "message": "Successfully joined the group!",
                "join_id": join_record.id,
                "quantity": request.quantity,
                "upfront_amount": round(upfront_amount, 2),
                "total_amount": round(contribution_amount, 2),
                "remaining_balance": round(contribution_amount - upfront_amount, 2),
                "group_progress": f"{admin_group.participants}/{admin_group.max_participants or 'unlimited'}"
            }

        # If not an AdminGroup, try GroupBuy
        group_buy = db.query(GroupBuy).filter(
            GroupBuy.id == group_id,
            GroupBuy.status == "active",
            GroupBuy.deadline > datetime.utcnow()
        ).first()

        if group_buy:
            # Handle GroupBuy join
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

            # Create contribution record
            contribution = Contribution(
                user_id=user.id,
                group_buy_id=group_id,
                quantity=request.quantity,
                contribution_amount=contribution_amount,
                paid_amount=0.0,  # No payment required upfront for GroupBuy
                is_fully_paid=False
            )

            db.add(contribution)

            # Update group totals
            group_buy.total_quantity += request.quantity
            group_buy.total_contributions += contribution_amount

            # Create transaction record for the contribution
            from models import Transaction
            transaction = Transaction(
                user_id=user.id,
                group_buy_id=group_id,
                product_id=group_buy.product_id,
                quantity=request.quantity,
                amount=contribution_amount,
                transaction_type="contribution",
                location_zone=user.location_zone or "Unknown"
            )

            db.add(transaction)
            db.commit()

            return {
                "message": "Successfully joined the group buy!",
                "contribution_id": contribution.id,
                "quantity": request.quantity,
                "contribution_amount": round(contribution_amount, 2),
                "group_progress": f"{group_buy.total_quantity}/{group_buy.product.moq} ({group_buy.moq_progress:.1f}%)",
                "payment_required": "Payment will be collected when the group reaches minimum quantity"
            }

        # If neither AdminGroup nor GroupBuy found
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Group not found or no longer active"
        )

    except HTTPException:
        raise
    except Exception as e:
        print(f"Error joining group {group_id}: {e}")
        db.rollback()
        raise HTTPException(status_code=500, detail="Failed to join group")

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
