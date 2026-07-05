from fastapi import APIRouter
from app.api.v1.auth import router as auth_router
from app.api.v1.customers import router as customers_router
from app.api.v1.cars import router as cars_router
from app.api.v1.orders import router as orders_router
from app.api.v1.comments import router as comments_router
from app.api.v1.photos import router as photos_router
from app.api.v1.users import router as users_router
from app.api.v1.logs import router as logs_router
from app.api.v1.services import router as services_router
from app.api.v1.warehouse import router as warehouse_router
from app.api.v1.payments import router as payments_router
from app.api.v1.dashboard import router as dashboard_router

api_router = APIRouter()

api_router.include_router(auth_router)
api_router.include_router(customers_router)
api_router.include_router(cars_router)
api_router.include_router(orders_router)
api_router.include_router(comments_router)
api_router.include_router(photos_router)
api_router.include_router(users_router)
api_router.include_router(logs_router)
api_router.include_router(services_router)
api_router.include_router(warehouse_router)
api_router.include_router(payments_router)
api_router.include_router(dashboard_router)
