from typing import List
from sqlalchemy import select
from sqlalchemy.ext.asyncio import AsyncSession
from app.models.comment import Comment
from app.repositories.base import BaseRepository


class CommentRepository(BaseRepository[Comment]):
    def __init__(self, db: AsyncSession):
        super().__init__(Comment, db)

    async def get_by_order_id(self, order_id: str) -> List[Comment]:
        """Fetch all comments for a specific order."""
        query = select(Comment).where(Comment.order_id == order_id)
        result = await self.db.execute(query)
        return list(result.scalars().all())
