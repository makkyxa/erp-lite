import uuid
from typing import AsyncGenerator, List
from fastapi import Depends
from fastapi.security import OAuth2PasswordBearer
import jwt
from sqlalchemy.ext.asyncio import AsyncSession
from app.database.session import SessionLocal
from app.core.config import settings
from app.core.security import ALGORITHM
from app.core.exceptions import UnauthorizedException, ForbiddenException, NotFoundException
from app.models.user import User, UserRole
from app.repositories.user_repository import UserRepository

# OAuth2 scheme configures token endpoint path
oauth2_scheme = OAuth2PasswordBearer(
    tokenUrl="/api/v1/auth/login"
)


async def get_db() -> AsyncGenerator[AsyncSession, None]:
    """Dependency for fetching a database session."""
    async with SessionLocal() as session:
        try:
            yield session
            await session.commit()
        except Exception:
            await session.rollback()
            raise


async def get_current_user(
    db: AsyncSession = Depends(get_db),
    token: str = Depends(oauth2_scheme)
) -> User:
    """Decode token, validate it, and retrieve current user."""
    try:
        payload = jwt.decode(token, settings.SECRET_KEY, algorithms=[ALGORITHM])
        token_type = payload.get("type")
        if token_type != "access":
            raise UnauthorizedException("Invalid token type")
        user_id_str = payload.get("sub")
        if not user_id_str:
            raise UnauthorizedException("Could not validate credentials")
        user_id = uuid.UUID(user_id_str)
    except (jwt.PyJWTError, ValueError):
        raise UnauthorizedException("Could not validate credentials")

    user_repo = UserRepository(db)
    user = await user_repo.get(user_id)
    if not user:
        raise NotFoundException("User not found")
    
    return user


async def get_current_active_user(
    current_user: User = Depends(get_current_user)
) -> User:
    """Ensure retrieved user is active."""
    if not current_user.is_active:
        raise ForbiddenException("Inactive user account")
    return current_user


class RoleChecker:
    """Dependency class to authorize based on user role."""
    def __init__(self, allowed_roles: List[UserRole]):
        self.allowed_roles = allowed_roles

    def __call__(
        self,
        current_user: User = Depends(get_current_active_user)
    ) -> User:
        if current_user.role not in self.allowed_roles:
            raise ForbiddenException("Access denied: insufficient permissions")
        return current_user
