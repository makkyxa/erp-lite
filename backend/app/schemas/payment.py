from datetime import datetime
from typing import Optional
import uuid
from pydantic import BaseModel, Field
from app.models.payment import PaymentMethod, PaymentStatus

class PaymentBase(BaseModel):
    order_id: uuid.UUID
    amount: float = Field(..., gt=0.0)
    payment_method: PaymentMethod = PaymentMethod.CASH
    payment_status: PaymentStatus = PaymentStatus.PENDING
    transaction_id: Optional[str] = Field(None, max_length=100)

class PaymentCreate(PaymentBase):
    pass

class PaymentUpdate(BaseModel):
    amount: Optional[float] = Field(None, gt=0.0)
    payment_method: Optional[PaymentMethod] = None
    payment_status: Optional[PaymentStatus] = None
    transaction_id: Optional[str] = Field(None, max_length=100)

class PaymentResponse(PaymentBase):
    id: uuid.UUID
    created_by: uuid.UUID
    created_at: datetime
    updated_at: datetime

    class Config:
        from_attributes = True
