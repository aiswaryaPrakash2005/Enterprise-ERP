from fastapi import APIRouter, Depends
from sqlalchemy.orm import Session
from app.database.session import get_db
from app.models.hr import Employee
from app.models.inventory import Product
from app.models.sales import SalesOrder
from app.models.procurement import PurchaseOrder
from app.models.finance import FinancialTransaction
from app.schemas.dashboard import DashboardMetricsOut
from app.auth.jwt import get_current_user

router = APIRouter(prefix="/api/dashboard", tags=["Dashboard"])

@router.get("/summary", response_model=DashboardMetricsOut)
def get_dashboard_summary(db: Session = Depends(get_db), current_user = Depends(get_current_user)):
    employees_count = db.query(Employee).count()
    products = db.query(Product).all()
    products_count = len(products)

    inventory_value = sum(p.stock_quantity * p.selling_price for p in products)
    low_stock = [p for p in products if p.stock_quantity <= p.min_stock_level]

    sales_orders = db.query(SalesOrder).all()
    total_sales_revenue = sum(so.total_amount for so in sales_orders if so.status != "Cancelled")

    pending_purchases = db.query(PurchaseOrder).filter(PurchaseOrder.status == "Pending").count()

    transactions = db.query(FinancialTransaction).all()
    total_expenses = sum(t.amount for t in transactions if t.type == "Expense")
    total_income = sum(t.amount for t in transactions if t.type == "Income")
    net_profit = total_income - total_expenses

    # Format recent transactions
    recent_trxs = [
        {
            "id": t.id,
            "trx_no": t.trx_no,
            "type": t.type,
            "category": t.category,
            "amount": t.amount,
            "description": t.description,
            "date": t.date
        }
        for t in sorted(transactions, key=lambda x: x.id, reverse=True)[:5]
    ]

    # Chart 1: Sales/Revenue vs Expense by Category
    sales_chart = [
        {"name": "Sales Revenue", "value": total_sales_revenue},
        {"name": "Supplier Purchases", "value": sum(t.amount for t in transactions if t.category == "Supplier Purchase")},
        {"name": "Payroll Expense", "value": sum(t.amount for t in transactions if t.category == "Payroll")},
        {"name": "Utilities & Marketing", "value": sum(t.amount for t in transactions if t.category in ["Utilities", "Marketing"])},
    ]

    # Chart 2: Inventory Distribution by Stock Quantity
    inventory_chart = [
        {"name": p.name[:15] + "...", "quantity": p.stock_quantity, "min_stock": p.min_stock_level}
        for p in products[:6]
    ]

    return {
        "total_employees": employees_count,
        "total_products": products_count,
        "total_inventory_value": round(inventory_value, 2),
        "total_sales_revenue": round(total_sales_revenue, 2),
        "pending_purchases_count": pending_purchases,
        "total_expenses": round(total_expenses, 2),
        "net_profit": round(net_profit, 2),
        "low_stock_count": len(low_stock),
        "recent_transactions": recent_trxs,
        "sales_chart_data": sales_chart,
        "inventory_chart_data": inventory_chart
    }
