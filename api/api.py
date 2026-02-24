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
    participant_count: int = Field(..., ge=0, description="Number of participants")


class PredictionResult(BaseModel):
    """Individual prediction result with confidence."""

    probability: float = Field(..., ge=0, le=1, description="Probability of outcome occurring")
    confidence: float | None = Field(
        None, ge=0, le=1, description="Confidence in prediction (std dev)"
    )

    class Config:
        json_schema_extra = {"example": {"probability": 0.75, "confidence": 0.85}}


class PredictionResponse(BaseModel):
    """Prediction response with repression level and probability distribution."""

    repression_level: int = Field(..., ge=0, le=5, description="Predicted repression level (0–5)")
    repression_label: str = Field(..., description="Human-readable label for the predicted level")
    level_probabilities: dict[str, float] = Field(
        ..., description="Probability for each repression level (keys '0'–'5')"
    )
    model_id: str
    model_version: str
    cached: bool = False
    timestamp: datetime = Field(default_factory=datetime.utcnow)


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

    SEVERITY_LABELS = {
        0: "None",
        1: "Presence",
        2: "Escalated",
        3: "Force used",
        4: "Injuries",
        5: "Lethal",
    }

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

    def predict(self, df: pd.DataFrame) -> dict[str, Any]:
        """Run prediction and return formatted results."""
        if not self._loaded or self._model is None:
            raise RuntimeError("Model not loaded")

        # Get predictions — single multi-class target
        probs = self._model.predict_proba(df)  # list with 1 array of shape (1, 6)
        preds = self._model.predict(df)        # shape (1, 1)

        level_probs = probs[0][0]              # array of 6 probabilities
        predicted_level = int(preds[0][0])

        results = {
            "repression_level": predicted_level,
            "repression_label": self.SEVERITY_LABELS.get(predicted_level, "Unknown"),
            "level_probabilities": {
                str(i): round(float(p), 4) for i, p in enumerate(level_probs)
            },
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
            participant_count=combined_sizes,
            predictions=cached_result["predictions"],
            latency=latency,
            cached=True,
        )

        p = cached_result["predictions"]
        return PredictionResponse(
            repression_level=p["repression_level"],
            repression_label=p["repression_label"],
            level_probabilities=p["level_probabilities"],
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

        response = PredictionResponse(
            repression_level=results["repression_level"],
            repression_label=results["repression_label"],
            level_probabilities=results["level_probabilities"],
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
        target_columns=["repression_level"],
        feature_columns=[
            "country",
            "governorate",
            "locationtypeend",
            "demandtypeone",
            "tacticprimary",
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
                ],
            )
            return {
                "location_types": sorted(df["locationtypeend"].dropna().unique().tolist()),
                "demand_types": sorted(df["demandtypeone"].dropna().unique().tolist()),
                "tactics": sorted(df["tacticprimary"].dropna().unique().tolist()),
            }
        else:
            return {
                "location_types": ["Midan", "Main road", "Government building"],
                "demand_types": ["Politics (national)", "Economy", "Services"],
                "tactics": ["Demonstration / protest", "Roadblock or blockade"],
            }
    except Exception as e:
        logger.warning("Failed to load options from data", error=str(e))
        return {
            "location_types": ["Midan", "Main road"],
            "demand_types": ["Politics (national)"],
            "tactics": ["Demonstration / protest"],
        }


# ============================================================
# Map & Statistics Endpoints
# ============================================================
_map_data_cache: list[dict[str, Any]] | None = None
_repression_stats_cache: dict[str, Any] | None = None

# Historical analysis caches
_historical_kpis_cache: dict[str, Any] | None = None
_historical_trends_cache: dict[str, Any] | None = None
_historical_cross_tab_cache: dict[str, Any] | None = None
_historical_demands_cache: dict[str, Any] | None = None

_REPRESSION_SHORT: dict[str, str] = {
    "No known coercion, no security presence": "No coercion",
    "Security forces or other repressive groups present at event": "Repressive groups",
    "Injuries inflicted": "Injuries",
    "Physical harassment": "Harassment",
    "Security forces present at event": "Security present",
    "Deaths inflicted": "Deaths",
    "Army present at event": "Army present",
    "Arrests / detentions": "Arrests",
    "Party Militias/ Baltagia present at event": "Militias",
    "Participants summoned to security facility": "Summoned",
}
_NO_COERCION = "No known coercion, no security presence"


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
                "startdate",
                "gpslatend",
                "gpslongend",
                "repression",
                "country",
                "violence",
                "demandtypeone",
                "tacticprimary",
            ],
        )
        df["startdate"] = pd.to_datetime(df["startdate"], format="mixed", dayfirst=False, errors="coerce")
        df = df.dropna(subset=["gpslatend", "gpslongend"])

        # Filter to only the 3 supported countries using per-country bounding boxes
        country_bounds = {
            "Iraq":    (29.0, 37.5, 38.5, 48.8),
            "Lebanon": (33.0, 34.7, 35.0, 36.7),
            "Egypt":   (22.0, 31.7, 24.7, 37.1),
        }
        df = df[df["country"].isin(country_bounds)]

        def in_bounds(row: pd.Series) -> bool:
            lat_min, lat_max, lng_min, lng_max = country_bounds[row["country"]]
            return lat_min <= row["gpslatend"] <= lat_max and lng_min <= row["gpslongend"] <= lng_max

        df = df[df.apply(in_bounds, axis=1)]

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
                    "year": int(row["startdate"].year) if pd.notna(row["startdate"]) else None,
                    "month": int(row["startdate"].month) if pd.notna(row["startdate"]) else None,
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
# Historical Analysis Endpoints
# ============================================================


@app.get(
    "/historical/kpis",
    tags=["Historical"],
    summary="Get historical KPI statistics",
)
async def get_historical_kpis(
    country: str | None = Query(None, description="Optional country filter"),
) -> dict[str, Any]:
    global _historical_kpis_cache
    if country is None and _historical_kpis_cache is not None:
        return _historical_kpis_cache

    settings = get_settings()
    data_path = settings.data_path / "full_df.csv"

    try:
        df = pd.read_csv(
            data_path, usecols=["repression", "country", "killed", "injured", "arrested"]
        )
        if country:
            df = df[df["country"] == country]

        total = len(df)
        rep = df["repression"]
        repressed = int((rep.notna() & (rep != _NO_COERCION)).sum())
        # Use numeric columns so counts match the displayed totals (killed/injured/arrested)
        lethal   = int((df["killed"].fillna(0) > 0).sum())
        injuries = int((df["injured"].fillna(0) > 0).sum())
        arrests  = int((df["arrested"].fillna(0) > 0).sum())

        result: dict[str, Any] = {
            "total_events": total,
            "total_killed": int(df["killed"].fillna(0).sum()),
            "total_injured": int(df["injured"].fillna(0).sum()),
            "total_arrested": int(df["arrested"].fillna(0).sum()),
            "repressed_count": repressed,
            "repressed_pct": round(repressed / total * 100, 1) if total > 0 else 0.0,
            "lethal_pct": round(lethal / total * 100, 1) if total > 0 else 0.0,
            "injury_pct": round(injuries / total * 100, 1) if total > 0 else 0.0,
            "arrest_pct": round(arrests / total * 100, 1) if total > 0 else 0.0,
        }

        if country is None:
            _historical_kpis_cache = result
        return result

    except Exception as e:
        logger.error("Failed to load historical KPIs", error=str(e))
        raise HTTPException(status_code=500, detail=f"Failed to load historical KPIs: {e}")


@app.get(
    "/historical/trends",
    tags=["Historical"],
    summary="Get monthly protest trends over time",
)
async def get_historical_trends(
    country: str | None = Query(None, description="Optional country filter"),
) -> dict[str, Any]:
    global _historical_trends_cache
    if country is None and _historical_trends_cache is not None:
        return _historical_trends_cache

    settings = get_settings()
    data_path = settings.data_path / "full_df.csv"

    try:
        df = pd.read_csv(data_path, usecols=["startdate", "country"])
        df["startdate"] = pd.to_datetime(
            df["startdate"], format="mixed", dayfirst=False, errors="coerce"
        )
        df = df.dropna(subset=["startdate"])

        if country:
            df = df[df["country"] == country]

        df["month_str"] = df["startdate"].dt.strftime("%Y-%m")

        grouped = df.groupby(["month_str", "country"]).size().reset_index(name="count")
        if grouped.empty:
            return {"monthly": [], "countries": []}

        pivoted = (
            grouped.pivot(index="month_str", columns="country", values="count")
            .fillna(0)
            .sort_index()
        )

        monthly = []
        for month, row in pivoted.iterrows():
            entry: dict[str, Any] = {"month": month}
            for c in ["Egypt", "Iraq", "Lebanon"]:
                entry[c] = int(row.get(c, 0))
            entry["total"] = sum(int(row.get(c, 0)) for c in ["Egypt", "Iraq", "Lebanon"])
            monthly.append(entry)

        result: dict[str, Any] = {
            "monthly": monthly,
            "countries": sorted(df["country"].unique().tolist()),
        }
        if country is None:
            _historical_trends_cache = result
        return result

    except Exception as e:
        logger.error("Failed to load historical trends", error=str(e))
        raise HTTPException(status_code=500, detail=f"Failed to load historical trends: {e}")


@app.get(
    "/historical/cross-tab",
    tags=["Historical"],
    summary="Get tactic × repression cross-tabulation",
)
async def get_historical_cross_tab(
    country: str | None = Query(None, description="Optional country filter"),
) -> dict[str, Any]:
    global _historical_cross_tab_cache
    if country is None and _historical_cross_tab_cache is not None:
        return _historical_cross_tab_cache

    settings = get_settings()
    data_path = settings.data_path / "full_df.csv"

    try:
        df = pd.read_csv(data_path, usecols=["tacticprimary", "repression", "country"])
        df = df.dropna(subset=["tacticprimary", "repression"])

        if country:
            df = df[df["country"] == country]

        top_tactics = df["tacticprimary"].value_counts().head(7).index.tolist()
        df = df[df["tacticprimary"].isin(top_tactics)]

        df = df.copy()
        df["repression_short"] = df["repression"].map(_REPRESSION_SHORT).fillna(df["repression"])

        ct = pd.crosstab(df["tacticprimary"], df["repression_short"], normalize="index") * 100

        # Preserve label order from _REPRESSION_SHORT, keep only present ones
        ordered_labels = list(_REPRESSION_SHORT.values())
        present_labels = [lb for lb in ordered_labels if lb in ct.columns]

        data = []
        for tactic in top_tactics:
            if tactic not in ct.index:
                continue
            row = ct.loc[tactic]
            entry: dict[str, Any] = {
                "tactic": tactic,
                "total": int(df[df["tacticprimary"] == tactic].shape[0]),
            }
            for label in present_labels:
                entry[label] = round(float(row.get(label, 0)), 1)
            data.append(entry)

        result: dict[str, Any] = {"data": data, "repression_labels": present_labels}
        if country is None:
            _historical_cross_tab_cache = result
        return result

    except Exception as e:
        logger.error("Failed to load cross-tab", error=str(e))
        raise HTTPException(status_code=500, detail=f"Failed to load cross-tab: {e}")


@app.get(
    "/historical/demands",
    tags=["Historical"],
    summary="Get demand type breakdown with repression rates",
)
async def get_historical_demands(
    country: str | None = Query(None, description="Optional country filter"),
) -> dict[str, Any]:
    global _historical_demands_cache
    if country is None and _historical_demands_cache is not None:
        return _historical_demands_cache

    settings = get_settings()
    data_path = settings.data_path / "full_df.csv"

    try:
        df = pd.read_csv(data_path, usecols=["demandtypeone", "repression", "country"])
        df = df.dropna(subset=["demandtypeone", "repression"])

        if country:
            df = df[df["country"] == country]

        data = []
        for demand, group in df.groupby("demandtypeone"):
            total = len(group)
            repressed = int((group["repression"] != _NO_COERCION).sum())
            lethal = int((group["repression"] == "Deaths inflicted").sum())
            data.append(
                {
                    "demand": demand,
                    "total": total,
                    "not_repressed": total - repressed,
                    "repressed_count": repressed,
                    "repressed_pct": round(repressed / total * 100, 1) if total > 0 else 0.0,
                    "lethal_count": lethal,
                    "lethal_pct": round(lethal / total * 100, 1) if total > 0 else 0.0,
                }
            )

        data.sort(key=lambda x: x["total"], reverse=True)
        result: dict[str, Any] = {"data": data}
        if country is None:
            _historical_demands_cache = result
        return result

    except Exception as e:
        logger.error("Failed to load demands breakdown", error=str(e))
        raise HTTPException(status_code=500, detail=f"Failed to load demands: {e}")


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
