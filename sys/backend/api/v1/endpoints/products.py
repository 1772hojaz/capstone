from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy.orm import Session
from typing import List, Optional
import os
import sys

# Add project root to Python path
sys.path.append(os.path.dirname(os.path.dirname(os.path.dirname(os.path.dirname(os.path.abspath(__file__))))))

# Import database and models
from db.database import get_db
from models.product import Product
from schemas.product import ProductCreate, ProductUpdate, ProductResponse
from .auth import verify_token, verify_admin

router = APIRouter()

# Routes
@router.get("/", response_model=List[ProductResponse])
async def get_products(
    is_active: bool = True,
    category: Optional[str] = None,
    db: Session = Depends(get_db)
):
    """Get all active products for webshop"""
    query = db.query(Product)
    
    if is_active is not None:
        query = query.filter(Product.is_active == is_active)
    
    if category:
        query = query.filter(Product.category == category)
    
    products = query.all()
    return products

@router.get("/{product_id}", response_model=ProductResponse)
async def get_product(product_id: int, db: Session = Depends(get_db)):
    """Get a specific product by ID"""
    product = db.query(Product).filter(Product.id == product_id).first()
    if not product:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Product not found")
    return product

@router.post("/", response_model=ProductResponse)
async def create_product(
    product_data: ProductCreate,
    admin = Depends(verify_admin),
    db: Session = Depends(get_db)
):
    """Admin only: Create a new product"""
    new_product = Product(
        name=product_data.name,
        description=product_data.description,
        image_url=product_data.image_url,
        unit_price=product_data.unit_price,
        bulk_price=product_data.bulk_price,
        moq=product_data.moq,
        category=product_data.category
    )
    
    db.add(new_product)
    db.commit()
    db.refresh(new_product)
    
    return new_product

@router.put("/{product_id}", response_model=ProductResponse)
async def update_product(
    product_id: int,
    product_data: ProductUpdate,
    admin = Depends(verify_admin),
    db: Session = Depends(get_db)
):
    """Admin only: Update a product"""
    product = db.query(Product).filter(Product.id == product_id).first()
    if not product:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Product not found")
    
    update_data = product_data.dict(exclude_unset=True)
    for field, value in update_data.items():
        setattr(product, field, value)
    
    db.commit()
    db.refresh(product)
    
    return product

@router.delete("/{product_id}")
async def delete_product(
    product_id: int,
    admin = Depends(verify_admin),
    db: Session = Depends(get_db)
):
    """Admin only: Delete (deactivate) a product"""
    product = db.query(Product).filter(Product.id == product_id).first()
    if not product:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Product not found")
    
    product.is_active = False
    db.commit()
    
    return {"message": "Product deactivated successfully"}