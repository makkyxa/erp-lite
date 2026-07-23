from fastapi import APIRouter, Depends
from sqlalchemy.ext.asyncio import AsyncSession
from app.api.dependencies import get_db, RoleChecker
from app.models.user import User, UserRole
from app.schemas.dashboard import DashboardStatsResponse
from app.services.dashboard_service import DashboardService

router = APIRouter(
    prefix="/dashboard", 
    tags=["Dashboard"]
)

@router.get("", response_model=DashboardStatsResponse, summary="Get dashboard analytics")
async def get_dashboard(
    db: AsyncSession = Depends(get_db),
    current_user: User = Depends(RoleChecker([UserRole.ADMIN, UserRole.MANAGER, UserRole.ENGINEER]))
):
    dashboard_service = DashboardService(db)
    return await dashboard_service.get_dashboard_stats(current_user)
