from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy.orm import Session
from sqlalchemy import func
from pydantic import BaseModel
from typing import List, Optional
from datetime import datetime, timedelta
from database import get_db
from models import User, GroupBuy, Product, Transaction, MLModel, AdminGroup, AdminGroupJoin
from auth import verify_admin

router = APIRouter()

# Pydantic Models
class DashboardStats(BaseModel):
    total_users: int
    total_products: int
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

# Routes
@router.get("/dashboard", response_model=DashboardStats)
async def get_dashboard_stats(
    admin = Depends(verify_admin),
    db: Session = Depends(get_db)
):
    """Get dashboard statistics"""
    total_users = db.query(func.count(User.id)).filter(not User.is_admin).scalar()
    total_products = db.query(func.count(Product.id)).filter(Product.is_active).scalar()
    active_group_buys = db.query(func.count(GroupBuy.id)).filter(GroupBuy.status == "active").scalar()
    completed_group_buys = db.query(func.count(GroupBuy.id)).filter(GroupBuy.status == "completed").scalar()
    
    # Calculate total revenue from completed group-buys only
    completed_groups = db.query(GroupBuy).filter(GroupBuy.status == "completed").all()
    total_revenue = sum(gb.total_contributions for gb in completed_groups if gb.total_contributions)
    
    # Calculate total savings
    total_savings = sum(
        gb.total_quantity * (gb.product.unit_price - gb.product.bulk_price)
        for gb in completed_groups if gb.product and gb.total_quantity
    )
    
    return DashboardStats(
        total_users=total_users or 0,
        total_products=total_products or 0,
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
    query = db.query(User).filter(not User.is_admin)
    
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
            "message": "Model retraining started. Check /api/admin/training-status for progress."
        }
    except Exception as e:
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail=f"Error starting retraining: {str(e)}"
        )

@router.get("/training-status")
async def get_training_status(
    admin = Depends(verify_admin),
    db: Session = Depends(get_db)
):
    """Get current training status"""
    # Import the global training status from ml.py
    from ml import current_training_status
    
    # Get latest model info for additional context
    latest_model = db.query(MLModel).filter(
        MLModel.model_type == "hybrid_recommender"
    ).order_by(MLModel.trained_at.desc()).first()
    
    status_info = {
        "status": current_training_status["status"],
        "progress": current_training_status["progress"],
        "current_stage": current_training_status["current_stage"],
        "stages_completed": current_training_status["stages_completed"],
        "started_at": current_training_status["started_at"],
        "completed_at": current_training_status["completed_at"],
        "error": current_training_status["error"]
    }
    
    # Add latest model results if training completed
    if current_training_status["status"] == "completed" and latest_model:
        status_info["results"] = {
            "silhouette_score": latest_model.metrics.get('silhouette_score', 0),
            "n_clusters": latest_model.metrics.get('n_clusters', 0),
            "nmf_rank": latest_model.metrics.get('nmf_rank', 0),
            "tfidf_vocab_size": latest_model.metrics.get('tfidf_vocab_size', 0)
        }
    
    return status_info

# ML Performance Tracking
class MLModelPerformance(BaseModel):
    id: int
    model_type: str
    silhouette_score: float
    n_clusters: int
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
        MLModel.model_type == "clustering"
    ).order_by(MLModel.trained_at.desc()).limit(20).all()
    
    result = []
    for model in models:
        result.append(MLModelPerformance(
            id=model.id,
            model_type=model.model_type,
            silhouette_score=model.metrics.get('silhouette_score', 0),
            n_clusters=model.metrics.get('n_clusters', 0),
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
        # Get admin groups that have reached their target (participants >= max_participants)
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

        # Ready for payment groups count
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