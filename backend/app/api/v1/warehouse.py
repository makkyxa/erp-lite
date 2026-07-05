import uuid
from typing import List
from fastapi import APIRouter, Depends, status
from sqlalchemy.ext.asyncio import AsyncSession
from app.api.dependencies import get_db, get_current_active_user, RoleChecker
from app.models.user import User, UserRole
from app.schemas.warehouse import WarehouseItemCreate, WarehouseItemResponse, WarehouseItemUpdate
from app.services.warehouse_service import WarehouseService

router = APIRouter(prefix="/warehouse", tags=["Warehouse"])


@router.get("", response_model=List[WarehouseItemResponse], summary="Get warehouse inventory")
async def get_warehouse_items(
    skip: int = 0,
    limit: int = 100,
    db: AsyncSession = Depends(get_db),
    current_user: User = Depends(get_current_active_user)
):
    """
    Retrieve list of inventory items.
    Accessible to all active staff.
    """
    warehouse_service = WarehouseService(db)
    return await warehouse_service.get_items(skip=skip, limit=limit)


@router.post(
    "", 
    response_model=WarehouseItemResponse, 
    status_code=status.HTTP_201_CREATED, 
    summary="Create warehouse item",
    dependencies=[Depends(RoleChecker([UserRole.ADMIN, UserRole.MANAGER]))]
)
async def create_warehouse_item(
    item_in: WarehouseItemCreate,
    db: AsyncSession = Depends(get_db),
    current_user: User = Depends(get_current_active_user)
):
    """
    Add a new item to the warehouse stock.
    Accessible to ADMIN and MANAGER.
    """
    warehouse_service = WarehouseService(db)
    return await warehouse_service.create_item(item_in, creator_id=current_user.id)


@router.get("/{id}", response_model=WarehouseItemResponse, summary="Get warehouse item details")
async def get_warehouse_item(
    id: uuid.UUID,
    db: AsyncSession = Depends(get_db),
    current_user: User = Depends(get_current_active_user)
):
    """
    Retrieve specific inventory item details by ID.
    Accessible to all active staff.
    """
    warehouse_service = WarehouseService(db)
    return await warehouse_service.get_item(id)


@router.put(
    "/{id}", 
    response_model=WarehouseItemResponse, 
    summary="Update warehouse item",
    dependencies=[Depends(RoleChecker([UserRole.ADMIN, UserRole.MANAGER]))]
)
async def update_warehouse_item(
    id: uuid.UUID,
    item_in: WarehouseItemUpdate,
    db: AsyncSession = Depends(get_db)
):
    """
    Update details of an item in the warehouse.
    Accessible to ADMIN and MANAGER.
    """
    warehouse_service = WarehouseService(db)
    return await warehouse_service.update_item(id, item_in)


@router.delete(
    "/{id}", 
    summary="Delete warehouse item",
    dependencies=[Depends(RoleChecker([UserRole.ADMIN, UserRole.MANAGER]))]
)
async def delete_warehouse_item(
    id: uuid.UUID,
    db: AsyncSession = Depends(get_db)
):
    """
    Remove an item from warehouse stock list.
    Accessible to ADMIN and MANAGER.
    """
    warehouse_service = WarehouseService(db)
    await warehouse_service.delete_item(id)
    return {"success": True, "detail": "Warehouse item deleted successfully"}
