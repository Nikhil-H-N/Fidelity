from typing import List, Dict
import time

class PsychologyEngine:
    @staticmethod
    def analyze_sequence(events: List[Dict]) -> List[str]:
        """Section 96: Detect specific journey sequences."""
        sequences = []
        etypes = [e['event_type'] for e in events]
        
        # Sequence A: Awareness -> Research -> Trust -> Decision
        # (page_visit -> faq/calculator -> security/about -> pricing/cta)
        has_awareness = 'page_visit' in etypes
        has_research = 'faq_open' in etypes or 'calculator_usage' in etypes or 'comparison_view' in etypes
        has_trust = 'security_page_view' in etypes or any(e['page_id'] == 'about_company' for e in events)
        has_decision = 'pricing_view' in etypes or 'cta_click' in etypes
        
        if has_awareness and has_research and has_trust and has_decision:
            sequences.append("LOGICAL_CONVERSION_PATH")
            
        # Example B: Seriousness
        if etypes.count('calculator_usage') >= 1 and etypes.count('pricing_view') >= 1 and etypes.count('cta_click') >= 1:
            sequences.append("SERIOUS_PROSPECT_PATH")
            
        return sequences

    @staticmethod
    def infer_emotional_tendencies(events: List[Dict], patterns: List[str], temporal: Dict) -> List[str]:
        """Section 101: Emotional State Approximation."""
        tendencies = []
        if "FRUSTRATED_USER" in patterns or temporal['click_velocity'] == "VOLATILE_FAST":
            tendencies.append("FRUSTRATED")
        if "HESITANT_INVESTOR" in patterns or temporal['hesitation_pause_detected']:
            tendencies.append("HESITANT")
        if "RESEARCH_USER" in patterns or temporal['reading_depth'] == "RESEARCH":
            tendencies.append("RESEARCH_ORIENTED")
        if any(e['event_type'] == 'security_page_view' for e in events):
            tendencies.append("TRUST_SEEKING")
        if "CONFUSED_USER" in patterns:
            tendencies.append("CONFUSED")
            
        return tendencies

    @staticmethod
    def detect_decision_friction(events: List[Dict], tendencies: List[str]) -> List[str]:
        """Section 100: What is stopping conversion?"""
        frictions = []
        if "CONFUSED" in tendencies: frictions.append("COMPLEXITY_FRICTION")
        if "FRUSTRATED" in tendencies: frictions.append("TECHNICAL_FRICTION")
        if "HESITANT" in tendencies and "TRUST_SEEKING" in tendencies: frictions.append("TRUST_BARRIER")
        
        # Cost Concern: pricing -> back -> pricing -> faq
        etypes = [e['event_type'] for e in events]
        if etypes.count('pricing_view') >= 2 and 'faq_open' in etypes:
            frictions.append("COST_CONCERN")
            
        return frictions
