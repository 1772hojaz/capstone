"""
Pydantic models for authentication and user-related schemas
"""
from datetime import datetime
from typing import List, Optional, Dict, Any
from pydantic import BaseModel, EmailStr, Field
from enum import Enum

class UserRegister(BaseModel):
    """Schema for user registration"""
    email: EmailStr
    password: str = Field(..., min_length=8, description="Must be at least 8 characters")
    full_name: str
    location_zone: str
    preferred_categories: List[str] = []
    budget_range: str = "medium"
    experience_level: str = "beginner"
    preferred_group_sizes: List[str] = []
    participation_frequency: str = "occasional"

class UserLogin(BaseModel):
    """Schema for user login"""
    email: EmailStr
    password: str

class Token(BaseModel):
    """Schema for authentication token"""
    access_token: str
    token_type: str = "bearer"
    user_id: int
    is_admin: bool = False
    location_zone: str

class UserProfile(BaseModel):
    """Schema for user profile data"""
    id: int
    email: str
    full_name: str
    location_zone: str
    is_admin: bool
    is_active: bool = True
    cluster_id: Optional[int] = None
    preferred_categories: List[str] = []
    budget_range: str = "medium"
    experience_level: str = "beginner"
    preferred_group_sizes: List[str] = []
    participation_frequency: str = "occasional"
    email_notifications: bool = True
    push_notifications: bool = True
    sms_notifications: bool = False
    weekly_summary: bool = True
    price_alerts_enabled: bool = False
    created_at: Optional[datetime] = None
    updated_at: Optional[datetime] = None

    class Config:
        from_attributes = True  # For ORM compatibility

class NotificationSettings(BaseModel):
    """Schema for user notification settings"""
    email_notifications: bool
    push_notifications: bool
    sms_notifications: bool
    weekly_summary: bool
    price_alerts_enabled: bool

class PasswordChange(BaseModel):
    """Schema for password change requests"""
    current_password: str
    new_password: str = Field(..., min_length=8, description="Must be at least 8 characters")
