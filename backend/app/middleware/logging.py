import time
from fastapi import Request
from starlette.middleware.base import BaseHTTPMiddleware, RequestResponseEndpoint
from starlette.responses import Response
from app.core.logger import logger


class LoggingMiddleware(BaseHTTPMiddleware):
    async def dispatch(self, request: Request, call_next: RequestResponseEndpoint) -> Response:
        client_ip = request.client.host if request.client else "unknown"
        request_id = getattr(request.state, "request_id", "unknown")
        
        logger.info(
            f"Request: ID={request_id} Method={request.method} Path={request.url.path} IP={client_ip}"
        )
        
        start_time = time.perf_counter()
        try:
            response = await call_next(request)
            process_time = time.perf_counter() - start_time
            
            logger.info(
                f"Response: ID={request_id} Status={response.status_code} Duration={process_time:.4f}s"
            )
            return response
        except Exception as exc:
            process_time = time.perf_counter() - start_time
            logger.error(
                f"Request Failed: ID={request_id} Error={str(exc)} Duration={process_time:.4f}s"
            )
            raise
