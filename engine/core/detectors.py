from typing import List, Dict, Optional
import time

VIEW_TYPES = {'page_visit', 'category_exploration', 'pricing_view', 'comparison_view'}
CLICK_TYPES = {'click', 'button_click', 'cta_click'}

class BehavioralDetectors:
    @staticmethod
    def detect_rage_clicks(events: List[Dict], window_seconds: int = 2, threshold: int = 4) -> bool:
        """Detects if a user clicks the same element multiple times in a short window."""
        if not events: return False
        # If frontend already sent 'rage_click', it's detected
        if any(e['event_type'] == 'rage_click' for e in events):
            return True

        click_events = [e for e in events if e['event_type'] in CLICK_TYPES]
        if len(click_events) < threshold: return False

        now = time.time()
        last_timestamp = click_events[-1].get('timestamp', now)
        window_start = last_timestamp - window_seconds

        recent_clicks = [e for e in click_events if e.get('timestamp', now) >= window_start]
        if len(recent_clicks) < threshold: return False
        element_counts = {}
        for click in recent_clicks:
            eid = click.get('element_id', 'unknown')
            element_counts[eid] = element_counts.get(eid, 0) + 1
            if element_counts[eid] >= threshold: return True
        return False

    @staticmethod
    def detect_circular_navigation(events: List[Dict], depth: int = 4) -> bool:
        """Detects if a user is looping between pages (A -> B -> A)."""
        if len(events) < depth: return False
        views = [e['page_id'] for e in events if e['event_type'] in VIEW_TYPES][-depth:]
        if len(views) < 4: return False
        if views[-1] == views[-3] and views[-2] == views[-4] and views[-1] != views[-2]:
            return True
        return False

    @staticmethod
    def detect_hesitation(events: List[Dict], page_id: str, min_visits: int = 3) -> bool:
        """Detects repeated visits to a high-value page without conversion."""
        visits = [e for e in events if e['page_id'] == page_id and e['event_type'] in VIEW_TYPES]
        return len(visits) >= min_visits

    # --- NEW BEHAVIORAL REGISTRIES ---

    @staticmethod
    def detect_backtracking(events: List[Dict], threshold: int = 3) -> bool:
        """Detects frequent use of 'back' navigation or page reversals."""
        if len(events) < threshold * 2: return False
        # Simplified: Check if user returns to the immediately previous page multiple times
        reversals = 0
        pages = [e['page_id'] for e in events if e['event_type'] in VIEW_TYPES]
        for i in range(2, len(pages)):
            if pages[i] == pages[i-2]:
                reversals += 1
        return reversals >= threshold

    @staticmethod
    def detect_product_comparison(events: List[Dict], product_pages: List[str] = None) -> bool:
        """Detects rapid switching between different financial products."""
        if not product_pages:
            product_pages = ['sip_plans', 'insurance_plans', 'retirement_plans', 'mutual_funds']
        recent_views = [e['page_id'] for e in events if e['event_type'] in VIEW_TYPES][-5:]
        unique_products = set([p for p in recent_views if p in product_pages])
        return len(unique_products) >= 2

    @staticmethod
    def detect_onboarding_friction(events: List[Dict], threshold: int = 5) -> bool:
        """Detects excessive time or repetitive interactions on a single form field."""
        # Check for multiple 'form_input' or 'click' events on the same element within a checkout page
        form_pages = {'checkout_form', 'application_form'}
        form_events = [e for e in events if e['page_id'] in form_pages and e.get('element_id')]
        if not form_events: return False
        element_counts = {}
        for e in form_events:
            eid = e['element_id']
            element_counts[eid] = element_counts.get(eid, 0) + 1
            if element_counts[eid] >= threshold: return True
        return False

    @staticmethod
    def detect_navigation_velocity(events: List[Dict], window: int = 10) -> bool:
        """Detects scanning behavior (very fast page switching)."""
        if len(events) < 5: return False
        last_5_views = [e for e in events if e['event_type'] in VIEW_TYPES][-5:]
        if len(last_5_views) < 5: return False
        timespan = last_5_views[-1]['timestamp'] - last_5_views[0]['timestamp']
        # If 5 pages are viewed in less than 10 seconds -> scanning
        return timespan < window

    @staticmethod
    def detect_idle_reading(events: List[Dict], page_id: str, min_dwell: int = 45) -> bool:
        """Distinguishes between 'active' users and those 'deep reading' a page."""
        # Calculate total dwell time on the current page across all views
        dwell = sum([e.get('dwell_time', 0) for e in events if e['page_id'] == page_id])
        return dwell >= min_dwell

    @staticmethod
    def detect_return_intent(events: List[Dict]) -> bool:
        """Detects a user who specifically returned to a product they viewed previously."""
        pages = [e['page_id'] for e in events if e['event_type'] in VIEW_TYPES]
        if len(pages) < 5: return False
        # If they viewed a product early on, went elsewhere, and then came back to it
        early_pages = set(pages[:len(pages)//2])
        current_page = pages[-1]
        product_pages = ['sip_plans', 'insurance_plans', 'retirement_plans']
        return current_page in product_pages and current_page in early_pages

    @staticmethod
    def detect_window_shopper(events: List[Dict]) -> bool:
        """Many pages, high browsing, no CTA (Section 57)."""
        views = [e for e in events if e['event_type'] in VIEW_TYPES]
        cta_clicks = [e for e in events if e['event_type'] == 'cta_click']
        return len(views) >= 6 and len(cta_clicks) == 0

    @staticmethod
    def detect_decision_paralysis(events: List[Dict]) -> bool:
        """Too many comparisons, repeated revisits, no progress (Section 57)."""
        comparisons = [e for e in events if e['event_type'] == 'comparison_view']
        revisits = [e for e in events if e['event_type'] == 'section_revisit']
        cta_clicks = [e for e in events if e['event_type'] == 'cta_click']
        return (len(comparisons) >= 4 or len(revisits) >= 5) and len(cta_clicks) == 0

    @staticmethod
    def detect_urgent_investor(events: List[Dict]) -> bool:
        """Fast progression through key pages (Section 57)."""
        if len(events) < 3: return False
        key_events = ['pricing_view', 'cta_click', 'form_start']
        found_events = [e for e in events if e['event_type'] in key_events]
        if len(found_events) < 3: return False
        
        # Check time span of these key events
        timespan = found_events[-1]['timestamp'] - found_events[0]['timestamp']
        return timespan < 120 # 2 minutes for key progression

    @staticmethod
    def detect_confused_prospect(events: List[Dict]) -> bool:
        """Navigation loops, back actions, dead clicks (Section 57)."""
        loops = BehavioralDetectors.detect_circular_navigation(events)
        backtracking = BehavioralDetectors.detect_backtracking(events)
        dead_clicks = any(e['event_type'] == 'dead_click' for e in events)
        return loops or backtracking or dead_clicks

    @staticmethod
    def detect_almost_converted(events: List[Dict]) -> bool:
        """OTP requested, high form progress, then exit (Section 57)."""
        otp = any(e['event_type'] == 'otp_request' for e in events)
        high_progress = any(e['event_type'] == 'form_progress' and e.get('metadata', {}).get('progress', 0) > 70 for e in events)
        abandoned = any(e['event_type'] in ['form_abandonment', 'exit_near_conversion'] for e in events)
        return (otp or high_progress) and abandoned

    @staticmethod
    def calculate_interaction_density(events: List[Dict]) -> float:
        """interactions / minute (Section 30)."""
        if not events: return 0.0
        duration_minutes = (events[-1]['timestamp'] - events[0]['timestamp']) / 60.0
        if duration_minutes < 0.1: return 0.0
        return len(events) / duration_minutes

    @staticmethod
    def detect_oscillating_scroll(events: List[Dict]) -> bool:
        """Section 30: Confusion scrolling (back and forth)."""
        scroll_events = [e for e in events if e['event_type'] == 'scroll' or (e.get('scroll_depth', 0) > 0)]
        if len(scroll_events) < 4: return False
        
        directions = []
        for i in range(1, len(scroll_events)):
            diff = scroll_events[i].get('scroll_depth', 0) - scroll_events[i-1].get('scroll_depth', 0)
            if abs(diff) > 5:
                directions.append(1 if diff > 0 else -1)
        
        if len(directions) < 3: return False
        reversals = sum(1 for i in range(1, len(directions)) if directions[i] != directions[i-1])
        return reversals >= 3

    @staticmethod
    def detect_density_drop(events: List[Dict]) -> bool:
        """Section 30: Sudden drop in interaction density (Disengagement risk)."""
        if len(events) < 10: return False
        recent = events[-5:]
        older = events[:-5][-5:]
        
        def get_density(evs):
            duration = evs[-1]['timestamp'] - evs[0]['timestamp']
            return len(evs) / max(0.1, duration)
            
        return get_density(recent) < (get_density(older) * 0.3)
