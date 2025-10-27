"""
Pydantic models for token-related schemas
"""
from datetime import datetime
from typing import Optional, Dict, Any
from pydantic import BaseModel, Field

class Token(BaseModel):
    """Base token schema"""
    access_token: str
    token_type: str = "bearer"
    refresh_token: Optional[str] = None

class TokenPayload(BaseModel):
    """JWT token payload schema"""
    sub: Optional[str] = None  # Subject (user identifier)
    exp: Optional[datetime] = None  # Expiration time
    iat: Optional[datetime] = None  # Issued at
    jti: Optional[str] = None  # JWT ID
    
    class Config:
        json_encoders = {
            datetime: lambda v: v.timestamp() if v else None
        }

class MagicLinkPayload(BaseModel):
    """Magic link token payload schema"""
    sub: str  # User email
    purpose: str  # e.g., 'email_verification', 'password_reset'
    exp: Optional[datetime] = None
    
    class Config:
        json_encoders = {
            datetime: lambda v: v.timestamp() if v else None
        }

class TokenCreate(BaseModel):
    """Schema for token creation"""
    email: str
    password: str

class TokenResponse(Token):
    """Schema for token response"""
    user_id: int
    email: str
    full_name: str
    is_active: bool
