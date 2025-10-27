"""ML services package exports.

Expose the FastAPI `router` from the service module so callers can
`from services.ml import router` (used by main.py). We avoid importing
non-existent classes like `MLService` which were expected by earlier
versions of the code.
"""
from .service import router

__all__ = [
    'router',
]
