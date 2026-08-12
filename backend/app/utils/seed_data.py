from app.database.session import SessionLocal, engine
from app.database.base import Base
from app.models import (
    User, Department, Employee, Attendance, LeaveRequest,
    Category, Supplier, Product, InventoryTransaction,
    Customer, SalesOrder, OrderItem,
    PurchaseOrder, PurchaseItem,
    FinancialTransaction, Notification
)
from app.auth.jwt import get_password_hash
from datetime import datetime, timedelta

def seed_db():
    Base.metadata.create_all(bind=engine)
    db = SessionLocal()

    if db.query(User).filter(User.email == "admin@erp.com").first():
        print("Database already seeded with demo records.")
        db.close()
        return

    print("Seeding Enterprise ERP Database with comprehensive demo dataset...")

    # 1. Users with distinct RBAC roles
    users = [
        User(full_name="System Admin", email="admin@erp.com", hashed_password=get_password_hash("admin123"), role="Admin", department="Executive"),
        User(full_name="Sarah Vance (HR)", email="hr@erp.com", hashed_password=get_password_hash("hr123"), role="HR Manager", department="Human Resources"),
        User(full_name="Michael Chen (Finance)", email="finance@erp.com", hashed_password=get_password_hash("finance123"), role="Finance Manager", department="Finance"),
        User(full_name="David Miller (Sales)", email="sales@erp.com", hashed_password=get_password_hash("sales123"), role="Sales Manager", department="Sales"),
        User(full_name="Elena Rostova (Supply)", email="inventory@erp.com", hashed_password=get_password_hash("inventory123"), role="Inventory Manager", department="Logistics"),
        User(full_name="John Doe (Staff)", email="employee@erp.com", hashed_password=get_password_hash("emp123"), role="Employee", department="Engineering"),
    ]
    db.add_all(users)

    # 2. Departments
    dept_exec = Department(name="Executive Management", description="C-Suite & Operations")
    dept_fin = Department(name="Finance & Accounting", description="Financial ledger, accounts payable & receivable")
    dept_hr = Department(name="Human Resources", description="Staffing, payroll, talent management")
    dept_sls = Department(name="Sales & Marketing", description="CRM, lead conversion, enterprise accounts")
    dept_log = Department(name="Logistics & Warehouse", description="Supply chain, inventory SKUs")
    dept_eng = Department(name="Manufacturing & Engineering", description="R&D, product assembly")

    db.add_all([dept_exec, dept_fin, dept_hr, dept_sls, dept_log, dept_eng])
    db.flush()

    # 3. Employees
    emp1 = Employee(emp_id="EMP-101", name="Sarah Vance", email="sarah.v@enterprise.com", phone="+1-555-0101", department_id=dept_hr.id, designation="HR Manager", joining_date="2021-03-15", salary=95000.0, status="Active")
    emp2 = Employee(emp_id="EMP-102", name="Michael Chen", email="m.chen@enterprise.com", phone="+1-555-0102", department_id=dept_fin.id, designation="Finance Lead", joining_date="2020-08-01", salary=115000.0, status="Active")
    emp3 = Employee(emp_id="EMP-103", name="David Miller", email="d.miller@enterprise.com", phone="+1-555-0103", department_id=dept_sls.id, designation="VP of Sales", joining_date="2022-01-10", salary=105000.0, status="Active")
    emp4 = Employee(emp_id="EMP-104", name="Elena Rostova", email="e.rostova@enterprise.com", phone="+1-555-0104", department_id=dept_log.id, designation="Warehouse Manager", joining_date="2022-06-20", salary=88000.0, status="Active")
    emp5 = Employee(emp_id="EMP-105", name="Alex Rivera", email="a.rivera@enterprise.com", phone="+1-555-0105", department_id=dept_eng.id, designation="Lead Hardware Engineer", joining_date="2023-02-01", salary=120000.0, status="Active")

    db.add_all([emp1, emp2, emp3, emp4, emp5])
    db.flush()

    # Attendance & Leaves
    att1 = Attendance(employee_id=emp1.id, date=datetime.utcnow().strftime("%Y-%m-%d"), status="Present", check_in="08:55 AM", check_out="05:15 PM")
    att2 = Attendance(employee_id=emp2.id, date=datetime.utcnow().strftime("%Y-%m-%d"), status="Present", check_in="09:00 AM", check_out="05:30 PM")
    leave1 = LeaveRequest(employee_id=emp5.id, leave_type="Annual", start_date="2026-08-20", end_date="2026-08-25", reason="Vacation", status="Approved")
    db.add_all([att1, att2, leave1])

    # 4. Inventory Categories & Suppliers
    cat_elec = Category(name="Electronics & Hardware", description="Microcontrollers, sensors, servomotors")
    cat_raw = Category(name="Raw Materials", description="Metals, alloys, plastics")
    cat_prod = Category(name="Finished Goods", description="Assembled commercial machinery")

    sup1 = Supplier(name="Global Microelectronics Inc", contact_person="James Wilson", email="sales@gmicro.com", phone="+1-800-555-9090", address="Silicon Valley, CA")
    sup2 = Supplier(name="Apex Precision Metals", contact_person="Rachel Green", email="orders@apexmetal.com", phone="+1-800-555-8080", address="Chicago, IL")

    db.add_all([cat_elec, cat_raw, cat_prod, sup1, sup2])
    db.flush()

    # Products
    p1 = Product(sku="SKU-ELEC-01", name="Precision Servomotor 5kW", category_id=cat_elec.id, supplier_id=sup1.id, stock_quantity=85, min_stock_level=15, purchase_price=220.0, selling_price=450.0, unit="pcs")
    p2 = Product(sku="SKU-ELEC-02", name="Microcontroller Mainboard v4", category_id=cat_elec.id, supplier_id=sup1.id, stock_quantity=4, min_stock_level=10, purchase_price=60.0, selling_price=140.0, unit="pcs") # Low stock!
    p3 = Product(sku="SKU-RAW-99", name="Aerospace Aluminum Ingot", category_id=cat_raw.id, supplier_id=sup2.id, stock_quantity=320, min_stock_level=50, purchase_price=45.0, selling_price=85.0, unit="kg")
    p4 = Product(sku="SKU-FG-100", name="Autonomous Industrial Arm", category_id=cat_prod.id, supplier_id=sup1.id, stock_quantity=12, min_stock_level=3, purchase_price=8500.0, selling_price=18500.0, unit="unit")

    db.add_all([p1, p2, p3, p4])
    db.flush()

    # 5. Customers
    c1 = Customer(name="Nexus Global Corp", email="procurement@nexuscorp.io", phone="+1-555-3000", company="Nexus Corp", address="New York, NY", total_spending=495000.0)
    c2 = Customer(name="Orion Automated Systems", email="contact@orionauto.com", phone="+1-555-4000", company="Orion Systems", address="Austin, TX", total_spending=214500.0)
    c3 = Customer(name="Vanguard Robotics", email="info@vanguardrobotics.org", phone="+1-555-5000", company="Vanguard", address="Boston, MA", total_spending=125000.0)

    db.add_all([c1, c2, c3])
    db.flush()

    # 6. Sales Orders
    so1 = SalesOrder(order_no="SO-2026-101", customer_id=c1.id, order_date="2026-08-01", total_amount=450000.0, status="Completed", invoice_no="INV-SO-2026-101")
    so2 = SalesOrder(order_no="SO-2026-102", customer_id=c2.id, order_date="2026-08-05", total_amount=214500.0, status="Processing", invoice_no="INV-SO-2026-102")

    db.add_all([so1, so2])
    db.flush()

    so_item1 = OrderItem(order_id=so1.id, product_id=p4.id, quantity=20, unit_price=18500.0, subtotal=370000.0)
    so_item2 = OrderItem(order_id=so1.id, product_id=p1.id, quantity=177, unit_price=450.0, subtotal=80000.0)
    db.add_all([so_item1, so_item2])

    # 7. Purchase Orders
    po1 = PurchaseOrder(po_no="PO-2026-201", supplier_id=sup1.id, order_date="2026-08-02", expected_date="2026-08-15", total_cost=44500.0, status="Received")
    po2 = PurchaseOrder(po_no="PO-2026-202", supplier_id=sup2.id, order_date="2026-08-10", expected_date="2026-08-22", total_cost=17000.0, status="Pending")

    db.add_all([po1, po2])
    db.flush()

    po_item1 = PurchaseItem(po_id=po1.id, product_id=p1.id, quantity=50, unit_cost=220.0, subtotal=11000.0)
    db.add(po_item1)

    # 8. Financial Transactions
    t1 = FinancialTransaction(trx_no="TRX-2026-01", type="Income", category="Sales Revenue", amount=450000.0, description="Enterprise Sales Order SO-2026-101", date="2026-08-01", reference_id="SO-2026-101")
    t2 = FinancialTransaction(trx_no="TRX-2026-02", type="Expense", category="Supplier Purchase", amount=44500.0, description="Procurement PO-2026-201 from Global Microelectronics", date="2026-08-02", reference_id="PO-2026-201")
    t3 = FinancialTransaction(trx_no="TRX-2026-03", type="Expense", category="Payroll", amount=89000.0, description="August Monthly Staff Payroll", date="2026-08-08", reference_id="PAYROLL-08")
    t4 = FinancialTransaction(trx_no="TRX-2026-04", type="Income", category="Sales Revenue", amount=214500.0, description="Custom Automation Order SO-2026-102", date="2026-08-10", reference_id="SO-2026-102")

    db.add_all([t1, t2, t3, t4])

    # 9. System Notifications
    n1 = Notification(title="Low Stock Alert: Microcontroller Mainboard v4", message="Product 'Microcontroller Mainboard v4' (SKU: SKU-ELEC-02) stock level is 4 (Min: 10). Reorder recommended.", type="low_stock", is_read=False)
    n2 = Notification(title="Pending Purchase Order: PO-2026-202", message="Purchase Order PO-2026-202 issued to Apex Precision Metals ($17,000.00) awaits delivery receipt.", type="pending_purchase", is_read=False)
    n3 = Notification(title="System Deployment", message="Enterprise Resource Planning (ERP) platform online with SQLite / PostgreSQL persistence.", type="system", is_read=True)

    db.add_all([n1, n2, n3])

    db.commit()
    print("Database successfully seeded with realistic enterprise data!")
    db.close()

if __name__ == "__main__":
    seed_db()
