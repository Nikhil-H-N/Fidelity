from fastapi import FastAPI, HTTPException
from fastapi.middleware.cors import CORSMiddleware
from .core.session_manager import SessionManager, Event
from .core.brain import DecisionBrain
from .admin.api import create_admin_router
import uvicorn
import os
import signal
import subprocess
import sys

app = FastAPI(
    title="Smart Behavioral Tracking Engine (SBTE)",
    description="Enterprise-grade behavioral intelligence for fintech platforms.",
    version="1.0.0"
)

# Enable CORS for frontend integration
app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_methods=["*"],
    allow_headers=["*"],
)

# Core Components
session_manager = SessionManager()
brain = DecisionBrain(session_manager.config)

# Include Admin Routes
app.include_router(create_admin_router(session_manager))

@app.get("/")
async def health_check():
    return {
        "status": "online",
        "engine": "Behavioral Intelligence v1.0",
        "active_sessions": len(session_manager.sessions)
    }

from .core.pipeline import EventValidator, EventNormalizer
# ... existing code ...

@app.post("/analyze")
async def analyze_interaction(event: Event):
    """
    Primary endpoint for real-time interaction tracking.
    Teammates: Ping this endpoint for every user interaction.
    """
    try:
        # Prune stale sessions on every call to prevent unbounded memory growth
        session_manager.prune_ended_sessions()

        # Pydantic V2: model_dump()
        event_dict = event.model_dump()
        print(f"[Event] {event_dict['event_type']} from user: {event_dict['user_id']}")
        
        # 0. Normalization (Section 42)
        event_dict = EventNormalizer.normalize(event_dict)
        
        # 1. Store event in session with validation (Section 41)
        session = session_manager.get_or_create_session(event_dict['user_id'])
        if not EventValidator.is_valid(event_dict, session.events):
            # If invalid/bot, return intelligence based on history only
            intelligence = brain.process_new_event(session, session.events[-1] if session.events else event_dict)
            intelligence["status"] = "REJECTED_BOT_OR_NOISE"
            return intelligence

        session = session_manager.add_event(Event(**event_dict))
        
        # 2. Process with Decision Brain
        intelligence = brain.process_new_event(session, event_dict)
        
        # 3. Handle manual interventions (Section 11, 25, 37)
        # Pull interventions from session and attach to response
        intelligence["interventions"] = session.pop_interventions()
        
        # Flatten for standard response
        return intelligence
    except Exception as e:
        import traceback
        print(f"ERROR: {str(e)}")
        traceback.print_exc()
        raise HTTPException(status_code=500, detail=f"Engine Internal Error: {str(e)}")

def kill_processes_on_port(port: int):
    """Stop stale local server processes bound to the given port before booting."""
    current_pid = os.getpid()
    pids = set()

    try:
      if os.name == "nt":
          output = subprocess.check_output(["netstat", "-ano"], text=True, stderr=subprocess.DEVNULL)
          for line in output.splitlines():
              parts = line.split()
              if len(parts) >= 5 and parts[1].endswith(f":{port}") and parts[3].upper() == "LISTENING":
                  pids.add(int(parts[4]))
      else:
          output = subprocess.check_output(["lsof", "-ti", f":{port}"], text=True, stderr=subprocess.DEVNULL)
          pids.update(int(pid) for pid in output.splitlines() if pid.strip().isdigit())
    except Exception:
        return

    for pid in pids:
        if pid == current_pid:
            continue
        try:
            if os.name == "nt":
                subprocess.run(["taskkill", "/PID", str(pid), "/F"], check=False, stdout=subprocess.DEVNULL, stderr=subprocess.DEVNULL)
            else:
                os.kill(pid, signal.SIGTERM)
        except Exception:
            pass

if __name__ == "__main__":
    kill_processes_on_port(8000)
    uvicorn.run(app, host="0.0.0.0", port=8000)
