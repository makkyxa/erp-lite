from datetime import datetime
from typing import Optional
import uuid
from pydantic import BaseModel, Field
from app.models.photo import PhotoType

class PhotoBase(BaseModel):
    order_id: uuid.UUID
    file_path: str = Field(..., max_length=512)
    description: Optional[str] = Field(None, max_length=255)
    photo_type: PhotoType = PhotoType.BEFORE

class PhotoCreate(PhotoBase):
    pass

class PhotoResponse(PhotoBase):
    id: uuid.UUID
    created_at: datetime
    updated_at: datetime

    class Config:
        from_attributes = True
