import uuid
from datetime import datetime, timezone
from typing import List
from sqlalchemy.ext.asyncio import AsyncSession
from app.repositories.order_repository import OrderRepository
from app.repositories.customer_repository import CustomerRepository
from app.repositories.car_repository import CarRepository
from app.repositories.user_repository import UserRepository
from app.models.order import Order, OrderStatus, OrderPriority
from app.schemas.order import OrderCreate, OrderUpdate
from app.core.exceptions import NotFoundException, ConflictException, BusinessLogicException


class OrderService:
    def __init__(self, db: AsyncSession):
        self.db = db
        self.order_repo = OrderRepository(db)
        self.customer_repo = CustomerRepository(db)
        self.car_repo = CarRepository(db)
        self.user_repo = UserRepository(db)

    async def create_order(self, order_in: OrderCreate, creator_id: uuid.UUID) -> Order:
        """
        Validate entities, assign serial order number, and initialize repair order.
        """
        # Validate Customer
        customer = await self.customer_repo.get(order_in.customer_id)
        if not customer:
            raise NotFoundException("Customer not found")

        # Validate Car
        car = await self.car_repo.get(order_in.car_id)
        if not car:
            raise NotFoundException("Car not found")

        # If car does not belong to customer, raise error
        if car.customer_id != customer.id:
            raise BusinessLogicException("Car does not belong to the selected customer")

        # Validate Engineer if provided
        if order_in.engineer_id:
            engineer = await self.user_repo.get(order_in.engineer_id)
            if not engineer:
                raise NotFoundException("Assigned engineer not found")

        # Generate unique order number: ORD-YYYYMMDD-XXXX
        today = datetime.now(timezone.utc).strftime("%Y%m%d")
        random_suffix = uuid.uuid4().hex[:4].upper()
        order_number = f"ORD-{today}-{random_suffix}"

        obj_data = order_in.model_dump()
        obj_data["order_number"] = order_number
        obj_data["created_by"] = creator_id
        obj_data["status"] = OrderStatus.CREATED

        order = await self.order_repo.create(obj_in=obj_data)
        return order

    async def get_order(self, order_id: uuid.UUID) -> Order:
        """Retrieve an order by ID."""
        order = await self.order_repo.get(order_id)
        if not order:
            raise NotFoundException("Order not found")
        return order

    async def get_orders(self, skip: int = 0, limit: int = 100) -> List[Order]:
        """Retrieve multiple orders."""
        return await self.order_repo.get_multi(skip=skip, limit=limit)

    async def update_order(self, order_id: uuid.UUID, order_in: OrderUpdate) -> Order:
        """Update order details."""
        order = await self.get_order(order_id)
        
        if order.status in (OrderStatus.DELIVERED, OrderStatus.CANCELLED):
            raise BusinessLogicException("Cannot modify orders in a terminal status (DELIVERED or CANCELLED)")
            
        obj_data = order_in.model_dump(exclude_unset=True)
        
        if "customer_id" in obj_data:
            customer = await self.customer_repo.get(obj_data["customer_id"])
            if not customer:
                raise NotFoundException("Customer not found")
                
        if "car_id" in obj_data:
            car = await self.car_repo.get(obj_data["car_id"])
            if not car:
                raise NotFoundException("Car not found")
                
        if "engineer_id" in obj_data and obj_data["engineer_id"] is not None:
            engineer = await self.user_repo.get(obj_data["engineer_id"])
            if not engineer:
                raise NotFoundException("Engineer not found")

        # If updating status, delegate to transition state machine
        if "status" in obj_data and obj_data["status"] != order.status:
            new_status = obj_data.pop("status")
            await self.transition_status(order_id, new_status)

        return await self.order_repo.update(db_obj=order, obj_in=obj_data)

    async def transition_status(self, order_id: uuid.UUID, new_status: OrderStatus) -> Order:
        """
        Manage state machine for order transitions.
        """
        order = await self.get_order(order_id)
        current = order.status

        if current in (OrderStatus.DELIVERED, OrderStatus.CANCELLED):
            raise BusinessLogicException(f"Cannot transition order from terminal status {current}")

        # Allowed transitions
        allowed = {
            OrderStatus.CREATED: [OrderStatus.WAITING_PARTS, OrderStatus.IN_PROGRESS, OrderStatus.CANCELLED],
            OrderStatus.WAITING_PARTS: [OrderStatus.IN_PROGRESS, OrderStatus.CANCELLED],
            OrderStatus.IN_PROGRESS: [OrderStatus.READY, OrderStatus.CANCELLED],
            OrderStatus.READY: [OrderStatus.DELIVERED, OrderStatus.IN_PROGRESS, OrderStatus.CANCELLED],
        }

        if new_status not in allowed.get(current, []):
            raise BusinessLogicException(f"Invalid transition from {current} to {new_status}")

        obj_in = {"status": new_status}
        if new_status == OrderStatus.IN_PROGRESS and not order.started_at:
            obj_in["started_at"] = datetime.now(timezone.utc)
        elif new_status in (OrderStatus.READY, OrderStatus.DELIVERED) and not order.finished_at:
            obj_in["finished_at"] = datetime.now(timezone.utc)

        return await self.order_repo.update(db_obj=order, obj_in=obj_in)

    async def delete_order(self, order_id: uuid.UUID) -> Order:
        """Delete an order."""
        order = await self.get_order(order_id)
        
        # Check financial records
        if order.payments:
            raise BusinessLogicException("Cannot delete an order that has registered payments")
            
        return await self.order_repo.remove(id=order_id)
