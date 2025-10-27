import os
import json
import logging
import pandas as pd
import numpy as np
import hashlib
import functools
import time
from datetime import datetime, timedelta
from typing import Dict, List, Any, Tuple, Optional, Union, Callable, TypeVar, cast
from sqlalchemy.orm import Session, joinedload, selectinload, Load
from sqlalchemy import text, and_, or_
from fastapi import HTTPException, status
import joblib
from contextlib import contextmanager
from functools import wraps
import orjson

# Configure structured logging
logging.basicConfig(
    level=logging.INFO,
    format='%(asctime)s - %(name)s - %(levelname)s - %(message)s',
    handlers=[
        logging.StreamHandler(),
        logging.FileHandler('backend.log')
    ]
)
logger = logging.getLogger(__name__)

# Type variable for generic function typing
F = TypeVar('F', bound=Callable[..., Any])

class APIError(Exception):
    """Base exception for API errors"""
    def __init__(self, message: str, status_code: int = status.HTTP_400_BAD_REQUEST, **kwargs):
        self.message = message
        self.status_code = status_code
        self.extra = kwargs
        super().__init__(self.message)

class DatabaseConnectionError(APIError):
    """Raised when database connection fails"""
    def __init__(self, message: str = "Database connection error"):
        super().__init__(message, status_code=status.HTTP_503_SERVICE_UNAVAILABLE)

class RateLimitExceeded(APIError):
    """Raised when rate limit is exceeded"""
    def __init__(self, message: str = "Rate limit exceeded"):
        super().__init__(message, status_code=status.HTTP_429_TOO_MANY_REQUESTS)

@contextmanager
def database_session(db: Session):
    """Provide a transactional scope around a series of operations."""
    try:
        yield db
        db.commit()
    except Exception as e:
        db.rollback()
        logger.error(f"Database error: {str(e)}", exc_info=True)
        raise DatabaseConnectionError(f"Database operation failed: {str(e)}")
    finally:
        db.close()

def handle_errors(func: F) -> F:
    """Decorator to handle common errors and log them"""
    @wraps(func)
    async def wrapper(*args, **kwargs):
        try:
            return await func(*args, **kwargs)
        except APIError as e:
            raise
        except Exception as e:
            logger.error(f"Unexpected error in {func.__name__}: {str(e)}", exc_info=True)
            raise APIError("An unexpected error occurred") from e
    return cast(F, wrapper)

class DataProcessor:
    """Class for processing and preparing data for the recommendation system"""
    
    @staticmethod
    def load_transaction_data(filepath: str, chunk_size: int = 10000) -> pd.DataFrame:
        """
        Load transaction data from CSV file with chunking for large files
        
        Args:
            filepath: Path to the CSV file
            chunk_size: Number of rows to read at a time (for large files)
            
        Returns:
            DataFrame with transaction data
            
        Raises:
            APIError: If there's an error loading or processing the data
        """
        chunks = []
        try:
            # Read file in chunks for memory efficiency
            for chunk in pd.read_csv(filepath, chunksize=chunk_size, parse_dates=['timestamp']):
                # Ensure required columns exist
                required_columns = ['trader_id', 'product_id', 'quantity', 'unit_price', 'timestamp']
                missing_cols = [col for col in required_columns if col not in chunk.columns]
                
                if missing_cols:
                    raise ValueError(f"Missing required columns: {', '.join(missing_cols)}")
                
                # Process chunk
                chunk = DataProcessor._process_chunk(chunk)
                chunks.append(chunk)
                
                # Log progress for large files
                if len(chunks) % 10 == 0:
                    logger.info(f"Processed {len(chunks) * chunk_size} rows...")
            
            # Combine all chunks
            df = pd.concat(chunks, ignore_index=True)
            
            # Log completion
            logger.info(f"Successfully loaded {len(df)} transactions from {filepath}")
            
            return df
            
        except Exception as e:
            logger.error(f"Error loading transaction data: {str(e)}", exc_info=True)
            raise APIError(f"Error loading transaction data: {str(e)}")
    
    @staticmethod
    def _process_chunk(chunk: pd.DataFrame) -> pd.DataFrame:
        """Process a chunk of transaction data"""
        # Convert data types
        chunk['timestamp'] = pd.to_datetime(chunk['timestamp'])
        chunk['trader_id'] = chunk['trader_id'].astype('category')
        chunk['product_id'] = chunk['product_id'].astype('category')
        
        # Add derived features
        chunk['total_price'] = chunk['quantity'] * chunk['unit_price']
        chunk['day_of_week'] = chunk['timestamp'].dt.dayofweek.astype('int8')
        chunk['hour_of_day'] = chunk['timestamp'].dt.hour.astype('int8')
        chunk['is_weekend'] = chunk['timestamp'].dt.dayofweek.isin([5, 6]).astype('int8')
        
        # Add time-based features
        chunk['month'] = chunk['timestamp'].dt.month.astype('int8')
        chunk['year'] = chunk['timestamp'].dt.year.astype('int16')
        
        return chunk
    
    @staticmethod
    def preprocess_transactions(transactions: pd.DataFrame) -> pd.DataFrame:
        """
        Preprocess transaction data
        
        Args:
            transactions: Raw transaction data
            
        Returns:
            Preprocessed transaction data
        """
        try:
            # Handle missing values
            transactions = transactions.dropna(subset=['trader_id', 'product_id', 'quantity', 'unit_price'])
            
            # Remove duplicates
            transactions = transactions.drop_duplicates()
            
            # Remove outliers (e.g., negative prices or quantities)
            transactions = transactions[
                (transactions['unit_price'] > 0) & 
                (transactions['quantity'] > 0)
            ]
            
            # Add recency, frequency, monetary value (RFM) features
            max_date = transactions['timestamp'].max() + timedelta(days=1)
            
            rfm = transactions.groupby('trader_id').agg({
                'timestamp': lambda x: (max_date - x.max()).days,
                'trader_id': 'count',
                'total_price': 'sum'
            }).reset_index()
            
            rfm.columns = ['trader_id', 'recency', 'frequency', 'monetary']
            
            # Normalize RFM scores
            rfm['r_rank'] = pd.qcut(rfm['recency'], 5, [5, 4, 3, 2, 1])
            rfm['f_rank'] = pd.qcut(rfm['frequency'].rank(method='first'), 5, [1, 2, 3, 4, 5])
            rfm['m_rank'] = pd.qcut(rfm['monetary'].rank(method='first'), 5, [1, 2, 3, 4, 5])
            
            # Calculate RFM score
            rfm['rfm_score'] = rfm['r_rank'].astype(int) + rfm['f_rank'].astype(int) + rfm['m_rank'].astype(int)
            
            # Merge back with transactions
            transactions = pd.merge(transactions, rfm[['trader_id', 'rfm_score']], on='trader_id', how='left')
            
            return transactions
            
        except Exception as e:
            logger.error(f"Error preprocessing transactions: {e}")
            raise HTTPException(status_code=500, detail=f"Error preprocessing transactions: {e}")
    
    @staticmethod
    def generate_train_test_split(
        transactions: pd.DataFrame, 
        test_size: float = 0.2,
        time_based: bool = True
    ) -> Tuple[pd.DataFrame, pd.DataFrame]:
        """
        Split data into training and test sets
        
        Args:
            transactions: Transaction data
            test_size: Proportion of data to use for testing
            time_based: If True, split based on time (last test_size% of time)
            
        Returns:
            Tuple of (train_data, test_data)
        """
        try:
            if time_based:
                # Sort by timestamp
                transactions = transactions.sort_values('timestamp')
                
                # Get split index
                split_idx = int((1 - test_size) * len(transactions))
                
                train_data = transactions.iloc[:split_idx]
                test_data = transactions.iloc[split_idx:]
            else:
                # Random split
                from sklearn.model_selection import train_test_split
                train_data, test_data = train_test_split(
                    transactions, 
                    test_size=test_size, 
                    random_state=42,
                    stratify=transactions['trader_id']  # Ensure all users are represented in both sets
                )
            
            return train_data, test_data
            
        except Exception as e:
            logger.error(f"Error splitting data: {e}")
            raise HTTPException(status_code=500, detail=f"Error splitting data: {e}")


class ModelUtils:
    """Utility class for model-related operations"""
    
    @staticmethod
    def save_model(model: Any, filepath: str, metadata: Optional[Dict] = None):
        """
        Save a trained model to disk
        
        Args:
            model: Trained model object
            filepath: Path to save the model
            metadata: Additional metadata to save with the model
        """
        try:
            # Create directory if it doesn't exist
            os.makedirs(os.path.dirname(filepath) or '.', exist_ok=True)
            
            # Prepare model data
            model_data = {
                'model': model,
                'timestamp': datetime.now().isoformat(),
                'metadata': metadata or {}
            }
            
            # Save model
            joblib.dump(model_data, filepath)
            logger.info(f"Model saved to {filepath}")
            
        except Exception as e:
            logger.error(f"Error saving model: {e}")
            raise HTTPException(status_code=500, detail=f"Error saving model: {e}")
    
    @staticmethod
    def load_model(filepath: str) -> Tuple[Any, Dict]:
        """
        Load a trained model from disk
        
        Args:
            filepath: Path to the saved model
            
        Returns:
            Tuple of (model, metadata)
        """
        try:
            if not os.path.exists(filepath):
                raise FileNotFoundError(f"Model file not found: {filepath}")
                
            model_data = joblib.load(filepath)
            logger.info(f"Model loaded from {filepath} (saved on {model_data.get('timestamp', 'unknown')})")
            
            return model_data['model'], model_data.get('metadata', {})
            
        except Exception as e:
            logger.error(f"Error loading model: {e}")
            raise HTTPException(status_code=500, detail=f"Error loading model: {e}")
    
    @staticmethod
    def generate_feature_importance_plot(model, feature_names, save_path: str = None):
        """
        Generate a feature importance plot for a model
        
        Args:
            model: Trained model with feature_importances_ attribute
            feature_names: List of feature names
            save_path: If provided, save the plot to this path
        """
        try:
            import matplotlib.pyplot as plt
            import seaborn as sns
            
            # Get feature importances
            importances = model.feature_importances_
            indices = np.argsort(importances)[::-1]
            
            # Plot
            plt.figure(figsize=(10, 6))
            sns.barplot(x=importances[indices][:20], y=np.array(feature_names)[indices][:20])
            plt.title('Top 20 Feature Importances')
            plt.tight_layout()
            
            if save_path:
                os.makedirs(os.path.dirname(save_path) or '.', exist_ok=True)
                plt.savefig(save_path, bbox_inches='tight')
                plt.close()
            else:
                plt.show()
                
        except Exception as e:
            logger.warning(f"Could not generate feature importance plot: {e}")


class CacheManager:
    """Enhanced cache manager with TTL, namespacing, and memory management"""
    
    def __init__(self, cache_dir: str = 'cache', max_mb: int = 1024):
        """
        Initialize cache manager with memory constraints
        
        Args:
            cache_dir: Directory to store cache files
            max_mb: Maximum cache size in MB
        """
        self.cache_dir = cache_dir
        self.max_bytes = max_mb * 1024 * 1024
        self.lock = threading.RLock()
        os.makedirs(cache_dir, exist_ok=True)
        
        # Track cache usage
        self._init_cache_index()
    
    def _init_cache_index(self):
        """Initialize or load cache index"""
        self.index_file = os.path.join(self.cache_dir, '.cache_index.json')
        try:
            if os.path.exists(self.index_file):
                with open(self.index_file, 'r') as f:
                    self.cache_index = orjson.loads(f.read())
            else:
                self.cache_index = {}
        except Exception as e:
            logger.warning(f"Error loading cache index: {e}")
            self.cache_index = {}
    
    def _save_cache_index(self):
        """Save the cache index to disk"""
        try:
            with open(self.index_file, 'wb') as f:
                f.write(orjson.dumps(self.cache_index, option=orjson.OPT_INDENT_2))
        except Exception as e:
            logger.error(f"Error saving cache index: {e}")
    
    def _get_namespaced_key(self, namespace: str, key: str) -> str:
        """Create a namespaced cache key"""
        return f"{namespace}:{key}"
    
    def get_cache_path(self, key: str) -> str:
        """Get file path for a cache key with hash-based directory structure"""
        key_hash = hashlib.md5(key.encode('utf-8')).hexdigest()
        # Create 2-level directory structure for better filesystem performance
        dir_path = os.path.join(self.cache_dir, key_hash[:2], key_hash[2:4])
        os.makedirs(dir_path, exist_ok=True)
        return os.path.join(dir_path, f"{key_hash}.pkl")
    
    def get(self, namespace: str, key: str, max_age_seconds: Optional[int] = 3600) -> Any:
        """
        Get a value from cache with namespace support
        
        Args:
            namespace: Cache namespace (e.g., 'recommendations', 'user_data')
            key: Cache key within the namespace
            max_age_seconds: Maximum age of cache in seconds (None for no expiration)
            
        Returns:
            Cached value or None if not found or expired
        """
        cache_key = self._get_namespaced_key(namespace, key)
        cache_path = self.get_cache_path(cache_key)
        
        with self.lock:
            try:
                # Check if key exists in index
                if cache_key not in self.cache_index:
                    return None
                
                # Check TTL if specified
                if max_age_seconds is not None:
                    entry = self.cache_index[cache_key]
                    if time.time() - entry['last_accessed'] > max_age_seconds:
                        self._delete_entry(cache_key, cache_path)
                        return None
                
                # Update last accessed time
                self.cache_index[cache_key]['last_accessed'] = time.time()
                self._save_cache_index()
                
                # Load cached data
                with open(cache_path, 'rb') as f:
                    return joblib.load(f)
                
            except Exception as e:
                logger.warning(f"Cache read error for {cache_key}: {e}")
                self._delete_entry(cache_key, cache_path)
                return None
    
    def set(self, namespace: str, key: str, value: Any, ttl_seconds: Optional[int] = None):
        """
        Store a value in cache with TTL
        
        Args:
            namespace: Cache namespace
            key: Cache key within the namespace
            value: Value to cache (must be picklable)
            ttl_seconds: Time to live in seconds (None for no expiration)
        """
        cache_key = self._get_namespaced_key(namespace, key)
        cache_path = self.get_cache_path(cache_key)
        temp_path = f"{cache_path}.tmp"
        
        with self.lock:
            try:
                # Serialize to temporary file first
                with open(temp_path, 'wb') as f:
                    joblib.dump(value, f, compress=3)
                
                # Get file size
                file_size = os.path.getsize(temp_path)
                
                # Check cache size and evict if needed
                self._enforce_cache_limits(file_size)
                
                # Atomic rename
                os.replace(temp_path, cache_path)
                
                # Update cache index
                self.cache_index[cache_key] = {
                    'size': file_size,
                    'created': time.time(),
                    'last_accessed': time.time(),
                    'ttl': ttl_seconds,
                    'namespace': namespace
                }
                self._save_cache_index()
                
                logger.debug(f"Cached {namespace}:{key} ({file_size/1024:.1f} KB)")
                
            except Exception as e:
                logger.error(f"Cache write error for {cache_key}: {e}")
                if os.path.exists(temp_path):
                    try:
                        os.unlink(temp_path)
                    except:
                        pass
    
    def _enforce_cache_limits(self, new_entry_size: int):
        """Enforce cache size limits by removing old entries if needed"""
        current_size = sum(entry['size'] for entry in self.cache_index.values())
        
        # If we're over the limit, remove oldest items first
        if current_size + new_entry_size > self.max_bytes:
            # Sort by last accessed time (oldest first)
            entries = sorted(
                self.cache_index.items(),
                key=lambda x: x[1]['last_accessed']
            )
            
            for cache_key, entry in entries:
                if current_size <= self.max_bytes * 0.9:  # Stop at 90% of max
                    break
                    
                cache_path = self.get_cache_path(cache_key)
                self._delete_entry(cache_key, cache_path)
                current_size -= entry['size']
    
    def _delete_entry(self, cache_key: str, cache_path: str):
        """Safely delete a cache entry"""
        try:
            if cache_key in self.cache_index:
                del self.cache_index[cache_key]
                self._save_cache_index()
            
            if os.path.exists(cache_path):
                os.unlink(cache_path)
                
        except Exception as e:
            logger.error(f"Error deleting cache entry {cache_key}: {e}")
    
    def clear_namespace(self, namespace: str):
        """Clear all entries in a namespace"""
        with self.lock:
            to_delete = [
                (k, self.get_cache_path(k)) 
                for k in list(self.cache_index.keys())
                if k.startswith(f"{namespace}:")
            ]
            
            for cache_key, cache_path in to_delete:
                self._delete_entry(cache_key, cache_path)
            
            logger.info(f"Cleared cache namespace: {namespace}")
    
    def clear_all(self):
        """Clear the entire cache"""
        with self.lock:
            for filename in os.listdir(self.cache_dir):
                if filename.startswith('.'):
                    continue
                    
                file_path = os.path.join(self.cache_dir, filename)
                if os.path.isdir(file_path):
                    shutil.rmtree(file_path)
                else:
                    try:
                        os.unlink(file_path)
                    except Exception as e:
                        logger.error(f"Error deleting {file_path}: {e}")
            
            self.cache_index = {}
            self._save_cache_index()
            logger.info("Cleared all cache")
    
    def get_stats(self) -> Dict[str, Any]:
        """Get cache statistics"""
        with self.lock:
            total_size = sum(entry['size'] for entry in self.cache_index.values())
            namespace_sizes = {}
            
            for entry in self.cache_index.values():
                ns = entry['namespace']
                namespace_sizes[ns] = namespace_sizes.get(ns, 0) + entry['size']
            
            return {
                'total_entries': len(self.cache_index),
                'total_size_mb': total_size / (1024 * 1024),
                'max_size_mb': self.max_bytes / (1024 * 1024),
                'namespaces': {
                    ns: {
                        'entries': sum(1 for e in self.cache_index.values() 
                                    if e['namespace'] == ns),
                        'size_mb': size / (1024 * 1024)
                    }
                    for ns, size in namespace_sizes.items()
                }
            }


# Initialize global cache manager with 1GB limit by default
cache_manager = CacheManager(max_mb=1024)

# Add cache decorator
def cached(namespace: str, ttl: int = 3600, key_func: Optional[Callable[..., str]] = None):
    """
    Decorator to cache function results
    
    Args:
        namespace: Cache namespace
        ttl: Time to live in seconds
        key_func: Optional function to generate cache key from function arguments
    """
    def decorator(func: F) -> F:
        @wraps(func)
        def wrapper(*args, **kwargs):
            # Generate cache key
            if key_func is not None:
                cache_key = key_func(*args, **kwargs)
            else:
                # Default key generation
                key_parts = [str(arg) for arg in args[1:]]  # Skip 'self' for methods
                key_parts.extend(f"{k}={v}" for k, v in sorted(kwargs.items()))
                cache_key = hashlib.md5("".join(key_parts).encode()).hexdigest()
            
            # Try to get from cache
            cached_result = cache_manager.get(namespace, cache_key, ttl)
            if cached_result is not None:
                logger.debug(f"Cache hit for {func.__name__} (key: {cache_key})")
                return cached_result
            
            # Call function if not in cache
            result = func(*args, **kwargs)
            
            # Store result in cache
            if result is not None:
                cache_manager.set(namespace, cache_key, result, ttl)
            
            return result
        return cast(F, wrapper)
    return decorator
