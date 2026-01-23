"""
Tests for the configuration module.
"""

import os

import pytest


class TestSettings:
    """Tests for Settings class."""

    def test_default_settings(self):
        """Test that default settings are loaded correctly."""
        # Clear cache and reload
        from protest.config import get_settings

        get_settings.cache_clear()

        settings = get_settings()

        assert settings.app_name == "Pro-Test"
        assert settings.environment in ["development", "staging", "production"]
        assert settings.port >= 1
        assert settings.port <= 65535

    def test_environment_override(self, mock_env):
        """Test that environment variables override defaults."""
        from protest.config import get_settings

        mock_env(
            ENVIRONMENT="production",
            PORT="9000",
            LOG_LEVEL="WARNING",
        )

        # Clear cache to reload with new env vars
        get_settings.cache_clear()
        settings = get_settings()

        assert settings.environment == "production"
        assert settings.port == 9000
        assert settings.log_level == "WARNING"

        # Clean up
        get_settings.cache_clear()

    def test_is_production_property(self, mock_env):
        """Test is_production property."""
        from protest.config import get_settings

        mock_env(ENVIRONMENT="production")
        get_settings.cache_clear()
        settings = get_settings()

        assert settings.is_production is True
        assert settings.is_development is False

        get_settings.cache_clear()

    def test_is_development_property(self, mock_env):
        """Test is_development property."""
        from protest.config import get_settings

        mock_env(ENVIRONMENT="development")
        get_settings.cache_clear()
        settings = get_settings()

        assert settings.is_development is True
        assert settings.is_production is False

        get_settings.cache_clear()

    def test_cors_origins_default(self):
        """Test default CORS origins."""
        from protest.config import get_settings

        get_settings.cache_clear()
        settings = get_settings()

        assert isinstance(settings.cors_origins, list)
        assert len(settings.cors_origins) > 0

        get_settings.cache_clear()

    def test_path_validation(self, mock_env):
        """Test that paths are converted to Path objects."""
        from pathlib import Path

        from protest.config import get_settings

        mock_env(MODEL_PATH="/custom/model/path")
        get_settings.cache_clear()
        settings = get_settings()

        assert isinstance(settings.model_path, Path)
        assert str(settings.model_path) == "/custom/model/path"

        get_settings.cache_clear()
