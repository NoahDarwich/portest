"""
Model Registry for Pro-Test.

Provides model versioning, tracking, and lifecycle management.
Integrates with MLflow when available.
"""

import json
import logging
import os
from dataclasses import asdict, dataclass, field
from datetime import datetime
from pathlib import Path
from typing import Any

import joblib

from protest.models.base import BaseModel, ModelMetadata, ModelType

logger = logging.getLogger(__name__)


@dataclass
class ModelVersion:
    """Represents a versioned model in the registry."""

    model_id: str
    version: str
    model_type: ModelType
    stage: str  # "development", "staging", "production", "archived"
    created_at: datetime
    metrics: dict[str, float] = field(default_factory=dict)
    tags: dict[str, str] = field(default_factory=dict)
    description: str = ""
    artifact_path: str = ""

    def to_dict(self) -> dict[str, Any]:
        """Convert to dictionary."""
        return {
            "model_id": self.model_id,
            "version": self.version,
            "model_type": self.model_type.value,
            "stage": self.stage,
            "created_at": self.created_at.isoformat(),
            "metrics": self.metrics,
            "tags": self.tags,
            "description": self.description,
            "artifact_path": self.artifact_path,
        }

    @classmethod
    def from_dict(cls, data: dict[str, Any]) -> "ModelVersion":
        """Create from dictionary."""
        return cls(
            model_id=data["model_id"],
            version=data["version"],
            model_type=ModelType(data["model_type"]),
            stage=data["stage"],
            created_at=datetime.fromisoformat(data["created_at"]),
            metrics=data.get("metrics", {}),
            tags=data.get("tags", {}),
            description=data.get("description", ""),
            artifact_path=data.get("artifact_path", ""),
        )


class ModelRegistry:
    """Local model registry for versioning and management.

    Provides a simple file-based registry that can be extended
    with MLflow integration for production use.
    """

    def __init__(self, registry_path: Path | str = "models/registry") -> None:
        """Initialize the model registry.

        Args:
            registry_path: Path to store registry data and models.
        """
        self.registry_path = Path(registry_path)
        self.registry_path.mkdir(parents=True, exist_ok=True)
        self.models_path = self.registry_path / "artifacts"
        self.models_path.mkdir(exist_ok=True)
        self._registry_file = self.registry_path / "registry.json"
        self._registry: dict[str, list[ModelVersion]] = self._load_registry()

    def _load_registry(self) -> dict[str, list[ModelVersion]]:
        """Load registry from disk."""
        if self._registry_file.exists():
            with open(self._registry_file) as f:
                data = json.load(f)
                return {
                    name: [ModelVersion.from_dict(v) for v in versions]
                    for name, versions in data.items()
                }
        return {}

    def _save_registry(self) -> None:
        """Save registry to disk."""
        data = {
            name: [v.to_dict() for v in versions]
            for name, versions in self._registry.items()
        }
        with open(self._registry_file, "w") as f:
            json.dump(data, f, indent=2)

    def register_model(
        self,
        model: BaseModel,
        name: str,
        description: str = "",
        tags: dict[str, str] | None = None,
    ) -> ModelVersion:
        """Register a trained model in the registry.

        Args:
            model: Trained model to register.
            name: Name for the model (e.g., "protest_predictor").
            description: Description of the model.
            tags: Optional tags for the model.

        Returns:
            ModelVersion for the registered model.
        """
        if not model.is_fitted:
            raise RuntimeError("Cannot register unfitted model.")

        # Determine version number
        existing_versions = self._registry.get(name, [])
        version_num = len(existing_versions) + 1
        version = f"v{version_num}.0.0"

        # Create model version
        model_version = ModelVersion(
            model_id=model.metadata.model_id if model.metadata else f"{name}_{version_num}",
            version=version,
            model_type=model.metadata.model_type if model.metadata else ModelType.RANDOM_FOREST,
            stage="development",
            created_at=datetime.utcnow(),
            metrics=model.metadata.metrics if model.metadata else {},
            tags=tags or {},
            description=description,
        )

        # Save model artifact
        artifact_path = self.models_path / name / version
        artifact_path.mkdir(parents=True, exist_ok=True)
        model_file = artifact_path / "model.joblib"
        model.save(model_file)
        model_version.artifact_path = str(model_file)

        # Save metadata
        if model.metadata:
            metadata_file = artifact_path / "metadata.json"
            with open(metadata_file, "w") as f:
                json.dump(model.metadata.to_dict(), f, indent=2)

        # Update registry
        if name not in self._registry:
            self._registry[name] = []
        self._registry[name].append(model_version)
        self._save_registry()

        logger.info(f"Registered model '{name}' version {version}")
        return model_version

    def get_model(
        self,
        name: str,
        version: str | None = None,
        stage: str | None = None,
    ) -> BaseModel:
        """Load a model from the registry.

        Args:
            name: Model name.
            version: Specific version (default: latest).
            stage: Get model at specific stage (e.g., "production").

        Returns:
            Loaded model.
        """
        versions = self._registry.get(name, [])
        if not versions:
            raise ValueError(f"No model found with name '{name}'")

        # Filter by stage if specified
        if stage:
            versions = [v for v in versions if v.stage == stage]
            if not versions:
                raise ValueError(f"No model '{name}' at stage '{stage}'")

        # Get specific version or latest
        if version:
            model_version = next((v for v in versions if v.version == version), None)
            if not model_version:
                raise ValueError(f"Version {version} not found for model '{name}'")
        else:
            model_version = versions[-1]  # Latest

        # Load model
        return BaseModel.load(model_version.artifact_path)

    def promote_model(
        self,
        name: str,
        version: str,
        to_stage: str,
    ) -> ModelVersion:
        """Promote a model to a new stage.

        Args:
            name: Model name.
            version: Version to promote.
            to_stage: Target stage ("staging", "production", "archived").

        Returns:
            Updated ModelVersion.
        """
        versions = self._registry.get(name, [])
        model_version = next((v for v in versions if v.version == version), None)

        if not model_version:
            raise ValueError(f"Model '{name}' version {version} not found")

        # If promoting to production, archive current production model
        if to_stage == "production":
            for v in versions:
                if v.stage == "production":
                    v.stage = "archived"
                    logger.info(f"Archived previous production model: {v.version}")

        model_version.stage = to_stage
        self._save_registry()

        logger.info(f"Promoted '{name}' {version} to {to_stage}")
        return model_version

    def list_models(self, name: str | None = None) -> dict[str, list[ModelVersion]]:
        """List all registered models or versions of a specific model.

        Args:
            name: Optional model name to filter.

        Returns:
            Dictionary of model names to their versions.
        """
        if name:
            return {name: self._registry.get(name, [])}
        return self._registry

    def get_production_model(self, name: str) -> BaseModel:
        """Get the current production model.

        Args:
            name: Model name.

        Returns:
            Production model.
        """
        return self.get_model(name, stage="production")

    def delete_model(self, name: str, version: str | None = None) -> None:
        """Delete a model or specific version from the registry.

        Args:
            name: Model name.
            version: Specific version to delete (default: all versions).
        """
        if name not in self._registry:
            raise ValueError(f"Model '{name}' not found")

        if version:
            self._registry[name] = [
                v for v in self._registry[name] if v.version != version
            ]
            logger.info(f"Deleted '{name}' version {version}")
        else:
            del self._registry[name]
            logger.info(f"Deleted all versions of '{name}'")

        self._save_registry()

    def compare_versions(
        self,
        name: str,
        versions: list[str] | None = None,
    ) -> pd.DataFrame:
        """Compare metrics across model versions.

        Args:
            name: Model name.
            versions: Specific versions to compare (default: all).

        Returns:
            DataFrame with version comparison.
        """
        import pandas as pd

        model_versions = self._registry.get(name, [])
        if versions:
            model_versions = [v for v in model_versions if v.version in versions]

        rows = []
        for v in model_versions:
            row = {
                "version": v.version,
                "stage": v.stage,
                "created_at": v.created_at,
                **v.metrics,
            }
            rows.append(row)

        return pd.DataFrame(rows)


class MLflowRegistry(ModelRegistry):
    """MLflow-backed model registry for production use.

    Extends the base registry with MLflow tracking and model registry.
    """

    def __init__(
        self,
        tracking_uri: str | None = None,
        experiment_name: str = "pro-test",
    ) -> None:
        """Initialize MLflow registry.

        Args:
            tracking_uri: MLflow tracking server URI.
            experiment_name: MLflow experiment name.
        """
        try:
            import mlflow
        except ImportError:
            raise ImportError("MLflow required. Install with: pip install mlflow")

        self.tracking_uri = tracking_uri or os.getenv("MLFLOW_TRACKING_URI", "mlruns")
        self.experiment_name = experiment_name

        mlflow.set_tracking_uri(self.tracking_uri)
        mlflow.set_experiment(experiment_name)

        self._mlflow = mlflow
        logger.info(f"MLflow registry initialized at {self.tracking_uri}")

    def log_training_run(
        self,
        model: BaseModel,
        X_train: pd.DataFrame,
        y_train: pd.DataFrame,
        metrics: dict[str, float],
        params: dict[str, Any] | None = None,
        tags: dict[str, str] | None = None,
    ) -> str:
        """Log a training run to MLflow.

        Args:
            model: Trained model.
            X_train: Training features.
            y_train: Training targets.
            metrics: Evaluation metrics.
            params: Model parameters.
            tags: Run tags.

        Returns:
            MLflow run ID.
        """
        import pandas as pd

        with self._mlflow.start_run() as run:
            # Log parameters
            if params:
                self._mlflow.log_params(params)
            elif model.config:
                self._mlflow.log_params(model.config.get_default_hyperparameters())

            # Log metrics
            self._mlflow.log_metrics(metrics)

            # Log tags
            if tags:
                self._mlflow.set_tags(tags)

            # Log model
            self._mlflow.sklearn.log_model(
                model.pipeline,
                "model",
                registered_model_name=f"pro-test-{model.config.model_type.value}"
                if model.config
                else "pro-test",
            )

            # Log feature importance
            if model.is_fitted:
                importance = model.get_feature_importance()
                if importance:
                    importance_df = pd.DataFrame(
                        list(importance.items()), columns=["feature", "importance"]
                    )
                    self._mlflow.log_table(importance_df, "feature_importance.json")

            return run.info.run_id

    def get_best_model(
        self,
        metric: str = "f1",
        model_type: ModelType | None = None,
    ) -> tuple[Any, str]:
        """Get the best model based on a metric.

        Args:
            metric: Metric to optimize.
            model_type: Filter by model type.

        Returns:
            Tuple of (model, run_id).
        """
        import mlflow

        experiment = mlflow.get_experiment_by_name(self.experiment_name)
        if not experiment:
            raise ValueError(f"Experiment '{self.experiment_name}' not found")

        # Search for best run
        filter_string = ""
        if model_type:
            filter_string = f"tags.model_type = '{model_type.value}'"

        runs = mlflow.search_runs(
            experiment_ids=[experiment.experiment_id],
            filter_string=filter_string,
            order_by=[f"metrics.{metric} DESC"],
            max_results=1,
        )

        if runs.empty:
            raise ValueError("No runs found")

        best_run = runs.iloc[0]
        run_id = best_run["run_id"]

        # Load model
        model_uri = f"runs:/{run_id}/model"
        model = mlflow.sklearn.load_model(model_uri)

        return model, run_id


# Import pandas at module level for type hints
import pandas as pd
