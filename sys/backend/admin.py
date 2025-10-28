from fastapi import APIRouter, Depends, HTTPException, status, UploadFile, File
from sqlalchemy.orm import Session
from sqlalchemy import func, and_
from pydantic import BaseModel
from typing import List, Optional
from datetime import datetime, timedelta
from database import get_db
from models import User, GroupBuy, Product, Transaction, MLModel, AdminGroup, AdminGroupJoin, QRCodeGenerateRequest, QRCodeGenerateResponse, QRCodeScanResponse, UserProductPurchaseInfo, QRCodePickup
from groups import decrypt_qr_data
from auth import verify_admin
import cloudinary
import cloudinary.uploader
import cloudinary.api
import os
import secrets
import hashlib

# Configure Cloudinary
cloudinary.config(
    cloud_name=os.getenv('CLOUDINARY_CLOUD_NAME'),
    api_key=os.getenv('CLOUDINARY_API_KEY'),
    api_secret=os.getenv('CLOUDINARY_API_SECRET')
)

router = APIRouter()

# Pydantic Models
class DashboardStats(BaseModel):
    total_users: int
    total_products: int
    total_transactions: int
    active_group_buys: int
    completed_group_buys: int
    total_revenue: float
    total_savings: float

class GroupBuyDetail(BaseModel):
    id: int
    product_name: str
    creator_email: str
    location_zone: str
    deadline: datetime
    status: str
    total_quantity: int
    moq: int
    moq_progress: float
    participants_count: int
    total_contributions: float
    total_paid: float
    is_fully_funded: bool

class UserDetail(BaseModel):
    id: int
    email: str
    full_name: str
    location_zone: str
    cluster_id: Optional[int]
    total_transactions: int
    total_spent: float
    created_at: datetime

class ReportData(BaseModel):
    period: str
    total_group_buys: int
    successful_group_buys: int
    total_participants: int
    total_revenue: float
    avg_savings: float
    top_products: List[dict]
    cluster_distribution: List[dict]

class CreateGroupRequest(BaseModel):
    name: str
    description: str
    long_description: Optional[str] = None
    category: str
    price: float
    original_price: float
    image: str  # URL from Cloudinary
    max_participants: int
    end_date: datetime
    admin_name: Optional[str] = "Admin"
    shipping_info: Optional[str] = "Free shipping when group goal is reached"
    estimated_delivery: Optional[str] = "2-3 weeks after group completion"
    features: Optional[List[str]] = []
    requirements: Optional[List[str]] = []

class UpdateGroupRequest(BaseModel):
    name: Optional[str] = None
    description: Optional[str] = None
    category: Optional[str] = None
    product_name: Optional[str] = None
    regular_price: Optional[float] = None

class ImageUploadResponse(BaseModel):
    image_url: str
    public_id: str

# Routes
@router.get("/dashboard", response_model=DashboardStats)
async def get_dashboard_stats(
    admin = Depends(verify_admin),
    db: Session = Depends(get_db)
):
    """Get dashboard statistics"""
    # Count non-admin users correctly. Use bitwise not (~) or explicit comparison instead
    total_users = db.query(func.count(User.id)).filter(~User.is_admin).scalar()
    total_products = db.query(func.count(Product.id)).filter(Product.is_active).scalar()
    total_transactions = db.query(func.count(Transaction.id)).scalar()
    active_group_buys = db.query(func.count(GroupBuy.id)).filter(GroupBuy.status == "active").scalar()
    completed_group_buys = db.query(func.count(GroupBuy.id)).filter(GroupBuy.status == "completed").scalar()
    
    # Calculate total revenue from transactions (includes upfront and final payments)
    # This gives a more accurate picture of money actually transacted in the system.
    total_revenue = db.query(func.sum(Transaction.amount)).scalar() or 0.0
    
    # Calculate total savings from completed group-buys
    completed_groups = db.query(GroupBuy).filter(GroupBuy.status == "completed").all()
    total_savings = sum(
        gb.total_quantity * (gb.product.unit_price - gb.product.bulk_price)
        for gb in completed_groups if gb.product and gb.total_quantity
    )
    
    return DashboardStats(
        total_users=total_users or 0,
        total_products=total_products or 0,
        total_transactions=total_transactions or 0,
        active_group_buys=active_group_buys or 0,
        completed_group_buys=completed_group_buys or 0,
        total_revenue=float(total_revenue),
        total_savings=float(total_savings)
    )

@router.get("/groups", response_model=List[GroupBuyDetail])
async def get_all_group_buys(
    status: Optional[str] = None,
    location_zone: Optional[str] = None,
    admin = Depends(verify_admin),
    db: Session = Depends(get_db)
):
    """Get all group-buys with filtering"""
    query = db.query(GroupBuy)
    
    if status:
        query = query.filter(GroupBuy.status == status)
    
    if location_zone:
        query = query.filter(GroupBuy.location_zone == location_zone)
    
    group_buys = query.all()
    
    result = []
    for gb in group_buys:
        is_fully_funded = all(c.is_fully_paid for c in gb.contributions) if gb.contributions else False
        
        result.append(GroupBuyDetail(
            id=gb.id,
            product_name=gb.product.name,
            creator_email=gb.creator.email,
            location_zone=gb.location_zone,
            deadline=gb.deadline,
            status=gb.status,
            total_quantity=gb.total_quantity,
            moq=gb.product.moq,
            moq_progress=gb.moq_progress,
            participants_count=gb.participants_count,
            total_contributions=gb.total_contributions,
            total_paid=gb.total_paid,
            is_fully_funded=is_fully_funded
        ))
    
    return result

@router.get("/users", response_model=List[UserDetail])
async def get_all_users(
    location_zone: Optional[str] = None,
    cluster_id: Optional[int] = None,
    admin = Depends(verify_admin),
    db: Session = Depends(get_db)
):
    """Get all users with filtering"""
    # Filter out admin users correctly
    query = db.query(User).filter(~User.is_admin)
    
    if location_zone:
        query = query.filter(User.location_zone == location_zone)
    
    if cluster_id is not None:
        query = query.filter(User.cluster_id == cluster_id)
    
    users = query.all()
    
    result = []
    for user in users:
        transaction_count = db.query(func.count(Transaction.id)).filter(
            Transaction.user_id == user.id
        ).scalar()
        
        total_spent = db.query(func.sum(Transaction.amount)).filter(
            Transaction.user_id == user.id
        ).scalar() or 0.0
        
        result.append(UserDetail(
            id=user.id,
            email=user.email,
            full_name=user.full_name or "",
            location_zone=user.location_zone,
            cluster_id=user.cluster_id,
            total_transactions=transaction_count or 0,
            total_spent=float(total_spent),
            created_at=user.created_at
        ))
    
    return result

@router.post("/groups/{group_id}/complete")
async def complete_group_buy(
    group_id: int,
    admin = Depends(verify_admin),
    db: Session = Depends(get_db)
):
    """Mark a group-buy as completed (Admin only)"""
    group = db.query(GroupBuy).filter(GroupBuy.id == group_id).first()
    if not group:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Group-buy not found")
    
    # Check if all contributions are fully paid
    all_paid = all(c.is_fully_paid for c in group.contributions)
    if not all_paid:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="Not all participants have fully paid"
        )
    
    # Check if MOQ is met
    if group.total_quantity < group.product.moq:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="MOQ not met"
        )
    
    group.status = "completed"
    group.completed_at = datetime.utcnow()
    db.commit()
    
    return {"message": "Group-buy completed successfully"}

@router.post("/groups/{group_id}/cancel")
async def cancel_group_buy(
    group_id: int,
    admin = Depends(verify_admin),
    db: Session = Depends(get_db)
):
    """Cancel a group-buy (Admin only)"""
    group = db.query(GroupBuy).filter(GroupBuy.id == group_id).first()
    if not group:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Group-buy not found")
    
    group.status = "cancelled"
    db.commit()
    
    return {"message": "Group-buy cancelled"}

@router.post("/groups/{group_id}/process-payment")
async def process_admin_group_payment(
    group_id: int,
    admin = Depends(verify_admin),
    db: Session = Depends(get_db)
):
    """Process payment for an admin-managed group that has reached its target.

    This marks the group as completed and handles the payment processing workflow.
    Only admin users can process payments.
    """
    try:
        # Get the admin group
        group = db.query(AdminGroup).filter(AdminGroup.id == group_id).first()
        if not group:
            raise HTTPException(
                status_code=status.HTTP_404_NOT_FOUND,
                detail="Admin group not found"
            )

        # Check if group is active and has reached target
        if not group.is_active:
            raise HTTPException(
                status_code=status.HTTP_400_BAD_REQUEST,
                detail="Group is not active"
            )

        if group.participants < group.max_participants:
            raise HTTPException(
                status_code=status.HTTP_400_BAD_REQUEST,
                detail=f"Group has not reached target. {group.participants}/{group.max_participants} participants"
            )

        # Get all joins for this group
        joins = db.query(AdminGroupJoin).filter(
            AdminGroupJoin.admin_group_id == group_id
        ).all()

        if not joins:
            raise HTTPException(
                status_code=status.HTTP_400_BAD_REQUEST,
                detail="No participants found for this group"
            )

        # Calculate total amount and process payments
        total_amount = sum(join.quantity * group.price for join in joins)
        total_participants = len(joins)

        # Here you would integrate with actual payment processing
        # For now, we'll simulate successful payment processing

        # Mark group as completed (you might want to add a status field to AdminGroup)
        # For now, we'll just update the participants and mark as inactive
        group.is_active = False

        # Create transaction records for each participant
        from models import Transaction
        for join in joins:
            transaction = Transaction(
                user_id=join.user_id,
                group_buy_id=None,  # Admin groups don't have group_buy_id
                product_id=None,  # Will be set when product is assigned
                quantity=join.quantity,
                amount=join.quantity * group.price,  # Full amount now that payment is processed
                transaction_type="final",
                location_zone="Admin Group",  # Placeholder
                created_at=datetime.utcnow()
            )
            db.add(transaction)

        db.commit()

        return {
            "message": "Payment processed successfully",
            "group_id": group_id,
            "total_participants": total_participants,
            "total_amount": round(total_amount, 2),
            "status": "completed",
            "processed_at": datetime.utcnow().isoformat()
        }

    except HTTPException:
        raise
    except Exception as e:
        print(f"Error processing payment for admin group {group_id}: {e}")
        db.rollback()
        raise HTTPException(status_code=500, detail="Failed to process payment")

@router.get("/reports", response_model=ReportData)
async def get_reports(
    period: str = "month",  # week, month, year
    admin = Depends(verify_admin),
    db: Session = Depends(get_db)
):
    """Generate reports"""
    now = datetime.utcnow()
    
    if period == "week":
        start_date = now - timedelta(days=7)
    elif period == "month":
        start_date = now - timedelta(days=30)
    elif period == "year":
        start_date = now - timedelta(days=365)
    else:
        start_date = now - timedelta(days=30)
    
    # Get group-buys in period
    group_buys = db.query(GroupBuy).filter(
        GroupBuy.created_at >= start_date
    ).all()
    
    total_group_buys = len(group_buys)
    successful_group_buys = len([gb for gb in group_buys if gb.status == "completed"])
    
    # Get transactions
    transactions = db.query(Transaction).filter(
        Transaction.created_at >= start_date
    ).all()
    
    total_participants = db.query(func.count(func.distinct(Transaction.user_id))).filter(
        Transaction.created_at >= start_date
    ).scalar() or 0
    
    total_revenue = sum(t.amount for t in transactions)
    
    # Calculate average savings
    completed = [gb for gb in group_buys if gb.status == "completed"]
    avg_savings = sum(
        gb.product.savings_factor * 100
        for gb in completed if gb.product
    ) / len(completed) if completed else 0
    
    # Top products
    product_stats = db.query(
        Product.name,
        func.count(GroupBuy.id).label('group_count')
    ).join(GroupBuy).filter(
        GroupBuy.created_at >= start_date
    ).group_by(Product.name).order_by(func.count(GroupBuy.id).desc()).limit(5).all()
    
    top_products = [
        {"product": p.name, "group_count": p.group_count}
        for p in product_stats
    ]
    
    # Cluster distribution
    cluster_stats = db.query(
        User.cluster_id,
        func.count(User.id).label('user_count')
    ).filter(
        User.cluster_id.isnot(None)
    ).group_by(User.cluster_id).all()
    
    cluster_distribution = [
        {"cluster_id": c.cluster_id, "user_count": c.user_count}
        for c in cluster_stats
    ]
    
    return ReportData(
        period=period,
        total_group_buys=total_group_buys,
        successful_group_buys=successful_group_buys,
        total_participants=total_participants,
        total_revenue=total_revenue,
        avg_savings=avg_savings,
        top_products=top_products,
        cluster_distribution=cluster_distribution
    )


@router.get("/activity")
async def get_activity_data(
    months: int = 6,
    admin = Depends(verify_admin),
    db: Session = Depends(get_db)
):
    """Return activity time series for the last `months` months.

    Response: [{ month: 'Jan', groups: int, users: int }, ...]
    """
    try:
        # Clamp months
        months = max(1, min(24, months))

        now = datetime.utcnow()
        # Build month buckets as YYYY-MM strings
        buckets = []
        for i in range(months - 1, -1, -1):
            dt = (now - timedelta(days=i * 30))
            key = dt.strftime('%Y-%m')
            label = dt.strftime('%b')
            buckets.append((key, label))

        # Query group buys per month (by created_at)
        group_counts = dict(db.query(
            func.strftime('%Y-%m', GroupBuy.created_at).label('m'),
            func.count(GroupBuy.id)
        ).group_by('m').all())

        # Query new users per month (by created_at)
        user_counts = dict(db.query(
            func.strftime('%Y-%m', User.created_at).label('m'),
            func.count(User.id)
        ).group_by('m').all())

        result = []
        for key, label in buckets:
            groups = int(group_counts.get(key, 0))
            users = int(user_counts.get(key, 0))
            result.append({
                'month': label,
                'month_key': key,
                'groups': groups,
                'users': users
            })

        return result
    except Exception as e:
        print(f"Error building activity data: {e}")
        raise HTTPException(status_code=500, detail="Failed to build activity data")

@router.post("/retrain")
async def trigger_retrain(
    admin = Depends(verify_admin),
    db: Session = Depends(get_db)
):
    """Trigger ML model retraining with progress tracking"""
    # Import here to avoid circular dependency
    from ml import train_clustering_model_with_progress
    import asyncio
    
    try:
        # Start training in background with progress tracking
        asyncio.create_task(train_clustering_model_with_progress(db))
        
        return {
            "status": "started",
            "message": "Model retraining started. Check /api/admin/ml-system-status for current status."
        }
    except Exception as e:
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail=f"Error starting retraining: {str(e)}"
        )

# ML Performance Tracking
class MLModelPerformance(BaseModel):
    id: int
    model_type: str
    silhouette_score: float
    n_clusters: int
    nmf_rank: int
    tfidf_vocab_size: int
    trained_at: datetime
    is_active: bool
    
    class Config:
        from_attributes = True

@router.get("/ml-performance", response_model=List[MLModelPerformance])
async def get_ml_performance(
    admin = Depends(verify_admin),
    db: Session = Depends(get_db)
):
    """Get ML model performance history"""
    models = db.query(MLModel).filter(
        MLModel.model_type == "hybrid_recommender"
    ).order_by(MLModel.trained_at.desc()).limit(20).all()
    
    result = []
    for model in models:
        result.append(MLModelPerformance(
            id=model.id,
            model_type=model.model_type,
            silhouette_score=model.metrics.get('silhouette_score', 0),
            n_clusters=model.metrics.get('n_clusters', 0),
            nmf_rank=model.metrics.get('nmf_rank', 0),
            tfidf_vocab_size=model.metrics.get('tfidf_vocab_size', 0),
            trained_at=model.trained_at,
            is_active=model.is_active
        ))
    
    return result

@router.post("/ml-cleanup")
async def cleanup_poor_models(
    admin = Depends(verify_admin),
    db: Session = Depends(get_db)
):
    """Manually trigger cleanup of poor performing models"""
    from ml_scheduler import scheduler
    
    # Get best model
    best_model = db.query(MLModel).filter(
        MLModel.model_type == "clustering"
    ).order_by(MLModel.trained_at.desc()).first()
    
    if not best_model:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="No trained models found"
        )
    
    # Run cleanup
    await scheduler.cleanup_poor_models(db, best_model)
    
    return {
        "status": "success",
        "message": "Model cleanup completed",
        "best_score": best_model.metrics.get('silhouette_score', 0)
    }

@router.get("/ml-system-status")
async def get_ml_system_status(
    admin = Depends(verify_admin),
    db: Session = Depends(get_db)
):
    """Get real-time ML system status and health metrics"""
    try:
        # Check if ML models exist and are active
        active_models = db.query(MLModel).filter(MLModel.is_active).count()
        total_models = db.query(MLModel).count()

        # Get latest model update time
        latest_model = db.query(MLModel).order_by(MLModel.trained_at.desc()).first()
        last_updated = latest_model.trained_at if latest_model else None

        # Calculate time since last update
        if last_updated:
            time_diff = datetime.utcnow() - last_updated
            hours_ago = time_diff.total_seconds() / 3600
            if hours_ago < 1:
                last_updated_str = "Less than 1h ago"
            elif hours_ago < 24:
                last_updated_str = f"{int(hours_ago)}h ago"
            else:
                days_ago = int(hours_ago / 24)
                last_updated_str = f"{days_ago}d ago"
        else:
            last_updated_str = "Never"

        # Determine system health based on model availability
        if active_models > 0:
            system_health = "All systems operational"
            health_status = "operational"
        elif total_models > 0:
            system_health = "Models available but not active"
            health_status = "warning"
        else:
            system_health = "No ML models available"
            health_status = "critical"

        # Mock response time - in a real system, this would be tracked
        # For now, we'll simulate based on system load
        import random
        response_time = random.randint(50, 150)  # 50-150ms range

        return {
            "system_health": system_health,
            "health_status": health_status,
            "response_time_ms": response_time,
            "response_time_display": f"{response_time}ms average",
            "model_updates": last_updated_str,
            "active_models": active_models,
            "total_models": total_models,
            "last_updated": last_updated.isoformat() if last_updated else None,
            "checklist": {
                "recommendation_engine": active_models > 0,
                "data_processing_pipeline": True,  # Assume always running
                "model_serving_api": active_models > 0,
                "training_infrastructure": True  # Assume always available
            }
        }

    except Exception as e:
        print(f"Error getting ML system status: {e}")
        return {
            "system_health": "System status unavailable",
            "health_status": "unknown",
            "response_time_ms": 0,
            "response_time_display": "N/A",
            "model_updates": "Unknown",
            "active_models": 0,
            "total_models": 0,
            "last_updated": None,
            "checklist": {
                "recommendation_engine": False,
                "data_processing_pipeline": False,
                "model_serving_api": False,
                "training_infrastructure": False
            }
        }

@router.get("/groups/active", response_model=List[dict])
async def get_active_groups_for_moderation(
    admin = Depends(verify_admin),
    db: Session = Depends(get_db)
):
    """Get active groups for admin moderation dashboard"""
    try:
        # Get all active admin groups
        active_groups = db.query(AdminGroup).filter(AdminGroup.is_active).all()

        result = []
        for group in active_groups:
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
                    "name": group.name,  # Using group name as product name for simplicity
                    "description": group.long_description or group.description,
                    "regularPrice": f"${group.original_price:.2f}" if group.original_price else f"${group.price:.2f}",
                    "bulkPrice": f"${group.price:.2f}",
                    "image": group.image or "/api/placeholder/300/200",
                    "totalStock": "N/A",  # Admin groups don't have stock limits
                    "specifications": "Admin managed group buy",
                    "manufacturer": "Various",
                    "warranty": "As per product"
                }
            })

        return result

    except Exception as e:
        print(f"Error getting active groups: {e}")
        raise HTTPException(status_code=500, detail="Failed to fetch active groups")

@router.get("/groups/ready-for-payment", response_model=List[dict])
async def get_ready_for_payment_groups(
    admin = Depends(verify_admin),
    db: Session = Depends(get_db)
):
    """Get groups that have reached their target and are ready for payment processing"""
    try:
        # Get admin groups that have reached their target (100% complete)
        ready_groups = db.query(AdminGroup).filter(
            AdminGroup.is_active,
            AdminGroup.max_participants.isnot(None),
            AdminGroup.participants >= AdminGroup.max_participants
        ).all()

        result = []
        for group in ready_groups:
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
                    "name": group.name,
                    "description": group.long_description or group.description,
                    "regularPrice": f"${group.original_price:.2f}" if group.original_price else f"${group.price:.2f}",
                    "bulkPrice": f"${group.price:.2f}",
                    "image": group.image or "/api/placeholder/300/200",
                    "totalStock": "N/A",
                    "specifications": "Admin managed group buy",
                    "manufacturer": "Various",
                    "warranty": "As per product"
                }
            })

        return result

    except Exception as e:
        print(f"Error getting ready for payment groups: {e}")
        raise HTTPException(status_code=500, detail="Failed to fetch ready for payment groups")

@router.get("/groups/moderation-stats")
async def get_group_moderation_stats(
    admin = Depends(verify_admin),
    db: Session = Depends(get_db)
):
    """Get statistics for group moderation dashboard"""
    try:
        # Active groups count
        active_groups_count = db.query(func.count(AdminGroup.id)).filter(
            AdminGroup.is_active
        ).scalar() or 0

        # Total members across all active groups
        total_members = db.query(func.sum(AdminGroup.participants)).filter(
            AdminGroup.is_active
        ).scalar() or 0

        # Ready for payment groups count (groups that are 100% complete)
        ready_for_payment_count = db.query(func.count(AdminGroup.id)).filter(
            AdminGroup.is_active,
            AdminGroup.max_participants.isnot(None),
            AdminGroup.participants >= AdminGroup.max_participants
        ).scalar() or 0

        # Required action count (groups that need attention - could be expired, problematic, etc.)
        # For now, let's count groups that are past their deadline but still active
        required_action_count = db.query(func.count(AdminGroup.id)).filter(
            AdminGroup.is_active,
            AdminGroup.end_date < datetime.utcnow()
        ).scalar() or 0

        return {
            "active_groups": active_groups_count,
            "total_members": total_members,
            "ready_for_payment": ready_for_payment_count,
            "required_action": required_action_count
        }

    except Exception as e:
        print(f"Error getting moderation stats: {e}")
        raise HTTPException(status_code=500, detail="Failed to fetch moderation stats")

@router.post("/upload-image", response_model=ImageUploadResponse)
async def upload_image(
    file: UploadFile = File(...),
    admin = Depends(verify_admin)
):
    """Upload an image to Cloudinary and return the URL"""
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
            folder="groupbuy_products",
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

# Helper function to generate secure QR code data
def generate_qr_code_data(user_id: int, group_buy_id: int) -> str:
    """Generate a secure QR code string using user_id, group_buy_id and random token"""
    # Create a unique string combining user, group buy and random token
    random_token = secrets.token_urlsafe(32)
    data_string = f"{user_id}:{group_buy_id}:{random_token}:{datetime.utcnow().isoformat()}"
    
    # Hash the string for security
    qr_code_data = hashlib.sha256(data_string.encode()).hexdigest()
    return qr_code_data

@router.post("/qr/generate", response_model=QRCodeGenerateResponse)
async def generate_qr_code(
    request: QRCodeGenerateRequest,
    admin = Depends(verify_admin),
    db: Session = Depends(get_db)
):
    """Generate a QR code for a user's purchase"""
    try:
        # Verify user exists
        user = db.query(User).filter(User.id == request.user_id).first()
        if not user:
            raise HTTPException(status_code=404, detail="User not found")
        
        # Verify group buy exists
        group_buy = db.query(GroupBuy).filter(GroupBuy.id == request.group_buy_id).first()
        if not group_buy:
            raise HTTPException(status_code=404, detail="Group buy not found")
        
        # Check if user has purchased this product
        transaction = db.query(Transaction).filter(
            and_(
                Transaction.user_id == request.user_id,
                Transaction.group_buy_id == request.group_buy_id
            )
        ).first()
        
        if not transaction:
            raise HTTPException(
                status_code=400, 
                detail="User has not purchased this product"
            )
        
        # Generate QR code data
        qr_code_data = generate_qr_code_data(request.user_id, request.group_buy_id)
        
        # Set expiration date
        expires_at = datetime.utcnow() + timedelta(days=request.validity_days)
        
        # Create QR code record
        qr_record = QRCodePickup(
            qr_code_data=qr_code_data,
            user_id=request.user_id,
            group_buy_id=request.group_buy_id,
            pickup_location=request.pickup_location,
            expires_at=expires_at
        )
        
        db.add(qr_record)
        db.commit()
        db.refresh(qr_record)
        
        return QRCodeGenerateResponse(
            qr_code_data=qr_code_data,
            expires_at=expires_at,
            message="QR code generated successfully"
        )
        
    except HTTPException:
        raise
    except Exception as e:
        db.rollback()
        raise HTTPException(status_code=500, detail=f"Failed to generate QR code: {str(e)}")

@router.get("/qr/scan/{qr_code_data}", response_model=QRCodeScanResponse)
async def scan_qr_code(
    qr_code_data: str,
    admin = Depends(verify_admin),
    db: Session = Depends(get_db)
):
    """Scan a QR code to get product purchase information"""
    try:
        # First, try to find the QR code in the database (for admin-generated QR codes)
        qr_record = db.query(QRCodePickup).filter(
            QRCodePickup.qr_code_data == qr_code_data
        ).first()

        if qr_record:
            # Handle database-stored QR codes
            # Check if QR code is expired
            if qr_record.expires_at < datetime.utcnow():
                raise HTTPException(status_code=400, detail="QR code has expired")

            # Get user information
            user = db.query(User).filter(User.id == qr_record.user_id).first()
            if not user:
                raise HTTPException(status_code=404, detail="User not found")

            # Get group buy and product information
            group_buy = db.query(GroupBuy).filter(GroupBuy.id == qr_record.group_buy_id).first()
            if not group_buy:
                raise HTTPException(status_code=404, detail="Group buy not found")

            product = group_buy.product
            if not product:
                raise HTTPException(status_code=404, detail="Product not found")

            # Get transaction information - try multiple ways to find it
            transaction = db.query(Transaction).filter(
                and_(
                    Transaction.user_id == qr_record.user_id,
                    Transaction.group_buy_id == qr_record.group_buy_id
                )
            ).first()

            # If no transaction found with group_buy_id, try finding any transaction for this user
            # This handles cases where transactions were created without group_buy_id
            if not transaction:
                transaction = db.query(Transaction).filter(
                    Transaction.user_id == qr_record.user_id
                ).first()

            if not transaction:
                raise HTTPException(status_code=404, detail="Transaction not found")

            # Mark QR code as used if not already used
            if not qr_record.is_used:
                qr_record.is_used = True
                qr_record.used_at = datetime.utcnow()
                qr_record.used_by_staff = getattr(admin, 'email', 'Unknown Admin')
                qr_record.used_location = qr_record.pickup_location
                db.commit()
        else:
            # Handle encrypted QR codes from trader side
            try:
                if qr_code_data.startswith("QR-"):
                    # Look up the QR data from database instead of cache
                    qr_record = db.query(QRCodePickup).filter(
                        QRCodePickup.qr_code_data == qr_code_data
                    ).first()
                    
                    print(f"DEBUG: Looking up QR ID {qr_code_data} in database")
                    if not qr_record:
                        print(f"DEBUG: QR ID {qr_code_data} not found in database")
                        raise HTTPException(status_code=400, detail="Invalid QR code")
                    
                    # Get encrypted data from used_location field
                    encrypted_data = qr_record.used_location
                    print(f"DEBUG: Found encrypted data: {encrypted_data[:50]}...")
                else:
                    # Direct encrypted data (for backward compatibility)
                    encrypted_data = qr_code_data
                
                # Try to decrypt the QR code data
                decrypted_data = decrypt_qr_data(encrypted_data)

                # Extract information from decrypted payload
                user_id = decrypted_data.get("user_id")
                group_id = decrypted_data.get("group_id")
                expires_at_str = decrypted_data.get("expires_at")

                if not user_id or not group_id:
                    raise HTTPException(status_code=400, detail="Invalid QR code format")

                # Check expiration
                if expires_at_str:
                    expires_at = datetime.fromisoformat(expires_at_str.replace('Z', '+00:00'))
                    if expires_at < datetime.utcnow():
                        raise HTTPException(status_code=400, detail="QR code has expired")

                # Get user information
                user = db.query(User).filter(User.id == user_id).first()
                if not user:
                    raise HTTPException(status_code=404, detail="User not found")

                # Get group buy and product information
                group_buy = db.query(GroupBuy).filter(GroupBuy.id == group_id).first()
                if not group_buy:
                    raise HTTPException(status_code=404, detail="Group buy not found")

                product = group_buy.product
                if not product:
                    raise HTTPException(status_code=404, detail="Product not found")

                # Get transaction information - try multiple ways to find it
                transaction = db.query(Transaction).filter(
                    and_(
                        Transaction.user_id == user_id,
                        Transaction.group_buy_id == group_id
                    )
                ).first()

                # If no transaction found with group_buy_id, try finding any transaction for this user
                # This handles cases where transactions were created without group_buy_id
                if not transaction:
                    transaction = db.query(Transaction).filter(
                        Transaction.user_id == user_id
                    ).first()

                if not transaction:
                    raise HTTPException(status_code=404, detail="Transaction not found")

                # For encrypted QR codes, we don't store usage in database
                # But we can create a record for tracking purposes
                qr_record = QRCodePickup(
                    qr_code_data=qr_code_data,
                    user_id=user_id,
                    group_buy_id=group_id,
                    pickup_location="Encrypted QR Scan",
                    expires_at=expires_at if expires_at_str else datetime.utcnow() + timedelta(hours=24),
                    is_used=True,
                    used_at=datetime.utcnow(),
                    used_by_staff=getattr(admin, 'email', 'Unknown Admin'),
                    used_location="Encrypted QR Scan"
                )
                db.add(qr_record)
                db.commit()

            except Exception:
                raise HTTPException(status_code=400, detail="Invalid or corrupted QR code")

        # Prepare response data (common for both QR code types)
        user_info = {
            "id": user.id,
            "email": user.email,
            "full_name": user.full_name or "",
            "location_zone": user.location_zone
        }

        product_info = {
            "id": product.id,
            "name": product.name,
            "description": product.description or "",
            "unit_price": float(product.unit_price),
            "bulk_price": float(product.bulk_price),
            "category": product.category or "",
            "savings_factor": float(product.savings_factor)
        }

        purchase_info = {
            "quantity": transaction.quantity,
            "amount": float(transaction.amount),
            "transaction_type": transaction.transaction_type or "final",
            "purchase_date": transaction.created_at.isoformat()
        }

        qr_status = {
            "is_used": getattr(qr_record, 'is_used', True),
            "used_at": getattr(qr_record, 'used_at', datetime.utcnow()).isoformat() if hasattr(qr_record, 'used_at') and qr_record.used_at else datetime.utcnow().isoformat(),
            "generated_at": getattr(qr_record, 'generated_at', datetime.utcnow()).isoformat() if hasattr(qr_record, 'generated_at') else datetime.utcnow().isoformat(),
            "expires_at": getattr(qr_record, 'expires_at', datetime.utcnow() + timedelta(hours=24)).isoformat() if hasattr(qr_record, 'expires_at') else (datetime.utcnow() + timedelta(hours=24)).isoformat(),
            "pickup_location": getattr(qr_record, 'pickup_location', 'Default Pickup Point'),
            "used_by_staff": getattr(qr_record, 'used_by_staff', getattr(admin, 'email', 'Unknown Admin')),
            "used_location": getattr(qr_record, 'used_location', getattr(qr_record, 'pickup_location', 'Default Pickup Point'))
        }

        return QRCodeScanResponse(
            user_info=user_info,
            product_info=product_info,
            purchase_info=purchase_info,
            qr_status=qr_status
        )

    except HTTPException:
        raise
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Failed to scan QR code: {str(e)}")


# New: POST endpoint to scan QR code payloads passed in the request body.
class QRScanRequest(BaseModel):
    qr_code_data: str


@router.post("/qr/scan", response_model=QRCodeScanResponse)
async def scan_qr_code_post(
    request: QRScanRequest,
    admin = Depends(verify_admin),
    db: Session = Depends(get_db)
):
    """Scan a QR code sent in the request body.

    This is provided to allow clients to send long/base64 QR payloads safely in
    the JSON body (avoids URL-encoding/length issues when passing tokens in the path).
    """
    # Delegate to existing logic for consistency
    return await scan_qr_code(request.qr_code_data, admin, db)

@router.get("/qr/user/{user_id}/purchases", response_model=List[UserProductPurchaseInfo])
async def get_user_purchases(
    user_id: int,
    admin = Depends(verify_admin),
    db: Session = Depends(get_db)
):
    """Get all purchases for a specific user"""
    try:
        # Verify user exists
        user = db.query(User).filter(User.id == user_id).first()
        if not user:
            raise HTTPException(status_code=404, detail="User not found")
        
        # Get all transactions for the user
        transactions = db.query(Transaction).filter(
            Transaction.user_id == user_id
        ).all()
        
        purchases = []
        for transaction in transactions:
            # Get group buy information
            if transaction.group_buy_id:
                group_buy = db.query(GroupBuy).filter(
                    GroupBuy.id == transaction.group_buy_id
                ).first()
                
                if group_buy and group_buy.product:
                    purchase_info = UserProductPurchaseInfo(
                        user_id=user.id,
                        email=user.email,
                        full_name=user.full_name or "",
                        product_id=group_buy.product.id,
                        product_name=group_buy.product.name,
                        quantity_purchased=transaction.quantity,
                        total_amount=float(transaction.amount),
                        purchase_date=transaction.created_at,
                        pickup_location=transaction.location_zone or ""
                    )
                    purchases.append(purchase_info)
        
        return purchases
        
    except HTTPException:
        raise
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Failed to fetch user purchases: {str(e)}")

@router.get("/qr/product/{product_id}/purchasers", response_model=List[UserProductPurchaseInfo])
async def get_product_purchasers(
    product_id: int,
    admin = Depends(verify_admin),
    db: Session = Depends(get_db)
):
    """Get all users who purchased a specific product"""
    try:
        # Verify product exists
        product = db.query(Product).filter(Product.id == product_id).first()
        if not product:
            raise HTTPException(status_code=404, detail="Product not found")
        
        # Get all transactions for this product
        transactions = db.query(Transaction).filter(
            Transaction.product_id == product_id
        ).all()
        
        purchasers = []
        for transaction in transactions:
            # Get user information
            user = db.query(User).filter(User.id == transaction.user_id).first()
            
            if user:
                purchase_info = UserProductPurchaseInfo(
                    user_id=user.id,
                    email=user.email,
                    full_name=user.full_name or "",
                    product_id=product.id,
                    product_name=product.name,
                    quantity_purchased=transaction.quantity,
                    total_amount=float(transaction.amount),
                    purchase_date=transaction.created_at,
                    pickup_location=transaction.location_zone or ""
                )
                purchasers.append(purchase_info)
        
        return purchasers
        
    except HTTPException:
        raise
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Failed to fetch product purchasers: {str(e)}")

@router.post("/groups/create")
async def create_admin_group(
    group_data: CreateGroupRequest,
    admin = Depends(verify_admin),
    db: Session = Depends(get_db)
):
    """Create a new admin-managed group buying opportunity"""
    try:
        # Create the admin group
        new_group = AdminGroup(
            name=group_data.name,
            description=group_data.description,
            long_description=group_data.long_description,
            category=group_data.category,
            price=group_data.price,
            original_price=group_data.original_price,
            image=group_data.image,
            max_participants=group_data.max_participants,
            end_date=group_data.end_date,
            admin_name=group_data.admin_name,
            shipping_info=group_data.shipping_info,
            estimated_delivery=group_data.estimated_delivery,
            features=group_data.features,
            requirements=group_data.requirements,
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

    except Exception as e:
        print(f"Error creating admin group: {e}")
        db.rollback()
        raise HTTPException(status_code=500, detail="Failed to create group")

@router.put("/groups/{group_id}/update")
async def update_admin_group(
    group_id: int,
    group_data: UpdateGroupRequest,
    admin = Depends(verify_admin),
    db: Session = Depends(get_db)
):
    """Update an admin-managed group buying opportunity"""
    try:
        # Get the group
        group = db.query(AdminGroup).filter(AdminGroup.id == group_id).first()
        if not group:
            raise HTTPException(
                status_code=status.HTTP_404_NOT_FOUND,
                detail="Group not found"
            )

        # Update fields if provided
        if group_data.name is not None:
            group.name = group_data.name
        if group_data.description is not None:
            group.description = group_data.description
        if group_data.category is not None:
            group.category = group_data.category
        if group_data.product_name is not None:
            # For admin groups, we use the name as product name
            group.name = group_data.product_name
        if group_data.regular_price is not None:
            group.original_price = group_data.regular_price

        db.commit()
        db.refresh(group)

        return {
            "message": "Group updated successfully",
            "group_id": group.id,
            "group": {
                "id": group.id,
                "name": group.name,
                "description": group.description,
                "category": group.category,
                "original_price": group.original_price
            }
        }

    except HTTPException:
        raise
    except Exception as e:
        print(f"Error updating admin group {group_id}: {e}")
        db.rollback()
        raise HTTPException(status_code=500, detail="Failed to update group")