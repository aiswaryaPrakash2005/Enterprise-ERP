from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy.orm import Session
from typing import List
from app.database.session import get_db
from app.models.hr import Department, Employee, Attendance, LeaveRequest
from app.schemas.hr import (
    DepartmentOut, DepartmentCreate, EmployeeOut, EmployeeCreate,
    AttendanceOut, AttendanceCreate, LeaveRequestOut, LeaveRequestCreate
)
from app.auth.jwt import get_current_user
from app.auth.rbac import require_roles

router = APIRouter(prefix="/api/hr", tags=["Human Resources"])

# Departments
@router.get("/departments", response_model=List[DepartmentOut])
def get_departments(db: Session = Depends(get_db), current_user = Depends(get_current_user)):
    return db.query(Department).all()

@router.post("/departments", response_model=DepartmentOut)
def create_department(dept: DepartmentCreate, db: Session = Depends(get_db), current_user = Depends(require_roles(["Admin", "HR Manager"]))):
    db_dept = Department(**dept.model_dump())
    db.add(db_dept)
    db.commit()
    db.refresh(db_dept)
    return db_dept

# Employees
@router.get("/employees", response_model=List[EmployeeOut])
def get_employees(db: Session = Depends(get_db), current_user = Depends(get_current_user)):
    employees = db.query(Employee).all()
    results = []
    for emp in employees:
        out = EmployeeOut.model_validate(emp)
        out.department_name = emp.department_rel.name if emp.department_rel else "General"
        results.append(out)
    return results

@router.post("/employees", response_model=EmployeeOut)
def create_employee(emp: EmployeeCreate, db: Session = Depends(get_db), current_user = Depends(require_roles(["Admin", "HR Manager"]))):
    db_emp = Employee(**emp.model_dump())
    db.add(db_emp)
    db.commit()
    db.refresh(db_emp)
    out = EmployeeOut.model_validate(db_emp)
    out.department_name = db_emp.department_rel.name if db_emp.department_rel else "General"
    return out

@router.put("/employees/{emp_id}", response_model=EmployeeOut)
def update_employee(emp_id: int, emp_in: EmployeeCreate, db: Session = Depends(get_db), current_user = Depends(require_roles(["Admin", "HR Manager"]))):
    emp = db.query(Employee).filter(Employee.id == emp_id).first()
    if not emp:
        raise HTTPException(status_code=404, detail="Employee not found")
    for key, val in emp_in.model_dump().items():
        setattr(emp, key, val)
    db.commit()
    db.refresh(emp)
    out = EmployeeOut.model_validate(emp)
    out.department_name = emp.department_rel.name if emp.department_rel else "General"
    return out

@router.delete("/employees/{emp_id}")
def delete_employee(emp_id: int, db: Session = Depends(get_db), current_user = Depends(require_roles(["Admin", "HR Manager"]))):
    emp = db.query(Employee).filter(Employee.id == emp_id).first()
    if not emp:
        raise HTTPException(status_code=404, detail="Employee not found")
    db.delete(emp)
    db.commit()
    return {"message": "Employee deleted successfully"}

# Attendance
@router.get("/attendance", response_model=List[AttendanceOut])
def get_attendance(db: Session = Depends(get_db), current_user = Depends(get_current_user)):
    attendances = db.query(Attendance).all()
    res = []
    for a in attendances:
        out = AttendanceOut.model_validate(a)
        out.employee_name = a.employee.name if a.employee else "Unknown"
        res.append(out)
    return res

@router.post("/attendance", response_model=AttendanceOut)
def log_attendance(att: AttendanceCreate, db: Session = Depends(get_db), current_user = Depends(get_current_user)):
    db_att = Attendance(**att.model_dump())
    db.add(db_att)
    db.commit()
    db.refresh(db_att)
    out = AttendanceOut.model_validate(db_att)
    out.employee_name = db_att.employee.name if db_att.employee else "Unknown"
    return out

# Leaves
@router.get("/leaves", response_model=List[LeaveRequestOut])
def get_leaves(db: Session = Depends(get_db), current_user = Depends(get_current_user)):
    leaves = db.query(LeaveRequest).all()
    res = []
    for l in leaves:
        out = LeaveRequestOut.model_validate(l)
        out.employee_name = l.employee.name if l.employee else "Unknown"
        res.append(out)
    return res

@router.post("/leaves", response_model=LeaveRequestOut)
def create_leave(leave: LeaveRequestCreate, db: Session = Depends(get_db), current_user = Depends(get_current_user)):
    db_leave = LeaveRequest(**leave.model_dump())
    db.add(db_leave)
    db.commit()
    db.refresh(db_leave)
    out = LeaveRequestOut.model_validate(db_leave)
    out.employee_name = db_leave.employee.name if db_leave.employee else "Unknown"
    return out

@router.put("/leaves/{leave_id}/status")
def update_leave_status(leave_id: int, status: str, db: Session = Depends(get_db), current_user = Depends(require_roles(["Admin", "HR Manager"]))):
    leave = db.query(LeaveRequest).filter(LeaveRequest.id == leave_id).first()
    if not leave:
        raise HTTPException(status_code=404, detail="Leave request not found")
    leave.status = status
    db.commit()
    return {"message": f"Leave status updated to {status}"}
