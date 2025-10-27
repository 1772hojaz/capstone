"""
Pydantic models for group-related schemas
"""
from datetime import datetime
from typing import List, Optional, Dict, Any
from pydantic import BaseModel, Field

class GroupBase(BaseModel):
    """Base schema for group operations"""
    name: str
    description: str
    category: str
    price: float = Field(..., gt=0, description="Price per unit in the group buy")
    original_price: float = Field(..., gt=0, description="Original price per unit")
    image: str = Field(..., description="URL of the product image")
    max_participants: int = Field(..., gt=0, description="Maximum number of participants")
    end_date: datetime = Field(..., description="When the group buy ends")
    long_description: Optional[str] = None
    features: Optional[List[str]] = Field(default_factory=list, description="List of product features")
    requirements: Optional[List[str]] = Field(default_factory=list, description="List of requirements")
    shipping_info: Optional[str] = "Free shipping when group goal is reached"
    estimated_delivery: Optional[str] = "2-3 weeks after group completion"

class GroupCreateRequest(GroupBase):
    """Schema for creating a new group buy"""
    pass

class GroupResponse(GroupBase):
    """Schema for group response"""
    id: int
    participants: int
    created: str
    admin_created: bool = True
    admin_name: str = "Admin"
    savings: Optional[float] = None
    discount_percentage: Optional[int] = None
    status: Optional[str] = None
    order_status: Optional[str] = None
    match_score: Optional[int] = None
    reason: Optional[str] = None

    class Config:
        from_attributes = True
        json_encoders = {
            datetime: lambda v: v.isoformat() if v else None
        }

class GroupDetailResponse(GroupResponse):
    """Extended group details with additional information"""
    current_participants: int
    target_participants: int
    days_remaining: int
    progress_percentage: float
    is_joined: bool
    user_contribution: Optional[int] = None
    total_raised: float
    target_amount: float
    savings_per_person: float
    start_date: datetime
    organizer: str
    tags: List[str]
    faqs: List[Dict[str, str]]

class JoinGroupRequest(BaseModel):
    """Schema for joining a group buy"""
    quantity: int = Field(1, gt=0, description="Number of units to purchase")
    delivery_method: str = Field(..., description="Delivery method (e.g., 'pickup', 'shipping')")
    payment_method: str = Field(..., description="Payment method (e.g., 'card', 'bank_transfer')")
    special_instructions: Optional[str] = Field(None, description="Any special instructions for the order")

class UpdateContributionRequest(BaseModel):
    """Schema for updating a user's contribution"""
    quantity: int = Field(..., gt=0, description="New quantity to update to")

class QRCodeResponse(BaseModel):
    """Schema for QR code generation response"""
    qr_code_data: str = Field(..., description="Base64 encoded QR code image")
    qr_content: str = Field(..., description="Encrypted QR code content for validation")
    expires_at: str = Field(..., description="ISO timestamp when QR code expires")
    pickup_instructions: str = Field(..., description="Instructions for pickup")

class QRValidationRequest(BaseModel):
    """Schema for QR code validation request"""
    qr_content: str = Field(..., description="Encrypted QR code content")
    scanner_location: str = Field(..., description="Location where QR code is being scanned")
    staff_id: Optional[str] = Field(None, description="ID of staff member scanning the code")

class QRValidationResponse(BaseModel):
    """Schema for QR code validation response"""
    valid: bool = Field(..., description="Whether the QR code is valid")
    message: str = Field(..., description="Status message")
    pickup_details: Optional[dict] = Field(None, description="Details about the pickup if valid")

class PickupStatusResponse(BaseModel):
    """Schema for pickup status response"""
    can_pickup: bool = Field(..., description="Whether the user can pick up their order")
    qr_available: bool = Field(..., description="Whether a QR code is available")
    pickup_instructions: Optional[str] = Field(None, description="Instructions for pickup")
    qr_code: Optional[str] = Field(None, description="Base64 encoded QR code if available")
    expires_at: Optional[str] = Field(None, description="When the QR code expires (ISO format)")
