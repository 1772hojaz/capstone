from fastapi import APIRouter, Depends, HTTPException, status
from fastapi.security import HTTPBearer, HTTPAuthorizationCredentials
from sqlalchemy.orm import Session
from pydantic import BaseModel, EmailStr
import bcrypt
from datetime import datetime, timedelta
import jwt
import os
from typing import List, Optional
from database import get_db
from models import User

router = APIRouter()
security = HTTPBearer()

SECRET_KEY = os.getenv("SECRET_KEY", "your-secret-key-change-this-in-production")
ALGORITHM = "HS256"
ACCESS_TOKEN_EXPIRE_MINUTES = 60 * 24  # 24 hours

# Pydantic Models
class UserRegister(BaseModel):
    email: EmailStr
    password: str
    full_name: str
    location_zone: str
    preferred_categories: List[str] = []
    budget_range: str = "medium"
    experience_level: str = "beginner"
    preferred_group_sizes: List[str] = []
    participation_frequency: str = "occasional"

class UserLogin(BaseModel):
    email: EmailStr
    password: str

class Token(BaseModel):
    access_token: str
    token_type: str
    user_id: int
    is_admin: bool
    location_zone: str

class UserProfile(BaseModel):
    id: int
    email: str
    full_name: str
    location_zone: str
    is_admin: bool
    cluster_id: int | None
    preferred_categories: List[str]
    budget_range: str
    experience_level: str
    preferred_group_sizes: List[str]
    participation_frequency: str
    email_notifications: bool
    push_notifications: bool
    sms_notifications: bool
    weekly_summary: bool
    price_alerts_enabled: bool
    show_recommendations: bool
    auto_join_groups: bool

    class Config:
        from_attributes = True

class NotificationSettings(BaseModel):
    email_notifications: bool
    push_notifications: bool
    sms_notifications: bool
    weekly_summary: bool
    price_alerts_enabled: bool

class PasswordChange(BaseModel):
    current_password: str
    new_password: str

# Helper Functions
def hash_password(password: str) -> str:
    # Bcrypt has a 72-byte limit, truncate password if necessary
    password_bytes = password.encode('utf-8')[:72]
    salt = bcrypt.gensalt()
    return bcrypt.hashpw(password_bytes, salt).decode('utf-8')

def verify_password(plain_password: str, hashed_password: str) -> bool:
    password_bytes = plain_password.encode('utf-8')[:72]
    hashed_bytes = hashed_password.encode('utf-8')
    return bcrypt.checkpw(password_bytes, hashed_bytes)

def create_access_token(data: dict) -> str:
    to_encode = data.copy()
    expire = datetime.utcnow() + timedelta(minutes=ACCESS_TOKEN_EXPIRE_MINUTES)
    to_encode.update({"exp": expire})
    return jwt.encode(to_encode, SECRET_KEY, algorithm=ALGORITHM)

def verify_token(credentials: HTTPAuthorizationCredentials = Depends(security), db: Session = Depends(get_db)):
    try:
        payload = jwt.decode(credentials.credentials, SECRET_KEY, algorithms=[ALGORITHM])
        user_id: int = payload.get("user_id")
        if user_id is None:
            raise HTTPException(status_code=status.HTTP_401_UNAUTHORIZED, detail="Invalid token")
        
        user = db.query(User).filter(User.id == user_id).first()
        if user is None:
            raise HTTPException(status_code=status.HTTP_401_UNAUTHORIZED, detail="User not found")
        
        return user
    except jwt.ExpiredSignatureError:
        raise HTTPException(status_code=status.HTTP_401_UNAUTHORIZED, detail="Token expired")
    except jwt.InvalidTokenError:
        raise HTTPException(status_code=status.HTTP_401_UNAUTHORIZED, detail="Invalid token")

def verify_admin(user: User = Depends(verify_token)):
    if not user.is_admin:
        raise HTTPException(status_code=status.HTTP_403_FORBIDDEN, detail="Admin access required")
    return user

# Routes
@router.post("/register", response_model=Token)
async def register(user_data: UserRegister, db: Session = Depends(get_db)):
    # Check if user exists
    existing_user = db.query(User).filter(User.email == user_data.email).first()
    if existing_user:
        raise HTTPException(status_code=status.HTTP_400_BAD_REQUEST, detail="Email already registered")
    
    # Create new user
    new_user = User(
        email=user_data.email,
        hashed_password=hash_password(user_data.password),
        full_name=user_data.full_name,
        location_zone=user_data.location_zone,
        preferred_categories=user_data.preferred_categories,
        budget_range=user_data.budget_range,
        experience_level=user_data.experience_level,
        preferred_group_sizes=user_data.preferred_group_sizes,
        participation_frequency=user_data.participation_frequency,
        is_admin=False
    )
    
    db.add(new_user)
    db.commit()
    db.refresh(new_user)
    
    # Create token
    access_token = create_access_token({"user_id": new_user.id, "email": new_user.email})
    
    return Token(
        access_token=access_token,
        token_type="bearer",
        user_id=new_user.id,
        is_admin=new_user.is_admin,
        location_zone=new_user.location_zone
    )

@router.post("/login", response_model=Token)
async def login(credentials: UserLogin, db: Session = Depends(get_db)):
    # Find user
    user = db.query(User).filter(User.email == credentials.email).first()
    if not user or not verify_password(credentials.password, user.hashed_password):
        raise HTTPException(status_code=status.HTTP_401_UNAUTHORIZED, detail="Invalid credentials")
    
    # Create token
    access_token = create_access_token({"user_id": user.id, "email": user.email})
    
    return Token(
        access_token=access_token,
        token_type="bearer",
        user_id=user.id,
        is_admin=user.is_admin,
        location_zone=user.location_zone
    )

@router.get("/me", response_model=UserProfile)
async def get_current_user(user: User = Depends(verify_token)):
    return UserProfile.from_orm(user)

@router.put("/profile", response_model=UserProfile)
async def update_profile(
    full_name: str = None,
    location_zone: str = None,
    preferred_categories: List[str] = None,
    budget_range: str = None,
    experience_level: str = None,
    preferred_group_sizes: List[str] = None,
    participation_frequency: str = None,
    show_recommendations: bool = None,
    auto_join_groups: bool = None,
    price_alerts: bool = None,
    email_notifications: bool = None,
    push_notifications: bool = None,
    sms_notifications: bool = None,
    weekly_summary: bool = None,
    price_alerts_enabled: bool = None,
    user: User = Depends(verify_token),
    db: Session = Depends(get_db)
):
    if full_name:
        user.full_name = full_name
    if location_zone:
        user.location_zone = location_zone
    if preferred_categories is not None:
        user.preferred_categories = preferred_categories
    if budget_range:
        user.budget_range = budget_range
    if experience_level:
        user.experience_level = experience_level
    if preferred_group_sizes is not None:
        user.preferred_group_sizes = preferred_group_sizes
    if participation_frequency:
        user.participation_frequency = participation_frequency
    if show_recommendations is not None:
        user.show_recommendations = show_recommendations
    if auto_join_groups is not None:
        user.auto_join_groups = auto_join_groups
    if price_alerts is not None:
        user.price_alerts_enabled = price_alerts
    if email_notifications is not None:
        user.email_notifications = email_notifications
    if push_notifications is not None:
        user.push_notifications = push_notifications
    if sms_notifications is not None:
        user.sms_notifications = sms_notifications
    if weekly_summary is not None:
        user.weekly_summary = weekly_summary
    if price_alerts_enabled is not None:
        user.price_alerts_enabled = price_alerts_enabled
    
    db.commit()
    db.refresh(user)
    
    return UserProfile.from_orm(user)

@router.get("/notifications", response_model=NotificationSettings)
async def get_notification_settings(user: User = Depends(verify_token)):
    """Get user's notification settings"""
    return NotificationSettings(
        email_notifications=user.email_notifications,
        push_notifications=user.push_notifications,
        sms_notifications=user.sms_notifications,
        weekly_summary=user.weekly_summary,
        price_alerts_enabled=user.price_alerts_enabled
    )

@router.put("/password")
async def change_password(
    password_data: PasswordChange,
    user: User = Depends(verify_token),
    db: Session = Depends(get_db)
):
    """Change user's password"""
    # Verify current password
    if not verify_password(password_data.current_password, user.hashed_password):
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="Current password is incorrect"
        )
    
    # Validate new password
    if len(password_data.new_password) < 6:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="New password must be at least 6 characters long"
        )
    
    # Hash and update password
    user.hashed_password = hash_password(password_data.new_password)
    db.commit()
    
    return {"message": "Password changed successfully"}