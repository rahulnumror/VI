from typing import Optional, List, Union
from datetime import datetime
from pydantic import BaseModel, Field

class ContractBase(BaseModel):
    contract_no: str
    type: str # EXPORT, IMPORT
    partner_id: Optional[str] = None
    partner_name: str
    commodity: str
    volume_cbm: float = 0.0
    volume_mt: float = 0.0
    total_usd: float = 0.0
    status: str = "ORDER_IN_PROCESS"

class ContractCreate(ContractBase):
    pass

class ContractResponse(ContractBase):
    id: str
    created_at: Optional[Union[datetime, str]] = None

class ShipmentBase(BaseModel):
    shipment_no: str
    bl_no: str
    contract_id: Optional[str] = None
    carrier: str
    port_of_loading: str
    port_of_discharge: str
    etd: Optional[str] = None
    eta: Optional[str] = None
    container_count: int = 1
    customs_status: str = "PENDING_CUSTOMS"

class ShipmentCreate(ShipmentBase):
    pass

class ShipmentResponse(ShipmentBase):
    id: str
    created_at: Optional[Union[datetime, str]] = None

class ContainerBase(BaseModel):
    container_no: str
    seal_no: Optional[str] = None
    shipment_id: Optional[str] = None
    commodity: str
    gross_weight_kg: float = 0.0
    net_weight_kg: float = 0.0
    temperature_c: Optional[float] = None
    status: str = "LOADED"

class ContainerCreate(ContainerBase):
    pass

class ContainerResponse(ContainerBase):
    id: str
    last_updated: Optional[Union[datetime, str]] = None
