from typing import Optional, Union
from datetime import datetime
from pydantic import BaseModel, Field

class CalendarEventBase(BaseModel):
    title: str
    description: Optional[str] = None
    event_type: str = "MEETING" # MEETING, INSPECTION, SHIPMENT, TRAINING
    start_time: str
    end_time: str
    location: Optional[str] = None
    participants: Optional[str] = None

class CalendarEventCreate(CalendarEventBase):
    pass

class CalendarEventResponse(CalendarEventBase):
    id: str
    created_by: Optional[str] = "admin"
    created_at: Optional[Union[datetime, str]] = None
