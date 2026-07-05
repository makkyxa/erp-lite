from sqlalchemy.ext.asyncio import AsyncSession
from app.models.log import ActivityLog
from app.repositories.base import BaseRepository


class LogRepository(BaseRepository[ActivityLog]):
    def __init__(self, db: AsyncSession):
        super().__init__(ActivityLog, db)
