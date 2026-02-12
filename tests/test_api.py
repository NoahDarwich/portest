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

    def test_health_check_has_model_status(self, test_client):
        """Test that health endpoint includes model status."""
        response = test_client.get("/health")
        data = response.json()

        assert "model_loaded" in data
        assert "cache_enabled" in data


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

    @pytest.mark.integration
    def test_predict_returns_all_outcomes(self, test_client, sample_prediction_input):
        """Test that prediction returns all 7 outcome types."""
        response = test_client.get("/predict", params=sample_prediction_input)

        if response.status_code == status.HTTP_200_OK:
            data = response.json()
            predictions = data["predictions"]

            expected_outcomes = [
                "teargas",
                "rubberbullets",
                "liveammo",
                "sticks",
                "surround",
                "cleararea",
                "policerepress",
            ]

            for outcome in expected_outcomes:
                assert outcome in predictions
                assert "probability" in predictions[outcome]
                assert "prediction" in predictions[outcome]
                assert 0 <= predictions[outcome]["probability"] <= 1
                assert isinstance(predictions[outcome]["prediction"], bool)

    @pytest.mark.integration
    def test_predict_has_model_id(self, test_client, sample_prediction_input):
        """Test that prediction includes model ID."""
        response = test_client.get("/predict", params=sample_prediction_input)

        if response.status_code == status.HTTP_200_OK:
            data = response.json()
            assert "model_id" in data
            assert len(data["model_id"]) > 0

    @pytest.mark.integration
    def test_predict_has_cached_flag(self, test_client, sample_prediction_input):
        """Test that prediction includes cached flag."""
        response = test_client.get("/predict", params=sample_prediction_input)

        if response.status_code == status.HTTP_200_OK:
            data = response.json()
            assert "cached" in data
            assert isinstance(data["cached"], bool)


class TestModelInfoEndpoint:
    """Tests for model info endpoint."""

    def test_model_info_returns_200(self, test_client):
        """Test that model info endpoint returns 200."""
        response = test_client.get("/model/info")

        assert response.status_code == status.HTTP_200_OK

    def test_model_info_has_required_fields(self, test_client):
        """Test that model info contains required fields."""
        response = test_client.get("/model/info")
        data = response.json()

        assert "model_type" in data
        assert "version" in data
        assert "target_columns" in data
        assert "feature_columns" in data
        assert "is_loaded" in data
        assert "timestamp" in data

    def test_model_info_target_columns(self, test_client):
        """Test that model info has correct target columns."""
        response = test_client.get("/model/info")
        data = response.json()

        expected_targets = [
            "teargas",
            "rubberbullets",
            "liveammo",
            "sticks",
            "surround",
            "cleararea",
            "policerepress",
        ]

        assert data["target_columns"] == expected_targets

    def test_model_info_feature_columns(self, test_client):
        """Test that model info has correct feature columns."""
        response = test_client.get("/model/info")
        data = response.json()

        expected_features = [
            "country",
            "governorate",
            "locationtypeend",
            "demandtypeone",
            "tacticprimary",
            "violence",
            "combined_sizes",
        ]

        assert data["feature_columns"] == expected_features


class TestModelFeaturesEndpoint:
    """Tests for model features endpoint."""

    @pytest.mark.integration
    def test_model_features_requires_loaded_model(self, test_client):
        """Test that feature importance requires loaded model."""
        response = test_client.get("/model/features")

        # Either returns features (model loaded) or 503 (not loaded)
        assert response.status_code in [
            status.HTTP_200_OK,
            status.HTTP_503_SERVICE_UNAVAILABLE,
        ]

    @pytest.mark.integration
    def test_model_features_returns_dict(self, test_client):
        """Test that feature importance returns a dict."""
        response = test_client.get("/model/features")

        if response.status_code == status.HTTP_200_OK:
            data = response.json()
            assert "feature_importance" in data
            assert isinstance(data["feature_importance"], dict)
            assert "model_version" in data


class TestRegionsEndpoint:
    """Tests for regions endpoint."""

    def test_regions_returns_200(self, test_client):
        """Test that regions endpoint returns 200."""
        response = test_client.get("/regions")

        assert response.status_code == status.HTTP_200_OK

    def test_regions_has_countries_list(self, test_client):
        """Test that regions response has countries list."""
        response = test_client.get("/regions")
        data = response.json()

        assert "countries" in data
        assert isinstance(data["countries"], list)
        assert len(data["countries"]) > 0

    def test_regions_has_governorates_for_countries(self, test_client):
        """Test that each country has governorates."""
        response = test_client.get("/regions")
        data = response.json()

        for country in data["countries"]:
            assert country in data
            assert isinstance(data[country], list)


class TestOptionsEndpoint:
    """Tests for options endpoint."""

    def test_options_returns_200(self, test_client):
        """Test that options endpoint returns 200."""
        response = test_client.get("/options")

        assert response.status_code == status.HTTP_200_OK

    def test_options_has_required_fields(self, test_client):
        """Test that options response has required fields."""
        response = test_client.get("/options")
        data = response.json()

        assert "location_types" in data
        assert "demand_types" in data
        assert "tactics" in data
        assert "violence_levels" in data

    def test_options_fields_are_lists(self, test_client):
        """Test that options fields are lists."""
        response = test_client.get("/options")
        data = response.json()

        assert isinstance(data["location_types"], list)
        assert isinstance(data["demand_types"], list)
        assert isinstance(data["tactics"], list)
        assert isinstance(data["violence_levels"], list)

    def test_options_fields_not_empty(self, test_client):
        """Test that options fields are not empty."""
        response = test_client.get("/options")
        data = response.json()

        assert len(data["location_types"]) > 0
        assert len(data["demand_types"]) > 0
        assert len(data["tactics"]) > 0
        assert len(data["violence_levels"]) > 0


class TestMetricsEndpoint:
    """Tests for Prometheus metrics endpoint."""

    def test_metrics_returns_200(self, test_client):
        """Test that metrics endpoint returns 200."""
        response = test_client.get("/metrics")

        assert response.status_code == status.HTTP_200_OK

    def test_metrics_returns_prometheus_format(self, test_client):
        """Test that metrics are in Prometheus format."""
        response = test_client.get("/metrics")

        # Prometheus format contains TYPE and HELP comments
        content = response.text
        assert "# HELP" in content or "# TYPE" in content

    def test_metrics_includes_http_metrics(self, test_client):
        """Test that metrics include HTTP request metrics."""
        # Make a request first to generate metrics
        test_client.get("/health")

        response = test_client.get("/metrics")
        content = response.text

        # Should have HTTP request metrics from instrumentator
        assert "http" in content.lower()


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

    def test_openapi_has_paths(self, test_client):
        """Test that OpenAPI spec has paths defined."""
        response = test_client.get("/openapi.json")
        data = response.json()

        assert "paths" in data
        assert "/health" in data["paths"]
        assert "/predict" in data["paths"]
        assert "/model/info" in data["paths"]
        assert "/regions" in data["paths"]
        assert "/options" in data["paths"]
