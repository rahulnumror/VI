import time
from fastapi import APIRouter, HTTPException, Query
from typing import List, Optional
from ....repositories import get_repository
from ....models.common import ApiResponse
from ....models.task import WorkspaceTaskCreate, WorkspaceTaskUpdate, WorkspaceTaskResponse

router = APIRouter(prefix="/tasks", tags=["Workspace & Task Planner"])
repo = get_repository("workspace_tasks")

def seed_unique_employee_tasks(db):
    unique_tasks = [
        # EMP-001 Vũ Thị Hoan (Sales & Export)
        ("TSK-EXP-01", "Review Bill of Lading & Phytosanitary for Dubai Container MSCU-884102", "Operations", "HIGH", "2026-10-23", "Vũ Thị Hoan", False, "Verify gross weights match container manifest"),
        ("TSK-EXP-02", "Draft CIF Rotterdam Price Quotation for Black Pepper 550 G/L", "Operations", "HIGH", "2026-10-23", "Vũ Thị Hoan", False, "Inquiry from Naturex GmbH for 18.5 MT batch"),
        ("TSK-EXP-03", "Finalize Letter of Credit (LC 90 Days) with Al Rawdah Trading LLC", "Finance", "URGENT", "2026-10-24", "Vũ Thị Hoan", False, "Export contract SLX-EXP-2026-001"),
        ("TSK-EXP-04", "Verify customs HS code 090411 for EU Spice Consignment", "Compliance", "MEDIUM", "2026-10-25", "Vũ Thị Hoan", True, "Phytosanitary inspection cleared"),
        ("TSK-EXP-05", "Weekly sales pipeline review with Regional Dubai Commercial Desk", "Operations", "LOW", "2026-10-26", "Vũ Thị Hoan", False, "Q4 volume allocation targets"),

        # EMP-002 Rajesh Sharma (Quality Assurance)
        ("TSK-QA-01", "Calibrate Moisture Meters & Bulk Density Testers at Kochi Spices Lab", "Maintenance", "HIGH", "2026-10-23", "Rajesh Sharma", False, "Quarterly calibration routine per ISO 17025"),
        ("TSK-QA-02", "Inspect FSSAI & ASTA chemical laboratory samples for Cardamom Lot 88", "Compliance", "URGENT", "2026-10-23", "Rajesh Sharma", False, "Test volatile oil content and moisture below 11.5%"),
        ("TSK-QA-03", "Review aflatoxin & pesticide residue chromatography for Kerala harvest", "Compliance", "HIGH", "2026-10-24", "Rajesh Sharma", False, "Export batch release verification for EU dispatch"),
        ("TSK-QA-04", "Verify ISO 22000 cleanroom sanitization logs for spice extraction hall", "Compliance", "MEDIUM", "2026-10-24", "Rajesh Sharma", True, "Microbial swab testing negative"),
        ("TSK-QA-05", "Conduct quarterly internal QA audit for Kochi processing terminal", "Operations", "LOW", "2026-10-27", "Rajesh Sharma", False, "Audit preparation for external surveillance"),

        # EMP-003 Nguyễn Văn Hùng (Operations & Supply)
        ("TSK-OPS-01", "Submit Vietnam Perfumed Rice Phytosanitary Certificate to Customs", "Compliance", "URGENT", "2026-10-23", "Nguyễn Văn Hùng", False, "Hai Phong Customs Berth 3 release clearance"),
        ("TSK-OPS-02", "Port berth container dispatch for Maersk Line shipment SLX-SH-2026-002", "Operations", "HIGH", "2026-10-23", "Nguyễn Văn Hùng", False, "Ensure 4 reefer containers loaded before cutoff"),
        ("TSK-OPS-03", "Inspect cold-storage reefer container temperatures (below 18°C)", "Operations", "HIGH", "2026-10-24", "Nguyễn Văn Hùng", False, "Container MEDU-556219-7 sensor logs"),
        ("TSK-OPS-04", "Forklift safety & pallet strapping check at Hai Phong Port Logistics Depot", "Maintenance", "MEDIUM", "2026-10-24", "Nguyễn Văn Hùng", True, "Weekly fleet inspection completed"),
        ("TSK-OPS-05", "Reconcile container tare weight vs manifest for Rice DDGS consignment", "Operations", "LOW", "2026-10-25", "Nguyễn Văn Hùng", False, "Check net 26,000 kg per container"),

        # EMP-004 Priya Nair (Human Resources)
        ("TSK-HR-01", "Run Monthly Employee Statutory Deductions, PF & Tax Slips", "HR & Payroll", "URGENT", "2026-10-23", "Priya Nair", True, "October salary reconciliation finalized"),
        ("TSK-HR-02", "Screen shortlist candidate applications for Senior Export Sales Manager JD", "HR & Payroll", "HIGH", "2026-10-23", "Priya Nair", False, "Review candidate profiles with HR Director"),
        ("TSK-HR-03", "Review pending biometric clock-in regularizations and leave requests", "HR & Payroll", "HIGH", "2026-10-24", "Priya Nair", False, "Process supervisor sign-offs for missed punches"),
        ("TSK-HR-04", "Conduct new employee onboarding orientation & food hygiene induction", "HR & Payroll", "MEDIUM", "2026-10-24", "Priya Nair", False, "Schedule GMP cleanroom walkthrough"),
        ("TSK-HR-05", "Process employee separation clearance checklist with IT and Accounts", "HR & Payroll", "LOW", "2026-10-26", "Priya Nair", False, "Check no-dues signoff progress"),

        # EMP-005 Trần Quốc Bảo (Finance & Accounts)
        ("TSK-FIN-01", "Reconcile SWIFT wire remittance for export contract SLX-EXP-2026-001", "Finance", "URGENT", "2026-10-23", "Trần Quốc Bảo", False, "$198,000 USD payment receipt confirmation"),
        ("TSK-FIN-02", "Review supplier payment vouchers for Mekong Delta Agro Farms", "Finance", "HIGH", "2026-10-23", "Trần Quốc Bảo", False, "TT 15 Days procurement milestone"),
        ("TSK-FIN-03", "Verify corporate credit card statements and petty cash log", "Finance", "MEDIUM", "2026-10-24", "Trần Quốc Bảo", True, "Monthly operational reconciliations"),
        ("TSK-FIN-04", "Audit monthly statutory tax withholding schedule with Tax Dept", "Compliance", "HIGH", "2026-10-25", "Trần Quốc Bảo", False, "Hanoi HQ corporate tax filing"),
        ("TSK-FIN-05", "Quarterly financial budget variance analysis for Hanoi Corporate HQ", "Finance", "LOW", "2026-10-26", "Trần Quốc Bảo", False, "Consolidated export margins breakdown"),
    ]
    for tsk in unique_tasks:
        exists = db.execute_one("SELECT id FROM workspace_tasks WHERE id = ?", [tsk[0]])
        if not exists:
            db.execute_write(
                "INSERT INTO workspace_tasks (id, title, category, priority, due_date, assigned_to, completed, notes) VALUES (?, ?, ?, ?, ?, ?, ?, ?)",
                list(tsk)
            )

@router.get("", response_model=ApiResponse[List[WorkspaceTaskResponse]])
def get_tasks(
    category: Optional[str] = Query(None),
    assigned_to: Optional[str] = Query(None),
    employee_id: Optional[str] = Query(None),
):
    from ....core.database import db_manager

    # Ensure unique tasks are seeded per employee
    try:
        count = db_manager.execute_one("SELECT COUNT(*) as c FROM workspace_tasks", [])['c']
        if count <= 4:
            seed_unique_employee_tasks(db_manager)
    except Exception:
        pass

    query = "SELECT * FROM workspace_tasks WHERE 1=1"
    params = []

    if category and category != "ALL":
        query += " AND category = ?"
        params.append(category)

    emp_filter = assigned_to or employee_id
    if emp_filter and emp_filter != "ALL":
        try:
            emp_row = db_manager.execute_one(
                "SELECT id, full_name, employee_code FROM employees WHERE id = ? OR full_name = ? OR employee_code = ?",
                [emp_filter, emp_filter, emp_filter]
            )
            if emp_row:
                query += " AND (assigned_to = ? OR assigned_to = ? OR assigned_to = ?)"
                params.extend([emp_row["id"], emp_row["full_name"], emp_row.get("employee_code", "")])
            else:
                query += " AND (assigned_to = ? OR assigned_to ILIKE ?)"
                params.extend([emp_filter, f"%{emp_filter}%"])
        except Exception:
            query += " AND (assigned_to = ? OR assigned_to ILIKE ?)"
            params.extend([emp_filter, f"%{emp_filter}%"])

    query += " ORDER BY completed ASC, CASE priority WHEN 'URGENT' THEN 1 WHEN 'HIGH' THEN 2 WHEN 'MEDIUM' THEN 3 ELSE 4 END, due_date ASC LIMIT 100"
    rows = db_manager.execute_query(query, params)
    return ApiResponse(data=[WorkspaceTaskResponse(**r) for r in rows])

@router.post("", response_model=ApiResponse[WorkspaceTaskResponse], status_code=201)
def create_task(task_in: WorkspaceTaskCreate):
    new_id = f"TSK-{int(time.time() * 1000) % 10000}"
    data = task_in.model_dump()
    data["id"] = new_id
    created = repo.create(data)
    return ApiResponse(message="Task created", data=WorkspaceTaskResponse(**created))

@router.patch("/{id}/toggle", response_model=ApiResponse[WorkspaceTaskResponse])
def toggle_task(id: str):
    existing = repo.get_by_id(id)
    if not existing:
        raise HTTPException(status_code=404, detail=f"Task {id} not found")
    
    new_status = not bool(existing.get("completed", False))
    updated = repo.update(id, {"completed": new_status})
    return ApiResponse(message="Task completion status updated", data=WorkspaceTaskResponse(**updated))

@router.delete("/{id}", response_model=ApiResponse[dict])
def delete_task(id: str):
    existing = repo.get_by_id(id)
    if not existing:
        raise HTTPException(status_code=404, detail=f"Task {id} not found")
    repo.delete(id)
    return ApiResponse(message=f"Task {id} removed", data={"id": id})
