"""
Main FastAPI application for SPACS AFRICA.
Handles all API endpoints for traders and administrators.
"""

from fastapi import FastAPI, Depends, HTTPException, status
from fastapi.middleware.cors import CORSMiddleware
from fastapi.security import OAuth2PasswordBearer, OAuth2PasswordRequestForm
from sqlalchemy.orm import Session
from sqlalchemy import text
from datetime import datetime, timedelta
from typing import List, Optional
from uuid import UUID
import os
import logging
from passlib.context import CryptContext
from jose import JWTError, jwt

# Local imports
from database import get_db, check_db_connection, get_db_health
from models import *
from event_bus import event_bus, EventTypes
from recommender import GroupRecommenderEngine
from explainability import generate_recommendation_explanation
from clustering import UserClusteringEngine, extract_user_features, update_user_clusters
from evaluation import evaluate_system
from synthetic_data import SyntheticDataGenerator, insert_synthetic_data_to_db

# Configure logging
logging.basicConfig(
    level=logging.INFO,
    format='%(asctime)s - %(name)s - %(levelname)s - %(message)s'
)
logger = logging.getLogger(__name__)

# ========================================
# FastAPI App Configuration
# ========================================

app = FastAPI(
    title="SPACS AFRICA API",
    description="Collaborative Bulk-Purchasing Platform for Informal Traders",
    version="1.0.0",
    docs_url="/docs",
    redoc_url="/redoc"
)

# CORS configuration
app.add_middleware(
    CORSMiddleware,
    allow_origins=[
        "http://localhost:3000",
        "http://localhost:8000",
        "http://127.0.0.1:3000",
        os.getenv("FRONTEND_URL", "http://localhost:3000")
    ],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# ========================================
# Authentication Setup
# ========================================

SECRET_KEY = os.getenv("SECRET_KEY", "super-secret-jwt-key-change-in-production")
ALGORITHM = os.getenv("ALGORITHM", "HS256")
ACCESS_TOKEN_EXPIRE_MINUTES = int(os.getenv("ACCESS_TOKEN_EXPIRE_MINUTES", "30"))

pwd_context = CryptContext(schemes=["bcrypt"], deprecated="auto")
oauth2_scheme = OAuth2PasswordBearer(tokenUrl="api/auth/login")


def verify_password(plain_password: str, hashed_password: str) -> bool:
    """Verify a password against its hash."""
    return pwd_context.verify(plain_password, hashed_password)


def get_password_hash(password: str) -> str:
    """Hash a password."""
    return pwd_context.hash(password)


def create_access_token(data: dict, expires_delta: Optional[timedelta] = None):
    """Create a JWT access token."""
    to_encode = data.copy()
    expire = datetime.utcnow() + (expires_delta or timedelta(minutes=15))
    to_encode.update({"exp": expire})
    encoded_jwt = jwt.encode(to_encode, SECRET_KEY, algorithm=ALGORITHM)
    return encoded_jwt


async def get_current_user(
    token: str = Depends(oauth2_scheme),
    db: Session = Depends(get_db)
) -> dict:
    """Get current user from JWT token."""
    credentials_exception = HTTPException(
        status_code=status.HTTP_401_UNAUTHORIZED,
        detail="Could not validate credentials",
        headers={"WWW-Authenticate": "Bearer"},
    )
    
    try:
        payload = jwt.decode(token, SECRET_KEY, algorithms=[ALGORITHM])
        email: str = payload.get("sub")
        if email is None:
            raise credentials_exception
    except JWTError:
        raise credentials_exception
    
    # Get user from database
    query = text("SELECT * FROM users WHERE email = :email AND is_active = TRUE")
    result = db.execute(query, {"email": email})
    user = result.fetchone()
    
    if user is None:
        raise credentials_exception
    
    return dict(user._mapping)


# ========================================
# Startup & Shutdown Events
# ========================================

@app.on_event("startup")
async def startup_event():
    """Run on application startup."""
    logger.info("Starting SPACS AFRICA API...")
    
    # Check database connection
    if check_db_connection():
        logger.info("✓ Database connection established")
    else:
        logger.error("✗ Database connection failed")
    
    logger.info("✓ SPACS AFRICA API started successfully")


@app.on_event("shutdown")
async def shutdown_event():
    """Run on application shutdown."""
    logger.info("Shutting down SPACS AFRICA API...")
    from database import close_db_connections
    close_db_connections()


# ========================================
# Health & Status Endpoints
# ========================================

@app.get("/health", response_model=HealthResponse)
async def health_check(db: Session = Depends(get_db)):
    """Health check endpoint."""
    db_health = get_db_health()
    
    # Check Redis
    try:
        from event_bus import event_bus
        event_bus.redis_client.ping()
        redis_status = {"status": "healthy"}
    except Exception as e:
        redis_status = {"status": "unhealthy", "error": str(e)}
    
    return {
        "status": "healthy" if db_health["status"] == "healthy" else "degraded",
        "timestamp": datetime.now(),
        "database": db_health,
        "redis": redis_status,
        "version": "1.0.0"
    }


@app.get("/")
async def root():
    """Root endpoint."""
    return {
        "message": "Welcome to SPACS AFRICA API",
        "version": "1.0.0",
        "docs": "/docs",
        "health": "/health"
    }


# ========================================
# Authentication Endpoints
# ========================================

@app.post("/api/auth/register", response_model=Token)
async def register(user_data: UserCreate, db: Session = Depends(get_db)):
    """Register a new user."""
    # Check if user exists
    check_query = text("SELECT id FROM users WHERE email = :email")
    existing = db.execute(check_query, {"email": user_data.email}).fetchone()
    
    if existing:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="Email already registered"
        )
    
    # Create user
    user_id = str(UUID(int=0))  # Will be replaced by database
    hashed_password = get_password_hash(user_data.password)
    
    insert_query = text("""
        INSERT INTO users (
            email, password_hash, full_name, business_name, phone,
            location_lat, location_lng, location_name, is_admin, is_active
        ) VALUES (
            :email, :password_hash, :full_name, :business_name, :phone,
            :location_lat, :location_lng, :location_name, FALSE, TRUE
        )
        RETURNING id, email, full_name, business_name, is_admin, is_active, created_at
    """)
    
    result = db.execute(insert_query, {
        "email": user_data.email,
        "password_hash": hashed_password,
        "full_name": user_data.full_name,
        "business_name": user_data.business_name,
        "phone": user_data.phone,
        "location_lat": user_data.location_lat,
        "location_lng": user_data.location_lng,
        "location_name": user_data.location_name
    })
    
    db.commit()
    new_user = dict(result.fetchone()._mapping)
    
    # Publish new user event
    event_bus.publish(EventTypes.NEW_USER, 'user', UUID(new_user['id']), {'email': new_user['email']})
    
    # Create access token
    access_token = create_access_token(
        data={"sub": new_user['email']},
        expires_delta=timedelta(minutes=ACCESS_TOKEN_EXPIRE_MINUTES)
    )
    
    return {
        "access_token": access_token,
        "token_type": "bearer",
        "user": new_user
    }


@app.post("/api/auth/login", response_model=Token)
async def login(
    form_data: OAuth2PasswordRequestForm = Depends(),
    db: Session = Depends(get_db)
):
    """Login endpoint."""
    # Get user
    query = text("SELECT * FROM users WHERE email = :email AND is_active = TRUE")
    result = db.execute(query, {"email": form_data.username})
    user = result.fetchone()
    
    if not user or not verify_password(form_data.password, user.password_hash):
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="Incorrect email or password",
            headers={"WWW-Authenticate": "Bearer"},
        )
    
    # Create access token
    access_token = create_access_token(
        data={"sub": user.email},
        expires_delta=timedelta(minutes=ACCESS_TOKEN_EXPIRE_MINUTES)
    )
    
    user_dict = dict(user._mapping)
    del user_dict['password_hash']
    
    return {
        "access_token": access_token,
        "token_type": "bearer",
        "user": user_dict
    }


@app.get("/api/auth/me", response_model=UserProfile)
async def get_current_user_profile(
    current_user: dict = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    """Get current user profile with statistics."""
    # Get user stats
    stats_query = text("""
        SELECT 
            COUNT(t.id) as total_transactions,
            COALESCE(SUM(t.total_price), 0) as total_spent
        FROM transactions t
        WHERE t.user_id = :user_id
    """)
    
    stats = db.execute(stats_query, {"user_id": current_user['id']}).fetchone()
    
    # Get cluster info
    cluster_query = text("""
        SELECT cluster_id, cluster_name
        FROM user_clusters
        WHERE user_id = :user_id
        ORDER BY assigned_at DESC
        LIMIT 1
    """)
    
    cluster = db.execute(cluster_query, {"user_id": current_user['id']}).fetchone()
    
    profile = {
        **current_user,
        "total_transactions": stats.total_transactions if stats else 0,
        "total_spent": float(stats.total_spent) if stats else 0.0,
        "potential_savings": 0.0,  # TODO: Calculate
        "cluster_id": cluster.cluster_id if cluster else None,
        "cluster_name": cluster.cluster_name if cluster else None
    }
    
    return profile


# ========================================
# Product Endpoints
# ========================================

@app.get("/api/products", response_model=List[ProductResponse])
async def get_products(
    category: Optional[str] = None,
    db: Session = Depends(get_db)
):
    """Get all active products."""
    query = "SELECT * FROM products WHERE is_active = TRUE"
    params = {}
    
    if category:
        query += " AND category = :category"
        params["category"] = category
    
    query += " ORDER BY name"
    
    result = db.execute(text(query), params)
    products = [dict(row._mapping) for row in result]
    
    return products


@app.get("/api/products/{product_id}", response_model=ProductResponse)
async def get_product(product_id: UUID, db: Session = Depends(get_db)):
    """Get a specific product."""
    query = text("SELECT * FROM products WHERE id = :product_id AND is_active = TRUE")
    result = db.execute(query, {"product_id": str(product_id)})
    product = result.fetchone()
    
    if not product:
        raise HTTPException(status_code=404, detail="Product not found")
    
    return dict(product._mapping)


# ========================================
# Recommendation Endpoints
# ========================================

@app.get("/api/recommendations", response_model=List[RecommendationDetail])
async def get_recommendations(
    current_user: dict = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    """Get recommendations for current user."""
    query = text("""
        SELECT 
            r.*,
            p.name as product_name,
            p.category,
            p.base_price,
            p.bulk_price
        FROM recommendations r
        JOIN products p ON r.product_id = p.id
        WHERE r.user_id = :user_id
        AND r.status = 'pending'
        AND (r.expires_at IS NULL OR r.expires_at > NOW())
        ORDER BY r.score DESC, r.created_at DESC
        LIMIT 10
    """)
    
    result = db.execute(query, {"user_id": current_user['id']})
    recs = [dict(row._mapping) for row in result]
    
    # Enrich with product details
    for rec in recs:
        rec['product'] = {
            'name': rec['product_name'],
            'category': rec['category'],
            'base_price': float(rec['base_price']),
            'bulk_price': float(rec['bulk_price'])
        }
        
        if rec['group_id']:
            # Get group details
            group_query = text("SELECT * FROM bulk_groups WHERE id = :group_id")
            group = db.execute(group_query, {"group_id": rec['group_id']}).fetchone()
            if group:
                rec['group'] = dict(group._mapping)
    
    return recs


@app.post("/api/recommendations/generate")
async def generate_recommendations_endpoint(
    current_user: dict = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    """Generate fresh recommendations for current user."""
    from celery_worker import generate_user_recommendations
    
    # Queue background task
    task = generate_user_recommendations.delay(str(current_user['id']))
    
    return {
        "message": "Recommendations generation queued",
        "task_id": task.id
    }


# ========================================
# Bulk Group Endpoints
# ========================================

@app.get("/api/groups", response_model=List[BulkGroupDetail])
async def get_bulk_groups(
    status: Optional[str] = "open",
    db: Session = Depends(get_db)
):
    """Get bulk purchase groups."""
    query = text("""
        SELECT 
            bg.*,
            p.name as product_name,
            p.category,
            p.base_price,
            p.bulk_price,
            COUNT(gm.id) as member_count
        FROM bulk_groups bg
        JOIN products p ON bg.product_id = p.id
        LEFT JOIN group_memberships gm ON bg.id = gm.group_id
        WHERE (:status IS NULL OR bg.status = :status)
        GROUP BY bg.id, p.id, p.name, p.category, p.base_price, p.bulk_price
        ORDER BY bg.created_at DESC
    """)
    
    result = db.execute(query, {"status": status})
    groups = [dict(row._mapping) for row in result]
    
    for group in groups:
        group['product'] = {
            'name': group['product_name'],
            'category': group['category'],
            'base_price': float(group['base_price']),
            'bulk_price': float(group['bulk_price'])
        }
    
    return groups


@app.post("/api/groups/{group_id}/join", response_model=MessageResponse)
async def join_group(
    group_id: UUID,
    membership: GroupMembershipCreate,
    current_user: dict = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    """Join a bulk purchase group."""
    # Check if group exists and is open
    group_query = text("SELECT * FROM bulk_groups WHERE id = :group_id AND status = 'open'")
    group = db.execute(group_query, {"group_id": str(group_id)}).fetchone()
    
    if not group:
        raise HTTPException(status_code=404, detail="Group not found or not open")
    
    # Check if already a member
    check_query = text("""
        SELECT id FROM group_memberships 
        WHERE group_id = :group_id AND user_id = :user_id
    """)
    existing = db.execute(check_query, {
        "group_id": str(group_id),
        "user_id": current_user['id']
    }).fetchone()
    
    if existing:
        raise HTTPException(status_code=400, detail="Already a member of this group")
    
    # Add membership
    insert_query = text("""
        INSERT INTO group_memberships (group_id, user_id, quantity_committed)
        VALUES (:group_id, :user_id, :quantity)
        RETURNING id
    """)
    
    db.execute(insert_query, {
        "group_id": str(group_id),
        "user_id": current_user['id'],
        "quantity": membership.quantity_committed
    })
    
    db.commit()
    
    # Publish event
    event_bus.publish(
        EventTypes.USER_JOINED_GROUP,
        'group_membership',
        UUID(current_user['id']),
        {'group_id': str(group_id), 'quantity': membership.quantity_committed}
    )
    
    return {
        "message": "Successfully joined group",
        "status": "success"
    }


# ========================================
# Admin Endpoints
# ========================================

@app.get("/api/admin/metrics", response_model=SystemMetrics)
async def get_system_metrics(
    current_user: dict = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    """Get system-wide metrics (admin only)."""
    if not current_user.get('is_admin'):
        raise HTTPException(status_code=403, detail="Admin access required")
    
    # Get metrics
    query = text("""
        SELECT 
            (SELECT COUNT(*) FROM users WHERE is_active = TRUE) as total_users,
            (SELECT COUNT(*) FROM products WHERE is_active = TRUE) as total_products,
            (SELECT COUNT(*) FROM transactions) as total_transactions,
            (SELECT COUNT(*) FROM bulk_groups WHERE status = 'open') as active_groups,
            (SELECT COALESCE(SUM(total_price), 0) FROM transactions) as total_revenue
    """)
    
    result = db.execute(query).fetchone()
    
    return {
        "total_users": result.total_users,
        "total_products": result.total_products,
        "total_transactions": result.total_transactions,
        "active_groups": result.active_groups,
        "total_revenue": float(result.total_revenue),
        "total_savings": 0.0,  # From evaluation
        "avg_group_size": 0.0,
        "group_success_rate": 0.0
    }


@app.post("/api/admin/generate-synthetic-data")
async def generate_synthetic_data(
    request: SyntheticDataRequest,
    current_user: dict = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    """Generate synthetic data (admin only)."""
    if not current_user.get('is_admin'):
        raise HTTPException(status_code=403, detail="Admin access required")
    
    logger.info(f"Generating synthetic data: {request}")
    
    generator = SyntheticDataGenerator(seed=request.seed or 42)
    
    # Get existing products
    products_query = text("SELECT * FROM products WHERE is_active = TRUE")
    products = [dict(row._mapping) for row in db.execute(products_query)]
    
    if not products:
        raise HTTPException(status_code=400, detail="No products found. Add products first.")
    
    # Generate data
    users = generator.generate_users(request.num_users)
    transactions = generator.generate_transactions(users, products, request.num_transactions)
    groups = generator.generate_bulk_groups(users, products, request.num_groups)
    memberships = generator.generate_group_memberships(groups, users)
    features = generator.calculate_user_features(users, transactions)
    
    # Insert into database
    insert_synthetic_data_to_db(users, transactions, groups, memberships, features)
    
    return {
        "message": "Synthetic data generated successfully",
        "status": "success",
        "data": {
            "users": len(users),
            "transactions": len(transactions),
            "groups": len(groups),
            "memberships": len(memberships)
        }
    }


@app.get("/api/admin/evaluation")
async def get_evaluation_metrics(
    current_user: dict = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    """Get ML evaluation metrics (admin only)."""
    if not current_user.get('is_admin'):
        raise HTTPException(status_code=403, detail="Admin access required")
    
    metrics = evaluate_system(db)
    return metrics


@app.post("/api/admin/retrain-clustering")
async def retrain_clustering(
    current_user: dict = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    """Manually trigger clustering model retraining (admin only)."""
    if not current_user.get('is_admin'):
        raise HTTPException(status_code=403, detail="Admin access required")
    
    from celery_worker import retrain_clustering_model
    
    task = retrain_clustering_model.delay()
    
    return {
        "message": "Clustering retraining queued",
        "task_id": task.id
    }


if __name__ == "__main__":
    import uvicorn
    uvicorn.run(app, host="0.0.0.0", port=8000)
