# Pro-Test Model Limitations & Biases

This document describes known limitations, biases, and appropriate use cases for the Pro-Test prediction models.

## Overview

Pro-Test uses machine learning models to predict protest outcomes based on historical data. Like all ML systems, these models have inherent limitations that users must understand to use them appropriately.

---

## Data Limitations

### Geographic Coverage

| Region | Coverage | Notes |
|--------|----------|-------|
| Iraq | Good | Primary data source, 2019+ |
| Lebanon | Good | Primary data source, 2019+ |
| Egypt | Moderate | Limited recent data |
| Other | None | No training data available |

**Implication**: Predictions for countries outside the training data will be unreliable or impossible.

### Temporal Coverage

- **Training Period**: Primarily 2019-2022
- **Data Gaps**: Some periods may have incomplete coverage
- **Evolving Dynamics**: Political situations change over time

**Implication**: The model reflects historical patterns and may not capture recent changes in state response tactics.

### Reporting Bias

1. **Media Coverage Bias**: Events with more media attention are more likely to be recorded
2. **Urban Bias**: Urban protests may be over-represented vs. rural areas
3. **Size Bias**: Larger events are more likely to be documented
4. **Violence Bias**: Events with violence/injuries may be more reported

**Implication**: The model may underestimate risks for smaller or rural protests.

---

## Model Limitations

### Prediction Uncertainty

- **Binary Classification**: Model predicts probability of outcomes, not certainty
- **Confidence Intervals**: Ensemble disagreement indicates uncertainty
- **Novel Situations**: Unusual protest characteristics may have unreliable predictions

### Feature Dependencies

The model relies on accurate input for:
- Country and region identification
- Protest tactic classification
- Participant count estimates
- Demand type categorization

**Implication**: Incorrect or missing inputs will produce unreliable predictions.

### What the Model Cannot Predict

1. **Specific Timing**: When exactly repression will occur
2. **Individual Outcomes**: What will happen to specific individuals
3. **Exact Casualties**: Precise number of injuries/deaths
4. **Political Decisions**: High-level government decisions
5. **Unprecedented Events**: Completely novel situations

---

## Bias Analysis

### Known Model Biases

#### Class Imbalance
Some outcomes are rare (e.g., deaths), making accurate prediction difficult:

| Outcome | Positive Rate | Reliability |
|---------|--------------|-------------|
| Security presence | High (~40%) | Good |
| Arrests | Moderate (~20%) | Good |
| Injuries | Low (~10%) | Moderate |
| Deaths | Very Low (~2%) | Limited |

#### Geographic Bias
Models may perform differently across regions due to:
- Different data quality per country
- Different reporting standards
- Country-specific response patterns

### Fairness Considerations

The model does not consider and should not be used to discriminate based on:
- Religious affiliation of protesters
- Ethnic background
- Political affiliation (beyond demand type)
- Gender composition

---

## Appropriate Use Cases

### Recommended Uses

1. **Risk Assessment**: General awareness of potential outcomes
2. **Resource Planning**: Helping organizations prepare for coverage
3. **Research**: Academic study of protest dynamics
4. **Pattern Analysis**: Understanding regional differences

### Inappropriate Uses

1. **Individual Decisions**: Don't use for individual safety decisions alone
2. **Government Planning**: Not for planning state responses
3. **Legal Proceedings**: Not evidence-quality predictions
4. **Real-time Operations**: Not designed for live tactical use

---

## Confidence Guidelines

### High Confidence Predictions

Predictions are more reliable when:
- Input matches common training examples
- Ensemble models agree (low std deviation)
- Country/region has good training data coverage
- Protest characteristics are well-defined

### Low Confidence Predictions

Be skeptical when:
- Ensemble models disagree significantly
- Input values are rare or unusual
- Prediction probability is near 0.5
- Country/region has limited training data

### Recommended Confidence Thresholds

| Confidence Level | Ensemble Std | Guidance |
|-----------------|--------------|----------|
| High | < 0.05 | Can inform planning |
| Medium | 0.05 - 0.15 | Use with caution |
| Low | > 0.15 | Treat as uncertain |

---

## Model Updates & Drift

### Monitoring

We monitor for:
- **Data Drift**: Changes in input distributions
- **Concept Drift**: Changes in outcome patterns
- **Performance Degradation**: Declining accuracy over time

### Update Frequency

- **Minor Updates**: Quarterly retraining with new data
- **Major Updates**: Annual model architecture review
- **Emergency Updates**: If significant drift detected

### Version History

| Version | Date | Changes |
|---------|------|---------|
| v1.0 | 2020 | Initial Random Forest model |
| v2.0 | 2026 | Ensemble model, new API, confidence intervals |

---

## Recommendations for Users

### Before Using Predictions

1. **Understand Limitations**: Read this document fully
2. **Check Coverage**: Verify your region has training data
3. **Validate Inputs**: Ensure input accuracy
4. **Consider Context**: Predictions don't capture all factors

### When Interpreting Results

1. **Use Probabilities**: Don't treat as binary yes/no
2. **Check Confidence**: High uncertainty = less reliable
3. **Compare to Base Rates**: Context matters
4. **Combine with Other Sources**: Don't rely solely on model

### Reporting Issues

If you notice:
- Consistently wrong predictions
- Unexpected behavior
- Potential biases

Please report to: [GitHub Issues](https://github.com/NoahDarwich/pro-test/issues)

---

## Technical Metrics

### Model Performance (v2.0, 5-fold CV)

| Model | Accuracy | F1 (macro) | ROC-AUC |
|-------|----------|------------|---------|
| Random Forest | ~0.72 | ~0.68 | ~0.75 |
| XGBoost | ~0.74 | ~0.70 | ~0.77 |
| LightGBM | ~0.73 | ~0.69 | ~0.76 |
| Ensemble | ~0.75 | ~0.71 | ~0.78 |

*Note: Actual metrics depend on specific training run and data.*

### Per-Target Performance

Performance varies by outcome type. Generally:
- **Better**: Common outcomes (security presence, basic repression)
- **Worse**: Rare outcomes (deaths, specific tactics)

---

## Legal Disclaimer

This model is provided for informational and research purposes only. Predictions:
- Are not guarantees of outcomes
- Should not be the sole basis for safety decisions
- Do not constitute professional advice
- May be inaccurate for any specific situation

Users assume all responsibility for how they use predictions.

---

*Last Updated: January 2026*
*Version: 2.0*
