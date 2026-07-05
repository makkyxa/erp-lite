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
        """
        Compute total customers, cars, active orders, completed orders,
        overall revenue, today's order count, and audit trails.
        For ENGINEER, filters results to only show items assigned to them and hides revenue.
        """
        if current_user.role == UserRole.ENGINEER:
            # 1. Count customers with orders assigned to this engineer
            cust_query = select(func.count(func.distinct(Order.customer_id))).where(Order.engineer_id == current_user.id)
            cust_res = await self.db.execute(cust_query)
            total_customers = cust_res.scalar() or 0

            # 2. Count cars with orders assigned to this engineer
            car_query = select(func.count(func.distinct(Order.car_id))).where(Order.engineer_id == current_user.id)
            car_res = await self.db.execute(car_query)
            total_cars = car_res.scalar() or 0

            # 3. Active orders count assigned to this engineer
            active_query = select(func.count(Order.id)).where(
                Order.engineer_id == current_user.id,
                Order.status.notin_([OrderStatus.DELIVERED, OrderStatus.CANCELLED])
            )
            active_res = await self.db.execute(active_query)
            active_orders = active_res.scalar() or 0

            # 4. Completed orders count assigned to this engineer
            comp_query = select(func.count(Order.id)).where(
                Order.engineer_id == current_user.id,
                Order.status == OrderStatus.DELIVERED
            )
            comp_res = await self.db.execute(comp_query)
            completed_orders = comp_res.scalar() or 0

            # 5. Revenue is hidden (0.0) for engineers
            revenue = 0.0

            # 6. Today's orders count assigned to this engineer
            today_query = select(func.count(Order.id)).where(
                Order.engineer_id == current_user.id,
                func.date(Order.created_at) == func.current_date()
            )
            today_res = await self.db.execute(today_query)
            today_orders = today_res.scalar() or 0
        else:
            # ADMIN / MANAGER - see all stats
            # 1. Count customers
            cust_query = select(func.count(Customer.id))
            cust_res = await self.db.execute(cust_query)
            total_customers = cust_res.scalar() or 0

            # 2. Count cars
            car_query = select(func.count(Car.id))
            car_res = await self.db.execute(car_query)
            total_cars = car_res.scalar() or 0

            # 3. Active orders count (status not in DELIVERED or CANCELLED)
            active_query = select(func.count(Order.id)).where(
                Order.status.notin_([OrderStatus.DELIVERED, OrderStatus.CANCELLED])
            )
            active_res = await self.db.execute(active_query)
            active_orders = active_res.scalar() or 0

            # 4. Completed orders count (DELIVERED status)
            comp_query = select(func.count(Order.id)).where(
                Order.status == OrderStatus.DELIVERED
            )
            comp_res = await self.db.execute(comp_query)
            completed_orders = comp_res.scalar() or 0

            # 5. Total revenue (Sum of completed payments)
            rev_query = select(func.sum(Payment.amount)).where(
                Payment.payment_status == PaymentStatus.COMPLETED
            )
            rev_res = await self.db.execute(rev_query)
            revenue = float(rev_res.scalar() or 0.0)

            # 6. Today's order count
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
