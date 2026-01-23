"""
Pro-Test ML Models Module

This module contains model definitions, training utilities, and ensemble methods.
"""

from protest.models.base import BaseModel, ModelConfig, ModelMetadata, ModelType
from protest.models.ensemble import EnsembleConfig, EnsembleModel
from protest.models.evaluation import (
    EvaluationMetrics,
    ModelComparisonResult,
    calculate_metrics,
    compare_models,
    cross_validate_model,
    evaluate_model,
    print_comparison_report,
)
from protest.models.registry import MLflowRegistry, ModelRegistry, ModelVersion
from protest.models.trainers import (
    LightGBMTrainer,
    RandomForestTrainer,
    XGBoostTrainer,
    get_trainer,
)

__all__ = [
    # Base
    "BaseModel",
    "ModelConfig",
    "ModelMetadata",
    "ModelType",
    # Trainers
    "RandomForestTrainer",
    "XGBoostTrainer",
    "LightGBMTrainer",
    "get_trainer",
    # Ensemble
    "EnsembleModel",
    "EnsembleConfig",
    # Evaluation
    "EvaluationMetrics",
    "ModelComparisonResult",
    "calculate_metrics",
    "compare_models",
    "cross_validate_model",
    "evaluate_model",
    "print_comparison_report",
    # Registry
    "ModelRegistry",
    "MLflowRegistry",
    "ModelVersion",
]
