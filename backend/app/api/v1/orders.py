import uuid
from typing import List, Optional
from fastapi import APIRouter, Depends, Query, status
from sqlalchemy.ext.asyncio import AsyncSession
from app.api.dependencies import get_db, get_current_active_user, RoleChecker
from app.models.user import User, UserRole
from app.models.order import OrderPriority, OrderStatus
from app.models.photo import PhotoType
from app.schemas.comment import CommentCreate, CommentResponse
from app.schemas.order import OrderCreate, OrderResponse, OrderUpdate
from app.schemas.photo import PhotoCreate, PhotoResponse
from app.services.order_service import OrderService
from app.services.comment_service import CommentService
from app.services.photo_service import PhotoService
from app.core.exceptions import ForbiddenException

router = APIRouter(prefix="/orders", tags=["Orders"])


@router.get("", response_model=List[OrderResponse], summary="Get orders list")
async def get_orders(
    skip: int = 0,
    limit: int = 100,
    db: AsyncSession = Depends(get_db),
    current_user: User = Depends(get_current_active_user)
):
    """
    Retrieve repairs list.
    Accessible to all logged in staff.
    """
    order_service = OrderService(db)
    return await order_service.get_orders(skip=skip, limit=limit)


@router.post("", response_model=OrderResponse, status_code=status.HTTP_201_CREATED, summary="Create order")
async def create_order(
    order_in: OrderCreate,
    db: AsyncSession = Depends(get_db),
    current_user: User = Depends(get_current_active_user)
):
    """
    Create a new repair order.
    Accessible to all logged in staff (ADMIN, MANAGER, ENGINEER).
    """
    order_service = OrderService(db)
    return await order_service.create_order(order_in, creator_id=current_user.id)


@router.get("/{id}", response_model=OrderResponse, summary="Get order details")
async def get_order(
    id: uuid.UUID,
    db: AsyncSession = Depends(get_db),
    current_user: User = Depends(get_current_active_user)
):
    """
    Retrieve repair order details by unique ID.
    Accessible to all logged in staff.
    """
    order_service = OrderService(db)
    return await order_service.get_order(id)


@router.put("/{id}", response_model=OrderResponse, summary="Update order")
async def update_order(
    id: uuid.UUID,
    order_in: OrderUpdate,
    db: AsyncSession = Depends(get_db),
    current_user: User = Depends(get_current_active_user)
):
    """
    Update repair order details.
    Engineers can only update orders assigned to them.
    """
    order_service = OrderService(db)
    order = await order_service.get_order(id)

    # Security check: Engineers can only modify their assigned orders
    if current_user.role == UserRole.ENGINEER and order.engineer_id != current_user.id:
        raise ForbiddenException("Engineers can only update their assigned orders")

    return await order_service.update_order(id, order_in)


@router.patch("/{id}/status", response_model=OrderResponse, summary="Change order status")
async def update_order_status(
    id: uuid.UUID,
    status_in: OrderStatus,
    db: AsyncSession = Depends(get_db),
    current_user: User = Depends(get_current_active_user)
):
    """
    Transition order status via state machine.
    Engineers can only transition status of their assigned orders.
    """
    order_service = OrderService(db)
    order = await order_service.get_order(id)

    # Security check: Engineers can only transition their assigned orders
    if current_user.role == UserRole.ENGINEER and order.engineer_id != current_user.id:
        raise ForbiddenException("Engineers can only transition status of their assigned orders")

    return await order_service.transition_status(id, status_in)


@router.delete(
    "/{id}", 
    summary="Delete order",
    dependencies=[Depends(RoleChecker([UserRole.ADMIN]))]
)
async def delete_order(
    id: uuid.UUID,
    db: AsyncSession = Depends(get_db)
):
    """
    Remove repair order.
    Only ADMIN role allowed.
    """
    order_service = OrderService(db)
    await order_service.delete_order(id)
    return {"success": True, "detail": "Order deleted successfully"}


# Comments Nested Routes
@router.get("/{id}/comments", response_model=List[CommentResponse], summary="Get order comments")
async def get_order_comments(
    id: uuid.UUID,
    db: AsyncSession = Depends(get_db),
    current_user: User = Depends(get_current_active_user)
):
    """
    Retrieve comments thread for a repair order.
    """
    comment_service = CommentService(db)
    return await comment_service.get_comments_for_order(id)


@router.post("/{id}/comments", response_model=CommentResponse, status_code=status.HTTP_201_CREATED, summary="Add comment")
async def create_order_comment(
    id: uuid.UUID,
    comment_in: CommentCreate,
    db: AsyncSession = Depends(get_db),
    current_user: User = Depends(get_current_active_user)
):
    """
    Post a new comment in order logs.
    """
    comment_service = CommentService(db)
    # Force comment order_id to match the route param
    comment_in.order_id = id
    return await comment_service.create_comment(comment_in, author_id=current_user.id)


# Photos Nested Routes
@router.get("/{id}/photos", response_model=List[PhotoResponse], summary="Get order photos")
async def get_order_photos(
    id: uuid.UUID,
    db: AsyncSession = Depends(get_db),
    current_user: User = Depends(get_current_active_user)
):
    """
    Retrieve files uploaded for a repair order.
    """
    photo_service = PhotoService(db)
    return await photo_service.get_photos_for_order(id)


@router.post("/{id}/photos", response_model=PhotoResponse, status_code=status.HTTP_201_CREATED, summary="Upload order photo")
async def upload_order_photo(
    id: uuid.UUID,
    photo_in: PhotoCreate,
    db: AsyncSession = Depends(get_db),
    current_user: User = Depends(get_current_active_user)
):
    """
    Link a photo path to the repair order.
    """
    photo_service = PhotoService(db)
    # Force photo order_id to match route param
    photo_in.order_id = id
    return await photo_service.add_photo(photo_in)
