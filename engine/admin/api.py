from fastapi import APIRouter, HTTPException
from pydantic import BaseModel, Field
from ..core.session_manager import SessionManager
from ..core.ml_model import GlobalIntentModel, GlobalSegmentationModel
from ..core.temporal import TemporalEngine
from typing import Dict, List, Any, Optional
import asyncio
import numpy as np


def _sanitize(obj):
    """Convert numpy types to native Python types for JSON serialization."""
    if isinstance(obj, dict):
        return {k: _sanitize(v) for k, v in obj.items()}
    if isinstance(obj, (list, tuple)):
        return [_sanitize(v) for v in obj]
    if isinstance(obj, (np.integer,)):
        return int(obj)
    if isinstance(obj, (np.floating,)):
        return float(obj)
    if isinstance(obj, np.ndarray):
        return obj.tolist()
    if isinstance(obj, np.bool_):
        return bool(obj)
    return obj
import os
import smtplib
import time
from datetime import datetime, timezone
from email.message import EmailMessage
from pathlib import Path


# ── Simple TTL cache for expensive endpoints ──────────────────────
class _TTLCache:
    """In-memory cache with per-key TTL. Returns None on miss."""
    def __init__(self):
        self._store: Dict[str, tuple] = {}  # key -> (value, expires_at)

    def get(self, key: str):
        entry = self._store.get(key)
        if not entry:
            return None
        value, expires_at = entry
        if time.time() > expires_at:
            del self._store[key]
            return None
        return value

    def set(self, key: str, value, ttl: float):
        self._store[key] = (value, time.time() + ttl)

    def invalidate(self, key: str = None):
        if key:
            self._store.pop(key, None)
        else:
            self._store.clear()

_cache = _TTLCache()

class ConfigUpdate(BaseModel):
    page_weights: Optional[Dict[str, float]] = None
    action_weights: Optional[Dict[str, float]] = None
    detectors_enabled: Optional[Dict[str, bool]] = None
    score_thresholds: Optional[Dict[str, float]] = None

class ManualIntervention(BaseModel):
    user_id: str
    type: str
    message: str
    reason: str = "Admin Manual Trigger"
    title: str = "FinovaWealth"
    channel: str = "popup"

class NotificationDispatch(BaseModel):
    user_id: str
    message: str
    title: str = "FinovaWealth"
    type: str = "INFO"
    channels: List[str] = Field(default_factory=lambda: ["popup"])
    reason: str = "Admin Notification Engine"
    template: Optional[str] = None
    email_to: Optional[str] = None
    email_subject: Optional[str] = None
    schedule_at: Optional[str] = None

class DeleteSessionsRequest(BaseModel):
    identifiers: List[str] = Field(default_factory=list)

def _read_backend_env() -> Dict[str, str]:
    env_path = Path(__file__).resolve().parents[2] / "Backend" / ".env"
    values: Dict[str, str] = {}
    if not env_path.exists():
        return values

    for line in env_path.read_text(encoding="utf-8", errors="ignore").splitlines():
        if not line or line.strip().startswith("#") or "=" not in line:
            continue
        key, value = line.split("=", 1)
        values[key.strip()] = value.strip().strip('"').strip("'")
    return values

def _email_env(name: str, fallback: Optional[str] = None) -> Optional[str]:
    return os.getenv(name) or _read_backend_env().get(name) or fallback

def _send_email(to: str, subject: str, title: str, message: str) -> Dict[str, Any]:
    user = _email_env("EMAIL_USER")
    password = _email_env("EMAIL_PASS")
    host = _email_env("EMAIL_HOST", "smtp.gmail.com")
    port = int(_email_env("EMAIL_PORT", "587") or 587)

    if not user or not password:
        return {
            "status": "not_configured",
            "message": "EMAIL_USER and EMAIL_PASS are required for email delivery."
        }

    email = EmailMessage()
    email["From"] = f"FinovaWealth <{user}>"
    email["To"] = to
    email["Subject"] = subject
    email.set_content(message)
    email.add_alternative(f"""
    <html>
      <body style="margin:0;background:#f8fafc;font-family:Arial,sans-serif;color:#0f172a;">
        <table width="100%" cellpadding="0" cellspacing="0" style="padding:32px 0;">
          <tr><td align="center">
            <table width="520" cellpadding="0" cellspacing="0" style="background:#ffffff;border-radius:16px;overflow:hidden;border:1px solid #e2e8f0;">
              <tr><td style="background:#0f172a;color:#ffffff;padding:28px 32px;">
                <h1 style="margin:0;font-size:22px;">{title}</h1>
                <p style="margin:6px 0 0;color:#94a3b8;font-size:13px;">FinovaWealth personalized update</p>
              </td></tr>
              <tr><td style="padding:32px;color:#334155;font-size:15px;line-height:1.7;">
                {message}
              </td></tr>
            </table>
          </td></tr>
        </table>
      </body>
    </html>
    """, subtype="html")

    with smtplib.SMTP(host, port, timeout=20) as smtp:
        smtp.starttls()
        smtp.login(user, password)
        smtp.send_message(email)

    return {"status": "sent", "to": to}

def _queue_popup(session_manager: SessionManager, payload: Dict[str, Any]) -> Dict[str, Any]:
    user_id = payload["user_id"]
    if user_id not in session_manager.sessions:
        raise HTTPException(status_code=404, detail="User session not found")

    session = session_manager.sessions[user_id]
    session.manual_interventions.append({
        "id": f"notif_{int(datetime.now(timezone.utc).timestamp() * 1000)}",
        "type": payload.get("type", "INFO"),
        "title": payload.get("title", "FinovaWealth"),
        "reason": payload.get("reason", "Admin Notification Engine"),
        "channel": payload.get("channel", "popup"),
        "template": payload.get("template"),
        "payload": {"message": payload["message"]}
    })
    return {"status": "queued", "user_id": user_id}

async def _dispatch_notification(session_manager: SessionManager, payload: Dict[str, Any]) -> Dict[str, Any]:
    channels = set(payload.get("channels") or ["popup"])
    results: Dict[str, Any] = {}

    if "popup" in channels or "push" in channels or "in_app" in channels:
        results["popup"] = _queue_popup(session_manager, {**payload, "channel": "popup"})

    if "email" in channels:
        email_to = payload.get("email_to")
        if not email_to:
            results["email"] = {"status": "skipped", "message": "No recipient email supplied."}
        else:
            try:
                results["email"] = _send_email(
                    email_to,
                    payload.get("email_subject") or payload.get("title") or "FinovaWealth update",
                    payload.get("title") or "FinovaWealth",
                    payload["message"],
                )
            except Exception as exc:
                results["email"] = {"status": "failed", "message": str(exc)}

    return results

def _session_aliases(user_id: str, session) -> List[str]:
    metadata = session.metadata or {}
    aliases = {
        str(user_id),
        str(metadata.get("email") or "").lower(),
        str(metadata.get("name") or ""),
        str(metadata.get("client_session_id") or ""),
        str(metadata.get("trackingUserId") or ""),
        str(metadata.get("tracking_user_id") or ""),
    }

    for event in session.events[-25:]:
        event_metadata = event.get("metadata") or {}
        for key in ["userEmail", "email", "trackingUserId", "clientSessionId", "client_session_id"]:
            value = event_metadata.get(key)
            if value:
                aliases.add(str(value).lower() if "email" in key.lower() else str(value))

    return [alias for alias in aliases if alias and alias != "None"]

def _canonical_session_key(user_id: str, session) -> str:
    aliases = _session_aliases(user_id, session)
    metadata = session.metadata or {}
    client_session_id = metadata.get("client_session_id")
    email = metadata.get("email")

    # Authenticated users: deduplicate by email (stable identity)
    if email:
        return f"email:{str(email).lower()}"

    if client_session_id:
        return f"client:{client_session_id}"

    for alias in aliases:
        if alias.startswith("sess_"):
            return f"client:{alias}"
    return f"user:{user_id}"

def _session_rank(user_id: str, session) -> tuple:
    metadata = session.metadata or {}
    is_guest = str(user_id).startswith("guest_") or str(user_id).startswith("sess_")
    return (
        1 if not is_guest else 0,
        1 if metadata.get("email") else 0,
        len(session.events),
        session.last_active,
    )

def _deduped_sessions(session_manager: SessionManager, active_only: bool = False):
    grouped: Dict[str, Dict[str, Any]] = {}

    for uid, session in session_manager.sessions.items():
        # Skip ended or stale sessions when requesting active-only list
        if active_only and not session.is_active:
            continue

        key = _canonical_session_key(uid, session)
        aliases = set(_session_aliases(uid, session))
        current = grouped.get(key)

        if not current:
            grouped[key] = {"uid": uid, "session": session, "aliases": aliases}
            continue

        current["aliases"].update(aliases)
        if _session_rank(uid, session) > _session_rank(current["uid"], current["session"]):
            current["uid"] = uid
            current["session"] = session

    return sorted(grouped.values(), key=lambda item: item["session"].last_active, reverse=True)

def _safe_persona(seg_model: GlobalSegmentationModel, events: List[Dict[str, Any]]) -> str:
    try:
        return seg_model.get_persona(events)
    except Exception:
        return "Unknown"

def _delete_sessions_by_identifiers(session_manager: SessionManager, identifiers: List[str]) -> List[str]:
    normalized = {str(identifier).lower() for identifier in identifiers if identifier}
    deleted = []

    for uid, session in list(session_manager.sessions.items()):
        aliases = {alias.lower() for alias in _session_aliases(uid, session)}
        if str(uid).lower() in normalized or aliases.intersection(normalized):
            deleted.append(uid)
            session_manager.delete_session(uid)

    return deleted

def _build_form_analytics(sessions: List[Any]) -> Dict[str, Any]:
    user_rows = []
    total_started = 0
    total_completed = 0
    total_discarded = 0

    for session in sessions:
        started = 0
        completed = 0
        discarded = 0

        for event in session.events:
            event_type = session.display_event_type(event)
            if event_type in {"form_start", "checkout_start"}:
                started += 1
            elif event_type in {"form_submit", "form_complete", "form_completion", "checkout_complete"}:
                completed += 1
            elif event_type in {"form_abandon", "form_abandonment", "checkout_abandon"}:
                discarded += 1

        if started or completed or discarded:
            total_started += started
            total_completed += completed
            total_discarded += discarded
            metadata = session.metadata or {}
            user_rows.append({
                "user_id": session.user_id,
                "name": metadata.get("name") or session.user_id,
                "email": metadata.get("email"),
                "started": started,
                "completed": completed,
                "discarded": discarded,
                "completion_rate": round((completed / started) * 100) if started else 0,
                "discard_rate": round((discarded / started) * 100) if started else 0,
                "last_active": session.last_active,
            })

    return {
        "summary": {
            "started": total_started,
            "completed": total_completed,
            "discarded": total_discarded,
            "users": len(user_rows),
            "completion_rate": round((total_completed / total_started) * 100) if total_started else 0,
            "discard_rate": round((total_discarded / total_started) * 100) if total_started else 0,
        },
        "users": sorted(user_rows, key=lambda row: row["last_active"], reverse=True)[:25],
    }

def _page_label(page: Optional[str]) -> str:
    if not page:
        return "Unknown"

    cleaned = str(page).strip().strip("/") or "landing"
    labels = {
        "landing": "Landing",
        "dashboard": "Dashboard",
        "investment-plans": "Investment Plans",
        "investment_plans": "Investment Plans",
        "mutual-funds": "Mutual Funds",
        "mutual_funds": "Mutual Funds",
        "sip-plans": "SIP Plans",
        "sip_plans": "SIP Plans",
        "investment-calculator": "Investment Calculator",
        "investment_calculator": "Investment Calculator",
        "plan-comparison": "Plan Comparison",
        "plan_comparison": "Plan Comparison",
        "insurance-plans": "Insurance Plans",
        "insurance_plans": "Insurance Plans",
        "application-form": "Application Form",
        "application_form": "Application Form",
        "checkout-form": "Checkout Form",
        "checkout_form": "Checkout Form",
        "confirmation": "Confirmation",
        "faq": "FAQ",
        "contact": "Contact",
    }
    return labels.get(cleaned, cleaned.replace("-", " ").replace("_", " ").title())

def _format_duration(seconds: float) -> str:
    seconds = max(0, int(seconds or 0))
    minutes, remaining = divmod(seconds, 60)
    if minutes >= 60:
        hours, minutes = divmod(minutes, 60)
        return f"{hours}h {minutes}m"
    if minutes:
        return f"{minutes}m {remaining}s"
    return f"{remaining}s"

def _is_conversion_event(event_type: str) -> bool:
    return event_type in {
        "form_submit",
        "form_complete",
        "form_completion",
        "checkout_complete",
        "conversion",
        "investment_intent",
    }

def _is_form_start_event(event_type: str) -> bool:
    return event_type in {"form_start", "checkout_start"}

def _is_form_abandon_event(event_type: str) -> bool:
    return event_type in {"form_abandon", "form_abandonment", "checkout_abandon"}

def _session_event_types(session) -> List[str]:
    return [session.display_event_type(event) for event in session.events]

def _session_has_conversion(session) -> bool:
    return any(_is_conversion_event(event_type) for event_type in _session_event_types(session))

def _session_product_interest(session) -> bool:
    product_pages = {
        "investment-plans",
        "investment_plans",
        "mutual-funds",
        "mutual_funds",
        "sip-plans",
        "sip_plans",
        "investment-calculator",
        "investment_calculator",
        "plan-comparison",
        "plan_comparison",
        "insurance-plans",
        "insurance_plans",
        "product-details",
        "product_details",
    }
    interest_events = {
        "product_view",
        "comparison",
        "calculator_usage",
        "download_brochure",
        "contact_advisor",
        "investment_intent",
        "cta_click",
        "button_click",
    }

    for event in session.events:
        event_type = session.display_event_type(event)
        page = str(event.get("page_id") or "").strip("/")
        if event_type in interest_events:
            return True
        if any(page.startswith(product_page) for product_page in product_pages):
            return True
    return False

def _build_navigation_paths(sessions: List[Any]) -> Dict[str, Any]:
    total_sessions = len(sessions)
    if not total_sessions:
        return {
            "summary": {
                "total_sessions": 0,
                "unique_paths": 0,
                "converted_sessions": 0,
                "avg_conversion_rate": 0,
                "generated_at": datetime.now(timezone.utc).isoformat(),
            },
            "paths": [],
        }

    path_map: Dict[tuple, Dict[str, Any]] = {}
    prefix_counts: Dict[tuple, int] = {}
    converted_sessions = 0

    for session in sessions:
        metrics = session.session_metrics()
        raw_nodes = [step.get("page") for step in metrics.get("navigation_flow", []) if step.get("page")]

        if not raw_nodes:
            raw_nodes = [
                event.get("page_id")
                for event in session.events
                if event.get("page_id") and session.display_event_type(event) in {"page_view", "return_visit", "repeated_page_visit"}
            ]

        nodes = []
        for node in raw_nodes:
            normalized = str(node).strip().strip("/") or "landing"
            if not nodes or nodes[-1] != normalized:
                nodes.append(normalized)

        if not nodes:
            continue

        if len(nodes) > 6:
            nodes = nodes[:6]

        key = tuple(nodes)
        converted = _session_has_conversion(session)
        converted_sessions += 1 if converted else 0

        for index in range(1, len(nodes) + 1):
            prefix = tuple(nodes[:index])
            prefix_counts[prefix] = prefix_counts.get(prefix, 0) + 1

        if key not in path_map:
            path_map[key] = {
                "nodes": nodes,
                "users": 0,
                "duration": 0,
                "score": 0,
                "conversions": 0,
                "hesitations": 0,
                "frustrations": 0,
                "repeats": 0,
            }

        entry = path_map[key]
        event_counts = metrics.get("event_counts", {})
        entry["users"] += 1
        entry["duration"] += metrics.get("total_duration", 0)
        entry["score"] += session.total_score or 0
        entry["conversions"] += 1 if converted else 0
        entry["hesitations"] += 1 if session.intent_state == "HESITATING" else 0
        entry["frustrations"] += 1 if session.intent_state == "FRUSTRATED" else 0
        entry["repeats"] += event_counts.get("repeated_page_visit", 0)

    avg_conversion_rate = round((converted_sessions / total_sessions) * 100, 1) if total_sessions else 0
    ranked_paths = []

    for index, (key, entry) in enumerate(sorted(path_map.items(), key=lambda item: item[1]["users"], reverse=True), start=1):
        users = entry["users"]
        conversion_rate = round((entry["conversions"] / users) * 100, 1) if users else 0
        avg_score = round(entry["score"] / users, 1) if users else 0
        avg_duration = entry["duration"] / users if users else 0

        if conversion_rate >= max(50, avg_conversion_rate + 10) or avg_score >= 75:
            sentiment = "High Intent"
        elif entry["frustrations"] > 0:
            sentiment = "Friction"
        elif entry["hesitations"] > 0 or entry["repeats"] > 0:
            sentiment = "Hesitant"
        else:
            sentiment = "Positive"

        edges = []
        nodes = list(key)
        for node_index in range(len(nodes) - 1):
            prefix = tuple(nodes[:node_index + 1])
            next_prefix = tuple(nodes[:node_index + 2])
            from_count = prefix_counts.get(prefix, 0)
            to_count = prefix_counts.get(next_prefix, 0)
            edges.append({
                "from": _page_label(nodes[node_index]),
                "to": _page_label(nodes[node_index + 1]),
                "rate": round((to_count / from_count) * 100) if from_count else 0,
                "users": to_count,
            })

        ranked_paths.append({
            "id": f"path-{index}",
            "nodes": [_page_label(node) for node in nodes],
            "nodeKeys": nodes,
            "frequency": round((users / total_sessions) * 100, 1),
            "frequencyLabel": f"{round((users / total_sessions) * 100, 1)}%",
            "users": users,
            "avgDuration": round(avg_duration),
            "timeSpent": _format_duration(avg_duration),
            "sentiment": sentiment,
            "conversionRate": conversion_rate,
            "conversionLift": round(conversion_rate - avg_conversion_rate, 1),
            "avgScore": avg_score,
            "edges": edges,
        })

    return {
        "summary": {
            "total_sessions": total_sessions,
            "unique_paths": len(path_map),
            "converted_sessions": converted_sessions,
            "avg_conversion_rate": avg_conversion_rate,
            "generated_at": datetime.now(timezone.utc).isoformat(),
        },
        "paths": ranked_paths[:12],
    }

def _build_conversion_funnel(sessions: List[Any]) -> Dict[str, Any]:
    total_sessions = len(sessions)
    stage_counts = {
        "VISITORS": total_sessions,
        "ENGAGED": 0,
        "PRODUCT_INTEREST": 0,
        "APPLICATION_STARTED": 0,
        "APPLICATION_COMPLETED": 0,
    }
    discarded = 0
    stage_users: Dict[str, List[str]] = {key: [] for key in stage_counts}

    for session in sessions:
        event_types = _session_event_types(session)
        metrics = session.session_metrics()

        has_completion = any(_is_conversion_event(event_type) for event_type in event_types)
        has_started = any(_is_form_start_event(event_type) for event_type in event_types) or has_completion
        has_product_interest = _session_product_interest(session) or has_started
        engaged = (
            len(metrics.get("pages_visited", [])) > 1
            or metrics.get("total_duration", 0) >= 30
            or any(event_type in {"button_click", "cta_click", "scroll_depth", "time_spent", "chatbot_message"} for event_type in event_types)
            or has_product_interest
        )
        discarded += 1 if any(_is_form_abandon_event(event_type) for event_type in event_types) else 0

        reached = {
            "VISITORS": True,
            "ENGAGED": engaged,
            "PRODUCT_INTEREST": has_product_interest,
            "APPLICATION_STARTED": has_started,
            "APPLICATION_COMPLETED": has_completion,
        }

        for stage, value in reached.items():
            if value:
                stage_counts[stage] += 0 if stage == "VISITORS" else 1
                stage_users[stage].append(session.user_id)

    stage_defs = [
        ("VISITORS", "Visitors", "#6366f1"),
        ("ENGAGED", "Engaged Sessions", "#3b82f6"),
        ("PRODUCT_INTEREST", "Product Interest", "#a855f7"),
        ("APPLICATION_STARTED", "Application Started", "#f59e0b"),
        ("APPLICATION_COMPLETED", "Application Completed", "#10b981"),
    ]

    stages = []
    previous_count = None
    for stage, label, color in stage_defs:
        count = stage_counts[stage]
        previous = previous_count if previous_count is not None else count
        drop_off = round(100 - ((count / previous) * 100), 1) if previous else 0
        percentage = round((count / total_sessions) * 100, 1) if total_sessions else 0
        stages.append({
            "stage": stage,
            "label": label,
            "count": count,
            "percentage": percentage,
            "dropOff": max(0, drop_off),
            "color": color,
            "users": stage_users[stage][:20],
        })
        previous_count = count

    worst_drop = max(stages[1:], key=lambda stage: stage["dropOff"], default=None)
    insight = "No live sessions have reached the funnel yet."
    if worst_drop:
        insight = f"Largest live drop-off is before {worst_drop['label']} at {worst_drop['dropOff']}%."

    return {
        "summary": {
            "total_sessions": total_sessions,
            "completion_rate": round((stage_counts["APPLICATION_COMPLETED"] / total_sessions) * 100, 1) if total_sessions else 0,
            "discard_rate": round((discarded / max(stage_counts["APPLICATION_STARTED"], 1)) * 100, 1) if stage_counts["APPLICATION_STARTED"] else 0,
            "discarded": discarded,
            "generated_at": datetime.now(timezone.utc).isoformat(),
            "insight": insight,
        },
        "stages": stages,
    }

def _build_realtime_alerts(sessions: List[Any], high_intent_threshold: float = 75) -> Dict[str, Any]:
    alerts: List[Dict[str, Any]] = []
    now = time.time()
    recent_cutoff = now - (30 * 60)

    def add_alert(alert: Dict[str, Any]):
        alert.setdefault("timestamp", now)
        alert.setdefault("source", "engine")
        alerts.append(alert)

    for session in sessions:
        metadata = session.metadata or {}
        display_name = metadata.get("name") or metadata.get("email") or session.user_id
        metrics = session.session_metrics()

        last_states = session.metadata.get('last_states', [])
        is_frustrated = "FRUSTRATED" in last_states or "FRUSTRATED_USER" in session.metadata.get('last_patterns', [])
        is_hesitant = "HESITANT" in last_states or "HESITANT_INVESTOR" in session.metadata.get('last_patterns', [])

        if is_frustrated:
            add_alert({
                "id": f"state-{session.user_id}-FRUSTRATED",
                "user_id": session.user_id,
                "type": "CRITICAL",
                "title": "Frustrated Session",
                "message": f"{display_name} is showing frustration with score {round(session.total_score, 1)}.",
                "timestamp": session.last_active,
                "page": metrics.get("navigation_flow", [{}])[-1].get("page") if metrics.get("navigation_flow") else None,
                "score": round(session.total_score, 1),
            })
        if is_hesitant:
            add_alert({
                "id": f"state-{session.user_id}-HESITANT",
                "user_id": session.user_id,
                "type": "WARNING",
                "title": "Hesitant Session",
                "message": f"{display_name} is showing hesitation with score {round(session.total_score, 1)}.",
                "timestamp": session.last_active,
                "page": metrics.get("navigation_flow", [{}])[-1].get("page") if metrics.get("navigation_flow") else None,
                "score": round(session.total_score, 1),
            })

        if len(session.manual_interventions) > 0:
            add_alert({
                "id": f"intervention-{session.user_id}-{len(session.manual_interventions)}",
                "user_id": session.user_id,
                "type": "INFO",
                "title": "Intervention Queued",
                "message": f"{len(session.manual_interventions)} admin intervention is waiting for {display_name}.",
                "timestamp": session.last_active,
                "page": metrics.get("navigation_flow", [{}])[-1].get("page") if metrics.get("navigation_flow") else None,
                "score": round(session.total_score, 1),
            })

        if session.total_score >= high_intent_threshold:
            add_alert({
                "id": f"high-intent-{session.user_id}",
                "user_id": session.user_id,
                "type": "INFO",
                "title": "High Intent User Active",
                "message": f"{display_name} crossed the high-intent threshold with score {round(session.total_score, 1)}.",
                "timestamp": session.last_active,
                "page": metrics.get("navigation_flow", [{}])[-1].get("page") if metrics.get("navigation_flow") else None,
                "score": round(session.total_score, 1),
            })

        for index, event in enumerate(session.events[-30:]):
            event_type = session.display_event_type(event)
            timestamp = event.get("timestamp", session.last_active)
            if timestamp < recent_cutoff:
                continue

            page = event.get("page_id")
            if event_type in {"rage_click", "rapid_click"}:
                add_alert({
                    "id": f"{event_type}-{session.user_id}-{timestamp}-{index}",
                    "user_id": session.user_id,
                    "type": "CRITICAL" if event_type == "rage_click" else "WARNING",
                    "title": "Click Friction Detected",
                    "message": f"{display_name} triggered {event_type.replace('_', ' ')} on {_page_label(page)}.",
                    "timestamp": timestamp,
                    "page": page,
                    "event_type": event_type,
                    "score": round(session.total_score, 1),
                })
            elif _is_form_abandon_event(event_type):
                add_alert({
                    "id": f"abandon-{session.user_id}-{timestamp}-{index}",
                    "user_id": session.user_id,
                    "type": "CRITICAL" if event_type == "checkout_abandon" else "WARNING",
                    "title": "Application Drop-Off",
                    "message": f"{display_name} abandoned the application flow on {_page_label(page)}.",
                    "timestamp": timestamp,
                    "page": page,
                    "event_type": event_type,
                    "score": round(session.total_score, 1),
                })
            elif event_type in {"inactive_session", "idle_timeout"}:
                add_alert({
                    "id": f"inactive-{session.user_id}-{timestamp}-{index}",
                    "user_id": session.user_id,
                    "type": "WARNING",
                    "title": "Inactive Session",
                    "message": f"{display_name} went inactive on {_page_label(page)}.",
                    "timestamp": timestamp,
                    "page": page,
                    "event_type": event_type,
                    "score": round(session.total_score, 1),
                })
            elif event_type == "bounce":
                add_alert({
                    "id": f"bounce-{session.user_id}-{timestamp}-{index}",
                    "user_id": session.user_id,
                    "type": "WARNING",
                    "title": "Bounce Detected",
                    "message": f"{display_name} bounced after visiting {_page_label(page)}.",
                    "timestamp": timestamp,
                    "page": page,
                    "event_type": event_type,
                    "score": round(session.total_score, 1),
                })

    severity_rank = {"CRITICAL": 3, "WARNING": 2, "INFO": 1}
    deduped = {alert["id"]: alert for alert in alerts}
    sorted_alerts = sorted(
        deduped.values(),
        key=lambda alert: (severity_rank.get(alert.get("type"), 0), alert.get("timestamp", 0)),
        reverse=True,
    )

    return {
        "summary": {
            "total": len(sorted_alerts),
            "critical": sum(1 for alert in sorted_alerts if alert.get("type") == "CRITICAL"),
            "warning": sum(1 for alert in sorted_alerts if alert.get("type") == "WARNING"),
            "info": sum(1 for alert in sorted_alerts if alert.get("type") == "INFO"),
            "generated_at": datetime.now(timezone.utc).isoformat(),
        },
        "alerts": sorted_alerts[:100],
    }

def create_admin_router(session_manager: SessionManager):
    router = APIRouter(prefix="/admin", tags=["Admin Control Panel"])
    global_model = GlobalIntentModel()
    seg_model = GlobalSegmentationModel()

    @router.get("/active-users")
    async def get_active_users():
        cached = _cache.get("active-users")
        if cached is not None:
            return cached

        # Prune ended sessions older than 10 minutes to prevent memory leaks
        session_manager.prune_ended_sessions()

        results = []
        for item in _deduped_sessions(session_manager, active_only=True):
            try:
                session = item["session"]
                data = session.to_dict()
                data['persona'] = _safe_persona(seg_model, session.events)
                data['metadata'] = session.metadata or {}
                data['aliases'] = sorted(item["aliases"])
                data['duplicate_count'] = len(item["aliases"])
                results.append(data)
            except Exception as exc:
                print(f"Skipping malformed session in active-users: {exc}")

        results = _sanitize(results)
        _cache.set("active-users", results, ttl=2.0)
        return results

    @router.get("/all-users")
    async def get_all_users():
        cached = _cache.get("all-users")
        if cached is not None:
            return cached

        # Prune ended sessions older than 10 minutes to prevent memory leaks
        session_manager.prune_ended_sessions()

        results = []
        for item in _deduped_sessions(session_manager, active_only=False):
            try:
                session = item["session"]
                data = session.to_dict()
                data['persona'] = _safe_persona(seg_model, session.events)
                data['metadata'] = session.metadata or {}
                data['aliases'] = sorted(item["aliases"])
                data['duplicate_count'] = len(item["aliases"])
                results.append(data)
            except Exception as exc:
                print(f"Skipping malformed session in all-users: {exc}")

        results = _sanitize(results)
        _cache.set("all-users", results, ttl=2.0)
        return results

    # --- NEW CONTROL ENDPOINTS ---

    @router.get("/config")
    async def get_config():
        """View current engine weights and detector settings."""
        return {
            "page_weights": session_manager.config.page_weights,
            "action_weights": session_manager.config.action_weights,
            "detectors_enabled": session_manager.config.detectors_enabled,
            "score_thresholds": session_manager.config.score_thresholds
        }

    @router.post("/config/update")
    async def update_config(update: ConfigUpdate):
        """Dynamically update engine parameters without restart."""
        session_manager.config.update(update.model_dump(exclude_none=True))
        return {"status": "success", "new_config": await get_config()}

    @router.post("/manual-intervention")
    async def trigger_manual_intervention(intervention: ManualIntervention):
        """Force a specific message/popup to a live user."""
        return _queue_popup(session_manager, intervention.model_dump())

    @router.post("/notification/dispatch")
    async def dispatch_notification(notification: NotificationDispatch):
        """Send a targeted popup/push/email to one selected user session."""
        payload = notification.model_dump()

        if payload["user_id"] not in session_manager.sessions:
            raise HTTPException(status_code=404, detail="User session not found")

        if payload.get("schedule_at"):
            try:
                schedule_at = datetime.fromisoformat(payload["schedule_at"].replace("Z", "+00:00"))
                if schedule_at.tzinfo is None:
                    schedule_at = schedule_at.replace(tzinfo=timezone.utc)
                delay = max(0, (schedule_at - datetime.now(timezone.utc)).total_seconds())
            except ValueError:
                raise HTTPException(status_code=400, detail="schedule_at must be an ISO datetime")

            async def scheduled_dispatch():
                await asyncio.sleep(delay)
                await _dispatch_notification(session_manager, payload)

            asyncio.create_task(scheduled_dispatch())
            return {
                "status": "scheduled",
                "user_id": payload["user_id"],
                "channels": payload["channels"],
                "schedule_at": payload["schedule_at"],
            }

        return {
            "status": "dispatched",
            "user_id": payload["user_id"],
            "channels": payload["channels"],
            "results": await _dispatch_notification(session_manager, payload),
        }

    @router.get("/interventions/{user_id}")
    async def poll_interventions(user_id: str):
        """Frontend polling endpoint for targeted in-app popups."""
        if user_id not in session_manager.sessions:
            return {"user_id": user_id, "interventions": []}

        session = session_manager.sessions[user_id]
        return {"user_id": user_id, "interventions": session.pop_interventions()}

    @router.delete("/session/{user_id}")
    async def delete_user_session(user_id: str):
        """Immediately clear a specific user's history and state."""
        deleted = _delete_sessions_by_identifiers(session_manager, [user_id])
        return {"status": "deleted", "user_id": user_id, "deleted": deleted}

    @router.post("/sessions/delete")
    async def delete_user_sessions(request: DeleteSessionsRequest):
        """Clear all live engine sessions matching any supplied user/session/email alias."""
        deleted = _delete_sessions_by_identifiers(session_manager, request.identifiers)
        return {"status": "deleted", "deleted": deleted}

    @router.post("/reset-all-sessions")
    async def reset_all_sessions():
        """Clear all active user data from the engine."""
        session_manager.sessions.clear()
        return {"status": "engine_reset_complete"}

    # --- ML & ANALYTICS ---

    @router.post("/train-global-model")
    async def train_global_model():
        all_sessions = [s.events for s in session_manager.sessions.values()]
        if not all_sessions:
            return {"status": "error", "message": "No sessions available for training."}
        training_result = global_model.train_on_global_data(all_sessions)
        segmentation_result = seg_model.fit_segments(all_sessions)
        _cache.invalidate()
        return {
            "status": "training_complete",
            "session_count": len(all_sessions),
            "conversion_model": training_result,
            "segmentation_model": segmentation_result,
        }

    @router.get("/analytics/summary")
    async def get_analytics_summary():
        cached = _cache.get("analytics-summary")
        if cached is not None:
            return cached

        sessions = [item["session"] for item in _deduped_sessions(session_manager)]
        if not sessions:
            return {
                "total_users": 0,
                "total_events": 0,
                "avg_score": 0,
                "avg_session_duration": 0,
                "bounce_rate": 0,
                "returning_users": 0,
                "event_counts": {},
                "behavioral_distribution": {},
                "clustering_segments": {},
                "rapid_clicks": 0,
                "inactive_sessions": 0,
                "mouse_movement_events": 0,
                "repeated_page_visits": 0,
                "global_model_status": "active"
            }
        states_count = {}
        segment_count = {}
        event_counts = {}
        total_score = 0
        total_conv_prob = 0
        total_events = 0
        total_duration = 0
        bounced_sessions = 0
        returning_users = 0
        inactive_sessions = 0
        rapid_clicks = 0
        mouse_movement_events = 0
        repeated_page_visits = 0
        page_visit_counts = {}

        for s in sessions:
            metrics = s.session_metrics()
            states_count[s.intent_state] = states_count.get(s.intent_state, 0) + 1
            persona = _safe_persona(seg_model, s.events)
            segment_count[persona] = segment_count.get(persona, 0) + 1
            total_score += s.total_score
            total_conv_prob += s.metadata.get('conversion_probability', 0)
            total_events += len(s.events)
            total_duration += metrics['total_duration']
            bounced_sessions += 1 if metrics['bounce'] else 0
            returning_users += 1 if metrics['returning_user'] else 0
            inactive_sessions += 1 if metrics['inactive_detected'] else 0
            rapid_clicks += metrics['rapid_clicks']
            mouse_movement_events += metrics['event_counts'].get('mouse_movement', 0)
            repeated_page_visits += metrics['repeated_page_visits']
            
            for page in metrics['pages_visited']:
                page_visit_counts[page] = page_visit_counts.get(page, 0) + 1

            for event_type, count in metrics['event_counts'].items():
                event_counts[event_type] = event_counts.get(event_type, 0) + count

        result = {
            "total_users": len(sessions),
            "total_events": total_events,
            "avg_score": total_score / len(sessions),
            "avg_session_duration": total_duration / len(sessions),
            "avg_conversion_probability": total_conv_prob / len(sessions),
            "bounce_rate": (bounced_sessions / len(sessions)) * 100,
            "returning_users": returning_users,
            "event_counts": event_counts,
            "rapid_clicks": rapid_clicks,
            "inactive_sessions": inactive_sessions,
            "mouse_movement_events": mouse_movement_events,
            "repeated_page_visits": repeated_page_visits,
            "top_pages": sorted(page_visit_counts.items(), key=lambda x: x[1], reverse=True)[:10],
            "form_analytics": _build_form_analytics(sessions),
            "behavioral_distribution": states_count,
            "clustering_segments": segment_count,
            "global_model_status": "active"
        }
        result = _sanitize(result)
        _cache.set("analytics-summary", result, ttl=3.0)
        return result

    @router.get("/analytics/navigation-paths")
    async def get_navigation_paths():
        """Build common navigation sequences from actual live session page views."""
        cached = _cache.get("navigation-paths")
        if cached is not None:
            return cached
        sessions = [item["session"] for item in _deduped_sessions(session_manager)]
        result = _build_navigation_paths(sessions)
        _cache.set("navigation-paths", result, ttl=3.0)
        return result

    @router.get("/analytics/conversion-funnel")
    async def get_conversion_funnel():
        """Build a conversion funnel from real event progression across live sessions."""
        cached = _cache.get("conversion-funnel")
        if cached is not None:
            return cached
        sessions = [item["session"] for item in _deduped_sessions(session_manager)]
        result = _build_conversion_funnel(sessions)
        _cache.set("conversion-funnel", result, ttl=8.0)
        return result

    @router.get("/heatmap")
    async def get_engine_heatmap(limit: int = 500):
        """Return events with coordinates from in-memory sessions for heatmap rendering.
        Returns up to `limit` events per user. Events without coordinates get synthetic
        positions based on page name so multi-page navigation is visible."""
        import hashlib
        HEATMAP_TYPES = {
            "button_click", "cta_click", "click", "rapid_click", "rage_click", "hover",
            "page_view", "page_visit", "mouse_movement", "scroll_depth", "scroll_completion",
            "repeated_page_visit", "repeat_page_visit",
        }
        # Synthetic coordinate clusters per page (center x, y, spread radius)
        PAGE_CLUSTERS = {
            "landing": (720, 400, 200),
            "investment_plans": (400, 500, 150),
            "mutual_funds": (700, 500, 150),
            "sip_plans": (960, 450, 150),
            "investment_calculator": (960, 350, 100),
            "plan_comparison": (720, 520, 180),
            "insurance_plans": (600, 500, 150),
            "product_details/term_life": (960, 430, 110),
            "application_form": (795, 520, 85),
            "faq": (440, 400, 200),
            "contact": (795, 500, 100),
            "dashboard": (720, 400, 200),
            "portfolio": (720, 450, 150),
            "transactions": (720, 500, 150),
            "profile_settings": (720, 350, 100),
            "beginner_guides": (600, 450, 150),
        }
        events_out = []
        total_sessions = len(session_manager.sessions)
        total_events_scanned = 0
        for uid, session in session_manager.sessions.items():
            meta = session.metadata or {}
            user_event_count = 0
            for ev in session.events:
                total_events_scanned += 1
                ev_type = ev.get("event_type", "")
                if ev_type not in HEATMAP_TYPES:
                    continue
                x = ev.get("x")
                y = ev.get("y")
                page = ev.get("page_id", "unknown")
                # Generate synthetic coordinates for events without x/y
                if x is None or y is None:
                    cluster = PAGE_CLUSTERS.get(page, PAGE_CLUSTERS["landing"])
                    cx, cy, r = cluster
                    # Deterministic jitter based on event hash so dots spread out
                    h = int(hashlib.md5(f"{uid}{ev.get('timestamp',0)}{ev_type}".encode()).hexdigest()[:8], 16)
                    import math
                    angle = (h % 360) * math.pi / 180
                    dist = (h % 1000) / 1000 * r
                    x = round(cx + math.cos(angle) * dist)
                    y = round(cy + math.sin(angle) * dist)
                ev_meta = ev.get("metadata") or {}
                events_out.append({
                    "eventType": ev_type,
                    "page": page,
                    "element": ev.get("element_id"),
                    "x": x,
                    "y": y,
                    "timestamp": ev.get("timestamp"),
                    "userId": {"_id": uid, "fullName": meta.get("name") or ev_meta.get("userName"), "email": meta.get("email") or ev_meta.get("userEmail")},
                    "metadata": {
                        "screenWidth": ev_meta.get("screenWidth") or 1440,
                        "screenHeight": ev_meta.get("screenHeight") or 900,
                        "simulated": ev_meta.get("simulated", False),
                        "isGuest": ev_meta.get("isGuest", False),
                        "guestId": ev_meta.get("guestId"),
                    },
                })
                user_event_count += 1
                if user_event_count >= limit:
                    break
        print(f"[Heatmap] {total_sessions} sessions, {total_events_scanned} events scanned, {len(events_out)} events with coords returned")
        events_out.sort(key=lambda e: e.get("timestamp") or 0, reverse=True)
        return {"success": True, "events": events_out}

    @router.get("/alerts")
    async def get_realtime_alerts():
        """Return real-time alerts derived from current behavioral signals."""
        cached = _cache.get("alerts")
        if cached is not None:
            return cached
        sessions = [item["session"] for item in _deduped_sessions(session_manager)]
        threshold = session_manager.config.score_thresholds.get("high_intent", 75)
        result = _build_realtime_alerts(sessions, threshold)
        _cache.set("alerts", result, ttl=3.0)
        return result

    @router.get("/user-report/{user_id}")
    async def get_deep_user_report(user_id: str):
        """Generates an exhaustive, 'Google Hackathon' level behavioral dossier for a user."""
        cache_key = f"user-report:{user_id}"
        cached = _cache.get(cache_key)
        if cached is not None:
            return cached

        if user_id not in session_manager.sessions:
            raise HTTPException(status_code=404, detail="User not found")

        session = session_manager.sessions[user_id]
        events = session.events
        metrics = session.session_metrics()
        temporal_analysis = TemporalEngine.analyze_timing(events)
        
        # 1. Timeline Analysis
        total_time = metrics['total_duration']
        
        # 2. Page Affinity (Which pages did they love?)
        affinity = {}
        for e in events:
            if e['event_type'] in ['page_visit', 'pricing_view', 'comparison_view', 'category_exploration']:
                affinity[e['page_id']] = affinity.get(e['page_id'], 0) + 1
        
        # 3. Engagement Metrics
        avg_scroll = sum([(e.get('scroll_depth') or 0) for e in events]) / len(events) if events else 0
        total_idle = sum([(e.get('idle_time') or 0) for e in events])
        
        # 4. ML Intelligence & Narrative
        ml_data = global_model.predict_conversion_probability(events)
        
        result = {
            "summary": {
                "user_id": user_id,
                "session_duration_sec": total_time,
                "overall_score": session.total_score,
                "final_intent": session.intent_state,
                "persona": _safe_persona(seg_model, events)
            },
            "engagement_metrics": {
                "avg_scroll_depth": f"{avg_scroll:.1f}%",
                "active_ratio": f"{((total_time - total_idle) / total_time * 100):.1f}%" if total_time > 0 else "0%",
                "total_idle_time_sec": total_idle,
                "navigation_entropy": len(affinity) / len(events) if events else 0,
                "pages_visited": len(metrics['pages_visited']),
                "navigation_steps": len(metrics['navigation_flow']),
                "bounce": metrics['bounce'],
                "returning_user": metrics['returning_user']
            },
            "top_pages": sorted(affinity.items(), key=lambda x: x[1], reverse=True),
            "psychological_flags": {
                "rage_click_detected": any(e['event_type'] == 'rage_click' for e in events),
                "high_hesitation": temporal_analysis['hesitation_pause_detected'] or temporal_analysis['hover_tendency'] == "REPEATED_HESITATION",
                "churn_risk": ml_data['drop_off_prediction'] == "HIGH",
                "inactive_session": metrics['inactive_detected'],
                "bounce_detected": metrics['bounce']
            },
            "ml_intelligence": ml_data,
            "narrative": session.metadata.get('last_narrative', "No narrative generated yet."),
            "recommendations": session.metadata.get('last_recommendations', []),
            "raw_timeline_event_count": len(events),
            "events": events[-100:], # Return last 100 events for detailed timeline
            "session": {
                "session_start": metrics['session_start'],
                "session_end": metrics['session_end'],
                "total_duration": metrics['total_duration'],
                "pages_visited": metrics['pages_visited'],
                "navigation_flow": metrics['navigation_flow'],
                "event_counts": metrics['event_counts'],
                "bounce": metrics['bounce'],
                "returning_user": metrics['returning_user'],
                "rapid_clicks": metrics['rapid_clicks'],
                "inactive_detected": metrics['inactive_detected'],
                "mouse_movement_count": metrics['mouse_movement_count'],
                "repeated_page_visits": metrics['repeated_page_visits'],
            },
            "replay_timeline": metrics['replay_timeline']
        }
        result = _sanitize(result)
        _cache.set(cache_key, result, ttl=4.0)
        return result

    @router.get("/ai-insights")
    async def get_ai_insights():
        """Aggregate behavioral data across all active sessions into AI-generated insights."""
        cached = _cache.get("ai-insights")
        if cached is not None:
            return cached

        sessions = [item["session"] for item in _deduped_sessions(session_manager, active_only=True)]
        if not sessions:
            return {"insights": [], "summary": "No active sessions.", "kpis": {}, "total_sessions": 0}

        # ─── Aggregations ───
        behavior_counts = {}
        persona_counts = {}
        intent_scores = []
        churn_risks = []
        top_pages = {}
        high_intent_users = []
        hesitant_users = []
        form_abandons = []
        rage_click_users = []
        engagement_scores = []
        session_durations = []
        event_type_counts = {}
        conversion_candidates = []
        total_events = 0

        for s in sessions:
            metrics = s.session_metrics()
            events = s.events
            meta = s.metadata or {}
            email = meta.get("email") or meta.get("userEmail") or "unknown"
            total_events += len(events)

            # Behavior states
            state = s.intent_state or "EXPLORING"
            behavior_counts[state] = behavior_counts.get(state, 0) + 1

            # Personas
            try:
                persona = seg_model.get_persona(events)
                persona_counts[persona] = persona_counts.get(persona, 0) + 1
            except Exception:
                pass

            # Intent scores
            if s.total_score > 0:
                intent_scores.append({"email": email, "score": round(s.total_score, 1), "state": state})

            # Churn risk
            try:
                ml_data = global_model.predict_conversion_probability(events)
                churn = ml_data.get("churn_prediction", 0)
                conversion_prob = ml_data.get("conversion_probability", 0)
                if churn > 0.6:
                    churn_risks.append({"email": email, "churn": round(churn, 2)})
                if conversion_prob > 0.5:
                    conversion_candidates.append({"email": email, "probability": round(conversion_prob, 2)})
            except Exception:
                pass

            # Page visits
            for page in metrics.get("pages_visited", []):
                top_pages[page] = top_pages.get(page, 0) + 1

            # High intent users
            if s.total_score >= 60:
                high_intent_users.append({"email": email, "score": round(s.total_score, 1)})

            # Hesitant users
            if state in ("HESITANT", "CONFUSED"):
                hesitant_users.append({"email": email, "state": state})

            # Form abandonment
            for ev in events:
                etype = getattr(ev, 'event_type', None) or (ev.get('event_type') if isinstance(ev, dict) else None)
                if etype == 'form_abandon':
                    form_abandons.append({"email": email, "page": getattr(ev, 'page', None) or (ev.get('page') if isinstance(ev, dict) else None)})
                if etype == 'rage_click':
                    rage_click_users.append(email)

            # Engagement score
            eng = getattr(s, 'engagement_score', None) or (s.get('engagement_score') if isinstance(s, dict) else None) or 0
            engagement_scores.append(eng)

            # Session duration
            start = getattr(s, 'session_start', None) or (s.get('session_start') if isinstance(s, dict) else None)
            if start:
                try:
                    dur = (datetime.now(timezone.utc) - start).total_seconds() / 60
                    session_durations.append(dur)
                except Exception:
                    pass

            # Event type distribution
            for ev in events:
                etype = getattr(ev, 'event_type', None) or (ev.get('event_type') if isinstance(ev, dict) else None)
                if etype:
                    event_type_counts[etype] = event_type_counts.get(etype, 0) + 1

        # ─── KPIs ───
        avg_intent = sum(u["score"] for u in intent_scores) / len(intent_scores) if intent_scores else 0
        avg_engagement = sum(engagement_scores) / len(engagement_scores) if engagement_scores else 0
        avg_duration = sum(session_durations) / len(session_durations) if session_durations else 0
        conversion_rate = len(conversion_candidates) / len(sessions) * 100 if sessions else 0

        kpis = {
            "total_sessions": len(sessions),
            "total_events": total_events,
            "avg_intent_score": round(avg_intent, 1),
            "avg_engagement": round(avg_engagement, 1),
            "avg_session_minutes": round(avg_duration, 1),
            "conversion_rate": round(conversion_rate, 1),
            "high_intent_count": len(high_intent_users),
            "at_risk_count": len(churn_risks),
        }

        # ─── Build insights ───
        insights = []

        # 1. Behavioral patterns
        if behavior_counts:
            top_pattern = max(behavior_counts, key=behavior_counts.get)
            dist_pct = {k: round(v / len(sessions) * 100, 1) for k, v in behavior_counts.items()}
            insights.append({
                "category": "Behavioral Patterns",
                "icon": "activity",
                "title": f"Most users are in '{top_pattern}' state",
                "detail": f"{behavior_counts[top_pattern]} of {len(sessions)} active sessions ({dist_pct[top_pattern]}%)",
                "data": behavior_counts,
                "severity": "info",
                "action": "Monitor state transitions for optimization opportunities",
            })

        # 2. Interest clusters
        if persona_counts:
            top_persona = max(persona_counts, key=persona_counts.get)
            insights.append({
                "category": "Interest Clusters",
                "icon": "users",
                "title": f"Primary persona: {top_persona}",
                "detail": f"{persona_counts[top_persona]} users match this profile",
                "data": persona_counts,
                "severity": "info",
                "action": f"Tailor content and recommendations for {top_persona} segment",
            })

        # 3. Conversion signals
        if high_intent_users:
            avg_hi = sum(u['score'] for u in high_intent_users) / len(high_intent_users)
            insights.append({
                "category": "Conversion Signals",
                "icon": "trending-up",
                "title": f"{len(high_intent_users)} users showing high purchase intent",
                "detail": f"Average score: {avg_hi:.0f}/100 — these users are ready to convert",
                "data": sorted(high_intent_users, key=lambda x: -x["score"])[:10],
                "severity": "success",
                "action": "Trigger targeted offers or advisor callbacks for these users",
            })

        # 4. At-risk users
        if churn_risks:
            insights.append({
                "category": "At-Risk Users",
                "icon": "alert-triangle",
                "title": f"{len(churn_risks)} users at risk of churning",
                "detail": "High churn probability — consider re-engagement campaigns",
                "data": sorted(churn_risks, key=lambda x: -x["churn"])[:10],
                "severity": "warning",
                "action": "Send re-engagement notifications or offer incentives",
            })

        # 5. Hesitant users
        if hesitant_users:
            insights.append({
                "category": "Hesitation Detected",
                "icon": "pause",
                "title": f"{len(hesitant_users)} users showing hesitation",
                "detail": "These users need guidance or reassurance to proceed",
                "data": hesitant_users[:10],
                "severity": "warning",
                "action": "Show educational content or comparison guides",
            })

        # 6. Top pages
        if top_pages:
            sorted_pages = sorted(top_pages.items(), key=lambda x: -x[1])[:5]
            insights.append({
                "category": "Page Engagement",
                "icon": "map",
                "title": f"Most visited: {sorted_pages[0][0]}",
                "detail": f"{sorted_pages[0][1]} visits across top {len(sorted_pages)} pages",
                "data": dict(sorted_pages),
                "severity": "info",
                "action": "Optimize high-traffic pages for conversion",
            })

        # 7. Session duration
        if session_durations:
            avg_min = sum(session_durations) / len(session_durations)
            long_sessions = sum(1 for d in session_durations if d > 5)
            insights.append({
                "category": "Session Duration",
                "icon": "clock",
                "title": f"Average session: {avg_min:.1f} minutes",
                "detail": f"{long_sessions} sessions longer than 5 minutes — high engagement",
                "data": {"avg_minutes": round(avg_min, 1), "long_sessions": long_sessions, "total": len(session_durations)},
                "severity": "success" if avg_min > 2 else "warning",
                "action": "Long sessions indicate interest; short sessions may need UX improvement",
            })

        # 8. Form abandonment
        if form_abandons:
            abandon_pages = {}
            for fa in form_abandons:
                p = fa["page"] or "unknown"
                abandon_pages[p] = abandon_pages.get(p, 0) + 1
            top_abandon = max(abandon_pages, key=abandon_pages.get)
            insights.append({
                "category": "Form Abandonment",
                "icon": "x-circle",
                "title": f"{len(form_abandons)} form abandonments detected",
                "detail": f"Most abandoned: {top_abandon} ({abandon_pages[top_abandon]} times)",
                "data": abandon_pages,
                "severity": "warning",
                "action": "Simplify forms or add progress saving for abandonment-prone pages",
            })

        # 9. Rage clicks
        if rage_click_users:
            unique_rage = list(set(rage_click_users))
            insights.append({
                "category": "Frustration Signals",
                "icon": "zap",
                "title": f"{len(unique_rage)} users showing frustration (rage clicks)",
                "detail": "Repeated rapid clicks on unresponsive elements detected",
                "data": unique_rage[:10],
                "severity": "danger",
                "action": "Investigate UI elements causing frustration — may need responsiveness fixes",
            })

        # 10. Event distribution
        if event_type_counts:
            sorted_events = sorted(event_type_counts.items(), key=lambda x: -x[1])[:8]
            insights.append({
                "category": "Event Distribution",
                "icon": "bar-chart",
                "title": f"Top event: {sorted_events[0][0]} ({sorted_events[0][1]} fires)",
                "detail": f"{total_events} total events across {len(event_type_counts)} types",
                "data": dict(sorted_events),
                "severity": "info",
                "action": "Analyze event patterns to understand user interaction flow",
            })

        # 11. Conversion pipeline
        if conversion_candidates:
            insights.append({
                "category": "Conversion Pipeline",
                "icon": "target",
                "title": f"{len(conversion_candidates)} users likely to convert",
                "detail": f"ML model predicts >50% conversion probability",
                "data": sorted(conversion_candidates, key=lambda x: -x["probability"])[:10],
                "severity": "success",
                "action": "Prioritize these users for personalized offers and follow-ups",
            })

        # ─── Summary text ───
        summary_parts = []
        if high_intent_users:
            summary_parts.append(f"{len(high_intent_users)} high-intent users detected")
        if hesitant_users:
            summary_parts.append(f"{len(hesitant_users)} hesitant users need attention")
        if churn_risks:
            summary_parts.append(f"{len(churn_risks)} at risk of churning")
        if conversion_candidates:
            summary_parts.append(f"{len(conversion_candidates)} likely to convert")
        if rage_click_users:
            summary_parts.append(f"{len(set(rage_click_users))} showing frustration")
        summary = ". ".join(summary_parts) + "." if summary_parts else "All systems nominal. No critical signals detected."

        result = {
            "insights": insights,
            "summary": summary,
            "kpis": kpis,
            "total_sessions": len(sessions),
            "generated_at": time.time(),
        }
        result = _sanitize(result)
        _cache.set("ai-insights", result, ttl=15.0)
        return result

    # ── In-memory popup event tracking ──────────────────────────
    _popup_events: list = []

    @router.post("/popup-event")
    async def record_popup_event(event: dict):
        """Record a popup interaction event from the frontend."""
        _popup_events.append({
            **event,
            "recorded_at": time.time(),
        })
        # Keep only last 1000 events
        if len(_popup_events) > 1000:
            _popup_events[:] = _popup_events[-1000:]
        return {"success": True}

    @router.get("/popup-analytics")
    async def get_popup_analytics():
        """Aggregate popup interaction data for analytics."""
        cached = _cache.get("popup-analytics")
        if cached is not None:
            return cached

        shown = [e for e in _popup_events if e.get("type") == "shown"]
        clicked = [e for e in _popup_events if e.get("type") == "clicked"]
        dismissed = [e for e in _popup_events if e.get("type") == "dismissed"]

        total_shown = len(shown)
        total_clicked = len(clicked)
        total_dismissed = len(dismissed)
        ctr = (total_clicked / total_shown * 100) if total_shown > 0 else 0
        dismiss_rate = (total_dismissed / total_shown * 100) if total_shown > 0 else 0

        # Per trigger type breakdown
        trigger_stats = {}
        for e in _popup_events:
            ttype = e.get("triggerReason") or e.get("type") or "unknown"
            if ttype not in trigger_stats:
                trigger_stats[ttype] = {"shown": 0, "clicked": 0, "dismissed": 0}
            etype = e.get("type")
            if etype in trigger_stats[ttype]:
                trigger_stats[ttype][etype] += 1

        # Add CTR to each trigger type
        for ttype, stats in trigger_stats.items():
            stats["ctr"] = (stats["clicked"] / stats["shown"] * 100) if stats["shown"] > 0 else 0

        # Time series (last 24 hours, grouped by hour)
        now = time.time()
        hourly = {}
        for e in _popup_events:
            age_hours = int((now - e.get("recorded_at", now)) / 3600)
            if age_hours < 24:
                bucket = f"-{age_hours}h"
                if bucket not in hourly:
                    hourly[bucket] = {"shown": 0, "clicked": 0, "dismissed": 0}
                etype = e.get("type")
                if etype in hourly[bucket]:
                    hourly[bucket][etype] += 1

        result = {
            "overview": {
                "total_shown": total_shown,
                "total_clicked": total_clicked,
                "total_dismissed": total_dismissed,
                "ctr": round(ctr, 1),
                "dismiss_rate": round(dismiss_rate, 1),
            },
            "by_trigger": trigger_stats,
            "hourly": hourly,
            "total_events": len(_popup_events),
        }
        _cache.set("popup-analytics", result, ttl=10.0)
        return result

    return router
