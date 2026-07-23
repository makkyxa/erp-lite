from typing import Any, List
from pydantic import BaseModel

class DashboardStatsResponse(BaseModel):
    customers: int
    cars: int
    active_orders: int
    completed_orders: int
    revenue: float
    today_orders: int
    recent_activity: List[Any] = []
