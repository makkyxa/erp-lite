from datetime import datetime
from typing import Optional
import uuid
from pydantic import BaseModel, Field, field_validator
from app.models.order import OrderPriority, OrderStatus


class OrderBase(BaseModel):
    customer_id: uuid.UUID
    car_id: uuid.UUID
    engineer_id: Optional[uuid.UUID] = None
    status: OrderStatus = OrderStatus.CREATED
    priority: OrderPriority = OrderPriority.NORMAL
    problem_description: str = Field(..., min_length=1)
    repair_description: Optional[str] = None
    price: float = Field(default=0.00, ge=0.0)

    @field_validator("price")
    @classmethod
    def validate_price_positive(cls, v: float) -> float:
        if v < 0:
            raise ValueError("Price must be greater than or equal to 0")
        return v


class OrderCreate(OrderBase):
    pass


class OrderUpdate(BaseModel):
    engineer_id: Optional[uuid.UUID] = None
    status: Optional[OrderStatus] = None
    priority: Optional[OrderPriority] = None
    problem_description: Optional[str] = None
    repair_description: Optional[str] = None
    price: Optional[float] = Field(None, ge=0.0)
    started_at: Optional[datetime] = None
    finished_at: Optional[datetime] = None


class OrderResponse(OrderBase):
    id: uuid.UUID
    order_number: str
    started_at: Optional[datetime] = None
    finished_at: Optional[datetime] = None
    created_at: datetime
    updated_at: datetime

    class Config:
        from_attributes = True
