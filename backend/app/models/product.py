from typing import Optional, Union
from datetime import datetime
from pydantic import BaseModel, Field

class ProductBase(BaseModel):
    name: str = Field(..., example="Black Pepper 550 G/L")
    category: str = Field(..., example="Whole Spices")
    grade: str = Field(..., example="Export Quality")
    origin: str = Field(..., example="Kerala / Vietnam")
    stock_mt: float = Field(0.0, example=420.0)
    price_mt: str = Field(..., example="$6,400")
    packaging: str = Field(..., example="50kg PP Bag")
    status: str = Field("In Stock", example="In Stock")

class ProductCreate(ProductBase):
    pass

class ProductUpdate(BaseModel):
    name: Optional[str] = None
    category: Optional[str] = None
    grade: Optional[str] = None
    origin: Optional[str] = None
    stock_mt: Optional[float] = None
    price_mt: Optional[str] = None
    packaging: Optional[str] = None
    status: Optional[str] = None

class ProductResponse(ProductBase):
    id: str
    created_at: Optional[Union[datetime, str]] = None
    updated_at: Optional[Union[datetime, str]] = None
