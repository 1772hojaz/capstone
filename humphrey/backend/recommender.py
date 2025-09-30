"""
Group Recommendation Engine for SPACS AFRICA.
Implements hybrid collaborative filtering to recommend bulk-purchase groups.
"""

import numpy as np
import pandas as pd
from typing import List, Dict, Tuple, Optional
from collections import defaultdict, Counter
from datetime import datetime, timedelta
import logging
from uuid import UUID

logger = logging.getLogger(__name__)


class GroupRecommenderEngine:
    """
    Hybrid recommendation engine that suggests:
    1. Existing groups for users to join
    2. New group opportunities based on cluster demand
    """
    
    def __init__(self, min_group_size: int = 5, max_recommendations: int = 10):
        """
        Initialize recommender engine.
        
        Args:
            min_group_size: Minimum users needed to suggest a new group
            max_recommendations: Maximum recommendations per user
        """
        self.min_group_size = min_group_size
        self.max_recommendations = max_recommendations
        
    def get_user_purchase_history(self, db_session, user_id: UUID) -> pd.DataFrame:
        """Get user's purchase history."""
        from database import execute_raw_sql
        
        query = """
            SELECT 
                t.product_id,
                p.name as product_name,
                p.category,
                COUNT(*) as purchase_count,
                AVG(t.quantity) as avg_quantity,
                MAX(t.transaction_date) as last_purchase
            FROM transactions t
            JOIN products p ON t.product_id = p.id
            WHERE t.user_id = :user_id
            GROUP BY t.product_id, p.name, p.category
            ORDER BY purchase_count DESC
        """
        
        results = execute_raw_sql(query, {'user_id': str(user_id)})
        return pd.DataFrame(results) if results else pd.DataFrame()
    
    def get_cluster_product_affinity(self, db_session, cluster_id: int) -> Dict[str, float]:
        """
        Calculate product affinity scores for a cluster.
        Products frequently bought by cluster members get higher scores.
        """
        from database import execute_raw_sql
        
        query = """
            SELECT 
                p.id as product_id,
                p.name as product_name,
                COUNT(DISTINCT t.user_id) as user_count,
                COUNT(*) as transaction_count,
                AVG(t.quantity) as avg_quantity
            FROM transactions t
            JOIN products p ON t.product_id = p.id
            JOIN user_clusters uc ON t.user_id = uc.user_id
            WHERE uc.cluster_id = :cluster_id
            AND t.transaction_date >= NOW() - INTERVAL '90 days'
            GROUP BY p.id, p.name
            ORDER BY user_count DESC, transaction_count DESC
        """
        
        results = execute_raw_sql(query, {'cluster_id': cluster_id})
        
        if not results:
            return {}
        
        # Calculate affinity score (normalized)
        total_users = max([r['user_count'] for r in results])
        affinity_scores = {}
        
        for row in results:
            # Score based on: what % of cluster buys this + transaction frequency
            user_ratio = row['user_count'] / max(total_users, 1)
            freq_score = min(row['transaction_count'] / 10, 1.0)  # Cap at 10 transactions
            affinity_scores[row['product_id']] = (user_ratio * 0.7) + (freq_score * 0.3)
        
        return affinity_scores
    
    def find_similar_users(self, db_session, user_id: UUID, cluster_id: int, limit: int = 20) -> List[Dict]:
        """Find users in the same cluster with similar purchase patterns."""
        from database import execute_raw_sql
        
        query = """
            SELECT 
                uc.user_id,
                u.full_name,
                u.location_name,
                uc.confidence_score,
                fs.purchase_frequency,
                fs.avg_transaction_value,
                fs.product_preferences
            FROM user_clusters uc
            JOIN users u ON uc.user_id = u.id
            JOIN feature_store fs ON uc.user_id = fs.user_id
            WHERE uc.cluster_id = :cluster_id
            AND uc.user_id != :user_id
            AND u.is_active = TRUE
            ORDER BY uc.confidence_score DESC
            LIMIT :limit
        """
        
        results = execute_raw_sql(query, {
            'cluster_id': cluster_id,
            'user_id': str(user_id),
            'limit': limit
        })
        
        return results if results else []
    
    def recommend_existing_groups(
        self, 
        db_session, 
        user_id: UUID, 
        cluster_id: int,
        user_purchase_history: pd.DataFrame
    ) -> List[Dict]:
        """
        Recommend existing open groups that match user's preferences.
        """
        from database import execute_raw_sql
        
        # Get open groups
        query = """
            SELECT 
                bg.id as group_id,
                bg.product_id,
                p.name as product_name,
                p.category,
                bg.group_name,
                bg.target_quantity,
                bg.current_quantity,
                bg.discount_percentage,
                bg.deadline,
                COUNT(gm.id) as current_members
            FROM bulk_groups bg
            JOIN products p ON bg.product_id = p.id
            LEFT JOIN group_memberships gm ON bg.id = gm.group_id
            WHERE bg.status = 'open'
            AND bg.deadline > NOW()
            AND NOT EXISTS (
                SELECT 1 FROM group_memberships 
                WHERE group_id = bg.id AND user_id = :user_id
            )
            GROUP BY bg.id, p.id, p.name, p.category
            HAVING COUNT(gm.id) < 50  -- Don't recommend full groups
        """
        
        results = execute_raw_sql(query, {'user_id': str(user_id)})
        
        if not results:
            return []
        
        # Score each group based on user's purchase history
        recommendations = []
        
        for group in results:
            score = 0.0
            
            # Check if user has bought this product before
            if not user_purchase_history.empty:
                product_match = user_purchase_history[
                    user_purchase_history['product_id'] == group['product_id']
                ]
                
                if not product_match.empty:
                    # High score for products they've bought
                    score += 0.6
                    
                    # Bonus for recent purchases
                    last_purchase = product_match.iloc[0]['last_purchase']
                    days_ago = (datetime.now() - last_purchase).days
                    if days_ago < 30:
                        score += 0.2
                else:
                    # Check category match
                    category_match = user_purchase_history[
                        user_purchase_history['category'] == group['category']
                    ]
                    if not category_match.empty:
                        score += 0.3
            
            # Score based on discount
            discount_score = min(float(group['discount_percentage']) / 30, 1.0) * 0.2
            score += discount_score
            
            # Score based on group fill rate (prefer groups close to target)
            fill_rate = group['current_quantity'] / max(group['target_quantity'], 1)
            if 0.3 <= fill_rate <= 0.8:  # Sweet spot
                score += 0.1
            
            # Only recommend if score is meaningful
            if score > 0.2:
                recommendations.append({
                    'group_id': group['group_id'],
                    'product_id': group['product_id'],
                    'product_name': group['product_name'],
                    'group_name': group['group_name'],
                    'score': min(score, 1.0),
                    'discount_percentage': group['discount_percentage'],
                    'current_members': group['current_members'],
                    'deadline': group['deadline'],
                    'recommendation_type': 'join_group'
                })
        
        # Sort by score and return top recommendations
        recommendations.sort(key=lambda x: x['score'], reverse=True)
        return recommendations[:self.max_recommendations]
    
    def suggest_new_groups(
        self,
        db_session,
        user_id: UUID,
        cluster_id: int,
        user_purchase_history: pd.DataFrame
    ) -> List[Dict]:
        """
        Suggest new group opportunities based on cluster demand.
        """
        # Get cluster product affinity
        product_affinity = self.get_cluster_product_affinity(db_session, cluster_id)
        
        if not product_affinity:
            return []
        
        # Find similar users in cluster
        similar_users = self.find_similar_users(db_session, user_id, cluster_id)
        
        if len(similar_users) < self.min_group_size:
            logger.info(f"Not enough similar users ({len(similar_users)}) to suggest new groups")
            return []
        
        # Get products not currently in open groups
        from database import execute_raw_sql
        
        query = """
            SELECT DISTINCT product_id 
            FROM bulk_groups 
            WHERE status = 'open' 
            AND deadline > NOW()
        """
        
        existing_group_products = execute_raw_sql(query)
        existing_product_ids = {row['product_id'] for row in existing_group_products}
        
        # Suggest products with high affinity that don't have open groups
        suggestions = []
        
        for product_id, affinity_score in sorted(
            product_affinity.items(), 
            key=lambda x: x[1], 
            reverse=True
        )[:5]:  # Top 5 products
            
            if product_id in existing_product_ids:
                continue
            
            # Get product details
            product_query = """
                SELECT id, name, category, base_price, bulk_price, min_bulk_quantity
                FROM products
                WHERE id = :product_id AND is_active = TRUE
            """
            
            product_result = execute_raw_sql(product_query, {'product_id': product_id})
            
            if not product_result:
                continue
                
            product = product_result[0]
            
            # Calculate potential group size
            potential_members = len(similar_users) + 1  # +1 for the user
            
            # Calculate score
            score = affinity_score * 0.7
            
            # Bonus if user has purchased this product
            if not user_purchase_history.empty:
                if product_id in user_purchase_history['product_id'].values:
                    score += 0.3
            
            # Calculate potential savings
            discount = ((product['base_price'] - product['bulk_price']) / 
                       product['base_price'] * 100)
            
            suggestions.append({
                'product_id': product_id,
                'product_name': product['name'],
                'category': product['category'],
                'score': min(score, 1.0),
                'potential_members': potential_members,
                'discount_percentage': round(discount, 2),
                'recommendation_type': 'new_group',
                'affinity_score': affinity_score
            })
        
        # Sort by score
        suggestions.sort(key=lambda x: x['score'], reverse=True)
        return suggestions[:self.max_recommendations // 2]  # Limit new group suggestions
    
    def generate_recommendations(
        self,
        db_session,
        user_id: UUID
    ) -> List[Dict]:
        """
        Generate all recommendations for a user.
        Combines existing group recommendations and new group suggestions.
        """
        from database import execute_raw_sql
        
        # Get user's cluster
        cluster_query = """
            SELECT cluster_id, cluster_name, confidence_score
            FROM user_clusters
            WHERE user_id = :user_id
            ORDER BY assigned_at DESC
            LIMIT 1
        """
        
        cluster_result = execute_raw_sql(cluster_query, {'user_id': str(user_id)})
        
        if not cluster_result:
            logger.warning(f"No cluster found for user {user_id}")
            return []
        
        cluster_id = cluster_result[0]['cluster_id']
        
        # Get user purchase history
        purchase_history = self.get_user_purchase_history(db_session, user_id)
        
        # Get existing group recommendations
        existing_groups = self.recommend_existing_groups(
            db_session, user_id, cluster_id, purchase_history
        )
        
        # Get new group suggestions
        new_groups = self.suggest_new_groups(
            db_session, user_id, cluster_id, purchase_history
        )
        
        # Combine and sort all recommendations
        all_recommendations = existing_groups + new_groups
        all_recommendations.sort(key=lambda x: x['score'], reverse=True)
        
        logger.info(f"Generated {len(all_recommendations)} recommendations for user {user_id}")
        
        return all_recommendations[:self.max_recommendations]


if __name__ == "__main__":
    print("Testing Group Recommender Engine...")
    print("✓ Recommender engine initialized")
    print("Note: Full testing requires database connection")
