import jwt
from fastapi import APIRouter, Depends
from fastapi.security import OAuth2PasswordRequestForm
from sqlalchemy.ext.asyncio import AsyncSession
from app.api.dependencies import get_db, get_current_active_user
from app.core.config import settings
from app.core.security import create_access_token, create_refresh_token, decode_token, ALGORITHM
from app.core.exceptions import UnauthorizedException
from app.models.user import User
from app.schemas.token import Token
from app.schemas.user import UserResponse
from app.services.auth_service import AuthService

router = APIRouter(prefix="/auth", tags=["Authentication"])


@router.post("/login", response_model=Token, summary="User login")
async def login(
    form_data: OAuth2PasswordRequestForm = Depends(),
    db: AsyncSession = Depends(get_db)
):
    """
    Authenticate user and return access & refresh JWT tokens.
    Supports standard OAuth2 / Swagger authentication flow.
    """
    auth_service = AuthService(db)
    user = await auth_service.authenticate_user(
        username=form_data.username,
        password=form_data.password
    )
    
    access_token = create_access_token(subject=user.id)
    refresh_token = create_refresh_token(subject=user.id)
    
    return {
        "access_token": access_token,
        "refresh_token": refresh_token,
        "token_type": "bearer"
    }


@router.post("/refresh", response_model=Token, summary="Refresh access token")
async def refresh_token(
    refresh_token: str,
    db: AsyncSession = Depends(get_db)
):
    """
    Get a new access token using a valid refresh token.
    """
    payload = decode_token(refresh_token)
    token_type = payload.get("type")
    if token_type != "refresh":
        raise UnauthorizedException("Invalid refresh token")
        
    user_id = payload.get("sub")
    if not user_id:
        raise UnauthorizedException("Invalid refresh token")
        
    access_token = create_access_token(subject=user_id)
    new_refresh_token = create_refresh_token(subject=user_id)
    
    return {
        "access_token": access_token,
        "refresh_token": new_refresh_token,
        "token_type": "bearer"
    }


@router.get("/me", response_model=UserResponse, summary="Get current user")
async def get_me(
    current_user: User = Depends(get_current_active_user)
):
    """
    Return the profile of the currently logged in active user.
    """
    return current_user


@router.post("/logout", summary="Logout user")
async def logout():
    """
    Invalidate refresh token and logout user.
    """
    return {"success": True, "detail": "Successfully logged out"}
