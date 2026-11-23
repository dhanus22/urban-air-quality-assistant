"""
Unit tests for the AQI data service.

Tests cover AQI classification logic, API response parsing,
caching behaviour, and error handling.
"""

from __future__ import annotations

import asyncio
from unittest.mock import AsyncMock, MagicMock, patch

import httpx
import pytest

from services.aqi_service import AQIService, AQIServiceError, CityNotFoundError


class TestClassifyAQI:
    """Tests for the AQI classification static method."""

    def test_classify_aqi_good(self):
        """AQI 0-50 should be classified as 'Good'."""
        level, advice = AQIService._classify_aqi(42)
        assert level == "Good"
        assert "satisfactory" in advice.lower()

    def test_classify_aqi_moderate(self):
        """AQI 51-100 should be classified as 'Moderate'."""
        level, advice = AQIService._classify_aqi(75)
        assert level == "Moderate"
        assert "acceptable" in advice.lower()

    def test_classify_aqi_unhealthy_sensitive(self):
        """AQI 101-150 should be 'Unhealthy for Sensitive Groups'."""
        level, advice = AQIService._classify_aqi(130)
        assert level == "Unhealthy for Sensitive Groups"
        assert "sensitive" in advice.lower()

    def test_classify_aqi_unhealthy(self):
        """AQI 151-200 should be classified as 'Unhealthy'."""
        level, advice = AQIService._classify_aqi(175)
        assert level == "Unhealthy"
        assert "health effects" in advice.lower()

    def test_classify_aqi_very_unhealthy(self):
        """AQI 201-300 should be classified as 'Very Unhealthy'."""
        level, advice = AQIService._classify_aqi(250)
        assert level == "Very Unhealthy"
        assert "health alert" in advice.lower()

    def test_classify_aqi_hazardous(self):
        """AQI 301+ should be classified as 'Hazardous'."""
        level, advice = AQIService._classify_aqi(450)
        assert level == "Hazardous"
        assert "emergency" in advice.lower()

    def test_classify_aqi_boundary_50(self):
        """AQI exactly 50 should be 'Good'."""
        level, _ = AQIService._classify_aqi(50)
        assert level == "Good"

    def test_classify_aqi_boundary_100(self):
        """AQI exactly 100 should be 'Moderate'."""
        level, _ = AQIService._classify_aqi(100)
        assert level == "Moderate"

    def test_classify_aqi_zero(self):
        """AQI 0 should be classified as 'Good'."""
        level, _ = AQIService._classify_aqi(0)
        assert level == "Good"


class TestParseAQIResponse:
    """Tests for WAQI API response parsing."""

    def setup_method(self):
        """Initialize service instance for each test."""
        self.service = AQIService()

    def test_parse_complete_response(self, mock_waqi_city_response):
        """Should correctly parse a complete WAQI response."""
        data = mock_waqi_city_response["data"]
        result = self.service._parse_aqi_response(data)

        assert result.aqi == 156
        assert result.city == "Delhi, India"
        assert result.dominant_pollutant == "pm25"
        assert result.health_level == "Unhealthy"
        assert "PM2.5" in result.pollutants
        assert result.pollutants["PM2.5"] == 156.0
        assert result.weather is not None
        assert result.weather["temperature"] == 18.5

    def test_parse_minimal_response(self):
        """Should handle response with minimal data gracefully."""
        data = {"aqi": 50, "city": {"name": "Test City"}, "iaqi": {}, "time": {}}
        result = self.service._parse_aqi_response(data)

        assert result.aqi == 50
        assert result.city == "Test City"
        assert result.pollutants == {}
        assert result.weather is None

    def test_parse_missing_city(self):
        """Should handle missing city info with 'Unknown' fallback."""
        data = {"aqi": 100, "iaqi": {}, "time": {}}
        result = self.service._parse_aqi_response(data)

        assert result.city == "Unknown"


class TestGetCityAQI:
    """Tests for the get_city_aqi method."""

    def setup_method(self):
        """Initialize service instance for each test."""
        self.service = AQIService()

    def test_get_city_aqi_success(self, mock_waqi_city_response):
        """Should return parsed AQI data for a valid city."""
        mock_response = MagicMock()
        mock_response.json.return_value = mock_waqi_city_response
        mock_response.raise_for_status = MagicMock()

        self.service._client = AsyncMock()
        self.service._client.get = AsyncMock(return_value=mock_response)

        result = asyncio.run(self.service.get_city_aqi("delhi"))

        assert result.aqi == 156
        assert result.city == "Delhi, India"
        assert result.health_level == "Unhealthy"

    def test_cache_hit(self, mock_waqi_city_response):
        """Second call for same city should use cache (no API call)."""
        mock_response = MagicMock()
        mock_response.json.return_value = mock_waqi_city_response
        mock_response.raise_for_status = MagicMock()

        self.service._client = AsyncMock()
        self.service._client.get = AsyncMock(return_value=mock_response)

        # First call — hits API
        result1 = asyncio.run(self.service.get_city_aqi("delhi"))
        # Second call — should use cache
        result2 = asyncio.run(self.service.get_city_aqi("delhi"))

        assert result1.aqi == result2.aqi
        # API should only be called once
        assert self.service._client.get.call_count == 1

    def test_city_not_found(self):
        """Should raise CityNotFoundError for unknown city."""
        mock_response = MagicMock()
        mock_response.json.return_value = {
            "status": "error",
            "data": "Unknown station",
        }
        mock_response.raise_for_status = MagicMock()

        self.service._client = AsyncMock()
        self.service._client.get = AsyncMock(return_value=mock_response)

        with pytest.raises(CityNotFoundError):
            asyncio.run(self.service.get_city_aqi("nonexistentcity12345"))


class TestSearchStations:
    """Tests for the search_stations method."""

    def setup_method(self):
        """Initialize service instance."""
        self.service = AQIService()

    def test_search_stations_success(self, mock_waqi_search_response):
        """Should return list of matching stations."""
        mock_response = MagicMock()
        mock_response.json.return_value = mock_waqi_search_response
        mock_response.raise_for_status = MagicMock()

        self.service._client = AsyncMock()
        self.service._client.get = AsyncMock(return_value=mock_response)

        results = asyncio.run(self.service.search_stations("delhi"))

        assert len(results) == 2
        assert results[0].name == "Delhi US Embassy"
        assert results[0].aqi == 156
