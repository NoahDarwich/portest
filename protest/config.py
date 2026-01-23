"""
Pro-Test Configuration Module

Centralized configuration management using pydantic-settings.
All configuration is loaded from environment variables with sensible defaults.
"""

from functools import lru_cache
from pathlib import Path
from typing import Literal

from pydantic import Field, field_validator
from pydantic_settings import BaseSettings, SettingsConfigDict


class Settings(BaseSettings):
    """Application settings loaded from environment variables."""

    model_config = SettingsConfigDict(
        env_file=".env",
        env_file_encoding="utf-8",
        case_sensitive=False,
        extra="ignore",
    )

    # ============================================================
    # Application Settings
    # ============================================================
    app_name: str = "Pro-Test"
    app_version: str = "2.0.0"
    environment: Literal["development", "staging", "production"] = "development"
    debug: bool = False
    log_level: Literal["DEBUG", "INFO", "WARNING", "ERROR", "CRITICAL"] = "INFO"

    # ============================================================
    # API Settings
    # ============================================================
    host: str = "0.0.0.0"
    port: int = Field(default=8000, ge=1, le=65535)
    api_prefix: str = "/api/v2"

    # CORS settings
    cors_origins: list[str] = ["http://localhost:3000", "http://localhost:8501"]
    cors_allow_credentials: bool = True
    cors_allow_methods: list[str] = ["GET", "POST", "OPTIONS"]
    cors_allow_headers: list[str] = ["*"]

    # Rate limiting
    rate_limit_requests: int = 100
    rate_limit_window_seconds: int = 60

    # ============================================================
    # Model Settings
    # ============================================================
    model_path: Path = Path("api/final_RF_model")
    pipeline_path: Path = Path("api/pipeline")
    model_cache_enabled: bool = True

    @field_validator("model_path", "pipeline_path", mode="before")
    @classmethod
    def validate_path(cls, v: str | Path) -> Path:
        """Convert string paths to Path objects."""
        return Path(v) if isinstance(v, str) else v

    # ============================================================
    # Redis/Caching Settings
    # ============================================================
    redis_url: str | None = None
    cache_ttl_seconds: int = 3600  # 1 hour default
    cache_enabled: bool = False

    @field_validator("cache_enabled", mode="before")
    @classmethod
    def auto_enable_cache(cls, v: bool, info) -> bool:
        """Auto-enable cache if Redis URL is provided."""
        # This will be called during validation
        return v

    # ============================================================
    # Data Settings
    # ============================================================
    data_path: Path = Path("data")

    # ============================================================
    # Frontend Settings (for Streamlit)
    # ============================================================
    api_url: str = "http://localhost:8000"

    # ============================================================
    # Computed Properties
    # ============================================================
    @property
    def is_production(self) -> bool:
        """Check if running in production environment."""
        return self.environment == "production"

    @property
    def is_development(self) -> bool:
        """Check if running in development environment."""
        return self.environment == "development"


@lru_cache
def get_settings() -> Settings:
    """
    Get cached settings instance.

    Using lru_cache ensures settings are only loaded once and reused.
    Call get_settings.cache_clear() to reload settings if needed.
    """
    return Settings()


# Export a default instance for convenience
settings = get_settings()
