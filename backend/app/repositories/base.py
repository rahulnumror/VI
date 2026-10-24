from abc import ABC, abstractmethod
from typing import Generic, TypeVar, List, Optional, Dict, Any

T = TypeVar("T")

class BaseRepository(ABC, Generic[T]):
    """
    Abstract Base Repository defining the standard Data Access Object (DAO) interface.
    Decouples database-specific implementations (DuckDB, PostgreSQL, MySQL) from FastAPI services.
    """

    @abstractmethod
    def get_all(self, filters: Optional[Dict[str, Any]] = None, limit: int = 100, offset: int = 0) -> List[Dict[str, Any]]:
        pass

    @abstractmethod
    def get_by_id(self, id: str) -> Optional[Dict[str, Any]]:
        pass

    @abstractmethod
    def create(self, entity_data: Dict[str, Any]) -> Dict[str, Any]:
        pass

    @abstractmethod
    def update(self, id: str, entity_data: Dict[str, Any]) -> Optional[Dict[str, Any]]:
        pass

    @abstractmethod
    def delete(self, id: str) -> bool:
        pass

    @abstractmethod
    def count(self, filters: Optional[Dict[str, Any]] = None) -> int:
        pass
