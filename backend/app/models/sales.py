from sqlalchemy import Column, Integer, String, Float, ForeignKey, DateTime, Text
from sqlalchemy.orm import relationship
from datetime import datetime
from app.database.base import Base

class Customer(Base):
    __tablename__ = "customers"

    id = Column(Integer, primary_key=True, index=True)
    name = Column(String, nullable=False)
    email = Column(String, nullable=True)
    phone = Column(String, nullable=True)
    company = Column(String, nullable=True)
    address = Column(Text, nullable=True)
    total_spending = Column(Float, default=0.0)

    sales_orders = relationship("SalesOrder", back_populates="customer_rel")

class SalesOrder(Base):
    __tablename__ = "sales_orders"

    id = Column(Integer, primary_key=True, index=True)
    order_no = Column(String, unique=True, index=True, nullable=False)
    customer_id = Column(Integer, ForeignKey("customers.id"), nullable=False)
    order_date = Column(String, nullable=False)
    total_amount = Column(Float, default=0.0)
    status = Column(String, default="Pending") # Pending, Processing, Shipped, Delivered, Cancelled
    invoice_no = Column(String, nullable=True)

    customer_rel = relationship("Customer", back_populates="sales_orders")
    items = relationship("OrderItem", back_populates="order_rel", cascade="all, delete-orphan")

class OrderItem(Base):
    __tablename__ = "order_items"

    id = Column(Integer, primary_key=True, index=True)
    order_id = Column(Integer, ForeignKey("sales_orders.id"), nullable=False)
    product_id = Column(Integer, ForeignKey("products.id"), nullable=False)
    quantity = Column(Integer, nullable=False)
    unit_price = Column(Float, nullable=False)
    subtotal = Column(Float, nullable=False)

    order_rel = relationship("SalesOrder", back_populates="items")
    product_rel = relationship("Product")
