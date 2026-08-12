from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy.orm import Session
from typing import List
from app.database.session import get_db
from app.models.inventory import Category, Supplier, Product, InventoryTransaction
from app.schemas.inventory import (
    CategoryOut, CategoryCreate, SupplierOut, SupplierCreate,
    ProductOut, ProductCreate, StockAdjustment
)
from app.auth.jwt import get_current_user
from app.auth.rbac import require_roles

router = APIRouter(prefix="/api/inventory", tags=["Inventory Management"])

# Categories
@router.get("/categories", response_model=List[CategoryOut])
def get_categories(db: Session = Depends(get_db), current_user = Depends(get_current_user)):
    return db.query(Category).all()

@router.post("/categories", response_model=CategoryOut)
def create_category(cat: CategoryCreate, db: Session = Depends(get_db), current_user = Depends(require_roles(["Admin", "Inventory Manager"]))):
    db_cat = Category(**cat.model_dump())
    db.add(db_cat)
    db.commit()
    db.refresh(db_cat)
    return db_cat

# Suppliers
@router.get("/suppliers", response_model=List[SupplierOut])
def get_suppliers(db: Session = Depends(get_db), current_user = Depends(get_current_user)):
    return db.query(Supplier).all()

@router.post("/suppliers", response_model=SupplierOut)
def create_supplier(sup: SupplierCreate, db: Session = Depends(get_db), current_user = Depends(require_roles(["Admin", "Inventory Manager"]))):
    db_sup = Supplier(**sup.model_dump())
    db.add(db_sup)
    db.commit()
    db.refresh(db_sup)
    return db_sup

# Products
@router.get("/products", response_model=List[ProductOut])
def get_products(db: Session = Depends(get_db), current_user = Depends(get_current_user)):
    products = db.query(Product).all()
    res = []
    for p in products:
        out = ProductOut.model_validate(p)
        out.category_name = p.category_rel.name if p.category_rel else "General"
        out.supplier_name = p.supplier_rel.name if p.supplier_rel else "N/A"
        res.append(out)
    return res

@router.post("/products", response_model=ProductOut)
def create_product(p_in: ProductCreate, db: Session = Depends(get_db), current_user = Depends(require_roles(["Admin", "Inventory Manager"]))):
    db_prod = Product(**p_in.model_dump())
    db.add(db_prod)
    db.commit()
    db.refresh(db_prod)
    out = ProductOut.model_validate(db_prod)
    out.category_name = db_prod.category_rel.name if db_prod.category_rel else "General"
    out.supplier_name = db_prod.supplier_rel.name if db_prod.supplier_rel else "N/A"
    return out

@router.put("/products/{product_id}", response_model=ProductOut)
def update_product(product_id: int, p_in: ProductCreate, db: Session = Depends(get_db), current_user = Depends(require_roles(["Admin", "Inventory Manager"]))):
    prod = db.query(Product).filter(Product.id == product_id).first()
    if not prod:
        raise HTTPException(status_code=404, detail="Product not found")
    for k, v in p_in.model_dump().items():
        setattr(prod, k, v)
    db.commit()
    db.refresh(prod)
    out = ProductOut.model_validate(prod)
    out.category_name = prod.category_rel.name if prod.category_rel else "General"
    out.supplier_name = prod.supplier_rel.name if prod.supplier_rel else "N/A"
    return out

@router.delete("/products/{product_id}")
def delete_product(product_id: int, db: Session = Depends(get_db), current_user = Depends(require_roles(["Admin", "Inventory Manager"]))):
    prod = db.query(Product).filter(Product.id == product_id).first()
    if not prod:
        raise HTTPException(status_code=404, detail="Product not found")
    db.delete(prod)
    db.commit()
    return {"message": "Product deleted successfully"}

# Stock In / Out Adjustment
@router.post("/stock-adjust")
def adjust_stock(adj: StockAdjustment, db: Session = Depends(get_db), current_user = Depends(require_roles(["Admin", "Inventory Manager"]))):
    prod = db.query(Product).filter(Product.id == adj.product_id).first()
    if not prod:
        raise HTTPException(status_code=404, detail="Product not found")
    
    if adj.adjustment_type == "STOCK_IN":
        prod.stock_quantity += adj.quantity
    elif adj.adjustment_type == "STOCK_OUT":
        if prod.stock_quantity < adj.quantity:
            raise HTTPException(status_code=400, detail="Insufficient stock quantity available")
        prod.stock_quantity -= adj.quantity
    else:
        prod.stock_quantity = adj.quantity

    trx = InventoryTransaction(
        product_id=prod.id,
        transaction_type=adj.adjustment_type,
        quantity=adj.quantity,
        notes=adj.notes or "Manual Stock Adjustment"
    )
    db.add(trx)
    db.commit()
    return {"message": "Stock adjusted successfully", "new_quantity": prod.stock_quantity}
