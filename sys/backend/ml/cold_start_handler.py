"""
Cold Start Handler for New Products
Provides intelligent recommendations for products not yet in the trained ML model
"""

from typing import Dict, List, Set, Tuple
from sqlalchemy.orm import Session
from models.models import User, Product, Transaction, GroupBuy
import numpy as np
from datetime import datetime
import logging
import random

logger = logging.getLogger(__name__)

# =============================================================================
# VARIED EXPLANATION TEMPLATES - Product-specific phrasings
# =============================================================================

CATEGORY_MATCH_TEMPLATES = [
    "You've bought {category} items before - {product_name} fits your style",
    "Since you shop {category}, {product_name} is a natural fit for you",
    "{product_name} matches your interest in {category} products",
    "Based on your {category} purchases, you'll love {product_name}",
    "Your {category} shopping history suggests {product_name} is right for you",
]

PRICE_MATCH_TEMPLATES = [
    "{product_name} at ${price:.2f} fits your usual budget",
    "Priced right for you - {product_name} is within your comfort zone",
    "{product_name} matches your typical spending at ${price:.2f}",
    "At ${price:.2f}, {product_name} aligns with what you usually spend",
]

GREAT_DEAL_TEMPLATES = [
    "{product_name} is a steal at this price",
    "Great value on {product_name} - below your usual spend",
    "{product_name} at a price you'll love",
    "Budget-friendly {product_name} deal",
]

NEW_PRODUCT_TEMPLATES = [
    "Fresh opportunity for {product_name}",
    "New {product_name} group just opened",
    "Be among the first to join {product_name}",
    "{product_name} is newly available",
]

PROGRESS_TEMPLATES = [
    "{product_name} group is {progress:.0f}% there - join now",
    "Almost at target for {product_name}",
    "Help complete the {product_name} group",
]

URGENCY_TEMPLATES = [
    "{product_name} ends soon - don't miss out",
    "Last chance for {product_name}",
    "Hurry! {product_name} closing soon",
]

SAVINGS_TEMPLATES = [
    "Save {pct:.0f}% on {product_name}",
    "{product_name} at {pct:.0f}% off - great group deal",
    "Get {product_name} at {pct:.0f}% below retail",
]


def _pick_template(templates: List[str], **kwargs) -> str:
    """Pick a random template and format it with the given kwargs."""
    template = random.choice(templates)
    try:
        return template.format(**kwargs)
    except KeyError:
        # If some kwargs are missing, try to format with available ones
        for t in templates:
            try:
                return t.format(**kwargs)
            except KeyError:
                continue
        return templates[0]


class ColdStartHandler:
    """Handle recommendations for new products not in the trained model"""
    
    def __init__(self):
        self.user_profile_cache = {}
        
    def detect_new_products(
        self, 
        product_ids: List[int], 
        feature_store: Dict
    ) -> Set[int]:
        """
        Identify products not in the trained model
        
        Args:
            product_ids: List of product IDs to check
            feature_store: Dictionary containing trained model data
            
        Returns:
            Set of product IDs not in the trained model
        """
        trained_product_ids = set(feature_store.get('product_ids', []))
        all_product_ids = set(product_ids)
        new_products = all_product_ids - trained_product_ids
        
        if new_products:
            logger.info(f"[COLD START] Detected {len(new_products)} new products not in trained model")
        
        return new_products
    
    def get_user_profile(
        self, 
        user: User, 
        db: Session
    ) -> Dict:
        """
        Build user profile from purchase history for cold start scoring
        
        Returns:
            Dict with user preferences including:
            - preferred_categories: Top 3 categories with scores
            - price_range: min, avg, max prices user typically purchases
            - avg_quantity: typical purchase quantity
            - purchase_frequency: by category
        """
        # Check cache first
        cache_key = f"user_{user.id}"
        if cache_key in self.user_profile_cache:
            cached_profile = self.user_profile_cache[cache_key]
            # Cache valid for 1 hour
            if (datetime.utcnow() - cached_profile['cached_at']).seconds < 3600:
                return cached_profile
        
        # Build profile from transactions
        transactions = db.query(Transaction).filter(
            Transaction.user_id == user.id
        ).all()
        
        if not transactions:
            # New user - use preferences if available
            profile = {
                'preferred_categories': user.preferred_categories or [],
                'price_range': {'min': 0, 'avg': 50, 'max': 200},
                'avg_quantity': 10,
                'purchase_frequency': {},
                'total_transactions': 0,
                'cached_at': datetime.utcnow()
            }
            self.user_profile_cache[cache_key] = profile
            return profile
        
        # Analyze transactions
        product_ids = [tx.product_id for tx in transactions]
        products = db.query(Product).filter(Product.id.in_(product_ids)).all()
        product_map = {p.id: p for p in products}
        
        # Category frequency
        category_freq = {}
        prices = []
        quantities = []
        
        for tx in transactions:
            product = product_map.get(tx.product_id)
            if product and product.category:
                category_freq[product.category] = category_freq.get(product.category, 0) + 1
                prices.append(tx.amount / tx.quantity if tx.quantity > 0 else product.bulk_price)
                quantities.append(tx.quantity)
        
        # Sort categories by frequency
        sorted_categories = sorted(
            category_freq.items(), 
            key=lambda x: x[1], 
            reverse=True
        )
        
        # Calculate category scores (normalized)
        total_purchases = sum(category_freq.values())
        preferred_categories = [
            {
                'category': cat,
                'score': count / total_purchases,
                'purchases': count
            }
            for cat, count in sorted_categories[:5]
        ]
        
        # Price analysis
        price_range = {
            'min': float(np.percentile(prices, 10)) if prices else 0,
            'avg': float(np.mean(prices)) if prices else 50,
            'max': float(np.percentile(prices, 90)) if prices else 200
        }
        
        profile = {
            'preferred_categories': preferred_categories,
            'price_range': price_range,
            'avg_quantity': float(np.mean(quantities)) if quantities else 10,
            'purchase_frequency': category_freq,
            'total_transactions': len(transactions),
            'cached_at': datetime.utcnow()
        }
        
        self.user_profile_cache[cache_key] = profile
        return profile
    
    def calculate_category_score(
        self, 
        user_profile: Dict, 
        product: Product
    ) -> Tuple[float, str]:
        """
        Calculate score based on category matching
        
        Returns:
            Tuple of (score, reason)
        """
        if not product.category:
            return 0.0, ""
        
        preferred_categories = user_profile.get('preferred_categories', [])
        
        if not preferred_categories:
            return 0.0, ""
        
        # Check if product category matches user's preferences
        for i, cat_info in enumerate(preferred_categories):
            if isinstance(cat_info, dict):
                category = cat_info.get('category')
                score = cat_info.get('score', 0)
            else:
                category = cat_info
                score = 1.0 / (i + 1)  # Decreasing score for lower priority
            
            if category == product.category:
                # Use varied template instead of uniform reason
                reason = _pick_template(CATEGORY_MATCH_TEMPLATES,
                    product_name=product.name,
                    category=category)
                # Higher score for top categories
                category_score = 0.3 * score if isinstance(cat_info, dict) else 0.3 / (i + 1)
                return category_score, reason
        
        return 0.0, ""
    
    def calculate_price_similarity(
        self, 
        user_profile: Dict, 
        product: Product
    ) -> Tuple[float, str]:
        """
        Calculate score based on price similarity to user's typical range
        
        Returns:
            Tuple of (score, reason)
        """
        price_range = user_profile.get('price_range', {})
        product_price = product.bulk_price or product.unit_price
        
        if not product_price or not price_range:
            return 0.0, ""
        
        avg_price = price_range.get('avg', 50)
        min_price = price_range.get('min', 0)
        max_price = price_range.get('max', 200)
        
        # Check if price is in user's typical range
        if min_price <= product_price <= max_price:
            # Calculate how close to average
            if avg_price > 0:
                deviation = abs(product_price - avg_price) / avg_price
                # Score decreases with deviation from average
                price_score = 0.2 * (1 - min(deviation, 1.0))
                
                if price_score > 0.05:
                    reason = _pick_template(PRICE_MATCH_TEMPLATES,
                        product_name=product.name,
                        price=product_price)
                else:
                    reason = ""
                
                return price_score, reason
        elif product_price < min_price:
            # Good deal!
            reason = _pick_template(GREAT_DEAL_TEMPLATES, product_name=product.name)
            return 0.15, reason
        
        return 0.0, ""
    
    def calculate_metadata_score(
        self, 
        product: Product,
        user_profile: Dict
    ) -> Tuple[float, str]:
        """
        Calculate score based on product metadata (description, features)
        
        Returns:
            Tuple of (score, reason)
        """
        # Basic metadata scoring
        score = 0.0
        reasons = []
        
        # Popular categories get small boost
        category_freq = user_profile.get('purchase_frequency', {})
        if product.category and product.category in category_freq:
            score += 0.05
        
        # Products with good descriptions
        if product.description and len(product.description) > 50:
            score += 0.05
            reasons.append("detailed description")
        
        # Active products
        if product.is_active:
            score += 0.05
        
        reason = ", ".join(reasons) if reasons else ""
        return score, reason
    
    def calculate_cold_start_score(
        self, 
        user: User, 
        product: Product, 
        group_buy: GroupBuy,
        db: Session
    ) -> Dict:
        """
        Calculate comprehensive cold start score for a new product
        
        Returns:
            Dict with score and detailed breakdown
        """
        # Get user profile
        user_profile = self.get_user_profile(user, db)
        
        # Calculate component scores
        category_score, category_reason = self.calculate_category_score(user_profile, product)
        price_score, price_reason = self.calculate_price_similarity(user_profile, product)
        metadata_score, metadata_reason = self.calculate_metadata_score(product, user_profile)
        
        # Base score for being an active group buy
        base_score = 0.5
        
        # Combine scores
        total_score = base_score + category_score + price_score + metadata_score
        
        # Add group buy dynamics bonuses (same as regular recommendations)
        moq_progress = group_buy.moq_progress if hasattr(group_buy, 'moq_progress') else 0
        if moq_progress >= 75:
            total_score += 0.1
        elif moq_progress >= 50:
            total_score += 0.05
        
        # Time pressure
        if group_buy.deadline:
            days_remaining = (group_buy.deadline - datetime.utcnow()).days
            if days_remaining <= 3:
                total_score += 0.05
        
        # Savings
        if product.unit_price and product.bulk_price:
            savings_pct = ((product.unit_price - product.bulk_price) / product.unit_price) * 100
            if savings_pct >= 20:
                total_score += 0.1
        
        # Cap at 1.0
        total_score = min(total_score, 1.0)
        
        # Build reason string with varied templates
        reasons = []
        
        # Primary reason - category or price match (most relevant)
        if category_reason:
            reasons.append(category_reason)
        elif price_reason:
            reasons.append(price_reason)
        else:
            # Fallback to new product template
            reasons.append(_pick_template(NEW_PRODUCT_TEMPLATES, product_name=product.name))
        
        # Secondary reasons
        if moq_progress >= 75:
            reasons.append(_pick_template(PROGRESS_TEMPLATES, 
                product_name=product.name, progress=moq_progress))
        if days_remaining <= 3:
            reasons.append(_pick_template(URGENCY_TEMPLATES, product_name=product.name))
        if product.unit_price and product.bulk_price:
            savings_pct = ((product.unit_price - product.bulk_price) / product.unit_price) * 100
            if savings_pct >= 15:
                reasons.append(_pick_template(SAVINGS_TEMPLATES, 
                    product_name=product.name, pct=savings_pct))
        
        return {
            'total_score': total_score,
            'reason': ". ".join(reasons),
            'breakdown': {
                'base': base_score,
                'category': category_score,
                'price': price_score,
                'metadata': metadata_score,
                'group_dynamics': total_score - (base_score + category_score + price_score + metadata_score)
            }
        }
    
    def clear_cache(self):
        """Clear the user profile cache"""
        self.user_profile_cache = {}
        logger.info("[COLD START] Profile cache cleared")
    
    def detect_new_admin_groups(
        self, 
        admin_group_ids: List[int], 
        feature_store: Dict
    ) -> Set[int]:
        """
        Identify admin groups not in the trained model
        
        Args:
            admin_group_ids: List of admin group IDs to check
            feature_store: Dictionary containing trained model data
            
        Returns:
            Set of admin group IDs not in the trained model
        """
        trained_admin_group_ids = set(feature_store.get('admin_group_ids', []))
        all_admin_group_ids = set(admin_group_ids)
        new_admin_groups = all_admin_group_ids - trained_admin_group_ids
        
        if new_admin_groups:
            logger.info(f"[COLD START] Detected {len(new_admin_groups)} new admin groups not in trained model")
        
        return new_admin_groups
    
    def calculate_admin_group_cold_start_score(
        self, 
        user: User, 
        admin_group, 
        db: Session
    ) -> Dict:
        """
        Calculate comprehensive cold start score for a new admin-created group
        
        Args:
            user: User to generate recommendations for
            admin_group: AdminGroup object (new group not in trained model)
            db: Database session
            
        Returns:
            Dict with score and detailed breakdown
        """
        from models.models import AdminGroup
        
        # Get user profile
        user_profile = self.get_user_profile(user, db)
        
        # Base score for being an active admin group
        base_score = 0.5
        
        # 1. Category Matching
        category_score = 0.0
        category_reason = ""
        
        if admin_group.category:
            preferred_categories = user_profile.get('preferred_categories', [])
            
            for i, cat_info in enumerate(preferred_categories):
                if isinstance(cat_info, dict):
                    category = cat_info.get('category')
                    score = cat_info.get('score', 0)
                else:
                    category = cat_info
                    score = 1.0 / (i + 1)
                
                if category == admin_group.category:
                    # Use varied template instead of uniform reason
                    category_reason = _pick_template(CATEGORY_MATCH_TEMPLATES,
                        product_name=admin_group.name,
                        category=category)
                    category_score = 0.3 * score if isinstance(cat_info, dict) else 0.3 / (i + 1)
                    break
        
        # 2. Price Similarity
        price_score = 0.0
        price_reason = ""
        
        if admin_group.price:
            price_range = user_profile.get('price_range', {})
            avg_price = price_range.get('avg', 50)
            min_price = price_range.get('min', 0)
            max_price = price_range.get('max', 200)
            
            if min_price <= admin_group.price <= max_price:
                if avg_price > 0:
                    deviation = abs(admin_group.price - avg_price) / avg_price
                    price_score = 0.2 * (1 - min(deviation, 1.0))
                    
                    if price_score > 0.05:
                        price_reason = _pick_template(PRICE_MATCH_TEMPLATES,
                            product_name=admin_group.name,
                            price=admin_group.price)
            elif admin_group.price < min_price:
                price_score = 0.15
                price_reason = _pick_template(GREAT_DEAL_TEMPLATES, 
                    product_name=admin_group.name)
        
        # 3. Group Dynamics
        dynamics_score = 0.0
        dynamics_reasons = []
        moq_progress = 0
        days_remaining = 999
        
        # Participation progress
        if admin_group.max_participants and admin_group.participants:
            moq_progress = (admin_group.participants / admin_group.max_participants) * 100
            if moq_progress >= 75:
                dynamics_score += 0.1
                dynamics_reasons.append(_pick_template(PROGRESS_TEMPLATES,
                    product_name=admin_group.name, progress=moq_progress))
            elif moq_progress >= 50:
                dynamics_score += 0.05
        
        # Time pressure
        if admin_group.end_date:
            days_remaining = (admin_group.end_date - datetime.utcnow()).days
            if days_remaining <= 3:
                dynamics_score += 0.05
                dynamics_reasons.append(_pick_template(URGENCY_TEMPLATES,
                    product_name=admin_group.name))
        
        # Savings
        if admin_group.discount_percentage and admin_group.discount_percentage >= 15:
            dynamics_score += 0.1 if admin_group.discount_percentage >= 20 else 0.05
            dynamics_reasons.append(_pick_template(SAVINGS_TEMPLATES,
                product_name=admin_group.name, pct=admin_group.discount_percentage))
        
        # Combine scores
        total_score = base_score + category_score + price_score + dynamics_score
        total_score = min(total_score, 1.0)
        
        # Build reason string with varied templates
        reasons = []
        
        # Primary reason - category or price match (most relevant)
        if category_reason:
            reasons.append(category_reason)
        elif price_reason:
            reasons.append(price_reason)
        else:
            # Fallback to new product template
            reasons.append(_pick_template(NEW_PRODUCT_TEMPLATES, product_name=admin_group.name))
        
        # Add dynamics reasons
        reasons.extend(dynamics_reasons)
        
        return {
            'total_score': total_score,
            'reason': ". ".join(reasons),
            'breakdown': {
                'base': base_score,
                'category': category_score,
                'price': price_score,
                'group_dynamics': dynamics_score
            },
            'ml_scores': {
                'cold_start_category_match': category_score,
                'cold_start_price_similarity': price_score,
                'cold_start_group_dynamics': dynamics_score,
                'hybrid': total_score
            }
        }

