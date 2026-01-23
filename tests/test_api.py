"""
Tests for the API endpoints.
"""

import pytest
from fastapi import status


class TestHealthEndpoint:
    """Tests for health check endpoint."""

    def test_health_check_returns_ok(self, test_client):
        """Test that health endpoint returns OK status."""
        response = test_client.get("/health")

        assert response.status_code == status.HTTP_200_OK
        data = response.json()
        assert data["status"] == "ok"
        assert "version" in data
        assert "environment" in data
        assert "timestamp" in data

    def test_health_check_has_version(self, test_client):
        """Test that health endpoint includes version."""
        response = test_client.get("/health")
        data = response.json()

        assert data["version"] == "2.0.0"


class TestRootEndpoint:
    """Tests for root endpoint."""

    def test_root_returns_ok(self, test_client):
        """Test that root endpoint returns OK."""
        response = test_client.get("/")

        assert response.status_code == status.HTTP_200_OK
        assert response.json() == {"ok": True}


class TestPredictEndpoint:
    """Tests for prediction endpoint."""

    def test_predict_missing_params_returns_422(self, test_client):
        """Test that missing parameters return validation error."""
        response = test_client.get("/predict")

        assert response.status_code == status.HTTP_422_UNPROCESSABLE_ENTITY

    def test_predict_partial_params_returns_422(self, test_client):
        """Test that partial parameters return validation error."""
        response = test_client.get(
            "/predict",
            params={"country": "Iraq", "governorate": "Baghdad"},
        )

        assert response.status_code == status.HTTP_422_UNPROCESSABLE_ENTITY

    def test_predict_invalid_combined_sizes_returns_422(self, test_client):
        """Test that negative participant count returns validation error."""
        response = test_client.get(
            "/predict",
            params={
                "country": "Iraq",
                "governorate": "Baghdad",
                "location_type": "Urban",
                "demand_type": "Political",
                "protest_tactic": "March",
                "protester_violence": "None",
                "combined_sizes": -1,  # Invalid
            },
        )

        assert response.status_code == status.HTTP_422_UNPROCESSABLE_ENTITY

    @pytest.mark.integration
    def test_predict_with_valid_params(self, test_client, sample_prediction_input):
        """Test prediction with valid parameters.

        Note: This test requires the model to be loaded.
        Marked as integration test since it depends on model files.
        """
        response = test_client.get("/predict", params=sample_prediction_input)

        # Without model loaded, expect 503
        # With model loaded, expect 200
        assert response.status_code in [
            status.HTTP_200_OK,
            status.HTTP_503_SERVICE_UNAVAILABLE,
        ]

        if response.status_code == status.HTTP_200_OK:
            data = response.json()
            assert "predictions" in data
            assert "model_version" in data
            assert "timestamp" in data


class TestAPIDocumentation:
    """Tests for API documentation endpoints."""

    def test_docs_available_in_development(self, test_client):
        """Test that OpenAPI docs are available in development."""
        response = test_client.get("/docs")
        # Should redirect or return HTML
        assert response.status_code in [status.HTTP_200_OK, status.HTTP_307_TEMPORARY_REDIRECT]

    def test_openapi_json_available(self, test_client):
        """Test that OpenAPI JSON is available."""
        response = test_client.get("/openapi.json")
        assert response.status_code == status.HTTP_200_OK
        data = response.json()
        assert "openapi" in data
        assert "info" in data
        assert data["info"]["title"] == "Pro-Test"
