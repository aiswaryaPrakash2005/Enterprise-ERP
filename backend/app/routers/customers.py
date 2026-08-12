from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy.orm import Session
from typing import List
from app.database.session import get_db
from app.models.sales import Customer
from app.schemas.sales import CustomerOut, CustomerCreate
from app.auth.jwt import get_current_user

router = APIRouter(prefix="/api/customers", tags=["Customer Management"])

@router.get("", response_model=List[CustomerOut])
def get_customers(db: Session = Depends(get_db), current_user = Depends(get_current_user)):
    return db.query(Customer).all()

@router.post("", response_model=CustomerOut)
def create_customer(c_in: CustomerCreate, db: Session = Depends(get_db), current_user = Depends(get_current_user)):
    db_c = Customer(**c_in.model_dump())
    db.add(db_c)
    db.commit()
    db.refresh(db_c)
    return db_c

@router.put("/{customer_id}", response_model=CustomerOut)
def update_customer(customer_id: int, c_in: CustomerCreate, db: Session = Depends(get_db), current_user = Depends(get_current_user)):
    cust = db.query(Customer).filter(Customer.id == customer_id).first()
    if not cust:
        raise HTTPException(status_code=404, detail="Customer not found")
    for k, v in c_in.model_dump().items():
        setattr(cust, k, v)
    db.commit()
    db.refresh(cust)
    return cust

@router.delete("/{customer_id}")
def delete_customer(customer_id: int, db: Session = Depends(get_db), current_user = Depends(get_current_user)):
    cust = db.query(Customer).filter(Customer.id == customer_id).first()
    if not cust:
        raise HTTPException(status_code=404, detail="Customer not found")
    db.delete(cust)
    db.commit()
    return {"message": "Customer deleted successfully"}
