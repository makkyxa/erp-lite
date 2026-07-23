from sqlalchemy import select, func
from sqlalchemy.ext.asyncio import AsyncSession
from app.models.customer import Customer
from app.models.car import Car
from app.models.order import Order, OrderStatus
from app.models.payment import Payment, PaymentStatus
from app.models.user import User, UserRole
from app.schemas.dashboard import DashboardStatsResponse

class DashboardService:
    def __init__(self, db: AsyncSession):
        self.db = db

    async def get_dashboard_stats(self, current_user: User) -> DashboardStatsResponse:
        if current_user.role == UserRole.ENGINEER:
            cust_query = select(func.count(func.distinct(Order.customer_id))).where(Order.engineer_id == current_user.id)
            cust_res = await self.db.execute(cust_query)
            total_customers = cust_res.scalar() or 0

            car_query = select(func.count(func.distinct(Order.car_id))).where(Order.engineer_id == current_user.id)
            car_res = await self.db.execute(car_query)
            total_cars = car_res.scalar() or 0

            active_query = select(func.count(Order.id)).where(
                Order.engineer_id == current_user.id,
                Order.status.notin_([OrderStatus.DELIVERED, OrderStatus.CANCELLED])
            )
            active_res = await self.db.execute(active_query)
            active_orders = active_res.scalar() or 0

            comp_query = select(func.count(Order.id)).where(
                Order.engineer_id == current_user.id,
                Order.status == OrderStatus.DELIVERED
            )
            comp_res = await self.db.execute(comp_query)
            completed_orders = comp_res.scalar() or 0

            revenue = 0.0

            today_query = select(func.count(Order.id)).where(
                Order.engineer_id == current_user.id,
                func.date(Order.created_at) == func.current_date()
            )
            today_res = await self.db.execute(today_query)
            today_orders = today_res.scalar() or 0
        else:
            cust_query = select(func.count(Customer.id))
            cust_res = await self.db.execute(cust_query)
            total_customers = cust_res.scalar() or 0

            car_query = select(func.count(Car.id))
            car_res = await self.db.execute(car_query)
            total_cars = car_res.scalar() or 0

            active_query = select(func.count(Order.id)).where(
                Order.status.notin_([OrderStatus.DELIVERED, OrderStatus.CANCELLED])
            )
            active_res = await self.db.execute(active_query)
            active_orders = active_res.scalar() or 0

            comp_query = select(func.count(Order.id)).where(
                Order.status == OrderStatus.DELIVERED
            )
            comp_res = await self.db.execute(comp_query)
            completed_orders = comp_res.scalar() or 0

            rev_query = select(func.sum(Payment.amount)).where(
                Payment.payment_status == PaymentStatus.COMPLETED
            )
            rev_res = await self.db.execute(rev_query)
            revenue = float(rev_res.scalar() or 0.0)

            today_query = select(func.count(Order.id)).where(
                func.date(Order.created_at) == func.current_date()
            )
            today_res = await self.db.execute(today_query)
            today_orders = today_res.scalar() or 0

        return DashboardStatsResponse(
            customers=total_customers,
            cars=total_cars,
            active_orders=active_orders,
            completed_orders=completed_orders,
            revenue=revenue,
            today_orders=today_orders,
            recent_activity=[]
        )
