from typing import Optional
from sqlalchemy import select
from sqlalchemy.ext.asyncio import AsyncSession
from app.models.warehouse import WarehouseItem
from app.repositories.base import BaseRepository


class WarehouseRepository(BaseRepository[WarehouseItem]):
    def __init__(self, db: AsyncSession):
        super().__init__(WarehouseItem, db)

    async def get_by_sku(self, sku: str) -> Optional[WarehouseItem]:
        """Fetch warehouse item by SKU."""
        query = select(WarehouseItem).where(WarehouseItem.sku == sku)
        result = await self.db.execute(query)
        return result.scalar_one_or_none()
