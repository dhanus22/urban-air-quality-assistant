"""
Application configuration module.

Loads environment variables using Pydantic BaseSettings for type-safe
configuration management. API keys and sensitive values are read from
a .env file and never hardcoded.
"""

from functools import lru_cache
from pydantic_settings import BaseSettings, SettingsConfigDict


class Settings(BaseSettings):
    """Application settings loaded from environment variables.

    Attributes:
        WAQI_API_TOKEN: API token for the World Air Quality Index API.
        GEMINI_API_KEY: API key for Google Gemini AI.
        ENVIRONMENT: Deployment environment (development/production).
        ALLOWED_ORIGINS: Comma-separated list of allowed CORS origins.
        RATE_LIMIT_PER_MINUTE: Maximum API requests per minute per IP.
        WAQI_BASE_URL: Base URL for the WAQI API.
        CACHE_TTL_SECONDS: Time-to-live for cached AQI data in seconds.
    """

    WAQI_API_TOKEN: str = "demo"
    GEMINI_API_KEY: str = ""
    ENVIRONMENT: str = "development"
    ALLOWED_ORIGINS: str = "http://localhost:5173,http://localhost:3000"
    RATE_LIMIT_PER_MINUTE: int = 60
    WAQI_BASE_URL: str = "https://api.waqi.info"
    CACHE_TTL_SECONDS: int = 300

    model_config = SettingsConfigDict(
        env_file=".env",
        env_file_encoding="utf-8",
        case_sensitive=True,
    )

    @property
    def allowed_origins_list(self) -> list[str]:
        """Parse comma-separated origins into a list."""
        return [origin.strip() for origin in self.ALLOWED_ORIGINS.split(",") if origin.strip()]

    @property
    def is_production(self) -> bool:
        """Check if running in production environment."""
        return self.ENVIRONMENT.lower() == "production"


@lru_cache()
def get_settings() -> Settings:
    """Get cached application settings singleton.

    Returns:
        Settings: Application configuration instance.
    """
    return Settings()
