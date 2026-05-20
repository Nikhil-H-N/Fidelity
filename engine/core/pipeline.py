from typing import Dict, List, Optional
import time

class EventValidator:
    """Section 41: Prevent noisy data and bot-like spam."""
    @staticmethod
    def is_valid(event: Dict, session_events: List[Dict]) -> bool:
        # Reject corrupted payloads (simplified)
        if not event.get('event_type') or not event.get('page_id'):
            return False
            
        # Reject impossible timestamps
        if event.get('timestamp', 0) > time.time() + 60:
            return False

        # Duplicate event bursts (Section 41)
        if session_events:
            last_event = session_events[-1]
            if (event['event_type'] == last_event['event_type'] and 
                event['page_id'] == last_event['page_id'] and 
                event.get('element_id') == last_event.get('element_id') and
                event['timestamp'] - last_event['timestamp'] < 0.1): # 100ms
                return False

        # Bot-like spam (Section 41, 35)
        # 50 clicks in 1 second
        recent_clicks = [e for e in session_events if e['event_type'] == 'click' and event['timestamp'] - e['timestamp'] < 1.0]
        if len(recent_clicks) > 50:
            return False

        return True

class EventNormalizer:
    """Section 42: Consistent intelligence across different frontends."""
    TAXONOMY_MAP = {
        "button_click": "button_click",
        "click": "button_click",
        "cta_pressed": "cta_click",
        "cta_click": "cta_click",
        "page_view": "page_visit",
        "view": "page_visit",
        "visit": "page_visit",
        "scroll_depth": "scroll_completion",
        "opened_faq": "faq_open",
        "faq_click": "faq_open",
        "price_check": "pricing_view",
        "form_initiated": "form_start",
        "progress": "form_progress",
        "form_submit": "form_completion",
        "form_complete": "form_completion",
        "form_abandon": "form_abandonment",
        "checkout_start": "form_start",
        "checkout_complete": "form_completion",
        "checkout_abandon": "form_abandonment",
        "comparison": "comparison_view",
        "product_view": "pricing_view",
        "download_brochure": "pricing_view",
        "contact_advisor": "advisor_request",
        "calculator_usage": "calculator_usage",
        "chatbot_message": "faq_open",
        "return_visit": "return_session",
        "repeated_page_visit": "repeat_page_visit",
        "rapid_click": "rage_click",
        "inactive_session": "idle_timeout",
        "mouse_activity": "mouse_movement",
        "field_focus": "form_start",
    }

    @staticmethod
    def normalize(event: Dict) -> Dict:
        etype = event.get('event_type', '').lower()
        event['raw_event_type'] = event.get('raw_event_type') or etype
        if not isinstance(event.get('metadata'), dict):
            event['metadata'] = {}
        event['metadata']['raw_event_type'] = event['raw_event_type']

        # Dynamic mapping for time_spent → dwell time signals
        if etype == 'time_spent':
            duration = event.get('dwell_time') or event.get('metadata', {}).get('duration') or 0
            if duration >= 180:
                event['event_type'] = 'very_long_dwell_time'
            elif duration >= 60:
                event['event_type'] = 'long_dwell_time'
            # Short dwell times don't map to a scorer signal, skip
            return event

        if etype in EventNormalizer.TAXONOMY_MAP:
            event['event_type'] = EventNormalizer.TAXONOMY_MAP[etype]
        return event

class EventPrioritySystem:
    """Section 43: Not all events matter equally."""
    PRIORITY_LEVELS = {
        "page_visit": "LOW",
        "scroll": "LOW",
        "mouse_movement": "LOW",
        "faq_open": "MEDIUM",
        "calculator_usage": "HIGH",
        "cta_click": "HIGH",
        "rage_click": "HIGH",
        "idle_timeout": "HIGH",
        "otp_request": "CRITICAL",
        "form_completion": "CRITICAL",
        "form_abandonment": "CRITICAL"
    }

    @staticmethod
    def get_priority(event_type: str) -> str:
        return EventPrioritySystem.PRIORITY_LEVELS.get(event_type, "LOW")

class ContextEnricher:
    """Section 44: Understand event meaning in context."""
    @staticmethod
    def enrich(event: Dict, session_history: List[Dict]) -> Dict:
        # Add context flags
        event['context'] = {
            "is_return_visit": any(e['event_type'] == 'return_session' for e in session_history),
            "prior_frustration": any(e['event_type'] == 'rage_click' for e in session_history),
            "session_depth": len([e for e in session_history if e['event_type'] == 'page_visit']),
            "has_pricing_context": any(e['event_type'] == 'pricing_view' for e in session_history)
        }
        return event
