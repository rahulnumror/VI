from typing import Optional, Union
from datetime import datetime
from pydantic import BaseModel, Field

class PartnerBase(BaseModel):
    name: str
    type: str # BUYER, SUPPLIER, BROKER
    country: str
    tier: str = "TIER_1"
    kyc_status: str = "VERIFIED"
    payment_terms: str
    credit_limit: Optional[str] = None
    email: Optional[str] = None
    phone: Optional[str] = None

class PartnerCreate(PartnerBase):
    pass

class PartnerResponse(PartnerBase):
    id: str
    created_at: Optional[Union[datetime, str]] = None
