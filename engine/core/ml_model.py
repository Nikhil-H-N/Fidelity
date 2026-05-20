import os
from collections import Counter, defaultdict
from typing import Dict, List, Optional, Tuple

import joblib
import numpy as np
import pandas as pd
from sklearn.cluster import KMeans
from sklearn.ensemble import RandomForestClassifier
from sklearn.exceptions import NotFittedError


FEATURE_NAMES = [
    "session_duration",
    "total_clicks",
    "cta_clicks",
    "faq_count",
    "pricing_views",
    "calculator_usage",
    "revisit_count",
    "hesitation_score",
    "frustration_score",
    "navigation_depth",
    "scroll_completion",
    "form_progress",
    "interaction_density",
    "time_between_clicks",
    "conversion_distance",
]

VIEW_TYPES = {"page_visit", "pricing_view", "comparison_view", "category_exploration"}
CLICK_TYPES = {"click", "button_click", "cta_click", "rage_click"}
CONVERSION_EVENTS = {"form_completion", "checkout_complete", "conversion", "investment_intent"}
ABANDONMENT_EVENTS = {"form_abandonment", "checkout_abandon", "exit_near_conversion", "idle_timeout"}

NEXT_ACTION_LABELS = {
    "page_visit": ("page_view", "Continue browsing"),
    "pricing_view": ("product_view", "Open product details"),
    "comparison_view": ("compare_plans", "Compare plans"),
    "calculator_usage": ("open_calculator", "Open calculator"),
    "faq_open": ("request_advisor", "Ask for advisor help"),
    "cta_click": ("checkout_start", "Start application"),
    "button_click": ("checkout_start", "Start application"),
    "form_start": ("form_submit", "Complete form"),
    "form_progress": ("form_submit", "Complete form"),
    "form_abandonment": ("return_to_form", "Return to application form"),
    "idle_timeout": ("return_to_form", "Return to application form"),
}


def _safe_event_type(event: Dict) -> str:
    return str(event.get("event_type") or "")


class LearnedNextActionModel:
    """Small empirical sequence model trained from real session transitions."""

    def __init__(self):
        self.transition_counts: Dict[str, Counter] = defaultdict(Counter)
        self.global_counts: Counter = Counter()
        self.is_fitted = False

    @staticmethod
    def _state_key(events: List[Dict]) -> str:
        recent_types = [_safe_event_type(event) for event in events[-3:]]
        return ">".join(recent_types) if recent_types else "__start__"

    def fit(self, all_sessions: List[List[Dict]]):
        self.transition_counts = defaultdict(Counter)
        self.global_counts = Counter()

        for events in all_sessions:
            clean_events = [event for event in events if _safe_event_type(event)]
            for index in range(len(clean_events) - 1):
                history = clean_events[: index + 1]
                next_type = _safe_event_type(clean_events[index + 1])
                key = self._state_key(history)
                self.transition_counts[key][next_type] += 1
                self.global_counts[next_type] += 1

        self.is_fitted = bool(self.global_counts)

    def predict(self, session_events: List[Dict], conversion_probability: float = 0.0) -> Dict:
        if not self.is_fitted:
            return self._fallback(session_events, conversion_probability, reason="next_action_model_untrained")

        key = self._state_key(session_events)
        counts = self.transition_counts.get(key)
        reasons = [f"learned_transition:{key}"]

        if not counts:
            counts = self.global_counts
            reasons = ["learned_global_action_distribution"]

        total = sum(counts.values())
        if total <= 0:
            return self._fallback(session_events, conversion_probability, reason="no_transition_counts")

        ranked = counts.most_common(4)
        predicted_event, count = ranked[0]
        action, label = NEXT_ACTION_LABELS.get(
            predicted_event,
            (predicted_event or "page_view", (predicted_event or "page_view").replace("_", " ").title()),
        )
        alternatives = [
            NEXT_ACTION_LABELS.get(event_type, (event_type, event_type.replace("_", " ").title()))[0]
            for event_type, _ in ranked[1:]
        ]

        return {
            "action": action,
            "label": label,
            "probability": round(count / total, 4),
            "reasons": reasons,
            "alternatives": alternatives[:3] or ["compare_plans", "open_calculator"],
            "source": "learned_transition_model",
        }

    def _fallback(self, session_events: List[Dict], conversion_probability: float, reason: str) -> Dict:
        if not session_events:
            return {
                "action": "page_view",
                "label": "Continue browsing",
                "probability": 0.35,
                "reasons": [reason, "no_session_history"],
                "alternatives": ["compare_plans", "open_calculator"],
                "source": "heuristic_fallback",
            }

        recent_types = [_safe_event_type(event) for event in session_events[-8:]]
        last_type = recent_types[-1]

        if last_type in ABANDONMENT_EVENTS:
            action, label, probability = "return_to_form", "Return to application form", 0.65
        elif last_type in {"form_start", "form_progress"}:
            action, label, probability = "form_submit", "Complete form", max(0.5, conversion_probability)
        elif "calculator_usage" in recent_types or "pricing_view" in recent_types:
            action, label, probability = "checkout_start", "Start application", max(0.45, conversion_probability)
        elif "comparison_view" in recent_types:
            action, label, probability = "product_view", "Open product details", 0.42
        elif recent_types.count("faq_open") >= 2:
            action, label, probability = "request_advisor", "Ask for advisor help", 0.4
        else:
            action, label, probability = "page_view", "Continue browsing", 0.35

        return {
            "action": action,
            "label": label,
            "probability": round(min(0.95, probability), 4),
            "reasons": [reason],
            "alternatives": ["compare_plans", "open_calculator", "request_advisor"],
            "source": "heuristic_fallback",
        }


class GlobalIntentModel:
    def __init__(self, model_path: str = "engine/utils/global_intent.joblib"):
        self.model_path = model_path
        self.next_action_path = model_path.replace(".joblib", "_next_action.joblib")
        self.model = self._load_model()
        self.next_action_model = self._load_next_action_model()
        self._model_mtime = self._path_mtime(self.model_path)
        self._next_action_mtime = self._path_mtime(self.next_action_path)

    @staticmethod
    def _path_mtime(path: str) -> Optional[float]:
        return os.path.getmtime(path) if os.path.exists(path) else None

    def _load_model(self):
        if os.path.exists(self.model_path):
            loaded = joblib.load(self.model_path)
            if isinstance(loaded, dict):
                return loaded.get("model", RandomForestClassifier(n_estimators=200, random_state=42))
            return loaded
        return RandomForestClassifier(n_estimators=200, min_samples_leaf=2, class_weight="balanced", random_state=42)

    def _load_next_action_model(self) -> LearnedNextActionModel:
        if os.path.exists(self.next_action_path):
            loaded = joblib.load(self.next_action_path)
            if isinstance(loaded, LearnedNextActionModel):
                return loaded
        return LearnedNextActionModel()

    def reload_if_updated(self):
        model_mtime = self._path_mtime(self.model_path)
        next_action_mtime = self._path_mtime(self.next_action_path)

        if model_mtime and model_mtime != self._model_mtime:
            self.model = self._load_model()
            self._model_mtime = model_mtime

        if next_action_mtime and next_action_mtime != self._next_action_mtime:
            self.next_action_model = self._load_next_action_model()
            self._next_action_mtime = next_action_mtime

    def extract_features(self, session_events: List[Dict]) -> Dict:
        """Convert a user session into a stable numeric feature vector."""
        if not session_events:
            return {feature: 0 for feature in FEATURE_NAMES}

        events = sorted(session_events, key=lambda event: event.get("timestamp", 0))
        df = pd.DataFrame(events)

        duration = max(0.0, events[-1].get("timestamp", 0) - events[0].get("timestamp", 0))
        event_types = df.get("event_type", pd.Series(dtype=str)).fillna("")
        total_clicks = int(event_types.isin(CLICK_TYPES).sum())
        cta_clicks = int(event_types.isin({"cta_click"}).sum())
        faq_count = int((event_types == "faq_open").sum())
        pricing_views = int((event_types == "pricing_view").sum())
        calculator_usage = int((event_types == "calculator_usage").any())
        revisit_count = int(event_types.isin({"section_revisit", "repeat_page_visit", "return_session"}).sum())
        hesitation_score = int((event_types == "cta_hover").sum()) / (total_clicks + 1)
        frustration_score = int(event_types.isin({"rage_click", "dead_click", "repeated_validation_failure"}).sum()) / (len(events) + 1)
        navigation_depth = int(df["page_id"].nunique()) if "page_id" in df else 0
        scroll_completion = float(df["scroll_depth"].fillna(0).max()) if "scroll_depth" in df else 0.0

        form_progress = 0.0
        for event in events:
            metadata = event.get("metadata") if isinstance(event.get("metadata"), dict) else {}
            if event.get("event_type") == "form_progress":
                form_progress = max(form_progress, float(metadata.get("progress") or event.get("form_progress") or 0))
            if event.get("event_type") in CONVERSION_EVENTS:
                form_progress = max(form_progress, 100.0)

        interaction_density = len(events) / max(0.1, duration / 60.0)
        time_between_clicks = duration / max(1, total_clicks)

        conversion_distance = 0
        for index, event in enumerate(events):
            if event.get("event_type") == "form_start":
                conversion_distance = len(events) - index
                break

        return {
            "session_duration": duration,
            "total_clicks": total_clicks,
            "cta_clicks": cta_clicks,
            "faq_count": faq_count,
            "pricing_views": pricing_views,
            "calculator_usage": calculator_usage,
            "revisit_count": revisit_count,
            "hesitation_score": hesitation_score,
            "frustration_score": frustration_score,
            "navigation_depth": navigation_depth,
            "scroll_completion": scroll_completion,
            "form_progress": form_progress,
            "interaction_density": interaction_density,
            "time_between_clicks": time_between_clicks,
            "conversion_distance": conversion_distance,
        }

    def feature_vector(self, session_events: List[Dict]) -> np.ndarray:
        features = self.extract_features(session_events)
        return np.array([features[name] for name in FEATURE_NAMES], dtype=float)

    def _feature_matrix(self, all_sessions: List[List[Dict]]) -> np.ndarray:
        return np.vstack([self.feature_vector(session) for session in all_sessions])

    @staticmethod
    def infer_conversion_label(session_events: List[Dict]) -> int:
        """Derive a supervised label from real outcomes, not random sampling."""
        for event in session_events:
            event_type = event.get("event_type")
            metadata = event.get("metadata") if isinstance(event.get("metadata"), dict) else {}
            if event_type in CONVERSION_EVENTS:
                return 1
            if event_type == "form_progress" and float(metadata.get("progress") or 0) >= 90:
                return 1
            if event_type == "otp_request":
                return 1
        return 0

    def _rule_baseline_probability(self, features: Dict, session_events: List[Dict]) -> Tuple[float, List[str]]:
        """Transparent fallback only used while the classifier has no learned state."""
        probability = 0.08
        reasons = ["classifier_untrained"]
        if features["calculator_usage"]:
            probability += 0.18
            reasons.append("calculator_usage")
        if features["pricing_views"]:
            probability += 0.16
            reasons.append("pricing_view")
        if features["cta_clicks"] >= 2:
            probability += 0.14
            reasons.append("multiple_cta_clicks")
        if features["form_progress"] > 50:
            probability += 0.25
            reasons.append("form_progress")
        if any(event.get("event_type") in CONVERSION_EVENTS for event in session_events):
            probability = 0.98
            reasons.append("conversion_event_observed")
        if features["frustration_score"] > 0.2:
            probability *= 0.7
            reasons.append("friction_penalty")
        return round(min(0.99, max(0.01, probability)), 4), reasons

    def _predict_model_probability(self, vector: np.ndarray) -> Optional[float]:
        if not hasattr(self.model, "predict_proba"):
            return None
        try:
            probabilities = self.model.predict_proba(vector.reshape(1, -1))[0]
            classes = list(getattr(self.model, "classes_", []))
            if 1 in classes:
                return float(probabilities[classes.index(1)])
            return float(probabilities[-1])
        except (NotFittedError, AttributeError, ValueError):
            return None

    def _feature_importance(self) -> List[Tuple[str, float]]:
        importances = getattr(self.model, "feature_importances_", None)
        if importances is None:
            return []
        ranked = sorted(zip(FEATURE_NAMES, importances), key=lambda item: item[1], reverse=True)
        return [(name, round(float(weight), 4)) for name, weight in ranked[:5]]

    def predict_conversion_probability(self, session_events: List[Dict]) -> Dict:
        """Predict conversion probability with a trained classifier when available."""
        self.reload_if_updated()
        features = self.extract_features(session_events)
        vector = self.feature_vector(session_events)
        model_probability = self._predict_model_probability(vector)

        if model_probability is None:
            probability, reasons = self._rule_baseline_probability(features, session_events)
            source = "heuristic_fallback"
        else:
            probability = round(min(0.99, max(0.01, model_probability)), 4)
            source = "random_forest_classifier"
            reasons = ["model_predict_proba"]

        drop_off_prediction = "HIGH" if features["frustration_score"] > 0.3 or features["interaction_density"] < 1 else "LOW"
        re_engagement_need = "YES" if probability > 0.5 and any(
            event.get("event_type") in ABANDONMENT_EVENTS for event in session_events
        ) else "NO"
        churn_prediction = min(1.0, round((features["frustration_score"] * 0.75) + ((1 - probability) * 0.25), 4))
        next_action = self.next_action_model.predict(session_events, probability)

        top_features = self._feature_importance() or sorted(features.items(), key=lambda item: item[1], reverse=True)[:5]

        return {
            "conversion_probability": probability,
            "drop_off_prediction": drop_off_prediction,
            "re_engagement_need": re_engagement_need,
            "churn_prediction": churn_prediction,
            "next_action_prediction": next_action,
            "reasons": reasons,
            "top_features": top_features,
            "model_source": source,
            "feature_vector": features,
        }

    def predict_next_action(self, session_events: List[Dict], features: Dict = None, conversion_probability: float = 0.0) -> Dict:
        return self.next_action_model.predict(session_events, conversion_probability)

    def train_on_global_data(self, all_sessions: List[List[Dict]], labels: Optional[List[int]] = None) -> Dict:
        """Train conversion and next-action models on historical user sessions."""
        clean_sessions = [session for session in all_sessions if session]
        if not clean_sessions:
            return {"status": "skipped", "reason": "no_sessions"}

        X = self._feature_matrix(clean_sessions)
        y = np.array(labels if labels is not None else [self.infer_conversion_label(session) for session in clean_sessions])

        if len(y) != len(clean_sessions):
            raise ValueError("labels length must match sessions length")

        class_counts = Counter(y.tolist())
        if len(class_counts) < 2:
            return {
                "status": "skipped",
                "reason": "need_both_positive_and_negative_sessions",
                "class_counts": dict(class_counts),
            }

        self.model = RandomForestClassifier(n_estimators=250, min_samples_leaf=2, class_weight="balanced", random_state=42)
        self.model.fit(X, y)
        self.next_action_model.fit(clean_sessions)

        os.makedirs(os.path.dirname(self.model_path), exist_ok=True)
        joblib.dump(
            {
                "model": self.model,
                "feature_names": FEATURE_NAMES,
                "class_counts": dict(class_counts),
            },
            self.model_path,
        )
        joblib.dump(self.next_action_model, self.next_action_path)
        self._model_mtime = self._path_mtime(self.model_path)
        self._next_action_mtime = self._path_mtime(self.next_action_path)

        return {
            "status": "trained",
            "session_count": len(clean_sessions),
            "class_counts": dict(class_counts),
            "feature_names": FEATURE_NAMES,
            "next_action_transitions": sum(sum(counter.values()) for counter in self.next_action_model.transition_counts.values()),
        }


class GlobalSegmentationModel:
    """Uses unsupervised learning to cluster users into behavioral personas."""

    def __init__(self, n_clusters=4):
        self.kmeans = KMeans(n_clusters=n_clusters, n_init=10, random_state=42)
        self.is_fitted = False

    def fit_segments(self, all_sessions: List[List[Dict]]) -> Dict:
        clean_sessions = [session for session in all_sessions if session]
        if len(clean_sessions) < self.kmeans.n_clusters:
            return {"status": "skipped", "reason": "insufficient_sessions", "session_count": len(clean_sessions)}

        extractor = GlobalIntentModel()
        X = np.vstack([extractor.feature_vector(session) for session in clean_sessions])
        self.kmeans.fit(X)
        self.is_fitted = True
        return {"status": "trained", "session_count": len(clean_sessions), "clusters": self.kmeans.n_clusters}

    def get_persona(self, session_events: List[Dict]) -> str:
        extractor = GlobalIntentModel()
        features_dict = extractor.extract_features(session_events)
        features_vec = extractor.feature_vector(session_events).reshape(1, -1)

        if self.is_fitted:
            try:
                cluster = int(self.kmeans.predict(features_vec)[0])
                personas = {
                    0: "Conservative Researcher",
                    1: "Comparison Shopper",
                    2: "High-Velocity Scanner",
                    3: "Intentional Investor",
                }
                return personas.get(cluster, "Standard User")
            except Exception:
                pass

        if features_dict["calculator_usage"] > 0 and features_dict["pricing_views"] > 0:
            return "Intentional Investor"
        if features_dict["faq_count"] > 3:
            return "Conservative Researcher"
        if features_dict["interaction_density"] > 10:
            return "High-Velocity Scanner"
        if features_dict["navigation_depth"] > 4:
            return "Comparison Shopper"

        return "Passive Explorer"
