"""
User Clustering Module for SPACS AFRICA.
Implements K-Means clustering to group traders with similar behaviors.
"""

import numpy as np
import pandas as pd
from sklearn.cluster import KMeans
from sklearn.preprocessing import StandardScaler
from sklearn.metrics import silhouette_score, davies_bouldin_score
import joblib
from typing import List, Dict, Tuple, Optional
from datetime import datetime
import logging
from pathlib import Path

logger = logging.getLogger(__name__)

# Model storage path
MODEL_DIR = Path("models")
MODEL_DIR.mkdir(exist_ok=True)


class UserClusteringEngine:
    """
    K-Means clustering engine for grouping traders with similar purchase behaviors.
    """
    
    def __init__(self, n_clusters: int = 5, random_state: int = 42):
        """
        Initialize clustering engine.
        
        Args:
            n_clusters: Number of clusters to form
            random_state: Random seed for reproducibility
        """
        self.n_clusters = n_clusters
        self.random_state = random_state
        self.kmeans = None
        self.scaler = StandardScaler()
        self.feature_names = [
            'purchase_frequency',
            'avg_transaction_value',
            'price_sensitivity',
            'location_encoded',
            'product_diversity'
        ]
        self.cluster_names = {
            0: "High-Frequency Urban Buyers",
            1: "Price-Conscious Rural Traders",
            2: "Occasional High-Value Purchasers",
            3: "Regular Mid-Range Buyers",
            4: "Bulk-Focused Wholesalers"
        }
        self.model_version = "v1.0"
        
    def prepare_features(self, feature_data: pd.DataFrame) -> np.ndarray:
        """
        Prepare and scale feature data for clustering.
        
        Args:
            feature_data: DataFrame with user features
            
        Returns:
            Scaled feature array
        """
        # Ensure all required features are present
        missing_features = set(self.feature_names) - set(feature_data.columns)
        if missing_features:
            logger.warning(f"Missing features: {missing_features}. Filling with zeros.")
            for feature in missing_features:
                feature_data[feature] = 0
                
        # Select and order features
        X = feature_data[self.feature_names].values
        
        # Handle NaN values
        X = np.nan_to_num(X, nan=0.0)
        
        # Scale features
        X_scaled = self.scaler.fit_transform(X)
        
        return X_scaled
    
    def find_optimal_clusters(self, X: np.ndarray, max_k: int = 10) -> int:
        """
        Find optimal number of clusters using elbow method and silhouette score.
        
        Args:
            X: Feature array
            max_k: Maximum number of clusters to test
            
        Returns:
            Optimal number of clusters
        """
        inertias = []
        silhouette_scores = []
        K_range = range(2, min(max_k + 1, len(X)))
        
        for k in K_range:
            kmeans = KMeans(n_clusters=k, random_state=self.random_state, n_init=10)
            kmeans.fit(X)
            inertias.append(kmeans.inertia_)
            silhouette_scores.append(silhouette_score(X, kmeans.labels_))
            
        # Find elbow using derivative
        if len(inertias) >= 3:
            second_derivative = np.diff(np.diff(inertias))
            optimal_k = K_range[np.argmin(second_derivative) + 1]
        else:
            # If not enough data, use silhouette score
            optimal_k = K_range[np.argmax(silhouette_scores)]
            
        logger.info(f"Optimal number of clusters: {optimal_k}")
        return optimal_k
    
    def fit(self, feature_data: pd.DataFrame, auto_k: bool = False) -> Dict:
        """
        Fit K-Means clustering model.
        
        Args:
            feature_data: DataFrame with user features
            auto_k: If True, automatically determine optimal k
            
        Returns:
            Dictionary with training metrics
        """
        X_scaled = self.prepare_features(feature_data)
        
        # Determine number of clusters
        if auto_k and len(X_scaled) > 10:
            self.n_clusters = self.find_optimal_clusters(X_scaled)
            
        # Fit K-Means
        self.kmeans = KMeans(
            n_clusters=self.n_clusters,
            random_state=self.random_state,
            n_init=20,
            max_iter=500
        )
        self.kmeans.fit(X_scaled)
        
        # Calculate metrics
        inertia = self.kmeans.inertia_
        silhouette = silhouette_score(X_scaled, self.kmeans.labels_)
        davies_bouldin = davies_bouldin_score(X_scaled, self.kmeans.labels_)
        
        metrics = {
            'n_clusters': self.n_clusters,
            'inertia': float(inertia),
            'silhouette_score': float(silhouette),
            'davies_bouldin_score': float(davies_bouldin),
            'n_samples': len(X_scaled),
            'model_version': self.model_version,
            'trained_at': datetime.now().isoformat()
        }
        
        logger.info(f"Clustering complete: {metrics}")
        return metrics
    
    def predict(self, feature_data: pd.DataFrame) -> Tuple[np.ndarray, np.ndarray]:
        """
        Predict cluster assignments for users.
        
        Args:
            feature_data: DataFrame with user features
            
        Returns:
            Tuple of (cluster_ids, distances_to_centroid)
        """
        if self.kmeans is None:
            raise ValueError("Model not trained. Call fit() first.")
            
        X_scaled = self.prepare_features(feature_data)
        cluster_ids = self.kmeans.predict(X_scaled)
        
        # Calculate distance to centroid as confidence score
        distances = self.kmeans.transform(X_scaled)
        min_distances = np.min(distances, axis=1)
        
        # Convert distance to confidence (0-1, lower distance = higher confidence)
        max_dist = np.max(min_distances) if len(min_distances) > 0 else 1.0
        confidences = 1 - (min_distances / max_dist)
        
        return cluster_ids, confidences
    
    def get_cluster_name(self, cluster_id: int) -> str:
        """Get human-readable name for cluster."""
        return self.cluster_names.get(cluster_id, f"Cluster {cluster_id}")
    
    def get_cluster_characteristics(self, feature_data: pd.DataFrame, cluster_id: int) -> Dict:
        """
        Get statistical characteristics of a cluster.
        
        Args:
            feature_data: DataFrame with user features and cluster assignments
            cluster_id: Cluster ID to analyze
            
        Returns:
            Dictionary with cluster characteristics
        """
        cluster_data = feature_data[feature_data['cluster_id'] == cluster_id]
        
        if len(cluster_data) == 0:
            return {
                'cluster_id': cluster_id,
                'size': 0,
                'characteristics': {}
            }
            
        characteristics = {
            'cluster_id': cluster_id,
            'cluster_name': self.get_cluster_name(cluster_id),
            'size': len(cluster_data),
            'avg_purchase_frequency': float(cluster_data['purchase_frequency'].mean()),
            'avg_transaction_value': float(cluster_data['avg_transaction_value'].mean()),
            'avg_price_sensitivity': float(cluster_data['price_sensitivity'].mean()),
            'avg_product_diversity': float(cluster_data.get('product_diversity', pd.Series([0])).mean()),
            'location_distribution': cluster_data.get('location_encoded', pd.Series([0])).value_counts().to_dict()
        }
        
        return characteristics
    
    def save_model(self, filepath: str = None):
        """Save trained model and scaler to disk."""
        if self.kmeans is None:
            raise ValueError("No model to save. Train the model first.")
            
        if filepath is None:
            timestamp = datetime.now().strftime("%Y%m%d_%H%M%S")
            filepath = MODEL_DIR / f"clustering_model_{timestamp}.pkl"
            
        model_data = {
            'kmeans': self.kmeans,
            'scaler': self.scaler,
            'feature_names': self.feature_names,
            'cluster_names': self.cluster_names,
            'n_clusters': self.n_clusters,
            'model_version': self.model_version,
            'saved_at': datetime.now().isoformat()
        }
        
        joblib.dump(model_data, filepath)
        logger.info(f"Model saved to {filepath}")
        return str(filepath)
    
    def load_model(self, filepath: str):
        """Load trained model and scaler from disk."""
        model_data = joblib.load(filepath)
        
        self.kmeans = model_data['kmeans']
        self.scaler = model_data['scaler']
        self.feature_names = model_data['feature_names']
        self.cluster_names = model_data.get('cluster_names', self.cluster_names)
        self.n_clusters = model_data['n_clusters']
        self.model_version = model_data.get('model_version', 'v1.0')
        
        logger.info(f"Model loaded from {filepath}")


def extract_user_features(db_session) -> pd.DataFrame:
    """
    Extract features from database for clustering.
    
    Args:
        db_session: SQLAlchemy database session
        
    Returns:
        DataFrame with user features
    """
    # This is a placeholder - actual implementation would query the database
    # The real implementation is in main.py with actual DB queries
    
    query = """
        SELECT 
            fs.user_id,
            fs.purchase_frequency,
            fs.avg_transaction_value,
            fs.price_sensitivity,
            fs.location_encoded,
            COALESCE(
                jsonb_array_length(fs.product_preferences::jsonb), 
                0
            ) as product_diversity,
            fs.total_transactions,
            fs.total_spent
        FROM feature_store fs
        JOIN users u ON fs.user_id = u.id
        WHERE u.is_active = TRUE
        AND fs.total_transactions > 0
    """
    
    # Execute query and return DataFrame
    from database import execute_raw_sql
    results = execute_raw_sql(query)
    
    if not results:
        logger.warning("No user features found in database")
        return pd.DataFrame()
        
    df = pd.DataFrame(results)
    logger.info(f"Extracted features for {len(df)} users")
    
    return df


def update_user_clusters(db_session, clustering_engine: UserClusteringEngine, feature_data: pd.DataFrame):
    """
    Update user cluster assignments in database.
    
    Args:
        db_session: SQLAlchemy database session
        clustering_engine: Trained clustering engine
        feature_data: DataFrame with user features
    """
    from database import execute_raw_sql
    
    # Predict clusters
    cluster_ids, confidences = clustering_engine.predict(feature_data)
    
    # Prepare update data
    updates = []
    for i, user_id in enumerate(feature_data['user_id']):
        cluster_id = int(cluster_ids[i])
        confidence = float(confidences[i])
        cluster_name = clustering_engine.get_cluster_name(cluster_id)
        
        # Get feature vector
        features = feature_data.iloc[i][clustering_engine.feature_names].to_dict()
        
        updates.append({
            'user_id': user_id,
            'cluster_id': cluster_id,
            'cluster_name': cluster_name,
            'confidence_score': confidence,
            'features': features,
            'model_version': clustering_engine.model_version
        })
    
    # Batch insert/update clusters
    for update in updates:
        query = """
            INSERT INTO user_clusters (
                user_id, cluster_id, cluster_name, features, 
                confidence_score, model_version, assigned_at
            ) VALUES (
                :user_id, :cluster_id, :cluster_name, :features::jsonb,
                :confidence_score, :model_version, NOW()
            )
            ON CONFLICT (user_id) 
            DO UPDATE SET
                cluster_id = EXCLUDED.cluster_id,
                cluster_name = EXCLUDED.cluster_name,
                features = EXCLUDED.features,
                confidence_score = EXCLUDED.confidence_score,
                model_version = EXCLUDED.model_version,
                assigned_at = NOW()
        """
        
        # Convert features dict to JSON string for PostgreSQL
        import json
        update['features'] = json.dumps(update['features'])
        
        execute_raw_sql(query, update)
    
    logger.info(f"Updated cluster assignments for {len(updates)} users")


if __name__ == "__main__":
    # Test clustering with synthetic data
    print("Testing User Clustering Engine...")
    
    # Create synthetic feature data
    np.random.seed(42)
    n_users = 100
    
    synthetic_data = pd.DataFrame({
        'user_id': [f"user_{i}" for i in range(n_users)],
        'purchase_frequency': np.random.exponential(2, n_users),
        'avg_transaction_value': np.random.lognormal(3, 1, n_users),
        'price_sensitivity': np.random.beta(2, 5, n_users),
        'location_encoded': np.random.randint(0, 5, n_users),
        'product_diversity': np.random.poisson(3, n_users)
    })
    
    # Train clustering model
    engine = UserClusteringEngine(n_clusters=5)
    metrics = engine.fit(synthetic_data, auto_k=False)
    print(f"Training Metrics: {metrics}")
    
    # Predict clusters
    cluster_ids, confidences = engine.predict(synthetic_data)
    print(f"\nCluster Distribution:")
    unique, counts = np.unique(cluster_ids, return_counts=True)
    for cluster_id, count in zip(unique, counts):
        print(f"  {engine.get_cluster_name(cluster_id)}: {count} users")
    
    # Save model
    filepath = engine.save_model()
    print(f"\nModel saved to: {filepath}")
    
    print("\n✓ Clustering engine test completed successfully")
