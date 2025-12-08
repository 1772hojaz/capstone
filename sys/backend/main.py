#!/usr/bin/env python3
import uvicorn
import asyncio
import logging
import logging.config
import os
from logging.config import dictConfig
from dotenv import load_dotenv

# Load environment variables FIRST, before any other imports
load_dotenv()

from fastapi import FastAPI, WebSocket, WebSocketDisconnect
from fastapi.middleware.cors import CORSMiddleware
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

# Create database tables
Base.metadata.create_all(bind=engine)

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

# CORS middleware
app.add_middleware(
    CORSMiddleware,
    allow_origins=["http://localhost:3000","http://connectsphere-p5t9.onrender.com","https://connectsphere-p5t9.onrender.com", "http://localhost:3001", "http://localhost:5173"],  # React dev server (Vite default)
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# Startup event - auto-train models if needed and start scheduler
@app.on_event("startup")
async def startup_event():
    """Initialize HYBRID models on startup and start daily retraining scheduler"""
    db = SessionLocal()
    try:
        from models.models import MLModel, Transaction, User, Product
        from ml.ml import train_clustering_model_with_progress, load_models

        print("\n" + "="*60)
        print("🚀 Hybrid Recommender System Initialization")
        print("="*60)

        # Check if we have products
        product_count = db.query(Product).count()
        print(f"\n📦 Products in database: {product_count}")

        if product_count < 5:
            print("⚠️  Not enough products! Please seed Mbare products first.")
            print("   Run: python backend/update_mbare_prices.py")
            return

        # Check if we have traders
        trader_count = db.query(User).filter(~User.is_admin).count()
        transaction_count = db.query(Transaction).count()

        print(f"👥 Traders in database: {trader_count}")
        print(f"💳 Transactions in database: {transaction_count}")

        # Auto-seed if database is empty
        if trader_count < 10 or transaction_count < 20:
            print("\n🌾 Database needs seeding for hybrid recommender...")
            print("   Run: python backend/seed_mbare_data.py")
            print("   This will create 100 realistic Mbare traders with 12 weeks of transaction history")

        # Load hybrid recommender models
        print("\n📦 Loading Hybrid Recommender Models...")
        load_models()
        print("✅ Models loaded successfully")

        # Check if we have a trained hybrid model
        latest_model = db.query(MLModel).filter(
            MLModel.model_type == "hybrid_recommender"
        ).order_by(MLModel.trained_at.desc()).first()

        # Auto-train if needed
        if not latest_model and transaction_count >= 10 and trader_count >= 4:
            print("\n🤖 No trained hybrid model found. Auto-training with database data...")
            try:
                # train_clustering_model_with_progress is an async coroutine; await it in the startup event
                training_results = await train_clustering_model_with_progress(db)
                print("✅ Hybrid models trained successfully on startup!")
                print(f"   - Silhouette Score: {training_results['silhouette_score']:.3f}")
                print(f"   - Clusters: {training_results['n_clusters']}")
                print(f"   - NMF Rank: {training_results.get('nmf_rank', 'N/A')}")
                print(f"   - TF-IDF Vocabulary: {training_results.get('tfidf_vocab_size', 'N/A')}")

                # Reload models
                load_models()
            except Exception as e:
                print(f"⚠️  Warning: Auto-training failed: {e}")
                print("   Models can be trained manually via: POST /api/ml/retrain")
        elif latest_model:
            score = latest_model.metrics.get('silhouette_score', 0)
            print("\n✅ Loaded existing hybrid model")
            print(f"   - Trained at: {latest_model.trained_at}")
            print(f"   - Silhouette Score: {score:.3f}")
            print(f"   - Clusters: {latest_model.metrics.get('n_clusters', 'N/A')}")
            print(f"   - NMF Rank: {latest_model.metrics.get('nmf_rank', 'N/A')}")
            print(f"   - Model Type: {latest_model.model_type}")
        else:
            print("\n⚠️  Not enough data for hybrid training yet")
            print("   Need: ≥10 transactions, ≥4 traders, ≥5 products")
            print(f"   Have: {transaction_count} transactions, {trader_count} traders, {product_count} products")

        # Start the daily retraining scheduler
        print("\n🔄 Starting Hybrid Recommender Auto-Retraining Scheduler...")
        print("   - Frequency: Every 24 hours")
        print("   - Strategy: Keep only best performing models")
        print("   - Minimum new data: 5 transactions")
        print("   - Data source: Live database (no synthetic data)")
        asyncio.create_task(start_scheduler())
        print("✅ Scheduler started successfully")
        print("="*60 + "\n")

    except Exception as e:
        print(f"⚠️  Startup ML check failed: {e}")
        import traceback
        traceback.print_exc()
    finally:
        db.close()

@app.on_event("shutdown")
async def shutdown_event():
    """Stop the scheduler on shutdown"""
    print("\n🛑 Stopping ML scheduler...")
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

# Only used for development. Disabled in production.
if __name__ == "__main__":
    uvicorn.run("main:app", host="0.0.0.0", port=8000)
