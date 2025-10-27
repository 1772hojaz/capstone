"""
Pydantic models for admin-related schemas
"""
from datetime import datetime
from typing import List, Optional, Dict, Any
from pydantic import BaseModel, Field

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
    total_contributions: Optional[float] = 0.0
    total_paid: Optional[float] = 0.0
    is_fully_funded: bool

class GroupBuyCreateRequest(BaseModel):
    name: str
    description: str
    long_description: Optional[str] = None
    category: str
    price: float  # This is the group_price
    original_price: float  # This is the regular_price
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

class MLModelResponse(BaseModel):
    id: int
    model_type: str
    silhouette_score: float
    n_clusters: int
    trained_at: datetime
    is_active: bool


class UserDetail(BaseModel):
    """Admin view of user with aggregated stats."""
    id: int
    email: str
    full_name: str
    location_zone: Optional[str]
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
    top_products: List[Dict[str, Any]] = []
    cluster_distribution: List[Dict[str, Any]] = []

    class Config:
        arbitrary_types_allowed = True
