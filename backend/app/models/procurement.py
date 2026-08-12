from sqlalchemy import Column, Integer, String, Float, ForeignKey, DateTime, Text
from sqlalchemy.orm import relationship
from datetime import datetime
from app.database.base import Base

class PurchaseOrder(Base):
    __tablename__ = "purchase_orders"

    id = Column(Integer, primary_key=True, index=True)
    po_no = Column(String, unique=True, index=True, nullable=False)
    supplier_id = Column(Integer, ForeignKey("suppliers.id"), nullable=False)
    order_date = Column(String, nullable=False)
    expected_date = Column(String, nullable=True)
    total_cost = Column(Float, default=0.0)
    status = Column(String, default="Pending") # Pending, Approved, Received, Cancelled

    supplier_rel = relationship("Supplier", back_populates="purchase_orders")
    items = relationship("PurchaseItem", back_populates="po_rel", cascade="all, delete-orphan")

class PurchaseItem(Base):
    __tablename__ = "purchase_items"

    id = Column(Integer, primary_key=True, index=True)
    po_id = Column(Integer, ForeignKey("purchase_orders.id"), nullable=False)
    product_id = Column(Integer, ForeignKey("products.id"), nullable=False)
    quantity = Column(Integer, nullable=False)
    unit_cost = Column(Float, nullable=False)
    subtotal = Column(Float, nullable=False)

    po_rel = relationship("PurchaseOrder", back_populates="items")
    product_rel = relationship("Product")
