
import uvicorn
import asyncio
import logging
import logging.config
import os
import time
import json
import re
from logging.config import dictConfig
from dotenv import load_dotenv

# Load environment variables FIRST, before any other imports
load_dotenv()

from fastapi import FastAPI, WebSocket, WebSocketDisconnect, Request, HTTPException
from fastapi.middleware.cors import CORSMiddleware
from fastapi.responses import JSONResponse
from db.database import engine, Base, SessionLocal
from authentication.auth import router as auth_router
from models.products import router as products_router
from models.groups import router as groups_router
from models.chat import router as chat_router
from ml.ml import router as ml_router
from models.admin import router as admin_router
from models.settings import router as settings_router
from models.supplier import router as supplier_router
from payment.payment_router import router as payment_router
from ml.ml_scheduler import scheduler, start_scheduler
from websocket.websocket_manager import manager
from analytics.analytics_router import router as analytics_router
from analytics.etl_pipeline import run_daily_analytics_scheduler
from gateway.gateway_router import router as gateway_router
from graphql.schema import app as graphql_app, ENABLE_GRAPHQL

# Centralized logging configuration
LOG_LEVEL = os.getenv("LOG_LEVEL", "INFO").upper()
# Ensure logs are stored in the project's `logs/` directory
LOG_DIR = os.path.join(os.path.dirname(__file__), "logs")
# Create logs directory if it doesn't exist (safe to call on every start)
os.makedirs(LOG_DIR, exist_ok=True)
LOG_FILE = os.path.join(LOG_DIR, "backend.log")

LOGGING_CONFIG = {
    "version": 1,
    "disable_existing_loggers": False,
    "formatters": {
        "default": {"format": "%(asctime)s %(levelname)s [%(name)s] %(message)s"},
        "detailed": {"format": "%(asctime)s %(levelname)s [%(name)s:%(lineno)d] %(message)s"}
    },
    "handlers": {
        "console": {
            "class": "logging.StreamHandler",
            "level": LOG_LEVEL,
            "formatter": "default",
            "stream": "ext://sys.stdout"
        },
        "file": {
            "class": "logging.handlers.RotatingFileHandler",
            "level": LOG_LEVEL,
            "formatter": "detailed",
            "filename": LOG_FILE,
            "maxBytes": 5 * 1024 * 1024,
            "backupCount": 5,
            "encoding": "utf8"
        }
    },
    "root": {"level": LOG_LEVEL, "handlers": ["console", "file"]},
    "loggers": {
        "uvicorn": {"level": "INFO", "handlers": ["console"], "propagate": False},
        "sqlalchemy": {"level": "WARN", "handlers": ["console"], "propagate": False}
    }
}

dictConfig(LOGGING_CONFIG)
logger = logging.getLogger(__name__)

# Initialize FastAPI app
app = FastAPI(
    title="Group-Buy System API",
    description="""
    # AI-Driven Group-Buy Recommendation Platform for Informal Traders

    This API powers a comprehensive group-buy system designed for informal traders in markets like Mbare, Harare.

    ## Features

    * **Authentication**: JWT-based user authentication for traders and admins
    * **Product Management**: CRUD operations for market products
    * **Group-Buy Management**: Admin-created group buying opportunities
    * **AI Recommendations**: Hybrid ML model for personalized product recommendations
    * **Real-time Chat**: WebSocket-based communication between traders
    * **Admin Dashboard**: Comprehensive analytics and group management tools

    ## Authentication

    All API endpoints (except health checks) require JWT authentication.
    Include the token in the Authorization header: `Bearer <token>`

    ## API Endpoints

    * `GET /docs` - Interactive Swagger UI documentation
    * `GET /redoc` - Alternative ReDoc documentation
    * `GET /openapi.json` - OpenAPI JSON schema
    """,
    version="1.0.0",
    contact={
        "name": "Group-Buy System Support",
        "email": "support@groupbuy.com",
    },
    license_info={
        "name": "MIT",
    },
)

# ===== Security & CORS Configuration =====
def _parse_csv_env(name: str, default: str) -> list[str]:
    value = os.getenv(name, default)
    return [v.strip() for v in value.split(",") if v.strip()]

ALLOWED_ORIGINS = _parse_csv_env(
    "CORS_ALLOW_ORIGINS",
    "http://localhost:5173,http://localhost:3000,http://localhost:3001, https://connectsphere-p5t9.onrender.com"
)
ALLOW_METHODS = _parse_csv_env("CORS_ALLOW_METHODS", "*")
ALLOW_HEADERS = _parse_csv_env("CORS_ALLOW_HEADERS", "*")
ALLOW_CREDENTIALS = os.getenv("CORS_ALLOW_CREDENTIALS", "true").lower() == "true"

app.add_middleware(
    CORSMiddleware,
    allow_origins=ALLOWED_ORIGINS,
    allow_credentials=ALLOW_CREDENTIALS,
    allow_methods=ALLOW_METHODS,
    allow_headers=ALLOW_HEADERS,
)

# ===== Input Sanitization & Logging Middleware =====
SCRIPT_TAG_REGEX = re.compile(r"<\s*script[^>]*>(.*?)<\s*/\s*script\s*>", re.IGNORECASE | re.DOTALL)
EVENT_HANDLER_ATTR_REGEX = re.compile(r"on\w+\s*=\s*(['\"]).*?\1", re.IGNORECASE | re.DOTALL)

def sanitize_value(value):
    if isinstance(value, str):
        v = value.strip()
        # Remove script tags and inline event handlers
        v = SCRIPT_TAG_REGEX.sub("", v)
        v = EVENT_HANDLER_ATTR_REGEX.sub("", v)
        # Collapse overly long strings
        if len(v) > 10000:
            v = v[:10000]
        return v
    if isinstance(value, list):
        return [sanitize_value(x) for x in value]
    if isinstance(value, dict):
        return {sanitize_value(k): sanitize_value(v) for k, v in value.items()}
    return value

@app.middleware("http")
async def security_logging_middleware(request: Request, call_next):
    start_time = time.time()

    # Sanitize JSON body (only if small enough to buffer)
    body_bytes = b""
    content_type = request.headers.get("content-type", "")
    if "application/json" in content_type:
        try:
            body_bytes = await request.body()
            if 0 < len(body_bytes) <= 1024 * 1024:
                raw = json.loads(body_bytes.decode("utf-8"))
                cleaned = sanitize_value(raw)
                body_bytes = json.dumps(cleaned).encode("utf-8")
                async def receive():
                    return {"type": "http.request", "body": body_bytes, "more_body": False}
                request._receive = receive  # FastAPI/Starlette internal contract
        except Exception:
            # If parsing fails, proceed without modification
            pass

    # Request logging (skip health)
    path = request.url.path
    method = request.method
    client = request.client.host if request.client else "unknown"

    try:
        response = await call_next(request)
    except HTTPException as http_exc:
        process_ms = int((time.time() - start_time) * 1000)
        logger.warning(f"{client} {method} {path} -> {http_exc.status_code} ({process_ms}ms)")
        raise
    except Exception as exc:
        process_ms = int((time.time() - start_time) * 1000)
        logger.exception(f"{client} {method} {path} -> 500 ({process_ms}ms)")
        return JSONResponse(status_code=500, content={"detail": "Internal Server Error"})

    process_ms = int((time.time() - start_time) * 1000)
    if path != "/health":
        logger.info(f"{client} {method} {path} -> {response.status_code} ({process_ms}ms)")

    # Add secure headers
    response.headers.setdefault("X-Content-Type-Options", "nosniff")
    response.headers.setdefault("X-Frame-Options", "DENY")
    # CSP kept minimal to avoid breaking UI; consider tightening in prod
    response.headers.setdefault("Referrer-Policy", "no-referrer")

    return response

# ===== Consistent Error Responses =====
@app.exception_handler(HTTPException)
async def http_exception_handler(request: Request, exc: HTTPException):
    return JSONResponse(
        status_code=exc.status_code,
        content={
            "detail": exc.detail if isinstance(exc.detail, str) else "Request failed",
            "path": request.url.path
        },
    )

@app.exception_handler(Exception)
async def unhandled_exception_handler(request: Request, exc: Exception):
    logger.exception(f"Unhandled error on {request.method} {request.url.path}: {exc}")
    return JSONResponse(status_code=500, content={"detail": "Internal Server Error"})

# ===== Simple Rate Limiting (per IP) =====
RATE_LIMIT_PER_MIN = int(os.getenv("RATE_LIMIT_PER_MIN", "60"))
RATE_LIMIT_BURST = int(os.getenv("RATE_LIMIT_BURST", "120"))
_rate_buckets: dict[str, list[float]] = {}

@app.middleware("http")
async def rate_limit_middleware(request: Request, call_next):
    # Allow websockets and health, and internal scheduler
    if request.url.path.startswith("/ws") or request.url.path == "/health":
        return await call_next(request)

    client_ip = request.client.host if request.client else "unknown"
    now = time.time()
    window_start = now - 60.0

    bucket = _rate_buckets.get(client_ip, [])
    # Drop requests older than 60s window
    bucket = [t for t in bucket if t >= window_start]

    if len(bucket) >= max(RATE_LIMIT_PER_MIN, RATE_LIMIT_BURST):
        return JSONResponse(status_code=429, content={"detail": "Too Many Requests"})

    bucket.append(now)
    _rate_buckets[client_ip] = bucket
    return await call_next(request)

# Startup event - auto-train models if needed and start scheduler
@app.on_event("startup")
async def startup_event():
    """Initialize HYBRID models on startup and start daily retraining scheduler"""
    db = SessionLocal()
    try:
        # Basic environment sanity checks
        required_env = ["SECRET_KEY"]
        missing = [k for k in required_env if not os.getenv(k)]
        if missing:
            logger.warning(f"Missing required env vars: {', '.join(missing)}")
        for k in ["FLUTTERWAVE_PUBLIC_KEY", "FLUTTERWAVE_SECRET_KEY", "FLUTTERWAVE_ENCRYPTION_KEY"]:
            if not os.getenv(k):
                logger.info(f"Payment env {k} not set; payment features may be limited in this environment")

        from models.models import MLModel, Transaction, User, Product
        from ml.ml import train_clustering_model_with_progress, load_models
        
        logger.info("\n" + "="*60)
        logger.info(">> Hybrid Recommender System Initialization")
        logger.info("="*60)
        
        # Check if we have products
        product_count = db.query(Product).count()
        logger.info(f"\n[Products] Products in database: {product_count}")
        
        if product_count < 5:
            logger.warning("  Not enough products! Please seed Mbare products first.")
            logger.info("   Run: python backend/update_mbare_prices.py")
            return
        
        # Check if we have traders
        trader_count = db.query(User).filter(~User.is_admin).count()
        transaction_count = db.query(Transaction).count()
        
        logger.info(f"[Traders] Traders in database: {trader_count}")
        logger.info(f"[Transactions] Transactions in database: {transaction_count}")
        
        # Auto-seed if database is empty
        if trader_count < 10 or transaction_count < 20:
            logger.info("\n[Seeding] Database needs seeding for hybrid recommender...")
            logger.info("   Run: python backend/seed_mbare_data.py")
            logger.info("   This will create 100 realistic Mbare traders with 12 weeks of transaction history")
        
        # Load hybrid recommender models
        logger.info("\n[Loading] Loading Hybrid Recommender Models...")
        load_models()
        logger.info("[Success] Models loaded successfully")
        
        # Check if we have a trained hybrid model
        latest_model = db.query(MLModel).filter(
            MLModel.model_type == "hybrid_recommender"
        ).order_by(MLModel.trained_at.desc()).first()
        
        # Auto-train if needed
        if not latest_model and transaction_count >= 10 and trader_count >= 4:
            logger.info("\n[Training] No trained hybrid model found. Auto-training with database data...")
            try:
                # train_clustering_model_with_progress is an async coroutine; await it in the startup event
                training_results = await train_clustering_model_with_progress(db)
                logger.info("[Success] Hybrid models trained successfully on startup!")
                logger.info(f"   - Silhouette Score: {training_results['silhouette_score']:.3f}")
                logger.info(f"   - Clusters: {training_results['n_clusters']}")
                logger.info(f"   - NMF Rank: {training_results.get('nmf_rank', 'N/A')}")
                logger.info(f"   - TF-IDF Vocabulary: {training_results.get('tfidf_vocab_size', 'N/A')}")

                # Reload models
                load_models()
            except Exception as e:
                logger.warning(f"  Warning: Auto-training failed: {e}")
                logger.info("   Models can be trained manually via: POST /api/ml/retrain")
        elif latest_model:
            score = latest_model.metrics.get('silhouette_score', 0)
            logger.info("\n[Success] Loaded existing hybrid model")
            logger.info(f"   - Trained at: {latest_model.trained_at}")
            logger.info(f"   - Silhouette Score: {score:.3f}")
            logger.info(f"   - Clusters: {latest_model.metrics.get('n_clusters', 'N/A')}")
            logger.info(f"   - NMF Rank: {latest_model.metrics.get('nmf_rank', 'N/A')}")
            logger.info(f"   - Model Type: {latest_model.model_type}")
        else:
            logger.warning("\n  Not enough data for hybrid training yet")
            logger.info("   Need: >=10 transactions, >=4 traders, >=5 products")
            logger.info(f"   Have: {transaction_count} transactions, {trader_count} traders, {product_count} products")
        
        # Start the daily retraining scheduler
        logger.info("\n[Scheduler] Starting Hybrid Recommender Auto-Retraining Scheduler...")
        logger.info("   - Frequency: Every 24 hours")
        logger.info("   - Strategy: Keep only best performing models")
        logger.info("   - Minimum new data: 5 transactions")
        logger.info("   - Data source: Live database (no synthetic data)")
        asyncio.create_task(start_scheduler())
        logger.info("[Success] Scheduler started successfully")

        # Start analytics ETL scheduler
        asyncio.create_task(run_daily_analytics_scheduler())
        logger.info("[Success] Analytics ETL scheduler started")
        logger.info("="*60 + "\n")
        
    except Exception as e:
        logger.error(f"  Startup ML check failed: {e}")
        import traceback
        traceback.print_exc()
    finally:
        db.close()

@app.on_event("shutdown")
async def shutdown_event():
    """Stop the scheduler on shutdown"""
    logger.info("\n[Shutdown] Stopping ML scheduler...")
    await scheduler.stop()

# WebSocket endpoint for ML training progress
@app.websocket("/ws/ml-training")
async def ml_training_websocket(websocket: WebSocket):
    # For now, connect without user authentication for ML training
    await manager.connect(websocket, user_id=0)  # Use 0 for anonymous/system connections
    try:
        while True:
            # Keep connection alive, wait for client messages if needed
            data = await websocket.receive_text()
            # Echo back for connection health
            await websocket.send_text(f"Connected: {data}")
    except WebSocketDisconnect:
        manager.disconnect(websocket)

# WebSocket endpoint for real-time QR status updates
@app.websocket("/ws/qr-updates")
async def qr_updates_websocket(websocket: WebSocket, token: str = None):
    """WebSocket endpoint for real-time QR status updates"""
    from authentication.auth import verify_token_string
    from db.database import get_db

    # Authenticate user
    db = next(get_db())
    try:
        user = verify_token_string(token, db) if token else None
        if not user:
            await websocket.close(code=1008)  # Policy violation
            return
    except Exception as e:
        print(f"WebSocket auth error: {e}")
        await websocket.close(code=1008)  # Policy violation
        return

    # Connect with user ID for targeted broadcasts
    await manager.connect(websocket, user.id)
    try:
        while True:
            # Keep connection alive
            await websocket.receive_text()
    except WebSocketDisconnect:
        manager.disconnect(websocket)

# Health check endpoint
@app.get("/health")
async def health_check():
    """Basic health check endpoint"""
    return {"status": "healthy", "service": "group-buy-api"}

# Include routers
app.include_router(auth_router, prefix="/api/auth", tags=["Authentication"])
app.include_router(products_router, prefix="/api/products", tags=["Products"])
app.include_router(groups_router, prefix="/api/groups", tags=["Group-Buys"])
app.include_router(chat_router, prefix="/api/chat", tags=["Chat"])
app.include_router(ml_router, prefix="/api/ml", tags=["Machine Learning"])
app.include_router(admin_router, prefix="/api/admin", tags=["Admin"])
app.include_router(settings_router, prefix="/api/settings", tags=["Settings"])
app.include_router(supplier_router, prefix="/api/supplier", tags=["Supplier"])
app.include_router(payment_router, prefix="/api/payment", tags=["Payment"])
app.include_router(analytics_router)
app.include_router(gateway_router)

# Basic metrics endpoint for lightweight monitoring
@app.get("/metrics")
async def metrics():
    try:
        db = SessionLocal()
        from sqlalchemy import func
        from models.models import User, GroupBuy, Transaction
        users = db.query(func.count(User.id)).scalar()
        groups = db.query(func.count(GroupBuy.id)).scalar()
        txs = db.query(func.count(Transaction.id)).scalar()
        return {
            "users_total": users or 0,
            "groups_total": groups or 0,
            "transactions_total": txs or 0
        }
    except Exception:
        return {"users_total": 0, "groups_total": 0, "transactions_total": 0}
    finally:
        try:
            db.close()
        except Exception:
            pass

if __name__ == "__main__":
    print("DEBUG: Starting server with updated code...")
    uvicorn.run("main:app", host="0.0.0.0", port=8000, reload=True)

# Conditionally mount GraphQL
if ENABLE_GRAPHQL and graphql_app:
    from fastapi import APIRouter
    gql_router = APIRouter()
    app.mount("/graphql", graphql_app)
