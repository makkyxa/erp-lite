import uuid
from typing import List
from sqlalchemy.ext.asyncio import AsyncSession
from app.repositories.comment_repository import CommentRepository
from app.repositories.order_repository import OrderRepository
from app.models.comment import Comment
from app.schemas.comment import CommentCreate, CommentUpdate
from app.core.exceptions import NotFoundException


class CommentService:
    def __init__(self, db: AsyncSession):
        self.db = db
        self.comment_repo = CommentRepository(db)
        self.order_repo = OrderRepository(db)

    async def create_comment(self, comment_in: CommentCreate, author_id: uuid.UUID) -> Comment:
        """Add a comment to an order."""
        # Verify order exists
        order = await self.order_repo.get(comment_in.order_id)
        if not order:
            raise NotFoundException("Order not found")

        obj_data = comment_in.model_dump()
        obj_data["author_id"] = author_id

        comment = await self.comment_repo.create(obj_in=obj_data)
        return comment

    async def get_comment(self, comment_id: uuid.UUID) -> Comment:
        """Retrieve a comment by ID."""
        comment = await self.comment_repo.get(comment_id)
        if not comment:
            raise NotFoundException("Comment not found")
        return comment

    async def get_comments_for_order(self, order_id: uuid.UUID) -> List[Comment]:
        """Retrieve all comments under a specific order."""
        order = await self.order_repo.get(order_id)
        if not order:
            raise NotFoundException("Order not found")
        return await self.comment_repo.get_by_order_id(str(order_id))

    async def update_comment(self, comment_id: uuid.UUID, comment_in: CommentUpdate) -> Comment:
        """Update a comment's content."""
        comment = await self.get_comment(comment_id)
        obj_data = comment_in.model_dump(exclude_unset=True)
        return await self.comment_repo.update(db_obj=comment, obj_in=obj_data)

    async def delete_comment(self, comment_id: uuid.UUID) -> Comment:
        """Delete a comment."""
        comment = await self.get_comment(comment_id)
        return await self.comment_repo.remove(id=comment_id)
