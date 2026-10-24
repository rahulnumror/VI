import time
from fastapi import APIRouter, HTTPException, Query
from typing import List, Optional
from ....repositories import get_repository
from ....models.common import ApiResponse
from ....models.calendar import CalendarEventCreate, CalendarEventResponse

router = APIRouter(prefix="/calendar", tags=["Operational Calendar & Scheduler"])
repo = get_repository("calendar_events")

@router.get("/events", response_model=ApiResponse[List[CalendarEventResponse]])
def get_events(event_type: Optional[str] = Query(None)):
    filters = {"event_type": event_type} if event_type and event_type != "HOLIDAY" else None
    events = repo.get_all(filters=filters, limit=200)
    seen_ids = set(e.get("id") for e in events if e.get("id"))
    seen_titles_dates = set((e.get("title"), (e.get("start_time") or "")[:10]) for e in events)

    result = [CalendarEventResponse(**e) for e in events]

    if not event_type or event_type == "HOLIDAY":
        try:
            hol_repo = get_repository("holidays")
            holidays = hol_repo.get_all(limit=100)
            for h in holidays:
                h_id = f"HOL-{h.get('id')}" if not str(h.get('id', '')).startswith("HOL-") else str(h.get('id'))
                evt_h_id = f"EVT-{h_id}"
                h_title = f"🎉 Holiday: {h.get('name')}"
                h_date = h.get("date", "")
                
                # Deduplicate against existing calendar events
                if h_id in seen_ids or evt_h_id in seen_ids or (h_title, h_date) in seen_titles_dates:
                    continue
                
                hol_event = {
                    "id": h_id,
                    "title": h_title,
                    "description": f"Official {h.get('type', 'NATIONAL')} Corporate Holiday for {h.get('branch', 'ALL')} facilities.",
                    "event_type": "HOLIDAY",
                    "start_time": f"{h_date}T00:00:00",
                    "end_time": f"{h_date}T23:59:59",
                    "location": h.get("branch", "ALL"),
                    "participants": "All Employees",
                    "created_by": "Company HR",
                    "created_at": None,
                }
                result.append(CalendarEventResponse(**hol_event))
                seen_ids.add(h_id)
                seen_titles_dates.add((h_title, h_date))
        except Exception:
            pass

    return ApiResponse(data=result)

@router.post("/events", response_model=ApiResponse[CalendarEventResponse], status_code=201)
def create_event(event_in: CalendarEventCreate):
    new_id = f"EVT-{int(time.time() * 1000) % 10000}"
    data = event_in.model_dump()
    data["id"] = new_id
    created = repo.create(data)
    return ApiResponse(message="Calendar event scheduled", data=CalendarEventResponse(**created))

@router.delete("/events/{id}", response_model=ApiResponse[dict])
def delete_event(id: str):
    existing = repo.get_by_id(id)
    if not existing:
        raise HTTPException(status_code=404, detail=f"Event {id} not found")
    repo.delete(id)
    return ApiResponse(message=f"Event {id} removed", data={"id": id})
