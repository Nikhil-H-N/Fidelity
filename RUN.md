# Running the Platform

Four services make up the full stack. Each needs its own terminal.

---

## Prerequisites

- Python 3.9+
- Node.js 18+
- MongoDB (Atlas or local)

---

## Quick Start

### 1. Intelligence Engine (Python — port 8000)

```powershell
cd "path\to\project"
python -m venv venv
.\venv\Scripts\activate
pip install -r engine/requirements.txt
python -m engine.main
```

### 2. Backend API (Node.js — port 5000)

```powershell
cd Backend
npm install
copy .env.example .env    # configure MongoDB URI
npm run dev
```

### 3. Frontend Website (React — port 5173)

```powershell
cd Frontend
npm install
npm run dev
```

### 4. Admin Portal (React — port 5174)

```powershell
cd admin-portal
npm install
npm run dev
```

---

## Verifying It Works

1. Open **http://localhost:5174** (Admin Portal)
2. Open **http://localhost:5173** (Website) in a separate window
3. Sign up / log in on the website
4. Browse pages, click buttons, scroll
5. Watch live events appear in the Admin Portal's **Live Stream** tab

---

## Simulating Dummy Users

Populate the admin portal with realistic fake users for demo/testing. The engine must be running first.

### Live Mode (recommended for demos)

Sessions stay alive in the engine for 10 minutes — visible in Session Timeline and Heatmap. No MongoDB needed.

```powershell
cd Backend
npm run simulate:live
```

Options:
```powershell
npm run simulate:humans -- --mode=live --users=6 --live-minutes=15
```

| Flag | Default | Description |
|------|---------|-------------|
| `--mode=live` | — | Engine-only, real-time, keeps sessions alive |
| `--users=N` | 8 | Number of dummy users to create |
| `--live-minutes=N` | 10 | How long to keep sessions alive |
| `--email-domain=example.test` | example.test | Email domain for dummy users |

### Seed Mode (historical data)

Writes completed sessions to MongoDB and/or engine. Use for analytics testing.

```powershell
cd Backend
npm run simulate:humans                           # both DB + engine
npm run simulate:humans -- --mode=engine --users=8  # engine only
npm run simulate:humans -- --mode=db --users=10     # MongoDB only
npm run simulate:humans -- --dry-run                # preview, no writes
```

---

## Common Issues

| Problem | Fix |
|---------|-----|
| `ImportError: cannot import name 'POSITIVE_SIGNALS'` | Run `pip install -r engine/requirements.txt` — or check `engine/core/scorer.py` has the alias |
| Backend won't start | Check `.env` has a valid `MONGO_URI` |
| Frontend shows blank | Make sure Backend is running on port 5000 |
| Engine not receiving events | Verify `ENGINE_URL` in Backend `.env` points to `http://localhost:8000/analyze` |
| Admin Portal shows no users | Check Engine is running and accessible at port 8000 |
| `simulate:live` can't reach engine | Start the engine first: `cd engine && python -m uvicorn engine.main:app --port 8000` |
| Dummy users not appearing | Make sure you used `--mode=live`, not the default seed mode |

---

## Environment Variables

### Backend (`Backend/.env`)

```
MONGO_URI=mongodb+srv://...
JWT_SECRET=your-secret
ENGINE_URL=http://localhost:8000/analyze
PORT=5000
```

### Frontend (`Frontend/.env`)

```
VITE_API_URL=http://localhost:5000/api
```

---

## Architecture Overview

```
Frontend (5173)  ──events──>  Backend (5000)  ──forward──>  Engine (8000)
                                  │                              │
                                  ▼                              ▼
                              MongoDB                    In-Memory Sessions
                                                              │
                                                              ▼
                                                     Admin Portal (5174)
                                                       (polls /admin/*)
```

---

## Useful Endpoints

| Service | URL | Purpose |
|---------|-----|---------|
| Engine health | `GET http://localhost:8000/` | Check engine is alive |
| Engine docs | `GET http://localhost:8000/docs` | Swagger API docs |
| Active users | `GET http://localhost:8000/admin/active-users` | Live session list |
| Backend health | `GET http://localhost:5000/api/health` | Check backend is alive |
