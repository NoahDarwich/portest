#!/usr/bin/env python3
"""
Model Training Script for Pro-Test.

This script trains and compares different model types, then saves the best
performing model to the model registry.

Usage:
    python scripts/train_models.py --data data/full_df.csv --output models/
    python scripts/train_models.py --compare-only  # Just compare models
    python scripts/train_models.py --model-type ensemble  # Train specific type
"""

import argparse
import logging
import sys
from pathlib import Path

import pandas as pd

# Add project root to path
sys.path.insert(0, str(Path(__file__).parent.parent))

from protest.models import (
    EnsembleConfig,
    EnsembleModel,
    ModelConfig,
    ModelRegistry,
    ModelType,
    compare_models,
    get_trainer,
    print_comparison_report,
)

logging.basicConfig(
    level=logging.INFO,
    format="%(asctime)s - %(name)s - %(levelname)s - %(message)s",
)
logger = logging.getLogger(__name__)

# Default feature and target columns
FEATURE_COLUMNS = [
    "country",
    "governorate",
    "locationtypeend",
    "demandtypeone",
    "tacticprimary",
    "violence",
    "combined_sizes",
]

TARGET_COLUMNS = [
    "teargas",
    "rubberbullets",
    "liveammo",
    "sticks",
    "surround",
    "cleararea",
    "policerepress",
]


def load_data(data_path: Path) -> tuple[pd.DataFrame, pd.DataFrame]:
    """Load and prepare data for training.

    Args:
        data_path: Path to the data file.

    Returns:
        Tuple of (features, targets) DataFrames.
    """
    logger.info(f"Loading data from {data_path}")
    df = pd.read_csv(data_path)

    # Handle missing combined_sizes
    if "combined_sizes" not in df.columns:
        if "sizeestimate" in df.columns and "sizeexact" in df.columns:
            df["sizeestimate"] = df["sizeestimate"].fillna(-99)
            df["sizeexact"] = df["sizeexact"].fillna(0)
            df["combined_sizes"] = df["sizeexact"] + df["sizeestimate"]

    # Replace unknown sizes with median
    if "combined_sizes" in df.columns:
        median_size = df.loc[df["combined_sizes"] > 0, "combined_sizes"].median()
        df.loc[df["combined_sizes"] <= 0, "combined_sizes"] = median_size

    # Select features
    available_features = [c for c in FEATURE_COLUMNS if c in df.columns]
    X = df[available_features].copy()

    # Select targets
    available_targets = [c for c in TARGET_COLUMNS if c in df.columns]
    y = df[available_targets].copy()

    # Convert targets to binary
    for col in y.columns:
        y[col] = (y[col] > 0).astype(int)

    logger.info(f"Loaded {len(df)} samples with {len(available_features)} features and {len(available_targets)} targets")
    return X, y


def compare_all_models(
    X: pd.DataFrame,
    y: pd.DataFrame,
    n_folds: int = 5,
) -> None:
    """Compare all model types and print results.

    Args:
        X: Feature DataFrame.
        y: Target DataFrame.
        n_folds: Number of cross-validation folds.
    """
    logger.info("Comparing models...")

    results = compare_models(
        X, y,
        model_types=[ModelType.RANDOM_FOREST, ModelType.XGBOOST, ModelType.LIGHTGBM],
        n_folds=n_folds,
    )

    report = print_comparison_report(results)
    print(report)

    return results


def train_model(
    X: pd.DataFrame,
    y: pd.DataFrame,
    model_type: ModelType | str,
    output_path: Path,
) -> None:
    """Train a single model and save it.

    Args:
        X: Feature DataFrame.
        y: Target DataFrame.
        model_type: Type of model to train.
        output_path: Path to save the model.
    """
    if isinstance(model_type, str):
        model_type = ModelType(model_type)

    logger.info(f"Training {model_type.value} model...")

    config = ModelConfig(
        model_type=model_type,
        target_columns=y.columns.tolist(),
        feature_columns=X.columns.tolist(),
    )

    trainer = get_trainer(model_type, config)
    trainer.fit(X, y)

    # Save model
    model_path = output_path / f"{model_type.value}_model.joblib"
    trainer.save(model_path)
    logger.info(f"Model saved to {model_path}")

    # Print feature importance
    importance = trainer.get_feature_importance()
    print("\nTop 10 Important Features:")
    for i, (feature, imp) in enumerate(list(importance.items())[:10]):
        print(f"  {i + 1}. {feature}: {imp:.4f}")


def train_ensemble(
    X: pd.DataFrame,
    y: pd.DataFrame,
    output_path: Path,
    weights: list[float] | None = None,
) -> None:
    """Train an ensemble model and save it.

    Args:
        X: Feature DataFrame.
        y: Target DataFrame.
        output_path: Path to save the model.
        weights: Optional weights for each model type.
    """
    logger.info("Training ensemble model...")

    config = ModelConfig(
        target_columns=y.columns.tolist(),
        feature_columns=X.columns.tolist(),
    )

    ensemble_config = EnsembleConfig(
        model_types=[ModelType.RANDOM_FOREST, ModelType.XGBOOST, ModelType.LIGHTGBM],
        weights=weights,
        voting="soft",
    )

    ensemble = EnsembleModel(config=config, ensemble_config=ensemble_config)
    ensemble.fit(X, y)

    # Save ensemble
    model_path = output_path / "ensemble_model.joblib"
    ensemble.save(model_path)
    logger.info(f"Ensemble saved to {model_path}")

    # Print feature importance
    importance = ensemble.get_feature_importance()
    print("\nTop 10 Important Features (ensemble):")
    for i, (feature, imp) in enumerate(list(importance.items())[:10]):
        print(f"  {i + 1}. {feature}: {imp:.4f}")

    # Register in registry
    registry = ModelRegistry(output_path / "registry")
    version = registry.register_model(
        ensemble,
        name="protest_predictor",
        description="Ensemble model for protest outcome prediction",
        tags={"type": "ensemble", "version": "2.0.0"},
    )
    logger.info(f"Registered as version {version.version}")


def main():
    """Main entry point."""
    parser = argparse.ArgumentParser(description="Train Pro-Test models")
    parser.add_argument(
        "--data",
        type=Path,
        default=Path("data/full_df.csv"),
        help="Path to training data",
    )
    parser.add_argument(
        "--output",
        type=Path,
        default=Path("models"),
        help="Output directory for models",
    )
    parser.add_argument(
        "--model-type",
        type=str,
        choices=["random_forest", "xgboost", "lightgbm", "ensemble", "all"],
        default="ensemble",
        help="Type of model to train",
    )
    parser.add_argument(
        "--compare-only",
        action="store_true",
        help="Only compare models, don't save",
    )
    parser.add_argument(
        "--n-folds",
        type=int,
        default=5,
        help="Number of cross-validation folds",
    )

    args = parser.parse_args()

    # Ensure output directory exists
    args.output.mkdir(parents=True, exist_ok=True)

    # Load data
    X, y = load_data(args.data)

    if args.compare_only:
        compare_all_models(X, y, args.n_folds)
        return

    if args.model_type == "all":
        # Train all model types
        for model_type in [ModelType.RANDOM_FOREST, ModelType.XGBOOST, ModelType.LIGHTGBM]:
            train_model(X, y, model_type, args.output)
        train_ensemble(X, y, args.output)
    elif args.model_type == "ensemble":
        train_ensemble(X, y, args.output)
    else:
        train_model(X, y, args.model_type, args.output)

    logger.info("Training complete!")


if __name__ == "__main__":
    main()
