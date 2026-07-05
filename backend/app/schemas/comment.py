from datetime import datetime
import uuid
from pydantic import BaseModel, Field


class CommentBase(BaseModel):
    text: str = Field(..., min_length=1)


class CommentCreate(CommentBase):
    order_id: uuid.UUID


class CommentUpdate(BaseModel):
    text: str = Field(..., min_length=1)


class CommentResponse(CommentBase):
    id: uuid.UUID
    order_id: uuid.UUID
    author_id: uuid.UUID
    created_at: datetime
    updated_at: datetime

    class Config:
        from_attributes = True
