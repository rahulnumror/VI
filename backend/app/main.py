import logging
from contextlib import asynccontextmanager
from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
from .core.config import settings
from .core.database import db_manager
from .db.schema_migration import init_db_schema
from .db.seed_data import seed_database
from .api.v1.api import api_router

# Configure logging
logging.basicConfig(
    level=logging.INFO,
    format="%(asctime)s [%(levelname)s] %(name)s: %(message)s"
)
logger = logging.getLogger("soilex.app")

@asynccontextmanager
async def lifespan(app: FastAPI):
    # Startup: Initialize schema and seed DuckDB
    logger.info("Starting SOILEX Life Science ERP API...")
    init_db_schema()
    seed_database()
    logger.info("SOILEX Backend ready on port 8000 with DuckDB data engine!")
    yield
    # Shutdown: Close database
    logger.info("Shutting down SOILEX Life Science ERP API...")
    db_manager.close()

app = FastAPI(
    title=settings.PROJECT_NAME,
    version=settings.VERSION,
    description="Enterprise Backend for SOILEX Life Science (Whole Spices, Agro Commodities & Animal Feed). Uses embedded DuckDB with seamless on-prem migration abstraction.",
    openapi_url=f"{settings.API_V1_STR}/openapi.json",
    docs_url="/docs",
    redoc_url="/redoc",
    lifespan=lifespan
)

# Set up CORS middleware
app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"], # Allow local frontend development
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# Mount API routers
app.include_router(api_router, prefix=settings.API_V1_STR)

@app.get(f"{settings.API_V1_STR}/health", tags=["Health"])
def health_check():
    return {
        "status": "online",
        "service": "SOILEX Life Science ERP Backend",
        "version": settings.VERSION,
        "databaseEngine": settings.DATABASE_TYPE,
        "activeBranch": "BR-HN (Hanoi HQ)"
    }

@app.get("/", include_in_schema=False)
def root():
    return {
        "message": "Welcome to SOILEX Life Science ERP API. Navigate to /docs for interactive Swagger UI.",
        "docsUrl": "/docs",
        "health": f"{settings.API_V1_STR}/health"
    }
