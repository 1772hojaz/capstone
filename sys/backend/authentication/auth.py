from fastapi import APIRouter, Depends, HTTPException, status
from fastapi.security import HTTPBearer, HTTPAuthorizationCredentials
from sqlalchemy.orm import Session
from pydantic import BaseModel, EmailStr
import bcrypt
from datetime import datetime, timedelta
import jwt
import os
from typing import List, Optional
from db.database import get_db
from models.models import User

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

class SupplierRegister(BaseModel):
    email: EmailStr
    password: str
    full_name: str
    company_name: str
    business_address: str
    tax_id: Optional[str] = None
    phone_number: str
    location_zone: str
    business_type: Optional[str] = "retailer"
    business_description: Optional[str] = None
    website_url: Optional[str] = None
    bank_account_name: Optional[str] = None
    bank_account_number: Optional[str] = None
    bank_name: Optional[str] = None
    payment_terms: Optional[str] = "net_30"
    
    class Config:
        json_schema_extra = {
            "example": {
                "email": "supplier@example.com",
                "password": "secure_password123",
                "full_name": "John Supplier",
                "company_name": "Supplier Inc.",
                "business_address": "123 Business St, City, Province",
                "tax_id": "123456789",
                "phone_number": "+1234567890",
                "location_zone": "central",
                "business_type": "wholesaler",
                "business_description": "Quality electronics supplier",
                "website_url": "https://supplier-inc.com",
                "payment_terms": "net_30"
            }
        }

class UserLogin(BaseModel):
    email: EmailStr
    password: str

class Token(BaseModel):
    access_token: str
    token_type: str
    user_id: int
    is_admin: bool
    is_supplier: bool
    location_zone: str
    full_name: str
    email: str
    company_name: Optional[str] = None
    
class SupplierProfile(BaseModel):
    id: int
    email: str
    full_name: str
    company_name: Optional[str] = None
    business_address: Optional[str] = None
    tax_id: Optional[str] = None
    phone_number: Optional[str] = None
    location_zone: str
    business_type: Optional[str] = None
    business_description: Optional[str] = None
    website_url: Optional[str] = None
    bank_account_name: Optional[str] = None
    bank_account_number: Optional[str] = None
    bank_name: Optional[str] = None
    payment_terms: Optional[str] = None
    is_verified: bool = False
    verification_status: str = "pending"
    created_at: Optional[datetime] = None
    
    class Config:
        from_attributes = True

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

def validate_password_strength(password: str) -> bool:
    """Validate password meets security requirements"""
    if len(password) < 8:
        return False
    if not any(c.isupper() for c in password):
        return False
    if not any(c.islower() for c in password):
        return False
    if not any(c.isdigit() for c in password):
        return False
    return True

def sanitize_phone_number(phone: str) -> str:
    """Clean and format phone number"""
    import re
    # Remove all non-digit characters except +
    cleaned = re.sub(r'[^\d+]', '', phone)
    return cleaned

def validate_business_email(email: str) -> bool:
    """Basic validation for business email addresses"""
    # Reject common personal email providers
    personal_domains = ['gmail.com', 'yahoo.com', 'hotmail.com', 'outlook.com']
    domain = email.split('@')[1].lower()
    return domain not in personal_domains

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
        is_supplier=new_user.is_supplier,
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
        is_supplier=user.is_supplier,
        location_zone=user.location_zone,
        full_name=user.full_name,
        email=user.email,
        company_name=user.company_name if user.is_supplier else None
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

@router.get("/supplier/profile", response_model=SupplierProfile)
async def get_supplier_profile(user: User = Depends(verify_token), db: Session = Depends(get_db)):
    """Get supplier profile information"""
    if not user.is_supplier:
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail="Supplier access required"
        )
    
    return SupplierProfile.from_orm(user)

@router.put("/supplier/profile", response_model=SupplierProfile)
async def update_supplier_profile(
    full_name: Optional[str] = None,
    company_name: Optional[str] = None,
    business_address: Optional[str] = None,
    tax_id: Optional[str] = None,
    phone_number: Optional[str] = None,
    location_zone: Optional[str] = None,
    business_type: Optional[str] = None,
    business_description: Optional[str] = None,
    website_url: Optional[str] = None,
    bank_account_name: Optional[str] = None,
    bank_account_number: Optional[str] = None,
    bank_name: Optional[str] = None,
    payment_terms: Optional[str] = None,
    user: User = Depends(verify_token),
    db: Session = Depends(get_db)
):
    """Update supplier profile information"""
    if not user.is_supplier:
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail="Supplier access required"
        )
    
    # Check if company name is being changed and is unique
    if company_name and company_name != user.company_name:
        existing_company = db.query(User).filter(
            User.company_name == company_name,
            User.is_supplier.is_(True),
            User.id != user.id
        ).first()
        if existing_company:
            raise HTTPException(
                status_code=status.HTTP_400_BAD_REQUEST, 
                detail="Company name already in use"
            )
    
    # Update fields
    if full_name is not None:
        user.full_name = full_name
    if company_name is not None:
        user.company_name = company_name
    if business_address is not None:
        user.business_address = business_address
    if tax_id is not None:
        user.tax_id = tax_id
    if phone_number is not None:
        user.phone_number = sanitize_phone_number(phone_number)
    if location_zone is not None:
        user.location_zone = location_zone
    if business_type is not None:
        user.business_type = business_type
    if business_description is not None:
        user.business_description = business_description
    if website_url is not None:
        user.website_url = website_url
    if bank_account_name is not None:
        user.bank_account_name = bank_account_name
    if bank_account_number is not None:
        user.bank_account_number = bank_account_number
    if bank_name is not None:
        user.bank_name = bank_name
    if payment_terms is not None:
        user.payment_terms = payment_terms
    
    db.commit()
    db.refresh(user)
    
    return SupplierProfile.from_orm(user)

@router.post("/supplier/verify-business")
async def request_business_verification(
    user: User = Depends(verify_token),
    db: Session = Depends(get_db)
):
    """Request business verification for supplier account"""
    if not user.is_supplier:
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail="Supplier access required"
        )
    
    # Check if required fields are provided
    required_fields = {
        "company_name": user.company_name,
        "business_address": user.business_address,
        "tax_id": user.tax_id,
        "phone_number": user.phone_number
    }
    
    missing_fields = [field for field, value in required_fields.items() if not value]
    if missing_fields:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail=f"Missing required fields for verification: {', '.join(missing_fields)}"
        )
    
    # Update verification status
    user.verification_status = "submitted"
    db.commit()
    
    return {
        "message": "Verification request submitted successfully",
        "status": "submitted",
        "estimated_review_time": "2-3 business days"
    }

@router.get("/supplier/verification-status")
async def get_verification_status(user: User = Depends(verify_token)):
    """Get current verification status"""
    if not user.is_supplier:
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail="Supplier access required"
        )
    
    status_descriptions = {
        "pending": "Account created, verification not yet requested",
        "submitted": "Verification documents submitted, under review",
        "verified": "Account verified and approved",
        "rejected": "Verification rejected, please update information"
    }
    
    return {
        "status": user.verification_status or "pending",
        "is_verified": user.is_verified or False,
        "description": status_descriptions.get(user.verification_status, "Unknown status")
    }

@router.post("/register-supplier", response_model=Token)
async def register_supplier(supplier_data: SupplierRegister, db: Session = Depends(get_db)):
    """Register a new supplier with enhanced validation"""
    # Validate password strength
    if not validate_password_strength(supplier_data.password):
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="Password must be at least 8 characters with uppercase, lowercase, and number"
        )
    
    # Validate business email (optional warning)
    if not validate_business_email(supplier_data.email):
        # Just log for now, don't block registration
        print(f"Warning: Personal email domain used for business registration: {supplier_data.email}")
    
    # Check if user exists
    existing_user = db.query(User).filter(User.email == supplier_data.email).first()
    if existing_user:
        raise HTTPException(status_code=status.HTTP_400_BAD_REQUEST, detail="Email already registered")
    
    # Check if company name already exists
    if supplier_data.company_name:
        existing_company = db.query(User).filter(
            User.company_name == supplier_data.company_name,
            User.is_supplier.is_(True)
        ).first()
        if existing_company:
            raise HTTPException(
                status_code=status.HTTP_400_BAD_REQUEST, 
                detail="Company name already registered"
            )
    
    # Sanitize phone number
    cleaned_phone = sanitize_phone_number(supplier_data.phone_number)
    
    # Create new supplier
    new_supplier = User(
        email=supplier_data.email,
        hashed_password=hash_password(supplier_data.password),
        full_name=supplier_data.full_name,
        company_name=supplier_data.company_name,
        business_address=supplier_data.business_address,
        tax_id=supplier_data.tax_id,
        phone_number=cleaned_phone,
        location_zone=supplier_data.location_zone,
        business_type=supplier_data.business_type,
        business_description=supplier_data.business_description,
        website_url=supplier_data.website_url,
        bank_account_name=supplier_data.bank_account_name,
        bank_account_number=supplier_data.bank_account_number,
        bank_name=supplier_data.bank_name,
        payment_terms=supplier_data.payment_terms,
        is_supplier=True,
        is_admin=False,
        is_verified=False,
        verification_status="pending"
    )
    
    db.add(new_supplier)
    db.commit()
    db.refresh(new_supplier)
    
    # Create token
    access_token = create_access_token({
        "user_id": new_supplier.id, 
        "email": new_supplier.email,
        "is_supplier": True
    })
    
    return Token(
        access_token=access_token,
        token_type="bearer",
        user_id=new_supplier.id,
        is_admin=new_supplier.is_admin,
        is_supplier=new_supplier.is_supplier,
        location_zone=new_supplier.location_zone,
        full_name=new_supplier.full_name,
        email=new_supplier.email,
        company_name=new_supplier.company_name
    )