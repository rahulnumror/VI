from typing import Optional, Union
from datetime import datetime
from pydantic import BaseModel, Field

class PayrollRecordResponse(BaseModel):
    id: str
    employee_id: str
    employee_name: str
    month_year: str
    basic_pay: float = 0.0
    allowances: float = 0.0
    deductions: float = 0.0
    tax: float = 0.0
    net_salary: float = 0.0
    overtime_hours: Optional[float] = 0.0
    overtime_pay: Optional[float] = 0.0
    status: str = "PAID"
    designation: Optional[str] = "Staff"
    bank: Optional[str] = "Standard Chartered"
    branch: Optional[str] = "Hanoi HQ"
    disbursed_at: Optional[Union[datetime, str]] = None

    model_config = {"extra": "allow"}

class PayrollGenerateRequest(BaseModel):
    month_year: str # e.g. "September 2026"
