from pydantic import BaseModel, EmailStr
from typing import Optional, List

class CustomerBase(BaseModel):
    name: str
    email: Optional[EmailStr] = None
    phone: Optional[str] = None
    company: Optional[str] = None
    address: Optional[str] = None

class CustomerCreate(CustomerBase):
    pass

class CustomerOut(CustomerBase):
    id: int
    total_spending: float = 0.0
    class Config:
        from_attributes = True

class OrderItemCreate(BaseModel):
    product_id: int
    quantity: int
    unit_price: float

class OrderItemOut(BaseModel):
    id: int
    product_id: int
    product_name: Optional[str] = None
    quantity: int
    unit_price: float
    subtotal: float
    class Config:
        from_attributes = True

class SalesOrderCreate(BaseModel):
    customer_id: int
    items: List[OrderItemCreate]

class SalesOrderOut(BaseModel):
    id: int
    order_no: str
    customer_id: int
    customer_name: Optional[str] = None
    order_date: str
    total_amount: float
    status: str
    invoice_no: Optional[str] = None
    items: List[OrderItemOut] = []
    class Config:
        from_attributes = True
