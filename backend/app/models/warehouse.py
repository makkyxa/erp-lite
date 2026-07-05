import uuid
from datetime import datetime
from typing import Optional
from sqlalchemy import CheckConstraint, DateTime, ForeignKey, Numeric, String, Integer, func
from sqlalchemy.orm import Mapped, mapped_column, relationship
from app.database.database import Base


class WarehouseItem(Base):
    __tablename__ = "warehouse_items"

    id: Mapped[uuid.UUID] = mapped_column(primary_key=True, default=uuid.uuid4)
    name: Mapped[str] = mapped_column(String(255), nullable=False)
    sku: Mapped[str] = mapped_column(String(100), unique=True, index=True, nullable=False)
    quantity: Mapped[int] = mapped_column(Integer, default=0, nullable=False)
    price: Mapped[float] = mapped_column(Numeric(10, 2), default=0.00, nullable=False)
    min_stock: Mapped[int] = mapped_column(Integer, default=0, nullable=False)
    supplier: Mapped[str] = mapped_column(String(255), nullable=True)

    created_by: Mapped[Optional[uuid.UUID]] = mapped_column(
        ForeignKey("users.id", ondelete="SET NULL"), nullable=True
    )

    created_at: Mapped[datetime] = mapped_column(
        DateTime(timezone=True), server_default=func.now(), nullable=False
    )
    updated_at: Mapped[datetime] = mapped_column(
        DateTime(timezone=True), server_default=func.now(), onupdate=func.now(), nullable=False
    )

    # Relationships
    creator: Mapped[Optional["User"]] = relationship()

    __table_args__ = (
        CheckConstraint("quantity >= 0", name="check_warehouse_item_quantity"),
        CheckConstraint("price >= 0.0", name="check_warehouse_item_price"),
        CheckConstraint("min_stock >= 0", name="check_warehouse_item_min_stock"),
    )
