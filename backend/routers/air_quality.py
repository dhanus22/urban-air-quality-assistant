"""
Air quality data API endpoints.

Provides real-time AQI data retrieval by city name, geographic coordinates,
or keyword search. All endpoints include rate limiting and structured error
responses.
"""

from __future__ import annotations

import logging

from fastapi import APIRouter, HTTPException, Path, Query, Request
from middleware.security import limiter, sanitize_input
from models.schemas import AirQualityResponse, ErrorResponse, SearchResult
from services.aqi_service import AQIService, AQIServiceError, CityNotFoundError

logger = logging.getLogger(__name__)

router = APIRouter(
    prefix="/api/v1/air-quality",
    tags=["Air Quality"],
    responses={
        404: {"model": ErrorResponse, "description": "City not found"},
        429: {"model": ErrorResponse, "description": "Rate limit exceeded"},
        500: {"model": ErrorResponse, "description": "Internal server error"},
    },
)

# Service instance (initialized once, reused across requests)
aqi_service = AQIService()


@router.get(
    "",
    response_model=AirQualityResponse,
    include_in_schema=False,
)
@limiter.limit("30/minute")
async def get_air_quality_by_query(
    request: Request,
    city: str = Query(..., min_length=1, max_length=100, description="City name"),
) -> AirQualityResponse:
    """Query parameter alias for get_air_quality_by_city."""
    return await get_air_quality_by_city(request, city)


@router.get(
    "/geo",
    response_model=AirQualityResponse,
    include_in_schema=False,
)
@limiter.limit("30/minute")
async def get_air_quality_by_geo_query(
    request: Request,
    lat: float = Query(..., ge=-90.0, le=90.0),
    lng: float = Query(..., ge=-180.0, le=180.0),
) -> AirQualityResponse:
    """Query parameter alias for get_air_quality_by_geo."""
    return await get_air_quality_by_geo(request, lat, lng)


@router.get(
    "/{city}",
    response_model=AirQualityResponse,
    summary="Get air quality by city name",
    description="Fetch real-time Air Quality Index data for a specific city. "
    "Data includes AQI value, pollutant breakdown, weather conditions, "
    "and health advisory information.",
)
@limiter.limit("30/minute")
async def get_air_quality_by_city(
    request: Request,
    city: str = Path(
        ...,
        min_length=1,
        max_length=100,
        description="City name (e.g., 'delhi', 'beijing', 'london')",
        examples=["delhi", "london", "new york"],
    ),
) -> AirQualityResponse:
    """Get AQI data for a city by name.

    Args:
        request: FastAPI request object (required by rate limiter).
        city: City name to query.

    Returns:
        AirQualityResponse with current air quality data.

    Raises:
        HTTPException: 404 if city not found, 500 for service errors.
    """
    sanitized_city = sanitize_input(city)
    try:
        return await aqi_service.get_city_aqi(sanitized_city)
    except CityNotFoundError as exc:
        raise HTTPException(status_code=404, detail=exc.message) from exc
    except AQIServiceError as exc:
        logger.error("AQI service error for city '%s': %s", city, exc.message)
        raise HTTPException(status_code=exc.status_code, detail=exc.message) from exc


@router.get(
    "/geo/{lat}/{lng}",
    response_model=AirQualityResponse,
    summary="Get air quality by coordinates",
    description="Fetch real-time AQI data using geographic coordinates. "
    "Useful for geolocation-based queries.",
)
@limiter.limit("30/minute")
async def get_air_quality_by_geo(
    request: Request,
    lat: float = Path(
        ...,
        ge=-90.0,
        le=90.0,
        description="Latitude (-90 to 90)",
        examples=[28.6139],
    ),
    lng: float = Path(
        ...,
        ge=-180.0,
        le=180.0,
        description="Longitude (-180 to 180)",
        examples=[77.209],
    ),
) -> AirQualityResponse:
    """Get AQI data by geographic coordinates.

    Args:
        request: FastAPI request object.
        lat: Latitude value.
        lng: Longitude value.

    Returns:
        AirQualityResponse with current air quality data.
    """
    try:
        return await aqi_service.get_geo_aqi(lat, lng)
    except AQIServiceError as exc:
        logger.error("AQI service error for geo (%s, %s): %s", lat, lng, exc.message)
        raise HTTPException(status_code=exc.status_code, detail=exc.message) from exc


@router.get(
    "/search/{keyword}",
    response_model=list[SearchResult],
    summary="Search monitoring stations",
    description="Search for air quality monitoring stations by keyword. "
    "Returns station names, current AQI, and station IDs.",
)
@limiter.limit("30/minute")
async def search_stations(
    request: Request,
    keyword: str = Path(
        ...,
        min_length=1,
        max_length=100,
        description="Search keyword (city or station name)",
        examples=["delhi", "mumbai"],
    ),
) -> list[SearchResult]:
    """Search for monitoring stations matching a keyword.

    Args:
        request: FastAPI request object.
        keyword: Search term.

    Returns:
        List of matching SearchResult objects.
    """
    sanitized_keyword = sanitize_input(keyword)
    try:
        return await aqi_service.search_stations(sanitized_keyword)
    except AQIServiceError as exc:
        logger.error("Station search error for '%s': %s", keyword, exc.message)
        raise HTTPException(status_code=exc.status_code, detail=exc.message) from exc


@router.get(
    "/search",
    response_model=list[SearchResult],
    include_in_schema=False,
)
@limiter.limit("30/minute")
async def search_stations_query(
    request: Request,
    q: str = Query(..., min_length=1, max_length=100),
) -> list[SearchResult]:
    """Query parameter alias for search_stations."""
    return await search_stations(request, q)
