"""
Base model classes and configuration for Pro-Test ML models.
"""

from abc import ABC, abstractmethod
from dataclasses import dataclass, field
from datetime import datetime
from enum import Enum
from pathlib import Path
from typing import Any

import joblib
import numpy as np
import pandas as pd
from numpy.typing import NDArray


class ModelType(str, Enum):
    """Supported model types."""

    RANDOM_FOREST = "random_forest"
    XGBOOST = "xgboost"
    LIGHTGBM = "lightgbm"
    ENSEMBLE = "ensemble"


@dataclass
class ModelConfig:
    """Configuration for model training."""

    model_type: ModelType = ModelType.RANDOM_FOREST
    random_state: int = 42
    n_jobs: int = -1
    verbose: int = 0

    # Cross-validation settings
    cv_folds: int = 5
    stratified: bool = True

    # Model-specific hyperparameters
    hyperparameters: dict[str, Any] = field(default_factory=dict)

    # Target columns for multi-output classification
    target_columns: list[str] = field(
        default_factory=lambda: [
            "teargas",
            "rubberbullets",
            "liveammo",
            "sticks",
            "surround",
            "cleararea",
            "policerepress",
        ]
    )

    # Feature columns
    feature_columns: list[str] = field(
        default_factory=lambda: [
            "country",
            "governorate",
            "locationtypeend",
            "demandtypeone",
            "tacticprimary",
            "violence",
            "combined_sizes",
        ]
    )

    def get_default_hyperparameters(self) -> dict[str, Any]:
        """Get default hyperparameters based on model type."""
        defaults = {
            ModelType.RANDOM_FOREST: {
                "n_estimators": 200,
                "max_depth": 20,
                "min_samples_split": 5,
                "min_samples_leaf": 2,
                "class_weight": "balanced",
            },
            ModelType.XGBOOST: {
                "n_estimators": 200,
                "max_depth": 6,
                "learning_rate": 0.1,
                "subsample": 0.8,
                "colsample_bytree": 0.8,
                "scale_pos_weight": 1,
                "eval_metric": "logloss",
            },
            ModelType.LIGHTGBM: {
                "n_estimators": 200,
                "max_depth": -1,
                "num_leaves": 31,
                "learning_rate": 0.1,
                "subsample": 0.8,
                "colsample_bytree": 0.8,
                "class_weight": "balanced",
                "verbose": -1,
            },
        }
        return {**defaults.get(self.model_type, {}), **self.hyperparameters}


@dataclass
class ModelMetadata:
    """Metadata for trained models."""

    model_id: str
    model_type: ModelType
    version: str
    created_at: datetime
    config: ModelConfig
    metrics: dict[str, float] = field(default_factory=dict)
    feature_importance: dict[str, float] = field(default_factory=dict)
    training_samples: int = 0
    target_columns: list[str] = field(default_factory=list)

    def to_dict(self) -> dict[str, Any]:
        """Convert metadata to dictionary."""
        return {
            "model_id": self.model_id,
            "model_type": self.model_type.value,
            "version": self.version,
            "created_at": self.created_at.isoformat(),
            "metrics": self.metrics,
            "feature_importance": self.feature_importance,
            "training_samples": self.training_samples,
            "target_columns": self.target_columns,
        }


class BaseModel(ABC):
    """Abstract base class for all Pro-Test models."""

    def __init__(self, config: ModelConfig | None = None) -> None:
        """Initialize the model with configuration."""
        self.config = config or ModelConfig()
        self.model: Any | None = None
        self.pipeline: Any | None = None
        self.metadata: ModelMetadata | None = None
        self._is_fitted: bool = False

    @property
    def is_fitted(self) -> bool:
        """Check if model is fitted."""
        return self._is_fitted

    @abstractmethod
    def fit(
        self,
        X: pd.DataFrame,
        y: pd.DataFrame | pd.Series,
    ) -> "BaseModel":
        """Fit the model to training data."""
        pass

    @abstractmethod
    def predict(self, X: pd.DataFrame) -> NDArray[np.int_]:
        """Predict class labels."""
        pass

    @abstractmethod
    def predict_proba(self, X: pd.DataFrame) -> list[NDArray[np.float64]]:
        """Predict class probabilities."""
        pass

    def get_feature_importance(self) -> dict[str, float]:
        """Get feature importance scores."""
        if not self._is_fitted:
            raise RuntimeError("Model must be fitted before getting feature importance.")
        return {}

    def save(self, path: Path | str) -> None:
        """Save model to disk."""
        path = Path(path)
        path.parent.mkdir(parents=True, exist_ok=True)

        model_data = {
            "model": self.model,
            "pipeline": self.pipeline,
            "metadata": self.metadata,
            "config": self.config,
        }
        joblib.dump(model_data, path)

    @classmethod
    def load(cls, path: Path | str) -> "BaseModel":
        """Load model from disk."""
        path = Path(path)
        if not path.exists():
            raise FileNotFoundError(f"Model not found at {path}")

        model_data = joblib.load(path)

        instance = cls(config=model_data.get("config"))
        instance.model = model_data.get("model")
        instance.pipeline = model_data.get("pipeline")
        instance.metadata = model_data.get("metadata")
        instance._is_fitted = instance.model is not None

        return instance

    def __repr__(self) -> str:
        """String representation."""
        status = "fitted" if self._is_fitted else "not fitted"
        return f"{self.__class__.__name__}(config={self.config.model_type.value}, {status})"
