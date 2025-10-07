from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy.orm import Session
from sqlalchemy import func, and_
from pydantic import BaseModel
from typing import List, Optional, Dict, Any
from datetime import datetime, timedelta
from database import get_db
from models import User, GroupBuy, Product, Transaction, Contribution, MLModel
from auth import verify_token, verify_admin

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
    total_users = db.query(func.count(User.id)).filter(User.is_admin == False).scalar()
    total_products = db.query(func.count(Product.id)).filter(Product.is_active == True).scalar()
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
    query = db.query(User).filter(User.is_admin == False)
    
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
    """Trigger ML model retraining"""
    # Import here to avoid circular dependency
    from ml import train_clustering_model
    
    try:
        silhouette, n_clusters = train_clustering_model(db)
        return {
            "status": "success",
            "silhouette_score": silhouette,
            "n_clusters": n_clusters,
            "message": "Models retrained successfully"
        }
    except Exception as e:
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail=f"Error during retraining: {str(e)}"
        )

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