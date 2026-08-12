from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
from app.database.base import Base
from app.database.session import engine
from app.utils.seed_data import seed_db
from app.routers import (
    auth, hr, inventory, sales, procurement,
    finance, customers, dashboard, reports, notifications
)

# Auto create tables & seed database on launch
Base.metadata.create_all(bind=engine)
seed_db()

app = FastAPI(
    title="Enterprise Resource Planning (ERP) API",
    description="Full-stack Enterprise ERP REST API supporting Auth, HR, Inventory, Sales, Procurement, Finance, Customers & Analytics",
    version="1.0.0"
)

# CORS configuration for React Vite frontend
app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# Register Routers
app.include_router(auth.router)
app.include_router(hr.router)
app.include_router(inventory.router)
app.include_router(sales.router)
app.include_router(procurement.router)
app.include_router(finance.router)
app.include_router(customers.router)
app.include_router(dashboard.router)
app.include_router(reports.router)
app.include_router(notifications.router)

@app.get("/")
def root():
    return {
        "message": "Enterprise ERP API is online",
        "docs": "/docs",
        "status": "healthy"
    }

@app.get("/api/health")
def health_check():
    return {"status": "ok", "system": "ERP Full-Stack Engine"}
