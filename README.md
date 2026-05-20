# FinovaWealth Behavioral Re-Engagement Engine

FinovaWealth is a full-stack hackathon platform for silent behavioral tracking, intent scoring, conversion prediction, and automated re-engagement on a simulated financial services website.

## What It Does

- Tracks page visits, scroll depth, time spent, clicks, hovers, form progress, validation errors, checkout abandonment, lifecycle exits, and returning-user behavior.
- Scores investment intent and classifies users with rule-based and ML-backed intelligence.
- Shows live session timelines, funnels, heatmaps, ML intelligence, alerts, and notification controls in the admin portal.
- Generates in-app nudges and targeted admin interventions through the Python engine.
- Provides a complete fintech journey: landing, auth, financial products, calculators, comparisons, product details, checkout/application, confirmation, education pages, and a contextual AI assistant.

## Tech Stack

- Frontend: React, Vite, Tailwind CSS, Recharts, Framer Motion
- Admin Portal: React, Vite, Tailwind CSS, Recharts
- Backend API: Node.js, Express, MongoDB, JWT auth
- Intelligence Engine: FastAPI, scikit-learn, pandas

## Project Structure

- `Frontend/` - monitored fintech website and user dashboard
- `admin-portal/` - standalone behavioral command center
- `Backend/` - auth, event ingestion, persistence, analytics, notification logs
- `engine/` - real-time behavioral intelligence and admin engine APIs
- `GEMINI.md` - feature brief used for hackathon completion
- `RUN.md` - local run instructions
- `DATABASE_STRUCTURE.md` - detailed MongoDB collections, relationships, indexes, and event flow

## Demo Flow

1. Start the engine, backend, frontend, and admin portal using `RUN.md`.
2. Sign up or log in on the website.
3. Browse product pages, compare plans, use calculators, open the AI assistant, and start an application.
4. Abandon the application midway or submit it.
5. Open the admin portal to inspect live events, session replay, funnel changes, heatmap data, ML predictions, and intervention controls.

## Submission Highlights

- Real-time behavioral event pipeline from browser to Node API to Python engine.
- Checkout recovery and form abandonment tracking.
- Product interest memory across product views, comparisons, calculators, and advisor contact events.
- Explainable admin intelligence with narrative, persona, confidence, conversion probability, and recommendations.
- Security essentials: JWT auth, password hashing, role checks, optional anonymous tracking, and API rate limiting.
