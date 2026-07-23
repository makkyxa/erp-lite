from datetime import datetime
from typing import Optional
import uuid
from pydantic import BaseModel, Field

class ServiceBase(BaseModel):
    name: str = Field(..., min_length=1, max_length=255)
    price: float = Field(..., ge=0.0)
    description: Optional[str] = None

class ServiceCreate(ServiceBase):
    pass

class ServiceUpdate(BaseModel):
    name: Optional[str] = Field(None, min_length=1, max_length=255)
    price: Optional[float] = Field(None, ge=0.0)
    description: Optional[str] = None

class ServiceResponse(ServiceBase):
    id: uuid.UUID
    created_at: datetime
    updated_at: datetime

    class Config:
        from_attributes = True
