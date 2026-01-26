"""
Integration tests for the Pro-Test API.

These tests verify end-to-end functionality with the actual model loaded.
"""

from pathlib import Path

import pytest
from fastapi import status


@pytest.fixture
def model_path(project_root: Path) -> Path:
    """Get path to the ensemble model."""
    return project_root / "models" / "ensemble_model.joblib"


@pytest.fixture
def model_exists(model_path: Path) -> bool:
    """Check if model exists."""
    return model_path.exists()


class TestPredictionIntegration:
    """Integration tests for the prediction pipeline."""

    @pytest.mark.integration
    def test_full_prediction_pipeline(self, test_client, sample_prediction_input, model_exists):
        """Test complete prediction from request to response."""
        if not model_exists:
            pytest.skip("Model not available")

        response = test_client.get("/predict", params=sample_prediction_input)

        assert response.status_code == status.HTTP_200_OK
        data = response.json()

        # Verify response structure
        assert "predictions" in data
        assert "model_id" in data
        assert "model_version" in data
        assert "cached" in data
        assert "timestamp" in data

        # Verify all outcomes present
        expected_outcomes = [
            "verbal_coercion",
            "constraint",
            "physical_mild",
            "physical_severe",
            "physical_deadly",
            "security_presence",
            "militia_presence",
        ]

        for outcome in expected_outcomes:
            assert outcome in data["predictions"]
            prediction = data["predictions"][outcome]
            assert "probability" in prediction
            assert "prediction" in prediction
            assert 0 <= prediction["probability"] <= 1
            assert isinstance(prediction["prediction"], bool)

    @pytest.mark.integration
    def test_prediction_with_different_countries(self, test_client, model_exists):
        """Test predictions for different countries."""
        if not model_exists:
            pytest.skip("Model not available")

        countries = ["Iraq", "Lebanon", "Egypt"]

        for country in countries:
            params = {
                "country": country,
                "governorate": "Test",
                "location_type": "Midan",
                "demand_type": "Politics (national)",
                "protest_tactic": "Demonstration / protest",
                "protester_violence": "Peaceful",
                "combined_sizes": 100,
            }

            response = test_client.get("/predict", params=params)
            assert response.status_code == status.HTTP_200_OK

    @pytest.mark.integration
    def test_prediction_with_different_violence_levels(self, test_client, model_exists):
        """Test predictions for different violence levels."""
        if not model_exists:
            pytest.skip("Model not available")

        violence_levels = ["Peaceful", "Riot", "Unknown"]

        for violence in violence_levels:
            params = {
                "country": "Iraq",
                "governorate": "Baghdad",
                "location_type": "Midan",
                "demand_type": "Politics (national)",
                "protest_tactic": "Demonstration / protest",
                "protester_violence": violence,
                "combined_sizes": 100,
            }

            response = test_client.get("/predict", params=params)
            assert response.status_code == status.HTTP_200_OK

    @pytest.mark.integration
    def test_prediction_with_large_participant_count(self, test_client, model_exists):
        """Test predictions with large participant counts."""
        if not model_exists:
            pytest.skip("Model not available")

        params = {
            "country": "Iraq",
            "governorate": "Baghdad",
            "location_type": "Midan",
            "demand_type": "Politics (national)",
            "protest_tactic": "Demonstration / protest",
            "protester_violence": "Peaceful",
            "combined_sizes": 100000,  # Large crowd
        }

        response = test_client.get("/predict", params=params)
        assert response.status_code == status.HTTP_200_OK


class TestModelEndpointsIntegration:
    """Integration tests for model-related endpoints."""

    @pytest.mark.integration
    def test_model_info_with_loaded_model(self, test_client, model_exists):
        """Test model info when model is loaded."""
        if not model_exists:
            pytest.skip("Model not available")

        response = test_client.get("/model/info")

        assert response.status_code == status.HTTP_200_OK
        data = response.json()

        assert data["model_type"] == "ensemble"
        assert data["is_loaded"] is True

    @pytest.mark.integration
    def test_feature_importance_with_loaded_model(self, test_client, model_exists):
        """Test feature importance when model is loaded."""
        if not model_exists:
            pytest.skip("Model not available")

        response = test_client.get("/model/features")

        assert response.status_code == status.HTTP_200_OK
        data = response.json()

        assert "feature_importance" in data
        assert isinstance(data["feature_importance"], dict)
        assert len(data["feature_importance"]) > 0

        # Check that importance values are reasonable
        for name, importance in data["feature_importance"].items():
            assert isinstance(name, str)
            assert isinstance(importance, float)
            assert importance >= 0


class TestDataEndpointsIntegration:
    """Integration tests for data endpoints."""

    def test_regions_returns_real_data(self, test_client, project_root: Path):
        """Test that regions endpoint returns real data from CSV."""
        data_path = project_root / "data" / "full_df.csv"
        if not data_path.exists():
            pytest.skip("Data file not available")

        response = test_client.get("/regions")

        assert response.status_code == status.HTTP_200_OK
        data = response.json()

        # Should have real countries from dataset
        assert "Iraq" in data["countries"]
        assert "Lebanon" in data["countries"]
        assert "Egypt" in data["countries"]

        # Each country should have governorates
        assert len(data["Iraq"]) > 0
        assert len(data["Lebanon"]) > 0
        assert len(data["Egypt"]) > 0

    def test_options_returns_real_data(self, test_client, project_root: Path):
        """Test that options endpoint returns real data from CSV."""
        data_path = project_root / "data" / "full_df.csv"
        if not data_path.exists():
            pytest.skip("Data file not available")

        response = test_client.get("/options")

        assert response.status_code == status.HTTP_200_OK
        data = response.json()

        # Should have real options from dataset
        assert len(data["location_types"]) > 3
        assert len(data["demand_types"]) > 3
        assert len(data["tactics"]) > 1
        assert len(data["violence_levels"]) > 1


class TestMetricsIntegration:
    """Integration tests for metrics collection."""

    @pytest.mark.integration
    def test_metrics_after_predictions(self, test_client, sample_prediction_input, model_exists):
        """Test that metrics are recorded after predictions."""
        if not model_exists:
            pytest.skip("Model not available")

        # Make a prediction
        test_client.get("/predict", params=sample_prediction_input)

        # Check metrics
        response = test_client.get("/metrics")
        content = response.text

        # Should have our custom metrics
        assert "protest_prediction_requests_total" in content
        assert "protest_model_loaded" in content

    @pytest.mark.integration
    def test_metrics_include_latency(self, test_client, sample_prediction_input, model_exists):
        """Test that latency metrics are recorded."""
        if not model_exists:
            pytest.skip("Model not available")

        # Make a prediction
        test_client.get("/predict", params=sample_prediction_input)

        # Check metrics
        response = test_client.get("/metrics")
        content = response.text

        assert "protest_prediction_latency_seconds" in content
