from .session_manager import SessionState
from .scorer import BehaviorScorer, POSITIVE_SIGNALS
from .detectors import BehavioralDetectors
from .ml_model import GlobalIntentModel, GlobalSegmentationModel
from .temporal import TemporalEngine
from .pipeline import EventPrioritySystem, ContextEnricher
from .metrics import BehavioralMetrics
from .psychology import PsychologyEngine
from typing import List, Dict

class DecisionBrain:
    def __init__(self, config):
        self.config = config
        self.scorer = BehaviorScorer(config)
        self.detectors = BehavioralDetectors()
        self.global_intent_model = GlobalIntentModel()
        self.segmentation_model = GlobalSegmentationModel()

    def process_new_event(self, session: SessionState, current_event: Dict) -> Dict:
        """The 'Cinematic' Decision Engine - returns enriched intelligence."""
        # 0. Noise Removal (Section 34, 35, 75)
        # Use filtered copy for scoring/detection but keep all events on session
        filtered_events = BehavioralMetrics.filter_false_positives(session.events)

        # 0. Context Enrichment (Section 44)
        current_event = ContextEnricher.enrich(current_event, session.events)
        
        # 1. Update Score using CLAUDE.md Formula
        session.total_score = self.scorer.calculate_intent_score(session.events)
        
        # 2. Sequential Pattern Detection
        patterns = []
        if self.detectors.detect_hesitation(session.events, current_event['page_id']):
            patterns.append("HESITANT_INVESTOR")
        if self.detectors.detect_product_comparison(session.events):
            patterns.append("RESEARCH_USER")
        if self.detectors.detect_rage_clicks(session.events):
            patterns.append("FRUSTRATED_USER")
        if self.detectors.detect_circular_navigation(session.events):
            patterns.append("CONFUSED_USER")
        if self.detectors.detect_backtracking(session.events):
            patterns.append("CONFUSED_USER")
        if self.detectors.detect_navigation_velocity(session.events):
            patterns.append("FAST_SCANNER")
        if self.detectors.detect_window_shopper(session.events):
            patterns.append("WINDOW_SHOPPER")
        if self.detectors.detect_return_intent(session.events):
            patterns.append("RETURN_INTENT")
        if self.detectors.detect_onboarding_friction(session.events):
            patterns.append("ONBOARDING_FRICTION")
        if self.detectors.detect_idle_reading(session.events, current_event['page_id']):
            patterns.append("DEEP_READING")
        if self.detectors.detect_decision_paralysis(session.events):
            patterns.append("DECISION_PARALYSIS")
        if self.detectors.detect_urgent_investor(session.events):
            patterns.append("URGENT_INVESTOR")
        if self.detectors.detect_confused_prospect(session.events):
            patterns.append("CONFUSED_PROSPECT")
        if self.detectors.detect_almost_converted(session.events):
            patterns.append("ALMOST_CONVERTED")
        if self.detectors.detect_oscillating_scroll(session.events):
            patterns.append("OSCILLATING_SCROLL")
        if self.detectors.detect_density_drop(session.events):
            patterns.append("DENSITY_DROP")
            
        # 3. Dynamic State Classification (Section 9, 73)
        s = session.total_score
        states = []
        # Base intent states (configurable thresholds)
        t = self.config.score_thresholds
        if s < t.get("passive", 10): states.append("PASSIVE_BROWSER")
        elif s < t.get("curious", 25): states.append("CURIOUS_EXPLORER")
        elif s < t.get("research", 45): states.append("RESEARCH_ORIENTED_USER")
        elif s < t.get("interested", 65): states.append("INTERESTED_USER")
        elif s < t.get("high_intent", 80): states.append("HIGH_INTENT_USER")
        else:
            has_conversion_intent = any(e['event_type'] in ['form_start', 'otp_request', 'plan_selection'] for e in session.events)
            if has_conversion_intent or s >= t.get("nearly_converted", 90):
                states.append("NEARLY_CONVERTED_USER")
            else:
                states.append("HIGH_INTENT_USER")

        # Additional states from Section 9
        if any(e['event_type'] == 'calculator_usage' for e in session.events) and any(e['event_type'] == 'return_session' for e in session.events):
            states.append("SERIOUS_INVESTOR")
        if "FRUSTRATED_USER" in patterns or "ONBOARDING_FRICTION" in patterns: states.append("FRUSTRATED")
        if "HESITANT_INVESTOR" in patterns: states.append("HESITANT")
        if "CONFUSED_USER" in patterns or "CONFUSED_PROSPECT" in patterns or "OSCILLATING_SCROLL" in patterns: 
            states.append("CONFUSED")
        if "FAST_SCANNER" in patterns:
            states.append("PASSIVE_BROWSER")
        if "RETURN_INTENT" in patterns:
            states.append("RETURNING_RESEARCHER")
        if "DEEP_READING" in patterns:
            states.append("ENGAGED_READER")
        
        if "ALMOST_CONVERTED" in patterns:
            states.append("NEARLY_CONVERTED_USER")
            
        session.intent_state = states[0] # Primary state
        session.metadata['last_patterns'] = patterns
        session.metadata['last_states'] = list(set(states))

        # 4. Temporal Analysis (Section 45)
        temporal_intelligence = TemporalEngine.analyze_timing(session.events)
        if temporal_intelligence['click_velocity'] == "VOLATILE_FAST":
            states.append("FRUSTRATED")
        if temporal_intelligence['hesitation_pause_detected'] or temporal_intelligence['hover_tendency'] == "REPEATED_HESITATION":
            states.append("HESITANT")
        if temporal_intelligence['scroll_velocity'] == "FAST_SCANNING":
            states.append("PASSIVE_BROWSER") # Just scanning, not deep

        if temporal_intelligence['night_browsing']:
            states.append("NIGHT_BROWSER")
        if temporal_intelligence['weekend_browsing']:
            states.append("WEEKEND_ENGAGEMENT")

        # 5. Financial User Personas (Section 95)
        personas = self.infer_personas(session.events, patterns)
        clustered_persona = self.segmentation_model.get_persona(session.events)
        if clustered_persona:
            personas.append(clustered_persona.upper().replace(" ", "_"))
        personas = list(dict.fromkeys(personas))
        
        # 6. Risk Engine (Section 4.5, 26, 79)
        dropoff_risk = self.calculate_dropoff_risk(session.events, patterns)
        frustration_risk = "HIGH" if "FRUSTRATED" in states else "MEDIUM" if "rage_click" in [e['event_type'] for e in session.events] else "LOW"
        trust_risk = self.calculate_trust_risk(session.events, patterns)
        confusion_risk = self.calculate_confusion_risk(session.events, patterns)

        # 7. Advanced Metrics (Section 103, 104)
        session_quality = BehavioralMetrics.calculate_session_quality(session.events)
        volatility = BehavioralMetrics.calculate_volatility(session.events)

        # 8. Psychology Engine (Section 96, 100, 101)
        sequences = PsychologyEngine.analyze_sequence(session.events)
        emotional_tendencies = PsychologyEngine.infer_emotional_tendencies(session.events, patterns, temporal_intelligence)
        decision_friction = PsychologyEngine.detect_decision_friction(session.events, emotional_tendencies)

        # 9. Confidence Score (Section 107)
        # Apply Section 97: Sequence Confidence Boosting
        confidence = self.calculate_confidence(session.events, patterns, volatility, sequences)

        # 10. Narrative / Story Engine
        narrative = self.generate_narrative(session.events, states, personas, temporal_intelligence, patterns)
        session.metadata['last_narrative'] = narrative

        # 10. Recommendation Engine
        recommendation = self.generate_recommendation(states, patterns, personas)
        session.metadata['last_recommendations'] = recommendation

        # 11. Reasoning (Section 38, 58, 69)
        reasoning = self.generate_reasoning(session.events)

        # 12. Priority (Section 72, 80)
        priority = self.calculate_priority(session.total_score, dropoff_risk, states)

        # 10. ML Integration (Section 61-70)
        conversion_data = self.global_intent_model.predict_conversion_probability(session.events)
        session.metadata['conversion_probability'] = conversion_data['conversion_probability']
        session.metadata['next_action_prediction'] = conversion_data['next_action_prediction']
        
        # Persist Features for future training (Section 64)
        session.metadata['last_feature_vector'] = self.global_intent_model.extract_features(session.events)

        return {
            "user_id": session.user_id,
            "behavior_state": list(set(states)), # Section 80 key
            "personas": personas,
            "intent_score": int(session.total_score), # Section 80 key
            "confidence": confidence,
            "conversion_probability": conversion_data['conversion_probability'], # Section 80 key
            "momentum": self.scorer.calculate_momentum(session.events), # Section 80 key
            "dropoff_risk": dropoff_risk, # Section 80 key
            "frustration": frustration_risk, # Section 80 key (mapped from risk)
            "hesitation": "HIGH" if "HESITANT" in states else "MEDIUM" if temporal_intelligence['hesitation_pause_detected'] else "LOW", # Section 80 key
            "patterns": patterns,
            "session_quality": session_quality,
            "volatility": volatility,
            "emotional_tendencies": emotional_tendencies,
            "decision_friction": decision_friction,
            "journey_sequences": sequences,
            "trust_risk": trust_risk,
            "confusion_risk": confusion_risk,
            "trust_level": self.scorer.calculate_trust_score(session.events),
            "reasoning": reasoning,
            "priority": priority,
            "recommendation": recommendation,
            "narrative": narrative,
            "ml_intelligence": {
                "drop_off_prediction": conversion_data['drop_off_prediction'],
                "re_engagement_need": conversion_data['re_engagement_need'],
                "churn_prediction": conversion_data['churn_prediction'],
                "next_action_prediction": conversion_data['next_action_prediction'],
                "prediction_reasons": conversion_data['reasons'],
                "feature_importance": conversion_data['top_features']
            },
            "temporal_metrics": temporal_intelligence,
            "event_priority": EventPrioritySystem.get_priority(current_event['event_type'])
        }

    def calculate_trust_risk(self, events: List[Dict], patterns: List[str]) -> str:
        """Section 79, 99."""
        risk = 0
        if any(e['event_type'] == 'pricing_exit' for e in events): risk += 2
        if any(e['event_type'] == 'quick_exit' for e in events): risk += 1
        if "HESITANT_INVESTOR" in patterns: risk += 1
        
        if risk >= 3: return "HIGH"
        if risk >= 1: return "MEDIUM"
        return "LOW"

    def calculate_confusion_risk(self, events: List[Dict], patterns: List[str]) -> str:
        """Section 24, 79."""
        risk = 0
        if "OSCILLATING_SCROLL" in patterns: risk += 2
        if "CONFUSED_PROSPECT" in patterns: risk += 2
        if "CONFUSED_USER" in patterns: risk += 1
        
        if risk >= 3: return "HIGH"
        if risk >= 1: return "MEDIUM"
        return "LOW"

    def generate_reasoning(self, events: List[Dict]) -> List[str]:
        """Section 38, 69."""
        top_signals = sorted(
            list(set([e['event_type'] for e in events if e['event_type'] in POSITIVE_SIGNALS])),
            key=lambda x: POSITIVE_SIGNALS.get(x, 0),
            reverse=True
        )
        return top_signals[:4]

    def calculate_priority(self, score: float, risk: str, states: List[str]) -> str:
        """Section 72, 80."""
        if "NEARLY_CONVERTED_USER" in states or risk == "CRITICAL": return "CRITICAL"
        if score > 70 or risk == "HIGH": return "HIGH"
        if score > 40: return "MEDIUM"
        return "LOW"

    def infer_personas(self, events: List[Dict], patterns: List[str]) -> List[str]:
        """Infers financial user personas based on behavior (Section 95)."""
        personas = []
        
        # Conservative Investor: FAQ heavy, slow movement, trust research
        faq_count = sum(1 for e in events if e['event_type'] == 'faq_open')
        comparison_count = sum(1 for e in events if e['event_type'] == 'comparison_view')
        if faq_count >= 4 or (comparison_count >= 2 and len(events) > 15):
            personas.append("CONSERVATIVE_INVESTOR")
            
        # Aggressive Investor: Fast progression, pricing focus
        if "URGENT_INVESTOR" in patterns:
            personas.append("AGGRESSIVE_INVESTOR")
            
        # Beginner Investor: FAQ heavy, help seeking, navigation loops
        if faq_count >= 3 and ("CONFUSED_USER" in patterns or "CONFUSED_PROSPECT" in patterns):
            personas.append("BEGINNER_INVESTOR")
            
        # High Value Prospect: Multiple sessions, deep exploration
        if any(e['event_type'] == 'return_session' for e in events) and any(e['event_type'] == 'calculator_usage' for e in events):
            personas.append("HIGH_VALUE_PROSPECT")
            
        # Trust Seeking User: visits trust pages, security page
        if any(e['event_type'] == 'security_page_view' for e in events) or any(e['page_id'] == 'about_company' for e in events):
            personas.append("TRUST_SEEKING_USER")
            
        # Overthinker: Decision paralysis
        if "DECISION_PARALYSIS" in patterns:
            personas.append("OVERTHINKER")
            
        # Last Minute Exiter
        if "ALMOST_CONVERTED" in patterns:
            personas.append("LAST_MINUTE_EXITER")
            
        return personas

    def calculate_dropoff_risk(self, events: List[Dict], patterns: List[str]) -> str:
        """Section 4.5, 26, 79."""
        risk_score = 0
        if any(e['event_type'] == 'idle_timeout' for e in events): risk_score += 3
        if any(e['event_type'] == 'form_abandonment' for e in events): risk_score += 4
        if any(e['event_type'] == 'exit_near_conversion' for e in events): risk_score += 4
        if any(e['event_type'] == 'quick_exit' for e in events): risk_score += 2
        if "DECISION_PARALYSIS" in patterns: risk_score += 2
        if "FRUSTRATED_USER" in patterns: risk_score += 2
        if "ONBOARDING_FRICTION" in patterns: risk_score += 3
        if "ALMOST_CONVERTED" in patterns: risk_score += 3
        if "DENSITY_DROP" in patterns: risk_score += 2
        
        if risk_score >= 6: return "CRITICAL"
        if risk_score >= 4: return "HIGH"
        if risk_score >= 2: return "MEDIUM"
        return "LOW"

    def generate_narrative(self, events: List[Dict], states: List[str], personas: List[str], temporal: Dict, patterns: List[str]) -> str:
        """Section 36, 58, 98: Generates a human-readable story of the user journey."""
        if not events: return "User just landed."
        
        pages = [e['page_id'] for e in events if e['event_type'] in ['page_visit', 'pricing_view', 'comparison_view']]
        duration = int(events[-1]['timestamp'] - events[0]['timestamp'])
        
        story_steps = []
        if any(e['event_type'] == 'page_visit' for e in events):
            first_page = next(e['page_id'] for e in events if e['event_type'] == 'page_visit')
            story_steps.append(f"entered via {first_page}")
        if any(e['event_type'] == 'calculator_usage' for e in events): story_steps.append("used the calculator")
        if any(e['event_type'] == 'pricing_view' for e in events): story_steps.append("viewed pricing")
        if any(e['event_type'] == 'faq_open' for e in events): story_steps.append("checked FAQs")
        if any(e['event_type'] == 'form_start' for e in events): story_steps.append("started the form")
            
        story = f"The user {', then '.join(story_steps)} over {duration}s. "
        
        if personas: story += f"Behavior aligns with a {', '.join(personas)} profile. "
            
        if "NEARLY_CONVERTED_USER" in states: story += "They are a Nearly Converted User who stalled at the end. "
        elif "HIGH_INTENT_USER" in states: story += "They show High Intent with focused exploration. "
        elif "RESEARCH_ORIENTED_USER" in states: story += "They are in a Deep Research phase. "
        else: story += "They are in the early Exploration phase. "
            
        if "HESITANT" in states: story += "Significant hesitation detected. "
        if "FRUSTRATED" in states: story += "Visible frustration detected. "
        if "OSCILLATING_SCROLL" in patterns: story += "Back-and-forth scrolling suggests confusion. "
        if temporal.get('scroll_velocity') == "FAST_SCANNING": story += "Scanning content quickly. "
            
        return story

    def calculate_confidence(self, events: List[Dict], patterns: List[str], volatility: str, sequences: List[str]) -> float:
        """Matching signals / Possible signals (Section 33, 54, 104, 107)."""
        possible_signals = {
            "patterns": 14,
            "event_diversity": 10,
            "sequences": 4,
            "volume": 1,
        }
        pattern_score = min(1.0, len(set(patterns)) / possible_signals["patterns"])
        diversity_score = min(1.0, len(set([e['event_type'] for e in events])) / possible_signals["event_diversity"])
        sequence_score = min(1.0, len(set(sequences)) / possible_signals["sequences"])
        volume_score = min(1.0, len(events) / 12)
        conf = (
            pattern_score * 0.35
            + diversity_score * 0.30
            + sequence_score * 0.20
            + volume_score * 0.15
        )
        
        # Section 97: Sequential Confidence Boosting
        if "LOGICAL_CONVERSION_PATH" in sequences:
            conf *= 1.3
        elif "SERIOUS_PROSPECT_PATH" in sequences:
            conf *= 1.2
            
        if volatility == "VOLATILE": conf *= 0.7
        elif volatility == "UNSTABLE": conf *= 0.85
        
        return min(0.98, conf)

    def generate_recommendation(self, states: List[str], patterns: List[str], personas: List[str]) -> List[str]:
        """Section 37, 71, 106."""
        recommendations = []
        if "NEARLY_CONVERTED_USER" in states or "ALMOST_CONVERTED" in patterns:
            recommendations.extend(["priority_recovery", "otp_reminder"])
        if "FRUSTRATED" in states:
            recommendations.extend(["ux_assistance", "support_chat"])
        if "HESITANT" in states:
            recommendations.extend(["trust_building_content", "client_testimonials"])
        if "RESEARCH_ORIENTED_USER" in states:
            recommendations.append("educational_comparison_guide")
        if "ONBOARDING_FRICTION" in patterns:
            recommendations.append("form_assistance")
        if "RETURN_INTENT" in patterns:
            recommendations.append("resume_last_product")
        
        if "CONSERVATIVE_INVESTOR" in personas:
            recommendations.append("risk_assessment_guide")
        if "BEGINNER_INVESTOR" in personas:
            recommendations.append("simplified_sip_guide")
            
        if not recommendations:
            recommendations.append("brand_awareness")
            
        return list(set(recommendations))
