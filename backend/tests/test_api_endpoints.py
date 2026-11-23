"""
Integration tests for the API endpoints.

Tests verify endpoint accessibility, response formats, validation,
and middleware behaviour (CORS, security headers) using the FastAPI
TestClient with mocked service dependencies.
"""

from __future__ import annotations

from unittest.mock import AsyncMock, MagicMock, patch

import pytest

from models.schemas import AirQualityResponse


class TestHealthCheck:
    """Tests for the health check endpoint."""

    def test_health_check(self, app_client):
        """Health endpoint should return 200 with status 'healthy'."""
        response = app_client.get("/api/v1/health")
        assert response.status_code == 200
        data = response.json()
        assert data["status"] == "healthy"
        assert "timestamp" in data

    def test_root_endpoint(self, app_client):
        """Root endpoint should return API info."""
        response = app_client.get("/")
        assert response.status_code == 200
        data = response.json()
        assert data["name"] == "Urban Air Quality Assistant API"
        assert "endpoints" in data


class TestAirQualityEndpoints:
    """Tests for air quality data endpoints."""

    @patch("routers.air_quality.aqi_service")
    def test_get_air_quality_valid_city(self, mock_service, app_client):
        """Should return AQI data for a valid city."""
        mock_response = AirQualityResponse(
            aqi=156,
            city="Delhi, India",
            dominant_pollutant="pm25",
            pollutants={"PM2.5": 156.0, "PM10": 89.0},
            weather={"temperature": 18.5},
            timestamp="2024-01-15T10:00:00+05:30",
            health_level="Unhealthy",
            health_advice="Limit outdoor activities.",
        )
        mock_service.get_city_aqi = AsyncMock(return_value=mock_response)

        response = app_client.get("/api/v1/air-quality/delhi")
        assert response.status_code == 200
        data = response.json()
        assert data["aqi"] == 156
        assert data["city"] == "Delhi, India"
        assert data["health_level"] == "Unhealthy"

    @patch("routers.air_quality.aqi_service")
    def test_get_air_quality_invalid_city_returns_404(self, mock_service, app_client):
        """Should return 404 for an unknown city."""
        from services.aqi_service import CityNotFoundError
        mock_service.get_city_aqi = AsyncMock(
            side_effect=CityNotFoundError("nonexistent")
        )

        response = app_client.get("/api/v1/air-quality/nonexistent")
        assert response.status_code == 404


class TestAssistantEndpoints:
    """Tests for AI assistant endpoints."""

    @patch("routers.assistant.gemini_service")
    @patch("routers.assistant.aqi_service")
    def test_chat_endpoint_valid_request(self, mock_aqi, mock_gemini, app_client):
        """Chat endpoint should return response and suggestions."""
        mock_aqi.get_city_aqi = AsyncMock(return_value=MagicMock(
            model_dump=MagicMock(return_value={"aqi": 150, "health_level": "Unhealthy"})
        ))
        mock_gemini.chat = AsyncMock(return_value={
            "response": "Stay indoors today.",
            "suggestions": ["What mask to wear?"],
        })

        response = app_client.post("/api/v1/assistant/chat", json={
            "message": "Is it safe outside?",
            "city": "Delhi",
        })

        assert response.status_code == 200
        data = response.json()
        assert "response" in data
        assert "suggestions" in data

    def test_chat_endpoint_empty_message_returns_422(self, app_client):
        """Chat with empty message should return 422 validation error."""
        response = app_client.post("/api/v1/assistant/chat", json={
            "message": "",
            "city": "Delhi",
        })
        assert response.status_code == 422

    @patch("routers.assistant.gemini_service")
    @patch("routers.assistant.aqi_service")
    def test_routines_endpoint(self, mock_aqi, mock_gemini, app_client):
        """Routines endpoint should return structured routine data."""
        mock_aqi.get_city_aqi = AsyncMock(return_value=MagicMock(
            model_dump=MagicMock(return_value={"aqi": 100, "health_level": "Moderate"})
        ))
        mock_gemini.generate_routines = AsyncMock(return_value={
            "routines": [{
                "time_of_day": "7:00 AM",
                "activity": "Morning yoga",
                "emission_impact": "low",
                "alternative": "Indoor exercise",
                "health_tip": "Exercise indoors on high AQI days",
            }],
        })

        response = app_client.post("/api/v1/assistant/routines", json={
            "city": "Delhi",
            "lifestyle": "family_with_kids",
        })

        assert response.status_code == 200
        data = response.json()
        assert "routines" in data
        assert len(data["routines"]) >= 1

    @patch("routers.assistant.gemini_service")
    @patch("routers.assistant.aqi_service")
    def test_indoor_hacks_endpoint(self, mock_aqi, mock_gemini, app_client):
        """Indoor hacks endpoint should return hack recommendations."""
        mock_aqi.get_city_aqi = AsyncMock(return_value=MagicMock(
            model_dump=MagicMock(return_value={"aqi": 200, "health_level": "Unhealthy"})
        ))
        mock_gemini.generate_indoor_hacks = AsyncMock(return_value={
            "hacks": [{
                "title": "Indoor Plants",
                "description": "Add air-purifying plants",
                "effectiveness": "medium",
                "cost": "$10-30",
                "diy_steps": ["Buy plants", "Place them"],
            }],
            "estimated_improvement": "20-30% PM2.5 reduction",
        })

        response = app_client.post("/api/v1/assistant/indoor-hacks", json={
            "room_type": "bedroom",
            "budget": "low",
            "city": "Delhi",
        })

        assert response.status_code == 200
        data = response.json()
        assert "hacks" in data

    @patch("routers.assistant.gemini_service")
    @patch("routers.assistant.aqi_service")
    def test_impact_endpoint(self, mock_aqi, mock_gemini, app_client):
        """Impact endpoint should return CO2 reduction analysis."""
        mock_aqi.get_city_aqi = AsyncMock(return_value=MagicMock(
            model_dump=MagicMock(return_value={"aqi": 150, "health_level": "Unhealthy"})
        ))
        mock_gemini.generate_impact_analysis = AsyncMock(return_value={
            "impact_summary": "Great potential for improvement!",
            "co2_reduction_kg": 2400.0,
            "health_benefit": "Fewer sick days",
            "community_impact": "Significant if widely adopted",
            "tips": ["Use public transport"],
        })

        response = app_client.post("/api/v1/assistant/impact", json={
            "current_habits": ["Drives car daily"],
            "proposed_changes": ["Switch to public transport"],
            "city": "Delhi",
        })

        assert response.status_code == 200
        data = response.json()
        assert data["co2_reduction_kg"] == 2400.0


class TestSecurityHeaders:
    """Tests for security middleware."""

    def test_security_headers_present(self, app_client):
        """All security headers should be present in responses."""
        response = app_client.get("/api/v1/health")

        assert response.headers.get("X-Content-Type-Options") == "nosniff"
        assert response.headers.get("X-Frame-Options") == "DENY"
        assert response.headers.get("X-XSS-Protection") == "1; mode=block"
        assert "strict-origin" in response.headers.get("Referrer-Policy", "").lower()

    def test_cors_headers_on_options(self, app_client):
        """CORS preflight should return appropriate headers."""
        response = app_client.options(
            "/api/v1/health",
            headers={
                "Origin": "http://localhost:5173",
                "Access-Control-Request-Method": "GET",
            },
        )
        # CORS middleware should respond
        assert response.status_code in (200, 204)
