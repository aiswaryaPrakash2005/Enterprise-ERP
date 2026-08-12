from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy.orm import Session
from typing import List
from datetime import datetime
from app.database.session import get_db
from app.models.procurement import PurchaseOrder, PurchaseItem
from app.models.inventory import Product, Supplier, InventoryTransaction
from app.models.finance import FinancialTransaction
from app.models.notification import Notification
from app.schemas.procurement import PurchaseOrderOut, PurchaseOrderCreate
from app.auth.jwt import get_current_user
from app.auth.rbac import require_roles

router = APIRouter(prefix="/api/procurement", tags=["Procurement Management"])

@router.get("/orders", response_model=List[PurchaseOrderOut])
def get_purchase_orders(db: Session = Depends(get_db), current_user = Depends(get_current_user)):
    orders = db.query(PurchaseOrder).order_by(PurchaseOrder.id.desc()).all()
    res = []
    for o in orders:
        out = PurchaseOrderOut.model_validate(o)
        out.supplier_name = o.supplier_rel.name if o.supplier_rel else "Supplier"
        res.append(out)
    return res

@router.post("/orders", response_model=PurchaseOrderOut)
def create_purchase_order(po_in: PurchaseOrderCreate, db: Session = Depends(get_db), current_user = Depends(require_roles(["Admin", "Inventory Manager"]))):
    supplier = db.query(Supplier).filter(Supplier.id == po_in.supplier_id).first()
    if not supplier:
        raise HTTPException(status_code=404, detail="Supplier not found")

    total_cost = 0.0
    items_data = []
    for item in po_in.items:
        prod = db.query(Product).filter(Product.id == item.product_id).first()
        if not prod:
            raise HTTPException(status_code=404, detail=f"Product ID {item.product_id} not found")
        subtotal = item.quantity * item.unit_cost
        total_cost += subtotal
        items_data.append((prod, item.quantity, item.unit_cost, subtotal))

    po_no = f"PO-2026-{db.query(PurchaseOrder).count() + 201}"

    po = PurchaseOrder(
        po_no=po_no,
        supplier_id=supplier.id,
        order_date=datetime.utcnow().strftime("%Y-%m-%d"),
        expected_date=po_in.expected_date or datetime.utcnow().strftime("%Y-%m-%d"),
        total_cost=total_cost,
        status="Pending"
    )
    db.add(po)
    db.flush()

    for prod, qty, cost, subtotal in items_data:
        p_item = PurchaseItem(
            po_id=po.id,
            product_id=prod.id,
            quantity=qty,
            unit_cost=cost,
            subtotal=subtotal
        )
        db.add(p_item)

    # Notify pending purchase
    notif = Notification(
        title=f"New Purchase Order: {po_no}",
        message=f"Purchase order {po_no} issued to supplier {supplier.name} for ${total_cost:,.2f}.",
        type="pending_purchase",
        is_read=False
    )
    db.add(notif)

    db.commit()
    db.refresh(po)

    out = PurchaseOrderOut.model_validate(po)
    out.supplier_name = supplier.name
    return out

@router.put("/orders/{po_id}/receive")
def receive_purchase_order(po_id: int, db: Session = Depends(get_db), current_user = Depends(require_roles(["Admin", "Inventory Manager"]))):
    po = db.query(PurchaseOrder).filter(PurchaseOrder.id == po_id).first()
    if not po:
        raise HTTPException(status_code=404, detail="Purchase Order not found")
    if po.status == "Received":
        raise HTTPException(status_code=400, detail="Purchase Order already received")

    po.status = "Received"

    # Auto update stock and create finance expense record
    for item in po.items:
        prod = db.query(Product).filter(Product.id == item.product_id).first()
        if prod:
            prod.stock_quantity += item.quantity

            # Log Stock In
            inv_trx = InventoryTransaction(
                product_id=prod.id,
                transaction_type="STOCK_IN",
                quantity=item.quantity,
                reference_no=po.po_no,
                notes=f"Stock received from Purchase Order {po.po_no}"
            )
            db.add(inv_trx)

    # Log Expense
    fin_trx = FinancialTransaction(
        trx_no=f"TRX-{po.po_no}",
        type="Expense",
        category="Supplier Purchase",
        amount=po.total_cost,
        description=f"Payment for Purchase Order {po.po_no} to {po.supplier_rel.name if po.supplier_rel else 'Supplier'}",
        date=datetime.utcnow().strftime("%Y-%m-%d"),
        reference_id=po.po_no
    )
    db.add(fin_trx)

    db.commit()
    return {"message": f"Purchase Order {po.po_no} received successfully. Stock and financial records updated!"}
