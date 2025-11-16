"""
Behavioral ML Router - API endpoints for behavioral-enhanced recommendations
"""

from fastapi import APIRouter, Depends, HTTPException, Query
from sqlalchemy.orm import Session
from typing import Optional, List, Dict
from pydantic import BaseModel
import logging

import sys
import os
sys.path.append(os.path.dirname(os.path.dirname(os.path.abspath(__file__))))

from db.database import get_db
from authentication.auth import get_current_user
from models.models import User
from ml.behavioral_ml_service import (
    get_behavioral_ml_service,
    BehavioralMLService,
    extract_behavioral_features_batch
)

logger = logging.getLogger(__name__)

router = APIRouter(prefix="/api/behavioral-ml", tags=["Behavioral ML"])


# ============================================================================
# Request/Response Models
# ============================================================================

class RecommendationRequest(BaseModel):
    user_id: Optional[int] = None
    session_id: Optional[str] = None
    limit: int = 10
    weights: Optional[Dict[str, float]] = None


class InteractionRequest(BaseModel):
    product_id: int
    interaction_type: str  # 'view', 'click', 'join', 'purchase'


class RecommendationResponse(BaseModel):
    group_buy_id: int
    product_id: int
    product_name: str
    recommendation_score: float
    reasons: List[str]
    weights_used: Dict[str, float]
    behavioral_enhanced: bool


class UserProfileResponse(BaseModel):
    user_id: int
    static_preferences: Dict
    behavioral_preferences: Dict
    behavioral_features: Dict


class FeatureExtractionRequest(BaseModel):
    user_ids: List[int]
    window_days: int = 30


# ============================================================================
# Endpoints
# ============================================================================

@router.post("/recommendations", response_model=List[RecommendationResponse])
async def get_behavioral_recommendations(
    request: RecommendationRequest,
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    """
    Get recommendations using behavioral ML enhancements
    
    - **user_id**: Target user ID (defaults to current user)
    - **session_id**: Optional session ID for session-based recommendations
    - **limit**: Number of recommendations to return
    - **weights**: Custom weights for different recommendation components
    """
    try:
        # Use current user if not specified
        user_id = request.user_id or current_user.id
        
        # Get behavioral ML service
        service = get_behavioral_ml_service(db)
        
        # Get enhanced recommendations
        recommendations = service.get_enhanced_recommendations(
            user_id=user_id,
            session_id=request.session_id,
            limit=request.limit,
            weights=request.weights
        )
        
        return recommendations
        
    except Exception as e:
        logger.error(f"Error getting behavioral recommendations: {e}")
        raise HTTPException(status_code=500, detail=str(e))


@router.post("/track-interaction")
async def track_user_interaction(
    request: InteractionRequest,
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    """
    Track user interaction for real-time feature updates
    
    - **product_id**: Product ID interacted with
    - **interaction_type**: Type of interaction (view, click, join, purchase)
    """
    try:
        # Get behavioral ML service
        service = get_behavioral_ml_service(db)
        
        # Track interaction
        service.track_interaction(
            user_id=current_user.id,
            product_id=request.product_id,
            interaction_type=request.interaction_type
        )
        
        return {
            "status": "success",
            "message": f"Interaction tracked: {request.interaction_type}",
            "user_id": current_user.id,
            "product_id": request.product_id
        }
        
    except Exception as e:
        logger.error(f"Error tracking interaction: {e}")
        raise HTTPException(status_code=500, detail=str(e))


@router.get("/user-profile/behavioral", response_model=UserProfileResponse)
async def get_behavioral_user_profile(
    user_id: Optional[int] = None,
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    """
    Get enhanced user profile with behavioral features
    
    - **user_id**: Target user ID (defaults to current user)
    """
    try:
        # Use current user if not specified
        target_user_id = user_id or current_user.id
        
        # Get behavioral ML service
        service = get_behavioral_ml_service(db)
        
        # Build user profile with behavior
        profile = service.content_filter.build_user_profile_with_behavior(target_user_id)
        
        if not profile:
            raise HTTPException(status_code=404, detail="User profile not found")
        
        return profile
        
    except HTTPException:
        raise
    except Exception as e:
        logger.error(f"Error getting behavioral user profile: {e}")
        raise HTTPException(status_code=500, detail=str(e))


@router.get("/recommendations/explain")
async def explain_recommendations(
    group_buy_id: int,
    user_id: Optional[int] = None,
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    """
    Explain why a specific group buy was recommended
    
    - **group_buy_id**: Group buy ID to explain
    - **user_id**: Target user ID (defaults to current user)
    """
    try:
        from models.models import GroupBuy
        
        # Use current user if not specified
        target_user_id = user_id or current_user.id
        
        # Get behavioral ML service
        service = get_behavioral_ml_service(db)
        
        # Get user profile
        user_profile = service.content_filter.build_user_profile_with_behavior(target_user_id)
        
        if not user_profile:
            raise HTTPException(status_code=404, detail="User profile not found")
        
        # Get group buy
        group_buy = db.query(GroupBuy).filter(GroupBuy.id == group_buy_id).first()
        
        if not group_buy:
            raise HTTPException(status_code=404, detail="Group buy not found")
        
        # Calculate scores
        content_score = service.content_filter.calculate_content_similarity_with_behavior(
            user_profile, group_buy
        )
        
        explanation = {
            "group_buy_id": group_buy_id,
            "product_name": group_buy.product.name,
            "category": group_buy.product.category,
            "content_score": content_score,
            "user_behavioral_features": {
                "engagement_level": user_profile['behavioral_preferences']['engagement_level'],
                "conversion_rate": user_profile['behavioral_preferences']['conversion_rate'],
                "top_categories": user_profile['behavioral_preferences']['top_categories'][:3],
                "purchase_frequency": user_profile['behavioral_preferences']['purchase_frequency']
            },
            "match_reasons": []
        }
        
        # Generate match reasons
        if group_buy.product.category in user_profile['behavioral_preferences']['top_categories']:
            explanation['match_reasons'].append(
                f"You frequently browse {group_buy.product.category} products"
            )
        
        if user_profile['behavioral_preferences']['conversion_rate'] > 0.5 and group_buy.moq_progress > 70:
            explanation['match_reasons'].append(
                "Nearly complete - matches your preference for ready-to-ship groups"
            )
        
        if user_profile['behavioral_features']['recency_score'] > 0.5:
            explanation['match_reasons'].append(
                "You've been active recently, here's something new"
            )
        
        return explanation
        
    except HTTPException:
        raise
    except Exception as e:
        logger.error(f"Error explaining recommendation: {e}")
        raise HTTPException(status_code=500, detail=str(e))


@router.post("/features/extract-batch")
async def extract_features_batch(
    request: FeatureExtractionRequest,
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    """
    Extract behavioral features for multiple users (for ML training)
    
    - **user_ids**: List of user IDs to extract features for
    - **window_days**: Time window for feature extraction (default: 30 days)
    
    **Note**: This endpoint is for admin/ML training purposes only
    """
    try:
        # Check if current user is admin
        if not getattr(current_user, 'is_admin', False):
            raise HTTPException(status_code=403, detail="Admin access required")
        
        # Extract features
        features_df = extract_behavioral_features_batch(request.user_ids, db)
        
        # Convert to dict for JSON response
        features_dict = features_df.to_dict(orient='records')
        
        return {
            "status": "success",
            "users_processed": len(request.user_ids),
            "features": features_dict,
            "window_days": request.window_days
        }
        
    except HTTPException:
        raise
    except Exception as e:
        logger.error(f"Error extracting batch features: {e}")
        raise HTTPException(status_code=500, detail=str(e))


@router.get("/features/implicit-rating")
async def get_implicit_rating(
    product_id: int,
    user_id: Optional[int] = None,
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    """
    Get implicit rating for a product based on user behavior
    
    - **product_id**: Product ID to calculate rating for
    - **user_id**: Target user ID (defaults to current user)
    """
    try:
        # Use current user if not specified
        target_user_id = user_id or current_user.id
        
        # Get behavioral ML service
        service = get_behavioral_ml_service(db)
        
        # Calculate implicit rating
        rating = service.feature_extractor.calculate_implicit_rating(
            target_user_id, product_id
        )
        
        return {
            "user_id": target_user_id,
            "product_id": product_id,
            "implicit_rating": rating,
            "scale": "0-5",
            "method": "behavioral_signals_with_time_decay"
        }
        
    except Exception as e:
        logger.error(f"Error calculating implicit rating: {e}")
        raise HTTPException(status_code=500, detail=str(e))


@router.get("/session/recommendations")
async def get_session_recommendations(
    session_id: str,
    limit: int = Query(10, ge=1, le=50),
    db: Session = Depends(get_db)
):
    """
    Get recommendations based on current session behavior
    
    - **session_id**: Current session ID
    - **limit**: Number of recommendations to return
    """
    try:
        # Get behavioral ML service
        service = get_behavioral_ml_service(db)
        
        # Get session-based recommendations
        recommendations = service.session_recommender.recommend_for_session(
            session_id=session_id,
            limit=limit
        )
        
        return {
            "session_id": session_id,
            "recommendations": recommendations,
            "count": len(recommendations)
        }
        
    except Exception as e:
        logger.error(f"Error getting session recommendations: {e}")
        raise HTTPException(status_code=500, detail=str(e))


@router.get("/sequential/next-products")
async def get_next_likely_products(
    recent_product_ids: str = Query(..., description="Comma-separated product IDs"),
    user_id: Optional[int] = None,
    top_k: int = Query(10, ge=1, le=50),
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    """
    Predict next likely products based on sequential browsing patterns
    
    - **recent_product_ids**: Comma-separated list of recently viewed product IDs
    - **user_id**: Target user ID (defaults to current user)
    - **top_k**: Number of predictions to return
    """
    try:
        # Parse product IDs
        recent_views = [int(pid) for pid in recent_product_ids.split(',')]
        
        # Use current user if not specified
        target_user_id = user_id or current_user.id
        
        # Get behavioral ML service
        service = get_behavioral_ml_service(db)
        
        # Find next likely products
        predictions = service.sequential_miner.find_next_likely_products(
            user_id=target_user_id,
            recent_views=recent_views,
            top_k=top_k
        )
        
        return {
            "user_id": target_user_id,
            "recent_views": recent_views,
            "predictions": [
                {"product_id": pid, "probability": prob}
                for pid, prob in predictions
            ],
            "method": "sequential_pattern_mining"
        }
        
    except ValueError as e:
        raise HTTPException(status_code=400, detail="Invalid product IDs format")
    except Exception as e:
        logger.error(f"Error predicting next products: {e}")
        raise HTTPException(status_code=500, detail=str(e))


@router.get("/health")
async def behavioral_ml_health_check():
    """Health check endpoint for behavioral ML service"""
    return {
        "status": "healthy",
        "service": "behavioral-ml",
        "features": [
            "implicit_ratings",
            "behavioral_features",
            "content_filtering",
            "sequential_patterns",
            "session_based",
            "real_time_updates"
        ]
    }
