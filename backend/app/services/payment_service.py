import uuid
from typing import List
from sqlalchemy.ext.asyncio import AsyncSession
from app.repositories.payment_repository import PaymentRepository
from app.repositories.order_repository import OrderRepository
from app.models.payment import Payment
from app.schemas.payment import PaymentCreate, PaymentUpdate
from app.core.exceptions import NotFoundException, BusinessLogicException

class PaymentService:
    def __init__(self, db: AsyncSession):
        self.db = db
        self.payment_repo = PaymentRepository(db)
        self.order_repo = OrderRepository(db)

    async def create_payment(self, payment_in: PaymentCreate, collector_id: uuid.UUID) -> Payment:
        order = await self.order_repo.get(payment_in.order_id)
        if not order:
            raise NotFoundException("Order not found")

        if payment_in.amount <= 0:
            raise BusinessLogicException("Payment amount must be greater than zero")

        obj_data = payment_in.model_dump()
        obj_data["created_by"] = collector_id

        payment = await self.payment_repo.create(obj_in=obj_data)
        return payment

    async def get_payment(self, payment_id: uuid.UUID) -> Payment:
        payment = await self.payment_repo.get(payment_id)
        if not payment:
            raise NotFoundException("Payment record not found")
        return payment

    async def update_payment(self, payment_id: uuid.UUID, payment_in: PaymentUpdate) -> Payment:
        payment = await self.payment_repo.get(payment_id)
        if not payment:
            raise NotFoundException("Payment record not found")
        obj_data = payment_in.model_dump(exclude_unset=True)
        return await self.payment_repo.update(db_obj=payment, obj_in=obj_data)

    async def delete_payment(self, payment_id: uuid.UUID) -> None:
        payment = await self.payment_repo.get(payment_id)
        if not payment:
            raise NotFoundException("Payment record not found")
        await self.payment_repo.remove(id=payment_id)

    async def get_payments_for_order(self, order_id: uuid.UUID) -> List[Payment]:
        order = await self.order_repo.get(order_id)
        if not order:
            raise NotFoundException("Order not found")
        return await self.payment_repo.get_by_order_id(str(order_id))

    async def get_all_payments(self, skip: int = 0, limit: int = 100) -> List[Payment]:
        return await self.payment_repo.get_multi(skip=skip, limit=limit)
