from typing import Generic, TypeVar, Optional, Any, List
from datetime import datetime, timezone
from pydantic import BaseModel, Field

T = TypeVar("T")

class ApiResponse(BaseModel, Generic[T]):
    success: bool = True
    statusCode: int = 200
    message: str = "Operation completed successfully"
    data: Optional[T] = None
    timestamp: str = Field(default_factory=lambda: datetime.now(timezone.utc).isoformat())

class ErrorDetail(BaseModel):
    field: Optional[str] = None
    issue: str

class ApiErrorResponse(BaseModel):
    success: bool = False
    statusCode: int = 400
    errorCode: str = "BAD_REQUEST"
    message: str
    errors: Optional[List[ErrorDetail]] = None
    timestamp: str = Field(default_factory=lambda: datetime.now(timezone.utc).isoformat())

class PaginationMeta(BaseModel):
    page: int = 1
    limit: int = 20
    totalItems: int = 0
    totalPages: int = 0
