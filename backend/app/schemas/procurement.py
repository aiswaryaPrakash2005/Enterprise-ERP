from pydantic import BaseModel
from typing import Optional, List

class PurchaseItemCreate(BaseModel):
    product_id: int
    quantity: int
    unit_cost: float

class PurchaseItemOut(BaseModel):
    id: int
    product_id: int
    product_name: Optional[str] = None
    quantity: int
    unit_cost: float
    subtotal: float
    class Config:
        from_attributes = True

class PurchaseOrderCreate(BaseModel):
    supplier_id: int
    expected_date: Optional[str] = None
    items: List[PurchaseItemCreate]

class PurchaseOrderOut(BaseModel):
    id: int
    po_no: str
    supplier_id: int
    supplier_name: Optional[str] = None
    order_date: str
    expected_date: Optional[str] = None
    total_cost: float
    status: str
    items: List[PurchaseItemOut] = []
    class Config:
        from_attributes = True
