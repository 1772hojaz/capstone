from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy.orm import Session
from typing import List, Optional, Dict, Any
import os
import sys
import qrcode
import json
from datetime import datetime, timedelta
import base64
import io
from cryptography.fernet import Fernet

# Add project root to Python path
sys.path.append(os.path.dirname(os.path.dirname(os.path.dirname(os.path.dirname(os.path.abspath(__file__))))))

# Import database and models
from db.database import get_db
from models import User, AdminGroup, Contribution, GroupBuy, AdminGroupJoin
from schemas.group import (
    GroupResponse,
    GroupDetailResponse,
    GroupCreateRequest,
    JoinGroupRequest,
    UpdateContributionRequest,
    QRCodeResponse,
    QRValidationRequest,
    QRValidationResponse,
    PickupStatusResponse
)
from .auth import verify_token

router = APIRouter()

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

    # Return plain base64 (frontend will prefix with data URI as needed)
    return img_base64


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
    """
    try:
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
        qr_image_base64 = generate_qr_code_image(qr_content)

        return {
            "qr_code": qr_image_base64,
            "qr_content": qr_content,
            "expires_at": expires_at,
            "pickup_instructions": f"Show this QR code at {pickup_location} and present valid ID when requested"
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
        # Get user's contributions and the associated group buys
        contributions = db.query(Contribution).filter(
            Contribution.user_id == user.id
        ).all()
        
        groups_data = []
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
                    "image": group_buy.product.image_url or "/api/placeholder/300/200",
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
                    "adminName": group_buy.creator.full_name if group_buy.creator else "Admin",
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
    """Join a group-buy by creating a contribution.

    Allows users to join an active group-buy by specifying quantity and delivery preferences.
    Creates a contribution record and initial transaction.
    """
    try:
        # Check if group exists and is active
        group = db.query(AdminGroup).filter(
            AdminGroup.id == group_id,
            AdminGroup.is_active
        ).first()

        if not group:
            raise HTTPException(
                status_code=status.HTTP_404_NOT_FOUND,
                detail="Group not found or no longer active"
            )

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
        if group.max_participants and group.participants >= group.max_participants:
            raise HTTPException(
                status_code=status.HTTP_400_BAD_REQUEST,
                detail="Group is full"
            )

        # Calculate contribution amount (upfront payment - typically 50%)
        contribution_amount = request.quantity * group.price
        upfront_amount = contribution_amount * 0.5  # 50% upfront

        # Create admin group join record
        join_record = AdminGroupJoin(
            user_id=user.id,
            admin_group_id=group_id,
            quantity=request.quantity,
            delivery_method=request.delivery_method,
            payment_method=request.payment_method,
            special_instructions=request.special_instructions
        )

        db.add(join_record)

        # Update group participant count
        group.participants += 1

        # Create initial transaction record
        from models import Transaction
        transaction = Transaction(
            user_id=user.id,
            group_buy_id=None,  # Admin groups don't have group_buy_id
            product_id=None,  # Will be set when group completes
            quantity=request.quantity,
            amount=upfront_amount,
            transaction_type="upfront",
            location_zone=user.location_zone or "Unknown"
            # Note: Transaction model doesn't have delivery_method/payment_method fields
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
            "group_progress": f"{group.participants}/{group.max_participants or 'unlimited'}"
        }

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
            admin_name=user.full_name or "Admin",
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
            adminName=admin_group.admin_name,
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
