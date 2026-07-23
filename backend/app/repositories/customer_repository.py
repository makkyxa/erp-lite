from typing import Optional
from sqlalchemy import select
from sqlalchemy.ext.asyncio import AsyncSession
from app.models.customer import Customer
from app.repositories.base import BaseRepository

class CustomerRepository(BaseRepository[Customer]):
    def __init__(self, db: AsyncSession):
        super().__init__(Customer, db)

    async def get_by_phone(self, phone: str) -> Optional[Customer]:
        query = select(Customer).where(Customer.phone == phone)
        result = await self.db.execute(query)
        return result.scalar_one_or_none()
