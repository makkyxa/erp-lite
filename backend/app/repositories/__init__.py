from app.repositories.base import BaseRepository
from app.repositories.user_repository import UserRepository
from app.repositories.customer_repository import CustomerRepository
from app.repositories.car_repository import CarRepository
from app.repositories.order_repository import OrderRepository
from app.repositories.log_repository import LogRepository
from app.repositories.warehouse_repository import WarehouseRepository
from app.repositories.service_repository import ServiceRepository
from app.repositories.payment_repository import PaymentRepository
from app.repositories.comment_repository import CommentRepository
from app.repositories.photo_repository import PhotoRepository

__all__ = [
    "BaseRepository",
    "UserRepository",
    "CustomerRepository",
    "CarRepository",
    "OrderRepository",
    "LogRepository",
    "WarehouseRepository",
    "ServiceRepository",
    "PaymentRepository",
    "CommentRepository",
    "PhotoRepository",
]
