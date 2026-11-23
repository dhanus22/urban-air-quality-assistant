"""
Air Quality Index data service.

Provides async access to real-time AQI data from the WAQI (World Air
Quality Index) API with TTL-based caching to minimize redundant requests.
"""

from __future__ import annotations

import logging
from datetime import datetime, timezone
from typing import Any
import httpx

try:
    from cachetools import TTLCache
except ImportError:
    import time

    class TTLCache(dict):  # type: ignore
        """Fallback in-memory TTL Cache if cachetools is not installed."""
        def __init__(self, maxsize: int = 100, ttl: int = 300) -> None:
            super().__init__()
            self.maxsize = maxsize
            self.ttl = ttl
            self._timestamps: dict[str, float] = {}

        def __setitem__(self, key: str, value: Any) -> None:
            if len(self) >= self.maxsize and key not in self:
                oldest_key = min(self._timestamps, key=lambda k: self._timestamps[k])
                del self[oldest_key]
                del self._timestamps[oldest_key]
            super().__setitem__(key, value)
            self._timestamps[key] = time.time()

        def __getitem__(self, key: str) -> Any:
            if super().__contains__(key):
                if time.time() - self._timestamps.get(key, 0) > self.ttl:
                    super().__delitem__(key)
                    self._timestamps.pop(key, None)
                    raise KeyError(key)
                return super().__getitem__(key)
            raise KeyError(key)

        def __contains__(self, key: object) -> bool:
            try:
                self[str(key)]
                return True
            except KeyError:
                return False

from config import get_settings
from models.schemas import AirQualityResponse, SearchResult

logger = logging.getLogger(__name__)


class AQIServiceError(Exception):
    """Base exception for AQI service errors."""

    def __init__(self, message: str, status_code: int = 500) -> None:
        self.message = message
        self.status_code = status_code
        super().__init__(self.message)


class CityNotFoundError(AQIServiceError):
    """Raised when the requested city or station is not found."""

    def __init__(self, city: str) -> None:
        super().__init__(
            message=f"City or station '{city}' not found. Please check the name and try again.",
            status_code=404,
        )


class AQIService:
    """Service for fetching and caching air quality data from WAQI API.

    This service provides methods to query AQI data by city name,
    geographic coordinates, or keyword search. Results are cached
    with a configurable TTL to minimize API calls.

    Attributes:
        _cache: TTL-based in-memory cache for AQI responses.
        _client: Async HTTP client for API requests.
        _base_url: WAQI API base URL.
        _token: WAQI API authentication token.
    """

    def __init__(self) -> None:
        """Initialize the AQI service with settings and cache."""
        settings = get_settings()
        self._base_url = settings.WAQI_BASE_URL
        self._token = settings.WAQI_API_TOKEN
        self._cache: TTLCache = TTLCache(
            maxsize=100,
            ttl=settings.CACHE_TTL_SECONDS,
        )
        self._client = httpx.AsyncClient(
            timeout=httpx.Timeout(10.0),
            follow_redirects=True,
        )

    async def close(self) -> None:
        """Close the HTTP client gracefully."""
        await self._client.aclose()

    async def get_city_aqi(self, city: str) -> AirQualityResponse:
        """Fetch air quality data for a specific city.

        Args:
            city: City name (e.g., 'delhi', 'beijing', 'london').

        Returns:
            AirQualityResponse with current AQI data.

        Raises:
            CityNotFoundError: If the city is not found.
            AQIServiceError: If the API request fails.
        """
        cache_key = f"city:{city.lower()}"
        if cache_key in self._cache:
            logger.debug("Cache hit for city: %s", city)
            return self._cache[cache_key]

        url = f"{self._base_url}/feed/{city}/"
        data = await self._make_request(url)
        response = self._parse_aqi_response(data)
        self._cache[cache_key] = response
        return response

    async def get_geo_aqi(self, lat: float, lng: float) -> AirQualityResponse:
        """Fetch air quality data for geographic coordinates.

        Args:
            lat: Latitude (-90 to 90).
            lng: Longitude (-180 to 180).

        Returns:
            AirQualityResponse with current AQI data.

        Raises:
            AQIServiceError: If the API request fails.
        """
        cache_key = f"geo:{lat:.4f},{lng:.4f}"
        if cache_key in self._cache:
            logger.debug("Cache hit for geo: %s,%s", lat, lng)
            return self._cache[cache_key]

        url = f"{self._base_url}/feed/geo:{lat};{lng}/"
        data = await self._make_request(url)
        response = self._parse_aqi_response(data)
        self._cache[cache_key] = response
        return response

    async def search_stations(self, keyword: str) -> list[SearchResult]:
        """Search for monitoring stations by keyword.

        Args:
            keyword: Search term (city name, station name, etc.).

        Returns:
            List of matching SearchResult objects.

        Raises:
            AQIServiceError: If the API request fails.
        """
        cache_key = f"search:{keyword.lower()}"
        if cache_key in self._cache:
            logger.debug("Cache hit for search: %s", keyword)
            return self._cache[cache_key]

        url = f"{self._base_url}/search/"
        try:
            response = await self._client.get(
                url,
                params={"keyword": keyword, "token": self._token},
            )
            response.raise_for_status()
            json_data = response.json()
        except httpx.HTTPError as exc:
            raise AQIServiceError(f"Failed to search stations: {exc}") from exc

        if json_data.get("status") != "ok":
            return []

        results = []
        for item in json_data.get("data", [])[:10]:  # Limit to 10 results
            try:
                aqi_val = item.get("aqi", 0)
                # AQI might be a string like "-" for unavailable
                aqi_int = int(aqi_val) if str(aqi_val).isdigit() else 0
                results.append(
                    SearchResult(
                        name=item.get("station", {}).get("name", "Unknown"),
                        aqi=aqi_int,
                        station_id=str(item.get("uid", "")),
                    )
                )
            except (ValueError, TypeError):
                continue

        self._cache[cache_key] = results
        return results

    async def _make_request(self, url: str) -> dict[str, Any]:
        """Make an authenticated request to the WAQI API.

        Args:
            url: Full API endpoint URL.

        Returns:
            Parsed JSON response data.

        Raises:
            CityNotFoundError: If the city/station is not found.
            AQIServiceError: If the request fails.
        """
        try:
            response = await self._client.get(
                url,
                params={"token": self._token},
            )
            response.raise_for_status()
            json_data = response.json()
        except httpx.TimeoutException as exc:
            raise AQIServiceError("AQI API request timed out. Please try again.") from exc
        except httpx.HTTPError as exc:
            raise AQIServiceError(f"Failed to fetch AQI data: {exc}") from exc

        if json_data.get("status") != "ok":
            error_msg = json_data.get("data", "Unknown error")
            if "Unknown station" in str(error_msg):
                raise CityNotFoundError(url.split("/feed/")[-1].rstrip("/"))
            raise AQIServiceError(f"WAQI API error: {error_msg}")

        return json_data.get("data", {})

    def _parse_aqi_response(self, data: dict[str, Any]) -> AirQualityResponse:
        """Parse raw WAQI API response into a structured AirQualityResponse.

        Args:
            data: Raw API response data dictionary.

        Returns:
            Structured AirQualityResponse with normalized data.
        """
        # Extract AQI value
        aqi = int(data.get("aqi", 0))

        # Extract city name
        city_info = data.get("city", {})
        city_name = city_info.get("name", "Unknown")

        # Extract individual pollutant values
        iaqi = data.get("iaqi", {})
        pollutants: dict[str, float] = {}
        pollutant_keys = {
            "pm25": "PM2.5",
            "pm10": "PM10",
            "no2": "NO2",
            "o3": "O3",
            "so2": "SO2",
            "co": "CO",
        }
        for api_key, display_name in pollutant_keys.items():
            if api_key in iaqi:
                pollutants[display_name] = float(iaqi[api_key].get("v", 0))

        # Extract weather data
        weather: dict[str, float] | None = None
        weather_keys = {"t": "temperature", "h": "humidity", "w": "wind", "p": "pressure"}
        weather_data = {}
        for api_key, display_name in weather_keys.items():
            if api_key in iaqi:
                weather_data[display_name] = float(iaqi[api_key].get("v", 0))
        if weather_data:
            weather = weather_data

        # Extract dominant pollutant
        dominant = data.get("dominentpol", None)

        # Extract timestamp
        time_info = data.get("time", {})
        timestamp = time_info.get("iso", datetime.now(timezone.utc).isoformat())

        # Classify AQI level
        health_level, health_advice = self._classify_aqi(aqi)

        return AirQualityResponse(
            aqi=aqi,
            city=city_name,
            dominant_pollutant=dominant,
            pollutants=pollutants,
            weather=weather,
            timestamp=timestamp,
            health_level=health_level,
            health_advice=health_advice,
        )

    @staticmethod
    def _classify_aqi(aqi: int) -> tuple[str, str]:
        """Classify AQI value into health level and advice.

        Args:
            aqi: Air Quality Index value (0-500+).

        Returns:
            Tuple of (health_level, health_advice) strings.
        """
        if aqi <= 50:
            return (
                "Good",
                "Air quality is satisfactory. It's a great day for outdoor activities!",
            )
        elif aqi <= 100:
            return (
                "Moderate",
                "Air quality is acceptable. Unusually sensitive individuals should "
                "consider limiting prolonged outdoor exertion.",
            )
        elif aqi <= 150:
            return (
                "Unhealthy for Sensitive Groups",
                "Members of sensitive groups (children, elderly, those with respiratory "
                "conditions) should reduce prolonged outdoor exertion. Consider wearing "
                "an N95 mask outdoors.",
            )
        elif aqi <= 200:
            return (
                "Unhealthy",
                "Everyone may begin to experience health effects. Sensitive groups may "
                "experience more serious effects. Limit outdoor activities and use air "
                "purifiers indoors.",
            )
        elif aqi <= 300:
            return (
                "Very Unhealthy",
                "Health alert! Everyone should significantly reduce outdoor exposure. "
                "Wear N95 masks if going outside is unavoidable. Keep windows closed "
                "and run air purifiers.",
            )
        else:
            return (
                "Hazardous",
                "HEALTH EMERGENCY! Avoid ALL outdoor activities. Stay indoors with "
                "windows sealed. Use air purifiers on maximum setting. Seek medical "
                "attention if experiencing respiratory symptoms.",
            )
