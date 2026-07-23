import uuid
from typing import List, Optional
from fastapi import APIRouter, Depends, Query, status
from sqlalchemy.ext.asyncio import AsyncSession
from app.api.dependencies import get_db, get_current_active_user, RoleChecker
from app.models.user import User, UserRole
from app.schemas.customer import CustomerCreate, CustomerResponse, CustomerUpdate
from app.services.customer_service import CustomerService

router = APIRouter(prefix="/customers", tags=["Customers"])

@router.get("", response_model=List[CustomerResponse], summary="Get customers list")
async def get_customers(
    skip: int = 0,
    limit: int = 100,
    db: AsyncSession = Depends(get_db),
    current_user: User = Depends(get_current_active_user)
):
    customer_service = CustomerService(db)
    return await customer_service.get_customers(skip=skip, limit=limit)

@router.post(
    "", 
    response_model=CustomerResponse, 
    status_code=status.HTTP_201_CREATED, 
    summary="Create customer",
    dependencies=[Depends(RoleChecker([UserRole.ADMIN, UserRole.MANAGER]))]
)
async def create_customer(
    customer_in: CustomerCreate,
    db: AsyncSession = Depends(get_db),
    current_user: User = Depends(get_current_active_user)
):
    customer_service = CustomerService(db)
    return await customer_service.create_customer(customer_in, creator_id=current_user.id)

@router.get("/{id}", response_model=CustomerResponse, summary="Get customer details")
async def get_customer(
    id: uuid.UUID,
    db: AsyncSession = Depends(get_db),
    current_user: User = Depends(get_current_active_user)
):
    customer_service = CustomerService(db)
    return await customer_service.get_customer(id)

@router.put(
    "/{id}", 
    response_model=CustomerResponse, 
    summary="Update customer",
    dependencies=[Depends(RoleChecker([UserRole.ADMIN, UserRole.MANAGER]))]
)
async def update_customer(
    id: uuid.UUID,
    customer_in: CustomerUpdate,
    db: AsyncSession = Depends(get_db)
):
    customer_service = CustomerService(db)
    return await customer_service.update_customer(id, customer_in)

@router.delete(
    "/{id}", 
    summary="Delete customer",
    dependencies=[Depends(RoleChecker([UserRole.ADMIN, UserRole.MANAGER]))]
)
async def delete_customer(
    id: uuid.UUID,
    db: AsyncSession = Depends(get_db)
):
    customer_service = CustomerService(db)
    await customer_service.delete_customer(id)
    return {"success": True, "detail": "Customer deleted successfully"}
