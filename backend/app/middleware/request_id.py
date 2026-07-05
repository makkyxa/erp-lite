import uuid
from fastapi import Request
from starlette.middleware.base import BaseHTTPMiddleware, RequestResponseEndpoint
from starlette.responses import Response


class RequestIDMiddleware(BaseHTTPMiddleware):
    async def dispatch(self, request: Request, call_next: RequestResponseEndpoint) -> Response:
        # Get request ID from headers if present, else generate new one
        request_id = request.headers.get("X-Request-ID")
        if not request_id:
            request_id = str(uuid.uuid4())
        
        # Attach request ID to request state so loggers and handlers can access it
        request.state.request_id = request_id
        
        # Process request
        response = await call_next(request)
        
        # Inject request ID into response headers
        response.headers["X-Request-ID"] = request_id
        return response
