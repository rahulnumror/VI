# FastAPI & DuckDB Backend Architecture & Migration Plan

This implementation plan details the end-to-end architecture and step-by-step roadmap for building the **SOILEX Life Science ERP** backend using **FastAPI** and **DuckDB**, structured with a **Repository Pattern & Database Abstraction Layer** to allow zero-friction migration to on-prem production servers (e.g. PostgreSQL, MySQL, SQL Server) in the future.

---

## 1. Architectural Strategy: DuckDB Today, On-Prem Database Tomorrow

### Why DuckDB is Ideal for V1 / Local Deployment:
1. **Zero External Dependencies**: DuckDB is an in-process, serverless relational & columnar engine (like SQLite, but designed for high-performance analytical queries and standard ACID transactions).
2. **Single File Storage**: All data, schemas, indexes, and tables reside in `backend/data/soilex.duckdb`. It can be easily backed up, committed to demo environments, or exported to Parquet/CSV.
3. **Columnar & Analytical Power**: Fast calculations for trade volumes (CBM/MT), revenue aggregates ($7M YTD), and real-time KPI metrics without requiring complex Redis caching.

### How We Solve DuckDB Concurrency:
DuckDB supports concurrent readers, but restricts writes to a single process connection. In FastAPI:
* We implement a thread-safe **Database Manager** with a write mutex lock (`asyncio.Lock` / `threading.Lock`).
* Reads execute concurrently using read-only cursor connections or shared handles.
* Writes (INSERT, UPDATE, DELETE) pass through the connection manager with automated transactions, preventing `file locked` exceptions under concurrent API load.

### How Migration to PostgreSQL / On-Prem Will Work (Zero Code Rewrites):
We implement the **Repository Pattern** and **Dependency Injection**:
```mermaid
graph TD
    Client["React Frontend (Port 3000)"] -->|"REST /api/v1/*"| Routers["FastAPI Routers"]
    Routers --> Services["Service Layer (Business Logic & Validation)"]
    Services --> IRepo["Abstract BaseRepository Interface"]
    
    IRepo -.->|"Config: DB_TYPE=duckdb"| DuckDBRepo["DuckDB Repository (soilex.duckdb)"]
    IRepo -.->|"Config: DB_TYPE=postgres"| PostgresRepo["PostgreSQL / On-Prem Repository"]
```
* **Routers and Services** only talk to abstract interfaces using Pydantic models.
* When you decide to move to an on-prem PostgreSQL server later:
  1. Spin up your PostgreSQL server or container.
  2. Run the migration script (`export_to_postgres.py` or Alembic).
  3. Set `DATABASE_URL=postgresql://user:pass@host:5432/soilex_erp` in `.env`.
  4. Zero routes, controllers, or frontend API calls need to be rewritten!

---

## User Review Required

> [!IMPORTANT]
> **Authentication Mode for V1**:
> We will implement standard JWT token-based authentication (`/api/v1/auth/login`) with pre-configured role-based users:
> - **Admin / Executive**: `admin@soilexlifescience.com` (Full access to all 20 modules)
> - **Trade Officer**: `trade@soilexlifescience.com` (Contracts, Shipments, Products, Partners)
> - **HR Manager**: `hr@soilexlifescience.com` (Employees, Attendance, Payroll, Calendar)
> For convenience during local development, endpoints will support optional guest/demo bypass if the token header is omitted.

> [!TIP]
> **Python Virtual Environment**:
> We will create an isolated virtual environment at `d:\IV\backend\venv` so your global Python 3.12 installation remains clean.

---

## Open Questions

> [!NOTE]
> 1. **Auto-Seed Initial Data**: Should we pre-populate the DuckDB database with the authentic SOILEX agro commodities (Black Pepper, Cardamom, Aniseed, Perfumed Rice DT 8, Rice DDGS 45% Protein, Soybean Meal), realistic container shipments, and employee records from the current frontend? *(Recommended: Yes, so the ERP works immediately out of the box).*
> 2. **WebSocket Support**: Do you want a real-time WebSocket connection for live container status & biometric clock-in alerts, or is standard REST polling sufficient for V1?

---

## Proposed Changes

### Component 1: Backend Infrastructure & Database Engine (`d:\IV\backend/`)

#### [NEW] [requirements.txt](file:///d:/IV/backend/requirements.txt)
Dependencies:
* `fastapi>=0.111.0`
* `uvicorn[standard]>=0.30.0`
* `duckdb>=1.0.0`
* `pydantic>=2.7.0`
* `pydantic-settings>=2.2.0`
* `python-jose[cryptography]>=3.3.0`
* `passlib[bcrypt]>=1.7.4`
* `python-multipart>=0.0.9`

#### [NEW] [config.py](file:///d:/IV/backend/app/core/config.py)
* Environment variables management (`DATABASE_TYPE`, `DUCKDB_PATH`, `JWT_SECRET`, `CORS_ORIGINS`).

#### [NEW] [database.py](file:///d:/IV/backend/app/core/database.py)
* Singleton DuckDB connection manager with connection pooling, thread-safe write locks, and read cursor factories.

#### [NEW] [schema_migration.py](file:///d:/IV/backend/app/db/schema_migration.py)
* DDL initialization script creating all relational tables in DuckDB:
  - `users`, `products`, `partners`, `trade_contracts`, `trade_shipments`, `containers`, `employees`, `attendance_logs`, `leave_requests`, `payroll_records`, `calendar_events`, `workspace_tasks`, `admin_facilities`.

#### [NEW] [seed_data.py](file:///d:/IV/backend/app/db/seed_data.py)
* Auto-seed script populating the tables with real SOILEX Life Science data matching `BACKEND_API_SPECIFICATION.md`.

---

### Component 2: Domain Schemas & Repository Layer (`d:\IV\backend/app/`)

#### [NEW] [Pydantic Models](file:///d:/IV/backend/app/models/)
* `common.py`: Standard API envelope (`ApiResponse[T]`, pagination).
* `product.py`: Product specifications, FOB pricing, stock MT.
* `trade.py`: Trade contracts, shipments, container tracking, customs status.
* `partner.py`: Buyers, Suppliers, Brokers with KYC & payment terms.
* `employee.py`: Employee directory, designations, departments, shifts.
* `attendance.py`: Biometric clock-in records, shift duration, leave balances.
* `payroll.py`: Salary slips, gross/net earnings, tax deductions.
* `calendar.py`: Real-time calendar events, meetings, inspections.
* `task.py`: Workspace TODO tasks, priorities, completion status.

#### [NEW] [Repositories](file:///d:/IV/backend/app/repositories/)
* `base.py`: Abstract repository defining interface methods (`find_all`, `find_by_id`, `create`, `update`, `delete`).
* `duckdb_repo.py`: DuckDB SQL implementation with parameterized queries.

---

### Component 3: FastAPI Routers & Endpoints (`d:\IV\backend/app/api/v1/`)

#### [NEW] [api.py](file:///d:/IV/backend/app/api/v1/api.py)
Aggregated API router mounting:
* `/auth` — Login, profile, token refresh
* `/dashboard` — Executive KPI trade card summaries
* `/products` — Commodities, Spices & Animal Feed CRUD
* `/trade` — Export/Import shipments, manifests, containers
* `/partners` — Buyer/Supplier/Broker directory
* `/employees` — HR workforce directory & employee profiles
* `/attendance` — Clock in/out simulator & leave management
* `/payroll` — Salary slips & compensation summaries
* `/calendar` — Calendar scheduling & events
* `/tasks` — My Day & workspace task management
* `/reports` — Revenue & transaction audit logs
* `/admin` — Bio-Hub facilities & system configurations

#### [NEW] [main.py](file:///d:/IV/backend/app/main.py)
* FastAPI application with CORS middleware (`http://localhost:3000`), lifespan startup hook (runs migrations & seeding), and health-check endpoint (`/api/v1/health`).

#### [NEW] [run.py](file:///d:/IV/backend/run.py)
* Python runner script (`python run.py`) to launch Uvicorn on `http://127.0.0.1:8000` with hot-reloading.

---

### Component 4: Frontend API Integration (`d:\IV\src/`)

#### [NEW] [api.js](file:///d:/IV/src/services/api.js)
* Lightweight API service with `fetch` / `axios` handling:
  - Base URL configuration (`http://127.0.0.1:8000/api/v1`).
  - Automatic JSON unwrapping and error handling.
  - **Fail-safe fallback**: if backend is offline or loading, smoothly fall back to local in-memory mock data so UI remains 100% responsive.

#### [MODIFY] [vite.config.js](file:///d:/IV/vite.config.js)
* Add API proxy config (`/api` -> `http://localhost:8000`) for clean local development without CORS complications.

#### [MODIFY] [Key Components](file:///d:/IV/src/components/)
* Wire `MainDashboard.jsx`, `ProductCatalog.jsx`, `TradeView.jsx`, `RealtimeCalendar.jsx`, and `AttendanceView.jsx` to fetch live data from the backend.

---

## Verification Plan

### Automated Verification
1. **Virtual Environment Setup**: Create `backend/venv` and install all packages from `requirements.txt`.
2. **Schema & Database Seed**: Run `seed_data.py` and verify `soilex.duckdb` file creation and row counts via DuckDB SQL assertions.
3. **FastAPI Health & OpenAPI Swagger**: Start backend server and verify:
   - `GET http://127.0.0.1:8000/api/v1/health` -> `{"status": "online"}`
   - `GET http://127.0.0.1:8000/docs` -> Interactive OpenAPI Swagger UI with all 20 modules.
4. **API Endpoint Testing**: Automated curl / test script verifying:
   - Dashboard KPIs: `GET /api/v1/dashboard/executive-summary`
   - Spices catalog: `GET /api/v1/products` and `POST /api/v1/products`
   - Trade containers: `GET /api/v1/trade/containers`
   - Attendance clock-in: `POST /api/v1/attendance/clock-in`
   - Calendar events: `GET /api/v1/calendar/events`

### Manual Verification
1. **Frontend Integration**: Open `http://localhost:3000` in browser.
2. **Real-time Synchronization**: Add a new spice commodity (e.g. "Ceylon Cinnamon 90%") in the React UI, verify it persists in DuckDB and appears immediately in the table.
3. **Clock-In Flow**: Click "Simulate Biometric Clock-in" in the Attendance module, verify log is saved to `soilex.duckdb` and reflects across the HR Dashboard.
