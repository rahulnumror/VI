import logging
from ..core.database import db_manager

logger = logging.getLogger("soilex.db.migration")

SCHEMA_SQL = """
-- Users & Roles
CREATE TABLE IF NOT EXISTS users (
    id VARCHAR PRIMARY KEY,
    name VARCHAR NOT NULL,
    email VARCHAR UNIQUE NOT NULL,
    role VARCHAR NOT NULL,
    department VARCHAR,
    hashed_password VARCHAR NOT NULL,
    status VARCHAR DEFAULT 'ACTIVE',
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- Commodity Products (Spices, Grains, Animal Feed)
CREATE TABLE IF NOT EXISTS products (
    id VARCHAR PRIMARY KEY,
    name VARCHAR NOT NULL,
    category VARCHAR NOT NULL,
    grade VARCHAR NOT NULL,
    origin VARCHAR NOT NULL,
    stock_mt DOUBLE DEFAULT 0.0,
    price_mt VARCHAR NOT NULL,
    packaging VARCHAR NOT NULL,
    status VARCHAR DEFAULT 'In Stock',
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- Business Partners (Buyers, Suppliers, Brokers)
CREATE TABLE IF NOT EXISTS partners (
    id VARCHAR PRIMARY KEY,
    name VARCHAR NOT NULL,
    type VARCHAR NOT NULL, -- BUYER, SUPPLIER, BROKER
    country VARCHAR NOT NULL,
    tier VARCHAR DEFAULT 'TIER_1',
    kyc_status VARCHAR DEFAULT 'VERIFIED',
    payment_terms VARCHAR NOT NULL,
    credit_limit VARCHAR,
    email VARCHAR,
    phone VARCHAR,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- Trade Contracts (Sales & Procurement)
CREATE TABLE IF NOT EXISTS trade_contracts (
    id VARCHAR PRIMARY KEY,
    contract_no VARCHAR UNIQUE NOT NULL,
    type VARCHAR NOT NULL, -- EXPORT, IMPORT
    partner_id VARCHAR,
    partner_name VARCHAR NOT NULL,
    commodity VARCHAR NOT NULL,
    volume_cbm DOUBLE DEFAULT 0.0,
    volume_mt DOUBLE DEFAULT 0.0,
    total_usd DOUBLE DEFAULT 0.0,
    status VARCHAR DEFAULT 'ORDER_IN_PROCESS',
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- Trade Shipments & Bills of Lading
CREATE TABLE IF NOT EXISTS trade_shipments (
    id VARCHAR PRIMARY KEY,
    shipment_no VARCHAR UNIQUE NOT NULL,
    bl_no VARCHAR UNIQUE NOT NULL,
    contract_id VARCHAR,
    carrier VARCHAR NOT NULL,
    port_of_loading VARCHAR NOT NULL,
    port_of_discharge VARCHAR NOT NULL,
    etd VARCHAR,
    eta VARCHAR,
    container_count INTEGER DEFAULT 1,
    customs_status VARCHAR DEFAULT 'PENDING_CUSTOMS',
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- Cargo Containers
CREATE TABLE IF NOT EXISTS containers (
    id VARCHAR PRIMARY KEY,
    container_no VARCHAR NOT NULL,
    seal_no VARCHAR,
    shipment_id VARCHAR,
    commodity VARCHAR NOT NULL,
    gross_weight_kg DOUBLE DEFAULT 0.0,
    net_weight_kg DOUBLE DEFAULT 0.0,
    temperature_c DOUBLE,
    status VARCHAR DEFAULT 'LOADED', -- LOADED, IN_TRANSIT, CUSTOMS_INSPECTION, CLEARED
    last_updated TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- Workforce & Employee Directory
CREATE TABLE IF NOT EXISTS employees (
    id VARCHAR PRIMARY KEY,
    employee_code VARCHAR UNIQUE NOT NULL,
    full_name VARCHAR NOT NULL,
    email VARCHAR UNIQUE NOT NULL,
    phone VARCHAR,
    department VARCHAR NOT NULL,
    designation VARCHAR NOT NULL,
    branch VARCHAR NOT NULL,
    shift VARCHAR DEFAULT 'Morning Shift',
    join_date VARCHAR,
    status VARCHAR DEFAULT 'ACTIVE',
    avatar_url VARCHAR,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- Attendance & Biometric Logs
CREATE TABLE IF NOT EXISTS attendance_logs (
    id VARCHAR PRIMARY KEY,
    employee_id VARCHAR NOT NULL,
    employee_name VARCHAR NOT NULL,
    date VARCHAR NOT NULL,
    clock_in VARCHAR,
    clock_out VARCHAR,
    work_hours DOUBLE DEFAULT 0.0,
    status VARCHAR DEFAULT 'PRESENT', -- PRESENT, ABSENT, LEAVE, LATE, HALF_DAY
    source VARCHAR DEFAULT 'BIOMETRIC_DEVICE',
    location VARCHAR DEFAULT 'Hanoi HQ / Factory',
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- Leave Requests
CREATE TABLE IF NOT EXISTS leave_requests (
    id VARCHAR PRIMARY KEY,
    employee_id VARCHAR NOT NULL,
    employee_name VARCHAR NOT NULL,
    leave_type VARCHAR NOT NULL, -- Annual, Medical, Casual
    start_date VARCHAR NOT NULL,
    end_date VARCHAR NOT NULL,
    total_days DOUBLE DEFAULT 1.0,
    reason VARCHAR,
    status VARCHAR DEFAULT 'PENDING', -- PENDING, APPROVED, REJECTED
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- Payroll & Compensation Records
CREATE TABLE IF NOT EXISTS payroll_records (
    id VARCHAR PRIMARY KEY,
    employee_id VARCHAR NOT NULL,
    employee_name VARCHAR NOT NULL,
    month_year VARCHAR NOT NULL,
    basic_pay DOUBLE DEFAULT 0.0,
    allowances DOUBLE DEFAULT 0.0,
    deductions DOUBLE DEFAULT 0.0,
    tax DOUBLE DEFAULT 0.0,
    net_salary DOUBLE DEFAULT 0.0,
    overtime_hours DOUBLE DEFAULT 0.0,
    overtime_pay DOUBLE DEFAULT 0.0,
    status VARCHAR DEFAULT 'PAID', -- DRAFT, APPROVED, PAID
    disbursed_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- Calendar & Operational Scheduling
CREATE TABLE IF NOT EXISTS calendar_events (
    id VARCHAR PRIMARY KEY,
    title VARCHAR NOT NULL,
    description VARCHAR,
    event_type VARCHAR NOT NULL, -- MEETING, INSPECTION, SHIPMENT, TRAINING
    start_time VARCHAR NOT NULL,
    end_time VARCHAR NOT NULL,
    location VARCHAR,
    participants VARCHAR,
    created_by VARCHAR DEFAULT 'admin',
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- Workspace Task / TODO Planner
CREATE TABLE IF NOT EXISTS workspace_tasks (
    id VARCHAR PRIMARY KEY,
    title VARCHAR NOT NULL,
    category VARCHAR NOT NULL,
    priority VARCHAR DEFAULT 'MEDIUM', -- LOW, MEDIUM, HIGH, URGENT
    due_date VARCHAR,
    assigned_to VARCHAR,
    completed BOOLEAN DEFAULT FALSE,
    notes VARCHAR,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- Administrative Facilities & Bio-Hubs
CREATE TABLE IF NOT EXISTS admin_facilities (
    id VARCHAR PRIMARY KEY,
    code VARCHAR UNIQUE NOT NULL,
    name VARCHAR NOT NULL,
    type VARCHAR NOT NULL,
    location VARCHAR NOT NULL,
    capacity_sqft INTEGER DEFAULT 0,
    active_personnel INTEGER DEFAULT 0,
    status VARCHAR DEFAULT 'OPERATIONAL'
);

-- HR: Leave Balances per employee per year
CREATE TABLE IF NOT EXISTS leave_balances (
    id VARCHAR PRIMARY KEY,
    employee_id VARCHAR NOT NULL,
    year INTEGER NOT NULL,
    annual_total INTEGER DEFAULT 18,
    annual_used INTEGER DEFAULT 0,
    sick_total INTEGER DEFAULT 12,
    sick_used INTEGER DEFAULT 0,
    casual_total INTEGER DEFAULT 6,
    casual_used INTEGER DEFAULT 0,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- HR: Company Holiday Calendar
CREATE TABLE IF NOT EXISTS holidays (
    id VARCHAR PRIMARY KEY,
    name VARCHAR NOT NULL,
    date VARCHAR NOT NULL,
    branch VARCHAR DEFAULT 'ALL',
    type VARCHAR DEFAULT 'NATIONAL'
);

-- HR: Overtime Logs
CREATE TABLE IF NOT EXISTS overtime_logs (
    id VARCHAR PRIMARY KEY,
    employee_id VARCHAR NOT NULL,
    employee_name VARCHAR NOT NULL,
    date VARCHAR NOT NULL,
    hours DOUBLE DEFAULT 0.0,
    reason VARCHAR,
    status VARCHAR DEFAULT 'PENDING',
    approved_by VARCHAR,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- HR: Employment History (promotions, transfers)
CREATE TABLE IF NOT EXISTS employment_history (
    id VARCHAR PRIMARY KEY,
    employee_id VARCHAR NOT NULL,
    event_type VARCHAR NOT NULL,
    from_designation VARCHAR,
    to_designation VARCHAR,
    from_department VARCHAR,
    to_department VARCHAR,
    effective_date VARCHAR,
    remarks VARCHAR,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- HR: Onboarding Checklist
CREATE TABLE IF NOT EXISTS onboarding_checklist (
    id VARCHAR PRIMARY KEY,
    employee_id VARCHAR NOT NULL,
    item VARCHAR NOT NULL,
    completed BOOLEAN DEFAULT FALSE,
    completed_at TIMESTAMP
);

-- HR: Salary Structures (CTC per employee)
CREATE TABLE IF NOT EXISTS salary_structures (
    id VARCHAR PRIMARY KEY,
    employee_id VARCHAR UNIQUE NOT NULL,
    effective_from VARCHAR,
    ctc_annual DOUBLE DEFAULT 0.0,
    basic_monthly DOUBLE DEFAULT 0.0,
    hra_monthly DOUBLE DEFAULT 0.0,
    transport_allowance DOUBLE DEFAULT 0.0,
    medical_allowance DOUBLE DEFAULT 0.0,
    special_allowance DOUBLE DEFAULT 0.0,
    pf_employee DOUBLE DEFAULT 0.0,
    pf_employer DOUBLE DEFAULT 0.0,
    esi_employee DOUBLE DEFAULT 0.0,
    professional_tax DOUBLE DEFAULT 0.0,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- HR: Payroll Run Cycles
CREATE TABLE IF NOT EXISTS payroll_runs (
    id VARCHAR PRIMARY KEY,
    month_year VARCHAR NOT NULL,
    status VARCHAR DEFAULT 'DRAFT',
    total_employees INTEGER DEFAULT 0,
    total_gross DOUBLE DEFAULT 0.0,
    total_net DOUBLE DEFAULT 0.0,
    total_deductions DOUBLE DEFAULT 0.0,
    processed_by VARCHAR DEFAULT 'admin',
    approved_by VARCHAR,
    disbursed_at TIMESTAMP,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- Recruitment: Job Requisitions
CREATE TABLE IF NOT EXISTS job_requisitions (
    id VARCHAR PRIMARY KEY,
    title VARCHAR NOT NULL,
    department VARCHAR NOT NULL,
    branch VARCHAR NOT NULL,
    min_experience_years INTEGER DEFAULT 0,
    salary_budget_usd DOUBLE DEFAULT 0.0,
    deadline VARCHAR,
    status VARCHAR DEFAULT 'OPEN',
    created_by VARCHAR DEFAULT 'admin',
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- Recruitment: Candidates
CREATE TABLE IF NOT EXISTS candidates (
    id VARCHAR PRIMARY KEY,
    jd_id VARCHAR,
    full_name VARCHAR NOT NULL,
    email VARCHAR,
    phone VARCHAR,
    source VARCHAR DEFAULT 'JOB_PORTAL',
    resume_url VARCHAR,
    stage VARCHAR DEFAULT 'APPLIED',
    current_salary DOUBLE DEFAULT 0.0,
    expected_salary DOUBLE DEFAULT 0.0,
    notice_period_days INTEGER DEFAULT 30,
    notes VARCHAR,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- Recruitment: Interviews
CREATE TABLE IF NOT EXISTS interviews (
    id VARCHAR PRIMARY KEY,
    candidate_id VARCHAR NOT NULL,
    jd_id VARCHAR,
    scheduled_at VARCHAR,
    interviewer_id VARCHAR,
    mode VARCHAR DEFAULT 'VIDEO',
    feedback VARCHAR,
    rating INTEGER DEFAULT 0,
    result VARCHAR DEFAULT 'PENDING',
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- Performance: Goals & OKRs
CREATE TABLE IF NOT EXISTS performance_goals (
    id VARCHAR PRIMARY KEY,
    employee_id VARCHAR NOT NULL,
    title VARCHAR NOT NULL,
    description VARCHAR,
    quarter VARCHAR,
    target_metric VARCHAR,
    progress_percent INTEGER DEFAULT 0,
    status VARCHAR DEFAULT 'IN_PROGRESS',
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- Attendance Regularizations (Missed Punches / Field Duty)
CREATE TABLE IF NOT EXISTS attendance_regularizations (
    id VARCHAR PRIMARY KEY,
    employee_id VARCHAR NOT NULL,
    employee_name VARCHAR NOT NULL,
    date VARCHAR NOT NULL,
    punch_type VARCHAR NOT NULL,
    requested_clock_in VARCHAR,
    requested_clock_out VARCHAR,
    reason VARCHAR NOT NULL,
    status VARCHAR DEFAULT 'PENDING',
    approved_by VARCHAR,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- Shopfloor Shift Roster & Rotations
CREATE TABLE IF NOT EXISTS shift_roster (
    id VARCHAR PRIMARY KEY,
    employee_id VARCHAR NOT NULL,
    employee_name VARCHAR NOT NULL,
    department VARCHAR NOT NULL,
    branch VARCHAR NOT NULL,
    shift_code VARCHAR NOT NULL,
    shift_name VARCHAR NOT NULL,
    timings VARCHAR NOT NULL,
    effective_from VARCHAR NOT NULL,
    status VARCHAR DEFAULT 'ACTIVE',
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- ISO 22000 & HACCP Food Safety Compliance & Health Records
CREATE TABLE IF NOT EXISTS employee_compliance (
    id VARCHAR PRIMARY KEY,
    employee_id VARCHAR UNIQUE NOT NULL,
    medical_fitness_status VARCHAR DEFAULT 'FIT_FOR_FOOD_PROCESSING',
    medical_check_date VARCHAR,
    medical_expiry_date VARCHAR,
    haccp_certified BOOLEAN DEFAULT TRUE,
    haccp_cert_expiry VARCHAR,
    blood_group VARCHAR,
    emergency_contact_name VARCHAR,
    emergency_contact_phone VARCHAR,
    gmp_violations_count INTEGER DEFAULT 0,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- Performance Reviews & 9-Box Appraisals
CREATE TABLE IF NOT EXISTS performance_reviews (
    id VARCHAR PRIMARY KEY,
    employee_id VARCHAR NOT NULL,
    employee_name VARCHAR NOT NULL,
    cycle VARCHAR NOT NULL,
    self_rating DOUBLE DEFAULT 4.0,
    manager_rating DOUBLE DEFAULT 4.2,
    potential_rating DOUBLE DEFAULT 4.0,
    status VARCHAR DEFAULT 'COMPLETED',
    feedback VARCHAR,
    reviewer VARCHAR DEFAULT 'Head of Department',
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- Separation, Clearances & Full & Final (F&F) Settlement
CREATE TABLE IF NOT EXISTS employee_exits (
    id VARCHAR PRIMARY KEY,
    employee_id VARCHAR NOT NULL,
    employee_name VARCHAR NOT NULL,
    department VARCHAR NOT NULL,
    resignation_date VARCHAR NOT NULL,
    last_working_day VARCHAR NOT NULL,
    notice_days INTEGER DEFAULT 30,
    reason VARCHAR,
    status VARCHAR DEFAULT 'SUBMITTED',
    it_clearance BOOLEAN DEFAULT FALSE,
    finance_clearance BOOLEAN DEFAULT FALSE,
    admin_clearance BOOLEAN DEFAULT FALSE,
    unpaid_salary_days INTEGER DEFAULT 15,
    leave_encashment_days INTEGER DEFAULT 6,
    settlement_amount DOUBLE DEFAULT 0.0,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- Corporate Weekly Timesheets
CREATE TABLE IF NOT EXISTS timesheets (
    id VARCHAR PRIMARY KEY,
    employee_id VARCHAR NOT NULL,
    employee_name VARCHAR NOT NULL,
    week_start VARCHAR NOT NULL,
    week_end VARCHAR NOT NULL,
    charge_code VARCHAR NOT NULL,
    project_name VARCHAR NOT NULL,
    task_desc VARCHAR,
    mon_hours DOUBLE DEFAULT 0.0,
    tue_hours DOUBLE DEFAULT 0.0,
    wed_hours DOUBLE DEFAULT 0.0,
    thu_hours DOUBLE DEFAULT 0.0,
    fri_hours DOUBLE DEFAULT 0.0,
    sat_hours DOUBLE DEFAULT 0.0,
    sun_hours DOUBLE DEFAULT 0.0,
    total_hours DOUBLE DEFAULT 0.0,
    status VARCHAR DEFAULT 'DRAFT',
    approver VARCHAR DEFAULT 'Engagement Director',
    comments VARCHAR,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);
"""

def init_db_schema():
    """Initializes all database tables in DuckDB"""
    try:
        db_manager.execute_script(SCHEMA_SQL)
        for stmt in [
            "ALTER TABLE users ADD COLUMN IF NOT EXISTS employee_id VARCHAR",
            "ALTER TABLE payroll_records ADD COLUMN IF NOT EXISTS overtime_hours DOUBLE DEFAULT 0.0",
            "ALTER TABLE payroll_records ADD COLUMN IF NOT EXISTS overtime_pay DOUBLE DEFAULT 0.0",
        ]:
            try:
                db_manager.execute_write(stmt)
            except Exception as e:
                logger.warning(f"Alter statement notice: {stmt} -> {e}")
        logger.info("DuckDB database tables initialized successfully.")
        return True
    except Exception as e:
        logger.error(f"Error initializing database schema: {e}")
        raise e
