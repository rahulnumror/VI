from fastapi import APIRouter, HTTPException, Depends, status
from pydantic import BaseModel, EmailStr
from typing import Optional
from ....core.database import db_manager
from ....core.security import verify_password, create_access_token
from ....models.common import ApiResponse

router = APIRouter(prefix="/auth", tags=["Authentication"])

class LoginRequest(BaseModel):
    email: str
    password: str

class UserProfile(BaseModel):
    id: str
    name: str
    email: str
    role: str
    department: Optional[str] = None
    status: str
    employee_id: Optional[str] = None

class LoginResponse(BaseModel):
    accessToken: str
    tokenType: str = "Bearer"
    user: UserProfile

@router.post("/login", response_model=ApiResponse[LoginResponse])
def login(creds: LoginRequest):
    user = db_manager.execute_one("SELECT * FROM users WHERE email = ?", [creds.email])
    if not user or not verify_password(creds.password, user["hashed_password"]):
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="Invalid email or password"
        )
    
    emp_id = user.get("employee_id")
    if not emp_id:
        emp = db_manager.execute_one("SELECT id FROM employees WHERE email = ?", [creds.email])
        if emp:
            emp_id = emp["id"]

    token = create_access_token(subject=user["id"], role=user["role"])
    user_profile = UserProfile(
        id=user["id"],
        name=user["name"],
        email=user["email"],
        role=user["role"],
        department=user.get("department"),
        status=user.get("status", "ACTIVE"),
        employee_id=emp_id
    )
    return ApiResponse(
        message="Login successful",
        data=LoginResponse(accessToken=token, user=user_profile)
    )

@router.get("/me", response_model=ApiResponse[UserProfile])
def get_current_user():
    # Return default admin if no auth header provided (demo convenience)
    user = db_manager.execute_one("SELECT * FROM users WHERE role = 'ADMIN' LIMIT 1")
    if not user:
        raise HTTPException(status_code=404, detail="User not found")
    
    emp_id = user.get("employee_id")
    if not emp_id:
        emp = db_manager.execute_one("SELECT id FROM employees WHERE email = ?", [user["email"]])
        if emp:
            emp_id = emp["id"]

    return ApiResponse(
        data=UserProfile(
            id=user["id"],
            name=user["name"],
            email=user["email"],
            role=user["role"],
            department=user.get("department"),
            status=user.get("status", "ACTIVE"),
            employee_id=emp_id
        )
    )
