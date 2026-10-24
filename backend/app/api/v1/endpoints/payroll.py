import time
import io
import csv
from datetime import datetime
from fastapi import APIRouter, HTTPException, Query, Response
from typing import List, Optional
import logging
logger = logging.getLogger(__name__)
from ....repositories import get_repository
from ....core.database import db_manager
from ....models.common import ApiResponse
from ....models.payroll import PayrollRecordResponse, PayrollGenerateRequest

router = APIRouter(prefix="/payroll", tags=["Payroll & Compensation"])
repo = get_repository("payroll_records")
emp_repo = get_repository("employees")
runs_repo = get_repository("payroll_runs")
ss_repo = get_repository("salary_structures")

def parse_payroll_month(month_str: str) -> Optional[datetime]:
    if not month_str:
        return None
    for fmt in ("%B %Y", "%b %Y", "%Y-%m", "%m/%Y"):
        try:
            return datetime.strptime(month_str.strip(), fmt)
        except Exception:
            pass
    return None

def parse_iso_date(d_str: str) -> Optional[datetime]:
    if not d_str:
        return None
    for fmt in ("%Y-%m-%d", "%d/%m/%Y", "%m/%d/%Y", "%Y/%m/%d"):
        try:
            return datetime.strptime(d_str.strip()[:10], fmt)
        except Exception:
            pass
    return None

# ─── Payroll Slips / Records ──────────────────────────────────────────────────
@router.get("/records", response_model=ApiResponse[List[PayrollRecordResponse]])
def get_payroll_records(month_year: Optional[str] = Query(None)):
    filters = {"month_year": month_year} if month_year else None
    records = repo.get_all(filters=filters, limit=100)
    
    # 0. Load settled exits to auto-remove settled employees from Salary tab
    settled_rows = db_manager.execute_query("SELECT employee_id, employee_name FROM employee_exits WHERE status = 'SETTLED'") or []
    settled_ids = {s["employee_id"] for s in settled_rows if s.get("employee_id")}
    settled_names = {s["employee_name"] for s in settled_rows if s.get("employee_name")}

    payroll_dt = parse_payroll_month(month_year) if month_year else None
    payroll_idx = (payroll_dt.year * 12 + payroll_dt.month) if payroll_dt else None

    filtered = []
    for r in records:
        emp_id = r.get("employee_id")
        emp_name = r.get("employee_name")
        # Rule: Exclude employees who have completed Full & Final Settlement (F&F SETTLED)
        if emp_id in settled_ids or emp_name in settled_names:
            continue

        emp = emp_repo.get_by_id(emp_id)
        if not emp:
            emp = db_manager.execute_one("SELECT * FROM employees WHERE id = ? OR employee_code = ?", [emp_id, emp_id])
        if emp:
            if emp.get("status") in ("SEPARATED", "INACTIVE", "TERMINATED", "EXITED", "SETTLED"):
                continue
            if emp.get("id") in settled_ids or emp.get("employee_code") in settled_ids or emp.get("full_name") in settled_names:
                continue
            # Rule: Don't show pending salary for last month for new emp
            # If employee joined after this record's month, or in this month as a new joiner
            join_str = emp.get("join_date")
            rec_month_dt = parse_payroll_month(r.get("month_year"))
            if join_str and rec_month_dt:
                join_dt = parse_iso_date(join_str)
                if join_dt:
                    j_idx = join_dt.year * 12 + join_dt.month
                    r_idx = rec_month_dt.year * 12 + rec_month_dt.month
                    if r_idx < j_idx:
                        # Employee had not joined yet during this pay cycle
                        continue
                    if r_idx == j_idx and r.get("status") in ("PENDING", "DRAFT"):
                        # Joining month salary is deferred to next month's payroll cycle
                        continue

            r["designation"] = emp.get("designation", "Staff")
            r["branch"] = emp.get("branch", "Hanoi HQ")
            if "Kochi" in emp.get("branch", ""):
                r["bank"] = "State Bank of India (Kochi)"
            elif "Hai Phong" in emp.get("branch", ""):
                r["bank"] = "Techcombank"
            elif "Dubai" in emp.get("branch", ""):
                r["bank"] = "Emirates NBD"
            else:
                r["bank"] = "Vietcombank"
            filtered.append(r)
        else:
            filtered.append(r)
    return ApiResponse(data=[PayrollRecordResponse(**r) for r in filtered])

# ─── Payroll Runs ─────────────────────────────────────────────────────────────
@router.get("/runs")
def get_payroll_runs():
    runs = db_manager.execute_query("SELECT * FROM payroll_runs ORDER BY created_at DESC")
    if not runs:
        try:
            db_manager.execute_write(
                "INSERT INTO payroll_runs (id, month_year, status, total_employees, total_gross, total_net, total_deductions, processed_by, approved_by, disbursed_at) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?)",
                ['RUN-001', 'August 2026', 'DISBURSED', 5, 14050.0, 13300.0, 750.0, 'admin', 'CFO', '2026-08-31 17:00:00']
            )
            db_manager.execute_write(
                "INSERT INTO payroll_runs (id, month_year, status, total_employees, total_gross, total_net, total_deductions, processed_by, approved_by, disbursed_at) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?)",
                ['RUN-002', 'September 2026', 'APPROVED', 5, 14050.0, 13300.0, 750.0, 'admin', 'HR Director', None]
            )
            runs = db_manager.execute_query("SELECT * FROM payroll_runs ORDER BY created_at DESC")
        except Exception:
            runs = []
    return ApiResponse(data=runs)

# ─── Generate Monthly Payroll ─────────────────────────────────────────────────
@router.post("/generate", response_model=ApiResponse[dict])
def generate_monthly_payroll(req: PayrollGenerateRequest):
    employees = emp_repo.get_all(limit=100)
    if not employees:
        employees = db_manager.execute_query("SELECT * FROM employees") or []
    
    payroll_dt = parse_payroll_month(req.month_year)
    payroll_idx = (payroll_dt.year * 12 + payroll_dt.month) if payroll_dt else None

    generated_count = 0
    total_gross = 0.0
    total_net = 0.0
    total_deductions = 0.0
    eligible_count = 0

    # 0. Load settled exits to auto-remove settled employees from payroll generation
    settled_rows = db_manager.execute_query("SELECT employee_id, employee_name FROM employee_exits WHERE status = 'SETTLED'") or []
    settled_ids = {s["employee_id"] for s in settled_rows if s.get("employee_id")}
    settled_names = {s["employee_name"] for s in settled_rows if s.get("employee_name")}

    for emp in employees:
        try:
            # 1. Skip separated, settled, or inactive staff
            if emp.get("status") in ("SEPARATED", "INACTIVE", "TERMINATED", "EXITED", "SETTLED"):
                continue
            if emp.get("id") in settled_ids or emp.get("employee_code") in settled_ids or emp.get("full_name") in settled_names:
                continue

            # 2. Check join date vs payroll month
            # Policy: New employee join's salary will be given from next month.
            # Do NOT show or generate pending salary for last month for new emp.
            join_str = emp.get("join_date")
            if join_str and payroll_idx:
                join_dt = parse_iso_date(join_str)
                if join_dt:
                    j_idx = join_dt.year * 12 + join_dt.month
                    if payroll_idx < j_idx:
                        # Employee joined after this pay period - delete any accidental record and skip
                        db_manager.execute_write(
                            "DELETE FROM payroll_records WHERE employee_id = ? AND month_year = ?",
                            [emp["id"], req.month_year]
                        )
                        continue
                    if payroll_idx == j_idx:
                        # Joined in this pay period! First salary will be disbursed starting from NEXT month.
                        # Do not show/generate pending salary for this initial month.
                        db_manager.execute_write(
                            "DELETE FROM payroll_records WHERE employee_id = ? AND month_year = ?",
                            [emp["id"], req.month_year]
                        )
                        continue

            eligible_count += 1
            existing_list = repo.get_all(filters={"employee_id": emp["id"], "month_year": req.month_year})
            existing = existing_list[0] if (existing_list and len(existing_list) > 0) else None
            
            # Check if employee has a defined salary structure
            ss = db_manager.execute_one(
                "SELECT * FROM salary_structures WHERE employee_id = ? ORDER BY effective_from DESC",
                [emp["id"]]
            )
            if ss:
                basic = float(ss.get("basic_monthly") or 2000.0)
                allowances = float(ss.get("hra_monthly") or 0.0) + float(ss.get("transport_allowance") or 0.0) + float(ss.get("medical_allowance") or 0.0) + float(ss.get("special_allowance") or 0.0)
                deductions = float(ss.get("pf_employee") or 0.0)
                tax = float(ss.get("professional_tax") or 50.0)
            else:
                basic = 2000.0
                allowances = 400.0
                deductions = 120.0
                tax = 60.0

            # ── Overtime Remuneration Calculation ──
            hourly_rate = basic / 160.0
            ot_rate = hourly_rate * 1.5

            ot_rows = db_manager.execute_query(
                "SELECT COALESCE(SUM(hours), 0.0) as total_ot FROM overtime_logs WHERE (employee_id = ? OR employee_id = ?) AND status = 'APPROVED'",
                [emp["id"], emp.get("employee_code", "")]
            )
            ot_hours = float(ot_rows[0]["total_ot"] if ot_rows else 0.0)
            ot_pay = round(ot_hours * ot_rate, 2)
            total_allowances = round(allowances + ot_pay, 2)

            net = round(basic + total_allowances - deductions - tax, 2)
            total_gross += (basic + total_allowances)
            total_net += net
            total_deductions += (deductions + tax)

            record_payload = {
                "employee_id": emp["id"],
                "employee_name": emp.get("full_name") or emp.get("name") or "Staff",
                "month_year": req.month_year,
                "basic_pay": basic,
                "allowances": total_allowances,
                "deductions": deductions,
                "tax": tax,
                "net_salary": net,
                "overtime_hours": ot_hours,
                "overtime_pay": ot_pay,
                "status": "APPROVED"
            }

            if not existing:
                new_id = f"PAY-{req.month_year.replace(' ', '-')}-{emp['id']}"
                record_payload["id"] = new_id
                repo.create(record_payload)
                generated_count += 1
            elif existing.get("status") not in ("PAID", "DISBURSED"):
                repo.update(existing["id"], record_payload)
                generated_count += 1
        except Exception as emp_err:
            logger.warning(f"Error processing payroll for employee {emp.get('id')}: {emp_err}")

    # Record or update payroll run
    run_id = f"RUN-{req.month_year.replace(' ', '-')}"
    try:
        existing_run = db_manager.execute_one("SELECT * FROM payroll_runs WHERE id = ?", [run_id])
        if existing_run:
            db_manager.execute_write(
                "UPDATE payroll_runs SET status = 'COMPUTED', total_employees = ?, total_gross = ?, total_net = ?, total_deductions = ? WHERE id = ?",
                [eligible_count, total_gross, total_net, total_deductions, run_id]
            )
        else:
            db_manager.execute_write(
                "INSERT INTO payroll_runs (id, month_year, status, total_employees, total_gross, total_net, total_deductions, processed_by) VALUES (?, ?, 'COMPUTED', ?, ?, ?, ?, 'admin')",
                [run_id, req.month_year, eligible_count, total_gross, total_net, total_deductions]
            )
    except Exception as run_err:
        logger.warning(f"Payroll run record notice: {run_err}")

    return ApiResponse(
        message=f"Payroll generated for {eligible_count} eligible active employees for {req.month_year} (new joiners scheduled from next month)",
        data={
            "run_id": run_id,
            "month_year": req.month_year,
            "generatedCount": len(employees),
            "total_gross": total_gross,
            "total_net": total_net,
            "total_deductions": total_deductions
        }
    )

# ─── Approve Payroll Run ──────────────────────────────────────────────────────
@router.patch("/runs/{id}/approve")
def approve_payroll_run(id: str):
    run = db_manager.execute_one("SELECT * FROM payroll_runs WHERE id = ?", [id])
    if not run:
        raise HTTPException(status_code=404, detail="Payroll run not found")
    
    db_manager.execute_write(
        "UPDATE payroll_runs SET status = 'APPROVED', approved_by = 'Executive Management' WHERE id = ?",
        [id]
    )
    updated = db_manager.execute_one("SELECT * FROM payroll_runs WHERE id = ?", [id])
    return ApiResponse(message=f"Payroll run {id} approved for disbursement", data=updated)

# ─── Disburse Payroll Run ─────────────────────────────────────────────────────
@router.post("/runs/{id}/disburse")
def disburse_payroll_run(id: str):
    run = db_manager.execute_one("SELECT * FROM payroll_runs WHERE id = ?", [id])
    if not run:
        raise HTTPException(status_code=404, detail="Payroll run not found")
    
    now_str = datetime.now().strftime("%Y-%m-%d %H:%M:%S")
    # 1. Update payroll run status
    db_manager.execute_write(
        "UPDATE payroll_runs SET status = 'DISBURSED', disbursed_at = ? WHERE id = ?",
        [now_str, id]
    )

    # 2. Update all salary slips for that month to PAID
    month_year = run.get("month_year")
    db_manager.execute_write(
        "UPDATE payroll_records SET status = 'PAID', disbursed_at = ? WHERE month_year = ?",
        [now_str, month_year]
    )

    updated = db_manager.execute_one("SELECT * FROM payroll_runs WHERE id = ?", [id])
    return ApiResponse(
        message=f"Payroll for {month_year} successfully disbursed! All {run.get('total_employees', 0)} salary records marked as PAID.",
        data=updated
    )

# ─── Download Bank Transfer File (CSV) ────────────────────────────────────────
@router.get("/runs/{id}/bank-file")
@router.get("/bank-file")
def download_bank_transfer_file(id: Optional[str] = None, month_year: Optional[str] = Query(None)):
    target_id = id or month_year or "Current"
    run = db_manager.execute_one("SELECT * FROM payroll_runs WHERE id = ?", [target_id])
    if not run:
        run = db_manager.execute_one("SELECT * FROM payroll_runs WHERE month_year = ?", [target_id])

    month_str = run.get("month_year", target_id) if run else target_id
    records = db_manager.execute_query(
        """SELECT r.employee_id, e.employee_code, r.employee_name, e.department, e.branch,
                  r.basic_pay, r.allowances, COALESCE(r.overtime_hours, 0.0) as overtime_hours,
                  COALESCE(r.overtime_pay, 0.0) as overtime_pay,
                  r.deductions, r.tax, r.net_salary
           FROM payroll_records r
           LEFT JOIN employees e ON r.employee_id = e.id
           WHERE r.month_year = ?""",
        [month_str]
    )

    if not records:
        # Fallback to active employees with calculated or standard salary
        records = db_manager.execute_query(
            """SELECT e.id as employee_id, e.employee_code, e.full_name as employee_name, e.department, e.branch,
                      COALESCE(ss.basic_monthly, 2200.0) as basic_pay,
                      COALESCE(ss.hra_monthly + ss.transport_allowance + ss.medical_allowance + ss.special_allowance, 450.0) as allowances,
                      0.0 as overtime_hours, 0.0 as overtime_pay,
                      COALESCE(ss.pf_employee, 264.0) as deductions,
                      COALESCE(ss.professional_tax, 50.0) as tax,
                      COALESCE(ss.basic_monthly + ss.hra_monthly + ss.transport_allowance + ss.medical_allowance + ss.special_allowance - ss.pf_employee - ss.professional_tax, 2200.0) as net_salary
               FROM employees e
               LEFT JOIN salary_structures ss ON e.id = ss.employee_id
               WHERE e.status = 'ACTIVE'"""
        )

    output = io.StringIO()
    writer = csv.writer(output)

    # Header
    writer.writerow([
        "Employee Code",
        "Staff Name",
        "Department",
        "Facility Branch",
        "Bank Partner",
        "Account Number",
        "Routing / IFSC",
        "Currency",
        "Monthly Basic Pay (USD)",
        "Overtime Hours",
        "Overtime Pay (USD)",
        "Total Allowances (USD)",
        "Statutory Deductions (USD)",
        "Net Disbursed Amount (USD)",
        "Payment Value Date",
        "Batch Transaction Ref"
    ])

    today_str = datetime.now().strftime("%Y-%m-%d")
    batch_ref = f"SOILEX-ACH-{target_id}"

    # Sample bank mapping
    bank_details = {
        "Hanoi HQ": ("Vietcombank Hanoi", "0011002345678", "BFTVVNVX"),
        "Kochi Terminal": ("State Bank of India (Kochi)", "30198421098", "SBIN0004123"),
        "Hai Phong Hub": ("Techcombank Hai Phong", "1903348190123", "TCBVVNVX"),
        "Dubai Office": ("Emirates NBD Dubai", "1019283746501", "EBILAEAD"),
    }

    for idx, r in enumerate(records, 1):
        branch = r.get("branch") or "Hanoi HQ"
        bank_name, acct, routing = bank_details.get(branch, ("Standard Chartered", f"9910283{idx:04d}", "SCBLINBB"))
        emp_code = r.get("employee_code") or r.get("employee_id") or f"SLX-E{idx:02d}"

        writer.writerow([
            emp_code,
            r.get("employee_name"),
            r.get("department") or "Operations",
            branch,
            bank_name,
            acct,
            routing,
            "USD",
            f"{float(r.get('basic_pay') or 0.0):.2f}",
            f"{float(r.get('overtime_hours') or 0.0):.1f}",
            f"{float(r.get('overtime_pay') or 0.0):.2f}",
            f"{float(r.get('allowances') or 0.0):.2f}",
            f"{float(r.get('deductions') or 0.0) + float(r.get('tax') or 0.0):.2f}",
            f"{float(r.get('net_salary') or 0.0):.2f}",
            today_str,
            batch_ref
        ])

    csv_data = output.getvalue()
    clean_filename = f"soilex_bank_disbursement_{month_str.replace(' ', '_')}.csv"

    return Response(
        content=csv_data,
        media_type="text/csv",
        headers={
            "Content-Disposition": f"attachment; filename={clean_filename}",
            "Access-Control-Expose-Headers": "Content-Disposition"
        }
    )

# ─── Salary Structure (CTC Master) ────────────────────────────────────────────
@router.get("/salary-structure/{employee_id}")
def get_salary_structure(employee_id: str):
    settled_rows = db_manager.execute_query("SELECT employee_id FROM employee_exits WHERE status = 'SETTLED'") or []
    settled_ids = {s["employee_id"] for s in settled_rows if s.get("employee_id")}
    if employee_id in settled_ids:
        return ApiResponse(data=None, message="Employee has separated and completed F&F settlement")
    items = ss_repo.get_all(filters={"employee_id": employee_id}, limit=1)
    if items:
        return ApiResponse(data=items[0])
    return ApiResponse(data=None, message="No salary structure found")

@router.post("/salary-structure", status_code=201)
def upsert_salary_structure(data: dict):
    existing = ss_repo.get_all(filters={"employee_id": data.get('employee_id')}, limit=1)
    if existing:
        updated = ss_repo.update(existing[0]['id'], data)
        return ApiResponse(message="Salary structure updated", data=updated)
    else:
        data['id'] = f"SS-{int(time.time() * 1000) % 10000}"
        created = ss_repo.create(data)
        return ApiResponse(message="Salary structure created", data=created)
