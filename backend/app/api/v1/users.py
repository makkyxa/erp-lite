import uuid
from typing import List
from fastapi import APIRouter, Depends, status
from sqlalchemy.ext.asyncio import AsyncSession
from app.api.dependencies import get_db, RoleChecker
from app.core.exceptions import NotFoundException, ForbiddenException, BusinessLogicException
from app.models.user import User, UserRole
from app.repositories.user_repository import UserRepository
from app.schemas.user import UserCreate, UserResponse, UserUpdate
from app.services.auth_service import AuthService
from app.core.security import get_password_hash

router = APIRouter(prefix="/users", tags=["Users"], dependencies=[Depends(RoleChecker([UserRole.ADMIN]))])


@router.get("", response_model=List[UserResponse], summary="Get users list")
async def get_users(
    skip: int = 0,
    limit: int = 100,
    db: AsyncSession = Depends(get_db)
):
    """
    List all staff users.
    Only ADMIN role allowed.
    """
    user_repo = UserRepository(db)
    return await user_repo.get_multi(skip=skip, limit=limit)


@router.post("", response_model=UserResponse, status_code=status.HTTP_201_CREATED, summary="Create user")
async def create_user(
    user_in: UserCreate,
    db: AsyncSession = Depends(get_db)
):
    """
    Create a new employee user account.
    """
    auth_service = AuthService(db)
    return await auth_service.register_user(user_in)


@router.get("/{id}", response_model=UserResponse, summary="Get user by ID")
async def get_user(
    id: uuid.UUID,
    db: AsyncSession = Depends(get_db)
):
    """
    Retrieve a staff member by ID.
    """
    user_repo = UserRepository(db)
    user = await user_repo.get(id)
    if not user:
        raise NotFoundException("User not found")
    return user


@router.put("/{id}", response_model=UserResponse, summary="Update user")
async def update_user(
    id: uuid.UUID,
    user_in: UserUpdate,
    db: AsyncSession = Depends(get_db)
):
    """
    Update staff member details and roles.
    """
    user_repo = UserRepository(db)
    user = await user_repo.get(id)
    if not user:
        raise NotFoundException("User not found")
        
    obj_data = user_in.model_dump(exclude_unset=True)
    if "password" in obj_data and obj_data["password"]:
        password = obj_data.pop("password")
        obj_data["password_hash"] = get_password_hash(password)
        
    return await user_repo.update(db_obj=user, obj_in=obj_data)


@router.delete("/{id}", summary="Delete user")
async def delete_user(
    id: uuid.UUID,
    db: AsyncSession = Depends(get_db)
):
    """
    Remove user account.
    Only ADMIN allowed. Cannot delete the admin accounts.
    """
    user_repo = UserRepository(db)
    user = await user_repo.get(id)
    if not user:
        raise NotFoundException("User not found")
        
    # Prevent deleting admin users to safeguard system admin access
    if user.role == UserRole.ADMIN:
        # Check how many admins are left
        # (For safety, we block self-deletion or total deletion of admins)
        raise ForbiddenException("Cannot delete Administrator accounts")
        
    await user_repo.remove(id=id)
    return {"success": True, "detail": "User deleted successfully"}
