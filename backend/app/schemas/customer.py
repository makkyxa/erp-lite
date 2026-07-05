from typing import Optional
import uuid
from pydantic import BaseModel, EmailStr, Field, field_validator
from app.utils.validators import validate_phone_number


class CustomerBase(BaseModel):
    full_name: str = Field(..., min_length=1, max_length=255)
    phone: str = Field(...)
    email: Optional[EmailStr] = None
    comment: Optional[str] = None

    @field_validator("phone")
    @classmethod
    def clean_and_validate_phone(cls, v: str) -> str:
        return validate_phone_number(v)


class CustomerCreate(CustomerBase):
    pass


class CustomerUpdate(BaseModel):
    full_name: Optional[str] = Field(None, min_length=1, max_length=255)
    phone: Optional[str] = None
    email: Optional[EmailStr] = None
    comment: Optional[str] = None

    @field_validator("phone")
    @classmethod
    def clean_and_validate_phone(cls, v: Optional[str]) -> Optional[str]:
        if v is not None:
            return validate_phone_number(v)
        return v


class CustomerResponse(CustomerBase):
    id: uuid.UUID

    class Config:
        from_attributes = True
