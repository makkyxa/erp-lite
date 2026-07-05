import uuid
from typing import List
from fastapi import APIRouter, Depends, status
from sqlalchemy.ext.asyncio import AsyncSession
from app.api.dependencies import get_db, get_current_active_user, RoleChecker
from app.models.user import User, UserRole
from app.schemas.car import CarCreate, CarResponse, CarUpdate
from app.services.car_service import CarService

router = APIRouter(prefix="/cars", tags=["Cars"])


@router.get("", response_model=List[CarResponse], summary="Get cars list")
async def get_cars(
    skip: int = 0,
    limit: int = 100,
    db: AsyncSession = Depends(get_db),
    current_user: User = Depends(get_current_active_user)
):
    """
    Retrieve cars list.
    Accessible to all logged in staff.
    """
    car_service = CarService(db)
    return await car_service.get_cars(skip=skip, limit=limit)


@router.post(
    "", 
    response_model=CarResponse, 
    status_code=status.HTTP_201_CREATED, 
    summary="Create car",
    dependencies=[Depends(RoleChecker([UserRole.ADMIN, UserRole.MANAGER]))]
)
async def create_car(
    car_in: CarCreate,
    db: AsyncSession = Depends(get_db)
):
    """
    Create a new vehicle record.
    Accessible to ADMIN and MANAGER.
    """
    car_service = CarService(db)
    return await car_service.add_car(car_in)


@router.get("/{id}", response_model=CarResponse, summary="Get car details")
async def get_car(
    id: uuid.UUID,
    db: AsyncSession = Depends(get_db),
    current_user: User = Depends(get_current_active_user)
):
    """
    Retrieve car specifications by unique ID.
    Accessible to all logged in staff.
    """
    car_service = CarService(db)
    return await car_service.get_car(id)


@router.put(
    "/{id}", 
    response_model=CarResponse, 
    summary="Update car",
    dependencies=[Depends(RoleChecker([UserRole.ADMIN, UserRole.MANAGER]))]
)
async def update_car(
    id: uuid.UUID,
    car_in: CarUpdate,
    db: AsyncSession = Depends(get_db)
):
    """
    Update car specifications.
    Accessible to ADMIN and MANAGER.
    """
    car_service = CarService(db)
    return await car_service.update_car(id, car_in)


@router.delete(
    "/{id}", 
    summary="Delete car",
    dependencies=[Depends(RoleChecker([UserRole.ADMIN, UserRole.MANAGER]))]
)
async def delete_car(
    id: uuid.UUID,
    db: AsyncSession = Depends(get_db)
):
    """
    Remove car from database.
    Raises Conflict if active repairs exist.
    Accessible to ADMIN and MANAGER.
    """
    car_service = CarService(db)
    await car_service.delete_car(id)
    return {"success": True, "detail": "Car deleted successfully"}
