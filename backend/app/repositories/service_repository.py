from typing import Optional
from sqlalchemy import select
from sqlalchemy.ext.asyncio import AsyncSession
from app.models.service import Service
from app.repositories.base import BaseRepository

class ServiceRepository(BaseRepository[Service]):
    def __init__(self, db: AsyncSession):
        super().__init__(Service, db)

    async def get_by_name(self, name: str) -> Optional[Service]:
        query = select(Service).where(Service.name == name)
        result = await self.db.execute(query)
        return result.scalar_one_or_none()
