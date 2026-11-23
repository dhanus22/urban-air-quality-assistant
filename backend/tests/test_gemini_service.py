"""
Unit tests for the Gemini AI service.

All tests use mocked Gemini API calls to verify response parsing,
error handling, and prompt construction.
"""

from __future__ import annotations

import asyncio
import json
from unittest.mock import MagicMock, patch

import pytest

from services.gemini_service import GeminiService, GeminiServiceError


class TestGeminiServiceChat:
    """Tests for the chat method."""

    def setup_method(self):
        """Initialize service with mocked client."""
        self.service = GeminiService()
        self.service._client = MagicMock()

    def test_chat_response_format(self, mock_gemini_chat_response):
        """Chat should return dict with 'response' and 'suggestions' keys."""
        mock_response = MagicMock()
        mock_response.text = mock_gemini_chat_response
        self.service._client.models.generate_content = MagicMock(return_value=mock_response)

        result = asyncio.run(
            self.service.chat(
                message="Is it safe to go outside?",
                city="Delhi",
                aqi_data={"aqi": 156, "health_level": "Unhealthy"},
            )
        )

        assert "response" in result
        assert "suggestions" in result
        assert isinstance(result["suggestions"], list)
        assert len(result["suggestions"]) > 0

    def test_chat_with_context(self, mock_gemini_chat_response):
        """Chat should accept and use optional context."""
        mock_response = MagicMock()
        mock_response.text = mock_gemini_chat_response
        self.service._client.models.generate_content = MagicMock(return_value=mock_response)

        result = asyncio.run(
            self.service.chat(
                message="How to protect my kids?",
                city="Delhi",
                context="family with 2 children under 10",
            )
        )

        assert "response" in result


class TestGeminiServiceRoutines:
    """Tests for the generate_routines method."""

    def setup_method(self):
        """Initialize service with mocked client."""
        self.service = GeminiService()
        self.service._client = MagicMock()

    def test_generate_routines_family(self, mock_gemini_routine_response):
        """Should generate routine items for family lifestyle."""
        mock_response = MagicMock()
        mock_response.text = mock_gemini_routine_response
        self.service._client.models.generate_content = MagicMock(return_value=mock_response)

        result = asyncio.run(
            self.service.generate_routines(
                city="Delhi",
                lifestyle="family_with_kids",
                aqi_level="Unhealthy",
            )
        )

        assert "routines" in result
        assert len(result["routines"]) >= 2
        assert "time_of_day" in result["routines"][0]
        assert "emission_impact" in result["routines"][0]


class TestGeminiServiceIndoorHacks:
    """Tests for the generate_indoor_hacks method."""

    def setup_method(self):
        """Initialize service with mocked client."""
        self.service = GeminiService()
        self.service._client = MagicMock()

    def test_generate_indoor_hacks(self):
        """Should generate indoor hack recommendations."""
        mock_text = json.dumps({
            "hacks": [
                {
                    "title": "Wet Mop Daily",
                    "description": "Use a damp mop to trap fine particles on floors.",
                    "effectiveness": "medium",
                    "cost": "Free",
                    "diy_steps": ["Get a mop", "Dampen it", "Mop all floors"],
                }
            ],
            "estimated_improvement": "Can reduce indoor PM2.5 by 20-30%",
        })
        mock_response = MagicMock()
        mock_response.text = mock_text
        self.service._client.models.generate_content = MagicMock(return_value=mock_response)

        result = asyncio.run(
            self.service.generate_indoor_hacks(
                room_type="bedroom",
                budget="low",
                city="Delhi",
            )
        )

        assert "hacks" in result
        assert len(result["hacks"]) >= 1
        assert "estimated_improvement" in result


class TestGeminiServiceImpact:
    """Tests for the generate_impact_analysis method."""

    def setup_method(self):
        """Initialize service with mocked client."""
        self.service = GeminiService()
        self.service._client = MagicMock()

    def test_generate_impact_analysis(self):
        """Should return structured impact analysis."""
        mock_text = json.dumps({
            "impact_summary": "Great improvements possible!",
            "co2_reduction_kg": 2400.5,
            "health_benefit": "Fewer respiratory issues",
            "community_impact": "If 100 families adopted these changes...",
            "tips": ["Use public transport", "Plant trees"],
        })
        mock_response = MagicMock()
        mock_response.text = mock_text
        self.service._client.models.generate_content = MagicMock(return_value=mock_response)

        result = asyncio.run(
            self.service.generate_impact_analysis(
                current_habits=["Drives car daily"],
                proposed_changes=["Switch to public transport"],
                city="Delhi",
            )
        )

        assert result["co2_reduction_kg"] == 2400.5
        assert len(result["tips"]) >= 1


class TestGeminiServiceErrorHandling:
    """Tests for error handling in the Gemini service."""

    def setup_method(self):
        """Initialize service with mocked client."""
        self.service = GeminiService()
        self.service._client = MagicMock()

    def test_handles_api_error_gracefully(self):
        """Should raise GeminiServiceError on API failure."""
        self.service._client.models.generate_content = MagicMock(
            side_effect=Exception("API connection failed")
        )

        with pytest.raises(GeminiServiceError):
            asyncio.run(
                self.service.chat(
                    message="Test message",
                    city="Delhi",
                )
            )

    def test_handles_empty_response(self):
        """Should raise GeminiServiceError when response text is None."""
        mock_response = MagicMock()
        mock_response.text = None
        self.service._client.models.generate_content = MagicMock(return_value=mock_response)

        with pytest.raises(GeminiServiceError):
            asyncio.run(self.service.chat(message="Test", city="Delhi"))


class TestParseJsonResponse:
    """Tests for the JSON parsing utility method."""

    def test_parse_valid_json(self):
        """Should parse valid JSON string directly."""
        text = '{"key": "value"}'
        result = GeminiService._parse_json_response(text, default={"key": ""})
        assert result["key"] == "value"

    def test_parse_json_in_code_block(self):
        """Should extract JSON from markdown code blocks."""
        text = 'Here is the response:\n```json\n{"key": "value"}\n```'
        result = GeminiService._parse_json_response(text, default={"key": ""})
        assert result["key"] == "value"

    def test_parse_json_embedded_in_text(self):
        """Should extract JSON object embedded in text."""
        text = 'Some text before {"key": "value"} and after'
        result = GeminiService._parse_json_response(text, default={"key": ""})
        assert result["key"] == "value"

    def test_fallback_on_invalid_json(self):
        """Should return default dict when JSON parsing fails."""
        text = "This is not JSON at all"
        default = {"response": ""}
        result = GeminiService._parse_json_response(text, default=default)
        assert result["response"] == text
