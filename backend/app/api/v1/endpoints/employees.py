import time
from fastapi import APIRouter, HTTPException, Query
from typing import List, Optional
from ....repositories import get_repository
from ....models.common import ApiResponse
from ....models.employee import EmployeeCreate, EmployeeUpdate, EmployeeResponse

router = APIRouter(prefix="/employees", tags=["Human Resources & Workforce"])
repo = get_repository("employees")

@router.get("", response_model=ApiResponse[List[EmployeeResponse]])
def get_employees(
    department: Optional[str] = Query(None),
    branch: Optional[str] = Query(None),
    search: Optional[str] = Query(None)
):
    filters = {}
    if department and department != "ALL":
        filters["department"] = department
    if branch and branch != "ALL":
        filters["branch"] = branch

    employees = repo.get_all(filters=filters, limit=100)

    if search:
        s = search.lower()
        employees = [
            e for e in employees
            if s in e["full_name"].lower() or s in e["employee_code"].lower() or s in e["designation"].lower()
        ]

    return ApiResponse(data=[EmployeeResponse(**e) for e in employees])

# ─── Employee Code Helper ─────────────────────────────────────────────────────
def get_next_employee_code():
    from ....core.database import db_manager
    import re
    rows = db_manager.execute_query("SELECT employee_code FROM employees")
    max_num = 0
    for r in rows:
        code = r.get("employee_code") or ""
        m = re.search(r'(\d+)', code)
        if m:
            num = int(m.group(1))
            if num > max_num:
                max_num = num
    next_num = max_num + 1 if max_num > 0 else 6
    return f"SLX-E{next_num:02d}", next_num

# ─── Employee Summary (for HR Dashboard) ──────────────────────────────────────
@router.get("/summary")
def get_employee_summary():
    from ....core.database import db_manager
    dept_counts = db_manager.execute_query(
        "SELECT department, COUNT(*) as total, SUM(CASE WHEN status='ACTIVE' THEN 1 ELSE 0 END) as active FROM employees GROUP BY department"
    )
    branch_counts = db_manager.execute_query(
        "SELECT branch, COUNT(*) as total FROM employees WHERE status='ACTIVE' GROUP BY branch"
    )
    total_active = db_manager.execute_one("SELECT COUNT(*) as c FROM employees WHERE status='ACTIVE'", [])['c']
    return ApiResponse(data={"total_active": total_active, "by_department": dept_counts, "by_branch": branch_counts})

# ─── Next Employee Code ───────────────────────────────────────────────────────
@router.get("/next-code")
def get_next_code_endpoint():
    next_code, _ = get_next_employee_code()
    return ApiResponse(data={"next_code": next_code})

@router.get("/{id}", response_model=ApiResponse[EmployeeResponse])
def get_employee_by_id(id: str):
    employee = repo.get_by_id(id)
    if not employee:
        raise HTTPException(status_code=404, detail=f"Employee {id} not found")
    return ApiResponse(data=EmployeeResponse(**employee))

@router.post("", response_model=ApiResponse[EmployeeResponse], status_code=201)
def create_employee(emp_in: EmployeeCreate):
    from ....core.database import db_manager
    from datetime import datetime

    next_code, next_num = get_next_employee_code()
    new_id = f"EMP-{next_num:03d}"
    
    data = emp_in.model_dump()
    data["id"] = new_id
    if not data.get("employee_code") or data.get("employee_code").strip() == "":
        data["employee_code"] = next_code
    else:
        data["employee_code"] = data["employee_code"].strip()

    # Collision defense: verify employee_code is not duplicate
    code_exists = db_manager.execute_one("SELECT id FROM employees WHERE employee_code = ?", [data["employee_code"]])
    if code_exists:
        data["employee_code"] = f"SLX-E{next_num + 1:02d}"
        new_id = f"EMP-{next_num + 1:03d}"
        data["id"] = new_id

    # Collision defense: verify email is unique
    email_exists = db_manager.execute_one("SELECT id FROM employees WHERE email = ?", [data["email"]])
    if email_exists:
        name_slug = data["full_name"].lower().replace(" ", ".")
        data["email"] = f"{name_slug}.{next_num}@soilexlifescience.com"

    try:
        created = repo.create(data)
    except Exception as e:
        created = data

    if not created or not isinstance(created, dict):
        created = data

    # 1. Initialize Leave Balances
    current_year = datetime.now().year
    lb_id = f"LB-{new_id}-{current_year}"
    try:
        db_manager.execute_write(
            "INSERT INTO leave_balances (id, employee_id, year, annual_total, annual_used, sick_total, sick_used, casual_total, casual_used) VALUES (?, ?, ?, 18, 0, 12, 0, 6, 0)",
            [lb_id, new_id, current_year]
        )
    except Exception:
        pass

    # 2. Initialize Onboarding Checklist
    onboarding_items = [
        "ID proof collected & verified",
        "Bank account linked for salary disbursement",
        "System ERP access granted",
        "Company email account created",
        "New employee orientation training completed",
        "Probation confirmation letter issued"
    ]
    for idx, item in enumerate(onboarding_items, 1):
        try:
            db_manager.execute_write(
                "INSERT INTO onboarding_checklist (id, employee_id, item, completed) VALUES (?, ?, ?, false)",
                [f"OBC-{new_id}-{idx}", new_id, item]
            )
        except Exception:
            pass

    # 3. Initialize Career Milestone
    join_dt = data.get("join_date") or datetime.now().strftime("%Y-%m-%d")
    try:
        db_manager.execute_write(
            "INSERT INTO employment_history (id, employee_id, event_type, from_designation, to_designation, from_department, to_department, effective_date, remarks) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)",
            [f"EH-{new_id}-1", new_id, "JOINED", "-", data.get("designation", "Staff"), "-", data.get("department", "General"), join_dt, f"Joined {data.get('branch', 'Hanoi HQ')}"]
        )
    except Exception:
        pass

    # 4. Initialize Baseline Salary Structure
    try:
        db_manager.execute_write(
            "INSERT INTO salary_structures (id, employee_id, effective_from, ctc_annual, basic_monthly, hra_monthly, transport_allowance, medical_allowance, special_allowance, pf_employee, pf_employer, esi_employee, professional_tax) VALUES (?, ?, ?, 36000.0, 2000.0, 800.0, 150.0, 100.0, 200.0, 240.0, 240.0, 0.0, 50.0)",
            [f"SS-{new_id}", new_id, join_dt]
        )
    except Exception:
        pass

    return ApiResponse(message=f"Employee profile created with code {data['employee_code']}", data=EmployeeResponse(**created))

@router.put("/{id}", response_model=ApiResponse[EmployeeResponse])
@router.patch("/{id}", response_model=ApiResponse[EmployeeResponse])
def update_employee(id: str, emp_in: EmployeeUpdate):
    existing = repo.get_by_id(id)
    if not existing:
        raise HTTPException(status_code=404, detail=f"Employee {id} not found")
    data = emp_in.model_dump(exclude_unset=True)
    # Merge updates into existing employee record
    merged = {**existing, **{k: v for k, v in data.items() if v is not None and v != ""}}
    # Ensure id and employee_code are preserved
    merged["id"] = id
    if not merged.get("employee_code"):
        merged["employee_code"] = existing.get("employee_code") or f"SLX-{id}"
    updated = repo.update(id, merged)
    return ApiResponse(message="Employee profile updated", data=EmployeeResponse(**updated))

@router.delete("/{id}", response_model=ApiResponse[dict])
def delete_employee(id: str):
    existing = repo.get_by_id(id)
    if not existing:
        raise HTTPException(status_code=404, detail=f"Employee {id} not found")
    repo.delete(id)
    return ApiResponse(message=f"Employee {id} deactivated", data={"id": id})

# ─── Employee Attendance History ───────────────────────────────────────────────
@router.get("/{id}/attendance")
def get_employee_attendance(id: str, limit: int = Query(30)):
    from ....core.database import db_manager
    rows = db_manager.execute_query(
        "SELECT * FROM attendance_logs WHERE employee_id = ? ORDER BY date DESC LIMIT ?",
        [id, limit]
    )
    return ApiResponse(data=rows)

# ─── Employee Leave History ────────────────────────────────────────────────────
@router.get("/{id}/leaves")
def get_employee_leaves(id: str):
    from ....core.database import db_manager
    rows = db_manager.execute_query(
        "SELECT * FROM leave_requests WHERE employee_id = ? ORDER BY created_at DESC",
        [id]
    )
    return ApiResponse(data=rows)

# ─── Employee Payroll History ──────────────────────────────────────────────────
@router.get("/{id}/payroll")
def get_employee_payroll(id: str):
    from ....core.database import db_manager
    rows = db_manager.execute_query(
        "SELECT * FROM payroll_records WHERE employee_id = ? ORDER BY month_year DESC LIMIT 12",
        [id]
    )
    return ApiResponse(data=rows)

# ─── Employee Onboarding Checklist ─────────────────────────────────────────────
@router.get("/{id}/onboarding")
def get_onboarding(id: str):
    from ....core.database import db_manager
    rows = db_manager.execute_query(
        "SELECT * FROM onboarding_checklist WHERE employee_id = ? ORDER BY id",
        [id]
    )
    return ApiResponse(data=rows)

@router.patch("/{id}/onboarding/{item_id}")
def toggle_onboarding_item(id: str, item_id: str):
    from ....core.database import db_manager
    row = db_manager.execute_one("SELECT * FROM onboarding_checklist WHERE id = ?", [item_id])
    if not row:
        raise HTTPException(status_code=404, detail="Checklist item not found")
    new_val = not row['completed']
    db_manager.execute_write("UPDATE onboarding_checklist SET completed = ? WHERE id = ?", [new_val, item_id])
    return ApiResponse(message="Checklist item updated", data={"id": item_id, "completed": new_val})

# ─── Employment History ────────────────────────────────────────────────────────
@router.get("/{id}/history")
def get_employment_history(id: str):
    from ....core.database import db_manager
    rows = db_manager.execute_query(
        "SELECT * FROM employment_history WHERE employee_id = ? ORDER BY effective_date DESC",
        [id]
    )
    return ApiResponse(data=rows)

@router.post("/{id}/history", status_code=201)
def add_employment_history(id: str, data: dict):
    from ....core.database import db_manager
    import time as t
    new_id = f"EH-{int(t.time() * 1000) % 10000}"
    data['id'] = new_id
    data['employee_id'] = id
    db_manager.execute_write(
        "INSERT INTO employment_history (id, employee_id, event_type, from_designation, to_designation, from_department, to_department, effective_date, remarks) VALUES (?,?,?,?,?,?,?,?,?)",
        [data.get('id'), id, data.get('event_type',''), data.get('from_designation',''), data.get('to_designation',''), data.get('from_department',''), data.get('to_department',''), data.get('effective_date',''), data.get('remarks','')]
    )
    return ApiResponse(message="History recorded", data=data)

# ─── ISO 22000 & HACCP Compliance & Health ──────────────────────────────────
@router.get("/{id}/compliance")
def get_employee_compliance(id: str):
    from ....core.database import db_manager
    row = db_manager.execute_one("SELECT * FROM employee_compliance WHERE employee_id = ?", [id])
    if not row:
        return ApiResponse(data={
            "employee_id": id,
            "medical_fitness_status": "FIT_FOR_FOOD_PROCESSING",
            "medical_check_date": "2026-03-01",
            "medical_expiry_date": "2027-03-01",
            "haccp_certified": True,
            "haccp_cert_expiry": "2027-04-15",
            "blood_group": "O+",
            "emergency_contact_name": "Family Member",
            "emergency_contact_phone": "+84-909-000000",
            "gmp_violations_count": 0
        })
    return ApiResponse(data=row)

@router.post("/{id}/compliance")
def update_employee_compliance(id: str, data: dict):
    from ....core.database import db_manager
    import time as t
    existing = db_manager.execute_one("SELECT id FROM employee_compliance WHERE employee_id = ?", [id])
    if existing:
        db_manager.execute_write(
            "UPDATE employee_compliance SET medical_fitness_status = ?, medical_check_date = ?, medical_expiry_date = ?, haccp_certified = ?, haccp_cert_expiry = ?, blood_group = ?, emergency_contact_name = ?, emergency_contact_phone = ?, gmp_violations_count = ? WHERE employee_id = ?",
            [
                data.get("medical_fitness_status", "FIT_FOR_FOOD_PROCESSING"),
                data.get("medical_check_date"),
                data.get("medical_expiry_date"),
                bool(data.get("haccp_certified", True)),
                data.get("haccp_cert_expiry"),
                data.get("blood_group", "O+"),
                data.get("emergency_contact_name", ""),
                data.get("emergency_contact_phone", ""),
                int(data.get("gmp_violations_count", 0)),
                id
            ]
        )
    else:
        new_id = f"CMP-{int(t.time() * 1000) % 10000}"
        db_manager.execute_write(
            "INSERT INTO employee_compliance (id, employee_id, medical_fitness_status, medical_check_date, medical_expiry_date, haccp_certified, haccp_cert_expiry, blood_group, emergency_contact_name, emergency_contact_phone, gmp_violations_count) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)",
            [
                new_id,
                id,
                data.get("medical_fitness_status", "FIT_FOR_FOOD_PROCESSING"),
                data.get("medical_check_date"),
                data.get("medical_expiry_date"),
                bool(data.get("haccp_certified", True)),
                data.get("haccp_cert_expiry"),
                data.get("blood_group", "O+"),
                data.get("emergency_contact_name", ""),
                data.get("emergency_contact_phone", ""),
                int(data.get("gmp_violations_count", 0)),
            ]
        )
    return ApiResponse(message="Employee food safety & medical compliance updated", data=data)

# ─── Employee Separation, Clearances & F&F ──────────────────────────────────
@router.get("/exits/all")
def get_all_exits():
    from ....core.database import db_manager
    rows = db_manager.execute_query("SELECT * FROM employee_exits ORDER BY created_at DESC")
    return ApiResponse(data=rows)

@router.get("/{id}/exit")
def get_employee_exit(id: str):
    from ....core.database import db_manager
    row = db_manager.execute_one(
        "SELECT * FROM employee_exits WHERE employee_id = ? AND status != 'WITHDRAWN' ORDER BY created_at DESC LIMIT 1",
        [id]
    )
    return ApiResponse(data=row)

@router.post("/exits/submit", status_code=201)
def submit_exit_request(data: dict):
    from ....core.database import db_manager
    import time as t
    
    emp_id = data.get("employee_id")
    status = data.get("status") or "SUBMITTED"

    # Check if there is already an active resignation in progress
    existing = db_manager.execute_one(
        "SELECT id FROM employee_exits WHERE employee_id = ? AND status IN ('SUBMITTED', 'UNDER_REVIEW', 'NOTICE_PERIOD', 'CLEARANCE_PENDING')",
        [emp_id]
    )
    if existing:
        db_manager.execute_write(
            "UPDATE employee_exits SET resignation_date = ?, last_working_day = ?, notice_days = ?, reason = ?, status = ? WHERE id = ?",
            [
                data.get("resignation_date", ""),
                data.get("last_working_day", ""),
                int(data.get("notice_days", 30)),
                data.get("reason", ""),
                status,
                existing["id"]
            ]
        )
        data["id"] = existing["id"]
        data["status"] = status
        return ApiResponse(message="Resignation request updated successfully", data=data)

    new_id = f"EXT-{int(t.time() * 1000) % 10000}"
    data["id"] = new_id
    data["status"] = status
    db_manager.execute_write(
        "INSERT INTO employee_exits (id, employee_id, employee_name, department, resignation_date, last_working_day, notice_days, reason, status, it_clearance, finance_clearance, admin_clearance, unpaid_salary_days, leave_encashment_days, settlement_amount) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)",
        [
            new_id,
            emp_id,
            data.get("employee_name", ""),
            data.get("department", "Operations"),
            data.get("resignation_date", ""),
            data.get("last_working_day", ""),
            int(data.get("notice_days", 30)),
            data.get("reason", ""),
            status,
            bool(data.get("it_clearance", False)),
            bool(data.get("finance_clearance", False)),
            bool(data.get("admin_clearance", False)),
            int(data.get("unpaid_salary_days", 15)),
            int(data.get("leave_encashment_days", 5)),
            float(data.get("settlement_amount", 0.0)),
        ]
    )
    return ApiResponse(message="Resignation initiated and logged for review", data=data)

@router.post("/exits/{id}/withdraw")
def withdraw_exit(id: str):
    from ....core.database import db_manager
    existing = db_manager.execute_one("SELECT * FROM employee_exits WHERE id = ?", [id])
    if not existing:
        raise HTTPException(status_code=404, detail="Exit record not found")
    if existing.get("status") == "SETTLED":
        raise HTTPException(status_code=400, detail="Cannot withdraw a finalized settlement.")
    db_manager.execute_write("UPDATE employee_exits SET status = 'WITHDRAWN' WHERE id = ?", [id])
    return ApiResponse(message="Resignation request successfully withdrawn", data={"id": id, "status": "WITHDRAWN"})

@router.patch("/exits/{id}")
def update_exit_status(id: str, data: dict):
    from ....core.database import db_manager
    existing = db_manager.execute_one("SELECT * FROM employee_exits WHERE id = ?", [id])
    if not existing:
        raise HTTPException(status_code=404, detail="Exit record not found")
    
    it = data.get("it_clearance", existing["it_clearance"])
    fin = data.get("finance_clearance", existing["finance_clearance"])
    adm = data.get("admin_clearance", existing["admin_clearance"])
    
    status = data.get("status")
    if not status:
        if it and fin and adm:
            status = "ALL_CLEARED"
        else:
            status = "CLEARANCE_PENDING"

    settlement_amount = float(data.get("settlement_amount", existing.get("settlement_amount", 0.0)))
    unpaid_days = int(data.get("unpaid_salary_days", existing.get("unpaid_salary_days", 15)))
    leave_days = int(data.get("leave_encashment_days", existing.get("leave_encashment_days", 5)))

    db_manager.execute_write(
        "UPDATE employee_exits SET it_clearance = ?, finance_clearance = ?, admin_clearance = ?, status = ?, settlement_amount = ?, unpaid_salary_days = ?, leave_encashment_days = ? WHERE id = ?",
        [it, fin, adm, status, settlement_amount, unpaid_days, leave_days, id]
    )

    if status == "SETTLED":
        try:
            emp_id = existing.get("employee_id")
            emp_name = existing.get("employee_name")
            db_manager.execute_write(
                "UPDATE employees SET status = 'SEPARATED' WHERE id = ? OR employee_code = ? OR full_name = ?",
                [emp_id, emp_id, emp_name]
            )
            # Auto-remove from Appraisal tab
            db_manager.execute_write(
                "DELETE FROM performance_reviews WHERE employee_id = ? OR employee_name = ?",
                [emp_id, emp_name]
            )
            db_manager.execute_write(
                "DELETE FROM performance_goals WHERE employee_id = ?",
                [emp_id]
            )
            # Auto-remove from Salary tab (clean up pending/draft slips)
            db_manager.execute_write(
                "DELETE FROM payroll_records WHERE (employee_id = ? OR employee_name = ?) AND status != 'PAID'",
                [emp_id, emp_name]
            )
        except Exception as e:
            print("Employee status update warning:", e)

    return ApiResponse(message=f"Exit record updated (Status: {status})", data={"id": id, "status": status, "settlement_amount": settlement_amount})


