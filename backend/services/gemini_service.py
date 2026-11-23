"""
Google Gemini AI service for the Urban Air Quality Assistant.

Provides methods for generating personalized air quality advice,
daily routines, indoor hacks, and impact analysis using Google's
Gemini 2.5 Flash model.
"""

from __future__ import annotations

import json
import logging
try:
    from google import genai
except ImportError:
    genai = None

from config import get_settings
from utils.prompts import (
    CHAT_SYSTEM_PROMPT,
    IMPACT_SYSTEM_PROMPT,
    INDOOR_HACK_SYSTEM_PROMPT,
    ROUTINE_SYSTEM_PROMPT,
)

logger = logging.getLogger(__name__)


class GeminiServiceError(Exception):
    """Exception raised when Gemini API calls fail."""

    def __init__(self, message: str = "AI service temporarily unavailable") -> None:
        self.message = message
        super().__init__(self.message)


class GeminiService:
    """Service for AI-powered air quality guidance using Google Gemini.

    Provides structured AI responses for chat, routines, indoor hacks,
    and impact analysis — all contextualised with real-time AQI data.

    Attributes:
        _client: Google GenAI client instance.
        _model: Model name to use for generation.
    """

    MODEL_NAME = "gemini-2.5-flash"

    def __init__(self) -> None:
        """Initialize the Gemini service with API credentials."""
        settings = get_settings()
        if genai is not None:
            self._client = genai.Client(api_key=settings.GEMINI_API_KEY)
        else:
            self._client = None
        self._model = self.MODEL_NAME

    async def chat(
        self,
        message: str,
        city: str,
        aqi_data: dict[str, Any] | None = None,
        context: str | None = None,
    ) -> dict[str, Any]:
        """Generate a contextual chat response about air quality.

        Args:
            message: User's question or message.
            city: User's city for location context.
            aqi_data: Current AQI data dict (optional, for enriched context).
            context: Additional user context (e.g., 'has children').

        Returns:
            Dict with 'response' (str) and 'suggestions' (list[str]).
        """
        aqi_context = self._format_aqi_context(city, aqi_data)
        user_context = f"\nUser context: {context}" if context else ""

        user_message = (
            f"City: {city}\n"
            f"{aqi_context}"
            f"{user_context}\n\n"
            f"User question: {message}"
        )

        result = await self._generate(CHAT_SYSTEM_PROMPT, user_message)
        return self._parse_json_response(result, default={
            "response": result,
            "suggestions": [],
        })

    async def generate_routines(
        self,
        city: str,
        lifestyle: str,
        aqi_level: str,
        aqi_data: dict[str, Any] | None = None,
    ) -> dict[str, Any]:
        """Generate a low-emission daily routine.

        Args:
            city: User's city name.
            lifestyle: Lifestyle type (e.g., 'family_with_kids').
            aqi_level: Current AQI health level string.
            aqi_data: Current AQI data dict for enriched context.

        Returns:
            Dict with 'routines' list of routine items.
        """
        aqi_context = self._format_aqi_context(city, aqi_data)

        user_message = (
            f"City: {city}\n"
            f"Current AQI Level: {aqi_level}\n"
            f"{aqi_context}\n"
            f"Lifestyle: {lifestyle}\n\n"
            f"Generate a full day's low-emission routine for this user."
        )

        result = await self._generate(ROUTINE_SYSTEM_PROMPT, user_message)
        return self._parse_json_response(result, default={"routines": []})

    async def generate_indoor_hacks(
        self,
        room_type: str,
        budget: str,
        city: str,
        aqi_data: dict[str, Any] | None = None,
    ) -> dict[str, Any]:
        """Generate indoor air quality improvement recommendations.

        Args:
            room_type: Type of room (e.g., 'bedroom', 'kitchen').
            budget: Budget level ('low', 'medium', 'high').
            city: User's city name.
            aqi_data: Current AQI data dict.

        Returns:
            Dict with 'hacks' list and 'estimated_improvement' string.
        """
        aqi_context = self._format_aqi_context(city, aqi_data)

        user_message = (
            f"City: {city}\n"
            f"{aqi_context}\n"
            f"Room type: {room_type}\n"
            f"Budget level: {budget}\n\n"
            f"Recommend indoor air quality improvements for this room."
        )

        result = await self._generate(INDOOR_HACK_SYSTEM_PROMPT, user_message)
        return self._parse_json_response(result, default={
            "hacks": [],
            "estimated_improvement": "Unable to estimate improvement.",
        })

    async def generate_impact_analysis(
        self,
        current_habits: list[str],
        proposed_changes: list[str],
        city: str,
        aqi_data: dict[str, Any] | None = None,
    ) -> dict[str, Any]:
        """Calculate and explain the impact of lifestyle changes.

        Args:
            current_habits: List of current high-emission habits.
            proposed_changes: List of proposed sustainable changes.
            city: User's city name.
            aqi_data: Current AQI data dict.

        Returns:
            Dict with impact analysis including CO2 reduction.
        """
        aqi_context = self._format_aqi_context(city, aqi_data)

        habits_str = "\n".join(f"  - {h}" for h in current_habits)
        changes_str = "\n".join(f"  - {c}" for c in proposed_changes)

        user_message = (
            f"City: {city}\n"
            f"{aqi_context}\n\n"
            f"Current habits:\n{habits_str}\n\n"
            f"Proposed changes:\n{changes_str}\n\n"
            f"Calculate the environmental and health impact of these changes."
        )

        result = await self._generate(IMPACT_SYSTEM_PROMPT, user_message)
        return self._parse_json_response(result, default={
            "impact_summary": result,
            "co2_reduction_kg": 0.0,
            "health_benefit": "Analysis unavailable.",
            "community_impact": "Analysis unavailable.",
            "tips": [],
        })

    async def _generate(self, system_prompt: str, user_message: str) -> str:
        """Generate content using the Gemini model.

        Args:
            system_prompt: System instruction prompt.
            user_message: User's input message.

        Returns:
            Raw text response from the model.

        Raises:
            GeminiServiceError: If the API call fails.
        """
        if self._client is None:
            raise GeminiServiceError("Gemini AI client is not configured.")

        try:
            config = None
            if genai is not None and hasattr(genai, "types") and hasattr(genai.types, "GenerateContentConfig"):
                config = genai.types.GenerateContentConfig(
                    system_instruction=system_prompt,
                    temperature=0.7,
                    max_output_tokens=2048,
                )

            response = self._client.models.generate_content(
                model=self._model,
                contents=user_message,
                config=config,
            )
            if response and getattr(response, "text", None):
                return response.text
            raise GeminiServiceError("Empty response from AI model.")
        except GeminiServiceError:
            raise
        except Exception as exc:
            logger.error("Gemini service error: %s", exc)
            raise GeminiServiceError(
                "AI service temporarily unavailable. Please try again later."
            ) from exc

    @staticmethod
    def _format_aqi_context(city: str, aqi_data: dict[str, Any] | None) -> str:
        """Format AQI data into a readable context string.

        Args:
            city: City name.
            aqi_data: AQI response data dict or None.

        Returns:
            Formatted string with AQI context information.
        """
        if not aqi_data:
            return f"Current AQI data for {city}: Not available"

        parts = [f"Current AQI for {city}: {aqi_data.get('aqi', 'N/A')}"]
        parts.append(f"Health Level: {aqi_data.get('health_level', 'Unknown')}")

        pollutants = aqi_data.get("pollutants", {})
        if pollutants:
            pollutant_strs = [f"  {k}: {v}" for k, v in pollutants.items()]
            parts.append("Pollutant levels:\n" + "\n".join(pollutant_strs))

        weather = aqi_data.get("weather")
        if weather:
            weather_strs = [f"  {k}: {v}" for k, v in weather.items()]
            parts.append("Weather conditions:\n" + "\n".join(weather_strs))

        return "\n".join(parts)

    @staticmethod
    def _parse_json_response(
        text: str,
        default: dict[str, Any],
    ) -> dict[str, Any]:
        """Parse JSON from AI response text with fallback handling.

        The AI may return JSON wrapped in markdown code blocks or with
        extraneous text. This method extracts and parses the JSON content.

        Args:
            text: Raw response text from the AI model.
            default: Default dict to return if parsing fails.

        Returns:
            Parsed JSON dict, or default with raw text inserted.
        """
        # Try direct JSON parse first
        try:
            return json.loads(text)
        except json.JSONDecodeError:
            pass

        # Try extracting JSON from markdown code blocks
        import re
        json_match = re.search(r"```(?:json)?\s*\n?(.*?)\n?```", text, re.DOTALL)
        if json_match:
            try:
                return json.loads(json_match.group(1))
            except json.JSONDecodeError:
                pass

        # Try finding JSON object in text
        brace_match = re.search(r"\{.*\}", text, re.DOTALL)
        if brace_match:
            try:
                return json.loads(brace_match.group(0))
            except json.JSONDecodeError:
                pass

        # Fallback: return default with raw text
        logger.warning("Failed to parse JSON from AI response, using fallback")
        if "response" in default:
            default["response"] = text
        elif "impact_summary" in default:
            default["impact_summary"] = text
        return default
