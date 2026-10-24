# SOILEX Life Science — Enterprise ERP System

> Full-stack ERP platform for international spice & agro commodity export operations.

![React](https://img.shields.io/badge/Frontend-React_19-61DAFB?logo=react)
![FastAPI](https://img.shields.io/badge/Backend-FastAPI-009688?logo=fastapi)
![DuckDB](https://img.shields.io/badge/Database-DuckDB-FFC107)
![Tailwind](https://img.shields.io/badge/Styling-Tailwind_CSS-38B2AC?logo=tailwindcss)

---

## Overview

SOILEX Life Science ERP is a fully integrated enterprise system covering **12 operational modules** — from product catalog management and trade logistics to HR, payroll, and business intelligence. Built with a **React + Tailwind CSS** frontend and a **FastAPI + DuckDB** backend, designed for easy migration to PostgreSQL when moving to production.

### Brand
- **Company**: SOILEX Life Science (BR-HN)
- **Tagline**: The Essence of Authentic Spices
- **Colors**: White, Royal Blue (`#1E40AF`), Dark Yellow (`#D97706`)
- **Website**: [soilexlifescience.com](https://soilexlifescience.com)

---

## Features (12 Modules)

| Module | Description |
|--------|-------------|
| 📊 **Executive Dashboard** | Live KPIs — sales orders, contract value, container logistics |
| 🌶️ **Product Catalog** | Spices, Grains, Animal Feed SKU management (CRUD) |
| 🚢 **Trade Operations** | Export/Import contracts, shipment manifests, container tracking |
| 🤝 **Partners Directory** | Global buyers, certified suppliers, trade brokers |
| 👤 **Employee Directory** | Workforce management with department & branch filters |
| 📋 **HR Dashboard** | Staff roster, attendance gauge, pending leave approvals |
| ⏰ **Attendance** | Biometric clock-in simulator, leave requests |
| 💰 **Payroll** | Monthly salary processing with tax deductions |
| 📅 **Real-Time Calendar** | Operational scheduling with live ticking clock |
| ✅ **Task Planner** | TODO board with priority queues (persists to DB) |
| 📈 **Reports & Analytics** | Export revenue analytics, audit trail logs |
| 🏭 **Admin & Bio-Hubs** | Facility management, system diagnostics |

### Authentication
- JWT-based login with PBKDF2-SHA256 password hashing
- Role-based access: Admin, Trade Officer, QA Manager, HR Manager
- Logout button in Navbar with user role badge

---

## Tech Stack

| Layer | Technology |
|-------|-----------|
| **Frontend** | React 19, Vite 5, Tailwind CSS, Lucide Icons |
| **Backend** | FastAPI, Pydantic v2, Uvicorn |
| **Database** | DuckDB (embedded, single-file — migrateable to PostgreSQL) |
| **Auth** | JWT (python-jose), PBKDF2-HMAC-SHA256 |
| **Architecture** | Repository Pattern (abstract interface → swappable DB engine) |

---

## Project Structure

```
IV/
├── src/                          # React frontend
│   ├── App.jsx                   # AuthProvider + login gate
│   ├── context/AuthContext.jsx   # JWT auth context
│   ├── services/api.js           # API client (all 12 modules)
│   └── components/
│       ├── auth/LoginPage.jsx
│       ├── dashboard/MainDashboard.jsx
│       ├── products/ProductCatalog.jsx
│       ├── trade/TradeView.jsx
│       ├── partners/PartnersView.jsx
│       ├── employees/EmployeeList.jsx
│       ├── hr/HrDashboard.jsx
│       ├── attendance/AttendanceView.jsx
│       ├── payroll/PayrollView.jsx
│       ├── calendar/RealtimeCalendar.jsx
│       ├── workspace/TodoPlanner.jsx
│       ├── analytics/ReportsView.jsx
│       ├── admin/MastersAdminView.jsx
│       └── layout/ (AppShell, Navbar, Sidebar)
│
├── backend/                      # FastAPI backend
│   ├── run.py                    # Uvicorn launcher
│   ├── requirements.txt
│   ├── app/
│   │   ├── main.py               # FastAPI app + CORS + lifespan
│   │   ├── core/                  # Config, Security, Database
│   │   ├── db/                    # Schema migration + seed data
│   │   ├── models/                # Pydantic v2 schemas (9 files)
│   │   ├── repositories/          # Abstract + DuckDB implementation
│   │   └── api/v1/endpoints/      # 12 API routers (28 endpoints)
│   └── data/
│       └── soilex.duckdb          # Auto-created on startup
│
├── reference_mockups/             # Original design screenshots
├── BACKEND_API_SPECIFICATION.md   # REST API documentation
├── DESIGN.md                      # UI/UX design notes
├── backend_architecture.md        # Architecture explainer
├── integration_roadmap.md         # Module integration plan
└── walkthrough.md                 # Implementation walkthrough
```

---

## Quick Start

### Prerequisites
- **Node.js** 18+ (with npm)
- **Python** 3.12+

### 1. Install Frontend Dependencies
```bash
cd IV
npm install
```

### 2. Install Backend Dependencies
```bash
cd backend
python -m venv venv
# Windows:
venv\Scripts\activate
# macOS/Linux:
source venv/bin/activate

pip install -r requirements.txt
```

### 3. Start Both Servers
```bash
# Terminal 1: Backend (auto-creates & seeds database)
cd backend
python run.py
# → http://127.0.0.1:8000
# → Swagger docs: http://127.0.0.1:8000/docs

# Terminal 2: Frontend
cd IV
npm run dev
# → http://localhost:3000
```

### 4. Login
| Email | Password | Role |
|-------|----------|------|
| `admin@soilexlifescience.com` | `admin123` | Admin |
| `hoan.vu@soilexlifescience.com` | `trade123` | Trade Officer |
| `rajesh.s@soilexlifescience.com` | `qa123` | QA Manager |
| `priya.n@soilexlifescience.com` | `hr123` | HR Manager |

---

## API Endpoints (28 paths)

All endpoints are prefixed with `/api/v1`. Interactive docs at `/docs`.

| Router | Prefix | Methods |
|--------|--------|---------|
| Auth | `/auth` | POST `/login`, GET `/me` |
| Dashboard | `/dashboard` | GET `/executive-summary` |
| Products | `/products` | GET, POST, PUT `/{id}`, DELETE `/{id}` |
| Trade | `/trade` | Contracts, Shipments, Containers |
| Partners | `/partners` | GET, POST, DELETE `/{id}` |
| Employees | `/employees` | GET, POST, DELETE `/{id}` |
| Attendance | `/attendance` | GET `/logs`, POST `/clock-in`, GET/POST `/leaves` |
| Payroll | `/payroll` | GET `/records`, POST `/generate` |
| Calendar | `/calendar` | GET/POST/DELETE `/events` |
| Tasks | `/tasks` | GET, POST, PATCH `/{id}/toggle`, DELETE `/{id}` |
| Reports | `/reports` | GET `/export-revenue`, GET `/audit-logs` |
| Admin | `/admin` | GET `/facilities`, GET `/system-info` |
| Health | `/health` | GET |

---

## Database Migration

The backend uses a **Repository Pattern** abstraction. To switch from DuckDB to PostgreSQL:

1. Create `app/repositories/postgres_repo.py` implementing `BaseRepository`
2. Update `.env`:
   ```
   DATABASE_TYPE=postgres
   DATABASE_URL=postgresql://user:pass@host:5432/soilex
   ```
3. No router or frontend code changes needed.

---

## Documentation

| Document | Description |
|----------|-------------|
| [BACKEND_API_SPECIFICATION.md](BACKEND_API_SPECIFICATION.md) | Full REST API spec for all 20 modules |
| [backend_architecture.md](backend_architecture.md) | Architecture diagrams & design decisions |
| [integration_roadmap.md](integration_roadmap.md) | Module integration plan & status |
| [walkthrough.md](walkthrough.md) | Implementation walkthrough & test results |
| [DESIGN.md](DESIGN.md) | UI/UX design & customization guide |

---

## License

Private — SOILEX Life Science © 2026
