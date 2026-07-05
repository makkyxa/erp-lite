import uuid
from typing import List
from fastapi import APIRouter, Depends, status
from sqlalchemy.ext.asyncio import AsyncSession
from app.api.dependencies import get_db, get_current_active_user, RoleChecker
from app.models.user import User, UserRole
from app.schemas.service import ServiceCreate, ServiceResponse, ServiceUpdate
from app.services.service_service import ServiceService

router = APIRouter(prefix="/services", tags=["Services"])


@router.get("", response_model=List[ServiceResponse], summary="Get services catalog")
async def get_services(
    skip: int = 0,
    limit: int = 100,
    db: AsyncSession = Depends(get_db),
    current_user: User = Depends(get_current_active_user)
):
    """
    Retrieve standard services catalog list.
    Accessible to all active staff.
    """
    service_service = ServiceService(db)
    return await service_service.get_services(skip=skip, limit=limit)


@router.post(
    "", 
    response_model=ServiceResponse, 
    status_code=status.HTTP_201_CREATED, 
    summary="Create service",
    dependencies=[Depends(RoleChecker([UserRole.ADMIN, UserRole.MANAGER]))]
)
async def create_service(
    service_in: ServiceCreate,
    db: AsyncSession = Depends(get_db)
):
    """
    Register a new service in the catalog.
    Accessible to ADMIN and MANAGER.
    """
    service_service = ServiceService(db)
    return await service_service.create_service(service_in)


@router.get("/{id}", response_model=ServiceResponse, summary="Get service details")
async def get_service(
    id: uuid.UUID,
    db: AsyncSession = Depends(get_db),
    current_user: User = Depends(get_current_active_user)
):
    """
    Retrieve service specifications by ID.
    Accessible to all active staff.
    """
    service_service = ServiceService(db)
    return await service_service.get_service(id)


@router.put(
    "/{id}", 
    response_model=ServiceResponse, 
    summary="Update service",
    dependencies=[Depends(RoleChecker([UserRole.ADMIN, UserRole.MANAGER]))]
)
async def update_service(
    id: uuid.UUID,
    service_in: ServiceUpdate,
    db: AsyncSession = Depends(get_db)
):
    """
    Update service details.
    Accessible to ADMIN and MANAGER.
    """
    service_service = ServiceService(db)
    return await service_service.update_service(id, service_in)


@router.delete(
    "/{id}", 
    summary="Delete service",
    dependencies=[Depends(RoleChecker([UserRole.ADMIN, UserRole.MANAGER]))]
)
async def delete_service(
    id: uuid.UUID,
    db: AsyncSession = Depends(get_db)
):
    """
    Remove service from database catalog.
    Accessible to ADMIN and MANAGER.
    """
    service_service = ServiceService(db)
    await service_service.delete_service(id)
    return {"success": True, "detail": "Service deleted successfully"}
