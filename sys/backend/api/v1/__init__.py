"""
API v1 Package

This package contains version 1 of the ConnectSphere API.
It includes all the routes, models, and dependencies for the v1 API.
"""

from fastapi import APIRouter

# Create the main API v1 router
router = APIRouter(
    prefix="/api/v1",
    tags=["v1"],
    responses={404: {"description": "Not found"}},
)

# Import and include all API v1 routes here
# from .endpoints import users, products, recommendations, etc.

# Example:
# from .endpoints import auth
# router.include_router(auth.router, prefix="/auth", tags=["Authentication"])
