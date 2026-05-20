from typing import List, Dict
import time

class BehavioralMetrics:
    @staticmethod
    def calculate_session_quality(events: List[Dict]) -> str:
        """Section 103: Meaningful interactions / Total interactions."""
        if not events: return "LOW"
        
        meaningful_types = [
            'cta_click', 'pricing_view', 'calculator_usage', 'faq_open', 
            'form_start', 'otp_request', 'plan_selection', 'comparison_view'
        ]
        meaningful_count = sum(1 for e in events if e['event_type'] in meaningful_types)
        quality_ratio = meaningful_count / len(events)
        
        if quality_ratio > 0.4: return "HIGH"
        if quality_ratio > 0.15: return "MEDIUM"
        return "LOW"

    @staticmethod
    def calculate_volatility(events: List[Dict]) -> str:
        """Section 104: Stable vs Volatile behavior."""
        if len(events) < 5: return "STABLE"
        
        # Analyze page transition logic
        view_types = ['page_visit', 'pricing_view', 'category_exploration', 'comparison_view']
        views = [e['page_id'] for e in events if e['event_type'] in view_types]
        
        if not views: return "STABLE"
        
        # Check for random jumping vs logical progression
        unique_pages = len(set(views))
        revisits = len(views) - unique_pages
        
        # High revisits + low dwell time = Volatile
        avg_dwell = sum([e.get('dwell_time', 0) for e in events]) / len(events)
        
        if revisits > 5 and avg_dwell < 5:
            return "VOLATILE"
        if revisits > 2:
            return "UNSTABLE"
        return "STABLE"

    @staticmethod
    def filter_false_positives(events: List[Dict]) -> List[Dict]:
        """Section 34, 75: Noise removal and idle tab handling."""
        filtered = []
        for e in events:
            # Idle tab handling: If dwell_time > 3 mins without interaction (Section 75)
            if e.get('dwell_time', 0) > 180 and e.get('idle_time', 0) > 150:
                # Mark as low signal or skip
                continue
                
            filtered.append(e)
        return filtered
