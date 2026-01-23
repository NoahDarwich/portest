# Pro-Test Constitution & Vision
## Predictive Modelling for Protest Outcome Analysis

*Version 2.0 - January 2026*

---

## Table of Contents

1. [Mission Statement](#mission-statement)
2. [Ethical Framework](#ethical-framework)
3. [Technical Vision](#technical-vision)
4. [Architecture Blueprint](#architecture-blueprint)
5. [Implementation Roadmap](#implementation-roadmap)
6. [Business Model](#business-model)
7. [Governance & Principles](#governance--principles)

---

## Mission Statement

### Purpose

Pro-Test provides **predictive intelligence on protest outcomes** by analyzing historical patterns of state response to dissent. The platform transforms complex protest event data into actionable insights for researchers, analysts, and organizations seeking to understand protest dynamics.

### What We Are

- A **predictive analytics platform** for protest outcome analysis
- A **research tool** for academics studying social movements and state responses
- An **intelligence resource** for organizations monitoring civil unrest
- A **proprietary product** with controlled access and quality assurance

### What We Are NOT

- A real-time surveillance system
- A tool for tracking or identifying individuals
- A predictive policing system for preemptive arrests

### Core Value Proposition

Transform raw historical protest data into actionable predictive insights, enabling:
- Researchers to study patterns in state response to dissent
- Journalists to assess risk before covering events
- Human rights organizations to allocate monitoring resources
- Analysts to understand protest dynamics across regions
- Organizations to make data-informed decisions

---

## Ethical Framework

### Guiding Principles

#### 1. Beneficence Over Harm
Every feature and output must be evaluated through the lens: **"Does this help protect people exercising their right to peaceful assembly?"** If a capability could more easily enable repression than protection, it will not be implemented.

#### 2. Transparency & Explainability
- Training data sources and methodology documented internally
- Model performance metrics tracked and disclosed to clients
- Known limitations communicated to users
- Explainability features (SHAP values, feature importance) planned as future enhancement

#### 3. Data Dignity
- Protest event data is aggregated and anonymized - no individual identification
- Data sources must be ethically obtained (academic datasets, news reports, public records)
- No integration with surveillance systems, social media scraping, or location tracking
- Users cannot query about specific individuals or small groups

#### 4. Bias Acknowledgment & Mitigation
- Recognize that historical data reflects historical biases in reporting and documentation
- Regularly audit model outputs for systematic biases across regions, demographics, and protest types
- Document known limitations and gaps in training data
- Implement fairness metrics in model evaluation

#### 5. Controlled Access
- Access managed through API keys and user agreements
- Tiered access levels based on use case and organization type
- Usage monitoring to ensure compliance with terms of service
- Quality assurance through controlled distribution

### Usage Policy

Access to Pro-Test is evaluated on a **case-by-case basis**. The following framework guides access decisions:

#### Generally Permitted Uses
- Academic research and publication
- Journalism and media coverage
- Human rights monitoring and documentation
- International organization analysis (UN, ICRC, etc.)
- Policy research and think tank analysis

#### Evaluated Case-by-Case
- Government agencies (evaluated based on purpose, jurisdiction, human rights record)
- Commercial risk intelligence firms
- Insurance and financial sector analysis
- Corporate security planning

#### Prohibited Uses
1. **Individual Targeting**: Any attempt to identify or track specific protesters
2. **Repression Planning**: Direct use to plan suppression of legitimate protest
3. **Misinformation**: Misrepresenting predictions or model capabilities
4. **Unauthorized Redistribution**: Sharing access or data without permission

*Note: Detailed usage policy and evaluation criteria to be developed as the product matures.*

### Access Evaluation Framework

When evaluating access requests:
1. **Purpose Assessment**: What is the stated use case?
2. **Organization Review**: What is the requester's track record?
3. **Risk Analysis**: Could this access enable harm?
4. **Terms Agreement**: Will they agree to usage restrictions?
5. **Periodic Review**: Ongoing compliance monitoring

---

## Technical Vision

### Current State Assessment

The original Pro-Test (v1.0) was a proof-of-concept with:
- Random Forest classifier trained on Iraq, Lebanon, Egypt data (2019+)
- FastAPI backend with Streamlit frontend
- 7 repression outcome predictions + 6 method predictions
- Deployed on Heroku/Google Cloud Run

**Limitations identified:**
- Single model type (Random Forest) without comparison
- No model explainability
- Outdated dependencies (Python 3.8)
- Hard-coded configurations
- No CI/CD or automated testing
- Missing raw data for reproducibility
- No drift monitoring or retraining pipeline

### Vision for Pro-Test v2.0

#### Model Architecture Evolution

```
v1.0 (Current)                    v2.0 (Target)
─────────────────                 ─────────────────
Random Forest only        →       Ensemble of models (RF, XGBoost, LightGBM)
Single prediction         →       Prediction + confidence intervals
No explainability         →       Explainability as optional enhancement
Static model              →       Versioned models with drift detection
7 binary outputs          →       Multi-output with calibrated probabilities
```

#### Key Technical Improvements

**1. Model Enhancements**
- Implement model ensemble with weighted voting (Random Forest, XGBoost, LightGBM)
- Add calibrated probability outputs with confidence intervals
- Implement temporal validation to prevent data leakage
- Add uncertainty quantification for predictions
- *Future Enhancement*: SHAP integration for prediction explainability

**2. Data Pipeline Modernization**
- Version control for datasets using DVC (Data Version Control)
- Automated data validation and quality checks
- Feature store for consistent feature engineering
- Support for incremental data updates
- Data lineage tracking

**3. MLOps Infrastructure**
- Model registry with MLflow for version tracking
- Automated retraining pipeline triggered by drift detection
- A/B testing framework for model comparison
- Performance monitoring dashboards
- Automated rollback on performance degradation

**4. API & Backend**
- FastAPI with async support and connection pooling
- Redis caching for repeated predictions
- Pydantic v2 for strict input validation
- OpenAPI documentation with examples
- Rate limiting and API key management
- Health checks and structured logging

**5. Frontend Evolution**
- Modern React/Next.js dashboard (replacing Streamlit for production)
- Interactive prediction explorer with SHAP visualizations
- Historical trend analysis
- Comparative regional analysis
- Mobile-responsive design

**6. Infrastructure**
- Docker Compose for local development
- Kubernetes-ready deployment manifests
- Infrastructure as Code (Terraform/Pulumi)
- GitHub Actions CI/CD pipeline
- Secrets management with environment variables

### Technology Stack (v2.0)

| Layer | Technology | Rationale |
|-------|------------|-----------|
| **Language** | Python 3.11+ | LTS, performance improvements, modern typing |
| **ML Framework** | scikit-learn, XGBoost, LightGBM | Proven tabular data performance |
| **Explainability** | SHAP, LIME | Future enhancement for interpretability |
| **API** | FastAPI 0.100+ | Performance, typing, auto-docs |
| **Validation** | Pydantic v2 | Type safety, performance |
| **Caching** | Redis | Low-latency repeated predictions |
| **Data Versioning** | DVC | Git-like data/model versioning |
| **Model Registry** | MLflow | Industry standard lifecycle management |
| **Monitoring** | Evidently AI | ML-specific drift detection |
| **Frontend** | Next.js + Tailwind | Modern, performant, accessible |
| **Visualization** | Plotly, D3.js | Interactive, publication-quality |
| **Container** | Docker | Reproducible environments |
| **Orchestration** | Kubernetes | Scalable deployment |
| **CI/CD** | GitHub Actions | Native integration |
| **Cloud** | GCP/AWS (flexible) | Production hosting |

---

## Architecture Blueprint

### System Architecture

```
┌─────────────────────────────────────────────────────────────────────────┐
│                              USERS                                       │
│     Researchers │ Journalists │ Human Rights Orgs │ Civil Society       │
└─────────────────────────────────────────────────────────────────────────┘
                                    │
                                    ▼
┌─────────────────────────────────────────────────────────────────────────┐
│                          PRESENTATION LAYER                              │
│  ┌─────────────────────┐  ┌─────────────────────┐  ┌─────────────────┐ │
│  │   Web Dashboard     │  │    REST API         │  │  Documentation  │ │
│  │   (Next.js)         │  │    (FastAPI)        │  │  (Mintlify)     │ │
│  └─────────────────────┘  └─────────────────────┘  └─────────────────┘ │
└─────────────────────────────────────────────────────────────────────────┘
                                    │
                                    ▼
┌─────────────────────────────────────────────────────────────────────────┐
│                          APPLICATION LAYER                               │
│  ┌─────────────────────┐  ┌─────────────────────┐  ┌─────────────────┐ │
│  │  Prediction Engine  │  │  Explainability     │  │  Validation     │ │
│  │  - Ensemble Models  │  │  - SHAP Values      │  │  - Input Check  │ │
│  │  - Confidence Calc  │  │  - Feature Import.  │  │  - Rate Limit   │ │
│  └─────────────────────┘  └─────────────────────┘  └─────────────────┘ │
└─────────────────────────────────────────────────────────────────────────┘
                                    │
                                    ▼
┌─────────────────────────────────────────────────────────────────────────┐
│                            ML LAYER                                      │
│  ┌─────────────────────┐  ┌─────────────────────┐  ┌─────────────────┐ │
│  │   Model Registry    │  │  Feature Store      │  │  Training       │ │
│  │   (MLflow)          │  │  (Feast/Custom)     │  │  Pipeline       │ │
│  └─────────────────────┘  └─────────────────────┘  └─────────────────┘ │
│  ┌─────────────────────┐  ┌─────────────────────┐  ┌─────────────────┐ │
│  │   Drift Detection   │  │  A/B Testing        │  │  Monitoring     │ │
│  │   (Evidently)       │  │  Framework          │  │  (Prometheus)   │ │
│  └─────────────────────┘  └─────────────────────┘  └─────────────────┘ │
└─────────────────────────────────────────────────────────────────────────┘
                                    │
                                    ▼
┌─────────────────────────────────────────────────────────────────────────┐
│                            DATA LAYER                                    │
│  ┌─────────────────────┐  ┌─────────────────────┐  ┌─────────────────┐ │
│  │   Raw Data Store    │  │  Processed Data     │  │  Version Control│ │
│  │   (S3/GCS)          │  │  (PostgreSQL)       │  │  (DVC)          │ │
│  └─────────────────────┘  └─────────────────────┘  └─────────────────┘ │
└─────────────────────────────────────────────────────────────────────────┘
```

### Data Flow

```
┌──────────────┐     ┌──────────────┐     ┌──────────────┐     ┌──────────────┐
│  Raw Data    │────▶│  Validation  │────▶│  Feature     │────▶│  Model       │
│  Ingestion   │     │  & Cleaning  │     │  Engineering │     │  Training    │
└──────────────┘     └──────────────┘     └──────────────┘     └──────────────┘
                                                                       │
       ┌───────────────────────────────────────────────────────────────┘
       │
       ▼
┌──────────────┐     ┌──────────────┐     ┌──────────────┐     ┌──────────────┐
│  Model       │────▶│  Validation  │────▶│  Registry    │────▶│  Production  │
│  Evaluation  │     │  & Testing   │     │  (MLflow)    │     │  Deployment  │
└──────────────┘     └──────────────┘     └──────────────┘     └──────────────┘
                                                                       │
       ┌───────────────────────────────────────────────────────────────┘
       │
       ▼
┌──────────────┐     ┌──────────────┐     ┌──────────────┐
│  Monitoring  │────▶│  Drift       │────▶│  Automated   │
│  & Logging   │     │  Detection   │     │  Retraining  │
└──────────────┘     └──────────────┘     └──────────────┘
```

### API Design

```yaml
# Core Endpoints

GET /health
  # Health check for load balancers

GET /api/v2/predict
  # Main prediction endpoint
  Parameters:
    - country: str (required)
    - region: str (required)
    - location_type: str (required)
    - demand_type: str (required)
    - primary_tactic: str (required)
    - protester_violence: str (required)
    - participant_count: int (required)
    - include_explanation: bool = false  # Optional, future enhancement
  Response:
    - predictions: dict[str, float]  # Calibrated probabilities
    - confidence_intervals: dict[str, tuple]
    - explanations: dict[str, list]  # Optional, if requested and available
    - model_version: str
    - timestamp: datetime

GET /api/v2/explain/{prediction_id}
  # Detailed explanation for a prediction (future enhancement)

GET /api/v2/models/current
  # Current model metadata and performance metrics

GET /api/v2/regions
  # Available regions and their data coverage

GET /api/v2/features
  # Feature definitions and valid values
```

---

## Implementation Roadmap

*Timeline: Quality-focused, no hard deadlines. Each phase completes when done right.*

### Phase 1: Foundation ✅ COMPLETED
**Goal: Stable, modern, deployable codebase**
**Priority: Critical - must complete before other phases**
**Status: Completed January 2026**

- [x] **1.1 Environment Modernization**
  - Upgrade to Python 3.11+
  - Pin all dependencies with exact versions
  - Update Dockerfile to modern base image
  - Set up pyproject.toml with modern tooling (ruff, mypy)

- [x] **1.2 Configuration Management**
  - Replace hard-coded values with environment variables
  - Implement pydantic-settings for configuration
  - Create .env.example with documentation
  - Set up secrets management

- [x] **1.3 Code Quality Infrastructure**
  - Implement comprehensive type hints
  - Set up pre-commit hooks (ruff, mypy, black)
  - Configure GitHub Actions CI pipeline
  - Add test infrastructure with pytest

- [x] **1.4 Data Recovery & Versioning**
  - Recover or recreate raw data files
  - Set up DVC for data versioning
  - Document data sources and collection methodology
  - Create data validation schemas

### Phase 2: Model Enhancement ✅ COMPLETED
**Goal: Improved predictions with better accuracy**
**Priority: High - core value proposition**
**Status: Completed January 2026**

- [x] **2.1 Model Comparison**
  - Implement XGBoost and LightGBM alternatives
  - Run comparative benchmarks
  - Implement proper cross-validation
  - Select optimal model(s) for ensemble

- [x] **2.2 Prediction Quality**
  - Add confidence intervals to predictions
  - Calculate feature importance rankings
  - *Optional*: Integrate SHAP for prediction explanations
  - *Optional*: Generate human-readable explanations

- [x] **2.3 Model Registry**
  - Set up MLflow tracking server
  - Implement model versioning
  - Create model promotion workflow
  - Document model lineage

- [x] **2.4 Evaluation Framework**
  - Implement comprehensive metrics suite
  - Add bias/fairness auditing
  - Create evaluation notebooks
  - Document known limitations

### Phase 3: Production Hardening ⏳ NEXT
**Goal: Reliable, monitored production system**
**Priority: High - required for production deployment**
**Status: Not started**

- [ ] **3.1 API Enhancement**
  - Implement async model loading with caching
  - Add Redis for prediction caching
  - Implement rate limiting
  - Add structured logging and tracing

- [ ] **3.2 Monitoring & Observability**
  - Set up Prometheus metrics
  - Implement Evidently for drift detection
  - Create Grafana dashboards
  - Configure alerting

- [ ] **3.3 Testing & Reliability**
  - Achieve 80%+ test coverage
  - Add integration tests
  - Implement load testing
  - Create chaos engineering tests

- [ ] **3.4 Deployment Automation**
  - Complete GitHub Actions CD pipeline
  - Create staging environment
  - Implement blue-green deployments
  - Document rollback procedures

### Phase 4: User Experience
**Goal: Accessible, documented, user-friendly**
**Priority: Medium - enhances adoption and usability**

- [ ] **4.1 Frontend Rebuild**
  - Design new dashboard UI/UX
  - Implement Next.js frontend
  - Create interactive visualizations
  - Add mobile responsiveness

- [ ] **4.2 Documentation**
  - Write comprehensive API documentation
  - Create user guides for different audiences
  - Document methodology and limitations
  - Add interactive examples

- [ ] **4.3 Onboarding**
  - Create quick-start guide
  - Add sample API clients (Python, JS)
  - Create tutorial notebooks
  - Record demo videos

### Phase 5: Expansion
**Goal: Growing coverage and capabilities**
**Priority: Ongoing - continuous improvement**

- [ ] **5.1 Data Expansion**
  - Identify additional data sources
  - Expand geographic coverage
  - Implement data update pipeline
  - Partner with academic institutions

- [ ] **5.2 Feature Development**
  - Add temporal trend analysis
  - Implement regional comparison tools
  - Create embeddable widgets
  - Build notification/alert system

---

## Business Model

*To be determined as the product matures.*

### Current Status
- **Monetization**: Not yet defined
- **Focus**: Product development and quality first
- **Approach**: Build value, determine business model later

### Potential Future Models (Under Consideration)

| Model | Description | Considerations |
|-------|-------------|----------------|
| **SaaS Subscription** | Monthly/annual API access | Recurring revenue, scalable |
| **Tiered Access** | Free tier + premium features | Adoption + monetization balance |
| **Enterprise Licensing** | Custom deployments for organizations | Higher value, more support |
| **Grant Funding** | Foundation/academic funding | Mission-aligned, non-commercial |
| **Consulting** | Custom analysis and integration | High-touch, less scalable |

### Pricing Philosophy (When Implemented)
- Value-based pricing aligned with user outcomes
- Accessible tiers for academic and civil society users
- Premium features for commercial/enterprise use
- No predatory pricing on humanitarian use cases

---

## Governance & Principles

### Development Principles

1. **Documentation-First**: Every feature must be documented before merge
2. **Test-Driven**: No production code without corresponding tests
3. **Review-Required**: All changes require code review
4. **Semantic Versioning**: Follow semver for all releases
5. **Backwards Compatible**: API changes must not break existing clients

### Code Standards

```
- Python: PEP 8 + Black formatting + Ruff linting
- Type hints: Required for all public functions
- Docstrings: Google style for all public APIs
- Tests: Pytest with >80% coverage target
- Commits: Conventional commits format
```

### Security Standards

- No secrets in code or version control
- Dependency scanning in CI pipeline
- Regular security audits
- Input validation on all endpoints
- HTTPS only in production

### Project Governance

#### Ownership & Licensing
- **License**: Proprietary - All rights reserved
- **Access**: Controlled distribution via API keys and user agreements
- **Code**: Private repository with controlled access
- **Data**: Proprietary datasets, not publicly shared

#### Team Structure

**Product Owner** (Noah Darwich)
- Defines product requirements and priorities
- Makes final decisions on features and direction
- Reviews and approves major changes
- Manages access requests and partnerships

**Development**
- Implementation delegated to development resources
- Product owner reviews deliverables
- Quality gates at each phase completion

#### Decision Making
- Product owner has final authority on product decisions
- Technical decisions documented with rationale
- Major pivots require product owner approval

### Success Metrics

| Metric | Target | Measurement |
|--------|--------|-------------|
| Model Accuracy | >70% | Temporal cross-validation |
| API Latency | <200ms p95 | Prometheus metrics |
| Uptime | 99.5% | Status monitoring |
| Test Coverage | >80% | pytest-cov |
| Documentation | 100% of public APIs | Manual audit |
| User Adoption | Track monthly active users | Analytics |

---

## Appendix

### Research References

This vision document was informed by:

- [IMF: Forecasting Social Unrest - A Machine Learning Approach](https://www.imf.org/en/Publications/WP/Issues/2021/11/05/Forecasting-Social-Unrest-A-Machine-Learning-Approach-504350)
- [Survey on Societal Event Forecasting with Deep Learning](https://arxiv.org/pdf/2112.06345)
- [Future Protest Made Risky: Examining Social Media Based Civil Unrest Prediction](https://pmc.ncbi.nlm.nih.gov/articles/PMC8423833/)
- [MLOps Best Practices 2025](https://www.azilen.com/blog/mlops-best-practices/)
- [FastAPI for Machine Learning](https://blog.jetbrains.com/pycharm/2024/09/how-to-use-fastapi-for-machine-learning/)
- [Ethical AI: Transparency, Fairness, and Privacy](https://www.tandfonline.com/doi/full/10.1080/08839514.2025.2463722)
- [Microsoft Responsible AI Framework](https://www.microsoft.com/en-us/ai/responsible-ai)
- [MLOps Principles](https://ml-ops.org/content/mlops-principles)
- [Comparative Analysis: Random Forest vs XGBoost vs LightGBM](https://www.researchgate.net/publication/380736212_A_Comparative_Analysis_of_Random_Forest_XGBoost_and_LightGBM_Algorithms_for_Emotion_Classification_in_Reddit_Comments)

### Contact

Project Maintainer: Noah Darwich
Repository: https://github.com/NoahDarwich/pro-test

---

*This is a living document. Last updated: January 2026*
