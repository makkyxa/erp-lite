import asyncio
import sys
import os

sys.path.append(os.path.dirname(os.path.abspath(__file__)))

from sqlalchemy import select
from app.database.session import SessionLocal
from app.models.user import User, UserRole
from app.core.security import get_password_hash

async def seed_admin():
    print("Connecting to database for seeding...")
    async with SessionLocal() as db:
        try:
            query = select(User).where(User.role == UserRole.ADMIN)
            result = db.execute(query)
            db_res = await db.execute(query)
            admin = db_res.scalars().first()

            if admin:
                print(f"Administrator account already exists (username: {admin.username}).")
                return

            print("No admin user found. Creating default admin account...")
            default_admin = User(
                username="admin",
                email="admin@crmlite.com",
                password_hash=get_password_hash("adminpassword"),
                full_name="System Administrator",
                role=UserRole.ADMIN,
                is_active=True
            )
            db.add(default_admin)
            await db.commit()
            print("Default admin account successfully created!")
            print("Credentials:")
            print("  Username: admin")
            print("  Password: adminpassword")
            print("  Email:    admin@crmlite.com")

        except Exception as e:
            print(f"Error during seeding: {e}")
            await db.rollback()

if __name__ == "__main__":
    asyncio.run(seed_admin())
