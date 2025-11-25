"""
Metadata API endpoints for dynamic frontend data
Provides categories, locations, and other configuration data
"""

from fastapi import APIRouter, Depends
from sqlalchemy.orm import Session
from sqlalchemy import distinct
from db.database import get_db
from models.models import Product, User, AdminGroup
from typing import List, Dict
from pydantic import BaseModel

router = APIRouter()

class MetadataResponse(BaseModel):
    categories: List[str]
    locations: List[str]
    budget_ranges: List[Dict[str, str]]
    experience_levels: List[Dict[str, str]]
    group_sizes: List[Dict[str, str]]
    participation_frequencies: List[Dict[str, str]]

class CategoriesResponse(BaseModel):
    categories: List[str]

class LocationsResponse(BaseModel):
    locations: List[str]

@router.get("/metadata", response_model=MetadataResponse)
async def get_all_metadata(db: Session = Depends(get_db)):
    """
    Get all metadata for frontend dropdowns and forms
    Returns categories, locations, and all configuration options
    """
    # Get unique categories from products and admin groups
    product_categories = db.query(distinct(Product.category)).filter(
        Product.category.isnot(None),
        Product.is_active == True
    ).all()
    
    admin_group_categories = db.query(distinct(AdminGroup.category)).filter(
        AdminGroup.category.isnot(None),
        AdminGroup.is_active == True
    ).all()
    
    # Combine and deduplicate categories
    categories = sorted(set(
        [cat[0] for cat in product_categories if cat[0]] +
        [cat[0] for cat in admin_group_categories if cat[0]]
    ))
    
    # Get unique locations from users
    user_locations = db.query(distinct(User.location_zone)).filter(
        User.location_zone.isnot(None)
    ).all()
    
    locations = sorted(set([loc[0] for loc in user_locations if loc[0]]))
    
    # If no locations found, provide defaults
    if not locations:
        locations = [
            "Mbare",
            "Harare CBD",
            "Chitungwiza",
            "Epworth",
            "Glen View",
            "Highfield",
            "Kuwadzana",
            "Warren Park"
        ]
    
    # Budget ranges (consistent across platform)
    budget_ranges = [
        {"value": "low", "label": "Low", "description": "Under $50/month"},
        {"value": "medium", "label": "Medium", "description": "$50 - $150/month"},
        {"value": "high", "label": "High", "description": "Over $150/month"}
    ]
    
    # Experience levels
    experience_levels = [
        {"value": "beginner", "label": "Beginner", "description": "New to group buying"},
        {"value": "intermediate", "label": "Intermediate", "description": "Some experience"},
        {"value": "advanced", "label": "Advanced", "description": "Very experienced"}
    ]
    
    # Group sizes
    group_sizes = [
        {"value": "small", "label": "Small", "description": "5-15 people"},
        {"value": "medium", "label": "Medium", "description": "15-50 people"},
        {"value": "large", "label": "Large", "description": "50+ people"}
    ]
    
    # Participation frequencies
    participation_frequencies = [
        {"value": "occasional", "label": "Occasional", "description": "Few times a year"},
        {"value": "regular", "label": "Regular", "description": "Monthly"},
        {"value": "frequent", "label": "Frequent", "description": "Weekly"}
    ]
    
    return MetadataResponse(
        categories=categories,
        locations=locations,
        budget_ranges=budget_ranges,
        experience_levels=experience_levels,
        group_sizes=group_sizes,
        participation_frequencies=participation_frequencies
    )

@router.get("/categories", response_model=CategoriesResponse)
async def get_categories(db: Session = Depends(get_db)):
    """
    Get all active product categories
    Returns unique categories from products and admin groups
    """
    # Get unique categories from products
    product_categories = db.query(distinct(Product.category)).filter(
        Product.category.isnot(None),
        Product.is_active == True
    ).all()
    
    # Get unique categories from admin groups
    admin_group_categories = db.query(distinct(AdminGroup.category)).filter(
        AdminGroup.category.isnot(None),
        AdminGroup.is_active == True
    ).all()
    
    # Combine and deduplicate
    categories = sorted(set(
        [cat[0] for cat in product_categories if cat[0]] +
        [cat[0] for cat in admin_group_categories if cat[0]]
    ))
    
    return CategoriesResponse(categories=categories)

@router.get("/locations", response_model=LocationsResponse)
async def get_locations(db: Session = Depends(get_db)):
    """
    Get all active locations
    Returns unique locations from users
    """
    # Get unique locations from users
    user_locations = db.query(distinct(User.location_zone)).filter(
        User.location_zone.isnot(None)
    ).all()
    
    locations = sorted(set([loc[0] for loc in user_locations if loc[0]]))
    
    # If no locations found, provide defaults
    if not locations:
        locations = [
            "Mbare",
            "Harare CBD",
            "Chitungwiza",
            "Epworth",
            "Glen View",
            "Highfield",
            "Kuwadzana",
            "Warren Park"
        ]
    
    return LocationsResponse(locations=locations)

@router.post("/categories/{category}")
async def add_category(category: str, db: Session = Depends(get_db)):
    """
    Admin endpoint to add a new category
    (Categories are automatically added when products/admin groups are created)
    """
    # This is a placeholder - categories are managed through products/admin groups
    return {"message": f"Category '{category}' will be available when products are added"}

@router.post("/locations/{location}")
async def add_location(location: str, db: Session = Depends(get_db)):
    """
    Admin endpoint to add a new location
    (Locations are automatically added when users register)
    """
    # This is a placeholder - locations are managed through user registrations
    return {"message": f"Location '{location}' will be available when users register"}

