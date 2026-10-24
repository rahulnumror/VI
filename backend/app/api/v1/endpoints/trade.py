import time
from fastapi import APIRouter, HTTPException, Query
from typing import List, Optional
from ....repositories import get_repository
from ....models.common import ApiResponse
from ....models.trade import (
    ContractCreate, ContractResponse,
    ShipmentCreate, ShipmentResponse,
    ContainerCreate, ContainerResponse
)

router = APIRouter(prefix="/trade", tags=["Trade & Logistics"])
contract_repo = get_repository("trade_contracts")
shipment_repo = get_repository("trade_shipments")
container_repo = get_repository("containers")

# 1. Contracts
@router.get("/contracts", response_model=ApiResponse[List[ContractResponse]])
def get_contracts(type: Optional[str] = Query(None, description="EXPORT or IMPORT")):
    filters = {"type": type} if type else None
    contracts = contract_repo.get_all(filters=filters, limit=100)
    return ApiResponse(data=[ContractResponse(**c) for c in contracts])

@router.post("/contracts", response_model=ApiResponse[ContractResponse], status_code=201)
def create_contract(contract_in: ContractCreate):
    new_id = f"CT-2026-{int(time.time() * 1000) % 10000}"
    data = contract_in.model_dump()
    data["id"] = new_id
    created = contract_repo.create(data)
    return ApiResponse(message="Trade contract created", data=ContractResponse(**created))

# 2. Shipments
@router.get("/shipments", response_model=ApiResponse[List[ShipmentResponse]])
def get_shipments():
    shipments = shipment_repo.get_all(limit=100)
    return ApiResponse(data=[ShipmentResponse(**s) for s in shipments])

@router.post("/shipments", response_model=ApiResponse[ShipmentResponse], status_code=201)
def create_shipment(shipment_in: ShipmentCreate):
    new_id = f"SH-{int(time.time() * 1000) % 10000}"
    data = shipment_in.model_dump()
    data["id"] = new_id
    created = shipment_repo.create(data)
    return ApiResponse(message="Shipment manifest created", data=ShipmentResponse(**created))

# 3. Containers
@router.get("/containers", response_model=ApiResponse[List[ContainerResponse]])
def get_containers():
    containers = container_repo.get_all(limit=100)
    return ApiResponse(data=[ContainerResponse(**c) for c in containers])

@router.post("/containers", response_model=ApiResponse[ContainerResponse], status_code=201)
def create_container(container_in: ContainerCreate):
    new_id = f"CN-{int(time.time() * 1000) % 10000}"
    data = container_in.model_dump()
    data["id"] = new_id
    created = container_repo.create(data)
    return ApiResponse(message="Cargo container registered", data=ContainerResponse(**created))

@router.patch("/containers/{id}/status", response_model=ApiResponse[ContainerResponse])
def update_container_status(id: str, new_status: str):
    existing = container_repo.get_by_id(id)
    if not existing:
        raise HTTPException(status_code=404, detail=f"Container {id} not found")
    
    updated = container_repo.update(id, {"status": new_status})
    return ApiResponse(message=f"Container status updated to {new_status}", data=ContainerResponse(**updated))
