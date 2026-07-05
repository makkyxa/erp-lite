from typing import List
from sqlalchemy import select
from sqlalchemy.ext.asyncio import AsyncSession
from app.models.payment import Payment
from app.repositories.base import BaseRepository


class PaymentRepository(BaseRepository[Payment]):
    def __init__(self, db: AsyncSession):
        super().__init__(Payment, db)

    async def get_by_order_id(self, order_id: str) -> List[Payment]:
        """Fetch all payments for a specific order."""
        query = select(Payment).where(Payment.order_id == order_id)
        result = await self.db.execute(query)
        return list(result.scalars().all())
