"""
Pytest configuration and fixtures for Pro-Test tests.
"""

import os
from pathlib import Path
from typing import Generator

import pytest
from fastapi.testclient import TestClient

# Set test environment before importing app
os.environ["ENVIRONMENT"] = "development"
os.environ["MODEL_CACHE_ENABLED"] = "false"


@pytest.fixture(scope="session")
def project_root() -> Path:
    """Get the project root directory."""
    return Path(__file__).parent.parent


@pytest.fixture(scope="session")
def data_dir(project_root: Path) -> Path:
    """Get the data directory."""
    return project_root / "data"


@pytest.fixture(scope="session")
def api_dir(project_root: Path) -> Path:
    """Get the API directory."""
    return project_root / "api"


@pytest.fixture
def test_client() -> Generator[TestClient, None, None]:
    """Create a test client for the FastAPI application."""
    from api.api import app

    with TestClient(app) as client:
        yield client


@pytest.fixture
def sample_prediction_input() -> dict:
    """Sample input for prediction endpoint."""
    return {
        "country": "Iraq",
        "governorate": "Baghdad",
        "location_type": "Urban",
        "demand_type": "Political",
        "protest_tactic": "March",
        "protester_violence": "None",
        "combined_sizes": 100,
    }


@pytest.fixture
def mock_env(monkeypatch):
    """Fixture to mock environment variables."""

    def _mock_env(**kwargs):
        for key, value in kwargs.items():
            monkeypatch.setenv(key, str(value))

    return _mock_env
