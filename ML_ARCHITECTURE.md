# ML & Behavioral Intelligence Architecture

This document explains the technical implementation of the Behavioral Intelligence Engine, specifically focusing on the ML-ready design and the deterministic logic used for real-time intent detection.

---

## 1. Multi-Layer Intelligence Pipeline

Our engine doesn't just "track clicks"; it rebuilds the user's psychological state through a 5-stage pipeline:

1.  **Validation & Normalization**: Filters out bot-like "rage bursts" and normalizes events from different frontend sources into a unified behavioral taxonomy.
2.  **Feature Extraction**: Converts raw events into behavioral features (e.g., dwell time, scroll depth, navigation loops, idle time).
3.  **Deterministic Scoring**: Applies weighted logic to calculate an "Intent Score" (0-100) based on page importance and action significance.
4.  **Pattern Detection**: Identifies complex sequences like "Hesitant Investor" (multiple hovers + comparison views - no conversion) or "Frustrated User" (rage clicks + backtracking).
5.  **ML Inference Layer**: Uses pre-trained models (XGBoost/Random Forest style) to predict conversion probability and drop-off risk.

---

## 2. Key ML Features (Feature Vector)

When the engine prepares data for the ML model, it transforms a session into the following feature vector:

| Feature | Description | Importance |
| :--- | :--- | :--- |
| `session_duration` | Total time spent in the session. | Medium |
| `total_score` | Cumulative intent score from the rule engine. | High |
| `event_density` | Number of interactions per minute. | High (detects engagement) |
| `page_entropy` | Variety of pages visited (detects research vs. focused intent). | Medium |
| `scroll_avg` | Average scroll depth across all visited pages. | Medium |
| `hesitation_score` | Frequency of hovers and long pauses before CTAs. | Very High |
| `frustration_index` | Count of rage clicks, dead clicks, and validation failures. | High |
| `revisit_ratio` | Percentage of pages visited more than once. | High (indicates consideration) |

---

## 3. Behavioral Personas (Clustering)

The engine uses a segmentation model to classify users into one of several personas:

*   **PASSIVE_BROWSER**: Low engagement, short session, no deep navigation.
*   **RESEARCH_USER**: High dwell time on FAQ and product pages, frequent comparisons.
*   **HIGH_INTENT_INVESTOR**: Fast movement towards conversion pages, high interaction with calculators.
*   **HESITANT_PROSPECT**: High interest (views pricing/SIP) but high "dwell-before-click" metrics.
*   **FRUSTRATED_USER**: High rage-click detection and circular navigation loops.

---

## 4. Explainable AI (XAI)

Unlike "black-box" models, every prediction in our system is accompanied by **Reasoning Hooks**. 

**Example Output:**
```json
{
  "state": "HIGH_INTENT",
  "probability": 0.89,
  "reasoning": [
    "High dwell time on SIP_PLANS (120s)",
    "Calculator used 2 times",
    "Return visit detected within 24 hours"
  ]
}
```
This ensures the system is audit-friendly and trustworthy for financial institutions.

---

## 5. Future ML Roadmap

*   **Real-time Calibration**: Using reinforcement learning to adjust page weights based on actual conversion outcomes.
*   **Propensity Scoring**: Predicting the exact dollar value of a lead based on behavioral patterns.
*   **Lookalike Modeling**: Identifying "Passive Browsers" who behave exactly like previous "High Intent" users before they convert.
