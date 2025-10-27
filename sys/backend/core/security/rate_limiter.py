import time
from typing import Optional, Tuple, Callable, Any
from functools import wraps
import redis
import os
import sys
from fastapi import HTTPException, Request, status
from fastapi.responses import JSONResponse

# Add project root to Python path
sys.path.append(os.path.dirname(os.path.dirname(os.path.dirname(os.path.dirname(os.path.abspath(__file__))))))

from core.config import settings
from core.logging import get_logger

logger = get_logger(__name__)

class RateLimiter:
    """Redis-based rate limiter for API endpoints"""
    
    def __init__(self, redis_client: Optional[redis.Redis] = None):
        """Initialize rate limiter with Redis client"""
        self.redis = redis_client or self._create_redis_client()
        self.rate_limit = settings.RATE_LIMIT
        
    def _create_redis_client(self) -> redis.Redis:
        """Create a Redis client"""
        try:
            return redis.Redis(
                host=settings.REDIS_HOST,
                port=settings.REDIS_PORT,
                db=settings.REDIS_DB,
                password=settings.REDIS_PASSWORD or None,
                socket_timeout=5,
                socket_connect_timeout=5,
                retry_on_timeout=True,
                decode_responses=False
            )
        except Exception as e:
            logger.error(f"Failed to connect to Redis: {str(e)}")
            raise
    
    def _parse_rate_limit(self) -> Tuple[int, int]:
        """Parse rate limit string (e.g., '100/day;10/hour')"""
        limits = {}
        for limit in self.rate_limit.split(';'):
            try:
                count, period = limit.strip().split('/')
                count = int(count)
                
                # Convert period to seconds
                if period.startswith('second'):
                    period_seconds = 1
                elif period.startswith('minute'):
                    period_seconds = 60
                elif period.startswith('hour'):
                    period_seconds = 3600
                elif period.startswith('day'):
                    period_seconds = 86400
                else:
                    continue
                
                limits[period_seconds] = (count, period_seconds)
            except (ValueError, AttributeError):
                continue
        
        # Return the most restrictive limit
        return min(limits.values(), key=lambda x: x[0] / x[1]) if limits else (60, 60)
    
    def get_key(self, request: Request) -> str:
        """Generate a rate limit key for the request"""
        # Use client IP as the base key
        client_ip = request.client.host if request.client else 'unknown'
        endpoint = request.url.path
        return f"rate_limit:{client_ip}:{endpoint}"
    
    async def is_rate_limited(self, key: str) -> Tuple[bool, dict]:
        """Check if the request is rate limited"""
        max_requests, period = self._parse_rate_limit()
        current_time = int(time.time())
        
        try:
            # Use Redis pipeline for atomic operations
            with self.redis.pipeline() as pipe:
                # Remove old timestamps
                pipe.zremrangebyscore(key, 0, current_time - period)
                
                # Get current count
                pipe.zcard(key)
                
                # Add current timestamp
                pipe.zadd(key, {current_time: current_time})
                
                # Set expiration
                pipe.expire(key, period)
                
                # Execute pipeline
                _, count, _, _ = pipe.execute()
            
            # Check if rate limit exceeded
            remaining = max(0, max_requests - count)
            reset_time = current_time + period
            
            headers = {
                'X-RateLimit-Limit': str(max_requests),
                'X-RateLimit-Remaining': str(remaining),
                'X-RateLimit-Reset': str(reset_time)
            }
            
            if count >= max_requests:
                return True, headers
                
            return False, headers
            
        except Exception as e:
            logger.error(f"Rate limiter error: {str(e)}")
            # Fail open - don't block requests if Redis is down
            return False, {}
    
    def __call__(self, key_func: Optional[Callable[[Request], str]] = None):
        """Decorator for rate limiting endpoints"""
        def decorator(func):
            @wraps(func)
            async def wrapper(request: Request, *args, **kwargs):
                # Generate rate limit key
                key = key_func(request) if key_func else self.get_key(request)
                
                # Check rate limit
                is_limited, headers = await self.is_rate_limited(key)
                
                if is_limited:
                    return JSONResponse(
                        status_code=status.HTTP_429_TOO_MANY_REQUESTS,
                        content={"detail": "Rate limit exceeded"},
                        headers=headers
                    )
                
                # Add rate limit headers to response
                response = await func(request, *args, **kwargs)
                for k, v in headers.items():
                    response.headers[k] = str(v)
                
                return response
            
            return wrapper
        
        return decorator

# Global rate limiter instance
rate_limiter = RateLimiter()
