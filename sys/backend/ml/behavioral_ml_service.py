"""
Behavioral ML Service - Phase 1-4 Implementation
Integrates behavioral analytics with recommendation models
"""

from sqlalchemy.orm import Session
from sqlalchemy import func, desc
from typing import List, Dict, Optional, Tuple
from datetime import datetime, timedelta
from collections import defaultdict
import numpy as np
import pandas as pd
from sklearn.preprocessing import MinMaxScaler
import logging

import sys
import os
sys.path.append(os.path.dirname(os.path.dirname(os.path.abspath(__file__))))

from models.analytics_models import EventsRaw, UserBehaviorFeatures, SessionMetrics
from models.models import User, Product, GroupBuy, Transaction, Contribution

logger = logging.getLogger(__name__)

# ============================================================================
# PHASE 1: Basic Integration - Implicit Ratings & Feature Extraction
# ============================================================================

class BehavioralFeatureExtractor:
    """Extract ML features from behavioral analytics data"""
    
    # Behavior weight mapping (stronger signal = higher weight)
    BEHAVIOR_WEIGHTS = {
        "purchase_completed": 10.0,
        "group_join_complete": 9.0,
        "payment_success": 8.0,
        "cart_checkout": 7.0,
        "add_to_cart": 6.0,
        "group_join_click": 5.0,
        "rating_submitted": 4.0,
        "wishlist_add": 3.0,
        "product_view": 2.0,
        "group_view": 2.0,
        "product_search": 1.5,
        "page_view": 1.0,
        "group_leave": -3.0,
        "cart_remove": -2.0,
        "wishlist_remove": -1.0
    }
    
    def __init__(self, db: Session):
        self.db = db
        self.scaler = MinMaxScaler()
    
    def calculate_implicit_rating(
        self, 
        user_id: int, 
        product_id: int,
        time_decay_days: int = 30
    ) -> float:
        """
        Calculate implicit rating (0-5) from behavioral signals
        Uses time decay: recent events matter more
        """
        try:
            # Get all events for this user-product pair
            events = self.db.query(EventsRaw).filter(
                EventsRaw.user_id == user_id
            ).all()
            
            if not events:
                return 0.0
            
            score = 0.0
            for event in events:
                # Check if event relates to this product
                props = event.properties or {}
                event_product_id = props.get('product_id') or props.get('group_id')
                
                if event_product_id != product_id:
                    continue
                
                # Get behavior weight
                weight = self.BEHAVIOR_WEIGHTS.get(event.event_type, 0)
                
                # Apply time decay (exponential decay with specified half-life)
                days_old = (datetime.now() - event.timestamp).days
                decay_factor = np.exp(-days_old / time_decay_days)
                
                # Accumulate weighted score
                score += weight * decay_factor
            
            # Normalize to 0-5 scale (10 points = 5 stars)
            implicit_rating = min(5.0, max(0.0, score / 2))
            
            return implicit_rating
        except Exception as e:
            logger.error(f"Error calculating implicit rating: {e}")
            return 0.0
    
    def extract_user_features(
        self, 
        user_id: int, 
        window_days: int = 30
    ) -> Dict[str, float]:
        """
        Extract comprehensive behavioral features for a user
        Returns dictionary of features for ML models
        """
        try:
            cutoff_date = datetime.now() - timedelta(days=window_days)
            
            # Get events in window
            events = self.db.query(EventsRaw).filter(
                EventsRaw.user_id == user_id,
                EventsRaw.timestamp >= cutoff_date
            ).all()
            
            if not events:
                return self._default_features()
            
            # Count events by type
            event_counts = defaultdict(int)
            for event in events:
                event_counts[event.event_type] += 1
            
            # Extract product interactions
            product_ids = set()
            group_ids = set()
            categories = []
            
            for event in events:
                props = event.properties or {}
                if 'product_id' in props:
                    product_ids.add(props['product_id'])
                if 'group_id' in props:
                    group_ids.add(props['group_id'])
                if 'category' in props:
                    categories.append(props['category'])
            
            # Calculate conversion rates
            views = event_counts.get('group_view', 0) + event_counts.get('product_view', 0)
            clicks = event_counts.get('group_join_click', 0)
            joins = event_counts.get('group_join_complete', 0)
            purchases = event_counts.get('purchase_completed', 0)
            
            view_to_click = clicks / max(1, views)
            click_to_join = joins / max(1, clicks)
            join_to_purchase = purchases / max(1, joins)
            
            # Temporal features
            timestamps = [e.timestamp for e in events]
            hours = [t.hour for t in timestamps]
            days = [t.weekday() for t in timestamps]
            
            peak_hour = max(set(hours), key=hours.count) if hours else 12
            peak_day = max(set(days), key=days.count) if days else 0
            
            # Category diversity (entropy)
            if categories:
                category_counts = pd.Series(categories).value_counts(normalize=True)
                category_entropy = -sum(p * np.log(p + 1e-10) for p in category_counts)
            else:
                category_entropy = 0.0
            
            features = {
                # Activity metrics
                "total_events": len(events),
                "unique_products": len(product_ids),
                "unique_groups": len(group_ids),
                "events_per_day": len(events) / window_days,
                
                # Engagement metrics
                "purchases": purchases,
                "cart_adds": event_counts.get('add_to_cart', 0),
                "product_views": event_counts.get('product_view', 0),
                "group_views": event_counts.get('group_view', 0),
                "group_joins": joins,
                "searches": event_counts.get('product_search', 0),
                
                # Conversion metrics
                "view_to_click_rate": view_to_click,
                "click_to_join_rate": click_to_join,
                "join_to_purchase_rate": join_to_purchase,
                "overall_conversion_rate": purchases / max(1, views),
                
                # Temporal patterns
                "peak_activity_hour": peak_hour,
                "peak_activity_day": peak_day,
                "is_weekend_shopper": int(peak_day >= 5),
                
                # Category behavior
                "category_diversity": category_entropy,
                "categories_explored": len(set(categories)),
                
                # Recency
                "days_since_last_event": (datetime.now() - max(timestamps)).days,
                "recency_score": 1.0 / (1.0 + (datetime.now() - max(timestamps)).days)
            }
            
            return features
        except Exception as e:
            logger.error(f"Error extracting user features: {e}")
            return self._default_features()
    
    def _default_features(self) -> Dict[str, float]:
        """Default features for users with no behavioral data"""
        return {
            "total_events": 0, "unique_products": 0, "unique_groups": 0,
            "events_per_day": 0, "purchases": 0, "cart_adds": 0,
            "product_views": 0, "group_views": 0, "group_joins": 0,
            "searches": 0, "view_to_click_rate": 0.0,
            "click_to_join_rate": 0.0, "join_to_purchase_rate": 0.0,
            "overall_conversion_rate": 0.0, "peak_activity_hour": 12,
            "peak_activity_day": 0, "is_weekend_shopper": 0,
            "category_diversity": 0.0, "categories_explored": 0,
            "days_since_last_event": 999, "recency_score": 0.0
        }
    
    def build_interaction_matrix_with_behavior(
        self,
        user_ids: List[int],
        product_ids: List[int]
    ) -> np.ndarray:
        """
        Build user-product interaction matrix combining:
        - Explicit ratings (if available)
        - Implicit ratings from behavioral data
        """
        n_users = len(user_ids)
        n_products = len(product_ids)
        
        user_id_map = {uid: idx for idx, uid in enumerate(user_ids)}
        product_id_map = {pid: idx for idx, pid in enumerate(product_ids)}
        
        # Initialize matrix
        interaction_matrix = np.zeros((n_users, n_products))
        
        logger.info(f"Building interaction matrix: {n_users} users x {n_products} products")
        
        # Add explicit ratings (from transactions/reviews)
        for user_id in user_ids:
            transactions = self.db.query(Transaction).filter(
                Transaction.user_id == user_id,
                Transaction.product_id.in_(product_ids)
            ).all()
            
            for txn in transactions:
                i = user_id_map[user_id]
                j = product_id_map[txn.product_id]
                # Use quantity as explicit rating (normalize later)
                interaction_matrix[i, j] = min(5.0, txn.quantity / 2)
        
        # Add implicit ratings from behavioral data
        for user_id in user_ids:
            for product_id in product_ids:
                i = user_id_map[user_id]
                j = product_id_map[product_id]
                
                # Skip if explicit rating exists
                if interaction_matrix[i, j] > 0:
                    continue
                
                # Calculate implicit rating
                implicit_rating = self.calculate_implicit_rating(user_id, product_id)
                
                if implicit_rating > 0:
                    interaction_matrix[i, j] = implicit_rating
        
        # Log sparsity
        sparsity = 1.0 - (np.count_nonzero(interaction_matrix) / interaction_matrix.size)
        logger.info(f"Interaction matrix sparsity: {sparsity:.2%}")
        
        return interaction_matrix


# ============================================================================
# PHASE 2: Content-Based Enhancement with Behavioral Features
# ============================================================================

class BehavioralContentFilter:
    """Enhance content-based filtering with behavioral signals"""
    
    def __init__(self, db: Session):
        self.db = db
        self.feature_extractor = BehavioralFeatureExtractor(db)
    
    def build_user_profile_with_behavior(
        self,
        user_id: int
    ) -> Dict[str, any]:
        """
        Build enhanced user profile combining:
        - Static preferences (from user model)
        - Dynamic behavior (from analytics)
        """
        try:
            user = self.db.query(User).get(user_id)
            if not user:
                return {}
            
            # Get behavioral features
            behavioral_features = self.feature_extractor.extract_user_features(user_id)
            
            # Get category preferences from behavior
            category_events = self.db.query(EventsRaw).filter(
                EventsRaw.user_id == user_id,
                EventsRaw.event_type.in_(['group_view', 'product_view', 'group_join_complete'])
            ).all()
            
            category_scores = defaultdict(float)
            for event in category_events:
                props = event.properties or {}
                if 'category' in props:
                    category = props['category']
                    # Weight by event type
                    weight = self.feature_extractor.BEHAVIOR_WEIGHTS.get(event.event_type, 1.0)
                    category_scores[category] += weight
            
            # Sort categories by score
            top_categories = sorted(
                category_scores.items(),
                key=lambda x: x[1],
                reverse=True
            )[:5]
            
            profile = {
                "user_id": user_id,
                "static_preferences": {
                    "preferred_categories": user.preferred_categories or [],
                    "budget_range": getattr(user, 'budget_range', 'medium'),
                    "experience_level": getattr(user, 'experience_level', 'intermediate'),
                    "location_zone": getattr(user, 'location_zone', 'default')
                },
                "behavioral_preferences": {
                    "top_categories": [cat for cat, _ in top_categories],
                    "category_scores": dict(top_categories),
                    "engagement_level": behavioral_features['total_events'],
                    "purchase_frequency": behavioral_features['purchases'],
                    "browse_behavior": behavioral_features['product_views'],
                    "conversion_rate": behavioral_features['overall_conversion_rate']
                },
                "behavioral_features": behavioral_features
            }
            
            return profile
        except Exception as e:
            logger.error(f"Error building user profile: {e}")
            return {}
    
    def calculate_content_similarity_with_behavior(
        self,
        user_profile: Dict,
        group_buy: GroupBuy
    ) -> float:
        """
        Calculate content similarity considering:
        - Static profile match
        - Behavioral preferences
        - Temporal patterns
        """
        if not user_profile or not group_buy.product:
            return 0.0
        
        try:
            score = 0.0
            
            # 1. Category match (40% weight)
            product_category = group_buy.product.category
            static_prefs = user_profile['static_preferences']['preferred_categories']
            behavioral_prefs = user_profile['behavioral_preferences']['top_categories']
            
            if product_category in static_prefs:
                score += 0.2
            if product_category in behavioral_prefs:
                score += 0.2
            
            # 2. Price sensitivity match (30% weight)
            budget_range = user_profile['static_preferences']['budget_range']
            product_price = group_buy.product.bulk_price
            
            if budget_range == 'low' and product_price < 20:
                score += 0.3
            elif budget_range == 'medium' and 20 <= product_price < 50:
                score += 0.3
            elif budget_range == 'high' and product_price >= 50:
                score += 0.3
            
            # 3. Engagement match (20% weight)
            conversion_rate = user_profile['behavioral_preferences']['conversion_rate']
            moq_progress = group_buy.moq_progress / 100.0
            
            # High converters prefer nearly-complete groups
            if conversion_rate > 0.5 and moq_progress > 0.7:
                score += 0.2
            # Low converters prefer new groups
            elif conversion_rate < 0.2 and moq_progress < 0.3:
                score += 0.2
            
            # 4. Recency boost (10% weight)
            recency_score = user_profile['behavioral_features']['recency_score']
            score += 0.1 * recency_score
            
            return min(1.0, score)
        except Exception as e:
            logger.error(f"Error calculating content similarity: {e}")
            return 0.0


# ============================================================================
# PHASE 3: Sequential Pattern Mining & Session-Based Recommendations
# ============================================================================

class SequentialPatternMiner:
    """Mine sequential browsing patterns for next-item prediction"""
    
    def __init__(self, db: Session):
        self.db = db
    
    def extract_user_sequences(
        self,
        user_id: int,
        sequence_length: int = 5
    ) -> List[List[int]]:
        """Extract product view sequences"""
        try:
            events = self.db.query(EventsRaw).filter(
                EventsRaw.user_id == user_id,
                EventsRaw.event_type.in_(['product_view', 'group_view'])
            ).order_by(EventsRaw.timestamp).all()
            
            # Extract product IDs
            product_sequence = []
            for event in events:
                props = event.properties or {}
                if 'product_id' in props:
                    product_sequence.append(props['product_id'])
            
            # Create sliding windows
            sequences = []
            for i in range(len(product_sequence) - sequence_length + 1):
                seq = product_sequence[i:i + sequence_length]
                sequences.append(seq)
            
            return sequences
        except Exception as e:
            logger.error(f"Error extracting sequences: {e}")
            return []
    
    def find_next_likely_products(
        self,
        user_id: int,
        recent_views: List[int],
        top_k: int = 10
    ) -> List[Tuple[int, float]]:
        """Predict next likely products based on sequence patterns"""
        try:
            if not recent_views:
                return []
            
            # Get all users' sequences (sample for performance)
            all_users = self.db.query(User.id).limit(200).all()
            user_ids = [u.id for u in all_users]
            
            # Find matching patterns
            next_products = defaultdict(int)
            
            for uid in user_ids:
                sequences = self.extract_user_sequences(uid, len(recent_views) + 1)
                
                for seq in sequences:
                    if len(seq) > len(recent_views):
                        # Check if prefix matches recent views
                        if seq[:-1] == recent_views:
                            next_product = seq[-1]
                            next_products[next_product] += 1
            
            # Normalize to probabilities
            total = sum(next_products.values())
            if total == 0:
                return []
            
            probabilities = [
                (pid, count / total)
                for pid, count in next_products.items()
            ]
            
            # Sort by probability and return top-k
            probabilities.sort(key=lambda x: x[1], reverse=True)
            return probabilities[:top_k]
        except Exception as e:
            logger.error(f"Error finding next products: {e}")
            return []


class SessionBasedRecommender:
    """Recommend based on current session behavior"""
    
    def __init__(self, db: Session):
        self.db = db
    
    def get_session_context(
        self,
        session_id: str
    ) -> Dict[str, any]:
        """Get context from current session"""
        try:
            events = self.db.query(EventsRaw).filter(
                EventsRaw.session_id == session_id
            ).order_by(EventsRaw.timestamp).all()
            
            if not events:
                return {}
            
            viewed_products = []
            viewed_categories = []
            viewed_groups = []
            
            for event in events:
                props = event.properties or {}
                if 'product_id' in props:
                    viewed_products.append(props['product_id'])
                if 'category' in props:
                    viewed_categories.append(props['category'])
                if 'group_id' in props:
                    viewed_groups.append(props['group_id'])
            
            return {
                "session_id": session_id,
                "duration": (events[-1].timestamp - events[0].timestamp).seconds,
                "event_count": len(events),
                "viewed_products": viewed_products,
                "viewed_categories": viewed_categories,
                "viewed_groups": viewed_groups,
                "last_category": viewed_categories[-1] if viewed_categories else None,
                "session_intent": self._infer_intent(events)
            }
        except Exception as e:
            logger.error(f"Error getting session context: {e}")
            return {}
    
    def _infer_intent(self, events: List[EventsRaw]) -> str:
        """Infer user intent from session events"""
        event_types = [e.event_type for e in events]
        
        if 'purchase_completed' in event_types:
            return 'transactional'
        elif 'product_search' in event_types or 'filter_applied' in event_types:
            return 'research'
        elif event_types.count('group_view') > 5:
            return 'browsing'
        elif 'add_to_cart' in event_types:
            return 'consideration'
        else:
            return 'exploratory'
    
    def recommend_for_session(
        self,
        session_id: str,
        limit: int = 10
    ) -> List[Dict]:
        """Recommend products based on current session"""
        try:
            context = self.get_session_context(session_id)
            
            if not context:
                return []
            
            # Get recommendations based on last viewed category
            if context.get('last_category'):
                popular = self.db.query(Product).filter(
                    Product.category == context['last_category'],
                    Product.is_active == True
                ).limit(limit).all()
                
                return [{"product_id": p.id, "reason": f"Popular in {context['last_category']}"} for p in popular]
            
            return []
        except Exception as e:
            logger.error(f"Error recommending for session: {e}")
            return []


# ============================================================================
# PHASE 4: Real-Time Updates
# ============================================================================

class RealTimeUpdater:
    """Update recommendations in real-time based on user actions"""
    
    def __init__(self, db: Session):
        self.db = db
    
    def update_on_interaction(
        self,
        user_id: int,
        product_id: int,
        interaction_type: str
    ):
        """Update user features immediately on interaction"""
        try:
            # Get or create user features
            features = self.db.query(UserBehaviorFeatures).filter(
                UserBehaviorFeatures.user_id == user_id
            ).first()
            
            if not features:
                features = UserBehaviorFeatures(user_id=user_id)
                self.db.add(features)
            
            # Update based on interaction type
            if interaction_type == 'view':
                features.total_group_views = (features.total_group_views or 0) + 1
            elif interaction_type == 'click':
                features.total_group_clicks = (features.total_group_clicks or 0) + 1
            elif interaction_type == 'join':
                features.total_joins = (features.total_joins or 0) + 1
            elif interaction_type == 'purchase':
                features.total_payments = (features.total_payments or 0) + 1
            
            # Recalculate conversion rates
            if features.total_group_views and features.total_group_views > 0:
                features.browse_to_click_rate = (features.total_group_clicks or 0) / features.total_group_views
            if features.total_group_clicks and features.total_group_clicks > 0:
                features.click_to_join_rate = (features.total_joins or 0) / features.total_group_clicks
            
            # Update engagement score (0-1)
            features.engagement_score = min(1.0, (
                (features.total_group_views or 0) * 0.1 +
                (features.total_group_clicks or 0) * 0.3 +
                (features.total_joins or 0) * 0.6
            ) / 100)
            
            features.last_updated = datetime.now()
            
            self.db.commit()
        except Exception as e:
            logger.error(f"Error updating interaction: {e}")
            self.db.rollback()


# ============================================================================
# Main Behavioral ML Service
# ============================================================================

class BehavioralMLService:
    """Complete behavioral ML service integrating all phases"""
    
    def __init__(self, db: Session):
        self.db = db
        self.feature_extractor = BehavioralFeatureExtractor(db)
        self.content_filter = BehavioralContentFilter(db)
        self.sequential_miner = SequentialPatternMiner(db)
        self.session_recommender = SessionBasedRecommender(db)
        self.realtime_updater = RealTimeUpdater(db)
    
    def get_enhanced_recommendations(
        self,
        user_id: int,
        session_id: Optional[str] = None,
        limit: int = 10,
        weights: Optional[Dict[str, float]] = None
    ) -> List[Dict]:
        """Get recommendations using all behavioral enhancements"""
        try:
            # Default weights
            if weights is None:
                weights = {
                    'content': 0.5,
                    'sequential': 0.3,
                    'session': 0.2
                }
            
            # Get user profile with behavior
            user_profile = self.content_filter.build_user_profile_with_behavior(user_id)
            
            if not user_profile:
                return []
            
            # Get available groups
            active_groups = self.db.query(GroupBuy).filter(
                GroupBuy.status == 'active',
                GroupBuy.deadline > datetime.now()
            ).all()
            
            recommendations = []
            
            for group in active_groups:
                score = 0.0
                reasons = []
                
                # 1. Content-based score (with behavioral enhancement)
                content_score = self.content_filter.calculate_content_similarity_with_behavior(
                    user_profile, group
                )
                score += weights['content'] * content_score
                if content_score > 0.5:
                    reasons.append("Matches your interests")
                
                # 2. Sequential pattern score
                recent_views = []
                if user_profile.get('behavioral_features'):
                    # Get recent product views
                    recent_events = self.db.query(EventsRaw).filter(
                        EventsRaw.user_id == user_id,
                        EventsRaw.event_type.in_(['product_view', 'group_view'])
                    ).order_by(EventsRaw.timestamp.desc()).limit(5).all()
                    
                    for event in recent_events:
                        props = event.properties or {}
                        if 'product_id' in props:
                            recent_views.append(props['product_id'])
                    
                    if recent_views:
                        sequential_recs = self.sequential_miner.find_next_likely_products(
                            user_id, recent_views[:3], top_k=20
                        )
                        for prod_id, prob in sequential_recs:
                            if prod_id == group.product_id:
                                score += weights['sequential'] * prob
                                reasons.append("Based on your browsing pattern")
                                break
                
                # 3. Session-based score
                if session_id:
                    session_context = self.session_recommender.get_session_context(session_id)
                    if session_context.get('last_category') == group.product.category:
                        score += weights['session'] * 0.8
                        reasons.append("Relevant to your current search")
                
                recommendations.append({
                    "group_buy_id": group.id,
                    "product_id": group.product_id,
                    "product_name": group.product.name,
                    "recommendation_score": score,
                    "reasons": reasons,
                    "weights_used": weights,
                    "behavioral_enhanced": True
                })
            
            # Sort by score
            recommendations.sort(key=lambda x: x['recommendation_score'], reverse=True)
            
            return recommendations[:limit]
        except Exception as e:
            logger.error(f"Error getting enhanced recommendations: {e}")
            return []
    
    def track_interaction(
        self,
        user_id: int,
        product_id: int,
        interaction_type: str
    ):
        """Track user interaction for real-time updates"""
        self.realtime_updater.update_on_interaction(user_id, product_id, interaction_type)


# ============================================================================
# Utility Functions
# ============================================================================

def get_behavioral_ml_service(db: Session) -> BehavioralMLService:
    """Factory function to get behavioral ML service instance"""
    return BehavioralMLService(db)


def extract_behavioral_features_batch(
    user_ids: List[int],
    db: Session
) -> pd.DataFrame:
    """Extract behavioral features for multiple users (for batch training)"""
    extractor = BehavioralFeatureExtractor(db)
    
    features_list = []
    for user_id in user_ids:
        features = extractor.extract_user_features(user_id)
        features['user_id'] = user_id
        features_list.append(features)
    
    return pd.DataFrame(features_list)
