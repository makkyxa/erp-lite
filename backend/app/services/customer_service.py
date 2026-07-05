import uuid
from typing import List, Optional
from sqlalchemy.ext.asyncio import AsyncSession
from app.repositories.customer_repository import CustomerRepository
from app.models.customer import Customer
from app.schemas.customer import CustomerCreate, CustomerUpdate
from app.core.exceptions import NotFoundException, ConflictException, BusinessLogicException


class CustomerService:
    def __init__(self, db: AsyncSession):
        self.db = db
        self.customer_repo = CustomerRepository(db)

    async def create_customer(self, customer_in: CustomerCreate, creator_id: uuid.UUID) -> Customer:
        """
        Validate and create a new customer.
        Checks for phone uniqueness.
        """
        existing = await self.customer_repo.get_by_phone(customer_in.phone)
        if existing:
            raise ConflictException("Customer with this phone number already exists")
        
        obj_data = customer_in.model_dump()
        obj_data["created_by"] = creator_id
        
        customer = await self.customer_repo.create(obj_in=obj_data)
        return customer

    async def get_customer(self, customer_id: uuid.UUID) -> Customer:
        """Retrieve a customer by ID."""
        customer = await self.customer_repo.get(customer_id)
        if not customer:
            raise NotFoundException("Customer not found")
        return customer

    async def get_customers(self, skip: int = 0, limit: int = 100) -> List[Customer]:
        """Retrieve multiple customers."""
        return await self.customer_repo.get_multi(skip=skip, limit=limit)

    async def update_customer(self, customer_id: uuid.UUID, customer_in: CustomerUpdate) -> Customer:
        """Update a customer."""
        customer = await self.get_customer(customer_id)
        
        obj_data = customer_in.model_dump(exclude_unset=True)
        if "phone" in obj_data:
            existing = await self.customer_repo.get_by_phone(obj_data["phone"])
            if existing and existing.id != customer_id:
                raise ConflictException("Another customer with this phone number already exists")
                
        return await self.customer_repo.update(db_obj=customer, obj_in=obj_data)

    async def delete_customer(self, customer_id: uuid.UUID) -> Customer:
        """Delete a customer."""
        customer = await self.get_customer(customer_id)
        
        # Check database RESTRICT constraints manually or catch DB exception
        # Better to check if customer has cars or orders before deleting to raise a clear business error
        if customer.cars:
            raise BusinessLogicException("Cannot delete customer with registered cars")
        if customer.orders:
            raise BusinessLogicException("Cannot delete customer with active or historic orders")
            
        return await self.customer_repo.remove(id=customer_id)
