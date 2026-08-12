from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy.orm import Session
from typing import List
from datetime import datetime
from app.database.session import get_db
from app.models.sales import SalesOrder, OrderItem, Customer
from app.models.inventory import Product, InventoryTransaction
from app.models.finance import FinancialTransaction
from app.models.notification import Notification
from app.schemas.sales import SalesOrderOut, SalesOrderCreate
from app.auth.jwt import get_current_user
from app.auth.rbac import require_roles

router = APIRouter(prefix="/api/sales", tags=["Sales Management"])

@router.get("/orders", response_model=List[SalesOrderOut])
def get_sales_orders(db: Session = Depends(get_db), current_user = Depends(get_current_user)):
    orders = db.query(SalesOrder).order_by(SalesOrder.id.desc()).all()
    res = []
    for o in orders:
        out = SalesOrderOut.model_validate(o)
        out.customer_name = o.customer_rel.name if o.customer_rel else "Guest"
        res.append(out)
    return res

@router.post("/orders", response_model=SalesOrderOut)
def create_sales_order(order_in: SalesOrderCreate, db: Session = Depends(get_db), current_user = Depends(require_roles(["Admin", "Sales Manager"]))):
    customer = db.query(Customer).filter(Customer.id == order_in.customer_id).first()
    if not customer:
        raise HTTPException(status_code=404, detail="Customer not found")

    # Verify stock availability for all items
    total_amount = 0.0
    db_items = []
    for item in order_in.items:
        prod = db.query(Product).filter(Product.id == item.product_id).first()
        if not prod:
            raise HTTPException(status_code=404, detail=f"Product ID {item.product_id} not found")
        if prod.stock_quantity < item.quantity:
            raise HTTPException(status_code=400, detail=f"Insufficient stock for product '{prod.name}'. Requested: {item.quantity}, Available: {prod.stock_quantity}")
        
        subtotal = item.quantity * item.unit_price
        total_amount += subtotal
        db_items.append((prod, item.quantity, item.unit_price, subtotal))

    order_no = f"SO-2026-{db.query(SalesOrder).count() + 101}"
    invoice_no = f"INV-{order_no}"

    so = SalesOrder(
        order_no=order_no,
        customer_id=customer.id,
        order_date=datetime.utcnow().strftime("%Y-%m-%d"),
        total_amount=total_amount,
        status="Completed",
        invoice_no=invoice_no
    )
    db.add(so)
    db.flush() # get so.id

    # Create OrderItems and deduct product inventory
    for prod, qty, price, subtotal in db_items:
        item = OrderItem(
            order_id=so.id,
            product_id=prod.id,
            quantity=qty,
            unit_price=price,
            subtotal=subtotal
        )
        db.add(item)

        # Deduct Stock
        prod.stock_quantity -= qty

        # Log Inventory Transaction
        inv_trx = InventoryTransaction(
            product_id=prod.id,
            transaction_type="STOCK_OUT",
            quantity=qty,
            reference_no=order_no,
            notes=f"Sales Order {order_no} for {customer.name}"
        )
        db.add(inv_trx)

        # Check for Low-Stock alert trigger
        if prod.stock_quantity <= prod.min_stock_level:
            notif = Notification(
                title=f"Low Stock Alert: {prod.name}",
                message=f"Product '{prod.name}' (SKU: {prod.sku}) stock dropped to {prod.stock_quantity} (Min: {prod.min_stock_level}).",
                type="low_stock",
                is_read=False
            )
            db.add(notif)

    # Update Customer total spending
    customer.total_spending += total_amount

    # Log Financial Transaction (Income)
    fin_trx = FinancialTransaction(
        trx_no=f"TRX-{order_no}",
        type="Income",
        category="Sales Revenue",
        amount=total_amount,
        description=f"Sales Order revenue from {customer.name} ({order_no})",
        date=datetime.utcnow().strftime("%Y-%m-%d"),
        reference_id=order_no
    )
    db.add(fin_trx)

    db.commit()
    db.refresh(so)

    out = SalesOrderOut.model_validate(so)
    out.customer_name = customer.name
    return out

@router.put("/orders/{order_id}/status")
def update_order_status(order_id: int, status: str, db: Session = Depends(get_db), current_user = Depends(require_roles(["Admin", "Sales Manager"]))):
    so = db.query(SalesOrder).filter(SalesOrder.id == order_id).first()
    if not so:
        raise HTTPException(status_code=404, detail="Order not found")
    so.status = status
    db.commit()
    return {"message": f"Order status updated to {status}"}
