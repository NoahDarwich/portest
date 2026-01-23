"""
Pro-Test API

FastAPI application for protest outcome predictions.
"""

import logging
from contextlib import asynccontextmanager
from datetime import datetime
from functools import lru_cache
from pathlib import Path
from typing import Any

import joblib
import pandas as pd
from fastapi import FastAPI, HTTPException, Query, status
from fastapi.middleware.cors import CORSMiddleware
from pydantic import BaseModel, Field

from protest.config import Settings, get_settings

# ============================================================
# Logging Setup
# ============================================================
logger = logging.getLogger(__name__)


# ============================================================
# Response Models
# ============================================================
class HealthResponse(BaseModel):
    """Health check response."""

    status: str = "ok"
    version: str
    environment: str
    timestamp: datetime = Field(default_factory=datetime.utcnow)


class PredictionInput(BaseModel):
    """Input parameters for prediction."""

    country: str = Field(..., description="Country name (Iraq, Lebanon, Egypt)")
    governorate: str = Field(..., description="Governorate/region name")
    location_type: str = Field(..., description="Type of location")
    demand_type: str = Field(..., description="Type of demand from protesters")
    protest_tactic: str = Field(..., description="Primary protest tactic")
    protester_violence: str = Field(..., description="Level of protester violence")
    participant_count: int = Field(..., ge=0, description="Number of participants")


class PredictionResult(BaseModel):
    """Individual prediction result with confidence."""

    probability: float = Field(..., ge=0, le=1, description="Probability of outcome occurring")
    confidence: float | None = Field(None, ge=0, le=1, description="Confidence in prediction (std dev)")

    class Config:
        json_schema_extra = {"example": {"probability": 0.75, "confidence": 0.85}}


class PredictionResponse(BaseModel):
    """Prediction response with probabilities."""

    predictions: dict[str, list[list[float]]]
    confidence_intervals: dict[str, float] | None = None
    model_version: str
    timestamp: datetime = Field(default_factory=datetime.utcnow)

    class Config:
        json_schema_extra = {
            "example": {
                "predictions": {
                    "no_known_coercion": [[0.7, 0.3]],
                    "arrests_detentions": [[0.8, 0.2]],
                    "physical_harassment": [[0.6, 0.4]],
                    "injuries_inflicted": [[0.9, 0.1]],
                    "deaths_inflicted": [[0.95, 0.05]],
                    "security_forces": [[0.4, 0.6]],
                    "party_militias": [[0.85, 0.15]],
                },
                "confidence_intervals": {
                    "no_known_coercion": 0.05,
                    "arrests_detentions": 0.03,
                },
                "model_version": "2.0.0",
                "timestamp": "2026-01-23T12:00:00Z",
            }
        }


class FeatureImportanceResponse(BaseModel):
    """Feature importance response."""

    feature_importance: dict[str, float]
    model_version: str
    timestamp: datetime = Field(default_factory=datetime.utcnow)


class ModelInfoResponse(BaseModel):
    """Model information response."""

    model_type: str
    version: str
    target_columns: list[str]
    feature_columns: list[str]
    is_loaded: bool
    timestamp: datetime = Field(default_factory=datetime.utcnow)


class ErrorResponse(BaseModel):
    """Error response."""

    detail: str
    error_code: str | None = None


# ============================================================
# Model Loading
# ============================================================
class ModelManager:
    """Manages ML model loading and caching."""

    def __init__(self) -> None:
        self._model: Any | None = None
        self._pipeline: Any | None = None
        self._loaded: bool = False

    def load(self, settings: Settings) -> None:
        """Load model and pipeline from disk."""
        model_path = Path(settings.model_path)
        pipeline_path = Path(settings.pipeline_path)

        if not model_path.exists():
            raise FileNotFoundError(f"Model not found at {model_path}")
        if not pipeline_path.exists():
            raise FileNotFoundError(f"Pipeline not found at {pipeline_path}")

        logger.info(f"Loading model from {model_path}")
        self._model = joblib.load(model_path)

        logger.info(f"Loading pipeline from {pipeline_path}")
        self._pipeline = joblib.load(pipeline_path)

        self._loaded = True
        logger.info("Model and pipeline loaded successfully")

    @property
    def model(self) -> Any:
        """Get the loaded model."""
        if not self._loaded or self._model is None:
            raise RuntimeError("Model not loaded. Call load() first.")
        return self._model

    @property
    def pipeline(self) -> Any:
        """Get the loaded pipeline."""
        if not self._loaded or self._pipeline is None:
            raise RuntimeError("Pipeline not loaded. Call load() first.")
        return self._pipeline

    @property
    def is_loaded(self) -> bool:
        """Check if model is loaded."""
        return self._loaded


# Global model manager instance
model_manager = ModelManager()


# ============================================================
# Application Lifespan
# ============================================================
@asynccontextmanager
async def lifespan(app: FastAPI):
    """Application lifespan handler for startup/shutdown."""
    settings = get_settings()

    # Startup
    logger.info(f"Starting {settings.app_name} v{settings.app_version}")
    logger.info(f"Environment: {settings.environment}")

    # Load model on startup (cache it for all requests)
    if settings.model_cache_enabled:
        try:
            model_manager.load(settings)
        except FileNotFoundError as e:
            logger.warning(f"Model files not found: {e}. API will start but predictions will fail.")
        except Exception as e:
            logger.error(f"Failed to load model: {e}")

    yield

    # Shutdown
    logger.info("Shutting down application")


# ============================================================
# FastAPI Application
# ============================================================
@lru_cache
def create_app() -> FastAPI:
    """Create and configure the FastAPI application."""
    settings = get_settings()

    app = FastAPI(
        title=settings.app_name,
        description="Predictive Modelling for Protest Outcome Analysis",
        version=settings.app_version,
        docs_url="/docs" if settings.is_development else None,
        redoc_url="/redoc" if settings.is_development else None,
        lifespan=lifespan,
    )

    # Configure CORS
    app.add_middleware(
        CORSMiddleware,
        allow_origins=settings.cors_origins,
        allow_credentials=settings.cors_allow_credentials,
        allow_methods=settings.cors_allow_methods,
        allow_headers=settings.cors_allow_headers,
    )

    return app


app = create_app()


# ============================================================
# Endpoints
# ============================================================
@app.get("/", include_in_schema=False)
async def root() -> dict[str, bool]:
    """Root endpoint redirect."""
    return {"ok": True}


@app.get("/health", response_model=HealthResponse, tags=["Health"])
async def health_check() -> HealthResponse:
    """Health check endpoint for load balancers and monitoring."""
    settings = get_settings()
    return HealthResponse(
        status="ok",
        version=settings.app_version,
        environment=settings.environment,
    )


@app.get(
    "/predict",
    response_model=PredictionResponse,
    responses={
        400: {"model": ErrorResponse, "description": "Invalid input"},
        500: {"model": ErrorResponse, "description": "Prediction error"},
        503: {"model": ErrorResponse, "description": "Model not available"},
    },
    tags=["Predictions"],
    summary="Get protest outcome predictions",
    description="Predict probabilities of various repression outcomes based on protest characteristics.",
)
async def predict(
    country: str = Query(..., description="Country (Iraq, Lebanon, Egypt)"),
    governorate: str = Query(..., description="Governorate/region"),
    location_type: str = Query(..., description="Location type"),
    demand_type: str = Query(..., description="Demand type"),
    protest_tactic: str = Query(..., description="Primary tactic"),
    protester_violence: str = Query(..., description="Protester violence level"),
    combined_sizes: int = Query(..., ge=0, description="Number of participants"),
) -> PredictionResponse:
    """
    Generate predictions for protest outcomes.

    Returns probabilities for 7 repression outcome categories.
    """
    settings = get_settings()

    # Check if model is loaded
    if not model_manager.is_loaded:
        # Try to load on-demand if not cached
        try:
            model_manager.load(settings)
        except FileNotFoundError as e:
            raise HTTPException(
                status_code=status.HTTP_503_SERVICE_UNAVAILABLE,
                detail=f"Model not available: {e}",
            )
        except Exception as e:
            logger.error(f"Failed to load model: {e}")
            raise HTTPException(
                status_code=status.HTTP_503_SERVICE_UNAVAILABLE,
                detail="Model loading failed",
            )

    # Prepare input data
    try:
        prediction_input = pd.DataFrame(
            {
                "country": [str(country)],
                "governorate": [str(governorate)],
                "locationtypeend": [str(location_type)],
                "demandtypeone": [str(demand_type)],
                "tacticprimary": [str(protest_tactic)],
                "violence": [str(protester_violence)],
                "combined_sizes": [int(combined_sizes)],
            }
        )
    except Exception as e:
        logger.error(f"Input validation error: {e}")
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail=f"Invalid input: {e}",
        )

    # Run prediction
    try:
        processed_input = model_manager.pipeline.transform(prediction_input)
        predictions = model_manager.model.predict_proba(processed_input)

        # Format predictions with meaningful names
        prediction_names = [
            "no_known_coercion",
            "arrests_detentions",
            "physical_harassment",
            "injuries_inflicted",
            "deaths_inflicted",
            "security_forces",
            "party_militias",
        ]

        formatted_predictions = {}
        for i, name in enumerate(prediction_names):
            if i < len(predictions):
                formatted_predictions[name] = predictions[i].tolist()

        return PredictionResponse(
            predictions=formatted_predictions,
            model_version=settings.app_version,
        )

    except Exception as e:
        logger.error(f"Prediction error: {e}")
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail=f"Prediction failed: {e}",
        )


@app.get(
    "/model/info",
    response_model=ModelInfoResponse,
    tags=["Model"],
    summary="Get model information",
    description="Get information about the currently loaded model.",
)
async def get_model_info() -> ModelInfoResponse:
    """Get information about the loaded model."""
    settings = get_settings()

    return ModelInfoResponse(
        model_type="random_forest",  # TODO: Get from model metadata
        version=settings.app_version,
        target_columns=[
            "no_known_coercion",
            "arrests_detentions",
            "physical_harassment",
            "injuries_inflicted",
            "deaths_inflicted",
            "security_forces",
            "party_militias",
        ],
        feature_columns=[
            "country",
            "governorate",
            "locationtypeend",
            "demandtypeone",
            "tacticprimary",
            "violence",
            "combined_sizes",
        ],
        is_loaded=model_manager.is_loaded,
    )


@app.get(
    "/model/features",
    response_model=FeatureImportanceResponse,
    responses={
        503: {"model": ErrorResponse, "description": "Model not available"},
    },
    tags=["Model"],
    summary="Get feature importance",
    description="Get feature importance scores from the model.",
)
async def get_feature_importance() -> FeatureImportanceResponse:
    """Get feature importance from the loaded model."""
    settings = get_settings()

    if not model_manager.is_loaded:
        raise HTTPException(
            status_code=status.HTTP_503_SERVICE_UNAVAILABLE,
            detail="Model not loaded",
        )

    # Get feature importance from the model
    try:
        # For sklearn models with feature_importances_
        if hasattr(model_manager.model, "feature_importances_"):
            importances = model_manager.model.feature_importances_
            feature_names = model_manager.pipeline.get_feature_names_out()
            feature_importance = dict(zip(feature_names, importances.tolist()))
        elif hasattr(model_manager.model, "estimators_"):
            # MultiOutputClassifier - average across estimators
            import numpy as np
            all_importances = []
            for estimator in model_manager.model.estimators_:
                if hasattr(estimator, "feature_importances_"):
                    all_importances.append(estimator.feature_importances_)
            if all_importances:
                avg_importances = np.mean(all_importances, axis=0)
                feature_names = model_manager.pipeline.get_feature_names_out()
                feature_importance = dict(zip(feature_names, avg_importances.tolist()))
            else:
                feature_importance = {}
        else:
            feature_importance = {}

        # Sort by importance
        feature_importance = dict(
            sorted(feature_importance.items(), key=lambda x: x[1], reverse=True)
        )

        return FeatureImportanceResponse(
            feature_importance=feature_importance,
            model_version=settings.app_version,
        )

    except Exception as e:
        logger.error(f"Error getting feature importance: {e}")
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail=f"Failed to get feature importance: {e}",
        )


@app.get(
    "/regions",
    tags=["Data"],
    summary="Get available regions",
    description="Get list of available countries and regions for prediction.",
)
async def get_regions() -> dict[str, list[str]]:
    """Get available countries and their regions."""
    # TODO: Load from data or cache
    return {
        "countries": ["Iraq", "Lebanon", "Egypt"],
        "Iraq": ["Baghdad", "Basrah", "Erbil", "Najaf", "Karbala"],
        "Lebanon": ["Beirut", "Tripoli", "Sidon", "Tyre"],
        "Egypt": ["Cairo", "Alexandria", "Giza"],
    }


# ============================================================
# Main Entry Point
# ============================================================
def main() -> None:
    """Run the API server."""
    import uvicorn

    settings = get_settings()

    # Configure logging
    logging.basicConfig(
        level=getattr(logging, settings.log_level),
        format="%(asctime)s - %(name)s - %(levelname)s - %(message)s",
    )

    uvicorn.run(
        "api.api:app",
        host=settings.host,
        port=settings.port,
        reload=settings.is_development,
        log_level=settings.log_level.lower(),
    )


if __name__ == "__main__":
    main()
