"""
Shared pytest fixtures for the Urban Air Quality Assistant test suite.

Provides reusable fixtures for the FastAPI test client, mock API responses,
and environment variable setup.
"""

from __future__ import annotations

import os
from typing import Any
from unittest.mock import AsyncMock, MagicMock, patch

import pytest
from fastapi.testclient import TestClient


# Set test environment variables before importing app
os.environ["WAQI_API_TOKEN"] = "test_token"
os.environ["GEMINI_API_KEY"] = "test_gemini_key"
os.environ["ENVIRONMENT"] = "development"
os.environ["ALLOWED_ORIGINS"] = "http://localhost:3000,http://localhost:5173"


@pytest.fixture
def app_client():
    """Create a FastAPI TestClient for integration testing.

    Yields:
        TestClient: Configured test client instance.
    """
    from main import app
    with TestClient(app) as client:
        yield client


@pytest.fixture
def mock_waqi_city_response() -> dict[str, Any]:
    """Sample WAQI API response for city-level AQI data.

    Returns:
        Dict mimicking the WAQI API feed response structure.
    """
    return {
        "status": "ok",
        "data": {
            "aqi": 156,
            "idx": 1234,
            "dominentpol": "pm25",
            "city": {
                "name": "Delhi, India",
                "geo": [28.6139, 77.209],
            },
            "iaqi": {
                "pm25": {"v": 156},
                "pm10": {"v": 89},
                "no2": {"v": 42},
                "o3": {"v": 15},
                "so2": {"v": 8},
                "co": {"v": 12},
                "t": {"v": 18.5},
                "h": {"v": 65.0},
                "w": {"v": 3.2},
                "p": {"v": 1013.0},
            },
            "time": {
                "s": "2024-01-15 10:00:00",
                "iso": "2024-01-15T10:00:00+05:30",
            },
        },
    }


@pytest.fixture
def mock_waqi_search_response() -> dict[str, Any]:
    """Sample WAQI API response for station search.

    Returns:
        Dict mimicking the WAQI search endpoint response.
    """
    return {
        "status": "ok",
        "data": [
            {
                "uid": 1234,
                "aqi": 156,
                "station": {"name": "Delhi US Embassy"},
            },
            {
                "uid": 5678,
                "aqi": 142,
                "station": {"name": "Delhi Anand Vihar"},
            },
        ],
    }


@pytest.fixture
def mock_gemini_chat_response() -> str:
    """Sample Gemini AI chat response in JSON format.

    Returns:
        JSON string mimicking Gemini's structured chat response.
    """
    return '''{
        "response": "Based on the current AQI of 156 in Delhi, the air quality is **Unhealthy**. Here are my recommendations:\\n\\n- **Avoid outdoor exercise** — do yoga or stretching indoors instead\\n- **Wear an N95 mask** if you must go outside\\n- **Keep windows closed** and run your air purifier\\n- **Stay hydrated** to help your body cope with pollution\\n\\n⚠️ If you experience persistent coughing or breathing difficulty, consult a doctor.",
        "suggestions": [
            "What indoor exercises can I do?",
            "Best air purifiers under $100?",
            "When is the best time to ventilate my home?"
        ]
    }'''


@pytest.fixture
def mock_gemini_routine_response() -> str:
    """Sample Gemini AI routine response in JSON format.

    Returns:
        JSON string mimicking Gemini's structured routine response.
    """
    return '''{
        "routines": [
            {
                "time_of_day": "6:00 AM - 7:00 AM",
                "activity": "Indoor morning yoga and stretching",
                "emission_impact": "low",
                "alternative": "Replace outdoor jogging with indoor exercise",
                "health_tip": "Exercise indoors when AQI is above 100"
            },
            {
                "time_of_day": "7:00 AM - 8:00 AM",
                "activity": "Prepare breakfast with electric stove",
                "emission_impact": "low",
                "alternative": "Use induction cooktop instead of gas",
                "health_tip": "Turn on kitchen exhaust while cooking"
            }
        ]
    }'''
