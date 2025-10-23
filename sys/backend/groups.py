from fastapi import APIRouter, Depends, HTTPException, status, UploadFile, File
from sqlalchemy.orm import Session
from pydantic import BaseModel
from typing import List, Optional
from datetime import datetime, timedelta
import os
import shutil
import qrcode
import json
import base64
import io
from cryptography.fernet import Fernet
from database import get_db
from models import User, AdminGroup, QRCodePickup, PickupLocation
from auth import verify_token

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
    discountPercentage: Optional[int] = None
    shippingInfo: Optional[str] = None
    estimatedDelivery: Optional[str] = None
    features: Optional[List[str]] = None
    requirements: Optional[List[str]] = None
    longDescription: Optional[str] = None
    status: Optional[str] = None
    orderStatus: Optional[str] = None

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

    class Config:
        schema_extra = {
            "example": {
                "quantity": 1
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

# QR Code Configuration
QR_ENCRYPTION_KEY = os.getenv("QR_ENCRYPTION_KEY", "your-qr-encryption-key-change-this-in-production")
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
        f = Fernet(QR_ENCRYPTION_KEY.encode())
        encrypted = base64.urlsafe_b64decode(encrypted_data.encode())
        decrypted = f.decrypt(encrypted)
        return json.loads(decrypted.decode())
    except Exception:
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
    
    return f"data:image/png;base64,{img_base64}"

# Routes
@router.get(
    "/",
    response_model=List[GroupResponse],
    summary="Get All Active Groups",
    description="""
    Retrieve all active admin-created group-buy opportunities.

    Returns a list of groups with basic information including pricing, participants,
    and availability status. Groups are filtered to show only active ones.
    """,
    response_description="List of active group-buy opportunities",
    tags=["Groups"]
)
async def get_all_groups(
    user: User = Depends(verify_token),
    db: Session = Depends(get_db)
):
    """Get all admin-created groups for browsing"""
    groups = db.query(AdminGroup).filter(AdminGroup.is_active).all()
    
    result = []
    for group in groups:
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
            orderStatus="Open for joining"
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
    user: User = Depends(verify_token),
    db: Session = Depends(get_db)
):
    """Get detailed information about a specific admin group"""
    group = db.query(AdminGroup).filter(AdminGroup.id == group_id).first()
    if not group:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Group not found")
    
    return GroupDetailResponse(
        id=group.id,
        name=group.name,
        price=group.price,
        originalPrice=group.original_price,
        image=group.image,
        description=group.description,
        longDescription=group.long_description or group.description,
        participants=group.participants,
        maxParticipants=group.max_participants,
        category=group.category,
        created=group.created.isoformat(),
        endDate=group.end_date.isoformat(),
        matchScore=85,  # Default match score
        reason="Admin-created group buy",
        adminCreated=True,
        adminName=group.admin_name,
        savings=group.savings,
        discountPercentage=group.discount_percentage,
        shippingInfo=group.shipping_info,
        estimatedDelivery=group.estimated_delivery,
        features=group.features or [],
        requirements=group.requirements or []
    )

@router.post(
    "/",
    summary="Create New Admin Group",
    description="""
    Create a new admin-managed group-buy opportunity.

    Only administrators can create groups. The group will be immediately available
    for traders to join and participate in. All required fields must be provided.
    """,
    response_description="Confirmation message with the created group ID",
    tags=["Admin Groups"],
    responses={
        200: {
            "description": "Group created successfully",
            "content": {
                "application/json": {
                    "example": {
                        "message": "Group created successfully",
                        "group_id": 1
                    }
                }
            }
        },
        403: {"description": "Only administrators can create groups"},
        422: {"description": "Invalid group data provided"}
    }
)
async def create_admin_group(
    group_data: GroupCreateRequest,
    user: User = Depends(verify_token),
    db: Session = Depends(get_db)
):
    """Create a new admin group (admin only)"""
    if not user.is_admin:
        raise HTTPException(status_code=status.HTTP_403_FORBIDDEN, detail="Only admins can create groups")
    
    group = AdminGroup(
        name=group_data.name,
        description=group_data.description,
        long_description=group_data.longDescription,
        category=group_data.category,
        price=group_data.price,
        original_price=group_data.originalPrice,
        image=group_data.image,
        max_participants=group_data.maxParticipants,
        end_date=datetime.fromisoformat(group_data.endDate.replace('Z', '+00:00')),
        admin_name=user.full_name or "Admin",
        shipping_info="Free shipping when group goal is reached",
        estimated_delivery="2-3 weeks after group completion",
        features=group_data.features,
        requirements=group_data.requirements
    )
    
    db.add(group)
    db.commit()
    db.refresh(group)
    
    return {"message": "Group created successfully", "group_id": group.id}

@router.post(
    "/{group_id}/join",
    summary="Join Group-Buy",
    description="""
    Join an existing admin-created group-buy opportunity.

    Traders can join active groups that haven't reached their maximum participant limit.
    Multiple quantities can be specified for bulk participation.
    """,
    response_description="Confirmation of successful group join",
    tags=["Groups"],
    responses={
        200: {
            "description": "Successfully joined the group",
            "content": {
                "application/json": {
                    "example": {
                        "message": "Successfully joined 'Bulk Rice Purchase'!",
                        "group_id": 1,
                        "participants": 6
                    }
                }
            }
        },
        400: {"description": "Group is full or inactive"},
        404: {"description": "Group not found"}
    }
)
async def join_admin_group(
    group_id: int,
    join_data: JoinGroupRequest,
    user: User = Depends(verify_token),
    db: Session = Depends(get_db)
):
    """Join an admin-created group"""
    group = db.query(AdminGroup).filter(AdminGroup.id == group_id).first()
    if not group:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Group not found")
    
    if not group.is_active:
        raise HTTPException(status_code=status.HTTP_400_BAD_REQUEST, detail="Group is not active")
    
    if group.participants >= group.max_participants:
        raise HTTPException(status_code=status.HTTP_400_BAD_REQUEST, detail="Group is full")
    
    # Check if user already joined (we'll use a simple approach for now)
    # In a real app, you'd have a join table
    
    group.participants += join_data.quantity
    db.commit()
    
    return {
        "message": f"Successfully joined '{group.name}'!",
        "group_id": group.id,
        "participants": group.participants
    }

@router.post(
    "/upload-image",
    summary="Upload Group Image",
    description="""
    Upload an image file for use in group creation.

    Only administrators can upload images. Supported formats: JPG, PNG, GIF.
    Images are stored in the uploads directory and accessible via the returned URL.
    """,
    response_description="URL of the uploaded image",
    tags=["Admin Groups"],
    responses={
        200: {
            "description": "Image uploaded successfully",
            "content": {
                "application/json": {
                    "example": {
                        "imageUrl": "/uploads/group_20240115_143022.jpg"
                    }
                }
            }
        },
        403: {"description": "Only administrators can upload images"},
        422: {"description": "Invalid file format or upload error"}
    }
)
async def upload_image(
    file: UploadFile = File(...),
    user: User = Depends(verify_token),
    db: Session = Depends(get_db)
):
    """Upload an image for group creation"""
    if not user.is_admin:
        raise HTTPException(status_code=status.HTTP_403_FORBIDDEN, detail="Only admins can upload images")
    
    # Create uploads directory if it doesn't exist
    upload_dir = "uploads"
    os.makedirs(upload_dir, exist_ok=True)
    
    # Generate unique filename
    file_extension = os.path.splitext(file.filename)[1]
    filename = f"group_{datetime.utcnow().strftime('%Y%m%d_%H%M%S')}{file_extension}"
    file_path = os.path.join(upload_dir, filename)
    
    # Save file
    with open(file_path, "wb") as buffer:
        shutil.copyfileobj(file.file, buffer)
    
    # Return the relative path that can be accessed by frontend
    image_url = f"/uploads/{filename}"
    
    return {"imageUrl": image_url}

@router.get(
    "/{group_id}/pickup-status",
    response_model=PickupStatusResponse,
    summary="Check Pickup Status",
    description="""
    Check if a group buy is ready for pickup and if QR code is available.

    Returns pickup status, QR code availability, and pickup instructions.
    """,
    response_description="Pickup status and QR code information",
    tags=["Pickup"],
    responses={
        200: {
            "description": "Pickup status retrieved successfully",
            "content": {
                "application/json": {
                    "example": {
                        "can_pickup": True,
                        "qr_available": True,
                        "pickup_instructions": "Show this QR code at your selected pickup location",
                        "qr_code": "data:image/png;base64,iVBORw0KGgoAAAANSUhEUgAA...",
                        "expires_at": "2025-01-16T10:30:00Z"
                    }
                }
            }
        },
        404: {"description": "Group not found"}
    }
)
async def get_pickup_status(
    group_id: int,
    user: User = Depends(verify_token),
    db: Session = Depends(get_db)
):
    """Check if group is ready for pickup and get QR code"""
    # For now, we'll use AdminGroup. In a real implementation, you'd check
    # the actual group buy status and user's participation
    
    group = db.query(AdminGroup).filter(AdminGroup.id == group_id).first()
    if not group:
        raise HTTPException(status_code=404, detail="Group not found")
    
    # Check if group is completed (simplified logic)
    # In real implementation, check if group buy reached MOQ and is ready for pickup
    can_pickup = group.participants >= (group.max_participants * 0.8)  # 80% participation
    
    if not can_pickup:
        return PickupStatusResponse(
            can_pickup=False,
            qr_available=False,
            pickup_instructions="Group is not yet ready for pickup. Waiting for more participants."
        )
    
    # Check if QR code already exists and is valid
    existing_qr = db.query(QRCodePickup).filter(
        QRCodePickup.user_id == user.id,
        QRCodePickup.group_buy_id == group_id,
        ~QRCodePickup.is_used,
        QRCodePickup.expires_at > datetime.utcnow()
    ).first()
    
    if existing_qr:
        qr_image = generate_qr_code_image(existing_qr.qr_code_data)
        return PickupStatusResponse(
            can_pickup=True,
            qr_available=True,
            pickup_instructions="Show this QR code at your selected pickup location",
            qr_code=qr_image,
            expires_at=existing_qr.expires_at.isoformat()
        )
    
    # Generate new QR code
    qr_data = {
        "order_id": f"ORD-{datetime.utcnow().strftime('%Y%m%d')}-{group_id:04d}",
        "user_id": user.id,
        "group_id": group_id,
        "pickup_location": "Any Branch Location",  # In real implementation, user selects location
        "timestamp": datetime.utcnow().isoformat(),
        "expires_at": (datetime.utcnow() + timedelta(hours=QR_EXPIRY_HOURS)).isoformat()
    }
    
    encrypted_data = encrypt_qr_data(qr_data)
    qr_image = generate_qr_code_image(encrypted_data)
    
    # Save QR code record
    qr_record = QRCodePickup(
        qr_code_data=encrypted_data,
        user_id=user.id,
        group_buy_id=group_id,
        pickup_location="Any Branch Location",
        expires_at=datetime.utcnow() + timedelta(hours=QR_EXPIRY_HOURS)
    )
    
    db.add(qr_record)
    db.commit()
    
    return PickupStatusResponse(
        can_pickup=True,
        qr_available=True,
        pickup_instructions="Show this QR code at your selected pickup location",
        qr_code=qr_image,
        expires_at=qr_record.expires_at.isoformat()
    )

@router.post(
    "/validate-qr",
    response_model=QRValidationResponse,
    summary="Validate QR Code for Pickup",
    description="""
    Validate a scanned QR code for product pickup at branch locations.

    Used by branch staff to verify customer pickup requests.
    """,
    response_description="QR code validation result",
    tags=["Pickup"],
    responses={
        200: {
            "description": "QR code validated successfully",
            "content": {
                "application/json": {
                    "example": {
                        "valid": True,
                        "message": "Pickup validated successfully",
                        "pickup_details": {
                            "order_id": "ORD-20250115-0001",
                            "user_id": 123,
                            "group_id": 456,
                            "pickup_location": "Harare Branch A",
                            "customer_name": "John Doe",
                            "group_name": "Bulk Rice Purchase"
                        }
                    }
                }
            }
        },
        400: {"description": "Invalid QR code"},
        410: {"description": "QR code expired"}
    }
)
async def validate_qr_code(
    validation_data: QRValidationRequest,
    staff_user: User = Depends(verify_token),  # Staff member validating
    db: Session = Depends(get_db)
):
    """Validate QR code for pickup (staff only)"""
    try:
        # Decrypt QR data
        qr_data = decrypt_qr_data(validation_data.qr_content)
        
        # Check if QR code exists in database and is valid
        qr_record = db.query(QRCodePickup).filter(
            QRCodePickup.qr_code_data == validation_data.qr_content,
            ~QRCodePickup.is_used,
            QRCodePickup.expires_at > datetime.utcnow()
        ).first()
        
        if not qr_record:
            return QRValidationResponse(
                valid=False,
                message="QR code not found or already used"
            )
        
        # Check expiry
        if qr_record.expires_at <= datetime.utcnow():
            return QRValidationResponse(
                valid=False,
                message="QR code has expired"
            )
        
        # Get user and group details
        user = db.query(User).filter(User.id == qr_record.user_id).first()
        group = db.query(AdminGroup).filter(AdminGroup.id == qr_record.group_buy_id).first()
        
        if not user or not group:
            return QRValidationResponse(
                valid=False,
                message="Invalid order details"
            )
        
        # Mark QR code as used
        qr_record.is_used = True
        qr_record.used_at = datetime.utcnow()
        qr_record.used_by_staff = staff_user.full_name or staff_user.email
        qr_record.used_location = validation_data.scanner_location
        
        db.commit()
        
        return QRValidationResponse(
            valid=True,
            message="Pickup validated successfully",
            pickup_details={
                "order_id": qr_data["order_id"],
                "user_id": qr_record.user_id,
                "group_id": qr_record.group_buy_id,
                "pickup_location": qr_record.pickup_location,
                "customer_name": user.full_name,
                "customer_email": user.email,
                "group_name": group.name,
                "quantity": 1,  # In real implementation, get from contributions
                "validated_by": staff_user.full_name or staff_user.email,
                "validated_at": datetime.utcnow().isoformat(),
                "scanner_location": validation_data.scanner_location
            }
        )
        
    except Exception as e:
        return QRValidationResponse(
            valid=False,
            message=f"Invalid QR code format: {str(e)}"
        )

@router.get(
    "/pickup-locations",
    summary="Get Available Pickup Locations",
    description="""
    Get list of available pickup locations for group buy products.

    Returns all active branch locations where customers can pick up their orders.
    """,
    response_description="List of pickup locations",
    tags=["Pickup"],
    responses={
        200: {
            "description": "Pickup locations retrieved successfully",
            "content": {
                "application/json": {
                    "example": [
                        {
                            "id": "HARARE_A",
                            "name": "Harare Central Branch",
                            "address": "123 Main Street, Harare CBD",
                            "city": "Harare",
                            "province": "Harare",
                            "phone": "+263 123 456 789",
                            "operating_hours": "Mon-Fri 8:00-17:00, Sat 8:00-13:00"
                        }
                    ]
                }
            }
        }
    }
)
async def get_pickup_locations(db: Session = Depends(get_db)):
    """Get all available pickup locations"""
    locations = db.query(PickupLocation).filter(PickupLocation.is_active).all()
    
    result = []
    for loc in locations:
        result.append({
            "id": loc.id,
            "name": loc.name,
            "address": loc.address,
            "city": loc.city,
            "province": loc.province,
            "phone": loc.phone,
            "operating_hours": loc.operating_hours
        })
    
    return result

@router.get(
    "/my-groups",
    response_model=List[GroupResponse],
    summary="Get User's Joined Groups",
    description="""
    Get all groups that the current user has joined.

    Returns groups with participation status, progress, and pickup information.
    """,
    response_description="List of user's joined groups",
    tags=["User Groups"],
    responses={
        200: {
            "description": "User groups retrieved successfully",
            "content": {
                "application/json": {
                    "example": [
                        {
                            "id": 1,
                            "name": "Bulk Rice Purchase",
                            "status": "active",
                            "progress": "8/10",
                            "dueDate": "2024-01-15",
                            "price": "$45.00",
                            "members": 8,
                            "targetMembers": 10,
                            "savings": "$12.00 per member",
                            "pickupLocation": "Harare Central Branch",
                            "orderStatus": "Group active - more participants welcome"
                        }
                    ]
                }
            }
        }
    }
)
async def get_my_groups(
    user: User = Depends(verify_token),
    db: Session = Depends(get_db)
):
    """Get all groups the current user has joined"""
    # For AdminGroup, we don't have proper join tracking, so we'll return all active groups
    # In a real implementation, you'd track user joins in a separate table
    
    groups = db.query(AdminGroup).filter(AdminGroup.is_active).all()
    
    result = []
    for group in groups:
        # Determine status based on participant count and time
        status = "forming"
        order_status = "Waiting for more participants"
        
        if group.participants >= group.max_participants:
            status = "ready_for_pickup"
            order_status = "Ready for pickup - show QR code at branch"
        elif group.participants >= (group.max_participants * 0.5):
            status = "active"
            order_status = "Group active - more participants welcome"
        elif group.participants >= (group.max_participants * 0.8):
            status = "payment_pending"
            order_status = "Payment required - complete to proceed"
        
        # Check if deadline has passed
        if group.end_date and group.end_date < datetime.utcnow():
            if group.participants >= (group.max_participants * 0.8):
                status = "processing"
                order_status = "Order confirmed - being prepared"
        
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
            matchScore=95,  # Higher match score for joined groups
            reason="You joined this group",
            adminCreated=True,
            adminName=group.admin_name,
            savings=group.savings,
            discountPercentage=group.discount_percentage,
            shippingInfo=group.shipping_info,
            estimatedDelivery=group.estimated_delivery,
            features=group.features or [],
            requirements=group.requirements or [],
            longDescription=group.long_description,
            status=status,
            orderStatus=order_status
        ))
    
    return result

@router.get(
    "/ready-for-pickup",
    response_model=List[GroupResponse],
    summary="Get Groups Ready for Pickup",
    description="""
    Get all groups that are ready for pickup for the current user.

    Returns groups that have reached sufficient participation and are ready for collection.
    """,
    response_description="List of groups ready for pickup",
    tags=["User Groups"],
    responses={
        200: {
            "description": "Ready groups retrieved successfully",
            "content": {
                "application/json": {
                    "example": [
                        {
                            "id": 5,
                            "name": "Noise-Cancelling Headphones",
                            "status": "ready_for_pickup",
                            "progress": "25/25",
                            "dueDate": "2024-08-30",
                            "price": "$149.99",
                            "members": 25,
                            "targetMembers": 25,
                            "savings": "$50.00 per member",
                            "pickupLocation": "Harare Central Branch",
                            "orderStatus": "Ready for pickup - show QR code at branch"
                        }
                    ]
                }
            }
        }
    }
)
async def get_ready_for_pickup(
    user: User = Depends(verify_token),
    db: Session = Depends(get_db)
):
    """Get groups that are ready for pickup"""
    # Get groups that have reached sufficient participation (80% or more)
    groups = db.query(AdminGroup).filter(
        AdminGroup.is_active,
        AdminGroup.participants >= (AdminGroup.max_participants * 0.8)
    ).all()
    
    result = []
    for group in groups:
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
            matchScore=100,  # Perfect match for ready groups
            reason="Ready for pickup at your location",
            adminCreated=True,
            adminName=group.admin_name,
            savings=group.savings,
            discountPercentage=group.discount_percentage,
            shippingInfo=group.shipping_info,
            estimatedDelivery=group.estimated_delivery,
            features=group.features or [],
            requirements=group.requirements or [],
            longDescription=group.long_description,
            status="ready_for_pickup",
            orderStatus="Ready for pickup - show QR code at branch"
        ))
    
    return result

@router.get(
    "/{group_id}/qr-code",
    summary="Get QR Code for Group Pickup",
    description="""
    Generate or retrieve QR code for picking up a completed group buy.

    Returns QR code image and pickup details for the specified group.
    """,
    response_description="QR code data and pickup information",
    tags=["Pickup"],
    responses={
        200: {
            "description": "QR code generated successfully",
            "content": {
                "application/json": {
                    "example": {
                        "qr_code": "data:image/png;base64,iVBORw0KGgoAAAANSUhEUgAA...",
                        "order_id": "ORD-20250115-0001",
                        "pickup_location": "Harare Central Branch",
                        "expires_at": "2025-01-16T10:30:00Z",
                        "instructions": "Show this QR code at your pickup location"
                    }
                }
            }
        },
        403: {"description": "Group not ready for pickup"},
        404: {"description": "Group not found"}
    }
)
async def get_group_qr_code(
    group_id: int,
    user: User = Depends(verify_token),
    db: Session = Depends(get_db)
):
    """Get QR code for group pickup"""
    group = db.query(AdminGroup).filter(AdminGroup.id == group_id).first()
    if not group:
        raise HTTPException(status_code=404, detail="Group not found")
    
    # Check if group is ready for pickup
    if group.participants < (group.max_participants * 0.8):
        raise HTTPException(
            status_code=403, 
            detail="Group is not ready for pickup yet. Waiting for more participants."
        )
    
    # Check if QR code already exists and is valid
    existing_qr = db.query(QRCodePickup).filter(
        QRCodePickup.user_id == user.id,
        QRCodePickup.group_buy_id == group_id,
        ~QRCodePickup.is_used,
        QRCodePickup.expires_at > datetime.utcnow()
    ).first()
    
    if existing_qr:
        qr_image = generate_qr_code_image(existing_qr.qr_code_data)
        return {
            "qr_code": qr_image,
            "order_id": existing_qr.qr_code_data[:20],  # Extract order ID from encrypted data
            "pickup_location": existing_qr.pickup_location,
            "expires_at": existing_qr.expires_at.isoformat(),
            "instructions": "Show this QR code at your pickup location"
        }
    
    # Generate new QR code
    qr_data = {
        "order_id": f"ORD-{datetime.utcnow().strftime('%Y%m%d')}-{group_id:04d}",
        "user_id": user.id,
        "group_id": group_id,
        "pickup_location": "Harare Central Branch",  # In real implementation, user selects location
        "timestamp": datetime.utcnow().isoformat(),
        "expires_at": (datetime.utcnow() + timedelta(hours=QR_EXPIRY_HOURS)).isoformat()
    }
    
    encrypted_data = encrypt_qr_data(qr_data)
    qr_image = generate_qr_code_image(encrypted_data)
    
    # Save QR code record
    qr_record = QRCodePickup(
        qr_code_data=encrypted_data,
        user_id=user.id,
        group_buy_id=group_id,
        pickup_location="Harare Central Branch",
        expires_at=datetime.utcnow() + timedelta(hours=QR_EXPIRY_HOURS)
    )
    
    db.add(qr_record)
    db.commit()
    
    return {
        "qr_code": qr_image,
        "order_id": qr_data["order_id"],
        "pickup_location": qr_record.pickup_location,
        "expires_at": qr_record.expires_at.isoformat(),
        "instructions": "Show this QR code at your pickup location"
    }

@router.get(
    "/past-groups-summary",
    summary="Get Past Groups Summary",
    description="""
    Get summary statistics for user's completed admin-created group buys.

    Returns all-time savings, completed groups count, success rate, and average savings per group.
    """,
    response_description="Past groups summary statistics",
    tags=["User Groups"],
    responses={
        200: {
            "description": "Past groups summary retrieved successfully",
            "content": {
                "application/json": {
                    "example": {
                        "all_time_savings": 1250.00,
                        "completed_groups": 32,
                        "success_rate": 92,
                        "avg_savings_per_group": 39.06
                    }
                }
            }
        }
    }
)
async def get_past_groups_summary(
    user: User = Depends(verify_token),
    db: Session = Depends(get_db)
):
    """Get summary statistics for user's past completed groups"""
    # For AdminGroup, we don't have proper user join tracking, so we'll calculate
    # based on all completed groups (groups that reached 80%+ participation)
    # In a real implementation, you'd track user joins in a separate table
    
    # Get all "completed" groups (those that reached sufficient participation)
    completed_groups = db.query(AdminGroup).filter(
        AdminGroup.participants >= (AdminGroup.max_participants * 0.8)
    ).all()
    
    if not completed_groups:
        return {
            "all_time_savings": 0.00,
            "completed_groups": 0,
            "success_rate": 0,
            "avg_savings_per_group": 0.00
        }
    
    # Calculate total savings
    total_savings = sum(group.savings for group in completed_groups)
    
    # Count completed groups
    completed_count = len(completed_groups)
    
    # Calculate success rate (groups that reached target vs total attempted)
    total_groups = db.query(AdminGroup).count()
    success_rate = int((completed_count / total_groups * 100) if total_groups > 0 else 0)
    
    # Calculate average savings per group
    avg_savings_per_group = round(total_savings / completed_count, 2) if completed_count > 0 else 0.00
    
    return {
        "all_time_savings": round(total_savings, 2),
        "completed_groups": completed_count,
        "success_rate": success_rate,
        "avg_savings_per_group": avg_savings_per_group
    }
