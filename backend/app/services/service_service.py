import uuid
from typing import List
from sqlalchemy.ext.asyncio import AsyncSession
from app.repositories.service_repository import ServiceRepository
from app.models.service import Service
from app.schemas.service import ServiceCreate, ServiceUpdate
from app.core.exceptions import NotFoundException, ConflictException

class ServiceService:
    def __init__(self, db: AsyncSession):
        self.db = db
        self.service_repo = ServiceRepository(db)

    async def create_service(self, service_in: ServiceCreate) -> Service:
        existing = await self.service_repo.get_by_name(service_in.name)
        if existing:
            raise ConflictException("Service with this name already exists")

        service = await self.service_repo.create(obj_in=service_in.model_dump())
        return service

    async def get_service(self, service_id: uuid.UUID) -> Service:
        service = await self.service_repo.get(service_id)
        if not service:
            raise NotFoundException("Service not found")
        return service

    async def get_services(self, skip: int = 0, limit: int = 100) -> List[Service]:
        return await self.service_repo.get_multi(skip=skip, limit=limit)

    async def update_service(self, service_id: uuid.UUID, service_in: ServiceUpdate) -> Service:
        service = await self.get_service(service_id)

        obj_data = service_in.model_dump(exclude_unset=True)
        if "name" in obj_data:
            existing = await self.service_repo.get_by_name(obj_data["name"])
            if existing and existing.id != service_id:
                raise ConflictException("Another service with this name already exists")

        return await self.service_repo.update(db_obj=service, obj_in=obj_data)

    async def delete_service(self, service_id: uuid.UUID) -> Service:
        service = await self.get_service(service_id)
        return await self.service_repo.remove(id=service_id)
