"""
Tests for the metrics module.
"""


class TestMetricsModule:
    """Tests for Prometheus metrics."""

    def test_metrics_module_import(self):
        """Test that metrics module can be imported."""
        from protest.metrics import (
            APP_INFO,
            CACHE_HITS,
            CACHE_MISSES,
            MODEL_LOADED,
            PREDICTION_LATENCY,
            PREDICTION_REQUESTS,
        )

        assert APP_INFO is not None
        assert PREDICTION_REQUESTS is not None
        assert PREDICTION_LATENCY is not None
        assert CACHE_HITS is not None
        assert CACHE_MISSES is not None
        assert MODEL_LOADED is not None

    def test_set_app_info(self):
        """Test setting app info metrics."""
        from protest.metrics import set_app_info

        # Should not raise any exceptions
        set_app_info(
            version="2.0.0",
            environment="test",
            model_id="test-123",
        )

    def test_set_model_loaded(self):
        """Test setting model loaded metrics."""
        from protest.metrics import MODEL_LOADED, set_model_loaded

        set_model_loaded(True, load_time=1.5)
        # Gauge value should be 1
        assert MODEL_LOADED._value.get() == 1

        set_model_loaded(False)
        assert MODEL_LOADED._value.get() == 0

    def test_record_prediction_metrics(self):
        """Test recording prediction metrics."""
        from protest.metrics import (
            record_prediction_metrics,
        )

        # Record a prediction with cache miss
        record_prediction_metrics(
            country="Iraq",
            violence_level="Peaceful",
            participant_count=100,
            predictions={
                "verbal_coercion": {"probability": 0.75, "prediction": True},
                "constraint": {"probability": 0.20, "prediction": False},
            },
            latency=0.05,
            cached=False,
        )

        # Record a cached prediction
        record_prediction_metrics(
            country="Lebanon",
            violence_level="Riot",
            participant_count=500,
            predictions={
                "verbal_coercion": {"probability": 0.90, "prediction": True},
            },
            latency=0.001,
            cached=True,
        )

    def test_record_prediction_error(self):
        """Test recording prediction errors."""
        from protest.metrics import record_prediction_error

        # Should not raise any exceptions
        record_prediction_error(country="Iraq")
