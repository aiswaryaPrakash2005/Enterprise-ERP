from sqlalchemy import Column, Integer, String, Float, ForeignKey, DateTime, Text
from sqlalchemy.orm import relationship
from datetime import datetime
from app.database.base import Base

class Category(Base):
    __tablename__ = "categories"

    id = Column(Integer, primary_key=True, index=True)
    name = Column(String, unique=True, nullable=False)
    description = Column(Text, nullable=True)

    products = relationship("Product", back_populates="category_rel")

class Supplier(Base):
    __tablename__ = "suppliers"

    id = Column(Integer, primary_key=True, index=True)
    name = Column(String, nullable=False)
    contact_person = Column(String, nullable=True)
    email = Column(String, nullable=True)
    phone = Column(String, nullable=True)
    address = Column(Text, nullable=True)

    products = relationship("Product", back_populates="supplier_rel")
    purchase_orders = relationship("PurchaseOrder", back_populates="supplier_rel")

class Product(Base):
    __tablename__ = "products"

    id = Column(Integer, primary_key=True, index=True)
    sku = Column(String, unique=True, index=True, nullable=False)
    name = Column(String, nullable=False)
    category_id = Column(Integer, ForeignKey("categories.id"), nullable=True)
    supplier_id = Column(Integer, ForeignKey("suppliers.id"), nullable=True)
    stock_quantity = Column(Integer, default=0)
    min_stock_level = Column(Integer, default=5)
    purchase_price = Column(Float, default=0.0)
    selling_price = Column(Float, default=0.0)
    unit = Column(String, default="pcs")
    created_at = Column(DateTime, default=datetime.utcnow)

    category_rel = relationship("Category", back_populates="products")
    supplier_rel = relationship("Supplier", back_populates="products")
    transactions = relationship("InventoryTransaction", back_populates="product")

class InventoryTransaction(Base):
    __tablename__ = "inventory_transactions"

    id = Column(Integer, primary_key=True, index=True)
    product_id = Column(Integer, ForeignKey("products.id"), nullable=False)
    transaction_type = Column(String, nullable=False) # STOCK_IN, STOCK_OUT, ADJUSTMENT
    quantity = Column(Integer, nullable=False)
    reference_no = Column(String, nullable=True)
    notes = Column(Text, nullable=True)
    date = Column(DateTime, default=datetime.utcnow)

    product = relationship("Product", back_populates="transactions")
