from fastapi import Request, status
from fastapi.responses import JSONResponse
import logging

logger = logging.getLogger(__name__)

class MasarException(Exception):
    """Base exception for Masar application"""
    def __init__(self, message: str, status_code: int = status.HTTP_500_INTERNAL_SERVER_ERROR, details: dict = None):
        self.message = message
        self.status_code = status_code
        self.details = details or {}
        super().__init__(self.message)

class NotFoundException(MasarException):
    def __init__(self, resource: str = "Resource", details: dict = None):
        super().__init__(
            message=f"{resource} not found",
            status_code=status.HTTP_404_NOT_FOUND,
            details=details
        )

class ValidationException(MasarException):
    def __init__(self, message: str = "Validation error", details: dict = None):
        super().__init__(
            message=message,
            status_code=status.HTTP_422_UNPROCESSABLE_ENTITY,
            details=details
        )

class UnauthorizedException(MasarException):
    def __init__(self, message: str = "Unauthorized", details: dict = None):
        super().__init__(
            message=message,
            status_code=status.HTTP_401_UNAUTHORIZED,
            details=details
        )

class AIProviderException(MasarException):
    def __init__(self, provider: str, message: str = "AI Provider error", details: dict = None):
        super().__init__(
            message=f"[{provider}] {message}",
            status_code=status.HTTP_502_BAD_GATEWAY,
            details=details
        )

async def masar_exception_handler(request: Request, exc: MasarException):
    logger.error(f"MasarException: {exc.message} (status: {exc.status_code})")
    return JSONResponse(
        status_code=exc.status_code,
        content={
            "error": True,
            "message": exc.message,
            "details": exc.details,
            "path": request.url.path,
        },
    )

async def global_exception_handler(request: Request, exc: Exception):
    logger.exception("Unhandled Exception Caught:")
    return JSONResponse(
        status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
        content={
            "error": True,
            "message": "Internal Server Error",
            "details": str(exc),
            "path": request.url.path,
        },
    )
