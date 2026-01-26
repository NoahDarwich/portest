"""
Tests for the data module.
"""

from pathlib import Path

import pytest


class TestDataDirectory:
    """Tests for data directory structure."""

    def test_data_directory_exists(self, data_dir: Path):
        """Test that data directory exists."""
        assert data_dir.exists(), f"Data directory not found at {data_dir}"

    def test_full_df_exists(self, data_dir: Path):
        """Test that combined dataset exists."""
        full_df_path = data_dir / "full_df.csv"
        assert full_df_path.exists(), f"Combined dataset not found at {full_df_path}"


class TestDataLoading:
    """Tests for data loading functions."""

    @pytest.mark.slow
    def test_load_full_dataset(self, data_dir: Path):
        """Test loading the full dataset."""
        import pandas as pd

        full_df_path = data_dir / "full_df.csv"
        if not full_df_path.exists():
            pytest.skip("Full dataset not available")

        df = pd.read_csv(full_df_path)

        # Basic shape checks
        assert len(df) > 0, "Dataset should not be empty"
        assert len(df.columns) > 0, "Dataset should have columns"

    @pytest.mark.slow
    def test_dataset_has_required_columns(self, data_dir: Path):
        """Test that dataset has required columns for prediction."""
        import pandas as pd

        full_df_path = data_dir / "full_df.csv"
        if not full_df_path.exists():
            pytest.skip("Full dataset not available")

        df = pd.read_csv(full_df_path)

        # These are the columns used in prediction
        expected_columns = [
            "country",
            "governorate",
        ]

        for col in expected_columns:
            # Check for exact match or similar column names
            matching_cols = [c for c in df.columns if col.lower() in c.lower()]
            assert len(matching_cols) > 0, f"Expected column like '{col}' not found"


class TestModelFiles:
    """Tests for model file existence."""

    def test_ensemble_model_exists(self, project_root: Path):
        """Test that trained ensemble model file exists."""
        model_path = project_root / "models" / "ensemble_model.joblib"
        assert model_path.exists(), f"Ensemble model not found at {model_path}"

    @pytest.mark.slow
    def test_ensemble_model_loadable(self, project_root: Path):
        """Test that ensemble model can be loaded."""
        from protest.models.ensemble import EnsembleModel

        model_path = project_root / "models" / "ensemble_model.joblib"
        if not model_path.exists():
            pytest.skip("Ensemble model file not available")

        model = EnsembleModel.load(model_path)
        assert model is not None
        assert hasattr(model, "predict"), "Model should have predict method"
        assert hasattr(model, "predict_proba"), "Model should have predict_proba method"

    @pytest.mark.slow
    def test_ensemble_model_prediction(self, project_root: Path):
        """Test that ensemble model can make predictions."""
        import pandas as pd

        from protest.models.ensemble import EnsembleModel

        model_path = project_root / "models" / "ensemble_model.joblib"
        if not model_path.exists():
            pytest.skip("Ensemble model file not available")

        model = EnsembleModel.load(model_path)

        # Create test input
        test_data = pd.DataFrame(
            [
                {
                    "country": "Iraq",
                    "governorate": "Baghdad",
                    "locationtypeend": "Midan",
                    "demandtypeone": "Politics (national)",
                    "tacticprimary": "Demonstration / protest",
                    "violence": "Peaceful",
                    "combined_sizes": 100,
                }
            ]
        )

        # Test predictions
        probs = model.predict_proba(test_data)
        preds = model.predict(test_data)

        assert len(probs) == 7, "Should have 7 target predictions"
        assert preds.shape[1] == 7, "Should have 7 target columns"
