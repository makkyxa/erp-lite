from typing import Optional
from sqlalchemy import select
from sqlalchemy.ext.asyncio import AsyncSession
from app.models.car import Car
from app.repositories.base import BaseRepository


class CarRepository(BaseRepository[Car]):
    def __init__(self, db: AsyncSession):
        super().__init__(Car, db)

    async def get_by_vin(self, vin: str) -> Optional[Car]:
        """Fetch car by VIN code."""
        query = select(Car).where(Car.vin == vin)
        result = await self.db.execute(query)
        return result.scalar_one_or_none()
