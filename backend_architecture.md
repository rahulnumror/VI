# SOILEX Life Science ERP — Backend Architecture Explained

## The Big Picture

The backend follows a **3-layer clean architecture** where each layer has one job and only talks to the layer directly below it. This means you can swap out any layer without breaking the others.

```mermaid
graph TD
    subgraph "Layer 1: HTTP Interface"
        R1["🔐 Auth Router"]
        R2["📊 Dashboard Router"]
        R3["🌶️ Products Router"]
        R4["🚢 Trade Router"]
        R5["🤝 Partners Router"]
        R6["👤 Employees Router"]
        R7["⏰ Attendance Router"]
        R8["💰 Payroll Router"]
        R9["📅 Calendar Router"]
        R10["✅ Tasks Router"]
        R11["📈 Reports Router"]
        R12["🏭 Admin Router"]
    end

    subgraph "Layer 2: Business Logic & Data Models"
        Models["Pydantic v2 Schemas<br/>(Validation, Serialization)"]
        Security["JWT Auth & Password Hashing"]
    end

    subgraph "Layer 3: Data Access (Repository Pattern)"
        Interface["BaseRepository<br/>(Abstract Interface)"]
        DuckDB["DuckDBRepository<br/>(Current Implementation)"]
        Future["PostgresRepository<br/>(Future — Just add .env change)"]
    end

    subgraph "Storage"
        DB[("🦆 DuckDB<br/>soilex.duckdb<br/>Single File")]
        PG[("🐘 PostgreSQL<br/>On-Prem Server<br/>(Future)")]
    end

    R1 & R2 & R3 & R4 & R5 & R6 & R7 & R8 & R9 & R10 & R11 & R12 --> Models
    Models --> Interface
    Interface --> DuckDB
    Interface -.-> Future
    DuckDB --> DB
    Future -.-> PG
```

---

## Layer-by-Layer Breakdown

### Layer 1: FastAPI Routers (HTTP Interface)

These are the **12 API routers** that receive HTTP requests from your React frontend. Each router is a separate Python file handling one ERP module.

| Router File | Prefix | Endpoints | What It Does |
|---|---|---|---|
| [auth.py](file:///d:/IV/backend/app/api/v1/endpoints/auth.py) | `/auth` | `POST /login`, `GET /me` | JWT token login, user profile |
| [dashboard.py](file:///d:/IV/backend/app/api/v1/endpoints/dashboard.py) | `/dashboard` | `GET /executive-summary` | Aggregates live KPIs from all tables |
| [products.py](file:///d:/IV/backend/app/api/v1/endpoints/products.py) | `/products` | Full CRUD | Spices, Grains, Animal Feed catalog |
| [trade.py](file:///d:/IV/backend/app/api/v1/endpoints/trade.py) | `/trade` | Contracts, Shipments, Containers | Export/Import logistics & Bill of Lading |
| [partners.py](file:///d:/IV/backend/app/api/v1/endpoints/partners.py) | `/partners` | CRUD + filter by type | Buyers, Suppliers, Brokers directory |
| [employees.py](file:///d:/IV/backend/app/api/v1/endpoints/employees.py) | `/employees` | CRUD + search | HR workforce directory |
| [attendance.py](file:///d:/IV/backend/app/api/v1/endpoints/attendance.py) | `/attendance` | Clock-in, Logs, Leaves | Biometric punch simulator & leave management |
| [payroll.py](file:///d:/IV/backend/app/api/v1/endpoints/payroll.py) | `/payroll` | Records, Generate | Monthly salary processing |
| [calendar.py](file:///d:/IV/backend/app/api/v1/endpoints/calendar.py) | `/calendar` | Events CRUD | Operational scheduling |
| [tasks.py](file:///d:/IV/backend/app/api/v1/endpoints/tasks.py) | `/tasks` | CRUD + Toggle | My Day / workspace planner |
| [reports.py](file:///d:/IV/backend/app/api/v1/endpoints/reports.py) | `/reports` | Revenue, Audit logs | YTD analytics & transaction audit trail |
| [admin.py](file:///d:/IV/backend/app/api/v1/endpoints/admin.py) | `/admin` | Facilities, System info | Bio-Hub sites & DB diagnostics |

All 12 routers are aggregated in [api.py](file:///d:/IV/backend/app/api/v1/api.py) and mounted under the `/api/v1` prefix.

---

### Layer 2: Pydantic Models & Security (Business Logic)

#### Standard API Envelope

Every response follows a consistent envelope defined in [common.py](file:///d:/IV/backend/app/models/common.py):

```json
{
  "success": true,
  "statusCode": 200,
  "message": "Retrieved 8 commodity products",
  "data": [ ... ],
  "timestamp": "2026-09-05T15:12:00Z"
}
```

This makes the frontend predictable — it always checks `response.data` for the payload.

#### Pydantic v2 Schema Layering

Each module has a **three-class pattern**:

```mermaid
graph LR
    Create["ProductCreate<br/>(What the frontend SENDS)"] -->|"extends"| Base["ProductBase<br/>(Shared fields)"]
    Response["ProductResponse<br/>(What the backend RETURNS)"] -->|"extends"| Base
    Update["ProductUpdate<br/>(Optional partial fields)"] -->|"standalone"| X["All fields Optional"]
```

- **`ProductCreate`** — Used for POST requests. Has all required fields validated.
- **`ProductUpdate`** — Used for PUT/PATCH. All fields are `Optional` so you can update just one column.
- **`ProductResponse`** — Used for GET. Adds `id` and `created_at` to the base fields.

#### JWT Security ([security.py](file:///d:/IV/backend/app/core/security.py))

```mermaid
sequenceDiagram
    participant F as React Frontend
    participant A as /auth/login
    participant DB as DuckDB

    F->>A: POST { email, password }
    A->>DB: SELECT * FROM users WHERE email = ?
    DB-->>A: User row (with hashed password)
    A->>A: verify_password(plain, hash) using PBKDF2-SHA256
    A->>A: create_access_token(user_id, role) → JWT
    A-->>F: { accessToken: "eyJhbGci...", user: {...} }
    
    Note over F: Stores token, sends in Authorization header
    F->>A: GET /products (Authorization: Bearer eyJhbGci...)
```

Passwords are hashed using **PBKDF2-HMAC-SHA256** with random salt (not plain bcrypt, which had compatibility issues with Python 3.12). JWTs are signed with HS256.

---

### Layer 3: Repository Pattern (The Migration Magic)

This is the **most important design decision** in the entire backend. Here's why:

#### The Problem
You want to use DuckDB now (zero setup, single file, fast analytics), but later you might move to PostgreSQL on a production server. Without an abstraction, you'd have to rewrite every single database call in every router.

#### The Solution: Abstract Repository Interface

[base.py](file:///d:/IV/backend/app/repositories/base.py) defines a contract:

```python
class BaseRepository(ABC):
    def get_all(filters, limit, offset) → List[Dict]
    def get_by_id(id) → Dict | None
    def create(data) → Dict
    def update(id, data) → Dict
    def delete(id) → bool
    def count(filters) → int
```

[duckdb_repo.py](file:///d:/IV/backend/app/repositories/duckdb_repo.py) implements this with DuckDB SQL:

```python
class DuckDBRepository(BaseRepository):
    def __init__(self, table_name):
        self.table_name = table_name  # e.g. "products"
    
    def get_all(self, filters):
        sql = f"SELECT * FROM {self.table_name} WHERE ..."
        return db_manager.execute_query(sql, params)
```

The [factory](file:///d:/IV/backend/app/repositories/__init__.py) selects the right implementation based on config:

```python
def get_repository(table_name) → BaseRepository:
    if settings.DATABASE_TYPE == "duckdb":
        return DuckDBRepository(table_name)
    elif settings.DATABASE_TYPE == "postgres":
        return PostgresRepository(table_name)  # Future
```

#### How Migration Works

```mermaid
graph TD
    subgraph "Today (V1)"
        ENV1[".env<br/>DATABASE_TYPE=duckdb<br/>DUCKDB_PATH=data/soilex.duckdb"]
        DUCK["DuckDBRepository"]
        FILE[("soilex.duckdb<br/>(Single File)")]
        ENV1 --> DUCK --> FILE
    end
    
    subgraph "Future (Production)"
        ENV2[".env<br/>DATABASE_TYPE=postgres<br/>DATABASE_URL=postgresql://user:pass@server:5432/soilex"]
        PG["PostgresRepository"]
        SERVER[("PostgreSQL Server<br/>(On-Prem)")]
        ENV2 --> PG --> SERVER
    end
    
    style ENV1 fill:#e8f5e9
    style ENV2 fill:#fff3e0
```

> [!IMPORTANT]
> **Zero code changes required.** You only edit the `.env` file. All 12 routers, all Pydantic models, all the frontend API calls — everything stays exactly the same.

---

## DuckDB Connection Manager

DuckDB is an **in-process** database (no external server). But it has a limitation: only **one writer at a time**. FastAPI handles multiple concurrent requests, so we need thread safety.

[database.py](file:///d:/IV/backend/app/core/database.py) solves this:

```mermaid
graph TD
    subgraph "FastAPI (Multiple Concurrent Requests)"
        REQ1["GET /products<br/>(READ)"]
        REQ2["POST /products<br/>(WRITE)"]
        REQ3["GET /dashboard<br/>(READ)"]
    end

    subgraph "DuckDB Manager (Singleton)"
        LOCK["🔒 Thread Lock<br/>(Serializes ALL queries)"]
        CONN["Single DuckDB Connection<br/>(soilex.duckdb)"]
    end

    REQ1 & REQ2 & REQ3 --> LOCK --> CONN
```

- `execute_query()` — For SELECTs (returns list of dicts)
- `execute_write()` — For INSERT/UPDATE/DELETE (acquires lock)
- `execute_script()` — For multi-statement DDL (schema creation)

---

## Database Schema (13 Tables)

```mermaid
erDiagram
    users ||--o{ attendance_logs : "tracks"
    users ||--o{ leave_requests : "submits"
    users ||--o{ payroll_records : "receives"
    
    employees ||--o{ attendance_logs : "records"
    employees ||--o{ leave_requests : "submits"
    employees ||--o{ payroll_records : "receives"
    
    partners ||--o{ trade_contracts : "signs"
    trade_contracts ||--o{ trade_shipments : "delivers"
    trade_shipments ||--o{ containers : "contains"
    
    products {
        string id PK
        string name
        string category
        float stock_mt
        string price_mt
    }
    
    partners {
        string id PK
        string name
        string type "BUYER/SUPPLIER/BROKER"
        string country
        string kyc_status
    }
    
    employees {
        string id PK
        string employee_code UK
        string full_name
        string department
        string designation
    }
    
    trade_contracts {
        string id PK
        string contract_no UK
        string type "EXPORT/IMPORT"
        float total_usd
    }
    
    containers {
        string id PK
        string container_no
        string status "LOADED/IN_TRANSIT/CLEARED"
    }
```

---

## Request Flow: End-to-End Example

Here's what happens when you click **"Add Product"** in the React UI:

```mermaid
sequenceDiagram
    participant UI as React ProductCatalog
    participant API as api.js Service
    participant Vite as Vite Proxy (:3000)
    participant Fast as FastAPI (:8000)
    participant Router as products.py Router
    participant Repo as DuckDBRepository
    participant DB as soilex.duckdb

    UI->>API: createProduct({ name: "Ceylon Cinnamon", ... })
    API->>Vite: POST /api/v1/products (JSON body)
    Vite->>Fast: Forward to http://127.0.0.1:8000/api/v1/products
    Fast->>Router: Route matched → create_product()
    Router->>Router: Validate with ProductCreate (Pydantic)
    Router->>Router: Generate ID: "PRD-963911"
    Router->>Repo: repo.create({ id, name, category, ... })
    Repo->>DB: INSERT INTO products (...) VALUES (?, ?, ...)
    DB-->>Repo: Success
    Repo->>Repo: SELECT * FROM products WHERE id = ?
    Repo-->>Router: { id: "PRD-963911", name: "Ceylon Cinnamon", ... }
    Router-->>Fast: ApiResponse(data=ProductResponse(...))
    Fast-->>Vite: 201 Created + JSON envelope
    Vite-->>API: Forward response
    API-->>UI: Return product data
    UI->>UI: setProducts([...products, newProduct])
```

---

## File-to-Layer Mapping

| File | Layer | Purpose |
|------|-------|---------|
| [main.py](file:///d:/IV/backend/app/main.py) | Entry Point | Creates FastAPI app, CORS, startup hook |
| [config.py](file:///d:/IV/backend/app/core/config.py) | Configuration | DB paths, JWT secret, CORS origins |
| [security.py](file:///d:/IV/backend/app/core/security.py) | Security | Password hashing, JWT creation/decode |
| [database.py](file:///d:/IV/backend/app/core/database.py) | Infrastructure | Thread-safe DuckDB connection singleton |
| [schema_migration.py](file:///d:/IV/backend/app/db/schema_migration.py) | Database | CREATE TABLE DDL for all 13 tables |
| [seed_data.py](file:///d:/IV/backend/app/db/seed_data.py) | Database | Pre-populates tables with SOILEX data |
| [common.py](file:///d:/IV/backend/app/models/common.py) | Models | Standard `ApiResponse[T]` envelope |
| [product.py](file:///d:/IV/backend/app/models/product.py) | Models | Create/Update/Response schemas |
| [base.py](file:///d:/IV/backend/app/repositories/base.py) | Repository | Abstract interface (6 methods) |
| [duckdb_repo.py](file:///d:/IV/backend/app/repositories/duckdb_repo.py) | Repository | SQL implementation using DuckDB |
| [products.py](file:///d:/IV/backend/app/api/v1/endpoints/products.py) | Router | GET/POST/PUT/DELETE /products |
| [api.py](file:///d:/IV/backend/app/api/v1/api.py) | Router | Mounts all 12 sub-routers |
| [api.js](file:///d:/IV/src/services/api.js) | Frontend | Fetch client with fail-safe fallback |

---

## Key Design Decisions Summary

| Decision | Why |
|----------|-----|
| **DuckDB over SQLite** | Columnar engine = fast analytical aggregations for trade KPIs (\$7M YTD, 20K CBM). SQLite would struggle with these. |
| **Repository Pattern** | Decouples SQL from routes. One `.env` change swaps DuckDB → PostgreSQL. |
| **Thread Lock on writes** | DuckDB only allows 1 writer. The lock prevents file corruption under concurrent FastAPI requests. |
| **PBKDF2 over bcrypt** | bcrypt 5.0 has compatibility issues with `passlib` on Python 3.12. PBKDF2-SHA256 with random salt is equally secure and stdlib-compatible. |
| **Pydantic v2** | 17× faster validation than v1. `Union[datetime, str]` handles DuckDB returning native datetime objects. |
| **Vite proxy** | Avoids CORS issues in dev. Frontend calls `/api/v1/...` → Vite forwards to `:8000`. |
| **Fail-safe API client** | If backend is offline, React components fall back to local mock data. The UI never breaks. |
