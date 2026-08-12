from pydantic import BaseModel, EmailStr
from typing import Optional, List

class DepartmentBase(BaseModel):
    name: str
    description: Optional[str] = None

class DepartmentCreate(DepartmentBase):
    pass

class DepartmentOut(DepartmentBase):
    id: int
    class Config:
        from_attributes = True

class EmployeeBase(BaseModel):
    emp_id: str
    name: str
    email: EmailStr
    phone: Optional[str] = None
    department_id: Optional[int] = None
    designation: str
    joining_date: str
    salary: float
    status: Optional[str] = "Active"

class EmployeeCreate(EmployeeBase):
    pass

class EmployeeOut(EmployeeBase):
    id: int
    department_name: Optional[str] = None
    class Config:
        from_attributes = True

class AttendanceBase(BaseModel):
    employee_id: int
    date: str
    status: str
    check_in: Optional[str] = None
    check_out: Optional[str] = None

class AttendanceCreate(AttendanceBase):
    pass

class AttendanceOut(AttendanceBase):
    id: int
    employee_name: Optional[str] = None
    class Config:
        from_attributes = True

class LeaveRequestBase(BaseModel):
    employee_id: int
    leave_type: str
    start_date: str
    end_date: str
    reason: Optional[str] = None
    status: Optional[str] = "Pending"

class LeaveRequestCreate(LeaveRequestBase):
    pass

class LeaveRequestOut(LeaveRequestBase):
    id: int
    employee_name: Optional[str] = None
    class Config:
        from_attributes = True
