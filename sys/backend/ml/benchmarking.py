"""
ML Recommendation Benchmarking System

Provides offline evaluation metrics and baseline model comparisons
for assessing recommendation quality.
"""
from fastapi import APIRouter, Depends, HTTPException, status, BackgroundTasks
from sqlalchemy.orm import Session
from sqlalchemy import func, desc
from pydantic import BaseModel
from typing import List, Dict, Set, Tuple, Optional, Callable, Any
from datetime import datetime, timedelta
import numpy as np
import pandas as pd
from collections import defaultdict
import time
import logging

from db.database import get_db
from models.models import User, Product, Transaction, BenchmarkResult
from authentication.auth import verify_admin
from sklearn.feature_extraction.text import TfidfVectorizer
from sklearn.decomposition import NMF
from sklearn.preprocessing import MinMaxScaler
import joblib
import os

logger = logging.getLogger(__name__)
router = APIRouter()

# ============================================================================
# PYDANTIC MODELS
# ============================================================================

class BenchmarkMetrics(BaseModel):
    """Metrics for a single model evaluation"""
    precision_at_5: float
    precision_at_10: float
    recall_at_5: float
    recall_at_10: float
    ndcg_at_5: float
    ndcg_at_10: float
    map_score: float
    hit_rate: float
    coverage: float
    
class BenchmarkResultResponse(BaseModel):
    """Response for benchmark evaluation"""
    model_name: str
    metrics: BenchmarkMetrics
    test_set_size: int
    evaluation_time: float
    run_at: datetime
    notes: Optional[str] = None

class BaselineComparison(BaseModel):
    """Comparison of all baseline models"""
    hybrid: BenchmarkMetrics
    collaborative_only: BenchmarkMetrics
    content_only: BenchmarkMetrics
    popularity: BenchmarkMetrics
    random: BenchmarkMetrics
    test_set_size: int
    run_at: datetime

class BenchmarkStatus(BaseModel):
    """Status of running benchmark"""
    status: str  # idle, running, completed, failed
    progress: float  # 0-100
    current_model: Optional[str] = None
    message: str

# ============================================================================
# OFFLINE EVALUATION METRICS
# ============================================================================

def precision_at_k(recommendations: List[int], ground_truth: Set[int], k: int) -> float:
    """
    Precision@K: Proportion of recommended items that are relevant
    
    Args:
        recommendations: List of recommended product IDs (ranked)
        ground_truth: Set of actually purchased product IDs
        k: Number of top recommendations to consider
    
    Returns:
        Precision score (0-1)
    """
    if not recommendations or not ground_truth:
        return 0.0
    
    top_k = recommendations[:k]
    relevant_in_top_k = len([item for item in top_k if item in ground_truth])
    
    return relevant_in_top_k / k if k > 0 else 0.0

def recall_at_k(recommendations: List[int], ground_truth: Set[int], k: int) -> float:
    """
    Recall@K: Proportion of relevant items that are recommended
    
    Args:
        recommendations: List of recommended product IDs (ranked)
        ground_truth: Set of actually purchased product IDs
        k: Number of top recommendations to consider
    
    Returns:
        Recall score (0-1)
    """
    if not recommendations or not ground_truth:
        return 0.0
    
    top_k = recommendations[:k]
    relevant_in_top_k = len([item for item in top_k if item in ground_truth])
    
    return relevant_in_top_k / len(ground_truth) if len(ground_truth) > 0 else 0.0

def dcg_at_k(relevance_scores: List[float], k: int) -> float:
    """
    Discounted Cumulative Gain@K
    
    Args:
        relevance_scores: Binary relevance (1 if relevant, 0 if not) for each recommendation
        k: Number of top recommendations to consider
    
    Returns:
        DCG score
    """
    relevance_scores = relevance_scores[:k]
    if not relevance_scores:
        return 0.0
    
    # DCG = sum(rel_i / log2(i + 2)) for i in range(k)
    dcg = sum(rel / np.log2(idx + 2) for idx, rel in enumerate(relevance_scores))
    return dcg

def ndcg_at_k(recommendations: List[int], ground_truth: Set[int], k: int) -> float:
    """
    Normalized Discounted Cumulative Gain@K
    
    Args:
        recommendations: List of recommended product IDs (ranked)
        ground_truth: Set of actually purchased product IDs
        k: Number of top recommendations to consider
    
    Returns:
        NDCG score (0-1, higher is better)
    """
    if not recommendations or not ground_truth:
        return 0.0
    
    # Create relevance scores for recommendations
    top_k = recommendations[:k]
    relevance_scores = [1.0 if item in ground_truth else 0.0 for item in top_k]
    
    # Calculate DCG
    dcg = dcg_at_k(relevance_scores, k)
    
    # Calculate IDCG (ideal DCG - all relevant items at top)
    ideal_relevance = [1.0] * min(len(ground_truth), k) + [0.0] * max(0, k - len(ground_truth))
    idcg = dcg_at_k(ideal_relevance, k)
    
    # Normalize
    return dcg / idcg if idcg > 0 else 0.0

def average_precision(recommendations: List[int], ground_truth: Set[int]) -> float:
    """
    Average Precision: Average of precision values at positions where relevant items occur
    
    Args:
        recommendations: List of recommended product IDs (ranked)
        ground_truth: Set of actually purchased product IDs
    
    Returns:
        Average precision score (0-1)
    """
    if not recommendations or not ground_truth:
        return 0.0
    
    num_relevant = 0
    precision_sum = 0.0
    
    for idx, item in enumerate(recommendations):
        if item in ground_truth:
            num_relevant += 1
            precision_at_pos = num_relevant / (idx + 1)
            precision_sum += precision_at_pos
    
    return precision_sum / len(ground_truth) if len(ground_truth) > 0 else 0.0

def hit_rate(recommendations: List[int], ground_truth: Set[int], k: int) -> float:
    """
    Hit Rate: Binary indicator of whether any relevant item appears in top-K
    
    Args:
        recommendations: List of recommended product IDs (ranked)
        ground_truth: Set of actually purchased product IDs
        k: Number of top recommendations to consider
    
    Returns:
        1.0 if hit, 0.0 otherwise
    """
    if not recommendations or not ground_truth:
        return 0.0
    
    top_k = recommendations[:k]
    return 1.0 if any(item in ground_truth for item in top_k) else 0.0

def coverage(all_recommendations: List[List[int]], all_products: Set[int]) -> float:
    """
    Coverage: Proportion of all products that appear in recommendations
    
    Args:
        all_recommendations: List of recommendation lists for all users
        all_products: Set of all available product IDs
    
    Returns:
        Coverage score (0-1)
    """
    if not all_products:
        return 0.0
    
    recommended_products = set()
    for recs in all_recommendations:
        recommended_products.update(recs)
    
    return len(recommended_products) / len(all_products) if len(all_products) > 0 else 0.0

# ============================================================================
# TEST DATA PREPARATION
# ============================================================================

def prepare_test_set(db: Session, test_ratio: float = 0.2) -> Tuple[Dict, Dict]:
    """
    Split transactions into train/test sets with temporal validation
    
    Args:
        db: Database session
        test_ratio: Proportion of data for testing (default 0.2 = 20%)
    
    Returns:
        Tuple of (train_data, test_data) where each is:
        {user_id: {product_id: quantity, ...}, ...}
    """
    logger.info(f"Preparing test set with {test_ratio*100}% test ratio...")
    
    # Get all traders (non-admin, non-supplier)
    traders = db.query(User).filter(
        User.is_admin == False,
        User.is_supplier == False
    ).all()
    trader_ids = [t.id for t in traders]
    
    # Get all transactions, sorted by time
    transactions = db.query(Transaction).filter(
        Transaction.user_id.in_(trader_ids)
    ).order_by(Transaction.created_at).all()
    
    if not transactions:
        logger.warning("No transactions found for test set preparation")
        return {}, {}
    
    # Group transactions by user
    user_transactions = defaultdict(list)
    for tx in transactions:
        user_transactions[tx.user_id].append(tx)
    
    train_data = {}
    test_data = {}
    
    # For each user, split their transactions temporally
    for user_id, user_txs in user_transactions.items():
        # Sort by time
        user_txs.sort(key=lambda tx: tx.created_at)
        
        # Split point (use last 20% as test)
        split_idx = int(len(user_txs) * (1 - test_ratio))
        
        # Ensure at least one transaction in test if user has multiple transactions
        if split_idx == len(user_txs) and len(user_txs) > 1:
            split_idx = len(user_txs) - 1
        
        train_txs = user_txs[:split_idx]
        test_txs = user_txs[split_idx:]
        
        # Build train set
        if train_txs:
            train_data[user_id] = defaultdict(float)
            for tx in train_txs:
                train_data[user_id][tx.product_id] += tx.quantity
            train_data[user_id] = dict(train_data[user_id])
        
        # Build test set
        if test_txs:
            test_data[user_id] = defaultdict(float)
            for tx in test_txs:
                test_data[user_id][tx.product_id] += tx.quantity
            test_data[user_id] = dict(test_data[user_id])
    
    logger.info(f"Train set: {len(train_data)} users, Test set: {len(test_data)} users")
    return train_data, test_data

# ============================================================================
# BASELINE MODELS
# ============================================================================

def random_recommender(user_id: int, k: int, all_products: List[int], train_data: Dict) -> List[int]:
    """
    Random baseline: Randomly recommend K products
    """
    # Exclude products user already has in train set
    user_train_products = set(train_data.get(user_id, {}).keys())
    available_products = [p for p in all_products if p not in user_train_products]
    
    if not available_products:
        return []
    
    np.random.seed(42 + user_id)  # Reproducible
    num_to_recommend = min(k, len(available_products))
    return list(np.random.choice(available_products, size=num_to_recommend, replace=False))

def popularity_recommender(user_id: int, k: int, train_data: Dict) -> List[int]:
    """
    Popularity baseline: Recommend most frequently purchased products
    """
    # Count product popularity across all users
    product_counts = defaultdict(float)
    for uid, products in train_data.items():
        for pid, qty in products.items():
            product_counts[pid] += qty
    
    # Exclude products user already has
    user_train_products = set(train_data.get(user_id, {}).keys())
    
    # Sort by popularity
    sorted_products = sorted(product_counts.items(), key=lambda x: x[1], reverse=True)
    recommendations = [pid for pid, _ in sorted_products if pid not in user_train_products]
    
    return recommendations[:k]

def collaborative_filtering_recommender(user_id: int, k: int, nmf_model, 
                                       user_product_matrix, user_ids, product_ids, 
                                       train_data: Dict) -> List[int]:
    """
    Collaborative filtering baseline: Use only NMF (no content features)
    """
    if user_id not in user_ids:
        # Fallback to popularity for new users
        return popularity_recommender(user_id, k, train_data)
    
    user_idx = user_ids.index(user_id)
    user_vector = user_product_matrix[user_idx]
    
    # Transform with NMF
    W_user = nmf_model.transform(user_vector.reshape(1, -1))
    H = nmf_model.components_
    predictions = np.dot(W_user, H).flatten()
    
    # Exclude already purchased products
    user_train_products = set(train_data.get(user_id, {}).keys())
    
    # Get top K predictions
    product_scores = list(zip(product_ids, predictions))
    product_scores = [(pid, score) for pid, score in product_scores if pid not in user_train_products]
    product_scores.sort(key=lambda x: x[1], reverse=True)
    
    return [pid for pid, _ in product_scores[:k]]

def content_based_recommender(user_id: int, k: int, tfidf_model, 
                              user_product_matrix, user_ids, product_ids,
                              product_texts, train_data: Dict) -> List[int]:
    """
    Content-based baseline: Use only TF-IDF (no collaborative filtering)
    """
    if user_id not in user_ids:
        return popularity_recommender(user_id, k, train_data)
    
    user_idx = user_ids.index(user_id)
    user_vector = user_product_matrix[user_idx]
    
    # Build user profile from purchased products
    prod_tfidf = tfidf_model.transform(product_texts)
    user_profile = user_vector @ prod_tfidf.toarray()
    user_norm = np.linalg.norm(user_profile) + 1e-9
    user_profile_norm = user_profile / user_norm
    
    # Calculate similarity to all products
    prod_norms = np.linalg.norm(prod_tfidf.toarray(), axis=1, keepdims=True) + 1e-9
    prod_vecs_norm = prod_tfidf.toarray() / prod_norms
    similarities = np.dot(user_profile_norm, prod_vecs_norm.T).flatten()
    
    # Exclude already purchased products
    user_train_products = set(train_data.get(user_id, {}).keys())
    
    # Get top K
    product_scores = list(zip(product_ids, similarities))
    product_scores = [(pid, score) for pid, score in product_scores if pid not in user_train_products]
    product_scores.sort(key=lambda x: x[1], reverse=True)
    
    return [pid for pid, _ in product_scores[:k]]

def hybrid_recommender(user_id: int, k: int, nmf_model, tfidf_model,
                      user_product_matrix, user_ids, product_ids, product_texts,
                      train_data: Dict, alpha: float = 0.6, beta: float = 0.3, 
                      gamma: float = 0.1) -> List[int]:
    """
    Hybrid recommender: Combine collaborative, content-based, and popularity
    """
    if user_id not in user_ids:
        return popularity_recommender(user_id, k, train_data)
    
    user_idx = user_ids.index(user_id)
    user_vector = user_product_matrix[user_idx]
    n_products = len(product_ids)
    
    # 1. Collaborative Filtering
    W_user = nmf_model.transform(user_vector.reshape(1, -1))
    H = nmf_model.components_
    cf_scores = np.dot(W_user, H).flatten()
    
    # 2. Content-Based
    prod_tfidf = tfidf_model.transform(product_texts)
    user_profile = user_vector @ prod_tfidf.toarray()
    user_norm = np.linalg.norm(user_profile) + 1e-9
    user_profile_norm = user_profile / user_norm
    prod_norms = np.linalg.norm(prod_tfidf.toarray(), axis=1, keepdims=True) + 1e-9
    prod_vecs_norm = prod_tfidf.toarray() / prod_norms
    cb_scores = np.dot(user_profile_norm, prod_vecs_norm.T).flatten()
    
    # 3. Popularity
    product_popularity = np.zeros(n_products)
    for uid, products in train_data.items():
        for pid, qty in products.items():
            try:
                prod_idx = product_ids.index(pid)
                product_popularity[prod_idx] += qty
            except ValueError:
                continue
    
    pop_min, pop_max = product_popularity.min(), product_popularity.max()
    if pop_max > pop_min:
        pop_scores = (product_popularity - pop_min) / (pop_max - pop_min)
    else:
        pop_scores = product_popularity * 0
    
    # Normalize scores
    cf_norm = (cf_scores - cf_scores.min()) / (cf_scores.max() - cf_scores.min() + 1e-9)
    cb_norm = (cb_scores - cb_scores.min()) / (cb_scores.max() - cb_scores.min() + 1e-9)
    
    # Combine
    hybrid_scores = alpha * cf_norm + beta * cb_norm + gamma * pop_scores
    
    # Exclude already purchased
    user_train_products = set(train_data.get(user_id, {}).keys())
    
    # Get top K
    product_scores = list(zip(product_ids, hybrid_scores))
    product_scores = [(pid, score) for pid, score in product_scores if pid not in user_train_products]
    product_scores.sort(key=lambda x: x[1], reverse=True)
    
    return [pid for pid, _ in product_scores[:k]]

# ============================================================================
# MODEL EVALUATION
# ============================================================================

def evaluate_model(recommender_func: Callable, test_data: Dict, 
                  k_values: List[int] = [5, 10]) -> BenchmarkMetrics:
    """
    Evaluate a recommendation model on test data
    
    Args:
        recommender_func: Function that takes (user_id, k) and returns List[product_ids]
        test_data: Dict mapping user_id to {product_id: quantity}
        k_values: List of K values to evaluate (default [5, 10])
    
    Returns:
        BenchmarkMetrics with all evaluation scores
    """
    if not test_data:
        return BenchmarkMetrics(
            precision_at_5=0.0, precision_at_10=0.0,
            recall_at_5=0.0, recall_at_10=0.0,
            ndcg_at_5=0.0, ndcg_at_10=0.0,
            map_score=0.0, hit_rate=0.0, coverage=0.0
        )
    
    # Initialize metric accumulators
    metrics = {
        'precision@5': [], 'precision@10': [],
        'recall@5': [], 'recall@10': [],
        'ndcg@5': [], 'ndcg@10': [],
        'ap': [], 'hit@10': []
    }
    all_recommendations = []
    
    # Evaluate for each user
    for user_id, ground_truth_dict in test_data.items():
        ground_truth = set(ground_truth_dict.keys())
        
        # Get recommendations for k=10 (we'll use subset for k=5)
        try:
            recommendations = recommender_func(user_id, 10)
        except Exception as e:
            logger.error(f"Error generating recommendations for user {user_id}: {e}")
            continue
        
        if not recommendations:
            continue
        
        all_recommendations.append(recommendations)
        
        # Calculate metrics
        metrics['precision@5'].append(precision_at_k(recommendations, ground_truth, 5))
        metrics['precision@10'].append(precision_at_k(recommendations, ground_truth, 10))
        metrics['recall@5'].append(recall_at_k(recommendations, ground_truth, 5))
        metrics['recall@10'].append(recall_at_k(recommendations, ground_truth, 10))
        metrics['ndcg@5'].append(ndcg_at_k(recommendations, ground_truth, 5))
        metrics['ndcg@10'].append(ndcg_at_k(recommendations, ground_truth, 10))
        metrics['ap'].append(average_precision(recommendations, ground_truth))
        metrics['hit@10'].append(hit_rate(recommendations, ground_truth, 10))
    
    # Aggregate metrics
    avg_metrics = {key: np.mean(values) if values else 0.0 for key, values in metrics.items()}
    
    return BenchmarkMetrics(
        precision_at_5=avg_metrics['precision@5'],
        precision_at_10=avg_metrics['precision@10'],
        recall_at_5=avg_metrics['recall@5'],
        recall_at_10=avg_metrics['recall@10'],
        ndcg_at_5=avg_metrics['ndcg@5'],
        ndcg_at_10=avg_metrics['ndcg@10'],
        map_score=avg_metrics['ap'],
        hit_rate=avg_metrics['hit@10'],
        coverage=0.0  # Will be calculated separately
    )

# ============================================================================
# BENCHMARKING PIPELINE
# ============================================================================

def run_full_benchmark(db: Session) -> BaselineComparison:
    """
    Run complete benchmark evaluation comparing all baseline models
    
    Returns:
        BaselineComparison with metrics for all models
    """
    logger.info("=" * 70)
    logger.info("STARTING FULL BENCHMARK EVALUATION")
    logger.info("=" * 70)
    
    start_time = time.time()
    
    # 1. Prepare test set
    logger.info("\n1. Preparing train/test split...")
    train_data, test_data = prepare_test_set(db, test_ratio=0.2)
    
    if not test_data:
        raise ValueError("No test data available for evaluation")
    
    logger.info(f"   Train users: {len(train_data)}, Test users: {len(test_data)}")
    
    # 2. Build necessary components
    logger.info("\n2. Building model components...")
    
    # Get all products
    products = db.query(Product).filter(Product.is_active == True).all()
    product_ids = [p.id for p in products]
    all_products_set = set(product_ids)
    
    # Get all traders
    traders = db.query(User).filter(
        User.is_admin == False,
        User.is_supplier == False
    ).all()
    user_ids = [t.id for t in traders]
    
    # Build user-product matrix
    n_users = len(user_ids)
    n_products = len(product_ids)
    user_product_matrix = np.zeros((n_users, n_products))
    
    for user_idx, user_id in enumerate(user_ids):
        if user_id in train_data:
            for prod_id, qty in train_data[user_id].items():
                try:
                    prod_idx = product_ids.index(prod_id)
                    user_product_matrix[user_idx, prod_idx] = qty
                except ValueError:
                    continue
    
    logger.info(f"   User-product matrix: {user_product_matrix.shape}")
    
    # Build product texts for TF-IDF
    product_texts = []
    for pid in product_ids:
        p = next((prod for prod in products if prod.id == pid), None)
        if p:
            text = f"{p.name} {p.description or ''} {p.category or 'general'}"
            product_texts.append(text)
        else:
            product_texts.append("")
    
    # Train NMF
    logger.info("   Training NMF...")
    nmf_rank = min(10, n_users, n_products)
    nmf_model = NMF(n_components=nmf_rank, init='random', random_state=42, max_iter=200)
    nmf_model.fit(user_product_matrix)
    
    # Train TF-IDF
    logger.info("   Training TF-IDF...")
    tfidf_model = TfidfVectorizer(max_features=100, stop_words='english')
    tfidf_model.fit(product_texts)
    
    # 3. Evaluate all models
    logger.info("\n3. Evaluating models...")
    results = {}
    
    # Random
    logger.info("   Evaluating: Random baseline...")
    random_func = lambda uid, k: random_recommender(uid, k, product_ids, train_data)
    results['random'] = evaluate_model(random_func, test_data)
    logger.info(f"      Precision@10: {results['random'].precision_at_10:.4f}")
    
    # Popularity
    logger.info("   Evaluating: Popularity baseline...")
    pop_func = lambda uid, k: popularity_recommender(uid, k, train_data)
    results['popularity'] = evaluate_model(pop_func, test_data)
    logger.info(f"      Precision@10: {results['popularity'].precision_at_10:.4f}")
    
    # Collaborative Only
    logger.info("   Evaluating: Collaborative filtering...")
    cf_func = lambda uid, k: collaborative_filtering_recommender(
        uid, k, nmf_model, user_product_matrix, user_ids, product_ids, train_data
    )
    results['collaborative_only'] = evaluate_model(cf_func, test_data)
    logger.info(f"      Precision@10: {results['collaborative_only'].precision_at_10:.4f}")
    
    # Content Only
    logger.info("   Evaluating: Content-based filtering...")
    cb_func = lambda uid, k: content_based_recommender(
        uid, k, tfidf_model, user_product_matrix, user_ids, product_ids, product_texts, train_data
    )
    results['content_only'] = evaluate_model(cb_func, test_data)
    logger.info(f"      Precision@10: {results['content_only'].precision_at_10:.4f}")
    
    # Hybrid
    logger.info("   Evaluating: Hybrid model...")
    hybrid_func = lambda uid, k: hybrid_recommender(
        uid, k, nmf_model, tfidf_model, user_product_matrix, user_ids, product_ids, 
        product_texts, train_data
    )
    results['hybrid'] = evaluate_model(hybrid_func, test_data)
    logger.info(f"      Precision@10: {results['hybrid'].precision_at_10:.4f}")
    
    # Calculate coverage for all models
    logger.info("\n4. Calculating coverage...")
    for model_name in results.keys():
        all_recs = []
        if model_name == 'random':
            func = random_func
        elif model_name == 'popularity':
            func = pop_func
        elif model_name == 'collaborative_only':
            func = cf_func
        elif model_name == 'content_only':
            func = cb_func
        else:  # hybrid
            func = hybrid_func
        
        for uid in test_data.keys():
            try:
                recs = func(uid, 10)
                all_recs.append(recs)
            except:
                continue
        
        cov = coverage(all_recs, all_products_set)
        results[model_name].coverage = cov
        logger.info(f"   {model_name}: {cov:.4f}")
    
    elapsed_time = time.time() - start_time
    
    logger.info("\n" + "=" * 70)
    logger.info("BENCHMARK COMPLETE!")
    logger.info(f"Total time: {elapsed_time:.2f}s")
    logger.info("=" * 70)
    
    return BaselineComparison(
        hybrid=results['hybrid'],
        collaborative_only=results['collaborative_only'],
        content_only=results['content_only'],
        popularity=results['popularity'],
        random=results['random'],
        test_set_size=len(test_data),
        run_at=datetime.utcnow()
    )

# ============================================================================
# API ENDPOINTS
# ============================================================================

@router.post("/benchmark/run", response_model=Dict[str, Any])
async def run_benchmark_evaluation(
    background_tasks: BackgroundTasks,
    admin = Depends(verify_admin),
    db: Session = Depends(get_db)
):
    """
    Run full benchmark evaluation (async in background)
    """
    try:
        # Run benchmark
        comparison = run_full_benchmark(db)
        
        # Save results to database
        models_to_save = [
            ('hybrid', comparison.hybrid),
            ('collaborative_only', comparison.collaborative_only),
            ('content_only', comparison.content_only),
            ('popularity', comparison.popularity),
            ('random', comparison.random)
        ]
        
        for model_name, metrics in models_to_save:
            benchmark_result = BenchmarkResult(
                model_name=model_name,
                precision_at_5=metrics.precision_at_5,
                precision_at_10=metrics.precision_at_10,
                recall_at_5=metrics.recall_at_5,
                recall_at_10=metrics.recall_at_10,
                ndcg_at_5=metrics.ndcg_at_5,
                ndcg_at_10=metrics.ndcg_at_10,
                map_score=metrics.map_score,
                hit_rate=metrics.hit_rate,
                coverage=metrics.coverage,
                test_set_size=comparison.test_set_size,
                evaluation_time=0.0,  # Will be set by individual runs
                run_at=comparison.run_at
            )
            db.add(benchmark_result)
        
        db.commit()
        
        return {
            "status": "completed",
            "message": "Benchmark evaluation completed successfully",
            "test_set_size": comparison.test_set_size,
            "models_evaluated": 5,
            "run_at": comparison.run_at.isoformat()
        }
        
    except Exception as e:
        logger.error(f"Error running benchmark: {e}")
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail=f"Benchmark evaluation failed: {str(e)}"
        )

@router.get("/benchmark/latest", response_model=Dict[str, Any])
async def get_latest_benchmark(
    admin = Depends(verify_admin),
    db: Session = Depends(get_db)
):
    """Get the latest benchmark results for all models"""
    try:
        # Get latest run timestamp
        latest_run = db.query(func.max(BenchmarkResult.run_at)).scalar()
        
        if not latest_run:
            return {
                "status": "no_data",
                "message": "No benchmark results available. Run a benchmark first."
            }
        
        # Get results for all models from latest run
        results = db.query(BenchmarkResult).filter(
            BenchmarkResult.run_at == latest_run
        ).all()
        
        # Organize by model
        models = {}
        for result in results:
            models[result.model_name] = {
                "precision_at_5": result.precision_at_5,
                "precision_at_10": result.precision_at_10,
                "recall_at_5": result.recall_at_5,
                "recall_at_10": result.recall_at_10,
                "ndcg_at_5": result.ndcg_at_5,
                "ndcg_at_10": result.ndcg_at_10,
                "map_score": result.map_score,
                "hit_rate": result.hit_rate,
                "coverage": result.coverage
            }
        
        test_set_size = results[0].test_set_size if results else 0
        
        return {
            "status": "success",
            "models": models,
            "test_set_size": test_set_size,
            "run_at": latest_run.isoformat()
        }
        
    except Exception as e:
        logger.error(f"Error fetching latest benchmark: {e}")
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail=str(e)
        )

@router.get("/benchmark/history", response_model=List[Dict[str, Any]])
async def get_benchmark_history(
    limit: int = 10,
    admin = Depends(verify_admin),
    db: Session = Depends(get_db)
):
    """Get benchmark history for trend analysis"""
    try:
        # Get unique run timestamps
        run_timestamps = db.query(BenchmarkResult.run_at).distinct().order_by(
            desc(BenchmarkResult.run_at)
        ).limit(limit).all()
        
        run_timestamps = [rt[0] for rt in run_timestamps]
        
        history = []
        for run_time in run_timestamps:
            results = db.query(BenchmarkResult).filter(
                BenchmarkResult.run_at == run_time
            ).all()
            
            run_data = {
                "run_at": run_time.isoformat(),
                "test_set_size": results[0].test_set_size if results else 0,
                "models": {}
            }
            
            for result in results:
                run_data["models"][result.model_name] = {
                    "precision_at_10": result.precision_at_10,
                    "recall_at_10": result.recall_at_10,
                    "ndcg_at_10": result.ndcg_at_10,
                    "map_score": result.map_score
                }
            
            history.append(run_data)
        
        return history
        
    except Exception as e:
        logger.error(f"Error fetching benchmark history: {e}")
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail=str(e)
        )

@router.get("/benchmark/comparison", response_model=Dict[str, Any])
async def get_baseline_comparison(
    admin = Depends(verify_admin),
    db: Session = Depends(get_db)
):
    """Get detailed comparison of all baseline models"""
    return await get_latest_benchmark(admin, db)

