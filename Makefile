.PHONY: up down restart build logs shell-backend shell-frontend migrate-create migrate-apply test-backend

up:
	docker compose up -d

down:
	docker compose down

restart:
	docker compose down && docker compose up -d

build:
	docker compose up -d --build

logs:
	docker compose logs -f

shell-backend:
	docker compose exec backend sh

shell-frontend:
	docker compose exec frontend sh

migrate-create:
	docker compose exec backend alembic revision --autogenerate -m "$(msg)"

migrate-apply:
	docker compose exec backend alembic upgrade head

test-backend:
	docker compose exec backend pytest
