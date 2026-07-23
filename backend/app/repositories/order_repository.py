from typing import Optional
from sqlalchemy import select
from sqlalchemy.ext.asyncio import AsyncSession
from app.models.order import Order
from app.repositories.base import BaseRepository

class OrderRepository(BaseRepository[Order]):
    def __init__(self, db: AsyncSession):
        super().__init__(Order, db)

    async def get_by_order_number(self, order_number: str) -> Optional[Order]:
        query = select(Order).where(Order.order_number == order_number)
        result = await self.db.execute(query)
        return result.scalar_one_or_none()
