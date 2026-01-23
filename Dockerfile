# Pro-Test API Dockerfile
# Python 3.11 slim image for production

FROM python:3.11-slim-bookworm AS base

# Set environment variables
ENV PYTHONDONTWRITEBYTECODE=1 \
    PYTHONUNBUFFERED=1 \
    PYTHONPATH=/app \
    PIP_NO_CACHE_DIR=1 \
    PIP_DISABLE_PIP_VERSION_CHECK=1

WORKDIR /app

# Install system dependencies
RUN apt-get update && apt-get install -y --no-install-recommends \
    gcc \
    && rm -rf /var/lib/apt/lists/*

# ============================================================
# Dependencies stage
# ============================================================
FROM base AS dependencies

# Install Python dependencies
COPY pyproject.toml ./
RUN pip install --upgrade pip && \
    pip install .

# ============================================================
# Production stage
# ============================================================
FROM base AS production

# Copy installed packages from dependencies stage
COPY --from=dependencies /usr/local/lib/python3.11/site-packages /usr/local/lib/python3.11/site-packages
COPY --from=dependencies /usr/local/bin /usr/local/bin

# Copy application code
COPY protest/ ./protest/
COPY api/ ./api/

# Create non-root user for security
RUN useradd --create-home --shell /bin/bash appuser && \
    chown -R appuser:appuser /app
USER appuser

# Health check
HEALTHCHECK --interval=30s --timeout=10s --start-period=5s --retries=3 \
    CMD python -c "import httpx; httpx.get('http://localhost:${PORT:-8000}/health')" || exit 1

# Default port (can be overridden by environment)
ENV PORT=8000
EXPOSE ${PORT}

# Run the API
CMD uvicorn api.api:app --host 0.0.0.0 --port ${PORT}
