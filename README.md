# Pro-Test v2.0

Protest Outcome Prediction System using Machine Learning

[![CI](https://github.com/NoahDarwich/portest/actions/workflows/ci.yml/badge.svg)](https://github.com/NoahDarwich/portest/actions/workflows/ci.yml)

## Overview

Pro-Test predicts likely security responses to protests in Iraq, Lebanon, and Egypt using an ensemble machine learning model trained on 13,000+ historical protest events (2017-2022).

**Predicted Outcomes:**
- Verbal coercion
- Constraint (detention/restriction)
- Physical coercion (mild/severe/deadly)
- Security forces presence
- Militia presence

## Live Demo

- **Frontend:** Hosted on Vercel
- **Backend API:** Hosted on Render

## Tech Stack

| Layer | Technology |
|-------|------------|
| Frontend | Next.js 16, TypeScript, Tailwind CSS |
| Backend | FastAPI, Python 3.11 |
| ML Models | Ensemble (Random Forest + XGBoost + LightGBM) |
| Caching | Redis |
| Monitoring | Prometheus + Grafana |
| CI/CD | GitHub Actions |

## Quick Start

### Local Development

```bash
# Backend
pip install -e ".[dev]"
python -m api.api

# Frontend
cd frontend
npm install
npm run dev
```

### Docker

```bash
docker-compose up
```

## API Endpoints

| Endpoint | Description |
|----------|-------------|
| `GET /health` | Health check |
| `GET /predict` | Get predictions for protest outcomes |
| `GET /regions` | Available countries and governorates |
| `GET /options` | Input field options |
| `GET /model/info` | Model information |
| `GET /model/features` | Feature importance |
| `GET /metrics` | Prometheus metrics |

## Project Structure

```
portest/
├── api/                 # FastAPI backend
├── protest/             # Core ML module
├── frontend/            # Next.js frontend
├── tests/               # Test suite (83 tests)
├── monitoring/          # Prometheus + Grafana
├── deploy/              # Deployment configs
└── models/              # Trained model files
```

## Documentation

- [API Documentation](/frontend/src/app/docs) - Endpoint reference
- [Getting Started Guide](/frontend/src/app/about) - Usage tutorial
- [Model Limitations](/docs/MODEL_LIMITATIONS.md) - Bias and constraints
- [Development Progress](/PROGRESS.md) - Implementation details

## License

MIT
