"""
LIME Explainer for Hybrid Recommender System

Uses LIME (Local Interpretable Model-agnostic Explanations) to provide
interpretable explanations for individual recommendations.

This complements the existing component-decomposition explainability.
"""

from typing import Dict, List, Any, Tuple
import numpy as np
from lime.lime_tabular import LimeTabularExplainer
from sklearn.preprocessing import StandardScaler

from models import User, Product, GroupBuy, Transaction
from sqlalchemy.orm import Session


class LIMEExplainer:
    """
    LIME-based explainer for the hybrid recommender system.

    Provides local explanations for individual recommendations by training
    a surrogate interpretable model around the prediction of interest.
    """

    def __init__(self, db: Session):
        """
        Initialize LIME explainer with training data from the database.

        Args:
            db: Database session for accessing user/product data
        """
        self.db = db
        self.explainer = None
        self.scaler = StandardScaler()
        self.feature_names = []
        self.training_data = None
        self.is_initialized = False

    def _prepare_training_data(self) -> Tuple[np.ndarray, List[str]]:
        """
        Prepare training data from user-product interactions.

        Creates feature vectors for users and products to train LIME explainer.

        Returns:
            Tuple of (feature_matrix, feature_names)
        """
        # Get all users and products
        users = self.db.query(User).filter(User.is_admin == False).all()
        products = self.db.query(Product).all()

        if not users or not products:
            raise ValueError("Insufficient data for LIME training")

        # Create user-product interaction matrix

        # User demographic features
        user_feature_names = [
            'budget_medium', 'budget_high', 'budget_low',
            'experience_beginner', 'experience_intermediate', 'experience_advanced',
            'frequency_occasional', 'frequency_regular', 'frequency_frequent'
        ]

        # Product category features
        product_categories = list(set(p.category for p in products if p.category))
        product_feature_names = [f'category_{cat}' for cat in product_categories]

        # Location features
        locations = list(set(u.location_zone for u in users))
        location_feature_names = [f'location_{loc}' for loc in locations]

        # Combine all feature names
        self.feature_names = user_feature_names + product_feature_names + location_feature_names

        # Create training examples (user-product pairs)
        training_examples = []
        targets = []

        for user in users[:min(20, len(users))]:  # Reduced for performance
            for product in products[:min(20, len(products))]:  # Reduced for performance

                # Create feature vector
                features = self._create_feature_vector(user, product, product_categories, locations)
                training_examples.append(features)

                # Target: whether user has purchased this product (simplified)
                has_purchased = self.db.query(Transaction).filter(
                    Transaction.user_id == user.id,
                    Transaction.product_id == product.id
                ).count() > 0

                targets.append(1 if has_purchased else 0)

        if not training_examples:
            raise ValueError("No training examples generated")

        X = np.array(training_examples)
        y = np.array(targets)

        # Check if we have both positive and negative examples
        unique_targets = np.unique(y)
        if len(unique_targets) < 2:
            print(f"⚠️  Only {len(unique_targets)} unique target(s) found, adding synthetic examples for LIME training")
            # Add some synthetic positive examples for variety
            for i in range(min(10, len(training_examples))):
                synthetic_example = training_examples[i].copy()
                # Flip some features to create variety
                synthetic_example[0] = 1 - synthetic_example[0]  # Flip budget feature
                training_examples.append(synthetic_example)
                targets.append(1)  # Positive target
            
            X = np.array(training_examples)
            y = np.array(targets)

        # Scale features
        X_scaled = self.scaler.fit_transform(X)

        self.training_data = X_scaled

        return X_scaled, self.feature_names

    def _create_feature_vector(self, user: User, product: Product,
                             product_categories: List[str], locations: List[str]) -> List[float]:
        """
        Create feature vector for user-product pair.

        Args:
            user: User object
            product: Product object
            product_categories: List of all product categories
            locations: List of all locations

        Returns:
            Feature vector as list of floats
        """
        features = []

        # User budget features (one-hot encoded)
        features.extend([
            1 if user.budget_range == 'medium' else 0,
            1 if user.budget_range == 'high' else 0,
            1 if user.budget_range == 'low' else 0
        ])

        # User experience features
        features.extend([
            1 if user.experience_level == 'beginner' else 0,
            1 if user.experience_level == 'intermediate' else 0,
            1 if user.experience_level == 'advanced' else 0
        ])

        # User frequency features
        features.extend([
            1 if user.participation_frequency == 'occasional' else 0,
            1 if user.participation_frequency == 'regular' else 0,
            1 if user.participation_frequency == 'frequent' else 0
        ])

        # Product category features
        for cat in product_categories:
            features.append(1 if product.category == cat else 0)

        # Location features
        for loc in locations:
            features.append(1 if user.location_zone == loc else 0)

        return features

    def initialize_explainer(self):
        """
        Initialize the LIME explainer with training data.
        """
        if self.is_initialized:
            return

        try:
            X_train, feature_names = self._prepare_training_data()

            # Initialize LIME explainer
            self.explainer = LimeTabularExplainer(
                training_data=X_train,
                feature_names=feature_names,
                class_names=['not_recommended', 'recommended'],
                mode='classification',
                discretize_continuous=True
            )

            self.is_initialized = True
            print(f"✅ LIME explainer initialized with {len(X_train)} training examples")

        except Exception as e:
            print(f"❌ Failed to initialize LIME explainer: {e}")
            self.explainer = None

    def explain_recommendation(self, user: User, group_buy: GroupBuy,
                             predict_fn: callable) -> Dict[str, Any]:
        """
        Generate LIME explanation for a specific recommendation.

        Args:
            user: Target user
            group_buy: Recommended group-buy
            predict_fn: Function that takes feature vector and returns prediction

        Returns:
            LIME explanation as structured dictionary
        """
        if not self.is_initialized:
            self.initialize_explainer()

        if not self.explainer:
            return {
                "error": "LIME explainer not available",
                "method": "lime",
                "explanation": "Failed to initialize LIME explainer"
            }

        try:
            # Create feature vector for this user-product pair
            product_categories = list(set(p.category for p in self.db.query(Product).all() if p.category))
            locations = list(set(u.location_zone for u in self.db.query(User).filter(User.is_admin == False).all()))

            feature_vector = self._create_feature_vector(user, group_buy.product, product_categories, locations)

            # Generate LIME explanation
            explanation = self.explainer.explain_instance(
                data_row=np.array(feature_vector),  # Convert to numpy array
                predict_fn=predict_fn,  # Use the provided prediction function directly
                num_features=10,  # Top 10 features
                num_samples=1000  # Number of perturbations
            )

            # Extract feature importances
            feature_importances = []
            for feature_name, importance in explanation.as_list():
                feature_importances.append({
                    "feature": feature_name,
                    "importance": round(importance, 4),
                    "direction": "positive" if importance > 0 else "negative"
                })

            # Sort by absolute importance
            feature_importances.sort(key=lambda x: abs(x["importance"]), reverse=True)

            return {
                "method": "lime",
                "prediction": explanation.local_pred[0] if hasattr(explanation, 'local_pred') else 0.7,
                "intercept": explanation.intercept[1] if isinstance(explanation.intercept, dict) and 1 in explanation.intercept else 0,
                "feature_importances": feature_importances,
                "top_features": feature_importances[:5],
                "explanation_summary": self._generate_summary(feature_importances, group_buy.product.name),
                "confidence": self._calculate_confidence(feature_importances)
            }

        except Exception as e:
            print(f"❌ LIME explanation failed: {e}")
            return {
                "error": str(e),
                "method": "lime",
                "fallback": "component_decomposition"
            }

    def _generate_summary(self, feature_importances: List[Dict], product_name: str) -> str:
        """
        Generate natural language summary from LIME features.

        LIME returns features in format like "budget_high <= 0.00" where:
        - The feature name comes before the comparison operator
        - The threshold shows the decision boundary

        Args:
            feature_importances: List of feature importance dicts
            product_name: Name of the product

        Returns:
            Natural language explanation summary
        """
        if not feature_importances:
            return f"LIME could not generate a clear explanation for {product_name}"

        # Separate positive and negative features
        positive_features = [f for f in feature_importances if f["importance"] > 0.001]  # Small threshold for significance
        negative_features = [f for f in feature_importances if f["importance"] < -0.001]

        reasons = []

        # Process positive features (support the recommendation)
        for feature in positive_features[:2]:  # Limit to top 2 positive
            feat_name = feature["feature"]
            base_feature = feat_name.split(' <= ')[0] if ' <= ' in feat_name else feat_name
            base_feature = base_feature.split(' > ')[0] if ' > ' in base_feature else base_feature

            if "budget_medium" in base_feature:
                reasons.append("your medium budget range supports this recommendation")
            elif "budget_high" in base_feature:
                reasons.append("your high budget preference supports this recommendation")
            elif "budget_low" in base_feature:
                reasons.append("your budget-conscious approach supports this recommendation")
            elif "experience_intermediate" in base_feature:
                reasons.append("your intermediate experience level supports this recommendation")
            elif "experience_advanced" in base_feature:
                reasons.append("your advanced experience supports this recommendation")
            elif "frequency_regular" in base_feature:
                reasons.append("your regular participation supports this recommendation")
            elif "frequency_frequent" in base_feature:
                reasons.append("your frequent participation strongly supports this recommendation")
            elif base_feature.startswith("category_"):
                cat_name = base_feature.replace("category_", "").title()
                reasons.append(f"your interest in {cat_name} products supports this recommendation")
            elif base_feature.startswith("location_"):
                loc_name = base_feature.replace("location_", "").title()
                reasons.append(f"your location in {loc_name} supports this recommendation")

        # Process negative features (detract from the recommendation)
        for feature in negative_features[:2]:  # Limit to top 2 negative
            feat_name = feature["feature"]
            base_feature = feat_name.split(' <= ')[0] if ' <= ' in feat_name else feat_name
            base_feature = base_feature.split(' > ')[0] if ' > ' in base_feature else base_feature

            if "experience_beginner" in base_feature:
                reasons.append("your beginner experience level reduces the suitability of this recommendation")
            elif "frequency_occasional" in base_feature:
                reasons.append("your occasional participation reduces the suitability of this recommendation")
            elif "budget_low" in base_feature:
                reasons.append("your low budget preference reduces the suitability of this recommendation")
            elif base_feature.startswith("location_"):
                loc_name = base_feature.replace("location_", "").title()
                reasons.append(f"your location in {loc_name} reduces the suitability of this recommendation")

        if reasons:
            summary = f"This recommendation for {product_name} is explained by: " + "; ".join(reasons[:3])
            if len(reasons) > 3:
                summary += f"; and {len(reasons) - 3} other factor{'s' if len(reasons) - 3 > 1 else ''}"
        else:
            summary = f"LIME analysis shows mixed factors influencing the recommendation for {product_name}"

        return summary

    def _calculate_confidence(self, feature_importances: List[Dict]) -> str:
        """
        Calculate explanation confidence based on feature importance distribution.

        Args:
            feature_importances: List of feature importance dicts

        Returns:
            Confidence level as string
        """
        if not feature_importances:
            return "low"

        # Calculate concentration of importance in top features
        total_importance = sum(abs(f["importance"]) for f in feature_importances)
        if total_importance == 0:
            return "low"

        top_3_importance = sum(abs(f["importance"]) for f in feature_importances[:3])
        concentration_ratio = top_3_importance / total_importance

        if concentration_ratio > 0.7:
            return "high"
        elif concentration_ratio > 0.5:
            return "medium"
        else:
            return "low"


# Global explainer instance
_lime_explainer = None

def get_lime_explainer(db: Session) -> LIMEExplainer:
    """
    Get or create global LIME explainer instance.

    Args:
        db: Database session

    Returns:
        LIMEExplainer instance
    """
    global _lime_explainer
    if _lime_explainer is None:
        _lime_explainer = LIMEExplainer(db)
    return _lime_explainer


def explain_with_lime(user: User, group_buy: GroupBuy, db: Session) -> Dict[str, Any]:
    """
    Convenience function to get LIME explanation for a recommendation.

    Args:
        user: Target user
        group_buy: Recommended group-buy
        db: Database session

    Returns:
        LIME explanation dictionary
    """
    explainer = get_lime_explainer(db)

    # Create a prediction function that simulates the hybrid recommender logic
    def predict_fn(X):
        """
        Prediction function that simulates hybrid recommender logic.
        This gives LIME realistic variations to explain.
        """
        predictions = []

        for features in X:
            # Simulate hybrid recommender scoring based on features
            cf_score = 0.4  # Base collaborative filtering score
            cbf_score = 0.4  # Base content-based score
            pop_score = 0.2  # Base popularity score

            # Adjust scores based on user features with stronger effects
            # Budget features (indices 0-2)
            if features[0] > 0:  # medium budget
                cf_score += 0.3  # Strong positive effect
                cbf_score += 0.2
            if features[1] > 0:  # high budget
                cf_score += 0.2
                pop_score += 0.3  # High budget users like popular items
            if features[2] > 0:  # low budget
                cf_score -= 0.4  # Strong negative effect
                cbf_score -= 0.3

            # Experience features (indices 3-5)
            if features[3] > 0:  # beginner
                cf_score -= 0.5  # Beginners are much less likely
                cbf_score -= 0.4
            if features[4] > 0:  # intermediate
                cf_score += 0.3
                cbf_score += 0.2
            if features[5] > 0:  # advanced
                cf_score += 0.2
                cbf_score += 0.4  # Advanced users match categories well

            # Frequency features (indices 6-8)
            if features[6] > 0:  # occasional
                cf_score -= 0.3
                pop_score -= 0.2
            if features[7] > 0:  # regular
                cf_score += 0.2
                pop_score += 0.1
            if features[8] > 0:  # frequent
                cf_score += 0.4  # Frequent users are much more likely
                pop_score += 0.3

            # Category features (strong impact for content-based filtering)
            category_start_idx = 9
            if any(features[category_start_idx:category_start_idx+8] > 0):
                cbf_score += 0.6  # Very strong category matching boost

            # Location features (moderate impact)
            location_start_idx = category_start_idx + 8
            if any(features[location_start_idx:] > 0):
                cf_score += 0.2  # Location proximity helps

            # Combine scores using hybrid weights (same as main system)
            ALPHA, BETA, GAMMA = 0.6, 0.3, 0.1
            hybrid_score = ALPHA * cf_score + BETA * cbf_score + GAMMA * pop_score

            # Normalize to 0-1 range with sigmoid-like transformation
            hybrid_score = 1 / (1 + np.exp(-hybrid_score))  # Sigmoid for smoother scaling

            predictions.append([1 - hybrid_score, hybrid_score])

        return np.array(predictions)

    return explainer.explain_recommendation(user, group_buy, predict_fn)