"""
Ensemble model for Pro-Test.

Combines multiple model types with weighted voting for improved predictions.
"""

import logging
import uuid
from dataclasses import dataclass, field
from datetime import datetime
from typing import Any

import numpy as np
import pandas as pd
from numpy.typing import NDArray

from protest.models.base import BaseModel, ModelConfig, ModelMetadata, ModelType
from protest.models.trainers import get_trainer

logger = logging.getLogger(__name__)


@dataclass
class EnsembleConfig:
    """Configuration for ensemble model."""

    # Models to include in ensemble
    model_types: list[ModelType] = field(
        default_factory=lambda: [
            ModelType.RANDOM_FOREST,
            ModelType.XGBOOST,
            ModelType.LIGHTGBM,
        ]
    )

    # Weights for each model (None = equal weights)
    weights: list[float] | None = None

    # Voting strategy: 'soft' (probability averaging) or 'hard' (majority vote)
    voting: str = "soft"

    # Base configuration shared by all models
    base_config: ModelConfig = field(default_factory=ModelConfig)

    # Model-specific hyperparameter overrides
    model_configs: dict[ModelType, dict[str, Any]] = field(default_factory=dict)

    def __post_init__(self) -> None:
        """Validate configuration after initialization."""
        if self.weights is not None:
            if len(self.weights) != len(self.model_types):
                raise ValueError("Number of weights must match number of model types")
            if not np.isclose(sum(self.weights), 1.0):
                # Normalize weights
                total = sum(self.weights)
                self.weights = [w / total for w in self.weights]


class EnsembleModel(BaseModel):
    """Ensemble model combining multiple classifiers.

    Uses weighted soft voting (probability averaging) or hard voting
    (majority vote) to combine predictions from multiple models.
    """

    def __init__(
        self,
        config: ModelConfig | None = None,
        ensemble_config: EnsembleConfig | None = None,
    ) -> None:
        """Initialize ensemble model.

        Args:
            config: Base model configuration.
            ensemble_config: Ensemble-specific configuration.
        """
        super().__init__(config)
        self.ensemble_config = ensemble_config or EnsembleConfig()
        self.models: dict[ModelType, BaseModel] = {}
        self.weights: list[float] = []

    def fit(
        self,
        X: pd.DataFrame,
        y: pd.DataFrame | pd.Series,
    ) -> "EnsembleModel":
        """Fit all models in the ensemble.

        Args:
            X: Feature DataFrame.
            y: Target DataFrame or Series.

        Returns:
            Self for method chaining.
        """
        logger.info(f"Training ensemble with {len(self.ensemble_config.model_types)} models...")

        # Set weights
        if self.ensemble_config.weights is not None:
            self.weights = self.ensemble_config.weights
        else:
            # Equal weights
            n_models = len(self.ensemble_config.model_types)
            self.weights = [1.0 / n_models] * n_models

        # Train each model
        for i, model_type in enumerate(self.ensemble_config.model_types):
            logger.info(
                f"Training {model_type.value} ({i + 1}/{len(self.ensemble_config.model_types)})..."
            )

            # Create config for this model
            model_config = ModelConfig(
                model_type=model_type,
                random_state=self.config.random_state,
                n_jobs=self.config.n_jobs,
                target_columns=self.config.target_columns,
                feature_columns=self.config.feature_columns,
            )

            # Apply model-specific overrides
            if model_type in self.ensemble_config.model_configs:
                model_config.hyperparameters = self.ensemble_config.model_configs[model_type]

            # Get and train the model
            trainer = get_trainer(model_type, model_config)
            trainer.fit(X, y)
            self.models[model_type] = trainer

        self._is_fitted = True

        # Create ensemble metadata
        self.metadata = ModelMetadata(
            model_id=str(uuid.uuid4())[:8],
            model_type=ModelType.ENSEMBLE,
            version="2.0.0",
            created_at=datetime.utcnow(),
            config=self.config,
            training_samples=len(X),
            target_columns=list(y.columns) if isinstance(y, pd.DataFrame) else [str(y.name)],
            feature_importance=self.get_feature_importance(),
            metrics={"n_models": len(self.models)},
        )

        logger.info(f"Ensemble trained successfully. ID: {self.metadata.model_id}")
        return self

    def predict(self, X: pd.DataFrame) -> NDArray[np.int_]:
        """Predict class labels using ensemble voting.

        Args:
            X: Feature DataFrame.

        Returns:
            Predicted class labels.
        """
        if not self._is_fitted:
            raise RuntimeError("Ensemble must be fitted before prediction.")

        if self.ensemble_config.voting == "soft":
            # Soft voting: average probabilities, then threshold
            probas = self.predict_proba(X)
            # For each target, take argmax of averaged probabilities
            predictions = []
            for proba in probas:
                predictions.append(np.argmax(proba, axis=1))
            return np.column_stack(predictions)
        else:
            # Hard voting: majority vote
            all_predictions = []
            for model in self.models.values():
                all_predictions.append(model.predict(X))

            # Stack and take mode
            stacked = np.stack(all_predictions, axis=0)
            from scipy import stats

            predictions, _ = stats.mode(stacked, axis=0, keepdims=False)
            return predictions

    def predict_proba(self, X: pd.DataFrame) -> list[NDArray[np.float64]]:
        """Predict class probabilities using weighted averaging.

        Args:
            X: Feature DataFrame.

        Returns:
            List of probability arrays, one per target.
        """
        if not self._is_fitted:
            raise RuntimeError("Ensemble must be fitted before prediction.")

        # Collect probabilities from all models
        all_probas: list[list[NDArray[np.float64]]] = []
        for _model_type, model in self.models.items():
            model_probas = model.predict_proba(X)
            all_probas.append(model_probas)

        # Weighted average of probabilities
        n_targets = len(all_probas[0])
        averaged_probas: list[NDArray[np.float64]] = []

        for target_idx in range(n_targets):
            weighted_sum = np.zeros_like(all_probas[0][target_idx])
            for model_idx, model_probas in enumerate(all_probas):
                weighted_sum += self.weights[model_idx] * model_probas[target_idx]
            averaged_probas.append(weighted_sum)

        return averaged_probas

    def predict_proba_with_confidence(
        self,
        X: pd.DataFrame,
    ) -> tuple[list[NDArray[np.float64]], list[NDArray[np.float64]]]:
        """Predict probabilities with confidence intervals.

        Uses the variance across ensemble members as a measure of uncertainty.

        Args:
            X: Feature DataFrame.

        Returns:
            Tuple of (mean_probabilities, std_probabilities).
        """
        if not self._is_fitted:
            raise RuntimeError("Ensemble must be fitted before prediction.")

        # Collect probabilities from all models
        all_probas: list[list[NDArray[np.float64]]] = []
        for model in self.models.values():
            all_probas.append(model.predict_proba(X))

        n_targets = len(all_probas[0])
        mean_probas: list[NDArray[np.float64]] = []
        std_probas: list[NDArray[np.float64]] = []

        for target_idx in range(n_targets):
            # Stack probabilities across models
            stacked = np.stack([mp[target_idx] for mp in all_probas], axis=0)

            # Calculate weighted mean
            weights_array = np.array(self.weights).reshape(-1, 1, 1)
            weighted_mean = np.sum(stacked * weights_array, axis=0)

            # Calculate weighted std for confidence
            weighted_var = np.sum(
                weights_array * (stacked - weighted_mean) ** 2,
                axis=0,
            )
            weighted_std = np.sqrt(weighted_var)

            mean_probas.append(weighted_mean)
            std_probas.append(weighted_std)

        return mean_probas, std_probas

    def get_feature_importance(self) -> dict[str, float]:
        """Get averaged feature importance across all models."""
        if not self._is_fitted:
            return {}

        all_importances: dict[str, list[float]] = {}

        for _model_type, model in self.models.items():
            importance = model.get_feature_importance()
            for feature, value in importance.items():
                if feature not in all_importances:
                    all_importances[feature] = []
                all_importances[feature].append(value)

        # Average importances
        averaged = {feature: np.mean(values) for feature, values in all_importances.items()}

        # Sort by importance
        return dict(sorted(averaged.items(), key=lambda x: x[1], reverse=True))

    def get_model_metrics(self) -> dict[str, dict[str, Any]]:
        """Get metrics for each individual model in the ensemble."""
        metrics = {}
        for model_type, model in self.models.items():
            if model.metadata:
                metrics[model_type.value] = {
                    "model_id": model.metadata.model_id,
                    "metrics": model.metadata.metrics,
                }
        return metrics

    def save(self, path: str) -> None:
        """Save ensemble model to disk."""
        from pathlib import Path

        import joblib

        path = Path(path)
        path.parent.mkdir(parents=True, exist_ok=True)

        ensemble_data = {
            "models": {k.value: v for k, v in self.models.items()},
            "weights": self.weights,
            "config": self.config,
            "ensemble_config": self.ensemble_config,
            "metadata": self.metadata,
        }
        joblib.dump(ensemble_data, path)
        logger.info(f"Ensemble saved to {path}")

    @classmethod
    def load(cls, path: str) -> "EnsembleModel":
        """Load ensemble model from disk."""
        from pathlib import Path

        import joblib

        path = Path(path)
        if not path.exists():
            raise FileNotFoundError(f"Ensemble not found at {path}")

        ensemble_data = joblib.load(path)

        instance = cls(
            config=ensemble_data.get("config"),
            ensemble_config=ensemble_data.get("ensemble_config"),
        )
        instance.models = {ModelType(k): v for k, v in ensemble_data.get("models", {}).items()}
        instance.weights = ensemble_data.get("weights", [])
        instance.metadata = ensemble_data.get("metadata")
        instance._is_fitted = len(instance.models) > 0

        logger.info(f"Ensemble loaded from {path}")
        return instance
