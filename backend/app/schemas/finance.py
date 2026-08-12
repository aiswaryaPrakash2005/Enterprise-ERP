from pydantic import BaseModel
from typing import Optional

class FinancialTransactionBase(BaseModel):
    trx_no: str
    type: str # Income, Expense
    category: str
    amount: float
    description: Optional[str] = None
    date: str
    reference_id: Optional[str] = None

class FinancialTransactionCreate(FinancialTransactionBase):
    pass

class FinancialTransactionOut(FinancialTransactionBase):
    id: int
    class Config:
        from_attributes = True

class FinancialSummaryOut(BaseModel):
    total_income: float
    total_expense: float
    net_profit: float
    income_count: int
    expense_count: int
