import uuid
from typing import List
from sqlalchemy.ext.asyncio import AsyncSession
from app.repositories.photo_repository import PhotoRepository
from app.repositories.order_repository import OrderRepository
from app.models.photo import Photo
from app.schemas.photo import PhotoCreate
from app.core.exceptions import NotFoundException


class PhotoService:
    def __init__(self, db: AsyncSession):
        self.db = db
        self.photo_repo = PhotoRepository(db)
        self.order_repo = OrderRepository(db)

    async def add_photo(self, photo_in: PhotoCreate) -> Photo:
        """Register a photo under an order."""
        # Verify order exists
        order = await self.order_repo.get(photo_in.order_id)
        if not order:
            raise NotFoundException("Order not found")

        photo = await self.photo_repo.create(obj_in=photo_in.model_dump())
        return photo

    async def get_photo(self, photo_id: uuid.UUID) -> Photo:
        """Retrieve a photo record by ID."""
        photo = await self.photo_repo.get(photo_id)
        if not photo:
            raise NotFoundException("Photo record not found")
        return photo

    async def get_photos_for_order(self, order_id: uuid.UUID) -> List[Photo]:
        """Retrieve all photos for a specific order."""
        order = await self.order_repo.get(order_id)
        if not order:
            raise NotFoundException("Order not found")
        return await self.photo_repo.get_by_order_id(str(order_id))

    async def delete_photo(self, photo_id: uuid.UUID) -> Photo:
        """Delete a photo record."""
        photo = await self.get_photo(photo_id)
        return await self.photo_repo.remove(id=photo_id)
