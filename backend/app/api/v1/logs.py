from datetime import datetime
from typing import Any, List, Optional
from fastapi import APIRouter, Depends, Query
from sqlalchemy.ext.asyncio import AsyncSession
from app.api.dependencies import get_db, RoleChecker
from app.models.user import UserRole
from app.repositories.log_repository import LogRepository

router = APIRouter(
    prefix="/logs", 
    tags=["Audit Logs"],
    dependencies=[Depends(RoleChecker([UserRole.ADMIN]))]
)

@router.get("", summary="Get system audit logs")
async def get_logs(
    skip: int = 0,
    limit: int = 100,
    user_id: Optional[str] = Query(None),
    action: Optional[str] = Query(None),
    db: AsyncSession = Depends(get_db)
):
    log_repo = LogRepository(db)
    return await log_repo.get_multi(skip=skip, limit=limit)
