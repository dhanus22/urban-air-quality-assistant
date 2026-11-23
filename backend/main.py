"""
Urban Air Quality Assistant — FastAPI Application Entry Point.

This module initializes the FastAPI application with security middleware,
CORS configuration, rate limiting, and API routers. It provides a health
check endpoint and conditionally exposes API documentation based on the
deployment environment.
"""

from __future__ import annotations

import logging
from contextlib import asynccontextmanager
from datetime import datetime, timezone

from fastapi import FastAPI, Request
from fastapi.middleware.cors import CORSMiddleware
from fastapi.responses import JSONResponse

from config import get_settings
from middleware.security import setup_security
from routers import air_quality, assistant

# Configure logging
logging.basicConfig(
    level=logging.INFO,
    format="%(asctime)s - %(name)s - %(levelname)s - %(message)s",
)
logger = logging.getLogger(__name__)


@asynccontextmanager
async def lifespan(app: FastAPI):
    """Application lifespan context manager for startup/shutdown events.

    Handles initialization and cleanup of shared resources like
    HTTP clients and service instances.

    Args:
        app: The FastAPI application instance.
    """
    logger.info("🌬️ Urban Air Quality Assistant API starting up...")
    logger.info("Environment: %s", get_settings().ENVIRONMENT)
    yield
    # Cleanup: close HTTP clients
    logger.info("Shutting down — closing HTTP clients...")
    await air_quality.aqi_service.close()
    await assistant.aqi_service.close()
    logger.info("Shutdown complete.")


# --- Application Factory ---

settings = get_settings()

app = FastAPI(
    title="Urban Air Quality Assistant API",
    description=(
        "A GenAI-powered API that helps families and communities navigate "
        "severe winter smog and urban air pollution. Provides real-time AQI data, "
        "personalized AI guidance, low-emission daily routines, indoor air quality "
        "hacks, and environmental impact analysis."
    ),
    version="1.0.0",
    lifespan=lifespan,
    docs_url=None if settings.is_production else "/docs",
    redoc_url=None if settings.is_production else "/redoc",
    openapi_url=None if settings.is_production else "/openapi.json",
)

# --- Middleware Stack ---

# 1. CORS — must be added before other middleware
app.add_middleware(
    CORSMiddleware,
    allow_origins=settings.allowed_origins_list,
    allow_credentials=True,
    allow_methods=["GET", "POST", "OPTIONS"],
    allow_headers=["Content-Type", "Authorization", "Accept"],
    expose_headers=["X-RateLimit-Limit", "X-RateLimit-Remaining"],
)

# 2. Security headers + Rate limiting
setup_security(app)

# --- Routers ---

app.include_router(air_quality.router)
app.include_router(assistant.router)


# --- Root Endpoints ---

@app.get(
    "/",
    summary="API Information",
    description="Returns basic API information and available endpoints.",
    tags=["General"],
)
async def root() -> dict:
    """Root endpoint with API information.

    Returns:
        Dict with API name, version, and available endpoint groups.
    """
    return {
        "name": "Urban Air Quality Assistant API",
        "version": "1.0.0",
        "description": "GenAI-powered air quality guidance for families and communities",
        "endpoints": {
            "air_quality": "/api/v1/air-quality/{city}",
            "chat": "/api/v1/assistant/chat",
            "routines": "/api/v1/assistant/routines",
            "indoor_hacks": "/api/v1/assistant/indoor-hacks",
            "impact": "/api/v1/assistant/impact",
            "health": "/api/v1/health",
            "docs": "/docs" if not settings.is_production else "Disabled in production",
        },
    }


@app.get(
    "/api/v1/health",
    summary="Health check",
    description="Returns the health status of the API.",
    tags=["General"],
)
async def health_check() -> dict:
    """Health check endpoint for monitoring.

    Returns:
        Dict with health status and timestamp.
    """
    return {
        "status": "healthy",
        "timestamp": datetime.now(timezone.utc).isoformat(),
        "environment": settings.ENVIRONMENT,
    }


# --- Global Exception Handler ---

@app.exception_handler(Exception)
async def global_exception_handler(request: Request, exc: Exception) -> JSONResponse:
    """Catch-all exception handler to prevent stack trace leakage.

    Args:
        request: The incoming HTTP request.
        exc: The unhandled exception.

    Returns:
        JSONResponse with a safe error message.
    """
    logger.error("Unhandled exception: %s", exc, exc_info=True)
    return JSONResponse(
        status_code=500,
        content={
            "detail": "An internal server error occurred. Please try again later.",
            "status_code": 500,
        },
    )
