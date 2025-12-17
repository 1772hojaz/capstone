from fastapi import APIRouter, Depends, HTTPException, status
from fastapi.security import HTTPBearer, HTTPAuthorizationCredentials
from sqlalchemy.orm import Session
from pydantic import BaseModel, EmailStr
import bcrypt
from datetime import datetime, timedelta
import jwt
import os
import secrets
from typing import List, Optional
from db.database import get_db
from models.models import User, PendingRegistration

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

class ForgotPasswordRequest(BaseModel):
    email: EmailStr

class ResetPasswordRequest(BaseModel):
    token: str
    new_password: str

class VerifyOTPRequest(BaseModel):
    email: EmailStr
    otp_code: str

class ResendOTPRequest(BaseModel):
    email: EmailStr

class DeleteAccountRequest(BaseModel):
    password: str
    confirmation: str  # User must type "DELETE" to confirm

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

def generate_otp() -> str:
    """Generate a 6-digit OTP code"""
    return ''.join([str(secrets.randbelow(10)) for _ in range(6)])

def send_otp_email(user_email: str, user_name: str, otp_code: str) -> dict:
    """Send OTP code via email"""
    try:
        from services.email_service import email_service
        
        subject = "Your Verification Code - ConnectSphere"
        
        body_html = f"""
        <html>
        <body style="font-family: Arial, sans-serif; line-height: 1.6; color: #333;">
            <div style="max-width: 600px; margin: 0 auto; padding: 20px; background-color: #f9fafb; border-radius: 10px;">
                <div style="text-align: center; padding: 20px 0;">
                    <h1 style="color: #10b981; margin: 0;">Welcome to ConnectSphere!</h1>
                </div>
                <div style="background-color: white; padding: 30px; border-radius: 8px; box-shadow: 0 2px 4px rgba(0,0,0,0.1);">
                    <h2 style="color: #333; margin-top: 0;">Verify Your Email Address</h2>
                    <p>Hi {user_name},</p>
                    <p>Thank you for registering with ConnectSphere! To complete your registration, please enter this verification code:</p>
                    
                    <div style="background-color: #f0fdf4; border: 2px dashed #10b981; border-radius: 8px; padding: 20px; margin: 30px 0; text-align: center;">
                        <p style="color: #666; font-size: 14px; margin: 0 0 10px 0;">Your Verification Code</p>
                        <p style="font-size: 36px; font-weight: bold; color: #10b981; letter-spacing: 8px; margin: 0; font-family: 'Courier New', monospace;">
                            {otp_code}
                        </p>
                    </div>
                    
                    <div style="background-color: #fef3c7; border-left: 4px solid #f59e0b; padding: 12px 16px; border-radius: 4px; margin: 20px 0;">
                        <p style="margin: 0; color: #92400e; font-size: 14px;">
                            <strong>⏱️ Code expires in 10 minutes</strong><br>
                            For security, this code can only be used once.
                        </p>
                    </div>
                    
                    <p style="color: #666; font-size: 14px; margin-top: 20px;">
                        <strong>Security Tips:</strong>
                    </p>
                    <ul style="color: #666; font-size: 14px;">
                        <li>Never share this code with anyone</li>
                        <li>ConnectSphere will never ask for this code via phone or SMS</li>
                        <li>If you didn't request this code, please ignore this email</li>
                    </ul>
                </div>
                <div style="text-align: center; padding: 20px; color: #666; font-size: 12px;">
                    <p>Best regards,<br>The ConnectSphere Team</p>
                    <p style="margin-top: 10px; color: #999;">
                        This is an automated message, please do not reply.
                    </p>
                </div>
            </div>
        </body>
        </html>
        """
        
        body_text = f"""
        Welcome to ConnectSphere!
        
        Hi {user_name},
        
        Your verification code is: {otp_code}
        
        Please enter this code on the registration page to complete your signup.
        
        This code expires in 10 minutes and can only be used once.
        
        Security Tips:
        - Never share this code with anyone
        - ConnectSphere will never ask for this code via phone
        - If you didn't request this code, please ignore this email
        
        Best regards,
        The ConnectSphere Team
        """
        
        result = email_service.send_email(
            to_email=user_email,
            subject=subject,
            body_html=body_html,
            body_text=body_text
        )
        
        return result
    except Exception as e:
        print(f"Error sending OTP email: {e}")
        return {"status": "failed", "message": str(e)}

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

def verify_token_string(token: str, db: Session):
    """Verify JWT token string for WebSocket authentication"""
    try:
        payload = jwt.decode(token, SECRET_KEY, algorithms=[ALGORITHM])
        user_id: int = payload.get("user_id")
        if user_id is None:
            return None
        
        user = db.query(User).filter(User.id == user_id).first()
        if user is None:
            return None
        
        return user
    except (jwt.ExpiredSignatureError, jwt.InvalidTokenError):
        return None

def verify_admin(user: User = Depends(verify_token)):
    """Verify user has admin role"""
    if not user.is_admin:
        raise HTTPException(status_code=status.HTTP_403_FORBIDDEN, detail="Admin access required")
    return user

def verify_supplier(user: User = Depends(verify_token)):
    """Verify user has supplier role"""
    if not user.is_supplier:
        raise HTTPException(status_code=status.HTTP_403_FORBIDDEN, detail="Supplier access required")
    return user

def verify_trader(user: User = Depends(verify_token)):
    """Verify user has trader role (not admin, not supplier)"""
    if user.is_admin:
        raise HTTPException(status_code=status.HTTP_403_FORBIDDEN, detail="Admins cannot access trader features")
    if user.is_supplier:
        raise HTTPException(status_code=status.HTTP_403_FORBIDDEN, detail="Suppliers cannot access trader features")
    return user

# Routes
@router.post("/register")
async def register(user_data: UserRegister, db: Session = Depends(get_db)):
    """Register a new user - sends OTP to email for verification"""
    # Check if user already exists
    existing_user = db.query(User).filter(User.email == user_data.email).first()
    if existing_user:
        raise HTTPException(status_code=status.HTTP_400_BAD_REQUEST, detail="Email already registered")
    
    # Check if there's a pending registration for this email
    pending = db.query(PendingRegistration).filter(PendingRegistration.email == user_data.email).first()
    if pending:
        # Delete old pending registration
        db.delete(pending)
        db.commit()
    
    # Generate OTP
    otp_code = generate_otp()
    otp_expires = datetime.utcnow() + timedelta(minutes=10)  # 10 minutes expiry
    
    # Create pending registration (user not created yet!)
    pending_registration = PendingRegistration(
        email=user_data.email,
        hashed_password=hash_password(user_data.password),
        full_name=user_data.full_name,
        location_zone=user_data.location_zone,
        preferred_categories=user_data.preferred_categories,
        budget_range=user_data.budget_range,
        experience_level=user_data.experience_level,
        preferred_group_sizes=user_data.preferred_group_sizes,
        participation_frequency=user_data.participation_frequency,
        is_supplier=False,
        otp_code=otp_code,
        otp_expires=otp_expires,
        otp_attempts=0
    )
    
    db.add(pending_registration)
    db.commit()
    
    # Send OTP email
    try:
        email_result = send_otp_email(
            user_email=user_data.email,
            user_name=user_data.full_name or "User",
            otp_code=otp_code
        )
        
        if email_result.get("status") in ["sent", "simulated"]:
            return {
                "message": "Verification code sent! Please check your email and enter the 6-digit code to complete registration.",
                "email": user_data.email,
                "status": "otp_sent",
                "expires_in_minutes": 10
            }
        else:
            # If email fails, delete pending registration
            db.delete(pending_registration)
            db.commit()
            raise HTTPException(
                status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
                detail="Failed to send verification email. Please try again."
            )
    except HTTPException:
        raise
    except Exception as e:
        print(f"Error during registration: {e}")
        # Delete pending registration on error
        db.delete(pending_registration)
        db.commit()
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail="Registration failed. Please try again."
        )

@router.post("/verify-otp")
async def verify_otp(request: VerifyOTPRequest, db: Session = Depends(get_db)):
    """Verify OTP and complete user registration"""
    # Find pending registration
    pending = db.query(PendingRegistration).filter(PendingRegistration.email == request.email).first()
    
    if not pending:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="No pending registration found for this email. Please register first."
        )
    
    # Check if OTP has expired
    if pending.otp_expires < datetime.utcnow():
        db.delete(pending)
        db.commit()
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="OTP has expired. Please register again to get a new code."
        )
    
    # Check max attempts (prevent brute force)
    if pending.otp_attempts >= 5:
        db.delete(pending)
        db.commit()
        raise HTTPException(
            status_code=status.HTTP_429_TOO_MANY_REQUESTS,
            detail="Too many failed attempts. Please register again to get a new code."
        )
    
    # Verify OTP
    if pending.otp_code != request.otp_code:
        # Increment failed attempts
        pending.otp_attempts += 1
        db.commit()
        
        remaining = 5 - pending.otp_attempts
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail=f"Invalid OTP code. {remaining} attempts remaining."
        )
    
    # OTP is valid! Create the actual user account
    new_user = User(
        email=pending.email,
        hashed_password=pending.hashed_password,
        full_name=pending.full_name,
        location_zone=pending.location_zone,
        preferred_categories=pending.preferred_categories,
        budget_range=pending.budget_range,
        experience_level=pending.experience_level,
        preferred_group_sizes=pending.preferred_group_sizes,
        participation_frequency=pending.participation_frequency,
        is_admin=False,
        is_supplier=pending.is_supplier,
        email_verified=True,  # Mark as verified since OTP was confirmed
        is_active=True
    )
    
    # If supplier, add supplier fields
    if pending.is_supplier:
        new_user.company_name = pending.company_name
        new_user.business_address = pending.business_address
        new_user.tax_id = pending.tax_id
        new_user.phone_number = pending.phone_number
        new_user.business_type = pending.business_type
        new_user.business_description = pending.business_description
        new_user.website_url = pending.website_url
        new_user.bank_account_name = pending.bank_account_name
        new_user.bank_account_number = pending.bank_account_number
        new_user.bank_name = pending.bank_name
        new_user.payment_terms = pending.payment_terms
        new_user.is_verified = False
        new_user.verification_status = "pending"
    
    db.add(new_user)
    db.delete(pending)  # Remove pending registration
    db.commit()
    db.refresh(new_user)
    
    # Create access token for immediate login
    access_token = create_access_token({"user_id": new_user.id, "email": new_user.email})
    
    return Token(
        access_token=access_token,
        token_type="bearer",
        user_id=new_user.id,
        is_admin=new_user.is_admin,
        is_supplier=new_user.is_supplier,
        location_zone=new_user.location_zone,
        full_name=new_user.full_name,
        email=new_user.email,
        company_name=new_user.company_name if new_user.is_supplier else None
    )

@router.post("/resend-otp")
async def resend_otp(request: ResendOTPRequest, db: Session = Depends(get_db)):
    """Resend OTP code for pending registration"""
    # Find pending registration
    pending = db.query(PendingRegistration).filter(PendingRegistration.email == request.email).first()
    
    if not pending:
        # Don't reveal if email has pending registration
        return {
            "message": "If there's a pending registration for this email, a new code has been sent.",
            "status": "sent"
        }
    
    # Generate new OTP
    otp_code = generate_otp()
    otp_expires = datetime.utcnow() + timedelta(minutes=10)
    
    # Update pending registration
    pending.otp_code = otp_code
    pending.otp_expires = otp_expires
    pending.otp_attempts = 0  # Reset attempts
    db.commit()
    
    # Send OTP email
    try:
        email_result = send_otp_email(
            user_email=pending.email,
            user_name=pending.full_name or "User",
            otp_code=otp_code
        )
        
        if email_result.get("status") in ["sent", "simulated"]:
            return {
                "message": "New verification code sent! Please check your email.",
                "status": "sent",
                "email": pending.email,
                "expires_in_minutes": 10
            }
        else:
            return {
                "message": "Failed to send verification code. Please try again later.",
                "status": "failed"
            }
    except Exception as e:
        print(f"Error resending OTP: {e}")
        return {
            "message": "Failed to send verification code. Please try again later.",
            "status": "failed"
        }

@router.post("/login", response_model=Token)
async def login(credentials: UserLogin, db: Session = Depends(get_db)):
    # Find user
    user = db.query(User).filter(User.email == credentials.email).first()
    if not user or not verify_password(credentials.password, user.hashed_password):
        raise HTTPException(status_code=status.HTTP_401_UNAUTHORIZED, detail="Invalid credentials")
    
    # Check if email is verified
    if not user.email_verified:
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail="Email not verified. Please check your email for the verification link or request a new one."
        )
    
    # Check if account is active
    if not user.is_active:
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail="Your account has been deactivated. Please contact support."
        )
    
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

@router.delete("/account")
async def delete_account(
    request: DeleteAccountRequest,
    user: User = Depends(verify_token),
    db: Session = Depends(get_db)
):
    """
    Delete user account permanently
    Requires password verification and confirmation text
    """
    # Verify password
    if not verify_password(request.password, user.hashed_password):
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="Incorrect password"
        )
    
    # Verify confirmation text
    if request.confirmation.upper() != "DELETE":
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="Please type DELETE to confirm account deletion"
        )
    
    # Don't allow admin account deletion through this endpoint
    if user.is_admin:
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail="Admin accounts cannot be deleted through this endpoint. Please contact support."
        )
    
    try:
        # Soft delete: Mark account as inactive (preserves data integrity)
        # This is industry standard to maintain transaction history and relationships
        user.is_active = False
        user.email = f"deleted_{user.id}_{user.email}"  # Prevent email reuse
        user.password_reset_token = None
        user.password_reset_expires = None
        
        db.commit()
        
        return {
            "message": "Account deleted successfully",
            "status": "deleted"
        }
    except Exception as e:
        db.rollback()
        print(f"Error deleting account: {e}")  # Log the actual error
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail=f"Failed to delete account: {str(e)}"
        )

@router.post("/forgot-password")
async def forgot_password(
    request: ForgotPasswordRequest,
    db: Session = Depends(get_db)
):
    """Request a password reset email"""
    # Find user by email
    user = db.query(User).filter(User.email == request.email).first()
    
    # Always return success to prevent email enumeration attacks
    if not user:
        return {
            "message": "If an account with that email exists, a password reset link has been sent.",
            "status": "sent"
        }
    
    # Generate a secure reset token
    reset_token = secrets.token_urlsafe(32)
    
    # Set token expiration (1 hour from now)
    expires_at = datetime.utcnow() + timedelta(hours=1)
    
    # Save token to user record
    user.password_reset_token = reset_token
    user.password_reset_expires = expires_at
    db.commit()
    
    # Send password reset email
    try:
        from services.email_service import email_service
        
        # Create reset URL (frontend URL)
        frontend_url = os.getenv("FRONTEND_URL", "http://localhost:5173")
        reset_url = f"{frontend_url}/reset-password?token={reset_token}"
        
        result = email_service.send_password_reset_email(
            user_email=user.email,
            user_name=user.full_name or "User",
            reset_url=reset_url,
            expires_in_minutes=60
        )
        
        if result.get("status") in ["sent", "simulated"]:
            return {
                "message": "If an account with that email exists, a password reset link has been sent.",
                "status": "sent"
            }
        else:
            # Log error but don't expose to user
            print(f"Failed to send password reset email: {result}")
            return {
                "message": "If an account with that email exists, a password reset link has been sent.",
                "status": "sent"
            }
    except Exception as e:
        print(f"Error sending password reset email: {e}")
        return {
            "message": "If an account with that email exists, a password reset link has been sent.",
            "status": "sent"
        }

@router.post("/reset-password")
async def reset_password(
    request: ResetPasswordRequest,
    db: Session = Depends(get_db)
):
    """Reset password using token from email"""
    # Find user by reset token
    user = db.query(User).filter(User.password_reset_token == request.token).first()
    
    if not user:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="Invalid or expired reset token"
        )
    
    # Check if token has expired
    if user.password_reset_expires and user.password_reset_expires < datetime.utcnow():
        # Clear the expired token
        user.password_reset_token = None
        user.password_reset_expires = None
        db.commit()
        
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="Reset token has expired. Please request a new password reset."
        )
    
    # Validate new password
    if len(request.new_password) < 6:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="Password must be at least 6 characters long"
        )
    
    # Update password and clear reset token
    user.hashed_password = hash_password(request.new_password)
    user.password_reset_token = None
    user.password_reset_expires = None
    db.commit()
    
    # Send confirmation email
    try:
        from services.email_service import email_service
        email_service.send_email(
            to_email=user.email,
            subject="Password Changed Successfully - ConnectAfrica",
            body_html=f"""
            <html>
            <body style="font-family: Arial, sans-serif; line-height: 1.6; color: #333;">
                <div style="max-width: 600px; margin: 0 auto; padding: 20px;">
                    <h2 style="color: #10b981;">Password Changed Successfully</h2>
                    <p>Hi {user.full_name or 'there'},</p>
                    <p>Your password has been successfully changed.</p>
                    <p>If you did not make this change, please contact our support team immediately.</p>
                    <p>Best regards,<br>The ConnectAfrica Team</p>
                </div>
            </body>
            </html>
            """,
            body_text=f"Hi {user.full_name or 'there'}, Your password has been successfully changed. If you did not make this change, please contact support immediately."
        )
    except Exception as e:
        print(f"Failed to send password change confirmation: {e}")
    
    return {
        "message": "Password has been reset successfully. You can now log in with your new password.",
        "status": "success"
    }

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

@router.post("/register-supplier")
async def register_supplier(supplier_data: SupplierRegister, db: Session = Depends(get_db)):
    """Register a new supplier - sends OTP to email for verification"""
    # Validate password strength
    if not validate_password_strength(supplier_data.password):
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="Password must be at least 8 characters with uppercase, lowercase, and number"
        )
    
    # Validate business email (optional warning)
    if not validate_business_email(supplier_data.email):
        print(f"Warning: Personal email domain used for business registration: {supplier_data.email}")
    
    # Check if user already exists
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
    
    # Check for pending registration
    pending = db.query(PendingRegistration).filter(PendingRegistration.email == supplier_data.email).first()
    if pending:
        db.delete(pending)
        db.commit()
    
    # Sanitize phone number
    cleaned_phone = sanitize_phone_number(supplier_data.phone_number)
    
    # Generate OTP
    otp_code = generate_otp()
    otp_expires = datetime.utcnow() + timedelta(minutes=10)
    
    # Create pending registration for supplier
    pending_registration = PendingRegistration(
        email=supplier_data.email,
        hashed_password=hash_password(supplier_data.password),
        full_name=supplier_data.full_name,
        location_zone=supplier_data.location_zone,
        is_supplier=True,
        company_name=supplier_data.company_name,
        business_address=supplier_data.business_address,
        tax_id=supplier_data.tax_id,
        phone_number=cleaned_phone,
        business_type=supplier_data.business_type,
        business_description=supplier_data.business_description,
        website_url=supplier_data.website_url,
        bank_account_name=supplier_data.bank_account_name,
        bank_account_number=supplier_data.bank_account_number,
        bank_name=supplier_data.bank_name,
        payment_terms=supplier_data.payment_terms,
        otp_code=otp_code,
        otp_expires=otp_expires,
        otp_attempts=0
    )
    
    db.add(pending_registration)
    db.commit()
    
    # Send OTP email
    try:
        email_result = send_otp_email(
            user_email=supplier_data.email,
            user_name=supplier_data.full_name or "Supplier",
            otp_code=otp_code
        )
        
        if email_result.get("status") in ["sent", "simulated"]:
            return {
                "message": "Verification code sent! Please check your email and enter the 6-digit code to complete registration.",
                "email": supplier_data.email,
                "company_name": supplier_data.company_name,
                "status": "otp_sent",
                "expires_in_minutes": 10
            }
        else:
            db.delete(pending_registration)
            db.commit()
            raise HTTPException(
                status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
                detail="Failed to send verification email. Please try again."
            )
    except HTTPException:
        raise
    except Exception as e:
        print(f"Error during supplier registration: {e}")
        db.delete(pending_registration)
        db.commit()
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail="Registration failed. Please try again."
        )