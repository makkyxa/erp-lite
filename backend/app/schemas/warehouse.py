from datetime import datetime
from typing import Optional
import uuid
from pydantic import BaseModel, Field

class WarehouseItemBase(BaseModel):
    name: str = Field(..., min_length=1, max_length=255)
    sku: str = Field(..., min_length=1, max_length=100)
    quantity: int = Field(default=0, ge=0)
    price: float = Field(default=0.00, ge=0.0)
    min_stock: int = Field(default=0, ge=0)
    supplier: Optional[str] = Field(None, max_length=255)

class WarehouseItemCreate(WarehouseItemBase):
    pass

class WarehouseItemUpdate(BaseModel):
    name: Optional[str] = Field(None, min_length=1, max_length=255)
    sku: Optional[str] = Field(None, min_length=1, max_length=100)
    quantity: Optional[int] = Field(None, ge=0)
    price: Optional[float] = Field(None, ge=0.0)
    min_stock: Optional[int] = Field(None, ge=0)
    supplier: Optional[str] = Field(None, max_length=255)

class WarehouseItemResponse(WarehouseItemBase):
    id: uuid.UUID
    created_by: Optional[uuid.UUID] = None
    created_at: datetime
    updated_at: datetime

    class Config:
        from_attributes = True
