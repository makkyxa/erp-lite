import uuid
from fastapi import APIRouter, Depends
from sqlalchemy.ext.asyncio import AsyncSession
from app.api.dependencies import get_db, RoleChecker
from app.models.user import UserRole
from app.services.photo_service import PhotoService

router = APIRouter(
    prefix="/photos", 
    tags=["Photos"], 
    dependencies=[Depends(RoleChecker([UserRole.ADMIN, UserRole.MANAGER]))]
)

@router.delete("/{id}", summary="Delete photo")
async def delete_photo(
    id: uuid.UUID,
    db: AsyncSession = Depends(get_db)
):
    photo_service = PhotoService(db)
    await photo_service.delete_photo(id)
    return {"success": True, "detail": "Photo deleted successfully"}
