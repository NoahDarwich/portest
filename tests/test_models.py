"""
Tests for the models module.
"""

from datetime import datetime
from pathlib import Path

import numpy as np
import pandas as pd
import pytest


class TestModelConfig:
    """Tests for model configuration."""

    def test_model_config_creation(self):
        """Test creating a model config."""
        from protest.models.base import ModelConfig, ModelType

        config = ModelConfig(
            model_type=ModelType.RANDOM_FOREST,
            random_state=42,
        )

        assert config.model_type == ModelType.RANDOM_FOREST
        assert config.random_state == 42

    def test_model_config_defaults(self):
        """Test model config default values."""
        from protest.models.base import ModelConfig, ModelType

        config = ModelConfig()

        assert config.model_type == ModelType.RANDOM_FOREST
        assert config.random_state == 42
        assert config.cv_folds == 5

    def test_model_config_hyperparameters(self):
        """Test model config with hyperparameters."""
        from protest.models.base import ModelConfig, ModelType

        config = ModelConfig(
            model_type=ModelType.XGBOOST,
            hyperparameters={"n_estimators": 100},
        )

        params = config.get_default_hyperparameters()
        assert "n_estimators" in params
        assert params["n_estimators"] == 100

    def test_model_config_feature_columns(self):
        """Test model config feature columns."""
        from protest.models.base import ModelConfig

        config = ModelConfig()

        expected_features = [
            "country",
            "governorate",
            "locationtypeend",
            "demandtypeone",
            "tacticprimary",
            "violence",
            "combined_sizes",
        ]

        assert config.feature_columns == expected_features


class TestModelMetadata:
    """Tests for model metadata."""

    def test_model_metadata_creation(self):
        """Test creating model metadata."""
        from protest.models.base import ModelConfig, ModelMetadata, ModelType

        config = ModelConfig()
        metadata = ModelMetadata(
            model_id="test-123",
            model_type=ModelType.ENSEMBLE,
            version="1.0.0",
            created_at=datetime.now(),
            config=config,
        )

        assert metadata.model_id == "test-123"
        assert metadata.model_type == ModelType.ENSEMBLE
        assert metadata.version == "1.0.0"

    def test_model_metadata_to_dict(self):
        """Test converting metadata to dict."""
        from protest.models.base import ModelConfig, ModelMetadata, ModelType

        config = ModelConfig()
        metadata = ModelMetadata(
            model_id="test-456",
            model_type=ModelType.RANDOM_FOREST,
            version="2.0.0",
            created_at=datetime.now(),
            config=config,
        )
        meta_dict = metadata.to_dict()

        assert isinstance(meta_dict, dict)
        assert meta_dict["model_id"] == "test-456"
        assert meta_dict["model_type"] == "random_forest"


class TestModelType:
    """Tests for model type enum."""

    def test_model_type_values(self):
        """Test model type enum values."""
        from protest.models.base import ModelType

        assert ModelType.RANDOM_FOREST.value == "random_forest"
        assert ModelType.XGBOOST.value == "xgboost"
        assert ModelType.LIGHTGBM.value == "lightgbm"
        assert ModelType.ENSEMBLE.value == "ensemble"


class TestEnsembleModel:
    """Tests for ensemble model."""

    @pytest.fixture
    def sample_data(self):
        """Create sample data for testing."""
        return pd.DataFrame(
            {
                "country": ["Iraq", "Lebanon", "Egypt"] * 10,
                "governorate": ["Baghdad", "Beirut", "Cairo"] * 10,
                "locationtypeend": ["Midan", "Main road", "Government building"] * 10,
                "demandtypeone": ["Politics (national)", "Economy", "Services"] * 10,
                "tacticprimary": ["Demonstration / protest"] * 30,
                "violence": ["Peaceful", "Riot", "Unknown"] * 10,
                "combined_sizes": [100, 500, 1000] * 10,
            }
        )

    def test_ensemble_model_import(self):
        """Test that ensemble model can be imported."""
        from protest.models.ensemble import EnsembleModel

        assert EnsembleModel is not None

    @pytest.mark.slow
    def test_ensemble_model_load(self, project_root: Path):
        """Test loading ensemble model from disk."""
        from protest.models.ensemble import EnsembleModel

        model_path = project_root / "models" / "ensemble_model.joblib"
        if not model_path.exists():
            pytest.skip("Ensemble model file not available")

        model = EnsembleModel.load(model_path)

        assert model is not None
        assert hasattr(model, "predict")
        assert hasattr(model, "predict_proba")
        assert hasattr(model, "metadata")

    @pytest.mark.slow
    def test_ensemble_model_predict(self, project_root: Path, sample_data):
        """Test ensemble model predictions."""
        from protest.models.ensemble import EnsembleModel

        model_path = project_root / "models" / "ensemble_model.joblib"
        if not model_path.exists():
            pytest.skip("Ensemble model file not available")

        model = EnsembleModel.load(model_path)
        predictions = model.predict(sample_data.iloc[:1])

        assert predictions is not None
        assert predictions.shape[1] == 7  # 7 targets

    @pytest.mark.slow
    def test_ensemble_model_predict_proba(self, project_root: Path, sample_data):
        """Test ensemble model probability predictions."""
        from protest.models.ensemble import EnsembleModel

        model_path = project_root / "models" / "ensemble_model.joblib"
        if not model_path.exists():
            pytest.skip("Ensemble model file not available")

        model = EnsembleModel.load(model_path)
        probs = model.predict_proba(sample_data.iloc[:1])

        assert probs is not None
        assert len(probs) == 7  # 7 targets

        # Each probability should be in [0, 1]
        for target_probs in probs:
            assert target_probs[0][0] >= 0 and target_probs[0][0] <= 1
            assert target_probs[0][1] >= 0 and target_probs[0][1] <= 1

    @pytest.mark.slow
    def test_ensemble_model_feature_importance(self, project_root: Path):
        """Test getting feature importance from ensemble model."""
        from protest.models.ensemble import EnsembleModel

        model_path = project_root / "models" / "ensemble_model.joblib"
        if not model_path.exists():
            pytest.skip("Ensemble model file not available")

        model = EnsembleModel.load(model_path)
        importance = model.get_feature_importance()

        assert importance is not None
        assert isinstance(importance, dict)
        assert len(importance) > 0

        # All importance values should be non-negative
        for value in importance.values():
            assert value >= 0


class TestTrainers:
    """Tests for model trainers."""

    def test_random_forest_trainer_import(self):
        """Test that RF trainer can be imported."""
        from protest.models.trainers import RandomForestTrainer

        assert RandomForestTrainer is not None

    def test_xgboost_trainer_import(self):
        """Test that XGBoost trainer can be imported."""
        from protest.models.trainers import XGBoostTrainer

        assert XGBoostTrainer is not None

    def test_lightgbm_trainer_import(self):
        """Test that LightGBM trainer can be imported."""
        from protest.models.trainers import LightGBMTrainer

        assert LightGBMTrainer is not None

    def test_trainer_creation(self):
        """Test creating a trainer."""
        from protest.models.base import ModelConfig, ModelType
        from protest.models.trainers import RandomForestTrainer

        config = ModelConfig(model_type=ModelType.RANDOM_FOREST)
        trainer = RandomForestTrainer(config=config)

        assert trainer is not None
        assert trainer.config.model_type == ModelType.RANDOM_FOREST


class TestEvaluationMetrics:
    """Tests for evaluation metrics."""

    def test_evaluation_metrics_import(self):
        """Test that EvaluationMetrics can be imported."""
        from protest.models.evaluation import EvaluationMetrics

        assert EvaluationMetrics is not None

    def test_calculate_metrics_import(self):
        """Test that calculate_metrics can be imported."""
        from protest.models.evaluation import calculate_metrics

        assert calculate_metrics is not None

    def test_metrics_calculation(self):
        """Test basic metrics calculation."""
        from protest.models.evaluation import calculate_metrics

        y_true = np.array([0, 1, 1, 0, 1, 0, 1, 1])
        y_pred = np.array([0, 1, 0, 0, 1, 1, 1, 1])

        metrics = calculate_metrics(y_true, y_pred)

        # EvaluationMetrics is a dataclass with these fields
        assert hasattr(metrics, "accuracy")
        assert hasattr(metrics, "precision")
        assert hasattr(metrics, "recall")
        assert hasattr(metrics, "f1")

        # Check values are in valid range
        assert 0 <= metrics.accuracy <= 1
        assert 0 <= metrics.precision <= 1
        assert 0 <= metrics.recall <= 1
        assert 0 <= metrics.f1 <= 1

    def test_model_comparison_result_import(self):
        """Test that ModelComparisonResult can be imported."""
        from protest.models.evaluation import ModelComparisonResult

        assert ModelComparisonResult is not None


class TestModelRegistry:
    """Tests for model registry."""

    def test_registry_import(self):
        """Test that registry can be imported."""
        from protest.models.registry import ModelRegistry

        assert ModelRegistry is not None

    def test_registry_initialization(self, tmp_path):
        """Test initializing a model registry."""
        from protest.models.registry import ModelRegistry

        registry = ModelRegistry(registry_path=tmp_path / "registry")

        assert registry is not None
        assert (tmp_path / "registry").exists()
