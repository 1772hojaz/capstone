from fastapi import APIRouter, Depends, HTTPException, status, BackgroundTasks
from sqlalchemy.orm import Session
from sqlalchemy import func
from pydantic import BaseModel
from typing import List, Optional
from datetime import datetime
import numpy as np
import pandas as pd
import joblib
import json
import os
from sklearn.cluster import KMeans
from sklearn.metrics import silhouette_score
from sklearn.preprocessing import MinMaxScaler
from sklearn.feature_extraction.text import TfidfVectorizer
from sklearn.decomposition import NMF
# import shap  # Temporarily disabled due to llvmlite compatibility issue
from database import get_db
from models import User, GroupBuy, Transaction, Product, MLModel
from auth import verify_token

router = APIRouter()

# Configuration - Use absolute path or detect based on working directory
if os.path.exists("backend/ml_models"):
    MODEL_DIR = "backend/ml_models"  # Running from project root
elif os.path.exists("ml_models"):
    MODEL_DIR = "ml_models"  # Running from backend directory
else:
    # Create in backend directory
    MODEL_DIR = os.path.join(os.path.dirname(__file__), "ml_models")
    
os.makedirs(MODEL_DIR, exist_ok=True)

# Global model cache - Hybrid Recommender Components
clustering_model = None
nmf_model = None
tfidf_model = None
scaler = None
feature_store = None

# Hybrid model weights (CF, CBF, Popularity Boost)
ALPHA, BETA, GAMMA = 0.6, 0.4, 0.1

# Pydantic Models
class MLScores(BaseModel):
    collaborative_filtering: float
    content_based: float
    popularity: float
    hybrid: float

class RecommendationResponse(BaseModel):
    group_buy_id: int
    product_id: int
    product_name: str
    product_image_url: Optional[str]
    unit_price: float
    bulk_price: float
    moq: int
    savings_factor: float
    savings: float
    location_zone: str
    deadline: datetime
    total_quantity: int
    moq_progress: float
    participants_count: int
    recommendation_score: float
    reason: str
    ml_scores: Optional[MLScores] = None

class ClusterInfo(BaseModel):
    cluster_id: int
    size: int
    avg_quantity: float
    avg_contribution: float
    dominant_location: str

class RetrainingStatus(BaseModel):
    status: str
    silhouette_score: Optional[float] = None
    n_clusters: Optional[int] = None
    message: str
    training_details: Optional[dict] = None

class TrainingVisualization(BaseModel):
    silhouette_scores: List[float]
    cluster_range: List[int]
    optimal_k: int
    cluster_sizes: List[int]
    cluster_centers: List[List[float]]
    feature_names: List[str]
    inertia_scores: List[float]

# Helper Functions
def load_models():
    """Load trained ML models from disk (Hybrid Recommender)"""
    global clustering_model, nmf_model, tfidf_model, scaler, feature_store
    
    try:
        clustering_path = os.path.join(MODEL_DIR, "clustering_model.pkl")
        nmf_path = os.path.join(MODEL_DIR, "nmf_model.pkl")
        tfidf_path = os.path.join(MODEL_DIR, "tfidf.pkl")
        scaler_path = os.path.join(MODEL_DIR, "scaler.pkl")
        feature_store_path = os.path.join(MODEL_DIR, "feature_store.json")
        
        if os.path.exists(clustering_path):
            clustering_model = joblib.load(clustering_path)
            print("✓ Loaded clustering_model.pkl")
        
        if os.path.exists(nmf_path):
            nmf_model = joblib.load(nmf_path)
            print("✓ Loaded nmf_model.pkl (Collaborative Filtering)")
            
        if os.path.exists(tfidf_path):
            tfidf_model = joblib.load(tfidf_path)
            print("✓ Loaded tfidf.pkl (Content-Based Filtering)")
        
        if os.path.exists(scaler_path):
            scaler = joblib.load(scaler_path)
            print("✓ Loaded scaler.pkl")
            
        if os.path.exists(feature_store_path):
            with open(feature_store_path, 'r') as f:
                feature_store = json.load(f)
            print("✓ Loaded feature_store.json")
    except Exception as e:
        print(f"⚠️  Error loading models: {e}")

def train_clustering_model(db: Session):
    """Train hybrid recommender system from DATABASE: Clustering + NMF + TF-IDF"""
    global clustering_model, nmf_model, tfidf_model, scaler, feature_store
    
    print("\n" + "="*60)
    print("🚀 Training Hybrid Recommender from Database")
    print("="*60)
    
    # Get all products for content-based filtering
    products = db.query(Product).all()
    if len(products) < 5:
        raise ValueError(f"Not enough products for training (minimum 5 required, found {len(products)})")
    
    print(f"📦 Products: {len(products)}")
    
    # Build product DataFrame
    prod_data = []
    for p in products:
        prod_data.append({
            'product_id': p.id,
            'product_name': p.name,
            'description': p.description or '',
            'category': p.category or 'general',
            'unit_price': p.unit_price,
            'bulk_price': p.bulk_price
        })
    prod_df = pd.DataFrame(prod_data)
    
    # Get transaction data for all users
    transactions = db.query(Transaction).all()
    if len(transactions) < 10:
        raise ValueError(f"Not enough transactions for training (minimum 10 required, found {len(transactions)})")
    
    users = db.query(User).filter(~User.is_admin).all()
    if len(users) < 4:
        raise ValueError(f"Not enough users for clustering (minimum 4 required, found {len(users)})")
    
    user_ids = [u.id for u in users]
    n_users = len(user_ids)
    n_products = len(products)
    product_ids = [p.id for p in products]
    
    print(f"👥 Traders: {n_users}")
    print(f"💳 Transactions: {len(transactions)}")
    print(f"   Avg per trader: {len(transactions) / n_users:.1f}")
    
    # === STEP 1: Build User-Product Matrix from DATABASE ===
    print(f"\n1️⃣  Building User-Product Matrix from DB transactions...")
    user_product_matrix = np.zeros((n_users, n_products))
    
    for tx in transactions:
        try:
            if tx.user_id not in user_ids:
                continue  # Skip non-trader users
            user_idx = user_ids.index(tx.user_id)
            
            if tx.product_id not in product_ids:
                continue  # Skip products not in current catalog
            prod_idx = product_ids.index(tx.product_id)
            
            user_product_matrix[user_idx, prod_idx] += tx.quantity
        except (ValueError, IndexError) as e:
            continue
    
    sparsity = (user_product_matrix == 0).sum() / user_product_matrix.size * 100
    print(f"   Matrix shape: {user_product_matrix.shape}")
    print(f"   Sparsity: {sparsity:.1f}%")
    print(f"   Total interactions: {(user_product_matrix > 0).sum()}")
    
    # === STEP 2: Clustering (for group formation) ===
    scaler = MinMaxScaler()
    mat_scaled = scaler.fit_transform(user_product_matrix)
    
    # Determine optimal clusters
    silhouette_scores = []
    inertia_scores = []
    K_range = range(2, min(9, n_users // 2 + 1))
    best_k, best_score = 4, -1
    
    for k in K_range:
        km = KMeans(n_clusters=k, init="k-means++", n_init=10, random_state=42)
        labels = km.fit_predict(mat_scaled)
        if len(set(labels)) > 1:
            score = silhouette_score(mat_scaled, labels)
            silhouette_scores.append(score)
            inertia_scores.append(km.inertia_)
            if score > best_score:
                best_k, best_score = k, score
    
    # Train final clustering model
    clustering_model = KMeans(n_clusters=best_k, init="k-means++", n_init=10, random_state=42)
    clustering_model.fit(mat_scaled)
    
    # Update user clusters
    for idx, user_id in enumerate(user_ids):
        user = db.query(User).filter(User.id == user_id).first()
        if user:
            user.cluster_id = int(clustering_model.labels_[idx])
    
    unique, counts = np.unique(clustering_model.labels_, return_counts=True)
    cluster_sizes = counts.tolist()
    
    print(f"✓ Clustering: {best_k} clusters, silhouette={best_score:.4f}")
    
    # === STEP 3: Collaborative Filtering (NMF) ===
    rank = min(8, min(user_product_matrix.shape) - 1)
    nmf_model = NMF(n_components=rank, init="nndsvda", random_state=42, max_iter=500)
    W = nmf_model.fit_transform(np.maximum(user_product_matrix, 0))
    H = nmf_model.components_
    R_hat_cf = np.dot(W, H)
    
    print(f"✓ NMF (CF): rank={rank}, reconstruction_error={nmf_model.reconstruction_err_:.4f}")
    
    # === STEP 4: Content-Based Filtering (TF-IDF) ===
    prod_text = (prod_df['product_name'] + ' ' + prod_df['description'] + ' ' + prod_df['category']).values
    tfidf_model = TfidfVectorizer()
    X_tfidf = tfidf_model.fit_transform(prod_text)
    
    # Build trader profiles
    trader_profiles = np.dot(user_product_matrix, X_tfidf.toarray())
    norms = np.linalg.norm(trader_profiles, axis=1, keepdims=True) + 1e-9
    trader_profiles_norm = trader_profiles / norms
    
    prod_norms = np.linalg.norm(X_tfidf.toarray(), axis=1, keepdims=True) + 1e-9
    prod_vecs_norm = X_tfidf.toarray() / prod_norms
    
    R_hat_cbf = np.dot(trader_profiles_norm, prod_vecs_norm.T)
    
    print(f"✓ TF-IDF (CBF): vocabulary_size={len(tfidf_model.vocabulary_)}")
    
    # === STEP 5: Popularity Boost ===
    product_popularity = user_product_matrix.sum(axis=0)
    pop_min, pop_max = product_popularity.min(), product_popularity.max()
    if pop_max > pop_min:
        pop_norm = (product_popularity - pop_min) / (pop_max - pop_min)
    else:
        pop_norm = product_popularity * 0
    boost = np.tile(pop_norm.reshape(1, -1), (n_users, 1))
    
    print(f"✓ Popularity boost: range=[{product_popularity.min():.0f}, {product_popularity.max():.0f}]")
    
    # === STEP 6: Hybrid Fusion ===
    # R_hybrid = alpha * CF + beta * CBF + gamma * Boost
    # This is saved in memory and used during recommendations
    
    # === STEP 7: Save Models ===
    joblib.dump(clustering_model, os.path.join(MODEL_DIR, "clustering_model.pkl"))
    joblib.dump(nmf_model, os.path.join(MODEL_DIR, "nmf_model.pkl"))
    joblib.dump(tfidf_model, os.path.join(MODEL_DIR, "tfidf.pkl"))
    joblib.dump(scaler, os.path.join(MODEL_DIR, "scaler.pkl"))
    
    # Save feature store
    feature_store = {
        "product_id_to_name": {int(p.id): p.name for p in products},
        "product_categories": {int(p.id): p.category or 'general' for p in products},
        "cluster_of_trader": {int(uid): int(clustering_model.labels_[idx]) for idx, uid in enumerate(user_ids)},
        "alpha_beta_gamma": [ALPHA, BETA, GAMMA],
        "n_traders": n_users,
        "n_products": n_products,
        "n_clusters": best_k,
        "silhouette_score": float(best_score),
        "user_ids": user_ids,
        "product_ids": [int(p.id) for p in products]
    }
    
    with open(os.path.join(MODEL_DIR, "feature_store.json"), 'w') as f:
        json.dump(feature_store, f, indent=2)
    
    print("✓ Saved: clustering_model.pkl, nmf_model.pkl, tfidf.pkl, scaler.pkl, feature_store.json")
    
    db.commit()
    
    # Create meaningful feature names (top products by popularity for visualization)
    # Limit to top 20 most popular products for cleaner radar charts
    product_popularity = user_product_matrix.sum(axis=0)
    top_product_indices = np.argsort(product_popularity)[::-1][:min(20, n_products)]
    feature_names_for_viz = [products[idx].name for idx in top_product_indices]
    
    # Extract cluster centers for only these top features
    cluster_centers_viz = clustering_model.cluster_centers_[:, top_product_indices].tolist()
    
    # Save model metadata
    ml_model = MLModel(
        model_type="hybrid_recommender",
        model_path=MODEL_DIR,
        metrics={
            "silhouette_score": float(best_score),
            "n_clusters": int(best_k),
            "silhouette_scores": [float(s) for s in silhouette_scores],
            "inertia_scores": [float(i) for i in inertia_scores],
            "cluster_range": list(K_range),
            "cluster_sizes": cluster_sizes,
            "cluster_centers": cluster_centers_viz,
            "feature_names": feature_names_for_viz,
            "nmf_rank": rank,
            "nmf_reconstruction_error": float(nmf_model.reconstruction_err_),
            "tfidf_vocab_size": len(tfidf_model.vocabulary_),
            "hybrid_weights": {"alpha": ALPHA, "beta": BETA, "gamma": GAMMA}
        }
    )
    db.add(ml_model)
    db.commit()
    
    return {
        "silhouette_score": best_score,
        "n_clusters": best_k,
        "silhouette_scores": silhouette_scores,
        "inertia_scores": inertia_scores,
        "cluster_range": list(K_range),
        "cluster_sizes": cluster_sizes,
        "cluster_centers": cluster_centers_viz,
        "feature_names": feature_names_for_viz,
        "nmf_rank": rank,
        "tfidf_vocab_size": len(tfidf_model.vocabulary_),
        "model_type": "hybrid_recommender"
    }

def get_recommendations_for_user(user: User, db: Session) -> List[dict]:
    """Generate recommendations using Hybrid Recommender (NMF + TF-IDF + Clustering)"""
    global nmf_model, tfidf_model, clustering_model, scaler, feature_store
    
    # Get active group-buys in user's location
    active_groups = db.query(GroupBuy).filter(
        GroupBuy.location_zone == user.location_zone,
        GroupBuy.status == "active",
        GroupBuy.deadline > datetime.utcnow()
    ).all()
    
    if not active_groups:
        return []
    
    # If models aren't loaded, fall back to simple recommendations
    if not all([nmf_model, tfidf_model, clustering_model, scaler, feature_store]):
        print("⚠️  Hybrid models not loaded, using simple recommendations")
        return get_simple_recommendations(user, db, active_groups)
    
    try:
        # Get all users and products for matrix indexing
        user_ids = feature_store.get('user_ids', [])
        product_ids = feature_store.get('product_ids', [])
        
        if user.id not in user_ids:
            print(f"⚠️  User {user.id} not in training data, using simple recommendations")
            return get_simple_recommendations(user, db, active_groups)
        
        user_idx = user_ids.index(user.id)
        n_users = len(user_ids)
        n_products = len(product_ids)
        
        # Rebuild user-product matrix for this user
        transactions = db.query(Transaction).filter(Transaction.user_id == user.id).all()
        user_vector = np.zeros(n_products)
        for tx in transactions:
            try:
                prod_idx = product_ids.index(tx.product_id)
                user_vector[prod_idx] += tx.quantity
            except ValueError:
                continue
        
        # === HYBRID SCORING ===
        # 1. Collaborative Filtering (NMF)
        W_user = nmf_model.transform(user_vector.reshape(1, -1))
        H = nmf_model.components_
        cf_scores = np.dot(W_user, H).flatten()
        
        # 2. Content-Based Filtering (TF-IDF)
        products = db.query(Product).filter(Product.id.in_(product_ids)).all()
        prod_texts = []
        for pid in product_ids:
            p = next((prod for prod in products if prod.id == pid), None)
            if p:
                text = f"{p.name} {p.description or ''} {p.category or 'general'}"
                prod_texts.append(text)
            else:
                prod_texts.append("")
        
        prod_tfidf = tfidf_model.transform(prod_texts)
        user_profile = user_vector @ prod_tfidf.toarray()
        user_norm = np.linalg.norm(user_profile) + 1e-9
        user_profile_norm = user_profile / user_norm
        
        prod_norms = np.linalg.norm(prod_tfidf.toarray(), axis=1, keepdims=True) + 1e-9
        prod_vecs_norm = prod_tfidf.toarray() / prod_norms
        
        cbf_scores = np.dot(user_profile_norm, prod_vecs_norm.T).flatten()
        
        # 3. Popularity Boost
        all_transactions = db.query(Transaction).all()
        product_popularity = np.zeros(n_products)
        for tx in all_transactions:
            try:
                prod_idx = product_ids.index(tx.product_id)
                product_popularity[prod_idx] += tx.quantity
            except ValueError:
                continue
        
        pop_min, pop_max = product_popularity.min(), product_popularity.max()
        if pop_max > pop_min:
            pop_norm = (product_popularity - pop_min) / (pop_max - pop_min)
        else:
            pop_norm = product_popularity * 0
        
        # 4. Hybrid Fusion
        hybrid_scores = ALPHA * cf_scores + BETA * cbf_scores + GAMMA * pop_norm
        
        # Normalize hybrid scores to 0-1 range
        if hybrid_scores.max() > hybrid_scores.min():
            hybrid_scores_norm = (hybrid_scores - hybrid_scores.min()) / (hybrid_scores.max() - hybrid_scores.min())
        else:
            hybrid_scores_norm = hybrid_scores * 0
        
        # Normalize individual component scores for display
        cf_min, cf_max = cf_scores.min(), cf_scores.max()
        if cf_max > cf_min:
            cf_scores_norm = (cf_scores - cf_min) / (cf_max - cf_min)
        else:
            cf_scores_norm = cf_scores * 0
        
        cbf_min, cbf_max = cbf_scores.min(), cbf_scores.max()
        if cbf_max > cbf_min:
            cbf_scores_norm = (cbf_scores - cbf_min) / (cbf_max - cbf_min)
        else:
            cbf_scores_norm = cbf_scores * 0
        
        # Score each group-buy
        recommendations = []
        seen_products = set(tx.product_id for tx in transactions)
        
        for gb in active_groups:
            try:
                prod_idx = product_ids.index(gb.product_id)
                base_score = hybrid_scores_norm[prod_idx]
                cf_score = cf_scores_norm[prod_idx]
                cbf_score = cbf_scores_norm[prod_idx]
                pop_score = pop_norm[prod_idx]
                
                # Start with normalized base score (0-1 range)
                score = float(base_score)
                
                # Build diverse explanations based on component scores
                reasons = []
                if gb.product_id in seen_products:
                    reasons.append("You've purchased this before")
                
                # Determine primary recommendation driver
                if cf_score > cbf_score and cf_score > pop_score:
                    if user.cluster_id is not None:
                        reasons.append(f"Popular with similar traders (Cluster {user.cluster_id})")
                elif cbf_score > cf_score and cbf_score > pop_score:
                    reasons.append(f"Matches your interests in {gb.product.category or 'this category'}")
                elif pop_score > 0.5:
                    reasons.append("High demand product across all traders")
                else:
                    reasons.append("AI-recommended based on purchase patterns")
                
                moq_progress = gb.moq_progress
                if moq_progress >= 75:
                    score += 0.1
                    reasons.append("Almost at target quantity")
                elif moq_progress >= 50:
                    score += 0.05
                
                days_remaining = (gb.deadline - datetime.utcnow()).days
                if days_remaining <= 3:
                    score += 0.05
                    reasons.append("Ending soon")
                
                savings = gb.product.savings_factor * 100
                if savings >= 20:
                    reasons.append(f"{savings:.0f}% savings")
                
                # Cap score to max 1.0
                score = min(score, 1.0)
                
                recommendations.append({
                    "group_buy_id": gb.id,
                    "product_id": gb.product_id,
                    "product_name": gb.product.name,
                    "product_image_url": gb.product.image_url,
                    "unit_price": gb.product.unit_price,
                    "bulk_price": gb.product.bulk_price,
                    "moq": gb.product.moq,
                    "savings_factor": gb.product.savings_factor,
                    "savings": savings,
                    "location_zone": gb.location_zone,
                    "deadline": gb.deadline,
                    "total_quantity": gb.total_quantity,
                    "moq_progress": moq_progress,
                    "participants_count": gb.participants_count,
                    "recommendation_score": score,
                    "reason": ", ".join(reasons) if reasons else "AI-recommended based on your preferences",
                    "ml_scores": {
                        "collaborative_filtering": float(cf_score),
                        "content_based": float(cbf_score),
                        "popularity": float(pop_score),
                        "hybrid": float(base_score)
                    }
                })
            except ValueError:
                continue
        
        # Sort by hybrid score
        recommendations.sort(key=lambda x: x["recommendation_score"], reverse=True)
        return recommendations[:10]
        
    except Exception as e:
        print(f"⚠️  Error in hybrid recommendations: {e}")
        return get_simple_recommendations(user, db, active_groups)

def get_simple_recommendations(user: User, db: Session, active_groups) -> List[dict]:
    """Fallback to simple rule-based recommendations"""
    user_transactions = db.query(Transaction).filter(Transaction.user_id == user.id).all()
    user_product_ids = set(t.product_id for t in user_transactions)
    
    cluster_product_ids = set()
    if user.cluster_id is not None:
        cluster_users = db.query(User).filter(
            User.cluster_id == user.cluster_id,
            User.id != user.id
        ).all()
        cluster_user_ids = [u.id for u in cluster_users]
        cluster_transactions = db.query(Transaction.product_id).filter(
            Transaction.user_id.in_(cluster_user_ids)
        ).all()
        cluster_product_ids = set(t.product_id for t in cluster_transactions)
    
    recommendations = []
    for gb in active_groups:
        score = 0.0
        reasons = []
        
        if gb.product_id in user_product_ids:
            score += 0.3
            reasons.append("You've purchased this before")
        
        if gb.product_id in cluster_product_ids:
            score += 0.3
            reasons.append("Popular in your group")
        
        moq_progress = gb.moq_progress
        if moq_progress >= 75:
            score += 0.2
            reasons.append("Almost at target quantity")
        elif moq_progress >= 50:
            score += 0.1
        
        days_remaining = (gb.deadline - datetime.utcnow()).days
        if days_remaining <= 3:
            score += 0.1
            reasons.append("Ending soon")
        
        savings = gb.product.savings_factor * 100
        if savings >= 20:
            score += 0.1
            reasons.append(f"{savings:.0f}% savings")
        
        if score > 0:
            recommendations.append({
                "group_buy_id": gb.id,
                "product_id": gb.product_id,
                "product_name": gb.product.name,
                "product_image_url": gb.product.image_url,
                "unit_price": gb.product.unit_price,
                "bulk_price": gb.product.bulk_price,
                "moq": gb.product.moq,
                "savings_factor": gb.product.savings_factor,
                "savings": savings,
                "location_zone": gb.location_zone,
                "deadline": gb.deadline,
                "total_quantity": gb.total_quantity,
                "moq_progress": moq_progress,
                "participants_count": gb.participants_count,
                "recommendation_score": score,
                "reason": ", ".join(reasons) if reasons else "Recommended for you"
            })
    
    recommendations.sort(key=lambda x: x["recommendation_score"], reverse=True)
    return recommendations[:10]

# Routes
@router.get("/recommendations", response_model=List[RecommendationResponse])
async def get_recommendations(
    user: User = Depends(verify_token),
    db: Session = Depends(get_db)
):
    """Get personalized recommendations for the current user"""
    from models import RecommendationEvent
    
    recommendations = get_recommendations_for_user(user, db)
    
    # Track that recommendations were shown
    for rec in recommendations:
        event = RecommendationEvent(
            user_id=user.id,
            group_buy_id=rec['group_buy_id'],
            recommendation_score=rec['recommendation_score'],
            recommendation_reasons=rec['reason'].split(', ') if rec.get('reason') else [],
            shown_at=datetime.utcnow()
        )
        db.add(event)
    
    if recommendations:
        db.commit()
    
    return recommendations

@router.get("/clusters", response_model=List[ClusterInfo])
async def get_clusters(
    admin = Depends(verify_token),
    db: Session = Depends(get_db)
):
    """Get cluster information (for admin/analysis)"""
    # Get cluster statistics
    cluster_stats = db.query(
        User.cluster_id,
        func.count(User.id).label('size')
    ).filter(
        User.cluster_id.isnot(None)
    ).group_by(User.cluster_id).all()
    
    result = []
    for stat in cluster_stats:
        # Get transaction stats for this cluster
        transactions = db.query(
            func.avg(Transaction.quantity).label('avg_quantity'),
            func.avg(Transaction.amount).label('avg_contribution'),
            Transaction.location_zone
        ).join(User).filter(
            User.cluster_id == stat.cluster_id
        ).group_by(Transaction.location_zone).first()
        
        if transactions:
            result.append(ClusterInfo(
                cluster_id=stat.cluster_id,
                size=stat.size,
                avg_quantity=float(transactions.avg_quantity or 0),
                avg_contribution=float(transactions.avg_contribution or 0),
                dominant_location=transactions.location_zone or "Unknown"
            ))
    
    return result

@router.post("/retrain", response_model=RetrainingStatus)
async def retrain_models(
    background_tasks: BackgroundTasks,
    admin = Depends(verify_token),
    db: Session = Depends(get_db)
):
    """Retrain ML models (Admin only)"""
    try:
        # Train clustering model
        training_results = train_clustering_model(db)
        
        return RetrainingStatus(
            status="success",
            silhouette_score=training_results["silhouette_score"],
            n_clusters=training_results["n_clusters"],
            message=f"Models retrained successfully. Silhouette score: {training_results['silhouette_score']:.3f}, Clusters: {training_results['n_clusters']}",
            training_details=training_results
        )
    except Exception as e:
        return RetrainingStatus(
            status="error",
            message=f"Error during retraining: {str(e)}"
        )

@router.get("/training-visualization", response_model=TrainingVisualization)
async def get_training_visualization(
    admin = Depends(verify_token),
    db: Session = Depends(get_db)
):
    """Get training visualization data for admin dashboard"""
    # Get latest model metrics
    latest_model = db.query(MLModel).filter(
        MLModel.model_type == "hybrid_recommender"
    ).order_by(MLModel.trained_at.desc()).first()
    
    if not latest_model or not latest_model.metrics:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="No trained model found. Please train the model first."
        )
    
    metrics = latest_model.metrics
    
    return TrainingVisualization(
        silhouette_scores=metrics.get("silhouette_scores", []),
        cluster_range=metrics.get("cluster_range", []),
        optimal_k=metrics.get("n_clusters", 0),
        cluster_sizes=metrics.get("cluster_sizes", []),
        cluster_centers=metrics.get("cluster_centers", []),
        feature_names=metrics.get("feature_names", []),
        inertia_scores=metrics.get("inertia_scores", [])
    )

@router.get("/recommendation-performance")
async def get_recommendation_performance(
    admin = Depends(verify_token),
    db: Session = Depends(get_db),
    days: int = 7
):
    """Get recommendation system performance metrics"""
    from models import RecommendationEvent
    from datetime import timedelta
    
    end_date = datetime.utcnow()
    start_date = end_date - timedelta(days=days)
    
    # Get all events in period
    events = db.query(RecommendationEvent).filter(
        RecommendationEvent.shown_at >= start_date
    ).all()
    
    if not events:
        return {
            "message": "No recommendation data available yet",
            "total_recommendations": 0,
            "click_through_rate": 0,
            "conversion_rate": 0
        }
    
    # Calculate overall metrics
    total_shown = len(events)
    total_clicks = sum(1 for e in events if e.clicked)
    total_joins = sum(1 for e in events if e.joined)
    
    ctr = (total_clicks / total_shown * 100) if total_shown > 0 else 0
    conversion = (total_joins / total_clicks * 100) if total_clicks > 0 else 0
    
    # Factor effectiveness analysis
    factors = {
        "Purchase History": 0,
        "Cluster Popularity": 0,
        "MOQ Progress": 0,
        "Deadline Proximity": 0,
        "High Savings": 0
    }
    factor_joins = {k: 0 for k in factors.keys()}
    
    for event in events:
        if event.recommendation_reasons:
            for reason in event.recommendation_reasons:
                if "purchased this before" in reason.lower():
                    factors["Purchase History"] += 1
                    if event.joined:
                        factor_joins["Purchase History"] += 1
                elif "popular in your group" in reason.lower():
                    factors["Cluster Popularity"] += 1
                    if event.joined:
                        factor_joins["Cluster Popularity"] += 1
                elif "target quantity" in reason.lower():
                    factors["MOQ Progress"] += 1
                    if event.joined:
                        factor_joins["MOQ Progress"] += 1
                elif "ending soon" in reason.lower():
                    factors["Deadline Proximity"] += 1
                    if event.joined:
                        factor_joins["Deadline Proximity"] += 1
                elif "savings" in reason.lower():
                    factors["High Savings"] += 1
                    if event.joined:
                        factor_joins["High Savings"] += 1
    
    factor_analysis = []
    for factor_name, count in factors.items():
        joins = factor_joins[factor_name]
        effectiveness = (joins / count * 100) if count > 0 else 0
        factor_analysis.append({
            "factor": factor_name,
            "times_used": count,
            "times_joined": joins,
            "effectiveness": round(effectiveness, 1)
        })
    
    # Daily trends
    daily_data = {}
    for i in range(days):
        date = start_date + timedelta(days=i)
        date_key = date.strftime("%Y-%m-%d")
        daily_data[date_key] = {"shown": 0, "clicks": 0, "joins": 0}
    
    for event in events:
        date_key = event.shown_at.strftime("%Y-%m-%d")
        if date_key in daily_data:
            daily_data[date_key]["shown"] += 1
            if event.clicked:
                daily_data[date_key]["clicks"] += 1
            if event.joined:
                daily_data[date_key]["joins"] += 1
    
    daily_labels = []
    daily_ctr = []
    daily_conversion = []
    daily_recommendations = []
    
    for date_key in sorted(daily_data.keys()):
        data = daily_data[date_key]
        daily_labels.append(date_key)
        daily_recommendations.append(data["shown"])
        daily_ctr.append(round((data["clicks"] / data["shown"] * 100) if data["shown"] > 0 else 0, 1))
        daily_conversion.append(round((data["joins"] / data["clicks"] * 100) if data["clicks"] > 0 else 0, 1))
    
    # Score distribution
    score_ranges = ["0.0-0.2", "0.2-0.4", "0.4-0.6", "0.6-0.8", "0.8-1.0"]
    score_distribution = [0, 0, 0, 0, 0]
    
    for event in events:
        score = event.recommendation_score
        if score < 0.2:
            score_distribution[0] += 1
        elif score < 0.4:
            score_distribution[1] += 1
        elif score < 0.6:
            score_distribution[2] += 1
        elif score < 0.8:
            score_distribution[3] += 1
        else:
            score_distribution[4] += 1
    
    return {
        "period_days": days,
        "total_recommendations": total_shown,
        "total_clicks": total_clicks,
        "total_joins": total_joins,
        "click_through_rate": round(ctr, 1),
        "conversion_rate": round(conversion, 1),
        "factor_analysis": factor_analysis,
        "daily_labels": daily_labels,
        "daily_ctr": daily_ctr,
        "daily_conversion": daily_conversion,
        "daily_recommendations": daily_recommendations,
        "score_ranges": score_ranges,
        "score_distribution": score_distribution
    }

@router.get("/health")
async def model_health_check():
    """Check health status of all ML models"""
    global clustering_model, nmf_model, tfidf_model, scaler, feature_store
    
    health = {
        "status": "healthy",
        "models_loaded": {
            "clustering": clustering_model is not None,
            "nmf_collaborative_filtering": nmf_model is not None,
            "tfidf_content_based": tfidf_model is not None,
            "scaler": scaler is not None,
            "feature_store": feature_store is not None
        },
        "model_details": {}
    }
    
    if clustering_model:
        health["model_details"]["clustering"] = {
            "n_clusters": int(clustering_model.n_clusters),
            "n_features": int(clustering_model.n_features_in_)
        }
    
    if nmf_model:
        health["model_details"]["nmf"] = {
            "n_components": int(nmf_model.n_components),
            "reconstruction_error": float(nmf_model.reconstruction_err_)
        }
    
    if tfidf_model:
        health["model_details"]["tfidf"] = {
            "vocabulary_size": len(tfidf_model.vocabulary_)
        }
    
    if feature_store:
        health["model_details"]["feature_store"] = {
            "n_traders": feature_store.get("n_traders", 0),
            "n_products": feature_store.get("n_products", 0),
            "n_clusters": feature_store.get("n_clusters", 0),
            "silhouette_score": feature_store.get("silhouette_score", 0),
            "hybrid_weights": feature_store.get("alpha_beta_gamma", [0.6, 0.4, 0.1])
        }
    
    all_loaded = all(health["models_loaded"].values())
    health["status"] = "healthy" if all_loaded else "partial"
    health["recommendation_mode"] = "hybrid" if all_loaded else "simple_fallback"
    
    return health

@router.get("/evaluation")
async def model_evaluation(
    user = Depends(verify_token),
    db: Session = Depends(get_db)
):
    """Get comprehensive model evaluation metrics"""
    global clustering_model, nmf_model, tfidf_model, feature_store
    
    if not all([clustering_model, nmf_model, tfidf_model, feature_store]):
        raise HTTPException(
            status_code=status.HTTP_503_SERVICE_UNAVAILABLE,
            detail="Models not fully loaded"
        )
    
    # Get latest model metadata
    latest_model = db.query(MLModel).filter(
        MLModel.model_type == "hybrid_recommender"
    ).order_by(MLModel.trained_at.desc()).first()
    
    if not latest_model:
        return {
            "status": "no_training_history",
            "message": "No training history available"
        }
    
    # Calculate coverage metrics
    products = db.query(Product).all()
    users = db.query(User).all()
    transactions = db.query(Transaction).all()
    
    # Product coverage
    products_in_store = set(feature_store.get("product_ids", []))
    product_coverage = len(products_in_store) / len(products) * 100 if products else 0
    
    # User coverage
    users_in_clusters = db.query(User).filter(User.cluster_id.isnot(None)).count()
    user_coverage = users_in_clusters / len(users) * 100 if users else 0
    
    # Transaction density
    n_users = feature_store.get("n_traders", 0)
    n_products = feature_store.get("n_products", 0)
    possible_interactions = n_users * n_products
    actual_interactions = len(transactions)
    sparsity = (1 - actual_interactions / possible_interactions) * 100 if possible_interactions > 0 else 0
    
    # Cluster balance
    cluster_counts = db.query(
        User.cluster_id, func.count(User.id)
    ).filter(User.cluster_id.isnot(None)).group_by(User.cluster_id).all()
    
    cluster_sizes = [count for _, count in cluster_counts]
    cluster_balance = (min(cluster_sizes) / max(cluster_sizes) * 100) if cluster_sizes and max(cluster_sizes) > 0 else 0
    
    evaluation = {
        "model_type": "hybrid_recommender",
        "trained_at": latest_model.trained_at.isoformat(),
        "training_metrics": latest_model.metrics,
        "coverage_metrics": {
            "product_coverage": round(product_coverage, 1),
            "user_coverage": round(user_coverage, 1),
            "transaction_sparsity": round(sparsity, 1)
        },
        "cluster_metrics": {
            "n_clusters": len(cluster_sizes),
            "cluster_sizes": cluster_sizes,
            "cluster_balance": round(cluster_balance, 1),
            "silhouette_score": feature_store.get("silhouette_score", 0)
        },
        "model_components": {
            "collaborative_filtering": {
                "method": "NMF",
                "rank": latest_model.metrics.get("nmf_rank", 0),
                "weight": ALPHA
            },
            "content_based_filtering": {
                "method": "TF-IDF",
                "vocabulary_size": latest_model.metrics.get("tfidf_vocab_size", 0),
                "weight": BETA
            },
            "popularity_boost": {
                "method": "Normalized Quantity",
                "weight": GAMMA
            }
        },
        "data_stats": {
            "n_users": n_users,
            "n_products": n_products,
            "n_transactions": len(transactions),
            "avg_transactions_per_user": round(len(transactions) / n_users, 2) if n_users > 0 else 0
        }
    }
    
    return evaluation

@router.post("/initialize")
async def initialize_models(
    admin = Depends(verify_token),
    db: Session = Depends(get_db)
):
    """Initialize ML models with synthetic data (for testing)"""
    # This can be used to generate synthetic data for initial testing
    return {"message": "Initialize with synthetic data endpoint - implement as needed"}

# Load models on startup
load_models()