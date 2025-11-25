import os
import json
from typing import Any, Callable, Optional
from functools import wraps

import redis

REDIS_URL = os.getenv("REDIS_URL", "redis://localhost:6379/0")

_redis_client: Optional[redis.Redis] = None

def get_redis() -> redis.Redis:
    global _redis_client
    if _redis_client is None:
        _redis_client = redis.from_url(REDIS_URL, decode_responses=True)
    return _redis_client

def cache_set(key: str, value: Any, ttl_seconds: int = 300) -> None:
    r = get_redis()
    payload = json.dumps(value, default=str)
    r.setex(key, ttl_seconds, payload)

def cache_get(key: str) -> Optional[Any]:
    r = get_redis()
    payload = r.get(key)
    if payload is None:
        return None
    try:
        return json.loads(payload)
    except Exception:
        return payload

def cached(ttl_seconds: int = 300, make_key: Optional[Callable[..., str]] = None):
    """Simple cache decorator backed by Redis."""
    def decorator(fn: Callable[..., Any]):
        @wraps(fn)
        def wrapper(*args, **kwargs):
            key = None
            if make_key:
                key = make_key(*args, **kwargs)
            else:
                key = f"cache:{fn.__module__}.{fn.__name__}:{hash(str(args) + str(sorted(kwargs.items())))}"
            cached_value = cache_get(key)
            if cached_value is not None:
                return cached_value
            result = fn(*args, **kwargs)
            try:
                cache_set(key, result, ttl_seconds)
            except Exception:
                pass
            return result
        return wrapper
    return decorator

# Session helpers (optional)
SESSION_PREFIX = "session:"

def set_session(token: str, data: dict, ttl_seconds: int) -> None:
    cache_set(SESSION_PREFIX + token, data, ttl_seconds)

def get_session(token: str) -> Optional[dict]:
    return cache_get(SESSION_PREFIX + token)

def revoke_session(token: str) -> None:
    r = get_redis()
    r.delete(SESSION_PREFIX + token)

