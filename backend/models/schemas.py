"""
Pydantic request and response schemas for the Urban Air Quality Assistant API.

All models include strict validation, descriptive field metadata, and
comprehensive docstrings for auto-generated API documentation.
"""

from __future__ import annotations

from enum import Enum
from typing import Optional

from pydantic import BaseModel, Field, field_validator


# --- Enums ---

class LifestyleType(str, Enum):
    """Supported lifestyle types for routine generation."""
    FAMILY_WITH_KIDS = "family_with_kids"
    WORKING_PROFESSIONAL = "working_professional"
    ELDERLY = "elderly"
    STUDENT = "student"
    GENERAL = "general"


class RoomType(str, Enum):
    """Supported room types for indoor hack recommendations."""
    BEDROOM = "bedroom"
    LIVING_ROOM = "living_room"
    KITCHEN = "kitchen"
    OFFICE = "office"
    GENERAL = "general"


class BudgetLevel(str, Enum):
    """Budget level categories."""
    LOW = "low"
    MEDIUM = "medium"
    HIGH = "high"


class EmissionImpact(str, Enum):
    """Emission impact classification."""
    LOW = "low"
    MEDIUM = "medium"
    HIGH = "high"


class Effectiveness(str, Enum):
    """Effectiveness rating for indoor hacks."""
    LOW = "low"
    MEDIUM = "medium"
    HIGH = "high"


# --- Air Quality Schemas ---

class AirQualityResponse(BaseModel):
    """Response schema for air quality data.

    Contains real-time AQI data, pollutant breakdown, weather info,
    and health advisory information for a specific location.
    """
    aqi: int = Field(..., ge=0, description="Air Quality Index value")
    city: str = Field(..., description="City or station name")
    dominant_pollutant: Optional[str] = Field(None, description="Primary pollutant")
    pollutants: dict[str, float] = Field(
        default_factory=dict,
        description="Individual pollutant values (PM2.5, PM10, NO2, O3, SO2, CO)"
    )
    weather: Optional[dict[str, float]] = Field(
        None,
        description="Weather conditions (temperature, humidity, wind, pressure)"
    )
    timestamp: str = Field(..., description="Data timestamp in ISO format")
    health_level: str = Field(..., description="Health risk level (Good, Moderate, etc.)")
    health_advice: str = Field(..., description="Health advisory message")


class SearchResult(BaseModel):
    """Search result for monitoring stations."""
    name: str = Field(..., description="Station or city name")
    aqi: int = Field(..., ge=0, description="Current AQI value")
    station_id: str = Field(..., description="WAQI station identifier")


# --- Chat Schemas ---

class ChatRequest(BaseModel):
    """Request schema for AI chat interaction.

    Attributes:
        message: User's question or message about air quality.
        city: User's city for context-aware responses.
        context: Optional additional context (e.g., 'has_children', 'elderly').
    """
    message: str = Field(
        ...,
        min_length=1,
        max_length=2000,
        description="User message (1-2000 characters)"
    )
    city: str = Field(
        ...,
        min_length=1,
        max_length=100,
        description="City name for location context"
    )
    context: Optional[str] = Field(
        None,
        max_length=500,
        description="Additional user context"
    )

    @field_validator("message", "city")
    @classmethod
    def strip_whitespace(cls, v: str) -> str:
        """Strip leading/trailing whitespace from string fields."""
        return v.strip()


class ChatResponse(BaseModel):
    """Response schema for AI chat interaction."""
    response: str = Field(..., description="AI-generated response")
    suggestions: list[str] = Field(
        default_factory=list,
        description="Follow-up question suggestions"
    )


# --- Routine Schemas ---

class RoutineItem(BaseModel):
    """Individual routine item in a daily schedule."""
    time_of_day: str = Field(..., description="Time slot (e.g., '6:00 AM - 7:00 AM')")
    activity: str = Field(..., description="Recommended activity")
    emission_impact: EmissionImpact = Field(..., description="Emission impact level")
    alternative: str = Field(..., description="Lower-emission alternative")
    health_tip: str = Field(..., description="Related health tip")


class RoutineRequest(BaseModel):
    """Request schema for generating daily routines."""
    city: str = Field(..., min_length=1, max_length=100, description="City name")
    lifestyle: LifestyleType = Field(..., description="User's lifestyle type")
    current_aqi: Optional[int] = Field(None, ge=0, description="Current AQI if known")

    @field_validator("city")
    @classmethod
    def strip_city(cls, v: str) -> str:
        """Strip whitespace from city name."""
        return v.strip()


class RoutineResponse(BaseModel):
    """Response schema for generated daily routines."""
    routines: list[RoutineItem] = Field(..., description="List of routine items")
    aqi_level: str = Field(..., description="Current AQI health level")
    city: str = Field(..., description="City name")


# --- Indoor Hack Schemas ---

class IndoorHack(BaseModel):
    """Individual indoor air quality improvement hack."""
    title: str = Field(..., description="Hack title")
    description: str = Field(..., description="Detailed description")
    effectiveness: Effectiveness = Field(..., description="Effectiveness rating")
    cost: str = Field(..., description="Estimated cost range")
    diy_steps: list[str] = Field(default_factory=list, description="Step-by-step DIY instructions")


class IndoorHackRequest(BaseModel):
    """Request schema for indoor air quality hack recommendations."""
    room_type: RoomType = Field(..., description="Type of room")
    budget: BudgetLevel = Field(..., description="Budget level")
    city: str = Field(..., min_length=1, max_length=100, description="City name")

    @field_validator("city")
    @classmethod
    def strip_city(cls, v: str) -> str:
        """Strip whitespace from city name."""
        return v.strip()


class IndoorHackResponse(BaseModel):
    """Response schema for indoor hack recommendations."""
    hacks: list[IndoorHack] = Field(..., description="List of recommended hacks")
    estimated_improvement: str = Field(..., description="Estimated AQI improvement summary")


# --- Impact Calculator Schemas ---

class ImpactRequest(BaseModel):
    """Request schema for impact calculation.

    Attributes:
        current_habits: List of current high-emission habits.
        proposed_changes: List of proposed sustainable changes.
        city: City for location-specific impact data.
    """
    current_habits: list[str] = Field(
        ...,
        min_length=1,
        max_length=20,
        description="Current habits (1-20 items)"
    )
    proposed_changes: list[str] = Field(
        ...,
        min_length=1,
        max_length=20,
        description="Proposed changes (1-20 items)"
    )
    city: str = Field(..., min_length=1, max_length=100, description="City name")

    @field_validator("city")
    @classmethod
    def strip_city(cls, v: str) -> str:
        """Strip whitespace from city name."""
        return v.strip()

    @field_validator("current_habits", "proposed_changes")
    @classmethod
    def validate_items(cls, v: list[str]) -> list[str]:
        """Validate and sanitize list items."""
        return [item.strip() for item in v if item.strip()]


class ImpactResponse(BaseModel):
    """Response schema for impact calculation results."""
    impact_summary: str = Field(..., description="Overall impact summary")
    co2_reduction_kg: float = Field(..., ge=0, description="Estimated annual CO2 reduction in kg")
    health_benefit: str = Field(..., description="Health benefit description")
    community_impact: str = Field(..., description="Community-level impact description")
    tips: list[str] = Field(default_factory=list, description="Actionable tips for maximum impact")


# --- Error Schema ---

class ErrorResponse(BaseModel):
    """Standard error response schema."""
    detail: str = Field(..., description="Error message")
    status_code: int = Field(..., description="HTTP status code")
