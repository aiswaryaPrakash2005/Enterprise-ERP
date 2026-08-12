from pydantic import BaseModel
from typing import List, Dict, Any
from app.schemas.sales import SalesOrderOut
from app.schemas.procurement import PurchaseOrderOut
from app.schemas.inventory import ProductOut

class DashboardMetricsOut(BaseModel):
    total_employees: int
    total_products: int
    total_inventory_value: float
    total_sales_revenue: float
    pending_purchases_count: int
    total_expenses: float
    net_profit: float
    low_stock_count: int
    recent_transactions: List[Dict[str, Any]]
    sales_chart_data: List[Dict[str, Any]]
    inventory_chart_data: List[Dict[str, Any]]
