"""
Model trainers for Pro-Test.

Implements RandomForest, XGBoost, and LightGBM trainers with
multi-output classification support.
"""

import logging
import uuid
from datetime import datetime

import numpy as np
import pandas as pd
from numpy.typing import NDArray
from sklearn.compose import ColumnTransformer
from sklearn.ensemble import RandomForestClassifier
from sklearn.impute import SimpleImputer
from sklearn.multioutput import MultiOutputClassifier
from sklearn.pipeline import Pipeline
from sklearn.preprocessing import OneHotEncoder, StandardScaler

from protest.models.base import BaseModel, ModelConfig, ModelMetadata, ModelType

logger = logging.getLogger(__name__)


def create_preprocessing_pipeline(
    categorical_features: list[str],
    numerical_features: list[str],
) -> ColumnTransformer:
    """Create a preprocessing pipeline for features.

    Args:
        categorical_features: List of categorical column names.
        numerical_features: List of numerical column names.

    Returns:
        ColumnTransformer for preprocessing.
    """
    categorical_transformer = Pipeline(
        steps=[
            ("imputer", SimpleImputer(strategy="constant", fill_value="Unknown")),
            ("onehot", OneHotEncoder(handle_unknown="ignore", sparse_output=False)),
        ]
    )

    numerical_transformer = Pipeline(
        steps=[
            ("imputer", SimpleImputer(strategy="mean")),
            ("scaler", StandardScaler()),
        ]
    )

    preprocessor = ColumnTransformer(
        transformers=[
            ("cat", categorical_transformer, categorical_features),
            ("num", numerical_transformer, numerical_features),
        ],
        remainder="drop",
    )

    return preprocessor


class RandomForestTrainer(BaseModel):
    """Random Forest classifier trainer."""

    def __init__(self, config: ModelConfig | None = None) -> None:
        """Initialize Random Forest trainer."""
        super().__init__(config)
        if self.config.model_type != ModelType.RANDOM_FOREST:
            self.config.model_type = ModelType.RANDOM_FOREST

    def fit(
        self,
        X: pd.DataFrame,
        y: pd.DataFrame | pd.Series,
    ) -> "RandomForestTrainer":
        """Fit Random Forest model.

        Args:
            X: Feature DataFrame.
            y: Target DataFrame or Series.

        Returns:
            Self for method chaining.
        """
        logger.info("Training Random Forest model...")

        # Identify feature types
        categorical_features = X.select_dtypes(include=["object", "category"]).columns.tolist()
        numerical_features = X.select_dtypes(include=["int64", "float64"]).columns.tolist()

        # Create preprocessing pipeline
        preprocessor = create_preprocessing_pipeline(categorical_features, numerical_features)

        # Get hyperparameters
        params = self.config.get_default_hyperparameters()
        params["random_state"] = self.config.random_state
        params["n_jobs"] = self.config.n_jobs

        # Create base classifier
        base_clf = RandomForestClassifier(**params)

        # Handle multi-output if y is DataFrame
        if isinstance(y, pd.DataFrame):
            classifier = MultiOutputClassifier(base_clf, n_jobs=self.config.n_jobs)
        else:
            classifier = base_clf

        # Create full pipeline
        self.pipeline = Pipeline(
            steps=[
                ("preprocessor", preprocessor),
                ("classifier", classifier),
            ]
        )

        # Fit the pipeline
        self.pipeline.fit(X, y)
        self.model = self.pipeline.named_steps["classifier"]
        self._is_fitted = True

        # Store metadata
        self.metadata = ModelMetadata(
            model_id=str(uuid.uuid4())[:8],
            model_type=ModelType.RANDOM_FOREST,
            version="2.0.0",
            created_at=datetime.utcnow(),
            config=self.config,
            training_samples=len(X),
            target_columns=list(y.columns) if isinstance(y, pd.DataFrame) else [str(y.name)],
            feature_importance=self.get_feature_importance(),
        )

        logger.info(f"Random Forest model trained. ID: {self.metadata.model_id}")
        return self

    def predict(self, X: pd.DataFrame) -> NDArray[np.int_]:
        """Predict class labels."""
        if not self._is_fitted:
            raise RuntimeError("Model must be fitted before prediction.")
        return self.pipeline.predict(X)

    def predict_proba(self, X: pd.DataFrame) -> list[NDArray[np.float64]]:
        """Predict class probabilities.

        Returns list of probability arrays, one per target.
        """
        if not self._is_fitted:
            raise RuntimeError("Model must be fitted before prediction.")

        # Get probabilities from pipeline
        if hasattr(self.model, "estimators_"):
            # MultiOutputClassifier
            probas = []
            X_transformed = self.pipeline.named_steps["preprocessor"].transform(X)
            for estimator in self.model.estimators_:
                probas.append(estimator.predict_proba(X_transformed))
            return probas
        else:
            # Single output
            return [self.pipeline.predict_proba(X)]

    def get_feature_importance(self) -> dict[str, float]:
        """Get feature importance from the model."""
        if not self._is_fitted:
            return {}

        try:
            preprocessor = self.pipeline.named_steps["preprocessor"]
            feature_names = preprocessor.get_feature_names_out()

            if hasattr(self.model, "estimators_"):
                # Average importance across all estimators
                importances = np.mean(
                    [est.feature_importances_ for est in self.model.estimators_], axis=0
                )
            else:
                importances = self.model.feature_importances_

            return dict(zip(feature_names, importances.tolist(), strict=False))
        except Exception as e:
            logger.warning(f"Could not get feature importance: {e}")
            return {}


class XGBoostTrainer(BaseModel):
    """XGBoost classifier trainer."""

    def __init__(self, config: ModelConfig | None = None) -> None:
        """Initialize XGBoost trainer."""
        super().__init__(config)
        if self.config.model_type != ModelType.XGBOOST:
            self.config.model_type = ModelType.XGBOOST

    def fit(
        self,
        X: pd.DataFrame,
        y: pd.DataFrame | pd.Series,
    ) -> "XGBoostTrainer":
        """Fit XGBoost model."""
        try:
            from xgboost import XGBClassifier
        except ImportError:
            raise ImportError("XGBoost is required. Install with: pip install xgboost")

        logger.info("Training XGBoost model...")

        # Identify feature types
        categorical_features = X.select_dtypes(include=["object", "category"]).columns.tolist()
        numerical_features = X.select_dtypes(include=["int64", "float64"]).columns.tolist()

        # Create preprocessing pipeline
        preprocessor = create_preprocessing_pipeline(categorical_features, numerical_features)

        # Get hyperparameters
        params = self.config.get_default_hyperparameters()
        params["random_state"] = self.config.random_state
        params["n_jobs"] = self.config.n_jobs
        params["use_label_encoder"] = False

        # Create base classifier
        base_clf = XGBClassifier(**params)

        # Handle multi-output
        if isinstance(y, pd.DataFrame):
            classifier = MultiOutputClassifier(base_clf, n_jobs=self.config.n_jobs)
        else:
            classifier = base_clf

        # Create full pipeline
        self.pipeline = Pipeline(
            steps=[
                ("preprocessor", preprocessor),
                ("classifier", classifier),
            ]
        )

        # Fit the pipeline
        self.pipeline.fit(X, y)
        self.model = self.pipeline.named_steps["classifier"]
        self._is_fitted = True

        # Store metadata
        self.metadata = ModelMetadata(
            model_id=str(uuid.uuid4())[:8],
            model_type=ModelType.XGBOOST,
            version="2.0.0",
            created_at=datetime.utcnow(),
            config=self.config,
            training_samples=len(X),
            target_columns=list(y.columns) if isinstance(y, pd.DataFrame) else [str(y.name)],
            feature_importance=self.get_feature_importance(),
        )

        logger.info(f"XGBoost model trained. ID: {self.metadata.model_id}")
        return self

    def predict(self, X: pd.DataFrame) -> NDArray[np.int_]:
        """Predict class labels."""
        if not self._is_fitted:
            raise RuntimeError("Model must be fitted before prediction.")
        return self.pipeline.predict(X)

    def predict_proba(self, X: pd.DataFrame) -> list[NDArray[np.float64]]:
        """Predict class probabilities."""
        if not self._is_fitted:
            raise RuntimeError("Model must be fitted before prediction.")

        if hasattr(self.model, "estimators_"):
            probas = []
            X_transformed = self.pipeline.named_steps["preprocessor"].transform(X)
            for estimator in self.model.estimators_:
                probas.append(estimator.predict_proba(X_transformed))
            return probas
        else:
            return [self.pipeline.predict_proba(X)]

    def get_feature_importance(self) -> dict[str, float]:
        """Get feature importance from XGBoost model."""
        if not self._is_fitted:
            return {}

        try:
            preprocessor = self.pipeline.named_steps["preprocessor"]
            feature_names = preprocessor.get_feature_names_out()

            if hasattr(self.model, "estimators_"):
                importances = np.mean(
                    [est.feature_importances_ for est in self.model.estimators_], axis=0
                )
            else:
                importances = self.model.feature_importances_

            return dict(zip(feature_names, importances.tolist(), strict=False))
        except Exception as e:
            logger.warning(f"Could not get feature importance: {e}")
            return {}


class LightGBMTrainer(BaseModel):
    """LightGBM classifier trainer."""

    def __init__(self, config: ModelConfig | None = None) -> None:
        """Initialize LightGBM trainer."""
        super().__init__(config)
        if self.config.model_type != ModelType.LIGHTGBM:
            self.config.model_type = ModelType.LIGHTGBM

    def fit(
        self,
        X: pd.DataFrame,
        y: pd.DataFrame | pd.Series,
    ) -> "LightGBMTrainer":
        """Fit LightGBM model."""
        try:
            from lightgbm import LGBMClassifier
        except ImportError:
            raise ImportError("LightGBM is required. Install with: pip install lightgbm")

        logger.info("Training LightGBM model...")

        # Identify feature types
        categorical_features = X.select_dtypes(include=["object", "category"]).columns.tolist()
        numerical_features = X.select_dtypes(include=["int64", "float64"]).columns.tolist()

        # Create preprocessing pipeline
        preprocessor = create_preprocessing_pipeline(categorical_features, numerical_features)

        # Get hyperparameters
        params = self.config.get_default_hyperparameters()
        params["random_state"] = self.config.random_state
        params["n_jobs"] = self.config.n_jobs

        # Create base classifier
        base_clf = LGBMClassifier(**params)

        # Handle multi-output
        if isinstance(y, pd.DataFrame):
            classifier = MultiOutputClassifier(base_clf, n_jobs=self.config.n_jobs)
        else:
            classifier = base_clf

        # Create full pipeline
        self.pipeline = Pipeline(
            steps=[
                ("preprocessor", preprocessor),
                ("classifier", classifier),
            ]
        )

        # Fit the pipeline
        self.pipeline.fit(X, y)
        self.model = self.pipeline.named_steps["classifier"]
        self._is_fitted = True

        # Store metadata
        self.metadata = ModelMetadata(
            model_id=str(uuid.uuid4())[:8],
            model_type=ModelType.LIGHTGBM,
            version="2.0.0",
            created_at=datetime.utcnow(),
            config=self.config,
            training_samples=len(X),
            target_columns=list(y.columns) if isinstance(y, pd.DataFrame) else [str(y.name)],
            feature_importance=self.get_feature_importance(),
        )

        logger.info(f"LightGBM model trained. ID: {self.metadata.model_id}")
        return self

    def predict(self, X: pd.DataFrame) -> NDArray[np.int_]:
        """Predict class labels."""
        if not self._is_fitted:
            raise RuntimeError("Model must be fitted before prediction.")
        return self.pipeline.predict(X)

    def predict_proba(self, X: pd.DataFrame) -> list[NDArray[np.float64]]:
        """Predict class probabilities."""
        if not self._is_fitted:
            raise RuntimeError("Model must be fitted before prediction.")

        if hasattr(self.model, "estimators_"):
            probas = []
            X_transformed = self.pipeline.named_steps["preprocessor"].transform(X)
            for estimator in self.model.estimators_:
                probas.append(estimator.predict_proba(X_transformed))
            return probas
        else:
            return [self.pipeline.predict_proba(X)]

    def get_feature_importance(self) -> dict[str, float]:
        """Get feature importance from LightGBM model."""
        if not self._is_fitted:
            return {}

        try:
            preprocessor = self.pipeline.named_steps["preprocessor"]
            feature_names = preprocessor.get_feature_names_out()

            if hasattr(self.model, "estimators_"):
                importances = np.mean(
                    [est.feature_importances_ for est in self.model.estimators_], axis=0
                )
            else:
                importances = self.model.feature_importances_

            return dict(zip(feature_names, importances.tolist(), strict=False))
        except Exception as e:
            logger.warning(f"Could not get feature importance: {e}")
            return {}


def get_trainer(model_type: ModelType | str, config: ModelConfig | None = None) -> BaseModel:
    """Factory function to get the appropriate trainer.

    Args:
        model_type: Type of model to train.
        config: Optional model configuration.

    Returns:
        Appropriate trainer instance.
    """
    if isinstance(model_type, str):
        model_type = ModelType(model_type)

    trainers = {
        ModelType.RANDOM_FOREST: RandomForestTrainer,
        ModelType.XGBOOST: XGBoostTrainer,
        ModelType.LIGHTGBM: LightGBMTrainer,
    }

    trainer_class = trainers.get(model_type)
    if trainer_class is None:
        raise ValueError(f"Unknown model type: {model_type}")

    return trainer_class(config)
