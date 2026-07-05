import uuid
from typing import List
from sqlalchemy.ext.asyncio import AsyncSession
from app.repositories.car_repository import CarRepository
from app.repositories.customer_repository import CustomerRepository
from app.models.car import Car
from app.schemas.car import CarCreate, CarUpdate
from app.core.exceptions import NotFoundException, ConflictException, BusinessLogicException


class CarService:
    def __init__(self, db: AsyncSession):
        self.db = db
        self.car_repo = CarRepository(db)
        self.customer_repo = CustomerRepository(db)

    async def add_car(self, car_in: CarCreate) -> Car:
        """
        Validate VIN, verify customer exists, and register vehicle.
        """
        # Verify customer exists
        customer = await self.customer_repo.get(car_in.customer_id)
        if not customer:
            raise NotFoundException("Customer not found")

        # Check VIN uniqueness
        existing = await self.car_repo.get_by_vin(car_in.vin)
        if existing:
            raise ConflictException("Car with this VIN already exists")

        car = await self.car_repo.create(obj_in=car_in.model_dump())
        return car

    async def get_car(self, car_id: uuid.UUID) -> Car:
        """Retrieve a car by ID."""
        car = await self.car_repo.get(car_id)
        if not car:
            raise NotFoundException("Car not found")
        return car

    async def get_cars(self, skip: int = 0, limit: int = 100) -> List[Car]:
        """Retrieve multiple cars."""
        return await self.car_repo.get_multi(skip=skip, limit=limit)

    async def update_car(self, car_id: uuid.UUID, car_in: CarUpdate) -> Car:
        """Update car details."""
        car = await self.get_car(car_id)
        
        obj_data = car_in.model_dump(exclude_unset=True)
        if "vin" in obj_data:
            existing = await self.car_repo.get_by_vin(obj_data["vin"])
            if existing and existing.id != car_id:
                raise ConflictException("Another car with this VIN already exists")
                
        if "customer_id" in obj_data:
            customer = await self.customer_repo.get(obj_data["customer_id"])
            if not customer:
                raise NotFoundException("Customer not found")
                
        return await self.car_repo.update(db_obj=car, obj_in=obj_data)

    async def delete_car(self, car_id: uuid.UUID) -> Car:
        """Delete a car."""
        car = await self.get_car(car_id)
        
        # Check database RESTRICT constraints manually
        if car.orders:
            raise BusinessLogicException("Cannot delete car with existing repair orders")
            
        return await self.car_repo.remove(id=car_id)
