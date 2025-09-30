"""
Pydantic models for SPACS AFRICA API.
Defines request/response schemas and data validation.
"""

from datetime import datetime
from typing import Optional, List, Dict, Any
from uuid import UUID
from pydantic import BaseModel, EmailStr, Field, validator
from decimal import Decimal
from enum import Enum


# ========================================
# Enums
# ========================================

class UserRole(str, Enum):
    TRADER = "trader"
    ADMIN = "admin"


class TransactionType(str, Enum):
    INDIVIDUAL = "individual"
    BULK = "bulk"


class GroupStatus(str, Enum):
    OPEN = "open"
    CLOSED = "closed"
    COMPLETED = "completed"


class RecommendationType(str, Enum):
    JOIN_GROUP = "join_group"
    NEW_GROUP = "new_group"
    PRODUCT = "product"


class RecommendationStatus(str, Enum):
    PENDING = "pending"
    ACCEPTED = "accepted"
    REJECTED = "rejected"
    EXPIRED = "expired"


# ========================================
# User Models
# ========================================

class UserBase(BaseModel):
    email: EmailStr
    full_name: str = Field(..., min_length=2, max_length=255)
    business_name: Optional[str] = Field(None, max_length=255)
    phone: Optional[str] = Field(None, max_length=20)
    location_lat: Optional[Decimal] = Field(None, ge=-90, le=90)
    location_lng: Optional[Decimal] = Field(None, ge=-180, le=180)
    location_name: Optional[str] = Field(None, max_length=255)


class UserCreate(UserBase):
    password: str = Field(..., min_length=6)
    

class UserLogin(BaseModel):
    email: EmailStr
    password: str


class UserResponse(UserBase):
    id: UUID
    is_admin: bool
    is_active: bool
    created_at: datetime
    
    class Config:
        from_attributes = True


class UserProfile(UserResponse):
    """Extended user profile with statistics"""
    total_transactions: int = 0
    total_spent: Decimal = Decimal("0.00")
    potential_savings: Decimal = Decimal("0.00")
    cluster_id: Optional[int] = None
    cluster_name: Optional[str] = None


# ========================================
# Product Models
# ========================================

class ProductBase(BaseModel):
    name: str = Field(..., min_length=2, max_length=255)
    description: Optional[str] = None
    category: str = Field(..., max_length=100)
    unit: str = Field(..., max_length=50)
    base_price: Decimal = Field(..., gt=0, decimal_places=2)
    bulk_price: Decimal = Field(..., gt=0, decimal_places=2)
    min_bulk_quantity: int = Field(..., gt=0)
    image_url: Optional[str] = Field(None, max_length=500)
    
    @validator('bulk_price')
    def bulk_price_must_be_less_than_base(cls, v, values):
        if 'base_price' in values and v >= values['base_price']:
            raise ValueError('bulk_price must be less than base_price')
        return v


class ProductCreate(ProductBase):
    pass


class ProductResponse(ProductBase):
    id: UUID
    is_active: bool
    created_at: datetime
    discount_percentage: Optional[Decimal] = None
    
    class Config:
        from_attributes = True
        
    @validator('discount_percentage', always=True)
    def calculate_discount(cls, v, values):
        if 'base_price' in values and 'bulk_price' in values:
            base = float(values['base_price'])
            bulk = float(values['bulk_price'])
            return Decimal(((base - bulk) / base * 100))
        return None


# ========================================
# Transaction Models
# ========================================

class TransactionBase(BaseModel):
    product_id: UUID
    quantity: int = Field(..., gt=0)
    transaction_type: TransactionType = TransactionType.INDIVIDUAL


class TransactionCreate(TransactionBase):
    pass


class TransactionResponse(TransactionBase):
    id: UUID
    user_id: UUID
    unit_price: Decimal
    total_price: Decimal
    bulk_group_id: Optional[UUID] = None
    transaction_date: datetime
    
    class Config:
        from_attributes = True


# ========================================
# Bulk Group Models
# ========================================

class BulkGroupBase(BaseModel):
    product_id: UUID
    group_name: str = Field(..., min_length=3, max_length=255)
    target_quantity: int = Field(..., gt=0)
    discount_percentage: Decimal = Field(..., ge=0, le=100, decimal_places=2)
    deadline: datetime


class BulkGroupCreate(BulkGroupBase):
    pass


class BulkGroupResponse(BulkGroupBase):
    id: UUID
    current_quantity: int
    status: GroupStatus
    member_count: int = 0
    created_by: Optional[UUID] = None
    created_at: datetime
    completed_at: Optional[datetime] = None
    
    class Config:
        from_attributes = True


class BulkGroupDetail(BulkGroupResponse):
    """Detailed group view with product info and members"""
    product: Optional[ProductResponse] = None
    members: List[Dict[str, Any]] = []
    progress_percentage: Decimal = Decimal("0.00")
    
    @validator('progress_percentage', always=True)
    def calculate_progress(cls, v, values):
        if 'current_quantity' in values and 'target_quantity' in values:
            current = float(values['current_quantity'])
            target = float(values['target_quantity'])
            return Decimal((current / target * 100) if target > 0 else 0)
        return v


# ========================================
# Group Membership Models
# ========================================

class GroupMembershipCreate(BaseModel):
    group_id: UUID
    quantity_committed: int = Field(..., gt=0)


class GroupMembershipResponse(BaseModel):
    id: UUID
    group_id: UUID
    user_id: UUID
    quantity_committed: int
    joined_at: datetime
    
    class Config:
        from_attributes = True


# ========================================
# ML & Recommendation Models
# ========================================

class UserClusterBase(BaseModel):
    user_id: UUID
    cluster_id: int = Field(..., ge=0)
    cluster_name: Optional[str] = None
    features: Dict[str, Any]
    confidence_score: Optional[Decimal] = Field(None, ge=0, le=1)
    model_version: str = "v1.0"


class UserClusterResponse(UserClusterBase):
    id: UUID
    assigned_at: datetime
    
    class Config:
        from_attributes = True


class FeatureStoreBase(BaseModel):
    user_id: UUID
    purchase_frequency: Optional[Decimal] = None
    avg_transaction_value: Optional[Decimal] = None
    price_sensitivity: Optional[Decimal] = Field(None, ge=0, le=1)
    product_preferences: Optional[Dict[str, float]] = None
    location_encoded: Optional[int] = None


class FeatureStoreResponse(FeatureStoreBase):
    id: UUID
    total_transactions: int
    total_spent: Decimal
    last_purchase_date: Optional[datetime] = None
    updated_at: datetime
    
    class Config:
        from_attributes = True


class RecommendationBase(BaseModel):
    user_id: UUID
    product_id: UUID
    recommendation_type: RecommendationType
    score: Decimal = Field(..., ge=0, le=1, decimal_places=4)
    explanation: str
    group_id: Optional[UUID] = None
    feature_importance: Optional[Dict[str, float]] = None


class RecommendationCreate(RecommendationBase):
    expires_at: Optional[datetime] = None


class RecommendationResponse(RecommendationBase):
    id: UUID
    status: RecommendationStatus
    created_at: datetime
    expires_at: Optional[datetime] = None
    actioned_at: Optional[datetime] = None
    
    class Config:
        from_attributes = True


class RecommendationDetail(RecommendationResponse):
    """Detailed recommendation with product and group info"""
    product: Optional[ProductResponse] = None
    group: Optional[BulkGroupResponse] = None
    potential_savings: Optional[Decimal] = None


# ========================================
# Authentication Models
# ========================================

class Token(BaseModel):
    access_token: str
    token_type: str = "bearer"
    user: UserResponse


class TokenData(BaseModel):
    email: Optional[str] = None
    user_id: Optional[UUID] = None


# ========================================
# Admin & Analytics Models
# ========================================

class SystemMetrics(BaseModel):
    total_users: int = 0
    total_products: int = 0
    total_transactions: int = 0
    active_groups: int = 0
    total_revenue: Decimal = Decimal("0.00")
    total_savings: Decimal = Decimal("0.00")
    avg_group_size: Decimal = Decimal("0.00")
    group_success_rate: Decimal = Decimal("0.00")


class ClusterReport(BaseModel):
    cluster_id: int
    cluster_name: str
    user_count: int
    avg_purchase_frequency: Decimal
    avg_transaction_value: Decimal
    top_products: List[Dict[str, Any]]
    characteristics: Dict[str, Any]


class EvaluationMetrics(BaseModel):
    precision_at_5: Decimal
    recall_at_5: Decimal
    ndcg_at_5: Optional[Decimal] = None
    coverage: Decimal
    diversity: Decimal
    model_version: str
    evaluated_at: datetime
    sample_size: int


class SyntheticDataRequest(BaseModel):
    num_users: int = Field(100, ge=10, le=1000)
    num_transactions: int = Field(500, ge=50, le=5000)
    num_groups: int = Field(20, ge=5, le=100)
    seed: Optional[int] = None


# ========================================
# Event Models
# ========================================

class EventLog(BaseModel):
    event_type: str
    entity_type: str
    entity_id: UUID
    payload: Optional[Dict[str, Any]] = None
    
    class Config:
        from_attributes = True


class EventResponse(EventLog):
    id: UUID
    processed: bool
    created_at: datetime


# ========================================
# Notification Models
# ========================================

class NotificationBase(BaseModel):
    user_id: UUID
    notification_type: str
    title: str
    message: str
    metadata: Optional[Dict[str, Any]] = None


class NotificationCreate(NotificationBase):
    pass


class NotificationResponse(NotificationBase):
    id: UUID
    is_read: bool
    created_at: datetime
    read_at: Optional[datetime] = None
    
    class Config:
        from_attributes = True


# ========================================
# Generic Response Models
# ========================================

class MessageResponse(BaseModel):
    message: str
    status: str = "success"
    data: Optional[Any] = None


class PaginatedResponse(BaseModel):
    items: List[Any]
    total: int
    page: int
    page_size: int
    total_pages: int


class HealthResponse(BaseModel):
    status: str
    timestamp: datetime
    database: Dict[str, Any]
    redis: Dict[str, Any]
    version: str = "1.0.0"
