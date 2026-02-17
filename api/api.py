"""
Pro-Test API

FastAPI application for protest outcome predictions.
"""

import hashlib
import json
import time
import uuid
import warnings
from contextlib import asynccontextmanager
from datetime import datetime
from functools import lru_cache
from pathlib import Path
from typing import Any

import pandas as pd
from fastapi import FastAPI, HTTPException, Query, Request, status
from fastapi.middleware.cors import CORSMiddleware
from prometheus_fastapi_instrumentator import Instrumentator
from pydantic import BaseModel, Field
from slowapi import Limiter, _rate_limit_exceeded_handler
from slowapi.errors import RateLimitExceeded
from slowapi.util import get_remote_address

from protest.config import Settings, get_settings
from protest.logging import (
    bind_request_context,
    clear_request_context,
    configure_logging,
    get_logger,
)
from protest.metrics import (
    record_prediction_error,
    record_prediction_metrics,
    set_app_info,
    set_model_loaded,
)
from protest.models.ensemble import EnsembleModel

# Suppress sklearn warnings for cleaner logs
warnings.filterwarnings("ignore", category=UserWarning, module="sklearn")

# ============================================================
# Logging Setup
# ============================================================
configure_logging()
logger = get_logger(__name__)


# ============================================================
# Rate Limiting
# ============================================================
def get_rate_limit_key(request: Request) -> str:
    """Get rate limit key from request (IP address)."""
    return get_remote_address(request)


limiter = Limiter(key_func=get_rate_limit_key)


# ============================================================
# Redis Cache
# ============================================================
class RedisCache:
    """Redis cache for predictions."""

    def __init__(self) -> None:
        self._client: Any = None
        self._enabled: bool = False

    async def connect(self, redis_url: str | None, ttl: int = 3600) -> None:
        """Connect to Redis."""
        if not redis_url:
            logger.info("Redis URL not configured, caching disabled")
            return

        try:
            import redis.asyncio as redis

            self._client = redis.from_url(redis_url, decode_responses=True)
            await self._client.ping()
            self._enabled = True
            self._ttl = ttl
            logger.info("Redis cache connected", redis_url=redis_url)
        except Exception as e:
            logger.warning("Failed to connect to Redis, caching disabled", error=str(e))
            self._enabled = False

    async def disconnect(self) -> None:
        """Disconnect from Redis."""
        if self._client:
            await self._client.close()
            logger.info("Redis cache disconnected")

    @staticmethod
    def _make_cache_key(params: dict[str, Any]) -> str:
        """Create a cache key from prediction parameters."""
        key_str = json.dumps(params, sort_keys=True)
        return f"predict:{hashlib.md5(key_str.encode()).hexdigest()}"

    async def get(self, params: dict[str, Any]) -> dict[str, Any] | None:
        """Get cached prediction."""
        if not self._enabled:
            return None

        try:
            key = self._make_cache_key(params)
            cached = await self._client.get(key)
            if cached:
                logger.debug("Cache hit", cache_key=key)
                return json.loads(cached)
            logger.debug("Cache miss", cache_key=key)
            return None
        except Exception as e:
            logger.warning("Cache get failed", error=str(e))
            return None

    async def set(self, params: dict[str, Any], result: dict[str, Any]) -> None:
        """Cache prediction result."""
        if not self._enabled:
            return

        try:
            key = self._make_cache_key(params)
            await self._client.setex(key, self._ttl, json.dumps(result))
            logger.debug("Cached prediction", cache_key=key, ttl=self._ttl)
        except Exception as e:
            logger.warning("Cache set failed", error=str(e))

    @property
    def is_enabled(self) -> bool:
        """Check if cache is enabled."""
        return self._enabled


# Global cache instance
cache = RedisCache()


# ============================================================
# Response Models
# ============================================================
class HealthResponse(BaseModel):
    """Health check response."""

    status: str = "ok"
    version: str
    environment: str
    model_loaded: bool = False
    cache_enabled: bool = False
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
    confidence: float | None = Field(
        None, ge=0, le=1, description="Confidence in prediction (std dev)"
    )

    class Config:
        json_schema_extra = {"example": {"probability": 0.75, "confidence": 0.85}}


class OutcomePrediction(BaseModel):
    """Single outcome prediction."""

    probability: float = Field(..., ge=0, le=1, description="Probability of outcome")
    prediction: bool = Field(..., description="Binary prediction (True if likely)")


class PredictionResponse(BaseModel):
    """Prediction response with probabilities."""

    predictions: dict[str, OutcomePrediction]
    model_id: str
    model_version: str
    cached: bool = False
    timestamp: datetime = Field(default_factory=datetime.utcnow)

    class Config:
        json_schema_extra = {
            "example": {
                "predictions": {
                    "teargas": {"probability": 0.75, "prediction": True},
                    "rubberbullets": {"probability": 0.20, "prediction": False},
                    "liveammo": {"probability": 0.10, "prediction": False},
                    "sticks": {"probability": 0.30, "prediction": False},
                    "surround": {"probability": 0.65, "prediction": True},
                    "cleararea": {"probability": 0.55, "prediction": True},
                    "policerepress": {"probability": 0.80, "prediction": True},
                },
                "model_id": "abc123",
                "model_version": "2.0.0",
                "cached": False,
                "timestamp": "2026-01-24T12:00:00Z",
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

    # Target names for predictions (repression methods the model predicts)
    TARGET_NAMES = [
        "teargas",
        "rubberbullets",
        "liveammo",
        "sticks",
        "surround",
        "cleararea",
        "policerepress",
    ]

    def __init__(self) -> None:
        self._model: EnsembleModel | None = None
        self._loaded: bool = False

    def load(self, settings: Settings) -> None:
        """Load ensemble model from disk."""
        model_path = Path(settings.model_path)

        if not model_path.exists():
            set_model_loaded(False)
            raise FileNotFoundError(f"Model not found at {model_path}")

        logger.info("Loading ensemble model", model_path=str(model_path))
        start_time = time.time()
        self._model = EnsembleModel.load(model_path)
        load_time = time.time() - start_time
        self._loaded = True

        # Update metrics
        set_model_loaded(True, load_time)

        logger.info(
            "Ensemble model loaded successfully",
            model_id=self._model.metadata.model_id,
            load_time_seconds=round(load_time, 2),
        )

    @property
    def model(self) -> EnsembleModel:
        """Get the loaded model."""
        if not self._loaded or self._model is None:
            raise RuntimeError("Model not loaded. Call load() first.")
        return self._model

    @property
    def is_loaded(self) -> bool:
        """Check if model is loaded."""
        return self._loaded

    @property
    def model_id(self) -> str:
        """Get model ID."""
        if self._model:
            return self._model.metadata.model_id
        return "not_loaded"

    @property
    def model_type(self) -> str:
        """Get model type."""
        return "ensemble"

    def predict(self, df: pd.DataFrame) -> dict[str, dict[str, Any]]:
        """Run prediction and return formatted results."""
        if not self._loaded or self._model is None:
            raise RuntimeError("Model not loaded")

        # Get predictions
        probs = self._model.predict_proba(df)
        preds = self._model.predict(df)

        # Format results
        results = {}
        for i, name in enumerate(self.TARGET_NAMES):
            if i < len(probs):
                prob_positive = float(probs[i][0][1])
                prediction = bool(preds[0][i] == 1)
                results[name] = {
                    "probability": prob_positive,
                    "prediction": prediction,
                }

        return results


# Global model manager instance
model_manager = ModelManager()


# ============================================================
# Request Middleware
# ============================================================
async def request_context_middleware(request: Request, call_next):
    """Middleware to add request context to logs."""
    request_id = str(uuid.uuid4())[:8]
    request.state.request_id = request_id

    bind_request_context(
        request_id=request_id,
        method=request.method,
        path=request.url.path,
        client_ip=get_remote_address(request),
    )

    try:
        response = await call_next(request)
        logger.info(
            "Request completed",
            status_code=response.status_code,
        )
        return response
    except Exception as e:
        logger.error("Request failed", error=str(e))
        raise
    finally:
        clear_request_context()


# ============================================================
# Application Lifespan
# ============================================================
@asynccontextmanager
async def lifespan(_app: FastAPI):
    """Application lifespan handler for startup/shutdown."""
    settings = get_settings()

    # Startup
    logger.info(
        "Starting application",
        app_name=settings.app_name,
        version=settings.app_version,
        environment=settings.environment,
    )

    # Load model on startup (cache it for all requests)
    if settings.model_cache_enabled:
        try:
            model_manager.load(settings)
        except FileNotFoundError as e:
            logger.warning(
                "Model files not found, predictions will fail",
                error=str(e),
            )
        except Exception as e:
            logger.error("Failed to load model", error=str(e))

    # Set app info metrics
    set_app_info(
        version=settings.app_version,
        environment=settings.environment,
        model_id=model_manager.model_id,
    )

    # Connect to Redis cache
    if settings.cache_enabled:
        await cache.connect(settings.redis_url, settings.cache_ttl_seconds)

    yield

    # Shutdown
    if cache.is_enabled:
        await cache.disconnect()
    logger.info("Application shutdown complete")


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

    # Add rate limiter
    app.state.limiter = limiter
    app.add_exception_handler(RateLimitExceeded, _rate_limit_exceeded_handler)

    # Configure CORS
    app.add_middleware(
        CORSMiddleware,
        allow_origins=settings.cors_origins,
        allow_credentials=settings.cors_allow_credentials,
        allow_methods=settings.cors_allow_methods,
        allow_headers=settings.cors_allow_headers,
    )

    # Add request context middleware
    app.middleware("http")(request_context_middleware)

    # Add Prometheus instrumentation
    # Exposes /metrics endpoint with default HTTP metrics
    Instrumentator().instrument(app).expose(app, include_in_schema=False)

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
        model_loaded=model_manager.is_loaded,
        cache_enabled=cache.is_enabled,
    )


@app.get(
    "/predict",
    response_model=PredictionResponse,
    responses={
        400: {"model": ErrorResponse, "description": "Invalid input"},
        429: {"model": ErrorResponse, "description": "Rate limit exceeded"},
        500: {"model": ErrorResponse, "description": "Prediction error"},
        503: {"model": ErrorResponse, "description": "Model not available"},
    },
    tags=["Predictions"],
    summary="Get protest outcome predictions",
    description="Predict probabilities of various repression outcomes based on protest characteristics.",
)
@limiter.limit("100/minute")
async def predict(
    request: Request,  # noqa: ARG001 - required by slowapi rate limiter
    country: str = Query(..., description="Country (Iraq, Lebanon, Egypt)"),
    governorate: str = Query(..., description="Governorate/region"),
    location_type: str = Query(..., description="Location type (e.g., Midan, Main road)"),
    demand_type: str = Query(..., description="Demand type (e.g., Politics (national), Economy)"),
    protest_tactic: str = Query(..., description="Primary tactic (e.g., Demonstration / protest)"),
    protester_violence: str = Query(..., description="Violence level (Peaceful, Riot, Unknown)"),
    combined_sizes: int = Query(..., ge=0, description="Number of participants"),
) -> PredictionResponse:
    """
    Generate predictions for protest outcomes.

    Returns probabilities for 7 repression method categories:
    - teargas: Use of tear gas
    - rubberbullets: Use of rubber bullets
    - liveammo: Use of live ammunition
    - sticks: Use of batons/sticks
    - surround: Protesters surrounded by security forces
    - cleararea: Area cleared by security forces
    - policerepress: General police repression
    """
    settings = get_settings()

    # Build params dict for caching
    params = {
        "country": country,
        "governorate": governorate,
        "location_type": location_type,
        "demand_type": demand_type,
        "protest_tactic": protest_tactic,
        "protester_violence": protester_violence,
        "combined_sizes": combined_sizes,
    }

    logger.info("Prediction request received", **params)
    start_time = time.time()

    # Check cache first
    cached_result = await cache.get(params)
    if cached_result:
        latency = time.time() - start_time
        logger.info("Returning cached prediction")

        # Record metrics for cached response
        record_prediction_metrics(
            country=country,
            violence_level=protester_violence,
            participant_count=combined_sizes,
            predictions=cached_result["predictions"],
            latency=latency,
            cached=True,
        )

        return PredictionResponse(
            predictions={
                name: OutcomePrediction(**data)
                for name, data in cached_result["predictions"].items()
            },
            model_id=cached_result["model_id"],
            model_version=cached_result["model_version"],
            cached=True,
        )

    # Check if model is loaded
    if not model_manager.is_loaded:
        try:
            model_manager.load(settings)
        except FileNotFoundError as e:
            logger.error("Model not available", error=str(e))
            raise HTTPException(
                status_code=status.HTTP_503_SERVICE_UNAVAILABLE,
                detail=f"Model not available: {e}",
            )
        except Exception as e:
            logger.error("Failed to load model", error=str(e))
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
        logger.error("Input validation error", error=str(e))
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail=f"Invalid input: {e}",
        )

    # Run prediction
    try:
        results = model_manager.predict(prediction_input)

        # Convert to response format
        predictions = {
            name: OutcomePrediction(
                probability=data["probability"],
                prediction=data["prediction"],
            )
            for name, data in results.items()
        }

        response = PredictionResponse(
            predictions=predictions,
            model_id=model_manager.model_id,
            model_version=settings.app_version,
            cached=False,
        )

        # Cache the result
        await cache.set(
            params,
            {
                "predictions": results,
                "model_id": model_manager.model_id,
                "model_version": settings.app_version,
            },
        )

        # Record metrics
        latency = time.time() - start_time
        record_prediction_metrics(
            country=country,
            violence_level=protester_violence,
            participant_count=combined_sizes,
            predictions=results,
            latency=latency,
            cached=False,
        )

        logger.info("Prediction completed successfully", latency_seconds=round(latency, 3))
        return response

    except Exception as e:
        logger.error("Prediction error", error=str(e))
        record_prediction_error(country=country)
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
        model_type=model_manager.model_type,
        version=settings.app_version,
        target_columns=ModelManager.TARGET_NAMES,
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
    description="Get feature importance scores from the ensemble model.",
)
async def get_feature_importance() -> FeatureImportanceResponse:
    """Get feature importance from the loaded ensemble model."""
    settings = get_settings()

    if not model_manager.is_loaded:
        raise HTTPException(
            status_code=status.HTTP_503_SERVICE_UNAVAILABLE,
            detail="Model not loaded",
        )

    try:
        # Get feature importance from ensemble model
        feature_importance = model_manager.model.get_feature_importance()

        # Sort by importance (descending) and take top 20
        sorted_features = dict(
            sorted(feature_importance.items(), key=lambda x: x[1], reverse=True)[:20]
        )

        return FeatureImportanceResponse(
            feature_importance=sorted_features,
            model_version=settings.app_version,
        )

    except Exception as e:
        logger.error("Error getting feature importance", error=str(e))
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
async def get_regions() -> dict[str, Any]:
    """Get available countries and their regions from the training data."""
    settings = get_settings()
    data_path = settings.data_path / "full_df.csv"

    try:
        if data_path.exists():
            df = pd.read_csv(data_path, usecols=["country", "governorate"])
            countries = sorted(df["country"].dropna().unique().tolist())

            result: dict[str, Any] = {"countries": countries}
            for country in countries:
                governorates = sorted(
                    df[df["country"] == country]["governorate"].dropna().unique().tolist()
                )
                result[country] = governorates

            return result
        else:
            # Fallback to hardcoded values
            return {
                "countries": ["Iraq", "Lebanon", "Egypt"],
                "Iraq": ["Baghdad", "Basra", "Erbil", "Najaf", "Karbala"],
                "Lebanon": ["Beirut", "Tripoli", "Sidon", "Tyre"],
                "Egypt": ["Cairo", "Alexandria", "Giza"],
            }
    except Exception as e:
        logger.warning("Failed to load regions from data", error=str(e))
        return {
            "countries": ["Iraq", "Lebanon", "Egypt"],
            "Iraq": ["Baghdad", "Basra"],
            "Lebanon": ["Beirut"],
            "Egypt": ["Cairo"],
        }


@app.get(
    "/options",
    tags=["Data"],
    summary="Get input options",
    description="Get available options for all prediction input fields.",
)
async def get_options() -> dict[str, list[str]]:
    """Get available options for prediction inputs from training data."""
    settings = get_settings()
    data_path = settings.data_path / "full_df.csv"

    try:
        if data_path.exists():
            df = pd.read_csv(
                data_path,
                usecols=[
                    "locationtypeend",
                    "demandtypeone",
                    "tacticprimary",
                    "violence",
                ],
            )
            return {
                "location_types": sorted(df["locationtypeend"].dropna().unique().tolist()),
                "demand_types": sorted(df["demandtypeone"].dropna().unique().tolist()),
                "tactics": sorted(df["tacticprimary"].dropna().unique().tolist()),
                "violence_levels": sorted(df["violence"].dropna().unique().tolist()),
            }
        else:
            return {
                "location_types": ["Midan", "Main road", "Government building"],
                "demand_types": ["Politics (national)", "Economy", "Services"],
                "tactics": ["Demonstration / protest", "Roadblock or blockade"],
                "violence_levels": ["Peaceful", "Riot", "Unknown"],
            }
    except Exception as e:
        logger.warning("Failed to load options from data", error=str(e))
        return {
            "location_types": ["Midan", "Main road"],
            "demand_types": ["Politics (national)"],
            "tactics": ["Demonstration / protest"],
            "violence_levels": ["Peaceful", "Riot"],
        }


# ============================================================
# Map & Statistics Endpoints
# ============================================================
_map_data_cache: list[dict[str, Any]] | None = None
_repression_stats_cache: dict[str, Any] | None = None


@app.get(
    "/mapdata",
    tags=["Data"],
    summary="Get protest map data",
    description="Get GPS coordinates and repression data for all protests with valid locations.",
)
async def get_map_data() -> list[dict[str, Any]]:
    """Return protest GPS points for the density heatmap."""
    global _map_data_cache
    if _map_data_cache is not None:
        return _map_data_cache

    settings = get_settings()
    data_path = settings.data_path / "full_df.csv"

    # Severity mapping based on repression type
    severity_map = {
        "No known coercion, no security presence": 0,
        "Security forces present at event": 1,
        "Security forces or other repressive groups present at event": 1,
        "Army present at event": 2,
        "Participants summoned to security facility": 2,
        "Physical harassment": 3,
        "Arrests / detentions": 3,
        "Party Militias/ Baltagia present at event": 3,
        "Injuries inflicted": 4,
        "Deaths inflicted": 5,
    }

    try:
        df = pd.read_csv(
            data_path,
            usecols=[
                "gpslatend",
                "gpslongend",
                "repression",
                "country",
                "violence",
                "demandtypeone",
                "tacticprimary",
            ],
        )
        df = df.dropna(subset=["gpslatend", "gpslongend"])
        df["violence_heat"] = df["violence"].notna().astype(int)

        points = []
        for _, row in df.iterrows():
            repression = str(row["repression"]) if pd.notna(row["repression"]) else ""
            points.append(
                {
                    "lat": round(float(row["gpslatend"]), 5),
                    "lng": round(float(row["gpslongend"]), 5),
                    "repression": repression,
                    "country": str(row["country"]) if pd.notna(row["country"]) else "",
                    "violence_heat": int(row["violence_heat"]),
                    "demand": str(row["demandtypeone"]) if pd.notna(row["demandtypeone"]) else "",
                    "tactic": str(row["tacticprimary"]) if pd.notna(row["tacticprimary"]) else "",
                    "severity": severity_map.get(repression, 0),
                }
            )

        _map_data_cache = points
        logger.info("Map data loaded", point_count=len(points))
        return points

    except Exception as e:
        logger.error("Failed to load map data", error=str(e))
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail=f"Failed to load map data: {e}",
        )


@app.get(
    "/repression-stats",
    tags=["Data"],
    summary="Get historical repression statistics",
    description="Get distribution of repression types from historical data, optionally filtered by country.",
)
async def get_repression_stats(
    country: str | None = Query(None, description="Optional country filter"),
) -> dict[str, Any]:
    """Return historical repression type distribution."""
    global _repression_stats_cache

    # Use cache for unfiltered requests
    if country is None and _repression_stats_cache is not None:
        return _repression_stats_cache

    settings = get_settings()
    data_path = settings.data_path / "full_df.csv"

    try:
        df = pd.read_csv(data_path, usecols=["repression", "country"])

        if country:
            df = df[df["country"] == country]

        counts = df["repression"].value_counts().to_dict()
        total = int(df["repression"].notna().sum())

        result = {
            "counts": {str(k): int(v) for k, v in counts.items()},
            "total": total,
            "country_filter": country,
        }

        if country is None:
            _repression_stats_cache = result

        return result

    except Exception as e:
        logger.error("Failed to load repression stats", error=str(e))
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail=f"Failed to load repression stats: {e}",
        )


# ============================================================
# Main Entry Point
# ============================================================
def main() -> None:
    """Run the API server."""
    import uvicorn

    settings = get_settings()

    uvicorn.run(
        "api.api:app",
        host=settings.host,
        port=settings.port,
        reload=settings.is_development,
        log_level=settings.log_level.lower(),
    )


if __name__ == "__main__":
    main()
