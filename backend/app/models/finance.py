from sqlalchemy import Column, Integer, String, Float, DateTime, Text
from datetime import datetime
from app.database.base import Base

class FinancialTransaction(Base):
    __tablename__ = "financial_transactions"

    id = Column(Integer, primary_key=True, index=True)
    trx_no = Column(String, unique=True, index=True, nullable=False)
    type = Column(String, nullable=False) # Income, Expense
    category = Column(String, nullable=False) # Sales Revenue, Supplier Purchase, Payroll, Utilities, Marketing
    amount = Column(Float, nullable=False)
    description = Column(Text, nullable=True)
    date = Column(String, nullable=False)
    reference_id = Column(String, nullable=True) # Linked Order/PO/Invoice ID
