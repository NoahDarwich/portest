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

    def test_model_file_exists(self, api_dir: Path):
        """Test that trained model file exists."""
        model_path = api_dir / "final_RF_model"
        assert model_path.exists(), f"Model file not found at {model_path}"

    def test_pipeline_file_exists(self, api_dir: Path):
        """Test that preprocessing pipeline file exists."""
        pipeline_path = api_dir / "pipeline"
        assert pipeline_path.exists(), f"Pipeline file not found at {pipeline_path}"

    @pytest.mark.slow
    def test_model_loadable(self, api_dir: Path):
        """Test that model can be loaded with joblib."""
        import joblib

        model_path = api_dir / "final_RF_model"
        if not model_path.exists():
            pytest.skip("Model file not available")

        model = joblib.load(model_path)
        assert model is not None
        assert hasattr(model, "predict_proba"), "Model should have predict_proba method"

    @pytest.mark.slow
    def test_pipeline_loadable(self, api_dir: Path):
        """Test that pipeline can be loaded with joblib."""
        import joblib

        pipeline_path = api_dir / "pipeline"
        if not pipeline_path.exists():
            pytest.skip("Pipeline file not available")

        pipeline = joblib.load(pipeline_path)
        assert pipeline is not None
        assert hasattr(pipeline, "transform"), "Pipeline should have transform method"
