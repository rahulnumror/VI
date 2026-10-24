import os
from fastapi import APIRouter
from typing import List, Dict, Any
from ....repositories import get_repository
from ....core.config import settings
from ....core.database import db_manager
from ....models.common import ApiResponse

router = APIRouter(prefix="/admin", tags=["Administrative Masters & System"])
fac_repo = get_repository("admin_facilities")

@router.get("/facilities", response_model=ApiResponse[List[Dict[str, Any]]])
def get_facilities():
    facilities = fac_repo.get_all(limit=100)
    return ApiResponse(data=facilities)

@router.get("/system-info", response_model=ApiResponse[Dict[str, Any]])
def get_system_info():
    # Database stats and migration status
    file_size_bytes = 0
    if os.path.exists(settings.DUCKDB_PATH):
        file_size_bytes = os.path.getsize(settings.DUCKDB_PATH)

    table_counts = {}
    tables = ["products", "partners", "trade_contracts", "trade_shipments", "containers", "employees", "attendance_logs", "payroll_records", "calendar_events", "workspace_tasks", "admin_facilities"]
    for t in tables:
        cnt = db_manager.execute_one(f"SELECT COUNT(*) as c FROM {t}")
        table_counts[t] = cnt["c"] if cnt else 0

    return ApiResponse(
        message="System runtime diagnostics",
        data={
            "databaseType": settings.DATABASE_TYPE,
            "databaseFile": settings.DUCKDB_PATH,
            "databaseSizeBytes": file_size_bytes,
            "databaseSizeMB": round(file_size_bytes / (1024 * 1024), 2),
            "tableCounts": table_counts,
            "migrationReady": True,
            "supportedTargets": ["PostgreSQL 16", "MySQL 8.4", "SQL Server"]
        }
    )

# ─── IAM User Management ──────────────────────────────────────────────────────
from pydantic import BaseModel
from typing import Optional
import time
from fastapi import HTTPException

class UserCreateRequest(BaseModel):
    name: str
    email: str
    password: str
    role: str = "EMPLOYEE"
    department: Optional[str] = None
    employee_id: Optional[str] = None
    status: str = "ACTIVE"

class UserUpdateRequest(BaseModel):
    name: Optional[str] = None
    email: Optional[str] = None
    password: Optional[str] = None
    role: Optional[str] = None
    department: Optional[str] = None
    employee_id: Optional[str] = None
    status: Optional[str] = None

@router.get("/users")
def get_admin_users():
    users = db_manager.execute_query(
        """SELECT u.id, u.name, u.email, u.role, u.department, u.status, u.employee_id, u.created_at,
                  e.employee_code, e.branch, e.designation
           FROM users u
           LEFT JOIN employees e ON u.employee_id = e.id OR u.email = e.email
           ORDER BY u.created_at ASC"""
    )
    return ApiResponse(data=users)

@router.post("/users", status_code=201)
def create_admin_user(data: UserCreateRequest):
    from ....core.security import get_password_hash
    existing = db_manager.execute_one("SELECT id FROM users WHERE email = ?", [data.email])
    if existing:
        raise HTTPException(status_code=400, detail="User with this email already exists")

    new_id = f"USR-{int(time.time() * 1000) % 100000:05d}"
    hashed_pwd = get_password_hash(data.password)

    db_manager.execute_write(
        "INSERT INTO users (id, name, email, role, department, hashed_password, status, employee_id) VALUES (?, ?, ?, ?, ?, ?, ?, ?)",
        [
            new_id,
            data.name,
            data.email,
            data.role,
            data.department,
            hashed_pwd,
            data.status,
            data.employee_id
        ]
    )

    created = db_manager.execute_one("SELECT id, name, email, role, department, status, employee_id, created_at FROM users WHERE id = ?", [new_id])
    return ApiResponse(message="IAM user created successfully", data=created)

@router.patch("/users/{id}")
def update_admin_user(id: str, data: UserUpdateRequest):
    from ....core.security import get_password_hash
    existing = db_manager.execute_one("SELECT * FROM users WHERE id = ?", [id])
    if not existing:
        raise HTTPException(status_code=404, detail="User not found")

    updates = data.model_dump(exclude_unset=True)
    if "password" in updates and updates["password"]:
        updates["hashed_password"] = get_password_hash(updates.pop("password"))
    elif "password" in updates:
        updates.pop("password")

    merged = {**existing, **{k: v for k, v in updates.items() if v is not None}}
    db_manager.execute_write(
        "UPDATE users SET name = ?, email = ?, role = ?, department = ?, hashed_password = ?, status = ?, employee_id = ? WHERE id = ?",
        [
            merged.get("name"),
            merged.get("email"),
            merged.get("role"),
            merged.get("department"),
            merged.get("hashed_password"),
            merged.get("status"),
            merged.get("employee_id"),
            id
        ]
    )

    updated = db_manager.execute_one("SELECT id, name, email, role, department, status, employee_id, created_at FROM users WHERE id = ?", [id])
    return ApiResponse(message="IAM user updated", data=updated)

@router.delete("/users/{id}")
def delete_admin_user(id: str):
    existing = db_manager.execute_one("SELECT * FROM users WHERE id = ?", [id])
    if not existing:
        raise HTTPException(status_code=404, detail="User not found")
    if existing.get("role") == "ADMIN" and existing.get("email") == "admin@soilexlifescience.com":
        raise HTTPException(status_code=400, detail="Root Executive Admin account cannot be deleted")

    db_manager.execute_write("DELETE FROM users WHERE id = ?", [id])
    return ApiResponse(message="User deleted successfully", data={"id": id})

