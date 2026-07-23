import logging
import sys
from app.core.config import settings

LOG_FORMAT = "%(asctime)s - %(name)s - %(levelname)s - [%(filename)s:%(lineno)d] - %(message)s"

def setup_logging() -> None:
    root_logger = logging.getLogger()
    
    log_level = logging.DEBUG if settings.ENVIRONMENT == "development" else logging.INFO
    root_logger.setLevel(log_level)

    console_handler = logging.StreamHandler(sys.stdout)
    console_handler.setFormatter(logging.Formatter(LOG_FORMAT))
    
    root_logger.handlers = []
    root_logger.addHandler(console_handler)

    logging.getLogger("uvicorn.access").setLevel(logging.WARNING)
    logging.getLogger("sqlalchemy.engine").setLevel(
        logging.INFO if settings.ENVIRONMENT == "development" else logging.WARNING
    )

logger = logging.getLogger("erp_lite")
