import time
from typing import Dict, List, Optional
from pydantic import BaseModel, Field

class Event(BaseModel):
    user_id: str
    event_type: str  # click, view, form_start, form_complete, hover, scroll, blur, focus
    page_id: str
    element_id: Optional[str] = None
    raw_event_type: Optional[str] = None
    dwell_time: float = 0.0
    scroll_depth: Optional[float] = 0.0 # % of page scrolled
    idle_time: Optional[float] = 0.0   # seconds spent idle
    mouse_move_count: Optional[int] = 0
    x: Optional[float] = None
    y: Optional[float] = None
    metadata: Dict = Field(default_factory=dict)
    timestamp: float = Field(default_factory=time.time)

class GlobalConfig:
    def __init__(self):
        self.page_weights = {
            "landing": 1, "dashboard": 2, "sip_plans": 10,
            "insurance_plans": 10, "retirement_plans": 10,
            "checkout_form": 20, "kyc_upload": 15
        }
        self.action_weights = {
            "view": 1, "click": 2, "hover": 0.5,
            "form_start": 5, "form_complete": 50, "know_more_click": 5
        }
        self.detectors_enabled = {
            "rage_clicks": True, "circular_nav": True, "backtracking": True,
            "product_comparison": True, "onboarding_friction": True, "ml_intent": True
        }
        self.score_thresholds = {
            "passive": 10,
            "curious": 25,
            "research": 45,
            "interested": 65,
            "high_intent": 80,
            "nearly_converted": 90,
            "hesitation_visits": 3
        }

    def update(self, new_config: Dict):
        if "page_weights" in new_config: self.page_weights.update(new_config["page_weights"])
        if "action_weights" in new_config: self.action_weights.update(new_config["action_weights"])
        if "detectors_enabled" in new_config: self.detectors_enabled.update(new_config["detectors_enabled"])
        if "score_thresholds" in new_config: self.score_thresholds.update(new_config["score_thresholds"])

class SessionState:
    # Session considered stale after this many seconds of inactivity
    STALE_TTL = 300  # 5 minutes

    def __init__(self, user_id: str):
        self.user_id = user_id
        self.events: List[Dict] = []
        self.total_score: float = 0.0
        self.intent_state: str = "EXPLORING"
        self.last_active: float = time.time()
        self.created_at: float = self.last_active
        self.metadata: Dict = {}
        self.manual_interventions: List[Dict] = [] # Interventions forced by Admin
        self.ended_at: Optional[float] = None  # Set when session_end is received

    @staticmethod
    def display_event_type(event: Dict) -> str:
        metadata = event.get("metadata") or {}
        raw = event.get("raw_event_type") or metadata.get("rawEventType") or metadata.get("raw_event_type")
        if raw:
            return str(raw)

        reverse_map = {
            "page_visit": "page_view",
            "cta_click": "button_click",
            "scroll": "scroll_depth",
            "form_completion": "form_submit",
            "form_abandonment": "form_abandon",
            "return_session": "return_visit",
            "rage_click": "rapid_click",
            "idle_timeout": "inactive_session",
        }
        return reverse_map.get(event.get("event_type"), event.get("event_type", "unknown"))

    @staticmethod
    def describe_event(event: Dict) -> str:
        display_type = SessionState.display_event_type(event)
        page = event.get("page_id") or "unknown"
        element = event.get("element_id")

        descriptions = {
            "session_start": f"Started session on {page}",
            "session_end": "Left website",
            "page_view": f"Opened {page} page",
            "button_click": f"Clicked {element or 'CTA'}",
            "scroll_depth": f"Reached {int(event.get('scroll_depth') or 0)}% scroll on {page}",
            "time_spent": f"Spent {int(event.get('dwell_time') or 0)}s on {page}",
            "form_start": "Started form",
            "form_submit": "Submitted form",
            "form_abandon": "Abandoned form",
            "notification_open": "Opened notification",
            "return_visit": f"Returned to {page}",
            "repeated_page_visit": f"Revisited {page}",
            "product_view": f"Viewed product details on {page}",
            "comparison": "Compared financial products",
            "checkout_start": "Started application checkout",
            "checkout_abandon": "Abandoned checkout",
            "checkout_complete": "Completed checkout application",
            "calculator_usage": f"Used calculator on {page}",
            "download_brochure": f"Downloaded brochure from {page}",
            "contact_advisor": "Requested advisor contact",
            "chatbot_message": "Asked the AI assistant a question",
            "mouse_movement": "Mouse movement recorded",
            "rapid_click": f"Rapid clicks on {element or 'element'}",
            "inactive_session": "Inactive session detected",
            "bounce": "Bounce detected",
        }
        return descriptions.get(display_type, display_type.replace("_", " ").title())

    def session_metrics(self) -> Dict:
        events = self.events
        if not events:
            return {
                "session_start": self.created_at,
                "session_end": None,
                "total_duration": 0,
                "pages_visited": [],
                "navigation_flow": [],
                "bounce": False,
                "returning_user": False,
                "event_counts": {},
                "rapid_clicks": 0,
                "inactive_detected": False,
                "mouse_movement_count": 0,
                "repeated_page_visits": 0,
                "replay_timeline": [],
            }

        display_events = [self.display_event_type(event) for event in events]
        event_counts: Dict[str, int] = {}
        for event_type in display_events:
            event_counts[event_type] = event_counts.get(event_type, 0) + 1

        view_types = {"page_view", "return_visit", "repeated_page_visit"}
        page_sequence = [
            event.get("page_id")
            for event, event_type in zip(events, display_events)
            if event_type in view_types and event.get("page_id")
        ]

        pages_visited = []
        for page in page_sequence:
            if page not in pages_visited:
                pages_visited.append(page)

        navigation_flow = []
        previous_page = None
        for event, event_type in zip(events, display_events):
            page = event.get("page_id")
            if event_type in view_types and page and page != previous_page:
                navigation_flow.append({
                    "page": page,
                    "timestamp": event.get("timestamp", self.created_at),
                    "event_type": event_type,
                })
                previous_page = page

        session_start = events[0].get("timestamp", self.created_at)
        session_end_event = next((event for event, event_type in zip(reversed(events), reversed(display_events)) if event_type == "session_end"), None)
        session_end = session_end_event.get("timestamp") if session_end_event else None

        # Calculate active duration only (exclude idle gaps > 2 minutes)
        ACTIVE_GAP_THRESHOLD = 120  # seconds
        active_duration = 0
        for i in range(1, len(events)):
            prev_ts = events[i - 1].get("timestamp", session_start)
            curr_ts = events[i].get("timestamp", prev_ts)
            gap = max(0, curr_ts - prev_ts)
            active_duration += min(gap, ACTIVE_GAP_THRESHOLD)
        total_duration = max(0, active_duration)

        meaningful_events = {
            "button_click", "form_start", "form_submit", "form_abandon",
            "product_view", "comparison", "checkout_start", "checkout_complete",
            "checkout_abandon", "calculator_usage", "contact_advisor", "chatbot_message",
            "notification_open", "return_visit", "repeated_page_visit"
        }
        meaningful_count = sum(1 for event_type in display_events if event_type in meaningful_events)
        bounce = "bounce" in display_events or (
            len(pages_visited) <= 1 and meaningful_count == 0 and total_duration <= 30
        )

        replay_timeline = [
            {
                "timestamp": event.get("timestamp", session_start),
                "event_type": self.display_event_type(event),
                "page": event.get("page_id"),
                "element": event.get("element_id"),
                "description": self.describe_event(event),
            }
            for event in events[-100:]
        ]

        return {
            "session_start": session_start,
            "session_end": session_end,
            "total_duration": total_duration,
            "pages_visited": pages_visited,
            "navigation_flow": navigation_flow,
            "bounce": bounce,
            "returning_user": any(event_type in {"return_visit", "repeated_page_visit"} for event_type in display_events),
            "event_counts": event_counts,
            "rapid_clicks": event_counts.get("rapid_click", 0),
            "inactive_detected": event_counts.get("inactive_session", 0) > 0,
            "mouse_movement_count": sum(int(event.get("mouse_move_count") or 0) for event in events),
            "repeated_page_visits": event_counts.get("repeated_page_visit", 0),
            "replay_timeline": replay_timeline,
        }
        
    def to_dict(self):
        metrics = self.session_metrics()
        return {
            "user_id": self.user_id,
            "total_score": self.total_score,
            "intent_state": self.intent_state,
            "event_count": len(self.events),
            "events": self.events,
            "last_active": self.last_active,
            "manual_interventions_pending": len(self.manual_interventions),
            **metrics,
        }

    def pop_interventions(self) -> List[Dict]:
        """Returns and clears all pending manual interventions."""
        interventions = self.manual_interventions.copy()
        self.manual_interventions = []
        return interventions

    @property
    def is_active(self) -> bool:
        """True if the session has not ended and has not gone stale."""
        if self.ended_at is not None:
            return False
        return (time.time() - self.last_active) < self.STALE_TTL

class SessionManager:
    def __init__(self):
        self.sessions: Dict[str, SessionState] = {}
        self.config = GlobalConfig()

    def get_or_create_session(self, user_id: str) -> SessionState:
        if user_id not in self.sessions:
            self.sessions[user_id] = SessionState(user_id)
        return self.sessions[user_id]

    MAX_EVENTS_PER_SESSION = 500

    def add_event(self, event: Event):
        session = self.get_or_create_session(event.user_id)
        event_data = event.model_dump()
        metadata = event_data.get("metadata") or {}
        for source_key, target_key in {
            "userEmail": "email",
            "email": "email",
            "userName": "name",
            "fullName": "name",
            "clientSessionId": "client_session_id",
            "clientIp": "client_ip",
            "connectionOrigin": "connection_origin",
            "trackingUserId": "tracking_user_id",
        }.items():
            value = metadata.get(source_key)
            if value:
                session.metadata[target_key] = value

        session.events.append(event_data)

        if len(session.events) > self.MAX_EVENTS_PER_SESSION:
            session.events = session.events[-self.MAX_EVENTS_PER_SESSION:]

        # Ensure x and y are present at top level if they were in metadata
        if event_data.get("x") is None and metadata.get("x") is not None:
            event_data["x"] = metadata.get("x")
        if event_data.get("y") is None and metadata.get("y") is not None:
            event_data["y"] = metadata.get("y")

        session.last_active = time.time()

        # Mark session as ended when a session_end event is received
        if event.event_type == "session_end":
            session.ended_at = session.last_active

        return session

    def delete_session(self, user_id: str):
        if user_id in self.sessions:
            del self.sessions[user_id]

    def get_all_sessions(self) -> List[Dict]:
        return [s.to_dict() for s in self.sessions.values()]

    # Sessions without a session_end event that have been inactive this long
    # are considered abandoned (e.g. guest closed the tab).  30 minutes is well
    # beyond the 5-minute STALE_TTL so active or recently-active sessions are
    # never accidentally pruned.
    STALE_SESSION_MAX_AGE = 30 * 60  # 30 minutes

    def prune_ended_sessions(self, max_age: float = 600):
        """Remove ended sessions older than max_age seconds (default 10 min).
        Also removes sessions that went stale without a session_end event
        (e.g. guest user closed the tab) after STALE_SESSION_MAX_AGE."""
        now = time.time()
        to_delete = [
            uid for uid, session in self.sessions.items()
            if (session.ended_at is not None and (now - session.ended_at) > max_age)
            or (session.ended_at is None and (now - session.last_active) > self.STALE_SESSION_MAX_AGE)
        ]
        for uid in to_delete:
            del self.sessions[uid]
        return len(to_delete)

    def get_session_history(self, user_id: str) -> List[Dict]:
        if user_id in self.sessions:
            return self.sessions[user_id].events
        return []
