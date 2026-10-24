from ..core.config import settings
from .base import BaseRepository
from .duckdb_repo import DuckDBRepository

def get_repository(table_name: str) -> BaseRepository:
    """
    Factory method to instantiate the appropriate repository provider.
    Defaults to DuckDB, and switches to PostgreSQL / MySQL when configured in settings.
    """
    if settings.DATABASE_TYPE.lower() == "duckdb":
        return DuckDBRepository(table_name)
    elif settings.DATABASE_TYPE.lower() in ("postgres", "postgresql"):
        # For future on-prem migration:
        # from .postgres_repo import PostgresRepository
        # return PostgresRepository(table_name)
        raise NotImplementedError("PostgreSQL repository provider will be loaded when DB_TYPE=postgres")
    else:
        return DuckDBRepository(table_name)
