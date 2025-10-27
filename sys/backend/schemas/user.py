"""
Pydantic models for user-related schemas
"""
from datetime import datetime
from typing import Optional, List
from pydantic import BaseModel, EmailStr, Field, validator

class UserBase(BaseModel):
    """Base user schema"""
    email: EmailStr
    full_name: str = Field(..., min_length=2, max_length=100)

class UserCreate(UserBase):
    """Schema for user creation"""
    password: str = Field(..., min_length=8, max_length=100)
    
    @validator('password')
    def password_strength(cls, v):
        """Validate password strength"""
        if len(v) < 8:
            raise ValueError('Password must be at least 8 characters long')
        if not any(char.isdigit() for char in v):
            raise ValueError('Password must contain at least one number')
        if not any(char.isupper() for char in v):
            raise ValueError('Password must contain at least one uppercase letter')
        if not any(char.islower() for char in v):
            raise ValueError('Password must contain at least one lowercase letter')
        return v

class UserUpdate(BaseModel):
    """Schema for updating user information"""
    email: Optional[EmailStr] = None
    full_name: Optional[str] = Field(None, min_length=2, max_length=100)
    current_password: Optional[str] = None
    new_password: Optional[str] = Field(None, min_length=8, max_length=100)
    
    @validator('new_password')
    def validate_new_password(cls, v, values, **kwargs):
        """Validate new password when updating"""
        if v is not None and 'current_password' not in values:
            raise ValueError('Current password is required to set a new password')
        return v

class UserInDBBase(UserBase):
    """Base schema for user in database"""
    id: int
    is_active: bool = False
    created_at: datetime
    updated_at: datetime
    
    class Config:
        from_attributes = True

class UserResponse(UserInDBBase):
    """Schema for user response (what's returned to the client)"""
    pass

class UserInDB(UserInDBBase):
    """Schema for user stored in database"""
    hashed_password: str
    verification_token: Optional[str] = None
    reset_token: Optional[str] = None
    reset_token_expires: Optional[datetime] = None
