import os
from pathlib import Path
from pydantic_settings import BaseSettings, SettingsConfigDict

BASE_DIR = Path(__file__).resolve().parent.parent.parent
DATA_DIR = BASE_DIR / "data"
DATA_DIR.mkdir(parents=True, exist_ok=True)

class Settings(BaseSettings):
    model_config = SettingsConfigDict(case_sensitive=True, env_file=".env", extra="ignore")
    PROJECT_NAME: str = "SOILEX Life Science ERP API"
    VERSION: str = "1.0.0"
    API_V1_STR: str = "/api/v1"
    
    # Database Configuration: "duckdb" or "postgres" / "mysql"
    DATABASE_TYPE: str = os.getenv("DATABASE_TYPE", "duckdb")
    DUCKDB_PATH: str = str(DATA_DIR / "soilex.duckdb")
    DATABASE_URL: str = os.getenv("DATABASE_URL", f"duckdb:///{DATA_DIR / 'soilex.duckdb'}")
    
    # Security
    SECRET_KEY: str = os.getenv("SECRET_KEY", "soilex-enterprise-secure-jwt-key-2026-agro-commodities")
    ALGORITHM: str = "HS256"
    ACCESS_TOKEN_EXPIRE_MINUTES: int = 60 * 24 # 24 hours
    
    # CORS
    BACKEND_CORS_ORIGINS: list[str] = [
        "http://localhost:3000",
        "http://127.0.0.1:3000",
        "http://localhost:5173",
        "http://127.0.0.1:5173",
        "http://localhost:8000",
        "*"
    ]



settings = Settings()
