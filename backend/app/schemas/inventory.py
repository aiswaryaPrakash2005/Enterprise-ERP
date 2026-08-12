from pydantic import BaseModel
from typing import Optional, List

class CategoryBase(BaseModel):
    name: str
    description: Optional[str] = None

class CategoryCreate(CategoryBase):
    pass

class CategoryOut(CategoryBase):
    id: int
    class Config:
        from_attributes = True

class SupplierBase(BaseModel):
    name: str
    contact_person: Optional[str] = None
    email: Optional[str] = None
    phone: Optional[str] = None
    address: Optional[str] = None

class SupplierCreate(SupplierBase):
    pass

class SupplierOut(SupplierBase):
    id: int
    class Config:
        from_attributes = True

class ProductBase(BaseModel):
    sku: str
    name: str
    category_id: Optional[int] = None
    supplier_id: Optional[int] = None
    stock_quantity: int = 0
    min_stock_level: int = 5
    purchase_price: float = 0.0
    selling_price: float = 0.0
    unit: Optional[str] = "pcs"

class ProductCreate(ProductBase):
    pass

class ProductOut(ProductBase):
    id: int
    category_name: Optional[str] = None
    supplier_name: Optional[str] = None
    class Config:
        from_attributes = True

class StockAdjustment(BaseModel):
    product_id: int
    adjustment_type: str # STOCK_IN, STOCK_OUT, ADJUSTMENT
    quantity: int
    notes: Optional[str] = None
