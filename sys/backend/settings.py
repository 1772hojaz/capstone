from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy.orm import Session
from pydantic import BaseModel
from typing import List, Optional
from datetime import datetime
import json
import os
from database import get_db
from auth import verify_token
from models import User

router = APIRouter()

# Settings storage - using JSON file for simplicity
SETTINGS_FILE = "settings.json"
BACKUPS_DIR = "settings_backups"

# Ensure backups directory exists
os.makedirs(BACKUPS_DIR, exist_ok=True)

# Default settings
DEFAULT_SETTINGS = {
    "platform_name": "ConnectSphere",
    "platform_description": "A collaborative group buying platform connecting users for better deals.",
    "maintenance_mode": False,
    "max_groups_per_user": 5,
    "default_group_duration_days": 30,
    "min_group_participants": 2,
    "max_group_participants": 100,
    "commission_percentage": 5.0,
    "support_email": "support@connectsphere.com",
    "currency_primary": "USD",
    "currency_secondary": "ZIG",
    "timezone": "Africa/Harare",
    "notifications_enabled": True,
    "email_verification_required": False,
    "auto_backup_enabled": True,
    "backup_frequency_hours": 24,
    "max_file_upload_size_mb": 10,
    "allowed_file_types": ["jpg", "jpeg", "png", "gif"],
    "session_timeout_minutes": 1440,  # 24 hours
    "rate_limiting_enabled": True,
    "max_requests_per_minute": 100,
    "features": {
        "chat_enabled": True,
        "recommendations_enabled": True,
        "analytics_enabled": True,
        "qr_verification_enabled": True
    }
}

# Pydantic Models
class SystemSettings(BaseModel):
    platform_name: str
    platform_description: str
    maintenance_mode: bool
    max_groups_per_user: int
    default_group_duration_days: int
    min_group_participants: int
    max_group_participants: int
    commission_percentage: float
    support_email: str
    currency_primary: str
    currency_secondary: str
    timezone: str
    notifications_enabled: bool
    email_verification_required: bool
    auto_backup_enabled: bool
    backup_frequency_hours: int
    max_file_upload_size_mb: int
    allowed_file_types: List[str]
    session_timeout_minutes: int
    rate_limiting_enabled: bool
    max_requests_per_minute: int
    features: dict

class SettingsUpdate(BaseModel):
    platform_name: Optional[str] = None
    platform_description: Optional[str] = None
    maintenance_mode: Optional[bool] = None
    max_groups_per_user: Optional[int] = None
    default_group_duration_days: Optional[int] = None
    min_group_participants: Optional[int] = None
    max_group_participants: Optional[int] = None
    commission_percentage: Optional[float] = None
    support_email: Optional[str] = None
    currency_primary: Optional[str] = None
    currency_secondary: Optional[str] = None
    timezone: Optional[str] = None
    notifications_enabled: Optional[bool] = None
    email_verification_required: Optional[bool] = None
    auto_backup_enabled: Optional[bool] = None
    backup_frequency_hours: Optional[int] = None
    max_file_upload_size_mb: Optional[int] = None
    allowed_file_types: Optional[List[str]] = None
    session_timeout_minutes: Optional[int] = None
    rate_limiting_enabled: Optional[bool] = None
    max_requests_per_minute: Optional[int] = None
    features: Optional[dict] = None

class BackupInfo(BaseModel):
    id: str
    timestamp: str
    filename: str
    size_bytes: int

# Helper Functions
def load_settings() -> dict:
    """Load settings from JSON file"""
    if os.path.exists(SETTINGS_FILE):
        try:
            with open(SETTINGS_FILE, 'r') as f:
                return json.load(f)
        except Exception:
            pass
    return DEFAULT_SETTINGS.copy()

def save_settings(settings: dict):
    """Save settings to JSON file"""
    with open(SETTINGS_FILE, 'w') as f:
        json.dump(settings, f, indent=2)

def create_backup() -> str:
    """Create a backup of current settings"""
    settings = load_settings()
    timestamp = datetime.utcnow().strftime("%Y%m%d_%H%M%S")
    filename = f"settings_backup_{timestamp}.json"
    filepath = os.path.join(BACKUPS_DIR, filename)

    with open(filepath, 'w') as f:
        json.dump(settings, f, indent=2)

    return filename

def get_backups() -> List[dict]:
    """Get list of available backups"""
    backups = []
    if os.path.exists(BACKUPS_DIR):
        for filename in os.listdir(BACKUPS_DIR):
            if filename.startswith("settings_backup_") and filename.endswith(".json"):
                filepath = os.path.join(BACKUPS_DIR, filename)
                stat = os.stat(filepath)
                backups.append({
                    "id": filename.replace("settings_backup_", "").replace(".json", ""),
                    "timestamp": datetime.fromtimestamp(stat.st_mtime).isoformat(),
                    "filename": filename,
                    "size_bytes": stat.st_size
                })
    return sorted(backups, key=lambda x: x["timestamp"], reverse=True)

# Routes
@router.get("/", response_model=SystemSettings)
async def get_settings(user: User = Depends(verify_token)):
    """
    Get current system settings.

    Only administrators can view system settings.
    """
    if not user.is_admin:
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail="Only administrators can view system settings"
        )

    settings = load_settings()
    return SystemSettings(**settings)

@router.put("/", response_model=SystemSettings)
async def update_settings(
    updates: SettingsUpdate,
    user: User = Depends(verify_token),
    db: Session = Depends(get_db)
):
    """
    Update system settings.

    Only administrators can modify system settings.
    """
    if not user.is_admin:
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail="Only administrators can modify system settings"
        )

    # Load current settings
    current_settings = load_settings()

    # Update only provided fields
    update_dict = updates.dict(exclude_unset=True)
    current_settings.update(update_dict)

    # Validate critical settings
    if current_settings["max_groups_per_user"] < 1:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="max_groups_per_user must be at least 1"
        )

    if current_settings["commission_percentage"] < 0 or current_settings["commission_percentage"] > 100:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="commission_percentage must be between 0 and 100"
        )

    # Save updated settings
    save_settings(current_settings)

    return SystemSettings(**current_settings)

@router.post("/backup")
async def create_settings_backup(user: User = Depends(verify_token)):
    """
    Create a backup of current system settings.

    Only administrators can create backups.
    """
    if not user.is_admin:
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail="Only administrators can create settings backups"
        )

    filename = create_backup()
    return {
        "message": "Settings backup created successfully",
        "backup_filename": filename
    }

@router.get("/backups", response_model=List[BackupInfo])
async def get_settings_backups(user: User = Depends(verify_token)):
    """
    Get list of available settings backups.

    Only administrators can view backups.
    """
    if not user.is_admin:
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail="Only administrators can view settings backups"
        )

    backups = get_backups()
    return [BackupInfo(**backup) for backup in backups]