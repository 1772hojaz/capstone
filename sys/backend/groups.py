from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy.orm import Session
from sqlalchemy import and_
from pydantic import BaseModel
from typing import List, Optional
from datetime import datetime
from database import get_db
from models import GroupBuy, Product, Contribution, User, Transaction
from auth import verify_token

router = APIRouter()

# Pydantic Models
class GroupBuyCreate(BaseModel):
    product_id: int
    deadline: datetime

class ContributionCreate(BaseModel):
    quantity: int

class ContributionResponse(BaseModel):
    id: int
    group_buy_id: int
    user_id: int
    user_email: str
    quantity: int
    paid_amount: float
    contribution_amount: float
    is_fully_paid: bool
    joined_at: datetime

    class Config:
        from_attributes = True

class GroupBuyResponse(BaseModel):
    id: int
    product_id: int
    product_name: str
    product_description: Optional[str] = None
    product_image_url: Optional[str]
    unit_price: float
    bulk_price: float
    unit_price_zig: Optional[float] = None
    bulk_price_zig: Optional[float] = None
    moq: int
    savings_factor: float
    creator_id: int
    location_zone: str
    deadline: datetime
    total_quantity: int
    total_contributions: float
    total_paid: float
    status: str
    moq_progress: float
    participants_count: int
    created_at: datetime
    user_quantity: Optional[int] = None

    class Config:
        from_attributes = True

# Routes
@router.get("/", response_model=List[GroupBuyResponse])
async def get_group_buys(
    status: Optional[str] = "active",
    location_zone: Optional[str] = None,
    user: User = Depends(verify_token),
    db: Session = Depends(get_db)
):
    """Get group-buys filtered by location zone"""
    query = db.query(GroupBuy)
    
    if status:
        query = query.filter(GroupBuy.status == status)
    
    if location_zone:
        query = query.filter(GroupBuy.location_zone == location_zone)
    else:
        query = query.filter(GroupBuy.location_zone == user.location_zone)
    
    query = query.filter(GroupBuy.deadline > datetime.utcnow())
    
    group_buys = query.all()
    
    result = []
    for gb in group_buys:
        result.append(GroupBuyResponse(
            id=gb.id,
            product_id=gb.product_id,
            product_name=gb.product.name,
            product_description=gb.product.description,
            product_image_url=gb.product.image_url,
            unit_price=gb.product.unit_price,
            bulk_price=gb.product.bulk_price,
            unit_price_zig=gb.product.unit_price_zig,
            bulk_price_zig=gb.product.bulk_price_zig,
            moq=gb.product.moq,
            savings_factor=gb.product.savings_factor,
            creator_id=gb.creator_id,
            location_zone=gb.location_zone,
            deadline=gb.deadline,
            total_quantity=gb.total_quantity,
            total_contributions=gb.total_contributions,
            total_paid=gb.total_paid,
            status=gb.status,
            moq_progress=gb.moq_progress,
            participants_count=gb.participants_count,
            created_at=gb.created_at
        ))
    
    return result

@router.post("/", response_model=GroupBuyResponse)
async def create_group_buy(
    group_data: GroupBuyCreate,
    user: User = Depends(verify_token),
    db: Session = Depends(get_db)
):
    """Create a new group-buy"""
    product = db.query(Product).filter(Product.id == group_data.product_id).first()
    if not product:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Product not found")
    
    if not product.is_active:
        raise HTTPException(status_code=status.HTTP_400_BAD_REQUEST, detail="Product is not available")
    
    group_buy = GroupBuy(
        product_id=group_data.product_id,
        creator_id=user.id,
        location_zone=user.location_zone,
        deadline=group_data.deadline
    )
    
    db.add(group_buy)
    db.commit()
    db.refresh(group_buy)
    
    return GroupBuyResponse(
        id=group_buy.id,
        product_id=product.id,
        product_name=product.name,
        product_description=product.description,
        product_image_url=product.image_url,
        unit_price=product.unit_price,
        bulk_price=product.bulk_price,
        unit_price_zig=product.unit_price_zig,
        bulk_price_zig=product.bulk_price_zig,
        moq=product.moq,
        savings_factor=product.savings_factor,
        creator_id=group_buy.creator_id,
        location_zone=group_buy.location_zone,
        deadline=group_buy.deadline,
        total_quantity=group_buy.total_quantity,
        total_contributions=group_buy.total_contributions,
        total_paid=group_buy.total_paid,
        status=group_buy.status,
        moq_progress=group_buy.moq_progress,
        participants_count=group_buy.participants_count,
        created_at=group_buy.created_at
    )

@router.get("/my-groups", response_model=List[GroupBuyResponse])
async def get_user_groups(
    user: User = Depends(verify_token),
    db: Session = Depends(get_db)
):
    """Get all group-buys the user has joined"""
    contributions = db.query(Contribution).filter(Contribution.user_id == user.id).all()
    
    result = []
    for contrib in contributions:
        gb = db.query(GroupBuy).filter(GroupBuy.id == contrib.group_buy_id).first()
        if gb:
            product = gb.product
            result.append(GroupBuyResponse(
                id=gb.id,
                product_id=gb.product_id,
                product_name=product.name,
                product_description=product.description,
                product_image_url=product.image_url,
                unit_price=product.unit_price,
                bulk_price=product.bulk_price,
                unit_price_zig=product.unit_price_zig,
                bulk_price_zig=product.bulk_price_zig,
                moq=product.moq,
                savings_factor=product.savings_factor,
                creator_id=gb.creator_id,
                location_zone=gb.location_zone,
                deadline=gb.deadline,
                total_quantity=gb.total_quantity,
                total_contributions=gb.total_contributions,
                total_paid=gb.total_paid,
                status=gb.status,
                moq_progress=gb.moq_progress,
                participants_count=gb.participants_count,
                created_at=gb.created_at,
                user_quantity=contrib.quantity
            ))
    
    return result

@router.get("/{group_id}", response_model=GroupBuyResponse)
async def get_group_buy_detail(
    group_id: int,
    user: User = Depends(verify_token),
    db: Session = Depends(get_db)
):
    """Get detailed information about a specific group-buy"""
    gb = db.query(GroupBuy).filter(GroupBuy.id == group_id).first()
    if not gb:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Group-buy not found")
    
    return GroupBuyResponse(
        id=gb.id,
        product_id=gb.product_id,
        product_name=gb.product.name,
        product_description=gb.product.description,
        product_image_url=gb.product.image_url,
        unit_price=gb.product.unit_price,
        bulk_price=gb.product.bulk_price,
        unit_price_zig=gb.product.unit_price_zig,
        bulk_price_zig=gb.product.bulk_price_zig,
        moq=gb.product.moq,
        savings_factor=gb.product.savings_factor,
        creator_id=gb.creator_id,
        location_zone=gb.location_zone,
        deadline=gb.deadline,
        total_quantity=gb.total_quantity,
        total_contributions=gb.total_contributions,
        total_paid=gb.total_paid,
        status=gb.status,
        moq_progress=gb.moq_progress,
        participants_count=gb.participants_count,
        created_at=gb.created_at
    )

@router.post("/{group_id}/join")
async def join_group_buy(
    group_id: int,
    contribution_data: ContributionCreate,
    user: User = Depends(verify_token),
    db: Session = Depends(get_db)
):
    """Join a group-buy by contributing"""
    gb = db.query(GroupBuy).filter(GroupBuy.id == group_id).first()
    if not gb:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Group-buy not found")
    
    if gb.status != "active":
        raise HTTPException(status_code=status.HTTP_400_BAD_REQUEST, detail="Group-buy is not active")
    
    if gb.deadline < datetime.utcnow():
        raise HTTPException(status_code=status.HTTP_400_BAD_REQUEST, detail="Group-buy has expired")
    
    existing = db.query(Contribution).filter(
        and_(Contribution.group_buy_id == group_id, Contribution.user_id == user.id)
    ).first()
    
    if existing:
        raise HTTPException(status_code=status.HTTP_400_BAD_REQUEST, detail="You have already joined this group-buy")
    
    product = gb.product
    price = product.bulk_price if (gb.total_quantity + contribution_data.quantity) >= product.moq else product.unit_price
    total_cost = price * contribution_data.quantity
    upfront_payment = max(total_cost * 0.2, 1.0)
    
    contribution = Contribution(
        group_buy_id=group_id,
        user_id=user.id,
        quantity=contribution_data.quantity,
        contribution_amount=total_cost,
        paid_amount=upfront_payment
    )
    
    db.add(contribution)
    
    gb.total_quantity += contribution_data.quantity
    gb.total_contributions += total_cost
    gb.total_paid += upfront_payment
    
    db.commit()
    
    return {
        "message": "Successfully joined group-buy",
        "contribution_id": contribution.id,
        "quantity": contribution.quantity,
        "upfront_payment": upfront_payment,
        "total_cost": total_cost
    }

@router.get("/{group_id}/contributions", response_model=List[ContributionResponse])
async def get_group_contributions(
    group_id: int,
    user: User = Depends(verify_token),
    db: Session = Depends(get_db)
):
    """Get all contributions for a group-buy"""
    gb = db.query(GroupBuy).filter(GroupBuy.id == group_id).first()
    if not gb:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Group-buy not found")
    
    contributions = db.query(Contribution).filter(Contribution.group_buy_id == group_id).all()
    
    result = []
    for contrib in contributions:
        contributor = db.query(User).filter(User.id == contrib.user_id).first()
        result.append(ContributionResponse(
            id=contrib.id,
            group_buy_id=contrib.group_buy_id,
            user_id=contrib.user_id,
            user_email=contributor.email if contributor else "Unknown",
            quantity=contrib.quantity,
            paid_amount=contrib.paid_amount,
            contribution_amount=contrib.contribution_amount,
            is_fully_paid=contrib.is_fully_paid,
            joined_at=contrib.joined_at
        ))
    
    return result

@router.put("/{group_id}/contribution")
async def update_contribution(
    group_id: int,
    contribution_data: ContributionCreate,
    user: User = Depends(verify_token),
    db: Session = Depends(get_db)
):
    """Update user's contribution quantity (increase only)"""
    gb = db.query(GroupBuy).filter(GroupBuy.id == group_id).first()
    if not gb:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Group-buy not found")
    
    if gb.status != "active":
        raise HTTPException(status_code=status.HTTP_400_BAD_REQUEST, detail="Group-buy is not active")
    
    contribution = db.query(Contribution).filter(
        and_(Contribution.group_buy_id == group_id, Contribution.user_id == user.id)
    ).first()
    
    if not contribution:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="You haven't joined this group-buy")
    
    if contribution_data.quantity < contribution.quantity:
        raise HTTPException(status_code=status.HTTP_400_BAD_REQUEST, detail="Cannot decrease quantity")
    
    quantity_increase = contribution_data.quantity - contribution.quantity
    product = gb.product
    price = product.bulk_price if gb.total_quantity >= product.moq else product.unit_price
    additional_cost = price * quantity_increase
    additional_payment = max(additional_cost * 0.2, 1.0)
    
    contribution.quantity = contribution_data.quantity
    contribution.contribution_amount += additional_cost
    contribution.paid_amount += additional_payment
    
    gb.total_quantity += quantity_increase
    gb.total_contributions += additional_cost
    gb.total_paid += additional_payment
    
    db.commit()
    
    return {
        "message": "Contribution updated successfully",
        "new_quantity": contribution.quantity,
        "additional_payment": additional_payment
    }

@router.post("/{group_id}/pay")
async def make_payment(
    group_id: int,
    user: User = Depends(verify_token),
    db: Session = Depends(get_db)
):
    """Make full payment for remaining balance"""
    gb = db.query(GroupBuy).filter(GroupBuy.id == group_id).first()
    if not gb:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Group-buy not found")
    
    contribution = db.query(Contribution).filter(
        and_(Contribution.group_buy_id == group_id, Contribution.user_id == user.id)
    ).first()
    
    if not contribution:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="You haven't joined this group-buy")
    
    product = gb.product
    price = product.bulk_price if gb.total_quantity >= product.moq else product.unit_price
    total_cost = price * contribution.quantity
    remaining = total_cost - contribution.paid_amount
    
    if remaining <= 0:
        return {"message": "Payment already complete", "remaining_balance": 0}
    
    transaction = Transaction(
        user_id=user.id,
        group_buy_id=group_id,
        amount=remaining,
        transaction_type="payment",
        status="completed"
    )
    
    db.add(transaction)
    
    contribution.paid_amount += remaining
    contribution.is_fully_paid = True
    gb.total_paid += remaining
    
    db.commit()
    
    return {
        "message": "Payment successful",
        "amount_paid": remaining,
        "total_paid": contribution.paid_amount
    }
