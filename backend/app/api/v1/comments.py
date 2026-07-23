import uuid
from fastapi import APIRouter, Depends
from sqlalchemy.ext.asyncio import AsyncSession
from app.api.dependencies import get_db, get_current_active_user
from app.models.user import User, UserRole
from app.schemas.comment import CommentUpdate, CommentResponse
from app.services.comment_service import CommentService
from app.core.exceptions import ForbiddenException

router = APIRouter(prefix="/comments", tags=["Comments"])

@router.put("/{id}", response_model=CommentResponse, summary="Update comment")
async def update_comment(
    id: uuid.UUID,
    comment_in: CommentUpdate,
    db: AsyncSession = Depends(get_db),
    current_user: User = Depends(get_current_active_user)
):
    comment_service = CommentService(db)
    comment = await comment_service.get_comment(id)

    if comment.author_id != current_user.id:
        raise ForbiddenException("You do not have permissions to edit this comment")

    return await comment_service.update_comment(id, comment_in)

@router.delete("/{id}", summary="Delete comment")
async def delete_comment(
    id: uuid.UUID,
    db: AsyncSession = Depends(get_db),
    current_user: User = Depends(get_current_active_user)
):
    comment_service = CommentService(db)
    comment = await comment_service.get_comment(id)

    if current_user.role != UserRole.ADMIN and comment.author_id != current_user.id:
        raise ForbiddenException("You do not have permissions to delete this comment")

    await comment_service.delete_comment(id)
    return {"success": True, "detail": "Comment deleted successfully"}
