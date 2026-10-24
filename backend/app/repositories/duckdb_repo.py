from typing import List, Optional, Dict, Any
from .base import BaseRepository
from ..core.database import db_manager

class DuckDBRepository(BaseRepository):
    """
    DuckDB concrete implementation of BaseRepository.
    Translates standard CRUD operations into parameterized SQL statements.
    """

    def __init__(self, table_name: str, id_field: str = "id"):
        self.table_name = table_name
        self.id_field = id_field

    def get_all(self, filters: Optional[Dict[str, Any]] = None, limit: int = 100, offset: int = 0) -> List[Dict[str, Any]]:
        sql = f"SELECT * FROM {self.table_name}"
        params = []
        if filters:
            conditions = []
            for col, val in filters.items():
                if val is not None:
                    conditions.append(f"{col} = ?")
                    params.append(val)
            if conditions:
                sql += " WHERE " + " AND ".join(conditions)
        
        sql += f" LIMIT {limit} OFFSET {offset}"
        return db_manager.execute_query(sql, params if params else None)

    def get_by_id(self, id: str) -> Optional[Dict[str, Any]]:
        sql = f"SELECT * FROM {self.table_name} WHERE {self.id_field} = ?"
        return db_manager.execute_one(sql, [id])

    def create(self, entity_data: Dict[str, Any]) -> Dict[str, Any]:
        columns = list(entity_data.keys())
        placeholders = ["?"] * len(columns)
        values = [entity_data[col] for col in columns]

        sql = f"INSERT INTO {self.table_name} ({', '.join(columns)}) VALUES ({', '.join(placeholders)})"
        db_manager.execute_write(sql, values)
        return self.get_by_id(entity_data.get(self.id_field)) or entity_data

    def update(self, id: str, entity_data: Dict[str, Any]) -> Optional[Dict[str, Any]]:
        # Filter out id field if present in update data
        data_to_update = {k: v for k, v in entity_data.items() if k != self.id_field and v is not None}
        if not data_to_update:
            return self.get_by_id(id)

        set_clause = ", ".join([f"{k} = ?" for k in data_to_update.keys()])
        values = list(data_to_update.values()) + [id]

        sql = f"UPDATE {self.table_name} SET {set_clause} WHERE {self.id_field} = ?"
        db_manager.execute_write(sql, values)
        return self.get_by_id(id)

    def delete(self, id: str) -> bool:
        sql = f"DELETE FROM {self.table_name} WHERE {self.id_field} = ?"
        rowcount = db_manager.execute_write(sql, [id])
        return rowcount > 0

    def count(self, filters: Optional[Dict[str, Any]] = None) -> int:
        sql = f"SELECT COUNT(*) as cnt FROM {self.table_name}"
        params = []
        if filters:
            conditions = []
            for col, val in filters.items():
                if val is not None:
                    conditions.append(f"{col} = ?")
                    params.append(val)
            if conditions:
                sql += " WHERE " + " AND ".join(conditions)
        res = db_manager.execute_one(sql, params if params else None)
        return res['cnt'] if res else 0
