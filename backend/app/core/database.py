import threading
import duckdb
from typing import Any, List, Dict, Optional
from .config import settings

class DuckDBManager:
    """
    Thread-safe Singleton Connection Manager for DuckDB.
    Maintains a single open write connection and serializes mutation queries with a Lock,
    preventing file concurrency issues in FastAPI while allowing concurrent reads.
    """
    _instance = None
    _lock = threading.Lock()
    _conn = None

    def __new__(cls):
        if cls._instance is None:
            with cls._lock:
                if cls._instance is None:
                    cls._instance = super(DuckDBManager, cls).__new__(cls)
                    cls._instance._init_connection()
        return cls._instance

    def _init_connection(self):
        # Open persistent connection to duckdb file
        self._conn = duckdb.connect(database=settings.DUCKDB_PATH, read_only=False)
        # Enable parallel execution within DuckDB
        self._conn.execute("PRAGMA threads=4;")

    def get_connection(self):
        if self._conn is None:
            self._init_connection()
        return self._conn

    def execute_query(self, query: str, params: Optional[List[Any]] = None) -> List[Dict[str, Any]]:
        """
        Executes a read query (SELECT) and returns results as a list of dictionaries.
        """
        with self._lock:
            cursor = self._conn.cursor()
            try:
                if params:
                    cursor.execute(query, params)
                else:
                    cursor.execute(query)
                
                columns = [desc[0] for desc in cursor.description] if cursor.description else []
                rows = cursor.fetchall()
                return [dict(zip(columns, row)) for row in rows]
            finally:
                cursor.close()

    def execute_one(self, query: str, params: Optional[List[Any]] = None) -> Optional[Dict[str, Any]]:
        """
        Executes a read query and returns a single dictionary result or None.
        """
        results = self.execute_query(query, params)
        return results[0] if results else None

    def execute_write(self, query: str, params: Optional[List[Any]] = None) -> int:
        """
        Executes a write query (INSERT, UPDATE, DELETE, CREATE) within the thread lock.
        """
        with self._lock:
            cursor = self._conn.cursor()
            try:
                if params:
                    cursor.execute(query, params)
                else:
                    cursor.execute(query)
                return cursor.rowcount if hasattr(cursor, 'rowcount') else 1
            finally:
                cursor.close()

    def execute_script(self, script: str):
        """
        Executes multiple SQL statements sequentially in a single transaction.
        """
        with self._lock:
            self._conn.execute(script)

    def close(self):
        with self._lock:
            if self._conn:
                self._conn.close()
                self._conn = None

db_manager = DuckDBManager()

def get_db():
    """Dependency injection helper for FastAPI routes"""
    return db_manager
