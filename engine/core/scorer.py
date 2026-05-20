from typing import Dict, List
import time
import math

# ── Positive signals: reduced weights, many new variables ──────
DEFAULT_POSITIVE_SIGNALS = {
    # Navigation (low weight — easy actions)
    "page_visit": 1,
    "repeat_page_visit": 2,
    "deep_navigation": 4,
    "category_exploration": 3,
    "multi_page_session": 2,
    "return_session": 8,

    # Engagement (medium weight)
    "long_dwell_time": 3,
    "very_long_dwell_time": 6,
    "scroll_completion": 2,
    "mouse_movement": 0.5,
    "content_expansion": 2,
    "section_revisit": 3,
    "faq_open": 2,
    "faq_repeat": 3,
    "video_completion": 4,
    "bookmark_action": 4,
    "download_resource": 5,

    # Interaction (medium-high weight)
    "cta_click": 4,
    "multiple_cta_click": 8,
    "cta_hover": 1,
    "hover": 0.5,
    "button_click": 2,
    "comparison_view": 5,
    "pricing_view": 5,
    "calculator_usage": 6,
    "search_usage": 3,
    "filter_usage": 1.5,
    "plan_selection": 8,

    # Form behavior (high weight — serious intent)
    "form_start": 6,
    "form_progress": 4,
    "form_pause": 2,
    "field_focus": 1,
    "field_blur": 0.5,
    "otp_request": 12,
    "save_progress": 5,
    "form_completion": 15,
    "security_page_view": 3,

    # Investment-specific (high weight)
    "sip_visit": 4,
    "mutual_fund_visit": 4,
    "insurance_visit": 3,
    "retirement_visit": 3,
    "tax_saving_visit": 3,
    "risk_assessment": 5,
    "goal_setting": 5,
    "portfolio_view": 4,
    "transaction_history": 3,
    "application_start": 7,
    "application_progress": 5,
    "application_complete": 12,

    # Re-engagement
    "modal_open": 3,
    "modal_close": 1,
    "notification_click": 4,
    "popup_clicked": 5,
    "advisor_request": 6,
    "chatbot_open": 2,

    # Derived session signals (calculated, not from events)
    "deep_navigation_derived": 4,
    "multi_page_derived": 2,
    "category_exploration_derived": 3,
    "multiple_cta_derived": 6,
    "faq_repeat_derived": 3,
    "repeat_page_derived": 2,
}

# Alias for backward compatibility
POSITIVE_SIGNALS = DEFAULT_POSITIVE_SIGNALS

# ── Negative signals: expanded with many more penalty types ──────
DEFAULT_NEGATIVE_SIGNALS = {
    # Exit behaviors
    "quick_exit": -6,
    "no_interaction_session": -8,
    "single_page_bounce": -5,
    "pricing_exit": -5,
    "exit_near_conversion": -12,
    "tab_switch_abandonment": -4,

    # Click frustration
    "rage_click": -8,
    "spam_click": -5,
    "dead_click": -3,
    "cta_hover_no_click": -2,
    "long_pause_before_cta": -2,

    # Navigation frustration
    "navigation_loop": -5,
    "excessive_back": -4,
    "scroll_oscillation": -3,
    "revisit_without_action": -4,
    "idle_timeout": -8,
    "inactivity": -3,

    # Form frustration
    "form_abandonment": -10,
    "form_pause": -3,
    "repeated_validation_failure": -7,
    "form_field_abandon": -4,

    # Behavioral red flags
    "rapid_navigation": -3,
    "confused_navigation": -4,
    "hesitation_pattern": -3,
    "comparison_without_action": -3,
    "repeated_comparison": -4,
    "bounce_after_deep_engagement": -8,
    "abandoned_checkout": -10,
}


def _diminishing_weight(count: int) -> float:
    """Stronger diminishing returns: repeats count much less."""
    if count <= 1:
        return 1.0
    if count <= 2:
        return 0.7
    if count <= 4:
        return 0.4
    if count <= 8:
        return 0.2
    return 0.1


class BehaviorScorer:
    def __init__(self, config):
        self.config = config

    def _get_positive_weight(self, etype: str) -> float:
        config_weights = getattr(self.config, 'action_weights', None)
        if config_weights and etype in config_weights:
            return config_weights[etype]
        return DEFAULT_POSITIVE_SIGNALS.get(etype, 0)

    def _get_negative_weight(self, etype: str) -> float:
        return DEFAULT_NEGATIVE_SIGNALS.get(etype, 0)

    def _derive_session_signals(self, events: List[Dict]) -> Dict[str, int]:
        """Generate derived signals from session-level patterns."""
        signals = {}
        event_types = [e.get('event_type') for e in events]
        unique_pages = set(e.get('page_id') for e in events if e.get('page_id'))

        # Deep navigation: 7+ unique pages (raised from 5)
        if len(unique_pages) >= 7:
            signals['deep_navigation_derived'] = 1
        elif len(unique_pages) >= 5:
            signals['deep_navigation_derived'] = 0.5

        # Multi-page session: 4+ unique pages (raised from 3)
        if len(unique_pages) >= 4:
            signals['multi_page_derived'] = 1

        # Category exploration: 4+ page prefixes (raised from 3)
        page_prefixes = set(p.split('_')[0] if '_' in p else p for p in unique_pages)
        if len(page_prefixes) >= 4:
            signals['category_exploration_derived'] = 1

        # Multiple CTA clicks: 4+ (raised from 3)
        cta_count = event_types.count('cta_click')
        if cta_count >= 4:
            signals['multiple_cta_derived'] = 1

        # FAQ repeat: 3+ (raised from 2)
        faq_count = event_types.count('faq_open')
        if faq_count >= 3:
            signals['faq_repeat_derived'] = 1

        # Repeated page visits: any page 4+ times (raised from 3)
        from collections import Counter
        page_visits = [e.get('page_id') for e in events if e.get('event_type') == 'page_visit']
        page_counts = Counter(page_visits)
        if any(c >= 4 for c in page_counts.values()):
            signals['repeat_page_derived'] = 1

        return signals

    def _derive_negative_signals(self, events: List[Dict]) -> Dict[str, int]:
        """Detect negative behavioral patterns from session events."""
        signals = {}
        event_types = [e.get('event_type') for e in events]
        pages = [e.get('page_id') for e in events if e.get('page_id')]

        # Rapid navigation: 5+ page views in < 30 seconds
        page_views = [e for e in events if e.get('event_type') == 'page_visit']
        for i in range(len(page_views) - 4):
            window = page_views[i:i+5]
            time_span = (window[-1].get('timestamp', 0) - window[0].get('timestamp', 0))
            if 0 < time_span < 30:
                signals['rapid_navigation'] = 1
                break

        # Hesitation: same page visited 3+ times without CTA/form action
        from collections import Counter
        page_counts = Counter(pages)
        for page, count in page_counts.items():
            if count >= 3:
                has_action = any(
                    e.get('event_type') in ('cta_click', 'form_start', 'form_completion')
                    and e.get('page_id') == page
                    for e in events
                )
                if not has_action:
                    signals['hesitation_pattern'] = 1
                    break

        # Confused navigation: visiting same 3 pages in a loop
        if len(pages) >= 6:
            for i in range(len(pages) - 5):
                window = pages[i:i+6]
                if window[0] == window[2] == window[4] and window[1] == window[3] == window[5]:
                    signals['confused_navigation'] = 1
                    break

        # Comparison without action: 3+ comparison/pricing views with 0 CTA clicks
        comparisons = sum(1 for e in events if e.get('event_type') in ('comparison_view', 'pricing_view'))
        cta_clicks = sum(1 for e in events if e.get('event_type') == 'cta_click')
        if comparisons >= 3 and cta_clicks == 0:
            signals['comparison_without_action'] = 1

        # Repeated comparison: 5+ comparison views
        if comparisons >= 5:
            signals['repeated_comparison'] = 1

        # Bounce after deep engagement: many events then sudden stop
        if len(events) > 10:
            last_5 = events[-5:]
            first_10 = events[:10]
            first_density = len([e for e in first_10 if e.get('event_type') not in ('mouse_movement', 'hover')])
            last_density = len([e for e in last_5 if e.get('event_type') not in ('mouse_movement', 'hover')])
            if first_density >= 6 and last_density <= 1:
                signals['bounce_after_deep_engagement'] = 1

        # Form field abandon: field_focus without field_blur on same element
        focused = set()
        blurred = set()
        for e in events:
            if e.get('event_type') == 'field_focus':
                focused.add(e.get('element_id', ''))
            elif e.get('event_type') == 'field_blur':
                blurred.add(e.get('element_id', ''))
        if len(focused - blurred) >= 2:
            signals['form_field_abandon'] = 1

        return signals

    def _category_scores(self, events: List[Dict]) -> Dict[str, float]:
        """Break down score by category with individual caps."""
        categories = {
            "navigation": {"events": ["page_visit", "repeat_page_visit", "deep_navigation",
                                       "category_exploration", "multi_page_session", "return_session"],
                           "cap": 20},
            "engagement": {"events": ["long_dwell_time", "very_long_dwell_time", "scroll_completion",
                                       "mouse_movement", "content_expansion", "section_revisit",
                                       "faq_open", "faq_repeat", "video_completion",
                                       "bookmark_action", "download_resource", "hover"],
                            "cap": 18},
            "interaction": {"events": ["cta_click", "multiple_cta_click", "cta_hover",
                                        "button_click", "comparison_view", "pricing_view",
                                        "calculator_usage", "search_usage", "filter_usage",
                                        "plan_selection"],
                             "cap": 22},
            "form": {"events": ["form_start", "form_progress", "form_pause", "field_focus",
                                 "field_blur", "otp_request", "save_progress", "form_completion",
                                 "security_page_view"],
                      "cap": 25},
            "investment": {"events": ["sip_visit", "mutual_fund_visit", "insurance_visit",
                                       "retirement_visit", "tax_saving_visit", "risk_assessment",
                                       "goal_setting", "portfolio_view", "transaction_history",
                                       "application_start", "application_progress",
                                       "application_complete"],
                            "cap": 25},
            "reengagement": {"events": ["modal_open", "modal_close", "notification_click",
                                         "popup_clicked", "advisor_request", "chatbot_open"],
                              "cap": 12},
        }

        now = time.time()
        scores = {}

        for cat_name, cat_info in categories.items():
            cat_score = 0.0
            seen = {}
            for e in events:
                etype = e.get('event_type')
                if etype not in cat_info["events"]:
                    continue

                # Time decay
                age = now - e.get('timestamp', now)
                decay = 1.0
                if age > 86400 * 7:
                    decay = 0.5
                elif age > 3600:
                    decay = 0.85
                elif age > 300:
                    decay = 0.95

                # Diminishing returns
                seen[etype] = seen.get(etype, 0) + 1
                dim = _diminishing_weight(seen[etype])

                cat_score += self._get_positive_weight(etype) * decay * dim

            scores[cat_name] = min(cat_info["cap"], cat_score)

        return scores

    def calculate_intent_score(self, events: List[Dict]) -> float:
        """
        Calibrated scoring with category caps and strong diminishing returns.
        Max possible score ~85 through normal browsing. 100 requires form completion.
        """
        if not events:
            return 0.0

        now = time.time()

        # 1. Category-capped positive scores
        cat_scores = self._category_scores(events)
        pos_score = sum(cat_scores.values())

        # 2. Derived session signals (capped at 10)
        derived = self._derive_session_signals(events)
        derived_score = 0.0
        for signal, weight in derived.items():
            derived_score += self._get_positive_weight(signal) * weight
        derived_score = min(10, derived_score)

        # 3. Negative signals (uncapped — penalties accumulate)
        neg_score = 0.0
        seen_neg = {}
        for e in events:
            etype = e.get('event_type')
            n_val = self._get_negative_weight(etype)
            if n_val < 0:
                age = now - e.get('timestamp', now)
                decay = 1.0
                if age > 86400:
                    decay = 0.5
                seen_neg[etype] = seen_neg.get(etype, 0) + 1
                dim = _diminishing_weight(seen_neg[etype])
                neg_score += abs(n_val) * decay * dim

        # 3b. Derived negative signals
        neg_derived = self._derive_negative_signals(events)
        for signal, weight in neg_derived.items():
            n_val = self._get_negative_weight(signal)
            if n_val < 0:
                neg_score += abs(n_val) * weight

        # 4. Friction penalty (from rage clicks, dead clicks, etc.)
        friction_penalty = 0.0
        for e in events:
            if e.get('event_type') in ("rage_click", "repeated_validation_failure", "dead_click"):
                friction_penalty += 2.0
        friction_penalty = min(15, friction_penalty)

        # 5. Momentum (small bonus, capped)
        momentum = self.calculate_momentum(events)
        momentum_bonus = max(-5, min(8, momentum * 8.0))

        # 6. Session continuity (small bonus)
        return_count = sum(1 for e in events if e.get('event_type') == 'return_session')
        continuity_bonus = min(6, return_count * 2)

        # 7. Persistence (multi-day engagement, capped)
        persistence_bonus = 0
        if len(events) > 1:
            first_time = events[0].get('timestamp', now)
            last_time = events[-1].get('timestamp', now)
            days_diff = (last_time - first_time) / 86400
            if days_diff > 1:
                persistence_bonus = min(8, days_diff * 1.5)

        # 8. Alignment multiplier (small, only for truly aligned behaviors)
        has_calculator = any(e.get('event_type') == 'calculator_usage' for e in events)
        has_pricing = any(e.get('event_type') == 'pricing_view' for e in events)
        has_cta = any(e.get('event_type') == 'cta_click' for e in events)
        has_form = any(e.get('event_type') in ('form_start', 'form_completion') for e in events)

        multiplier = 1.0
        if has_calculator and has_pricing and has_cta and has_form:
            multiplier = 1.15
        elif has_calculator and has_pricing and has_cta:
            multiplier = 1.08
        elif (has_calculator and has_pricing) or (has_pricing and has_cta):
            multiplier = 1.05

        # Final calculation
        raw_score = (pos_score + derived_score - neg_score) * multiplier
        raw_score += momentum_bonus + continuity_bonus + persistence_bonus - friction_penalty

        # Hard cap: 100 requires near-perfect engagement
        return max(0, min(100, round(raw_score, 1)))

    def calculate_momentum(self, events: List[Dict]) -> float:
        """Measure if engagement is increasing or decreasing."""
        if len(events) < 5:
            return 0.0

        recent = events[-5:]
        older = events[:-5][-10:]

        def get_avg_signal(evs):
            if not evs:
                return 0.0
            signals = [self._get_positive_weight(e.get('event_type', '')) for e in evs]
            return sum(signals) / len(evs)

        recent_val = get_avg_signal(recent)
        older_val = get_avg_signal(older)

        return (recent_val - older_val) / 15.0

    def calculate_trust_score(self, events: List[Dict]) -> str:
        """Detects trust barriers based on research behavior."""
        trust_signals = ["faq_open", "security_page_view", "scroll_completion",
                         "return_session", "long_dwell_time", "risk_assessment"]
        distrust_signals = ["pricing_exit", "quick_exit", "rage_click",
                            "long_pause_before_cta", "form_abandonment"]

        score = sum(1 for e in events if e.get('event_type') in trust_signals)
        penalty = sum(1 for e in events if e.get('event_type') in distrust_signals)

        total = score - penalty
        if total >= 6:
            return "HIGH"
        if total >= 3:
            return "MEDIUM"
        if total <= -3:
            return "DISTRUSTED"
        return "LOW"
