"""
Model evaluation and benchmarking utilities for Pro-Test.

Provides comprehensive metrics, cross-validation, and model comparison tools.
"""

import logging
from dataclasses import dataclass, field
from typing import Any

import numpy as np
import pandas as pd
from numpy.typing import NDArray
from sklearn.metrics import (
    accuracy_score,
    classification_report,
    confusion_matrix,
    f1_score,
    precision_score,
    recall_score,
    roc_auc_score,
)
from sklearn.model_selection import StratifiedKFold

from protest.models.base import BaseModel, ModelConfig, ModelType
from protest.models.trainers import get_trainer

logger = logging.getLogger(__name__)


@dataclass
class EvaluationMetrics:
    """Container for evaluation metrics."""

    accuracy: float = 0.0
    precision: float = 0.0
    recall: float = 0.0
    f1: float = 0.0
    roc_auc: float | None = None

    # Per-class metrics
    class_metrics: dict[str, dict[str, float]] = field(default_factory=dict)

    # Confusion matrix
    confusion_matrix: NDArray[np.int_] | None = None

    def to_dict(self) -> dict[str, Any]:
        """Convert to dictionary."""
        return {
            "accuracy": self.accuracy,
            "precision": self.precision,
            "recall": self.recall,
            "f1": self.f1,
            "roc_auc": self.roc_auc,
            "class_metrics": self.class_metrics,
        }


@dataclass
class ModelComparisonResult:
    """Results from comparing multiple models."""

    model_type: ModelType
    metrics: dict[str, EvaluationMetrics]  # Per-target metrics
    overall_metrics: EvaluationMetrics
    training_time: float = 0.0
    feature_importance: dict[str, float] = field(default_factory=dict)

    def to_dict(self) -> dict[str, Any]:
        """Convert to dictionary."""
        return {
            "model_type": self.model_type.value,
            "overall_metrics": self.overall_metrics.to_dict(),
            "per_target_metrics": {k: v.to_dict() for k, v in self.metrics.items()},
            "training_time": self.training_time,
            "top_features": dict(list(self.feature_importance.items())[:10]),
        }


def calculate_metrics(
    y_true: NDArray[np.int_],
    y_pred: NDArray[np.int_],
    y_proba: NDArray[np.float64] | None = None,
) -> EvaluationMetrics:
    """Calculate comprehensive classification metrics.

    Args:
        y_true: True labels.
        y_pred: Predicted labels.
        y_proba: Predicted probabilities (optional, for ROC-AUC).

    Returns:
        EvaluationMetrics with all calculated metrics.
    """
    metrics = EvaluationMetrics(
        accuracy=accuracy_score(y_true, y_pred),
        precision=precision_score(y_true, y_pred, average="weighted", zero_division=0),
        recall=recall_score(y_true, y_pred, average="weighted", zero_division=0),
        f1=f1_score(y_true, y_pred, average="weighted", zero_division=0),
    )

    # Calculate ROC-AUC if probabilities provided
    if y_proba is not None:
        try:
            # Handle binary classification
            if y_proba.ndim == 2 and y_proba.shape[1] == 2:
                metrics.roc_auc = roc_auc_score(y_true, y_proba[:, 1])
            elif y_proba.ndim == 1:
                metrics.roc_auc = roc_auc_score(y_true, y_proba)
        except ValueError:
            # ROC-AUC not defined for this case
            pass

    # Confusion matrix
    metrics.confusion_matrix = confusion_matrix(y_true, y_pred)

    # Per-class metrics
    report = classification_report(y_true, y_pred, output_dict=True, zero_division=0)
    for label in ["0", "1"]:
        if label in report:
            metrics.class_metrics[f"class_{label}"] = {
                "precision": report[label]["precision"],
                "recall": report[label]["recall"],
                "f1": report[label]["f1-score"],
                "support": report[label]["support"],
            }

    return metrics


def evaluate_model(
    model: BaseModel,
    X: pd.DataFrame,
    y: pd.DataFrame | pd.Series,
) -> dict[str, EvaluationMetrics]:
    """Evaluate a fitted model on given data.

    Args:
        model: Fitted model.
        X: Feature DataFrame.
        y: Target DataFrame or Series.

    Returns:
        Dictionary of metrics per target column.
    """
    if not model.is_fitted:
        raise RuntimeError("Model must be fitted before evaluation.")

    predictions = model.predict(X)
    probabilities = model.predict_proba(X)

    results: dict[str, EvaluationMetrics] = {}

    if isinstance(y, pd.DataFrame):
        # Multi-output
        for i, col in enumerate(y.columns):
            y_true = y[col].values
            y_pred = predictions[:, i] if predictions.ndim > 1 else predictions
            y_proba = probabilities[i] if i < len(probabilities) else None

            results[col] = calculate_metrics(y_true, y_pred, y_proba)
    else:
        # Single output
        results[str(y.name)] = calculate_metrics(
            y.values, predictions, probabilities[0] if probabilities else None
        )

    return results


def cross_validate_model(
    model_type: ModelType,
    X: pd.DataFrame,
    y: pd.DataFrame | pd.Series,
    config: ModelConfig | None = None,
    n_folds: int = 5,
) -> dict[str, EvaluationMetrics]:
    """Perform cross-validation for a model.

    Args:
        model_type: Type of model to evaluate.
        X: Feature DataFrame.
        y: Target DataFrame or Series.
        config: Model configuration.
        n_folds: Number of cross-validation folds.

    Returns:
        Dictionary of averaged metrics per target.
    """
    logger.info(f"Cross-validating {model_type.value} with {n_folds} folds...")

    config = config or ModelConfig(model_type=model_type)
    results: dict[str, list[EvaluationMetrics]] = {}

    kfold = StratifiedKFold(n_splits=n_folds, shuffle=True, random_state=config.random_state)

    # Handle multi-output by using first target for stratification
    if isinstance(y, pd.DataFrame):
        stratify_col = y.iloc[:, 0]
        target_cols = y.columns.tolist()
    else:
        stratify_col = y
        target_cols = [str(y.name)]

    for col in target_cols:
        results[col] = []

    for fold_idx, (train_idx, val_idx) in enumerate(kfold.split(X, stratify_col)):
        logger.debug(f"Fold {fold_idx + 1}/{n_folds}")

        X_train, X_val = X.iloc[train_idx], X.iloc[val_idx]
        y_train = y.iloc[train_idx] if isinstance(y, pd.DataFrame) else y.iloc[train_idx]
        y_val = y.iloc[val_idx] if isinstance(y, pd.DataFrame) else y.iloc[val_idx]

        # Train model
        trainer = get_trainer(model_type, config)
        trainer.fit(X_train, y_train)

        # Evaluate
        fold_results = evaluate_model(trainer, X_val, y_val)
        for col, metrics in fold_results.items():
            results[col].append(metrics)

    # Average results across folds
    averaged_results: dict[str, EvaluationMetrics] = {}
    for col, metrics_list in results.items():
        averaged_results[col] = EvaluationMetrics(
            accuracy=np.mean([m.accuracy for m in metrics_list]),
            precision=np.mean([m.precision for m in metrics_list]),
            recall=np.mean([m.recall for m in metrics_list]),
            f1=np.mean([m.f1 for m in metrics_list]),
            roc_auc=np.mean([m.roc_auc for m in metrics_list if m.roc_auc is not None])
            if any(m.roc_auc is not None for m in metrics_list)
            else None,
        )

    return averaged_results


def compare_models(
    X: pd.DataFrame,
    y: pd.DataFrame | pd.Series,
    model_types: list[ModelType] | None = None,
    config: ModelConfig | None = None,
    n_folds: int = 5,
) -> list[ModelComparisonResult]:
    """Compare multiple model types using cross-validation.

    Args:
        X: Feature DataFrame.
        y: Target DataFrame or Series.
        model_types: List of model types to compare (default: all).
        config: Base model configuration.
        n_folds: Number of cross-validation folds.

    Returns:
        List of comparison results sorted by overall F1 score.
    """
    if model_types is None:
        model_types = [ModelType.RANDOM_FOREST, ModelType.XGBOOST, ModelType.LIGHTGBM]

    results: list[ModelComparisonResult] = []

    for model_type in model_types:
        logger.info(f"Evaluating {model_type.value}...")

        import time

        start_time = time.time()

        # Cross-validate
        cv_results = cross_validate_model(model_type, X, y, config, n_folds)
        training_time = time.time() - start_time

        # Calculate overall metrics (average across targets)
        overall = EvaluationMetrics(
            accuracy=np.mean([m.accuracy for m in cv_results.values()]),
            precision=np.mean([m.precision for m in cv_results.values()]),
            recall=np.mean([m.recall for m in cv_results.values()]),
            f1=np.mean([m.f1 for m in cv_results.values()]),
            roc_auc=np.mean([m.roc_auc for m in cv_results.values() if m.roc_auc is not None])
            if any(m.roc_auc is not None for m in cv_results.values())
            else None,
        )

        # Train a model on full data for feature importance
        trainer = get_trainer(model_type, config)
        trainer.fit(X, y)
        feature_importance = trainer.get_feature_importance()

        results.append(
            ModelComparisonResult(
                model_type=model_type,
                metrics=cv_results,
                overall_metrics=overall,
                training_time=training_time,
                feature_importance=feature_importance,
            )
        )

    # Sort by F1 score
    results.sort(key=lambda x: x.overall_metrics.f1, reverse=True)

    return results


def print_comparison_report(results: list[ModelComparisonResult]) -> str:
    """Generate a formatted comparison report.

    Args:
        results: List of model comparison results.

    Returns:
        Formatted string report.
    """
    lines = []
    lines.append("=" * 80)
    lines.append("MODEL COMPARISON REPORT")
    lines.append("=" * 80)
    lines.append("")

    # Summary table
    lines.append("OVERALL METRICS (averaged across all targets)")
    lines.append("-" * 80)
    lines.append(
        f"{'Model':<20} {'Accuracy':>10} {'Precision':>10} {'Recall':>10} "
        f"{'F1':>10} {'ROC-AUC':>10} {'Time (s)':>10}"
    )
    lines.append("-" * 80)

    for result in results:
        m = result.overall_metrics
        roc = f"{m.roc_auc:.4f}" if m.roc_auc else "N/A"
        lines.append(
            f"{result.model_type.value:<20} {m.accuracy:>10.4f} {m.precision:>10.4f} "
            f"{m.recall:>10.4f} {m.f1:>10.4f} {roc:>10} {result.training_time:>10.2f}"
        )

    lines.append("-" * 80)
    lines.append("")

    # Best model
    best = results[0]
    lines.append(f"BEST MODEL: {best.model_type.value} (F1: {best.overall_metrics.f1:.4f})")
    lines.append("")

    # Top features from best model
    lines.append("TOP 10 FEATURES (from best model)")
    lines.append("-" * 40)
    for i, (feature, importance) in enumerate(list(best.feature_importance.items())[:10]):
        lines.append(f"  {i + 1}. {feature}: {importance:.4f}")

    lines.append("")
    lines.append("=" * 80)

    return "\n".join(lines)
