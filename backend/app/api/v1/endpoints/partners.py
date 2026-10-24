import time
from fastapi import APIRouter, HTTPException, Query
from typing import List, Optional
from ....repositories import get_repository
from ....models.common import ApiResponse
from ....models.partner import PartnerCreate, PartnerResponse

router = APIRouter(prefix="/partners", tags=["Partners & Directories"])
repo = get_repository("partners")

@router.get("", response_model=ApiResponse[List[PartnerResponse]])
def get_partners(
    type: Optional[str] = Query(None, description="Partner type: BUYER, SUPPLIER, BROKER"),
    country: Optional[str] = Query(None)
):
    filters = {}
    if type and type != "ALL":
        filters["type"] = type
    if country:
        filters["country"] = country

    partners = repo.get_all(filters=filters, limit=100)
    return ApiResponse(data=[PartnerResponse(**p) for p in partners])

@router.get("/{id}", response_model=ApiResponse[PartnerResponse])
def get_partner_by_id(id: str):
    partner = repo.get_by_id(id)
    if not partner:
        raise HTTPException(status_code=404, detail=f"Partner {id} not found")
    return ApiResponse(data=PartnerResponse(**partner))

@router.post("", response_model=ApiResponse[PartnerResponse], status_code=201)
def create_partner(partner_in: PartnerCreate):
    prefix = "BP" if partner_in.type == "BUYER" else "SP"
    new_id = f"{prefix}-{int(time.time() * 1000) % 10000}"
    data = partner_in.model_dump()
    data["id"] = new_id
    created = repo.create(data)
    return ApiResponse(message="Partner registered successfully", data=PartnerResponse(**created))

@router.put("/{id}", response_model=ApiResponse[PartnerResponse])
def update_partner(id: str, partner_in: PartnerCreate):
    existing = repo.get_by_id(id)
    if not existing:
        raise HTTPException(status_code=404, detail=f"Partner {id} not found")
    updated = repo.update(id, partner_in.model_dump())
    return ApiResponse(message="Partner updated successfully", data=PartnerResponse(**updated))

@router.delete("/{id}", response_model=ApiResponse[dict])
def delete_partner(id: str):
    existing = repo.get_by_id(id)
    if not existing:
        raise HTTPException(status_code=404, detail=f"Partner {id} not found")
    repo.delete(id)
    return ApiResponse(message=f"Partner {id} removed", data={"id": id})

