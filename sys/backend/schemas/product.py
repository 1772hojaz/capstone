"""
Pydantic models for product-related schemas
"""
from typing import List, Optional
from pydantic import BaseModel

class ProductBase(BaseModel):
    name: str
    description: str
    image_url: Optional[str] = None
    unit_price: float
    bulk_price: float
    moq: int
    category: Optional[str] = None

class ProductCreate(ProductBase):
    pass

class ProductUpdate(BaseModel):
    name: Optional[str] = None
    description: Optional[str] = None
    image_url: Optional[str] = None
    unit_price: Optional[float] = None
    bulk_price: Optional[float] = None
    moq: Optional[int] = None
    category: Optional[str] = None
    is_active: Optional[bool] = None

class ProductResponse(ProductBase):
    id: int
    is_active: bool = True

    class Config:
        from_attributes = True
