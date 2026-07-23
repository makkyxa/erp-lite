import time
import uuid
import logging

logger = logging.getLogger("erp_lite")

class CombinedASGIMiddleware:
    def __init__(self, app):
        self.app = app

    async def __call__(self, scope, receive, send):
        if scope["type"] != "http":
            await self.app(scope, receive, send)
            return

        headers = dict(scope.get("headers", []))
        request_id = headers.get(b"x-request-id", b"").decode("utf-8")
        if not request_id:
            request_id = str(uuid.uuid4())

        if "state" not in scope:
            scope["state"] = {}
        scope["state"]["request_id"] = request_id

        client = scope.get("client")
        client_ip = client[0] if client else "unknown"
        path = scope.get("path", "")
        method = scope.get("method", "")
        
        logger.info(f"Request: ID={request_id} Method={method} Path={path} IP={client_ip}")

        start_time = time.perf_counter()

        async def send_wrapper(message):
            if message["type"] == "http.response.start":
                msg_headers = message.setdefault("headers", [])
                
                msg_headers.append((b"x-request-id", request_id.encode("utf-8")))
                
                process_time = time.perf_counter() - start_time
                msg_headers.append((b"x-process-time", f"{process_time:.4f}s".encode("utf-8")))

                status_code = message.get("status")
                logger.info(f"Response: ID={request_id} Status={status_code} Duration={process_time:.4f}s")

            await send(message)

        try:
            await self.app(scope, receive, send_wrapper)
        except Exception as exc:
            process_time = time.perf_counter() - start_time
            logger.error(f"Request Failed: ID={request_id} Error={str(exc)} Duration={process_time:.4f}s")
            raise exc
