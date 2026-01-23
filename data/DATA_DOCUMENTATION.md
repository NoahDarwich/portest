# Pro-Test Data Documentation

## Overview

This document describes the data used to train and evaluate the Pro-Test prediction models.

## Data Sources

### Primary Dataset

**File**: `full_df.csv`
**Description**: Combined protest event dataset covering Iraq, Lebanon, and Egypt

### Original Source Data (v1.0)

The original v1.0 model was trained on three separate datasets:

| Country | Original File | Status |
|---------|--------------|--------|
| Lebanon | `Leb_1_drop_non_impact_params.csv` | Missing - needs recovery |
| Iraq | `iraq_1_drop_non_impact_params.csv` | Missing - needs recovery |
| Egypt | `egypt_1_drop_non_impact_params.csv` | Missing - needs recovery |

**Note**: Raw data files were removed from git history. Recovery or recreation needed for full reproducibility.

## Dataset Schema

### Input Features (used for prediction)

| Column | Description | Type | Example Values |
|--------|-------------|------|----------------|
| `country` | Country where protest occurred | Categorical | Iraq, Lebanon, Egypt |
| `governorate` | Region/governorate within country | Categorical | Baghdad, Beirut, Cairo |
| `locationtypeend` | Type of location | Categorical | Urban, Rural, Mixed |
| `demandtypeone` | Primary demand of protesters | Categorical | Political, Economic, Social |
| `tacticprimary` | Primary protest tactic used | Categorical | March, Rally, Strike |
| `violence` | Level of protester violence | Categorical | None, Low, Medium, High |
| `combined_sizes` | Estimated number of participants | Numeric | 10, 100, 1000, 10000+ |

### Target Variables (prediction outputs)

| Column | Description | Type |
|--------|-------------|------|
| Target 0 | No known coercion | Binary (0/1) |
| Target 1 | Arrests and detentions | Binary (0/1) |
| Target 2 | Physical harassment | Binary (0/1) |
| Target 3 | Injuries inflicted | Binary (0/1) |
| Target 4 | Deaths inflicted | Binary (0/1) |
| Target 5 | Security forces presence | Binary (0/1) |
| Target 6 | Party/Militias presence | Binary (0/1) |

### Additional Repression Methods (in dataset)

- Teargas usage
- Rubber bullets
- Live ammunition
- Physical strikes (sticks/batons)
- Protest surrounded
- Area cleared

## Data Collection Methodology

### Time Period
- Primary coverage: 2019 onwards
- Includes major protest movements in each country

### Collection Process
1. Events sourced from news reports and academic databases
2. Coded by researchers for standardized variables
3. Quality control and validation applied

### Known Limitations

1. **Reporting Bias**: Events with more media coverage are more likely to be captured
2. **Geographic Bias**: Urban areas may be over-represented
3. **Outcome Bias**: Larger/violent events may be over-reported
4. **Temporal Gaps**: Coverage may vary by time period

## Data Quality Notes

### Missing Values
- Size estimates may be missing or imputed
- Some categorical fields may have "Unknown" values
- The preprocessing pipeline handles missing values via imputation

### Data Preprocessing

The `pipeline` file contains the preprocessing steps:
1. Missing value imputation for numeric fields (mean strategy)
2. One-hot encoding for categorical features
3. Ordinal encoding for target variables

## Usage Guidelines

### For Training
```python
import pandas as pd
df = pd.read_csv('data/full_df.csv')
# Apply preprocessing pipeline before training
```

### For Inference
Input data must match the schema above. The API handles preprocessing automatically.

## Data Updates

### Adding New Data
1. Ensure new data follows the same schema
2. Validate data quality before merging
3. Document any changes to coding methodology
4. Retrain models and update version numbers

### Versioning
- Data versions should be tracked using DVC (Data Version Control)
- Each model version should reference specific data version

## Contact

For questions about data collection or methodology:
- Project Maintainer: Noah Darwich
- Repository: https://github.com/NoahDarwich/pro-test

---

*Last updated: January 2026*
