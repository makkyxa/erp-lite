from fastapi import FastAPI, Request
from fastapi.responses import JSONResponse
from app.core.logger import logger

class BaseERPException(Exception):
    def __init__(self, detail: str, status_code: int = 400):
        self.detail = detail
        self.status_code = status_code
        super().__init__(detail)

class NotFoundException(BaseERPException):
    def __init__(self, detail: str = "Resource not found"):
        super().__init__(detail=detail, status_code=404)

class UnauthorizedException(BaseERPException):
    def __init__(self, detail: str = "Unauthorized"):
        super().__init__(detail=detail, status_code=401)

class ForbiddenException(BaseERPException):
    def __init__(self, detail: str = "Forbidden"):
        super().__init__(detail=detail, status_code=403)

class ConflictException(BaseERPException):
    def __init__(self, detail: str = "Conflict"):
        super().__init__(detail=detail, status_code=409)

class BusinessLogicException(BaseERPException):
    def __init__(self, detail: str = "Business logic violation"):
        super().__init__(detail=detail, status_code=400)

def setup_exception_handlers(app: FastAPI) -> None:
    @app.exception_handler(BaseERPException)
    async def erp_exception_handler(request: Request, exc: BaseERPException):
        logger.warning(f"ERP Exception on {request.method} {request.url.path}: {exc.detail}")
        return JSONResponse(
            status_code=exc.status_code,
            content={
                "success": False,
                "detail": exc.detail
            }
        )

    @app.exception_handler(Exception)
    async def global_exception_handler(request: Request, exc: Exception):
        logger.exception(f"Unhandled Exception on {request.method} {request.url.path}: {str(exc)}")
        return JSONResponse(
            status_code=500,
            content={
                "success": False,
                "detail": "Internal server error"
            }
        )
