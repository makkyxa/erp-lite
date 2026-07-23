from typing import List
from sqlalchemy import select
from sqlalchemy.ext.asyncio import AsyncSession
from app.models.photo import Photo
from app.repositories.base import BaseRepository

class PhotoRepository(BaseRepository[Photo]):
    def __init__(self, db: AsyncSession):
        super().__init__(Photo, db)

    async def get_by_order_id(self, order_id: str) -> List[Photo]:
        query = select(Photo).where(Photo.order_id == order_id)
        result = await self.db.execute(query)
        return list(result.scalars().all())
