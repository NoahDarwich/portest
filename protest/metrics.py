"""
Pro-Test Prometheus Metrics Module

Custom metrics for monitoring prediction performance and model health.
"""

from prometheus_client import Counter, Gauge, Histogram, Info

# ============================================================
# Application Info
# ============================================================
APP_INFO = Info(
    "protest_app",
    "Pro-Test application information",
)

# ============================================================
# Prediction Metrics
# ============================================================
PREDICTION_REQUESTS = Counter(
    "protest_prediction_requests_total",
    "Total number of prediction requests",
    ["country", "status"],
)

PREDICTION_LATENCY = Histogram(
    "protest_prediction_latency_seconds",
    "Prediction request latency in seconds",
    ["country"],
    buckets=[0.01, 0.025, 0.05, 0.075, 0.1, 0.25, 0.5, 0.75, 1.0, 2.5, 5.0],
)

PREDICTION_PROBABILITIES = Histogram(
    "protest_prediction_probability",
    "Distribution of prediction probabilities by outcome",
    ["outcome"],
    buckets=[0.0, 0.1, 0.2, 0.3, 0.4, 0.5, 0.6, 0.7, 0.8, 0.9, 1.0],
)

# ============================================================
# Cache Metrics
# ============================================================
CACHE_HITS = Counter(
    "protest_cache_hits_total",
    "Total number of cache hits",
)

CACHE_MISSES = Counter(
    "protest_cache_misses_total",
    "Total number of cache misses",
)

# ============================================================
# Model Metrics
# ============================================================
MODEL_LOADED = Gauge(
    "protest_model_loaded",
    "Whether the ML model is loaded (1) or not (0)",
)

MODEL_LOAD_TIME = Gauge(
    "protest_model_load_time_seconds",
    "Time taken to load the model in seconds",
)

MODEL_PREDICTIONS_BY_OUTCOME = Counter(
    "protest_model_predictions_by_outcome_total",
    "Total predictions by outcome type and result",
    ["outcome", "predicted"],
)

# ============================================================
# Data Distribution Metrics (for drift detection)
# ============================================================
INPUT_COUNTRY_DISTRIBUTION = Counter(
    "protest_input_country_total",
    "Distribution of input countries",
    ["country"],
)

INPUT_VIOLENCE_DISTRIBUTION = Counter(
    "protest_input_violence_total",
    "Distribution of input violence levels",
    ["violence_level"],
)

INPUT_PARTICIPANT_COUNT = Histogram(
    "protest_input_participant_count",
    "Distribution of participant counts in requests",
    buckets=[10, 50, 100, 250, 500, 1000, 2500, 5000, 10000, 50000, 100000],
)


def set_app_info(version: str, environment: str, model_id: str) -> None:
    """Set application info metrics."""
    APP_INFO.info(
        {
            "version": version,
            "environment": environment,
            "model_id": model_id,
        }
    )


def record_prediction_metrics(
    country: str,
    violence_level: str,
    participant_count: int,
    predictions: dict[str, dict],
    latency: float,
    cached: bool,
) -> None:
    """Record metrics for a prediction request."""
    # Request metrics
    PREDICTION_REQUESTS.labels(country=country, status="success").inc()
    PREDICTION_LATENCY.labels(country=country).observe(latency)

    # Cache metrics
    if cached:
        CACHE_HITS.inc()
    else:
        CACHE_MISSES.inc()

    # Input distribution metrics
    INPUT_COUNTRY_DISTRIBUTION.labels(country=country).inc()
    INPUT_VIOLENCE_DISTRIBUTION.labels(violence_level=violence_level).inc()
    INPUT_PARTICIPANT_COUNT.observe(participant_count)

    # Prediction distribution metrics
    for outcome, data in predictions.items():
        prob = data.get("probability", 0)
        predicted = data.get("prediction", False)

        PREDICTION_PROBABILITIES.labels(outcome=outcome).observe(prob)
        MODEL_PREDICTIONS_BY_OUTCOME.labels(
            outcome=outcome,
            predicted="true" if predicted else "false",
        ).inc()


def record_prediction_error(country: str) -> None:
    """Record a prediction error."""
    PREDICTION_REQUESTS.labels(country=country, status="error").inc()


def set_model_loaded(loaded: bool, load_time: float | None = None) -> None:
    """Set model loaded status."""
    MODEL_LOADED.set(1 if loaded else 0)
    if load_time is not None:
        MODEL_LOAD_TIME.set(load_time)
