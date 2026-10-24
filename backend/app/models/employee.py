from typing import Optional, Union
from datetime import datetime
from pydantic import BaseModel, Field

class EmployeeBase(BaseModel):
    employee_code: str = ""
    full_name: str
    email: str
    phone: Optional[str] = None
    department: str
    designation: str
    branch: str
    shift: str = "Morning Shift"
    join_date: Optional[str] = None
    status: str = "ACTIVE"
    avatar_url: Optional[str] = None

class EmployeeCreate(EmployeeBase):
    pass

class EmployeeUpdate(BaseModel):
    employee_code: Optional[str] = None
    full_name: Optional[str] = None
    email: Optional[str] = None
    phone: Optional[str] = None
    department: Optional[str] = None
    designation: Optional[str] = None
    branch: Optional[str] = None
    shift: Optional[str] = None
    join_date: Optional[str] = None
    status: Optional[str] = None
    avatar_url: Optional[str] = None

class EmployeeResponse(EmployeeBase):
    id: str
    created_at: Optional[Union[datetime, str]] = None

