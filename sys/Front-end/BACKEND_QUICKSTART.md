# Backend Quick Start Guide

This guide helps you quickly set up the FastAPI backend for ConnectSphere.

## 📁 Recommended Backend Structure

```
sys/backend/
├── main.py                 # FastAPI app entry point
├── database.py            # Database connection
├── models.py              # SQLAlchemy models
├── auth.py                # Authentication & JWT
├── requirements.txt       # Python dependencies
├── .env                   # Environment variables
├── routers/
│   ├── auth.py           # Auth endpoints
│   ├── products.py       # Products endpoints
│   ├── groups.py         # Group-buys endpoints
│   ├── ml.py             # ML endpoints
│   └── admin.py          # Admin endpoints
└── ml_models/            # Saved ML models directory
```

## 🚀 Quick Setup

### 1. Install Dependencies

Create `requirements.txt`:
```txt
fastapi==0.104.1
uvicorn[standard]==0.24.0
sqlalchemy==2.0.23
pydantic==2.5.0
python-jose[cryptography]==3.3.0
passlib[bcrypt]==1.7.4
python-multipart==0.0.6
psycopg2-binary==2.9.9
scikit-learn==1.3.2
pandas==2.1.3
numpy==1.26.2
joblib==1.3.2
python-dotenv==1.0.0
```

Install:
```bash
cd sys/backend
python -m venv venv
source venv/bin/activate  # On Windows: venv\Scripts\activate
pip install -r requirements.txt
```

### 2. Create `.env` File

```env
DATABASE_URL=sqlite:///./connectsphere.db
SECRET_KEY=your-super-secret-key-change-this-in-production
ALGORITHM=HS256
ACCESS_TOKEN_EXPIRE_MINUTES=30
```

### 3. Minimal `main.py`

```python
from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
import uvicorn

app = FastAPI(
    title="ConnectSphere API",
    description="Group Buying Platform API",
    version="1.0.0"
)

# CORS configuration for frontend
app.add_middleware(
    CORSMiddleware,
    allow_origins=["http://localhost:5173"],  # Frontend URL
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# Health check endpoints
@app.get("/")
async def root():
    return {
        "message": "ConnectSphere API is running",
        "version": "1.0.0",
        "status": "healthy"
    }

@app.get("/health")
async def health_check():
    return {
        "status": "healthy",
        "database": "connected",
        "timestamp": "2025-10-10T16:30:00Z"
    }

# Include routers (add these as you create them)
# from routers import auth, products, groups, ml, admin
# app.include_router(auth.router, prefix="/api/auth", tags=["Authentication"])
# app.include_router(products.router, prefix="/api/products", tags=["Products"])
# app.include_router(groups.router, prefix="/api/groups", tags=["Group-Buys"])
# app.include_router(ml.router, prefix="/api/ml", tags=["Machine Learning"])
# app.include_router(admin.router, prefix="/api/admin", tags=["Admin"])

if __name__ == "__main__":
    uvicorn.run("main:app", host="0.0.0.0", port=8000, reload=True)
```

### 4. Run the Backend

```bash
cd sys/backend
source venv/bin/activate  # On Windows: venv\Scripts\activate
python main.py
```

Or with uvicorn directly:
```bash
uvicorn main:app --reload --port 8000
```

### 5. Test the Connection

Open browser to:
- API Docs: http://localhost:8000/docs
- Alternative Docs: http://localhost:8000/redoc
- Health Check: http://localhost:8000/health

## 📝 Next Steps

### Step 1: Database Setup

Create `database.py`:
```python
from sqlalchemy import create_engine
from sqlalchemy.ext.declarative import declarative_base
from sqlalchemy.orm import sessionmaker
import os
from dotenv import load_dotenv

load_dotenv()

DATABASE_URL = os.getenv("DATABASE_URL", "sqlite:///./connectsphere.db")

engine = create_engine(
    DATABASE_URL,
    connect_args={"check_same_thread": False} if "sqlite" in DATABASE_URL else {}
)

SessionLocal = sessionmaker(autocommit=False, autoflush=False, bind=engine)
Base = declarative_base()

def get_db():
    db = SessionLocal()
    try:
        yield db
    finally:
        db.close()
```

### Step 2: Create Models

Create `models.py`:
```python
from sqlalchemy import Column, Integer, String, Float, Boolean, DateTime, ForeignKey, Text
from sqlalchemy.orm import relationship
from database import Base
from datetime import datetime

class User(Base):
    __tablename__ = "users"
    
    id = Column(Integer, primary_key=True, index=True)
    email = Column(String, unique=True, index=True, nullable=False)
    hashed_password = Column(String, nullable=False)
    full_name = Column(String)
    phone_number = Column(String)
    is_admin = Column(Boolean, default=False)
    created_at = Column(DateTime, default=datetime.utcnow)
    
    # Relationships
    group_buys = relationship("GroupBuy", back_populates="initiator")
    participants = relationship("GroupBuyParticipant", back_populates="user")

class Product(Base):
    __tablename__ = "products"
    
    id = Column(Integer, primary_key=True, index=True)
    name = Column(String, nullable=False)
    category = Column(String, nullable=False)
    unit = Column(String, default="piece")
    description = Column(Text)
    current_price = Column(Float)
    image_url = Column(String)
    created_at = Column(DateTime, default=datetime.utcnow)
    
    # Relationships
    group_buys = relationship("GroupBuy", back_populates="product")

class GroupBuy(Base):
    __tablename__ = "group_buys"
    
    id = Column(Integer, primary_key=True, index=True)
    product_id = Column(Integer, ForeignKey("products.id"))
    initiator_id = Column(Integer, ForeignKey("users.id"))
    target_quantity = Column(Integer, nullable=False)
    current_quantity = Column(Integer, default=0)
    deadline = Column(DateTime, nullable=False)
    status = Column(String, default="open")  # open, closed, completed, cancelled
    price_per_unit = Column(Float, nullable=False)
    created_at = Column(DateTime, default=datetime.utcnow)
    
    # Relationships
    product = relationship("Product", back_populates="group_buys")
    initiator = relationship("User", back_populates="group_buys")
    participants = relationship("GroupBuyParticipant", back_populates="group_buy")

class GroupBuyParticipant(Base):
    __tablename__ = "group_buy_participants"
    
    id = Column(Integer, primary_key=True, index=True)
    group_buy_id = Column(Integer, ForeignKey("group_buys.id"))
    user_id = Column(Integer, ForeignKey("users.id"))
    quantity = Column(Integer, nullable=False)
    joined_at = Column(DateTime, default=datetime.utcnow)
    
    # Relationships
    group_buy = relationship("GroupBuy", back_populates="participants")
    user = relationship("User", back_populates="participants")

# Create all tables
from database import engine
Base.metadata.create_all(bind=engine)
```

### Step 3: Implement Authentication

Create `auth.py`:
```python
from fastapi import APIRouter, Depends, HTTPException, status
from fastapi.security import HTTPBearer, HTTPAuthorizationCredentials
from sqlalchemy.orm import Session
from passlib.context import CryptContext
from jose import JWTError, jwt
from datetime import datetime, timedelta
from pydantic import BaseModel, EmailStr
import os
from dotenv import load_dotenv

from database import get_db
from models import User

load_dotenv()

router = APIRouter()
security = HTTPBearer()
pwd_context = CryptContext(schemes=["bcrypt"], deprecated="auto")

SECRET_KEY = os.getenv("SECRET_KEY")
ALGORITHM = os.getenv("ALGORITHM", "HS256")
ACCESS_TOKEN_EXPIRE_MINUTES = int(os.getenv("ACCESS_TOKEN_EXPIRE_MINUTES", 30))

# Pydantic models
class UserRegister(BaseModel):
    email: EmailStr
    password: str
    full_name: str
    phone_number: str | None = None

class UserLogin(BaseModel):
    email: EmailStr
    password: str

class Token(BaseModel):
    access_token: str
    token_type: str
    user: dict

# Helper functions
def hash_password(password: str) -> str:
    return pwd_context.hash(password)

def verify_password(plain_password: str, hashed_password: str) -> bool:
    return pwd_context.verify(plain_password, hashed_password)

def create_access_token(data: dict) -> str:
    to_encode = data.copy()
    expire = datetime.utcnow() + timedelta(minutes=ACCESS_TOKEN_EXPIRE_MINUTES)
    to_encode.update({"exp": expire})
    return jwt.encode(to_encode, SECRET_KEY, algorithm=ALGORITHM)

def verify_token(
    credentials: HTTPAuthorizationCredentials = Depends(security),
    db: Session = Depends(get_db)
):
    try:
        payload = jwt.decode(credentials.credentials, SECRET_KEY, algorithms=[ALGORITHM])
        user_id: int = payload.get("user_id")
        if user_id is None:
            raise HTTPException(
                status_code=status.HTTP_401_UNAUTHORIZED,
                detail="Invalid token"
            )
        
        user = db.query(User).filter(User.id == user_id).first()
        if user is None:
            raise HTTPException(
                status_code=status.HTTP_401_UNAUTHORIZED,
                detail="User not found"
            )
        return user
    except JWTError:
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="Invalid token"
        )

# Routes
@router.post("/register", response_model=Token)
async def register(user_data: UserRegister, db: Session = Depends(get_db)):
    # Check if user exists
    existing = db.query(User).filter(User.email == user_data.email).first()
    if existing:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="Email already registered"
        )
    
    # Create user
    new_user = User(
        email=user_data.email,
        hashed_password=hash_password(user_data.password),
        full_name=user_data.full_name,
        phone_number=user_data.phone_number,
        is_admin=False
    )
    
    db.add(new_user)
    db.commit()
    db.refresh(new_user)
    
    # Create token
    access_token = create_access_token({"user_id": new_user.id})
    
    return Token(
        access_token=access_token,
        token_type="bearer",
        user={
            "id": new_user.id,
            "email": new_user.email,
            "full_name": new_user.full_name,
            "is_admin": new_user.is_admin
        }
    )

@router.post("/login", response_model=Token)
async def login(credentials: UserLogin, db: Session = Depends(get_db)):
    user = db.query(User).filter(User.email == credentials.email).first()
    
    if not user or not verify_password(credentials.password, user.hashed_password):
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="Incorrect email or password"
        )
    
    access_token = create_access_token({"user_id": user.id})
    
    return Token(
        access_token=access_token,
        token_type="bearer",
        user={
            "id": user.id,
            "email": user.email,
            "full_name": user.full_name,
            "is_admin": user.is_admin
        }
    )

@router.get("/me")
async def get_current_user(user: User = Depends(verify_token)):
    return {
        "id": user.id,
        "email": user.email,
        "full_name": user.full_name,
        "phone_number": user.phone_number,
        "is_admin": user.is_admin,
        "created_at": user.created_at
    }
```

### Step 4: Update main.py to Include Auth Router

```python
from routers import auth

app.include_router(auth.router, prefix="/api/auth", tags=["Authentication"])
```

## 🧪 Testing

### Test Registration
```bash
curl -X POST http://localhost:8000/api/auth/register \
  -H "Content-Type: application/json" \
  -d '{
    "email": "test@example.com",
    "password": "password123",
    "full_name": "Test User"
  }'
```

### Test Login
```bash
curl -X POST http://localhost:8000/api/auth/login \
  -H "Content-Type: application/json" \
  -d '{
    "email": "test@example.com",
    "password": "password123"
  }'
```

## 📚 Resources

- [FastAPI Documentation](https://fastapi.tiangolo.com/)
- [SQLAlchemy Documentation](https://docs.sqlalchemy.org/)
- [Pydantic Documentation](https://docs.pydantic.dev/)
- Full API Specification: See `API_SPECIFICATION.md`

## ⚠️ Important Notes

1. **Change SECRET_KEY**: Generate a secure key for production:
   ```bash
   python -c "import secrets; print(secrets.token_urlsafe(32))"
   ```

2. **Database**: Start with SQLite for development, migrate to PostgreSQL for production

3. **CORS**: Update allowed origins in production

4. **Error Handling**: Add proper error handling and logging

5. **Validation**: Use Pydantic models for all request/response validation

## 🎯 Implementation Order

1. ✅ Health checks (done in minimal setup)
2. ✅ Database setup
3. ✅ Authentication
4. Products endpoints
5. Group-buys endpoints
6. ML endpoints (can start with simple rule-based recommendations)
7. Admin endpoints

Good luck with your capstone project! 🚀
