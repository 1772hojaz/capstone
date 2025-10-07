from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy.orm import Session
from pydantic import BaseModel
from typing import List, Optional
from database import get_db
from models import Product
from auth import verify_token, verify_admin

router = APIRouter()

# Pydantic Models
class ProductCreate(BaseModel):
    name: str
    description: str
    image_url: Optional[str] = None
    unit_price: float
    bulk_price: float
    unit_price_zig: Optional[float] = None
    bulk_price_zig: Optional[float] = None
    moq: int
    category: Optional[str] = None

class ProductUpdate(BaseModel):
    name: Optional[str] = None
    description: Optional[str] = None
    image_url: Optional[str] = None
    unit_price: Optional[float] = None
    bulk_price: Optional[float] = None
    unit_price_zig: Optional[float] = None
    bulk_price_zig: Optional[float] = None
    moq: Optional[int] = None
    category: Optional[str] = None
    is_active: Optional[bool] = None

class ProductResponse(BaseModel):
    id: int
    name: str
    description: str
    image_url: Optional[str]
    unit_price: float
    bulk_price: float
    unit_price_zig: Optional[float]
    bulk_price_zig: Optional[float]
    moq: int
    category: Optional[str]
    is_active: bool
    savings_factor: float

    class Config:
        from_attributes = True

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
        unit_price_zig=product_data.unit_price_zig,
        bulk_price_zig=product_data.bulk_price_zig,
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