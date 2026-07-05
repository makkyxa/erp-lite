from typing import Optional
import uuid
from pydantic import BaseModel, Field, field_validator
from app.utils.validators import validate_vin


class CarBase(BaseModel):
    customer_id: uuid.UUID
    brand: str = Field(..., min_length=1, max_length=100)
    model: str = Field(..., min_length=1, max_length=100)
    year: int = Field(..., ge=1900, le=2100)
    vin: str = Field(...)
    license_plate: str = Field(..., min_length=1, max_length=20)
    engine: Optional[str] = Field(None, max_length=100)
    mileage: int = Field(..., ge=0)
    color: Optional[str] = Field(None, max_length=50)
    comment: Optional[str] = None

    @field_validator("vin")
    @classmethod
    def clean_and_validate_vin(cls, v: str) -> str:
        return validate_vin(v)


class CarCreate(CarBase):
    pass


class CarUpdate(BaseModel):
    brand: Optional[str] = Field(None, min_length=1, max_length=100)
    model: Optional[str] = Field(None, min_length=1, max_length=100)
    year: Optional[int] = Field(None, ge=1900, le=2100)
    vin: Optional[str] = None
    license_plate: Optional[str] = Field(None, min_length=1, max_length=20)
    engine: Optional[str] = Field(None, max_length=100)
    mileage: Optional[int] = Field(None, ge=0)
    color: Optional[str] = Field(None, max_length=50)
    comment: Optional[str] = None

    @field_validator("vin")
    @classmethod
    def clean_and_validate_vin(cls, v: Optional[str]) -> Optional[str]:
        if v is not None:
            return validate_vin(v)
        return v


class CarResponse(CarBase):
    id: uuid.UUID

    class Config:
        from_attributes = True
