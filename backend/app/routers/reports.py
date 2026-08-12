from fastapi import APIRouter, Depends, Query
from sqlalchemy.orm import Session
from datetime import datetime, timedelta
from typing import Optional
from app.database.session import get_db
from app.models.sales import SalesOrder
from app.models.procurement import PurchaseOrder
from app.models.inventory import Product
from app.models.hr import Employee
from app.models.finance import FinancialTransaction
from app.auth.jwt import get_current_user

router = APIRouter(prefix="/api/reports", tags=["Reports & Analytics"])

@router.get("/analytics")
def get_reports_analytics(
    range_filter: str = Query("this_month", description="today, this_week, this_month, this_year, all"),
    start_date: Optional[str] = None,
    end_date: Optional[str] = None,
    db: Session = Depends(get_db),
    current_user = Depends(get_current_user)
):
    now = datetime.utcnow()
    
    # Calculate date threshold
    if range_filter == "today":
        cutoff = now.strftime("%Y-%m-%d")
    elif range_filter == "this_week":
        cutoff = (now - timedelta(days=7)).strftime("%Y-%m-%d")
    elif range_filter == "this_month":
        cutoff = (now - timedelta(days=30)).strftime("%Y-%m-%d")
    elif range_filter == "this_year":
        cutoff = (now - timedelta(days=365)).strftime("%Y-%m-%d")
    else:
        cutoff = "1970-01-01"

    # Sales Report
    sales_orders = db.query(SalesOrder).filter(SalesOrder.order_date >= cutoff).all()
    total_sales = sum(s.total_amount for s in sales_orders)

    # Purchases Report
    purchase_orders = db.query(PurchaseOrder).filter(PurchaseOrder.order_date >= cutoff).all()
    total_purchases = sum(p.total_cost for p in purchase_orders)

    # Financial Transactions
    transactions = db.query(FinancialTransaction).filter(FinancialTransaction.date >= cutoff).all()
    income = sum(t.amount for t in transactions if t.type == "Income")
    expense = sum(t.amount for t in transactions if t.type == "Expense")

    # Inventory Metrics
    products = db.query(Product).all()
    total_inventory_valuation = sum(p.stock_quantity * p.selling_price for p in products)

    # HR Metrics
    total_employees = db.query(Employee).count()

    return {
        "range_filter": range_filter,
        "cutoff_date": cutoff,
        "sales_summary": {
            "order_count": len(sales_orders),
            "total_sales_revenue": total_sales
        },
        "procurement_summary": {
            "order_count": len(purchase_orders),
            "total_purchase_cost": total_purchases
        },
        "finance_summary": {
            "total_income": income,
            "total_expense": expense,
            "net_profit": income - expense
        },
        "inventory_summary": {
            "total_skus": len(products),
            "valuation": total_inventory_valuation
        },
        "hr_summary": {
            "total_employees": total_employees
        }
    }
