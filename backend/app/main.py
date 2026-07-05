from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
from app.api.v1 import api_router
from app.core.config import settings
from app.core.exceptions import setup_exception_handlers
from app.core.logger import setup_logging
from app.middleware import CombinedASGIMiddleware

# Setup system logging configuration
setup_logging()

# Initialize FastAPI App
app = FastAPI(
    title="ERP Lite API",
    description="Backend API for Service Center ERP Lite application",
    version="1.0",
    docs_url="/docs",
    redoc_url="/redoc",
    openapi_url="/openapi.json",
)

# Custom Middlewares
app.add_middleware(CombinedASGIMiddleware)

# Configure CORS Middleware
if settings.BACKEND_CORS_ORIGINS:
    app.add_middleware(
        CORSMiddleware,
        allow_origins=settings.BACKEND_CORS_ORIGINS,
        allow_credentials=True,
        allow_methods=["*"],
        allow_headers=["*"],
    )

# Setup Global Exception Handlers
setup_exception_handlers(app)

# Include Router
app.include_router(api_router, prefix="/api/v1")


@app.get("/health", tags=["Health"], summary="Health check endpoint")
async def health_check():
    """Simple status check for container orchestration and uptime monitoring."""
    return {"status": "ok", "environment": settings.ENVIRONMENT}
