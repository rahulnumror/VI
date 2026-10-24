from typing import Optional, Union
from datetime import datetime
from pydantic import BaseModel, Field

class AttendancePunchRequest(BaseModel):
    employee_id: str
    location: str = "Hanoi HQ / Factory"
    source: str = "WEB_SIMULATOR"

class AttendanceLogResponse(BaseModel):
    id: str
    employee_id: str
    employee_name: str
    date: str
    clock_in: Optional[str] = None
    clock_out: Optional[str] = None
    work_hours: float = 0.0
    status: str = "PRESENT"
    source: str = "BIOMETRIC_DEVICE"
    location: str = "Hanoi HQ / Factory"
    created_at: Optional[Union[datetime, str]] = None

class LeaveRequestCreate(BaseModel):
    employee_id: str
    employee_name: str
    leave_type: str
    start_date: str
    end_date: str
    total_days: float = 1.0
    reason: Optional[str] = None

class LeaveRequestResponse(LeaveRequestCreate):
    id: str
    status: str = "PENDING"
    created_at: Optional[Union[datetime, str]] = None
