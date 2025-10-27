import os
from pathlib import Path
from typing import List, Optional, Union
from pydantic_settings import BaseSettings
from pydantic import validator
from dotenv import load_dotenv

# Load environment variables from .env file
load_dotenv()

class Settings(BaseSettings):
    # Application
    APP_NAME: str = "ConnectSphere"
    APP_VERSION: str = "1.0.0"
    DEBUG: bool = os.getenv("DEBUG", "false").lower() == "true"
    ENVIRONMENT: str = os.getenv("ENVIRONMENT", "development")
    FRONTEND_URL: str = os.getenv("FRONTEND_URL", "http://localhost:3000")
    SECRET_KEY: str = os.getenv("SECRET_KEY", "your-secret-key-here")
    API_V1_STR: str = "/api/v1"
    
    # CORS
    BACKEND_CORS_ORIGINS: List[str] = ["*"]  # In production, replace with specific origins
    
    # Database
    SQLALCHEMY_DATABASE_URI: str = os.getenv("DATABASE_URL", "sqlite:///./groupbuy.db")
    
    # Redis
    REDIS_HOST: str = os.getenv("REDIS_HOST", "localhost")
    REDIS_PORT: int = int(os.getenv("REDIS_PORT", "6379"))
    REDIS_PASSWORD: str = os.getenv("REDIS_PASSWORD", "")
    REDIS_DB: int = int(os.getenv("REDIS_DB", "0"))
    REDIS_URI: str = f"redis://:{REDIS_PASSWORD}@{REDIS_HOST}:{REDIS_PORT}/{REDIS_DB}" if REDIS_PASSWORD else f"redis://{REDIS_HOST}:{REDIS_PORT}/{REDIS_DB}"
    
    # JWT
    JWT_SECRET_KEY: str = os.getenv("JWT_SECRET_KEY", "your-jwt-secret-key")
    JWT_ALGORITHM: str = "HS256"
    ACCESS_TOKEN_EXPIRE_MINUTES: int = 60 * 24 * 7  # 7 days
    REFRESH_TOKEN_EXPIRE_DAYS: int = 30  # 30 days
    
    # Security
    SECURITY_PASSWORD_SALT: str = os.getenv("SECURITY_PASSWORD_SALT", "your-password-salt")
    
    # Email settings
    EMAIL_FROM: str = os.getenv("EMAIL_FROM", "noreply@connectsphere.com")
    SMTP_SERVER: Optional[str] = os.getenv("SMTP_SERVER")
    SMTP_PORT: int = int(os.getenv("SMTP_PORT", "465"))
    SMTP_USERNAME: Optional[str] = os.getenv("SMTP_USERNAME")
    SMTP_PASSWORD: Optional[str] = os.getenv("SMTP_PASSWORD")
    EMAIL_TEMPLATES_DIR: str = os.path.join(os.path.dirname(__file__), "email-templates")
    EMAILS_ENABLED: bool = all([SMTP_SERVER, SMTP_PORT, SMTP_USERNAME, SMTP_PASSWORD])
    
    # CORS
    @validator("BACKEND_CORS_ORIGINS", pre=True)
    def assemble_cors_origins(cls, v: Union[str, List[str]]) -> Union[List[str], str]:
        if isinstance(v, str) and not v.startswith("["):
            return [i.strip() for i in v.split(",")]
        elif isinstance(v, (list, str)):
            return v
        raise ValueError(v)
    
    # File Uploads
    UPLOAD_FOLDER: str = os.path.join(Path(__file__).parent, "uploads")
    MAX_CONTENT_LENGTH: int = 16 * 1024 * 1024  # 16MB
    ALLOWED_EXTENSIONS: set = {"png", "jpg", "jpeg", "gif", "pdf", "doc", "docx"}
    
    # Rate Limiting
    RATE_LIMIT: str = "1000/day;100/hour;30/minute"
    
    # Cache
    CACHE_TTL: int = 300  # 5 minutes
    CACHE_MAX_SIZE: int = 1000
    
    # Sentry
    SENTRY_DSN: Optional[str] = os.getenv("SENTRY_DSN")
    
    # Cloudinary
    CLOUDINARY_CLOUD_NAME: str = os.getenv("CLOUDINARY_CLOUD_NAME", "")
    CLOUDINARY_API_KEY: str = os.getenv("CLOUDINARY_API_KEY", "")
    CLOUDINARY_API_SECRET: str = os.getenv("CLOUDINARY_API_SECRET", "")
    
    class Config:
        case_sensitive = True
        env_file = ".env"

# Create settings instance
settings = Settings()

# Ensure upload directory exists
os.makedirs(settings.UPLOAD_FOLDER, exist_ok=True)
