import os
import tempfile
import unittest

from engine.core.ml_model import GlobalIntentModel
from engine.core.pipeline import EventNormalizer


def event(event_type, page_id="landing", offset=0, **extra):
    payload = {
        "user_id": "test_user",
        "event_type": event_type,
        "page_id": page_id,
        "timestamp": 1_700_000_000 + offset,
        "metadata": {},
    }
    payload.update(extra)
    return EventNormalizer.normalize(payload)


class GlobalIntentModelTests(unittest.TestCase):
    def test_generic_click_is_not_promoted_to_cta_click(self):
        normalized = event("click", element_id="hero")
        self.assertEqual(normalized["event_type"], "button_click")

        cta = event("cta_pressed", element_id="apply")
        self.assertEqual(cta["event_type"], "cta_click")

    def test_training_uses_classifier_predict_proba(self):
        with tempfile.TemporaryDirectory() as temp_dir:
            model_path = os.path.join(temp_dir, "global_intent.joblib")
            model = GlobalIntentModel(model_path=model_path)

            negative_sessions = [
                [
                    event("page_view", "landing", 0),
                    event("scroll_depth", "landing", 8, scroll_depth=20),
                    event("button_click", "landing", 12),
                ],
                [
                    event("page_view", "faq", 0),
                    event("opened_faq", "faq", 20),
                    event("inactive_session", "faq", 60),
                ],
                [
                    event("page_view", "about", 0),
                    event("time_spent", "about", 65, dwell_time=65),
                ],
            ]
            positive_sessions = [
                [
                    event("page_view", "investment_plans", 0),
                    event("price_check", "investment_plans", 10),
                    event("calculator_usage", "investment_calculator", 20),
                    event("cta_pressed", "investment_plans", 30),
                    event("form_initiated", "application_form", 40),
                    event("progress", "application_form", 50, metadata={"progress": 95}),
                ],
                [
                    event("page_view", "sip_plans", 0),
                    event("price_check", "sip_plans", 8),
                    event("cta_pressed", "sip_plans", 14),
                    event("checkout_complete", "application_form", 80),
                ],
                [
                    event("return_visit", "mutual_funds", 0),
                    event("calculator_usage", "investment_calculator", 10),
                    event("form_initiated", "application_form", 20),
                    event("form_submit", "application_form", 55),
                ],
            ]

            result = model.train_on_global_data(negative_sessions + positive_sessions)
            self.assertEqual(result["status"], "trained")
            self.assertTrue(os.path.exists(model_path))

            prediction = model.predict_conversion_probability(positive_sessions[0])
            self.assertEqual(prediction["model_source"], "random_forest_classifier")
            self.assertIn("model_predict_proba", prediction["reasons"])
            self.assertGreater(prediction["conversion_probability"], 0)
            self.assertIn("source", prediction["next_action_prediction"])

    def test_training_skips_when_outcome_labels_have_one_class(self):
        with tempfile.TemporaryDirectory() as temp_dir:
            model = GlobalIntentModel(model_path=os.path.join(temp_dir, "global_intent.joblib"))
            result = model.train_on_global_data([[event("page_view", "landing", 0)]])
            self.assertEqual(result["status"], "skipped")
            self.assertEqual(result["reason"], "need_both_positive_and_negative_sessions")


if __name__ == "__main__":
    unittest.main()
