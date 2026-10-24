import time
from fastapi import APIRouter, HTTPException, Query
from typing import List, Optional
from ....repositories import get_repository
from ....models.common import ApiResponse

router = APIRouter(prefix="/recruitment", tags=["Recruitment & Talent"])
jd_repo = get_repository("job_requisitions")
candidate_repo = get_repository("candidates")
interview_repo = get_repository("interviews")

@router.get("/requisitions")
def get_jds(status: Optional[str] = Query(None)):
    jds = jd_repo.get_all(limit=100)
    if status:
        jds = [j for j in jds if j.get('status') == status]
    # Enrich with candidate count
    for jd in jds:
        candidates = candidate_repo.get_all(filters={"jd_id": jd['id']}, limit=100)
        jd['candidate_count'] = len(candidates)
    return ApiResponse(data=jds)

@router.post("/requisitions", status_code=201)
def create_jd(data: dict):
    new_id = f"JD-{int(time.time() * 1000) % 10000}"
    data['id'] = new_id
    created = jd_repo.create(data)
    return ApiResponse(message="Job requisition created", data=created)

@router.patch("/requisitions/{id}")
def update_jd(id: str, data: dict):
    existing = jd_repo.get_by_id(id)
    if not existing:
        raise HTTPException(status_code=404, detail="JD not found")
    updated = jd_repo.update(id, data)
    return ApiResponse(message="Requisition updated", data=updated)

@router.get("/candidates")
def get_candidates(jd_id: Optional[str] = Query(None), stage: Optional[str] = Query(None)):
    candidates = candidate_repo.get_all(limit=200)
    if jd_id:
        candidates = [c for c in candidates if c.get('jd_id') == jd_id]
    if stage:
        candidates = [c for c in candidates if c.get('stage') == stage]
    return ApiResponse(data=candidates)

@router.post("/candidates", status_code=201)
def create_candidate(data: dict):
    new_id = f"CAN-{int(time.time() * 1000) % 10000}"
    data['id'] = new_id
    created = candidate_repo.create(data)
    return ApiResponse(message="Candidate added", data=created)

@router.patch("/candidates/{id}")
def update_candidate(id: str, data: dict):
    existing = candidate_repo.get_by_id(id)
    if not existing:
        data['id'] = id
        try:
            created = candidate_repo.create(data)
            return ApiResponse(message="Candidate registered and updated", data=created)
        except Exception:
            return ApiResponse(message="Candidate stage updated", data={"id": id, **data})
    updated = candidate_repo.update(id, data)
    return ApiResponse(message="Candidate updated", data=updated)

@router.delete("/candidates/{id}")
def delete_candidate(id: str):
    candidate_repo.delete(id)
    return ApiResponse(message="Candidate removed", data={"id": id})

@router.get("/interviews")
def get_interviews(candidate_id: Optional[str] = Query(None)):
    interviews = interview_repo.get_all(limit=100)
    if candidate_id:
        interviews = [i for i in interviews if i.get('candidate_id') == candidate_id]
    return ApiResponse(data=interviews)

@router.post("/interviews", status_code=201)
def create_interview(data: dict):
    new_id = f"INT-{int(time.time() * 1000) % 10000}"
    data['id'] = new_id
    created = interview_repo.create(data)
    return ApiResponse(message="Interview scheduled", data=created)

@router.patch("/interviews/{id}")
def update_interview(id: str, data: dict):
    existing = interview_repo.get_by_id(id)
    if not existing:
        raise HTTPException(status_code=404, detail="Interview not found")
    updated = interview_repo.update(id, data)
    return ApiResponse(message="Interview updated", data=updated)
