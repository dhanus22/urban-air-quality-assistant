"""
Security middleware for the Urban Air Quality Assistant API.

Provides:
- Security headers middleware (OWASP recommended headers)
- Rate limiter configuration using slowapi
- Input sanitization utilities
"""

from __future__ import annotations

import re

try:
    from slowapi import Limiter
    from slowapi.errors import RateLimitExceeded
    from slowapi.util import get_remote_address
except ImportError:
    class RateLimitExceeded(Exception):  # type: ignore
        pass

    def get_remote_address(request: Request) -> str:  # type: ignore
        return "127.0.0.1"

    class Limiter:  # type: ignore
        def __init__(self, key_func=None, default_limits=None, storage_uri=None):
            pass

        def limit(self, limit_value: str):
            def decorator(func):
                return func
            return decorator

from starlette.middleware.base import BaseHTTPMiddleware
from starlette.responses import JSONResponse

from config import get_settings


# --- Rate Limiter ---

settings = get_settings()

limiter = Limiter(
    key_func=get_remote_address,
    default_limits=[f"{settings.RATE_LIMIT_PER_MINUTE}/minute"],
    storage_uri="memory://",
)


def rate_limit_exceeded_handler(request: Request, exc: RateLimitExceeded) -> JSONResponse:
    """Handle rate limit exceeded errors with a JSON response.

    Args:
        request: The incoming HTTP request.
        exc: The rate limit exceeded exception.

    Returns:
        JSONResponse with 429 status code and retry information.
    """
    return JSONResponse(
        status_code=429,
        content={
            "detail": "Rate limit exceeded. Please slow down.",
            "status_code": 429,
        },
    )


# --- Security Headers Middleware ---

class SecurityHeadersMiddleware(BaseHTTPMiddleware):
    """Middleware that adds security-related HTTP headers to all responses.

    Implements OWASP recommended security headers to protect against
    common web vulnerabilities including clickjacking, XSS, MIME sniffing,
    and information leakage.
    """

    SECURITY_HEADERS: dict[str, str] = {
        "X-Content-Type-Options": "nosniff",
        "X-Frame-Options": "DENY",
        "X-XSS-Protection": "1; mode=block",
        "Strict-Transport-Security": "max-age=31536000; includeSubDomains",
        "Referrer-Policy": "strict-origin-when-cross-origin",
        "Permissions-Policy": (
            "accelerometer=(), camera=(), geolocation=(self), "
            "gyroscope=(), magnetometer=(), microphone=(), "
            "payment=(), usb=()"
        ),
        "Content-Security-Policy": (
            "default-src 'self'; "
            "script-src 'self' 'unsafe-inline'; "
            "style-src 'self' 'unsafe-inline'; "
            "img-src 'self' data: https:; "
            "font-src 'self' https:; "
            "connect-src 'self' https://api.waqi.info"
        ),
    }

    async def dispatch(self, request: Request, call_next) -> Response:
        """Add security headers to every response.

        Args:
            request: The incoming HTTP request.
            call_next: The next middleware or route handler.

        Returns:
            Response with security headers added.
        """
        response: Response = await call_next(request)
        for header_name, header_value in self.SECURITY_HEADERS.items():
            response.headers[header_name] = header_value
        return response


# --- Input Sanitization ---

# Regex pattern to match HTML tags and script content
_HTML_TAG_PATTERN = re.compile(r"<[^>]+>", re.IGNORECASE)
_SCRIPT_PATTERN = re.compile(
    r"<script[^>]*>.*?</script>",
    re.IGNORECASE | re.DOTALL,
)


def sanitize_input(text: str) -> str:
    """Sanitize user input by removing HTML tags and script content.

    This provides a basic layer of XSS protection for user-supplied text.
    Pydantic validation handles type checking; this handles content safety.

    Args:
        text: Raw user input string.

    Returns:
        Sanitized string with HTML/script content removed.

    Examples:
        >>> sanitize_input("Hello <script>alert('xss')</script> World")
        'Hello  World'
        >>> sanitize_input("Normal text without tags")
        'Normal text without tags'
    """
    # Remove script blocks first (including content)
    cleaned = _SCRIPT_PATTERN.sub("", text)
    # Remove remaining HTML tags
    cleaned = _HTML_TAG_PATTERN.sub("", cleaned)
    return cleaned.strip()


def setup_security(app: FastAPI) -> None:
    """Configure all security middleware on the FastAPI application.

    Args:
        app: The FastAPI application instance.
    """
    # Add security headers
    app.add_middleware(SecurityHeadersMiddleware)

    # Configure rate limiter
    app.state.limiter = limiter
    app.add_exception_handler(RateLimitExceeded, rate_limit_exceeded_handler)
