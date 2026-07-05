import uuid
from typing import List
from fastapi import APIRouter, Depends, status
from sqlalchemy.ext.asyncio import AsyncSession
from app.api.dependencies import get_db, get_current_active_user, RoleChecker
from app.models.user import User, UserRole
from app.schemas.payment import PaymentCreate, PaymentResponse, PaymentUpdate
from app.services.payment_service import PaymentService

# Restrict all routes in this module to ADMIN and MANAGER role
router = APIRouter(
    prefix="/payments", 
    tags=["Payments"],
    dependencies=[Depends(RoleChecker([UserRole.ADMIN, UserRole.MANAGER]))]
)


@router.get("", response_model=List[PaymentResponse], summary="Get all payments")
async def get_payments(
    skip: int = 0,
    limit: int = 100,
    db: AsyncSession = Depends(get_db)
):
    """
    Retrieve all payment records.
    Accessible to ADMIN and MANAGER.
    """
    payment_service = PaymentService(db)
    return await payment_service.get_all_payments(skip=skip, limit=limit)


@router.post("", response_model=PaymentResponse, status_code=status.HTTP_201_CREATED, summary="Create payment")
async def create_payment(
    payment_in: PaymentCreate,
    db: AsyncSession = Depends(get_db),
    current_user: User = Depends(get_current_active_user)
):
    """
    Register a new payment for a repair order.
    Accessible to ADMIN and MANAGER.
    """
    payment_service = PaymentService(db)
    return await payment_service.create_payment(payment_in, collector_id=current_user.id)


@router.get("/{id}", response_model=PaymentResponse, summary="Get payment details")
async def get_payment(
    id: uuid.UUID,
    db: AsyncSession = Depends(get_db)
):
    """
    Retrieve payment details by ID.
    Accessible to ADMIN and MANAGER.
    """
    payment_service = PaymentService(db)
    return await payment_service.get_payment(id)


@router.get("/order/{order_id}", response_model=List[PaymentResponse], summary="Get payments by order ID")
async def get_order_payments(
    order_id: uuid.UUID,
    db: AsyncSession = Depends(get_db)
):
    """
    Retrieve all payments for a specific order.
    Accessible to ADMIN and MANAGER.
    """
    payment_service = PaymentService(db)
    return await payment_service.get_payments_for_order(order_id)


@router.put("/{id}", response_model=PaymentResponse, summary="Update payment")
async def update_payment(
    id: uuid.UUID,
    payment_in: PaymentUpdate,
    db: AsyncSession = Depends(get_db)
):
    """
    Update details of a payment record.
    Accessible to ADMIN and MANAGER.
    """
    payment_service = PaymentService(db)
    return await payment_service.update_payment(id, payment_in)


@router.delete("/{id}", summary="Delete payment")
async def delete_payment(
    id: uuid.UUID,
    db: AsyncSession = Depends(get_db)
):
    """
    Delete a payment record.
    Accessible to ADMIN and MANAGER.
    """
    payment_service = PaymentService(db)
    await payment_service.delete_payment(id)
    return {"success": True, "detail": "Payment deleted successfully"}
