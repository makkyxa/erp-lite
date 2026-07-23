from sqlalchemy.ext.asyncio import AsyncSession
from app.repositories.user_repository import UserRepository
from app.models.user import User
from app.schemas.user import UserCreate
from app.core.security import verify_password, get_password_hash
from app.core.exceptions import UnauthorizedException, ConflictException

class AuthService:
    def __init__(self, db: AsyncSession):
        self.db = db
        self.user_repo = UserRepository(db)

    async def authenticate_user(self, username: str, password: str) -> User:
        user = await self.user_repo.get_by_username(username)
        if not user:
            user = await self.user_repo.get_by_email(username)
            if not user:
                raise UnauthorizedException("Invalid username or password")
        
        if not user.is_active:
            raise UnauthorizedException("Inactive user account")
            
        if not verify_password(password, user.password_hash):
            raise UnauthorizedException("Invalid username or password")
            
        return user

    async def register_user(self, user_in: UserCreate) -> User:
        existing_user = await self.user_repo.get_by_username(user_in.username)
        if existing_user:
            raise ConflictException("Username is already registered")

        existing_email = await self.user_repo.get_by_email(user_in.email)
        if existing_email:
            raise ConflictException("Email is already registered")

        user_data = user_in.model_dump()
        password = user_data.pop("password")
        user_data["password_hash"] = get_password_hash(password)

        new_user = await self.user_repo.create(obj_in=user_data)
        return new_user
