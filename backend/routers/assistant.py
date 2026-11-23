"""
AI Assistant API endpoints.

Provides GenAI-powered features including conversational chat,
daily routine generation, indoor air quality hacks, and
environmental impact analysis.
"""

from __future__ import annotations

import logging

from fastapi import APIRouter, HTTPException, Request
from middleware.security import limiter, sanitize_input
from models.schemas import (
    ChatRequest,
    ChatResponse,
    ErrorResponse,
    ImpactRequest,
    ImpactResponse,
    IndoorHackRequest,
    IndoorHackResponse,
    RoutineRequest,
    RoutineResponse,
    RoutineItem,
    IndoorHack,
)
from services.aqi_service import AQIService, AQIServiceError
from services.gemini_service import GeminiService, GeminiServiceError

logger = logging.getLogger(__name__)

router = APIRouter(
    prefix="/api/v1/assistant",
    tags=["AI Assistant"],
    responses={
        422: {"model": ErrorResponse, "description": "Validation error"},
        429: {"model": ErrorResponse, "description": "Rate limit exceeded"},
        500: {"model": ErrorResponse, "description": "Internal server error"},
        503: {"model": ErrorResponse, "description": "AI service unavailable"},
    },
)

# Service instances
aqi_service = AQIService()
gemini_service = GeminiService()


async def _get_aqi_context(city: str) -> dict | None:
    """Fetch current AQI data for a city to provide context to AI.

    Args:
        city: City name to query.

    Returns:
        AQI data dict if available, None on failure (non-critical).
    """
    try:
        aqi_data = await aqi_service.get_city_aqi(city)
        return aqi_data.model_dump()
    except AQIServiceError:
        logger.warning("Could not fetch AQI data for city '%s' — proceeding without context", city)
        return None


@router.post(
    "/chat",
    response_model=ChatResponse,
    summary="Chat with AI assistant",
    description="Send a message to the AI assistant for personalized air quality "
    "guidance. Responses are contextualised with real-time AQI data for the user's city.",
)
@limiter.limit("20/minute")
async def chat(request: Request, body: ChatRequest) -> ChatResponse:
    """AI-powered chat about air quality and smog protection.

    Args:
        request: FastAPI request object.
        body: Chat request with message, city, and optional context.

    Returns:
        ChatResponse with AI-generated guidance and follow-up suggestions.
    """
    sanitized_message = sanitize_input(body.message)
    sanitized_city = sanitize_input(body.city)
    sanitized_context = sanitize_input(body.context) if body.context else None

    aqi_data = await _get_aqi_context(sanitized_city)

    try:
        result = await gemini_service.chat(
            message=sanitized_message,
            city=sanitized_city,
            aqi_data=aqi_data,
            context=sanitized_context,
        )
        return ChatResponse(
            response=result.get("response", "I couldn't generate a response. Please try again."),
            suggestions=result.get("suggestions", []),
        )
    except GeminiServiceError as exc:
        raise HTTPException(status_code=503, detail=exc.message) from exc


@router.post(
    "/routines",
    response_model=RoutineResponse,
    summary="Generate low-emission daily routines",
    description="Generate a personalized daily routine that minimizes pollution "
    "exposure and carbon footprint, tailored to the user's lifestyle and local AQI.",
)
@limiter.limit("20/minute")
async def generate_routines(request: Request, body: RoutineRequest) -> RoutineResponse:
    """Generate a low-emission daily routine.

    Args:
        request: FastAPI request object.
        body: Routine request with city, lifestyle type, and optional AQI.

    Returns:
        RoutineResponse with schedule items and AQI context.
    """
    sanitized_city = sanitize_input(body.city)
    aqi_data = await _get_aqi_context(sanitized_city)

    aqi_level = "Unknown"
    if aqi_data:
        aqi_level = aqi_data.get("health_level", "Unknown")
    elif body.current_aqi is not None:
        aqi_level = AQIService._classify_aqi(body.current_aqi)[0]

    try:
        result = await gemini_service.generate_routines(
            city=sanitized_city,
            lifestyle=body.lifestyle.value,
            aqi_level=aqi_level,
            aqi_data=aqi_data,
        )

        # Parse routine items safely
        routine_items = []
        for item in result.get("routines", []):
            try:
                routine_items.append(RoutineItem(
                    time_of_day=item.get("time_of_day", ""),
                    activity=item.get("activity", ""),
                    emission_impact=item.get("emission_impact", "medium"),
                    alternative=item.get("alternative", ""),
                    health_tip=item.get("health_tip", ""),
                ))
            except Exception:
                continue

        return RoutineResponse(
            routines=routine_items,
            aqi_level=aqi_level,
            city=sanitized_city,
        )
    except GeminiServiceError as exc:
        raise HTTPException(status_code=503, detail=exc.message) from exc


@router.post(
    "/indoor-hacks",
    response_model=IndoorHackResponse,
    summary="Get indoor air quality hacks",
    description="Get room-specific, budget-conscious indoor air quality improvement "
    "recommendations with DIY instructions.",
)
@limiter.limit("20/minute")
async def get_indoor_hacks(request: Request, body: IndoorHackRequest) -> IndoorHackResponse:
    """Generate indoor air quality improvement recommendations.

    Args:
        request: FastAPI request object.
        body: Indoor hack request with room type, budget, and city.

    Returns:
        IndoorHackResponse with hacks and estimated improvement.
    """
    sanitized_city = sanitize_input(body.city)
    aqi_data = await _get_aqi_context(sanitized_city)

    try:
        result = await gemini_service.generate_indoor_hacks(
            room_type=body.room_type.value,
            budget=body.budget.value,
            city=sanitized_city,
            aqi_data=aqi_data,
        )

        hacks = []
        for hack in result.get("hacks", []):
            try:
                hacks.append(IndoorHack(
                    title=hack.get("title", ""),
                    description=hack.get("description", ""),
                    effectiveness=hack.get("effectiveness", "medium"),
                    cost=hack.get("cost", "Varies"),
                    diy_steps=hack.get("diy_steps", []),
                ))
            except Exception:
                continue

        return IndoorHackResponse(
            hacks=hacks,
            estimated_improvement=result.get(
                "estimated_improvement",
                "Improvement varies based on current conditions and implementation.",
            ),
        )
    except GeminiServiceError as exc:
        raise HTTPException(status_code=503, detail=exc.message) from exc


@router.post(
    "/impact",
    response_model=ImpactResponse,
    summary="Calculate environmental impact",
    description="Calculate the environmental and health impact of switching from "
    "current habits to proposed sustainable alternatives.",
)
@limiter.limit("20/minute")
async def calculate_impact(request: Request, body: ImpactRequest) -> ImpactResponse:
    """Calculate the impact of lifestyle changes on air quality.

    Args:
        request: FastAPI request object.
        body: Impact request with current habits and proposed changes.

    Returns:
        ImpactResponse with quantified environmental impact.
    """
    sanitized_city = sanitize_input(body.city)
    sanitized_habits = [sanitize_input(h) for h in body.current_habits]
    sanitized_changes = [sanitize_input(c) for c in body.proposed_changes]

    aqi_data = await _get_aqi_context(sanitized_city)

    try:
        result = await gemini_service.generate_impact_analysis(
            current_habits=sanitized_habits,
            proposed_changes=sanitized_changes,
            city=sanitized_city,
            aqi_data=aqi_data,
        )

        return ImpactResponse(
            impact_summary=result.get("impact_summary", "Impact analysis unavailable."),
            co2_reduction_kg=float(result.get("co2_reduction_kg", 0.0)),
            health_benefit=result.get("health_benefit", "Analysis unavailable."),
            community_impact=result.get("community_impact", "Analysis unavailable."),
            tips=result.get("tips", []),
        )
    except GeminiServiceError as exc:
        raise HTTPException(status_code=503, detail=exc.message) from exc
    except (ValueError, TypeError) as exc:
        logger.error("Error parsing impact response: %s", exc)
        raise HTTPException(
            status_code=500,
            detail="Error processing impact analysis results.",
        ) from exc


# Direct /api/v1 aliases for seamless frontend compatibility
direct_router = APIRouter(prefix="/api/v1", include_in_schema=False)
direct_router.add_api_route("/chat", chat, methods=["POST"], response_model=ChatResponse)
direct_router.add_api_route("/routines", generate_routines, methods=["POST"], response_model=RoutineResponse)
direct_router.add_api_route("/indoor-hacks", get_indoor_hacks, methods=["POST"], response_model=IndoorHackResponse)
direct_router.add_api_route("/impact", calculate_impact, methods=["POST"], response_model=ImpactResponse)
