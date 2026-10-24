from typing import Optional, Union
from datetime import datetime
from pydantic import BaseModel, Field

class WorkspaceTaskBase(BaseModel):
    title: str
    category: str = "General"
    priority: str = "MEDIUM" # LOW, MEDIUM, HIGH, URGENT
    due_date: Optional[str] = None
    assigned_to: Optional[str] = None
    completed: bool = False
    notes: Optional[str] = None

class WorkspaceTaskCreate(WorkspaceTaskBase):
    pass

class WorkspaceTaskUpdate(BaseModel):
    title: Optional[str] = None
    category: Optional[str] = None
    priority: Optional[str] = None
    due_date: Optional[str] = None
    assigned_to: Optional[str] = None
    completed: Optional[bool] = None
    notes: Optional[str] = None

class WorkspaceTaskResponse(WorkspaceTaskBase):
    id: str
    created_at: Optional[Union[datetime, str]] = None
