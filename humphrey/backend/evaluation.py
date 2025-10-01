"""
ML Model Evaluation Module for SPACS AFRICA.
Calculates technical and business metrics for recommendations.
"""

import numpy as np
import pandas as pd
from typing import List, Dict, Tuple
from collections import defaultdict
from datetime import datetime
import logging

logger = logging.getLogger(__name__)


class RecommendationEvaluator:
    """
    Evaluator for recommendation system quality.
    Calculates both technical metrics (Precision@K, Recall@K) 
    and business metrics (cost savings, participation rates).
    """
    
    def __init__(self, k: int = 5):
        """
        Initialize evaluator.
        
        Args:
            k: Number of recommendations to evaluate (for Precision@K, Recall@K)
        """
        self.k = k
    
    def precision_at_k(
        self, 
        recommendations: List[List[str]], 
        actual_interactions: List[List[str]]
    ) -> float:
        """
        Calculate Precision@K: What fraction of recommended items were relevant?
        
        Args:
            recommendations: List of recommended item lists for each user
            actual_interactions: List of actual item interactions for each user
            
        Returns:
            Average Precision@K across all users
        """
        precisions = []
        
        for rec, actual in zip(recommendations, actual_interactions):
            if not rec:
                continue
            
            # Take top-k recommendations
            rec_k = rec[:self.k]
            
            # Count how many recommended items are in actual
            hits = len(set(rec_k) & set(actual))
            precision = hits / len(rec_k) if rec_k else 0
            precisions.append(precision)
        
        return np.mean(precisions) if precisions else 0.0
    
    def recall_at_k(
        self, 
        recommendations: List[List[str]], 
        actual_interactions: List[List[str]]
    ) -> float:
        """
        Calculate Recall@K: What fraction of relevant items were recommended?
        
        Args:
            recommendations: List of recommended item lists for each user
            actual_interactions: List of actual item interactions for each user
            
        Returns:
            Average Recall@K across all users
        """
        recalls = []
        
        for rec, actual in zip(recommendations, actual_interactions):
            if not actual:
                continue
            
            # Take top-k recommendations
            rec_k = rec[:self.k]
            
            # Count how many actual items are in recommendations
            hits = len(set(rec_k) & set(actual))
            recall = hits / len(actual) if actual else 0
            recalls.append(recall)
        
        return np.mean(recalls) if recalls else 0.0
    
    def ndcg_at_k(
        self, 
        recommendations: List[List[str]], 
        actual_interactions: List[List[str]]
    ) -> float:
        """
        Calculate Normalized Discounted Cumulative Gain (NDCG@K).
        Accounts for the position of relevant items in recommendations.
        
        Args:
            recommendations: List of recommended item lists for each user
            actual_interactions: List of actual item interactions for each user
            
        Returns:
            Average NDCG@K across all users
        """
        ndcgs = []
        
        for rec, actual in zip(recommendations, actual_interactions):
            if not actual or not rec:
                continue
            
            rec_k = rec[:self.k]
            
            # Calculate DCG
            dcg = 0.0
            for i, item in enumerate(rec_k):
                if item in actual:
                    # Relevance is 1 if in actual, 0 otherwise
                    dcg += 1 / np.log2(i + 2)  # +2 because positions start at 0
            
            # Calculate IDCG (ideal DCG)
            idcg = sum(1 / np.log2(i + 2) for i in range(min(len(actual), self.k)))
            
            # NDCG
            ndcg = dcg / idcg if idcg > 0 else 0
            ndcgs.append(ndcg)
        
        return np.mean(ndcgs) if ndcgs else 0.0
    
    def coverage(
        self, 
        recommendations: List[List[str]], 
        total_items: int
    ) -> float:
        """
        Calculate catalog coverage: What % of items are recommended at least once?
        
        Args:
            recommendations: List of recommended item lists for each user
            total_items: Total number of items in catalog
            
        Returns:
            Coverage as a fraction (0-1)
        """
        all_recommended = set()
        for rec in recommendations:
            all_recommended.update(rec)
        
        return len(all_recommended) / total_items if total_items > 0 else 0.0
    
    def diversity(
        self, 
        recommendations: List[List[str]]
    ) -> float:
        """
        Calculate diversity: Average uniqueness of recommendations across users.
        
        Args:
            recommendations: List of recommended item lists for each user
            
        Returns:
            Diversity score (0-1)
        """
        if not recommendations:
            return 0.0
        
        # Calculate pairwise dissimilarity
        dissimilarities = []
        
        for i, rec1 in enumerate(recommendations):
            for rec2 in recommendations[i+1:]:
                # Jaccard distance
                set1, set2 = set(rec1[:self.k]), set(rec2[:self.k])
                if not set1 and not set2:
                    continue
                intersection = len(set1 & set2)
                union = len(set1 | set2)
                dissimilarity = 1 - (intersection / union) if union > 0 else 0
                dissimilarities.append(dissimilarity)
        
        return np.mean(dissimilarities) if dissimilarities else 0.0


class BusinessMetricsCalculator:
    """Calculate business-oriented metrics for the platform."""
    
    @staticmethod
    def calculate_cost_savings(db_session) -> Dict[str, float]:
        """
        Calculate total cost savings from bulk purchases.
        
        Returns:
            Dictionary with savings metrics
        """
        from database import execute_raw_sql
        
        query = """
            WITH bulk_savings AS (
                SELECT 
                    t.product_id,
                    t.quantity,
                    p.base_price,
                    t.unit_price as bulk_price,
                    (p.base_price - t.unit_price) * t.quantity as saved_amount
                FROM transactions t
                JOIN products p ON t.product_id = p.id
                WHERE t.transaction_type = 'bulk'
                AND t.transaction_date >= NOW() - INTERVAL '30 days'
            )
            SELECT 
                COUNT(*) as num_bulk_transactions,
                SUM(saved_amount) as total_savings,
                AVG(saved_amount) as avg_savings_per_transaction
            FROM bulk_savings
        """
        
        result = execute_raw_sql(query)
        
        if result and result[0]['total_savings']:
            return {
                'total_savings_30d': float(result[0]['total_savings']),
                'avg_savings_per_transaction': float(result[0]['avg_savings_per_transaction']),
                'num_bulk_transactions': int(result[0]['num_bulk_transactions'])
            }
        
        return {
            'total_savings_30d': 0.0,
            'avg_savings_per_transaction': 0.0,
            'num_bulk_transactions': 0
        }
    
    @staticmethod
    def calculate_group_success_rate(db_session) -> float:
        """
        Calculate the percentage of groups that successfully reach their target.
        
        Returns:
            Success rate as a percentage (0-100)
        """
        from database import execute_raw_sql
        
        query = """
            SELECT 
                COUNT(*) as total_groups,
                SUM(CASE WHEN status = 'completed' THEN 1 ELSE 0 END) as completed_groups
            FROM bulk_groups
            WHERE created_at >= NOW() - INTERVAL '30 days'
        """
        
        result = execute_raw_sql(query)
        
        if result and result[0]['total_groups'] > 0:
            total = result[0]['total_groups']
            completed = result[0]['completed_groups']
            return (completed / total * 100) if total > 0 else 0.0
        
        return 0.0
    
    @staticmethod
    def calculate_participation_rate(db_session) -> float:
        """
        Calculate the percentage of active users who have joined at least one group.
        
        Returns:
            Participation rate as a percentage (0-100)
        """
        from database import execute_raw_sql
        
        query = """
            SELECT 
                (SELECT COUNT(DISTINCT id) FROM users WHERE is_active = TRUE) as total_users,
                (SELECT COUNT(DISTINCT user_id) FROM group_memberships) as participating_users
        """
        
        result = execute_raw_sql(query)
        
        if result and result[0]['total_users'] > 0:
            total = result[0]['total_users']
            participating = result[0]['participating_users']
            return (participating / total * 100) if total > 0 else 0.0
        
        return 0.0
    
    @staticmethod
    def calculate_recommendation_acceptance_rate(db_session) -> float:
        """
        Calculate the percentage of recommendations that were accepted.
        
        Returns:
            Acceptance rate as a percentage (0-100)
        """
        from database import execute_raw_sql
        
        query = """
            SELECT 
                COUNT(*) as total_recommendations,
                SUM(CASE WHEN status = 'accepted' THEN 1 ELSE 0 END) as accepted_recommendations
            FROM recommendations
            WHERE created_at >= NOW() - INTERVAL '30 days'
        """
        
        result = execute_raw_sql(query)
        
        if result and result[0]['total_recommendations'] > 0:
            total = result[0]['total_recommendations']
            accepted = result[0]['accepted_recommendations']
            return (accepted / total * 100) if total > 0 else 0.0
        
        return 0.0


def evaluate_system(db_session) -> Dict:
    """
    Run complete evaluation of the recommendation system.
    
    Args:
        db_session: Database session
        
    Returns:
        Dictionary with all evaluation metrics
    """
    evaluator = RecommendationEvaluator(k=5)
    business_calc = BusinessMetricsCalculator()
    
    # Get recommendations and actual interactions
    from database import execute_raw_sql
    
    # Get recent recommendations
    rec_query = """
        SELECT 
            r.user_id,
            array_agg(r.product_id::text ORDER BY r.score DESC) as recommended_products
        FROM recommendations r
        WHERE r.created_at >= NOW() - INTERVAL '7 days'
        GROUP BY r.user_id
    """
    
    rec_results = execute_raw_sql(rec_query)
    
    # Get actual purchases
    actual_query = """
        SELECT 
            t.user_id,
            array_agg(DISTINCT t.product_id::text) as purchased_products
        FROM transactions t
        WHERE t.transaction_date >= NOW() - INTERVAL '7 days'
        GROUP BY t.user_id
    """
    
    actual_results = execute_raw_sql(actual_query)
    
    # Prepare data for evaluation
    recommendations_list = [r['recommended_products'] for r in rec_results] if rec_results else []
    actual_list = [a['purchased_products'] for a in actual_results] if actual_results else []
    
    # Calculate technical metrics
    if recommendations_list and actual_list:
        # Match users
        rec_dict = {r['user_id']: r['recommended_products'] for r in rec_results}
        actual_dict = {a['user_id']: a['purchased_products'] for a in actual_results}
        
        common_users = set(rec_dict.keys()) & set(actual_dict.keys())
        
        matched_recs = [rec_dict[uid] for uid in common_users]
        matched_actual = [actual_dict[uid] for uid in common_users]
        
        precision = evaluator.precision_at_k(matched_recs, matched_actual)
        recall = evaluator.recall_at_k(matched_recs, matched_actual)
        ndcg = evaluator.ndcg_at_k(matched_recs, matched_actual)
        
        # Get total products
        product_count_query = "SELECT COUNT(*) as count FROM products WHERE is_active = TRUE"
        product_count = execute_raw_sql(product_count_query)[0]['count']
        
        coverage = evaluator.coverage(matched_recs, product_count)
        diversity = evaluator.diversity(matched_recs)
    else:
        precision = recall = ndcg = coverage = diversity = 0.0
        common_users = set()
    
    # Calculate business metrics
    cost_savings = business_calc.calculate_cost_savings(db_session)
    group_success_rate = business_calc.calculate_group_success_rate(db_session)
    participation_rate = business_calc.calculate_participation_rate(db_session)
    acceptance_rate = business_calc.calculate_recommendation_acceptance_rate(db_session)
    
    # Compile results
    metrics = {
        'technical_metrics': {
            'precision_at_5': round(precision, 4),
            'recall_at_5': round(recall, 4),
            'ndcg_at_5': round(ndcg, 4),
            'coverage': round(coverage, 4),
            'diversity': round(diversity, 4),
            'sample_size': len(common_users)
        },
        'business_metrics': {
            'total_savings_30d': cost_savings['total_savings_30d'],
            'avg_savings_per_transaction': cost_savings['avg_savings_per_transaction'],
            'group_success_rate': round(group_success_rate, 2),
            'participation_rate': round(participation_rate, 2),
            'recommendation_acceptance_rate': round(acceptance_rate, 2)
        },
        'metadata': {
            'evaluated_at': datetime.now().isoformat(),
            'model_version': 'v1.0'
        }
    }
    
    logger.info(f"System evaluation complete: {metrics}")
    return metrics


if __name__ == "__main__":
    print("Testing Evaluation Module...\n")
    
    # Test with synthetic data
    evaluator = RecommendationEvaluator(k=5)
    
    # Mock data
    recommendations = [
        ['prod1', 'prod2', 'prod3', 'prod4', 'prod5'],
        ['prod2', 'prod3', 'prod5', 'prod6', 'prod7'],
        ['prod1', 'prod4', 'prod8', 'prod9', 'prod10']
    ]
    
    actual = [
        ['prod1', 'prod2', 'prod6'],
        ['prod2', 'prod5', 'prod11'],
        ['prod1', 'prod3', 'prod4']
    ]
    
    precision = evaluator.precision_at_k(recommendations, actual)
    recall = evaluator.recall_at_k(recommendations, actual)
    ndcg = evaluator.ndcg_at_k(recommendations, actual)
    
    print(f"Precision@5: {precision:.4f}")
    print(f"Recall@5: {recall:.4f}")
    print(f"NDCG@5: {ndcg:.4f}")
    print(f"\n✓ Evaluation module test completed")
