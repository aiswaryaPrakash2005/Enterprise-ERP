from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy.orm import Session
from typing import List
from app.database.session import get_db
from app.models.finance import FinancialTransaction
from app.schemas.finance import FinancialTransactionOut, FinancialTransactionCreate, FinancialSummaryOut
from app.auth.jwt import get_current_user
from app.auth.rbac import require_roles

router = APIRouter(prefix="/api/finance", tags=["Finance Management"])

@router.get("/transactions", response_model=List[FinancialTransactionOut])
def get_transactions(db: Session = Depends(get_db), current_user = Depends(get_current_user)):
    return db.query(FinancialTransaction).order_by(FinancialTransaction.id.desc()).all()

@router.post("/transactions", response_model=FinancialTransactionOut)
def create_transaction(trx_in: FinancialTransactionCreate, db: Session = Depends(get_db), current_user = Depends(require_roles(["Admin", "Finance Manager"]))):
    db_trx = FinancialTransaction(**trx_in.model_dump())
    db.add(db_trx)
    db.commit()
    db.refresh(db_trx)
    return db_trx

@router.get("/summary", response_model=FinancialSummaryOut)
def get_financial_summary(db: Session = Depends(get_db), current_user = Depends(get_current_user)):
    transactions = db.query(FinancialTransaction).all()
    income = sum(t.amount for t in transactions if t.type == "Income")
    expense = sum(t.amount for t in transactions if t.type == "Expense")
    income_count = sum(1 for t in transactions if t.type == "Income")
    expense_count = sum(1 for t in transactions if t.type == "Expense")

    return {
        "total_income": income,
        "total_expense": expense,
        "net_profit": income - expense,
        "income_count": income_count,
        "expense_count": expense_count
    }
