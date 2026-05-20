# FinovaWealth — Smart Behavioral Tracking Engine
## Complete Project Documentation

---

## Table of Contents

1. [Project Overview](#1-project-overview)
2. [Problem Statement](#2-problem-statement)
3. [Solution Architecture](#3-solution-architecture)
4. [Tech Stack](#4-tech-stack)
5. [System Architecture & Data Flow](#5-system-architecture--data-flow)
6. [Frontend — Fintech Website](#6-frontend--fintech-website)
7. [Backend API — Node.js Express](#7-backend-api--nodejs-express)
8. [Intelligence Engine — Python FastAPI](#8-intelligence-engine--python-fastapi)
9. [Admin Portal — React Dashboard](#9-admin-portal--react-dashboard)
10. [Database Design](#10-database-design)
11. [Behavioral Event Tracking System](#11-behavioral-event-tracking-system)
12. [Intent Scoring Engine](#12-intent-scoring-engine)
13. [Behavioral Detectors](#13-behavioral-detectors)
14. [ML & AI Models](#14-ml--ai-models)
15. [Trigger & Notification System](#15-trigger--notification-system)
16. [Temporal & Psychology Analysis](#16-temporal--psychology-analysis)
17. [Admin Dashboard Features](#17-admin-dashboard-features)
18. [Real-Time Communication](#18-real-time-communication)
19. [Privacy & Ethics](#19-privacy--ethics)
20. [Challenges & Difficulties Faced](#20-challenges--difficulties-faced)
21. [Demo Flow](#21-demo-flow)
22. [Future Scope](#22-future-scope)

---

## 1. Project Overview

**FinovaWealth** is a full-stack, enterprise-grade behavioral intelligence platform built for fintech applications. It silently tracks user interactions on a simulated financial services website, analyzes behavioral patterns using a hybrid of rule-based engines and machine learning models, predicts user intent, and generates automated personalized interventions to improve engagement and conversion.

The platform goes far beyond traditional analytics (page views, bounce rates) by understanding *why* users behave the way they do — detecting hesitation, confusion, frustration, high intent, and drop-off risk in real-time.

**Core Value Proposition:** "Privacy-preserving behavioral analytics engine that understands user intent, not just user clicks."

---

## 2. Problem Statement

Financial platforms face critical challenges:

- **High onboarding drop-off:** Users leave before completing account setup
- **Low investment conversion:** Users browse products but never invest
- **Subscription abandonment:** Users show interest but don't convert
- **Confused navigation:** Users struggle to understand financial products
- **Poor personalization:** Same experience shown to all users

Traditional analytics only show page views, click counts, and bounce rates. They do NOT understand user intent. FinovaWealth solves this by building an intelligent layer that interprets behavioral signals and predicts what the user is likely to do next.

---

## 3. Solution Architecture

The system is a four-service architecture:

```
┌─────────────────┐     ┌─────────────────┐     ┌─────────────────┐     ┌─────────────────┐
│   Frontend       │────▶│   Backend API    │────▶│  Engine (Python) │     │  Admin Portal    │
│   (React:5173)   │     │   (Node:5000)    │     │  (FastAPI:8000)  │     │  (React:5174)    │
│                  │     │                  │     │                  │     │                  │
│ - Fintech UI     │     │ - Auth/JWT       │     │ - Behavior Scorer│     │ - Live Dashboard │
│ - Event Tracking │     │ - Event Ingest   │     │ - ML Models      │     │ - Heatmaps       │
│ - Popup Display  │     │ - MongoDB        │     │ - Detectors      │     │ - Funnel Analytics│
│ - AI Chatbot     │     │ - Triggers       │     │ - Session Mgmt   │     │ - Notifications  │
└─────────────────┘     └─────────────────┘     └─────────────────┘     └─────────────────┘
         │                       │                       │                       │
         └─────── events ────────┘────── forward ─────────┘◀──── poll/admin ──────┘
                                     │                              │
                                  MongoDB                   In-Memory Sessions
```

**Data Flow:**
1. User interacts with the Frontend (clicks, scrolls, form fills, page navigation)
2. Frontend tracking hooks capture events and batch-send them to the Backend API
3. Backend persists events to MongoDB, enriches them with user/session context, evaluates intent rules, and forwards them to the Python Engine
4. Engine processes events through its Decision Brain (scoring, detection, ML prediction, temporal analysis, psychology inference) and returns intelligence
5. Admin Portal polls Engine endpoints for live analytics, session timelines, heatmaps, and alerts
6. Triggered interventions (popups, notifications) are pushed back to the Frontend via polling or Socket.IO

---

## 4. Tech Stack

### Frontend (Fintech Website)
- **React 19** with Vite 8
- **Tailwind CSS 3** for styling
- **Zustand** for state management
- **React Router DOM 7** for routing
- **Recharts** for data visualization
- **Framer Motion** for animations
- **Axios** for HTTP requests
- **Socket.IO Client** for real-time communication
- **React Hot Toast** for notifications
- **Lucide React** for icons
- **@tanstack/react-query** for server state
- **@react-oauth/google** for Google OAuth

### Backend API
- **Node.js** with Express 5
- **MongoDB** with Mongoose 9
- **JWT** (jsonwebtoken) for authentication
- **bcryptjs** for password hashing
- **Socket.IO** for real-time events
- **Nodemailer** for email delivery
- **Google Auth Library** for OAuth
- **OTP Generator** for email verification
- **CORS** for cross-origin support
- **Rate Limiting** for API protection

### Intelligence Engine
- **Python 3.9+** with FastAPI
- **Uvicorn** as ASGI server
- **scikit-learn** (RandomForest, KMeans) for ML
- **Pandas** & **NumPy** for data processing
- **Joblib** for model serialization
- **Pydantic** for data validation

### Admin Portal
- **React 18** with Vite 5
- **Tailwind CSS 3** for styling
- **Recharts** for charts and graphs
- **Framer Motion** for animations
- **Lucide React** for icons
- **Socket.IO Client** for real-time updates
- **React Router DOM 7** for routing

### Database
- **MongoDB Atlas** (cloud-hosted)
- 7 collections: Users, Sessions, Events, Triggers, Notifications, FatigueStates, PopupPolicies

---

## 5. System Architecture & Data Flow

### Event Pipeline (Detailed)

```
Browser Interaction
    │
    ▼
useTracking.js hooks (usePageTracking, useClickTracking, useScrollDepth, useInteractionTracking, useFormTracking, useModalTracking, useSessionLifecycleTracking)
    │
    ▼
eventService.js (queueEvent → batched POST to /api/events)
    │
    ▼
Backend eventRoutes.js → trackingService.processBatchEvents()
    │
    ├─▶ resolveGuestUser() — creates guest User records for anonymous visitors
    ├─▶ resolveMongoSession() — finds or creates Session document
    ├─▶ buildEnrichedEvent() — normalizes event type, extracts coordinates, adds metadata
    ├─▶ Event.insertMany() — persists to MongoDB
    ├─▶ applySessionEvents() — updates Session document (pages visited, navigation path, conversion status, bounce detection)
    ├─▶ updateUserIntentScore() — recalculates user's intent score (0-100)
    ├─▶ evaluateRules() — checks behavioral rules (form abandonment, high intent, deep engagement, checkout recovery, comparison without conversion)
    └─▶ forwardToEngine() — POST to Python engine /analyze endpoint
            │
            ▼
    Engine /analyze endpoint
            │
            ├─▶ EventNormalizer.normalize() — maps 30+ event types to canonical taxonomy
            ├─▶ EventValidator.is_valid() — rejects bot/spam/duplicate events
            ├─▶ SessionManager.add_event() — stores in in-memory session
            └─▶ DecisionBrain.process_new_event()
                    │
                    ├─▶ BehaviorScorer.calculate_intent_score() — category-capped scoring with diminishing returns
                    ├─▶ BehavioralDetectors — 15 pattern detectors (rage clicks, hesitation, circular navigation, etc.)
                    ├─▶ Dynamic State Classification — PASSIVE_BROWSER → CURIOUS_EXPLORER → RESEARCH_ORIENTED_USER → INTERESTED_USER → HIGH_INTENT_USER → NEARLY_CONVERTED_USER
                    ├─▶ TemporalEngine.analyze_timing() — click velocity, reading depth, scroll velocity, hover analysis
                    ├─▶ PsychologyEngine — sequence analysis, emotional tendencies, decision friction
                    ├─▶ GlobalIntentModel.predict_conversion_probability() — Random Forest classifier
                    ├─▶ GlobalSegmentationModel.get_persona() — KMeans clustering
                    ├─▶ Confidence calculation, narrative generation, recommendation engine
                    └─▶ Returns full intelligence payload
```

---

## 6. Frontend — Fintech Website

### Pages (25+ pages)

| Page | Route | Purpose |
|------|-------|---------|
| Landing | `/` | Professional fintech landing page with product overview |
| Login | `/login` | Email/password + Google OAuth authentication |
| Signup | `/signup` | Registration with email OTP verification |
| Forgot Password | `/forgot-password` | Password reset via OTP |
| Onboarding | `/onboarding` | New user onboarding flow |
| Dashboard | `/dashboard` | User dashboard with portfolio overview |
| Portfolio | `/portfolio` | Investment portfolio view |
| Transactions | `/transactions` | Transaction history |
| Mutual Funds | `/mutual-funds` | Mutual fund product listings |
| SIP Plans | `/sip-plans` | Systematic Investment Plan listings |
| Investment Plans | `/investment-plans` | General investment plans |
| Insurance Plans | `/insurance-plans` | Insurance product listings |
| Tax Saving | `/tax-saving` | Tax-saving investment options |
| Wealth Management | `/wealth-management` | Wealth management services |
| Product Details | `/product-details/:id` | Individual product page |
| Application Form | `/checkout/:id` | Investment application/checkout form |
| Plan Comparison | `/plan-comparison` | Side-by-side plan comparison tool |
| Confirmation | `/confirmation` | Application submission confirmation |
| Goal Planning | `/goal-planning` | Financial goal planning tool |
| Retirement Planning | `/retirement-planning` | Retirement planning calculator |
| Investment Calculator | `/investment-calculator` | Return on investment calculator |
| AI Recommendations | `/ai-recommendations` | AI-powered investment recommendations |
| FAQ | `/faq` | Frequently asked questions |
| Beginner Guides | `/beginner-guides` | Educational content for new investors |
| Success Stories | `/success-stories` | Customer testimonials |
| Notifications | `/notifications` | User notification center |
| Profile Settings | `/profile` | User profile management |
| About | `/about` | Company information |
| Blog | `/blog` | Financial blog articles |
| Contact | `/contact` | Contact form |
| Help | `/help` | Help center |

### Tracking Hooks

The frontend implements 7 specialized tracking hooks:

1. **usePageTracking(pageName)** — Tracks page views, time spent, repeated visits, return visits, session start
2. **useClickTracking()** — Tracks button clicks with element identification and coordinate capture
3. **useScrollDepth()** — Tracks scroll milestones (25%, 50%, 75%, 100%)
4. **useInteractionTracking()** — Tracks mouse movements, hover events, field focus/blur, idle detection (30s threshold), rage clicks (4+ rapid clicks on same element within 1.5s)
5. **useFormTracking(formName)** — Tracks form start, form completion, form abandonment (on unmount), validation errors
6. **useModalTracking(modalName)** — Tracks modal open/close events
7. **useSessionLifecycleTracking()** — Tracks page visibility changes, page exits, tab close events

### Coordinate Capture System

The `getClickCoordinates()` function captures rich spatial data for heatmap rendering:
- Client X/Y coordinates
- Page X/Y coordinates (accounting for scroll)
- Screen dimensions
- Target element bounding rect (center, position, dimensions)
- Position mode detection (fixed/sticky/relative)
- Scroll container detection

### Global Tracking Components

- **GlobalTracker** — Mounts interaction, scroll, and lifecycle tracking globally
- **TargetedNotificationPoller** — Polls engine every 3s for admin-sent interventions
- **PopupContainer** — Displays behavior-triggered popup notifications
- **AIChatbot** — Contextual AI assistant for investment guidance

---

## 7. Backend API — Node.js Express

### API Routes

| Route Group | Endpoints | Purpose |
|-------------|-----------|---------|
| `/api/auth` | POST `/signup`, `/login`, `/verify-otp`, `/forgot-password`, `/reset-password`, `/google-login` | Authentication |
| `/api/events` | POST `/batch` — ingest event batches | Event tracking |
| `/api/events` | GET `/user/:userId` — user event history | Event retrieval |
| `/api/ai` | POST `/chat` — AI chatbot responses | AI assistant |
| `/api/admin` | GET `/users`, `/analytics`, `/sessions` | Admin data |
| `/api/analytics` | GET various analytics endpoints | Analytics |
| `/api/health` | GET health check | System status |

### Middleware

- **CORS** — Allows frontend (5173) and admin portal (5174)
- **Rate Limiting** — Auth: 80 req/15min, Events: 600 req/min
- **JSON Body Parser** — 10MB limit
- **Request Logger** — Development mode logging

### Services

#### trackingService.js
Central event processing pipeline:
- `processBatchEvents()` — Processes batch of events with user resolution, session management, event enrichment, MongoDB persistence, intent scoring, rule evaluation, and engine forwarding
- `recordFormAbandonment()` — Specialized form abandonment recording with field-level context
- Guest user resolution — Creates temporary user records for anonymous visitors
- Session resolution — Finds active session or creates new one with device/browser/location metadata
- Event normalization — Maps 30+ frontend event types to canonical MongoDB types
- Guest event TTL — 2-hour expiry for guest heatmap data

#### intentEngine.js
Rule-based behavioral intelligence:
- `calculateIntentScore()` — Scoring with 20+ signal weights, high-intent page multipliers (1.5x), long dwell time boost (1.3x), deep scroll boost (1.2x)
- `updateUserIntentScore()` — Persists score to User document
- `evaluateRules()` — 5 behavioral rules:
  1. Form abandonment → in-app nudge
  2. High intent (60s+ site time + 2+ button clicks) → conversion prompt
  3. Deep engagement (4+ page views + scroll) → advisor recommendation
  4. Checkout recovery → finish application prompt
  5. Comparison without conversion → AI recommendation

#### triggerEngine.js
Processes triggered rules and dispatches actions:
- Cooldown management per trigger type
- LLM-powered popup copy generation
- Fatigue-aware delivery via popup orchestrator
- Socket.IO admin notifications
- Trigger types: form_abandon, high_intent, drop_off, return_visit, inactivity, conversion, custom
- Priority levels: CRITICAL, HIGH, MEDIUM, LOW
- Re-engagement email sending with HTML templates

#### socketService.js
Real-time WebSocket communication:
- Room-based architecture (admin room)
- Trigger event broadcasting
- Session lifecycle events

---

## 8. Intelligence Engine — Python FastAPI

### Core Components

#### Session Manager (session_manager.py)
- In-memory session storage with `SessionState` objects
- 5-minute stale TTL, 30-minute max age for abandoned sessions
- Automatic pruning of ended sessions (10 min) and stale sessions (30 min)
- Session metrics calculation: duration, pages visited, navigation flow, bounce detection, event counts, replay timeline
- Global configuration with dynamic updates (page weights, action weights, detector toggles, score thresholds)

#### Decision Brain (brain.py)
The central intelligence processor. For each event, it executes a 12-step pipeline:

1. **Noise Removal** — Filter false positives using BehavioralMetrics
2. **Context Enrichment** — Add session context flags to event
3. **Intent Scoring** — Category-capped scoring with diminishing returns
4. **Pattern Detection** — 15 behavioral detectors run sequentially
5. **State Classification** — Map score to intent state (PASSIVE_BROWSER → NEARLY_CONVERTED_USER)
6. **Temporal Analysis** — Click velocity, reading depth, scroll velocity, hover patterns, night/weekend detection
7. **Financial Persona Inference** — Conservative Investor, Aggressive Investor, Beginner Investor, High Value Prospect, Trust Seeking User, Overthinker, Last Minute Exiter
8. **Risk Engine** — Drop-off risk, frustration risk, trust risk, confusion risk
9. **Advanced Metrics** — Session quality, volatility
10. **Psychology Engine** — Journey sequence analysis, emotional tendencies, decision friction
11. **ML Integration** — Random Forest conversion probability, next action prediction, churn prediction
12. **Output Generation** — Narrative story, recommendations, confidence score, priority level

**Output Payload (per event):**
```json
{
  "user_id": "...",
  "behavior_state": ["HIGH_INTENT_USER", "HESITANT"],
  "personas": ["CONSERVATIVE_INVESTOR", "HIGH_VALUE_PROSPECT"],
  "intent_score": 72,
  "confidence": 0.85,
  "conversion_probability": 0.78,
  "momentum": 0.12,
  "dropoff_risk": "MEDIUM",
  "frustration": "LOW",
  "hesitation": "HIGH",
  "patterns": ["HESITANT_INVESTOR", "RETURN_INTENT"],
  "session_quality": "HIGH",
  "volatility": "STABLE",
  "emotional_tendencies": ["HESITANT", "RESEARCH_ORIENTED"],
  "decision_friction": ["COST_CONCERN"],
  "journey_sequences": ["SERIOUS_PROSPECT_PATH"],
  "trust_risk": "LOW",
  "confusion_risk": "LOW",
  "trust_level": "MEDIUM",
  "reasoning": ["calculator_usage", "pricing_view"],
  "priority": "HIGH",
  "recommendation": ["trust_building_content", "educational_comparison_guide"],
  "narrative": "The user entered via landing, used the calculator, viewed pricing...",
  "ml_intelligence": { ... },
  "temporal_metrics": { ... },
  "event_priority": "HIGH"
}
```

#### Event Pipeline (pipeline.py)
- **EventValidator** — Rejects corrupted payloads, impossible timestamps, duplicate events (100ms window), bot-like spam (50 clicks/sec)
- **EventNormalizer** — Maps 30+ event types to canonical taxonomy (e.g., "click" → "button_click", "form_submit" → "form_completion", "time_spent" → dynamic mapping based on duration)
- **EventPrioritySystem** — Priority levels: LOW (page_visit, scroll), MEDIUM (faq_open), HIGH (calculator_usage, cta_click, rage_click), CRITICAL (otp_request, form_completion, form_abandonment)
- **ContextEnricher** — Adds context flags: is_return_visit, prior_frustration, session_depth, has_pricing_context

#### Behavior Scorer (scorer.py)
Sophisticated scoring system with:

**Positive Signals (60+ signal types):**
- Navigation: page_visit (1), repeat_page_visit (2), deep_navigation (4), return_session (8)
- Engagement: long_dwell_time (3), very_long_dwell_time (6), scroll_completion (2), mouse_movement (0.5), video_completion (4), download_resource (5)
- Interaction: cta_click (4), multiple_cta_click (8), comparison_view (5), calculator_usage (6), plan_selection (8)
- Form: form_start (6), form_progress (4), otp_request (12), form_completion (15)
- Investment: sip_visit (4), mutual_fund_visit (4), application_complete (12)
- Re-engagement: notification_click (4), popup_clicked (5), advisor_request (6)

**Negative Signals (25+ signal types):**
- Exit behaviors: quick_exit (-6), no_interaction_session (-8), exit_near_conversion (-12)
- Click frustration: rage_click (-8), spam_click (-5), dead_click (-3)
- Navigation frustration: navigation_loop (-5), excessive_back (-4), idle_timeout (-8)
- Form frustration: form_abandonment (-10), repeated_validation_failure (-7)
- Behavioral red flags: rapid_navigation (-3), confused_navigation (-4), bounce_after_deep_engagement (-8), abandoned_checkout (-10)

**Scoring Features:**
- 6 category caps: navigation (20), engagement (18), interaction (22), form (25), investment (25), re-engagement (12)
- Strong diminishing returns: 1st occurrence = 100%, 2nd = 70%, 3rd-4th = 40%, 5th-8th = 20%, 9th+ = 10%
- Time decay: >7 days = 50%, >1 hour = 85%, >5 min = 95%
- Momentum bonus (increasing/decreasing engagement)
- Session continuity bonus (return visits)
- Persistence bonus (multi-day engagement)
- Alignment multiplier (1.0-1.15x for correlated behaviors)
- Hard cap at 100 (requires form completion to reach)

**Derived Session Signals:**
- Deep navigation: 7+ unique pages
- Multi-page session: 4+ unique pages
- Category exploration: 4+ page prefixes
- Multiple CTA clicks: 4+
- FAQ repeat: 3+
- Repeated page visits: 4+ times on same page

**Derived Negative Signals:**
- Rapid navigation: 5+ page views in <30 seconds
- Hesitation pattern: same page 3+ times without CTA/form action
- Confused navigation: same 3 pages in a loop
- Comparison without action: 3+ comparison views, 0 CTA clicks
- Bounce after deep engagement: high initial activity then sudden stop
- Form field abandon: field_focus without field_blur on 2+ fields

**Trust Score:** Based on trust signals (faq_open, security_page_view, return_session) vs distrust signals (pricing_exit, quick_exit, rage_click)

#### Behavioral Detectors (detectors.py)
15 pattern detectors:

1. **Rage Click Detection** — 4+ clicks on same element within 2 seconds
2. **Circular Navigation Detection** — A→B→A→B page loop pattern
3. **Hesitation Detection** — 3+ visits to same high-value page without conversion
4. **Backtracking Detection** — Frequent return to immediately previous page
5. **Product Comparison Detection** — Rapid switching between 2+ financial product pages
6. **Onboarding Friction Detection** — Excessive interactions on single form field (5+)
7. **Navigation Velocity Detection** — 5 pages viewed in <10 seconds (scanning behavior)
8. **Idle Reading Detection** — 45+ seconds dwell time on single page (deep reading)
9. **Return Intent Detection** — User returns to previously viewed product page
10. **Window Shopper Detection** — 6+ page views, 0 CTA clicks
11. **Decision Paralysis Detection** — 4+ comparisons or 5+ revisits, 0 CTA clicks
12. **Urgent Investor Detection** — Fast progression through key pages (<2 min for pricing→CTA→form)
13. **Confused Prospect Detection** — Navigation loops, backtracking, or dead clicks
14. **Almost Converted Detection** — OTP requested or 70%+ form progress, then exit
15. **Oscillating Scroll Detection** — Back-and-forth scrolling pattern (3+ direction reversals)
16. **Density Drop Detection** — Sudden drop in interaction density (recent < 30% of older)

#### Temporal Engine (temporal.py)
Timing-based behavioral analysis:

- **Click Velocity** — STABLE (normal), VOLATILE_FAST (<0.5s intervals, frustration), DELIBERATE (>3s intervals, serious interest)
- **Reading Depth** — LOW (<45s), SKIMMING (45-180s), INTEREST (180-420s), RESEARCH (>420s)
- **Hesitation Pause** — 10+ second pause before CTA click
- **Scroll Velocity** — FAST_SCANNING (>50%/s), SLOW_READING (<10%/s), STABLE
- **Hover Tendency** — CURIOSITY (short hover), LONG_CONSIDERATION (>3s), REPEATED_HESITATION (3+ hovers)
- **Temporal Context** — Night browsing (11PM-5AM), Weekend browsing (Sat/Sun)

#### Psychology Engine (psychology.py)
Deep behavioral analysis:

- **Journey Sequence Detection:**
  - LOGICAL_CONVERSION_PATH: awareness → research → trust → decision
  - SERIOUS_PROSPECT_PATH: calculator + pricing + CTA
- **Emotional State Approximation:**
  - FRUSTRATED — from frustrated user pattern or volatile click velocity
  - HESITANT — from hesitant investor pattern or hesitation pauses
  - RESEARCH_ORIENTED — from research user pattern or deep reading
  - TRUST_SEEKING — from security page visits
  - CONFUSED — from confused user pattern
- **Decision Friction Detection:**
  - COMPLEXITY_FRICTION — confusion detected
  - TECHNICAL_FRICTION — frustration detected
  - TRUST_BARRIER — hesitation + trust-seeking
  - COST_CONCERN — repeated pricing views + FAQ visits

#### ML Models (ml_model.py)

**GlobalIntentModel (Random Forest Classifier):**
- 15 features: session_duration, total_clicks, cta_clicks, faq_count, pricing_views, calculator_usage, revisit_count, hesitation_score, frustration_score, navigation_depth, scroll_completion, form_progress, interaction_density, time_between_clicks, conversion_distance
- 250 estimators, min_samples_leaf=2, class_weight="balanced"
- Predicts: conversion_probability, drop_off_prediction, re_engagement_need, churn_prediction
- Heuristic fallback when untrained: base 8% + calculator (+18%), pricing (+16%), multiple CTA (+14%), form progress (+25%)
- Persists to .joblib files with hot-reload on file change
- Training via POST /admin/train-global-model

**LearnedNextActionModel (Sequence Model):**
- Empirical transition model trained from real session transitions
- State key: last 3 event types joined with ">"
- Predicts next likely action: page_view, compare_plans, open_calculator, checkout_start, form_submit, return_to_form, request_advisor
- Heuristic fallback for untrained state

**GlobalSegmentationModel (KMeans Clustering):**
- 4 clusters: Conservative Researcher, Comparison Shopper, High-Velocity Scanner, Intentional Investor
- Fallback persona detection based on feature thresholds
- Passive Explorer as default

---

## 9. Admin Portal — React Dashboard

### Pages (13 pages)

| Page | Route | Features |
|------|-------|----------|
| Overview | `/` | Summary cards, active users, quick stats |
| Behavioral Analytics | `/analytics` | Deep behavioral analysis, user segments |
| Funnel Analytics | `/funnel` | 5-stage conversion funnel (Visitors → Engaged → Product Interest → Application Started → Application Completed) |
| Path Discovery | `/path-discovery` | Common navigation sequences with conversion rates |
| Alerts | `/alerts` | Real-time behavioral alerts (CRITICAL, WARNING, INFO) |
| Live Stream | `/live` | Live event feed from active sessions |
| Event Tracking | `/events` | Detailed event log with filtering |
| Session Timeline | `/timeline` | Individual session replay with timeline |
| Notification Engine | `/notifications` | Admin notification dispatch (popup, email) |
| ML Intelligence | `/ml` | ML model status, predictions, feature importance |
| Heatmap | `/heatmap` | Click/interaction heatmap with coordinate visualization |
| AI Insights | `/ai-insights` | Aggregated behavioral insights across all sessions |
| Popup Analytics | `/popup-analytics` | Popup CTR, dismiss rates, per-trigger breakdown |

### Key Admin Features

**Session Management:**
- View all active/completed sessions
- Deduplication by email (authenticated) or client_session_id (guest)
- Session alias resolution across multiple identifiers
- Delete individual or batch sessions
- Reset all engine sessions

**Manual Interventions:**
- Send targeted popup notifications to specific users
- Queue interventions with custom message, title, reason
- Priority-based delivery (CRITICAL, HIGH, MEDIUM, LOW)

**Notification Dispatch:**
- Multi-channel delivery: popup, email
- Scheduled delivery support
- Per-user targeting

**Configuration Control:**
- Dynamic engine parameter updates (page weights, action weights, detector toggles, score thresholds)
- No restart required

**ML Training:**
- POST /admin/train-global-model triggers Random Forest + KMeans training
- Requires mixed sessions (positive and negative)
- Persists models to .joblib files

**Analytics Caching:**
- TTL-based caching: active-users (2s), analytics-summary (3s), conversion-funnel (8s), alerts (3s), user-reports (4s), ai-insights (15s), popup-analytics (10s)

---

## 10. Database Design

### MongoDB Collections

#### Users Collection
```
{
  _id: ObjectId,
  fullName: String (required, 2-100 chars),
  email: String (required, unique, lowercase),
  phone: String,
  passwordHash: String (bcrypt, 12 rounds, select: false),
  googleId: String (sparse index),
  authProvider: "email" | "google",
  role: "user" | "admin" | "advisor",
  isVerified: Boolean,
  otp: String (select: false),
  otpExpires: Date (select: false),
  resetOtp: String (select: false),
  resetOtpExpires: Date (select: false),
  riskProfile: "conservative" | "moderate" | "aggressive",
  investmentGoals: [String],
  monthlyInvestment: Number,
  preferredInvestments: [String],
  intentScore: Number (0-100),
  createdAt: Date,
  updatedAt: Date
}
Indexes: email (unique), authProvider, createdAt
```

#### Sessions Collection
```
{
  _id: ObjectId,
  userId: ObjectId (ref: User, required),
  sessionStart: Date,
  sessionEnd: Date,
  duration: Number (seconds),
  pagesVisited: [String],
  device: String,
  browser: String,
  clientIp: String,
  connectionOrigin: "internal" | "external" | "remote",
  location: String,
  bounce: Boolean,
  returningUser: Boolean,
  conversion: Boolean,
  status: "active" | "completed" | "abandoned",
  lastActive: Date,
  eventCount: Number,
  rapidClickCount: Number,
  inactiveDetected: Boolean,
  lastPage: String,
  entrySource: String,
  navigationPath: [{ page, timestamp, duration }],
  createdAt: Date,
  updatedAt: Date
}
Indexes: userId, sessionStart, status, compound(userId + sessionStart)
```

#### Events Collection (Most Important)
```
{
  _id: ObjectId,
  userId: ObjectId (ref: User, required),
  sessionId: ObjectId (ref: Session, required),
  eventType: String (enum: 40+ types),
  page: String,
  element: String,
  source: String,
  buttonName: String,
  formType: String,
  fieldName: String,
  duration: Number (seconds),
  scrollDepth: Number (0-100),
  intentScore: Number (0-100),
  x: Number (heatmap coordinate),
  y: Number (heatmap coordinate),
  device: String,
  browser: String,
  metadata: Mixed (flexible key-value),
  expireAt: Date (TTL for guest events),
  timestamp: Date
}
Indexes: userId, sessionId, eventType, timestamp,
  compound(userId + timestamp), compound(eventType + timestamp),
  compound(sessionId + timestamp), expireAt (TTL)
```

**Supported Event Types (40+):**
page_view, button_click, cta_click, scroll, scroll_depth, time_spent, form_start, form_submit, form_complete, form_abandon, form_validation_error, form_progress, session_start, session_end, notification_open, notification_click, notification_dismiss, return_visit, repeated_page_visit, mouse_movement, mouse_activity, rapid_click, rage_click, inactive_session, idle_timeout, bounce, hover, field_focus, field_blur, field_change, form_save_draft, investment_intent, product_view, comparison, checkout_start, checkout_abandon, checkout_complete, calculator_usage, download_brochure, contact_advisor, chatbot_open, chatbot_message, chatbot_recommendation, page_visibility, modal_open, modal_close, page_exit, tab_close

#### Triggers Collection
```
{
  _id: ObjectId,
  userId: ObjectId (ref: User),
  triggerType: "form_abandon" | "high_intent" | "drop_off" | "return_visit" | "inactivity" | "conversion" | "custom",
  reason: String,
  status: "active" | "resolved" | "dismissed",
  triggerCondition: Mixed,
  eventThreshold: Number,
  cooldown: Number (minutes),
  triggerAction: "email" | "in_app" | "flag" | "webhook" | "sms",
  emailTemplate: String,
  isActive: Boolean,
  lastFiredAt: Date,
  createdAt: Date,
  updatedAt: Date
}
Indexes: userId, triggerType, status, compound(userId + createdAt), compound(triggerType + status)
```

#### Notifications Collection
```
{
  _id: ObjectId,
  userId: ObjectId (ref: User),
  type: "email" | "push" | "in_app" | "sms",
  title: String,
  message: String,
  status: "pending" | "sent" | "delivered" | "failed",
  opened: Boolean,
  clicked: Boolean,
  sentAt: Date,
  notificationType: "transactional" | "re_engagement" | "nudge" | "alert" | "reminder" | "promotional",
  deliveryStatus: "queued" | "sending" | "delivered" | "bounced" | "rejected",
  triggerReason: String,
  createdAt: Date,
  updatedAt: Date
}
Indexes: userId, status, compound(userId + sentAt)
```

#### FatigueStates Collection
```
{
  _id: ObjectId,
  userId: ObjectId (ref: User),
  shownCount: Number,
  dismissedCount: Number,
  clickedCount: Number,
  consecutiveDismissals: Number,
  lastShownAt: Date,
  lastDismissedAt: Date,
  fatigueScore: Number,
  suppressedUntil: Date,
  createdAt: Date,
  updatedAt: Date
}
```

#### PopupPolicies Collection
```
{
  _id: ObjectId,
  singletonKey: "global" (unique),
  maxPopupsPerSession: Number (default: 3),
  fatigueSuppressionMinutes: Number (default: 30),
  dismissalCooldownMinutes: Number (default: 15),
  consecutiveDismissalsLimit: Number (default: 3),
  highFatigueThreshold: Number (default: 0.9),
  mediumFatigueThreshold: Number (default: 0.7),
  priorityIntervalsSeconds: { CRITICAL: 0, HIGH: 20, MEDIUM: 45, LOW: 90 },
  triggerCooldownMinutes: { form_abandon_nudge: 10, checkout_recovery: 10, likely_converter: 30, ... },
  createdAt: Date,
  updatedAt: Date
}
```

---

## 11. Behavioral Event Tracking System

### Tracking Architecture

The tracking system operates on three layers:

**Layer 1: Frontend Capture (useTracking.js)**
- 7 specialized React hooks capture 40+ event types
- Coordinate capture for heatmap rendering (client/page coordinates, element bounding rects, scroll containers)
- Interaction counting and page visit persistence via sessionStorage/localStorage
- Idle detection (30-second threshold)
- Rage click detection (4+ clicks on same element within 1.5 seconds)
- Form lifecycle tracking (start → progress → complete/abandon)

**Layer 2: Backend Processing (trackingService.js)**
- Batch event ingestion with user resolution (authenticated users by ObjectId, guests by slug)
- Session management: find active session or create new with device/browser/location metadata
- Event enrichment: normalize types, extract coordinates, add metadata
- MongoDB persistence with compound indexes for fast queries
- Intent score recalculation per batch
- Rule evaluation for trigger conditions
- Engine forwarding for real-time intelligence

**Layer 3: Engine Processing (brain.py)**
- Event validation and normalization
- In-memory session state management
- Real-time scoring, detection, and ML prediction
- Context enrichment and priority classification

### Event Normalization

The system normalizes 30+ frontend event types to canonical engine types:

| Frontend Event | Engine Event |
|---------------|-------------|
| click, button_click | button_click |
| cta_click | cta_click |
| page_view, view, visit | page_visit |
| scroll_depth | scroll_completion |
| form_submit, form_complete | form_completion |
| form_abandon | form_abandonment |
| checkout_start | form_start |
| checkout_complete | form_completion |
| checkout_abandon | form_abandonment |
| comparison | comparison_view |
| product_view | pricing_view |
| return_visit | return_session |
| repeated_page_visit | repeat_page_visit |
| rapid_click | rage_click |
| inactive_session | idle_timeout |
| time_spent (>180s) | very_long_dwell_time |
| time_spent (>60s) | long_dwell_time |

---

## 12. Intent Scoring Engine

### Node.js Scoring (intentEngine.js)

**Signal Weights:**
- page_view: 2, button_click: 5, form_start: 10, form_submit: 25
- checkout_start: 18, checkout_complete: 35, checkout_abandon: -8
- product_view: 8, comparison: 12, calculator_usage: 14
- contact_advisor: 18, return_visit: 10, investment_intent: 15

**Multipliers:**
- High-intent pages (mutual-funds, sip-plans, checkout, etc.): 1.5x
- Long dwell time (>120s): 1.3x
- Deep scroll (>70%): 1.2x

**Tier Assignment:**
- Hot: 80+, Warm: 55-79, Engaged: 30-54, Browsing: 10-29, Cold: 0-9

### Python Scoring (scorer.py)

Category-capped scoring with 6 categories:
- Navigation (cap: 20), Engagement (cap: 18), Interaction (cap: 22)
- Form (cap: 25), Investment (cap: 25), Re-engagement (cap: 12)

Plus: derived signals (cap: 10), momentum (-5 to +8), continuity (cap: 6), persistence (cap: 8), alignment multiplier (1.0-1.15x), friction penalty (cap: 15)

Maximum possible score: ~85 through normal browsing, 100 requires form completion.

---

## 13. Behavioral Detectors

| Detector | Condition | Pattern Output |
|----------|-----------|----------------|
| Rage Clicks | 4+ clicks on same element in 2s | FRUSTRATED_USER |
| Circular Navigation | A→B→A→B page loop | CONFUSED_USER |
| Hesitation | 3+ visits to same high-value page | HESITANT_INVESTOR |
| Backtracking | 3+ returns to previous page | CONFUSED_USER |
| Product Comparison | 2+ product pages in recent views | RESEARCH_USER |
| Onboarding Friction | 5+ interactions on single form field | ONBOARDING_FRICTION |
| Navigation Velocity | 5 pages in <10s | FAST_SCANNER |
| Idle Reading | 45+ seconds on single page | DEEP_READING |
| Return Intent | Returns to previously viewed product | RETURN_INTENT |
| Window Shopper | 6+ views, 0 CTAs | WINDOW_SHOPPER |
| Decision Paralysis | 4+ comparisons, 0 CTAs | DECISION_PARALYSIS |
| Urgent Investor | Key progression in <2 min | URGENT_INVESTOR |
| Confused Prospect | Loops + backtracking + dead clicks | CONFUSED_PROSPECT |
| Almost Converted | OTP/70%+ form then exit | ALMOST_CONVERTED |
| Oscillating Scroll | 3+ scroll direction reversals | OSCILLATING_SCROLL |
| Density Drop | Recent activity <30% of older | DENSITY_DROP |

---

## 14. ML & AI Models

### Random Forest Classifier (Conversion Prediction)
- **Algorithm:** RandomForestClassifier (250 estimators, min_samples_leaf=2, class_weight="balanced")
- **Features (15):** session_duration, total_clicks, cta_clicks, faq_count, pricing_views, calculator_usage, revisit_count, hesitation_score, frustration_score, navigation_depth, scroll_completion, form_progress, interaction_density, time_between_clicks, conversion_distance
- **Outputs:** conversion_probability, drop_off_prediction (HIGH/LOW), re_engagement_need (YES/NO), churn_prediction (0-1), next_action_prediction
- **Training:** POST /admin/train-global-model with mixed sessions
- **Persistence:** joblib files with hot-reload
- **Fallback:** Heuristic baseline when untrained

### KMeans Clustering (User Segmentation)
- **Algorithm:** KMeans (4 clusters, n_init=10)
- **Personas:** Conservative Researcher, Comparison Shopper, High-Velocity Scanner, Intentional Investor
- **Fallback:** Rule-based persona detection

### Learned Next Action Model (Sequence Prediction)
- **Type:** Empirical transition model
- **State:** Last 3 event types
- **Predictions:** page_view, compare_plans, open_calculator, checkout_start, form_submit, return_to_form, request_advisor
- **Training:** Fits from real session transitions

### LLM Integration (Gemini API)
- **Purpose:** Generate personalized popup copy (title, message, CTA)
- **Fallback chain:** flash-lite → 1.5-flash → 2.0-flash
- **Used by:** Trigger engine for intelligent notification content

---

## 15. Trigger & Notification System

### Trigger Rules (intentEngine.js)

| Rule | Condition | Action | Priority |
|------|-----------|--------|----------|
| form_abandon_nudge | Any form_abandon in last 2h | In-app popup | CRITICAL |
| likely_converter | 60s+ site time + 2+ button clicks | In-app popup | HIGH |
| high_intent_abandoner | 4+ page views + deep scroll | In-app popup | HIGH |
| checkout_recovery | Any checkout_abandon | In-app popup | CRITICAL |
| comparison_without_conversion | 2+ comparisons, no form submit | In-app popup | MEDIUM |

### Notification Flow

1. Rule evaluation triggers during event batch processing
2. Cooldown check prevents re-firing same rule within cooldown period
3. LLM generates personalized copy (title, message, CTA)
4. Notification persisted to MongoDB
5. Delivered via popup orchestrator (fatigue-aware, queued, Socket.IO)
6. Admin dashboard notified via Socket.IO
7. Frontend polls for interventions every 3 seconds

### Fatigue Management

- **FatigueState** tracks per-user: shownCount, dismissedCount, clickedCount, consecutiveDismissals, fatigueScore, suppressedUntil
- **PopupPolicy** configures: maxPopupsPerSession (3), fatigueSuppressionMinutes (30), dismissalCooldownMinutes (15), consecutiveDismissalsLimit (3)
- Priority-based intervals: CRITICAL (0s), HIGH (20s), MEDIUM (45s), LOW (90s)
- Per-trigger cooldowns: form_abandon_nudge (10min), checkout_recovery (10min), likely_converter (30min), high_intent_abandoner (45min)

### Email Re-engagement

HTML email templates for form abandonment recovery with:
- Professional FinovaWealth branding
- Completion percentage display
- Call-to-action button linking back to investment page
- Advisory team availability mention

---

## 16. Temporal & Psychology Analysis

### Temporal Analysis

- **Click Velocity:** STABLE / VOLATILE_FAST (frustration) / DELIBERATE (serious interest)
- **Reading Depth:** LOW / SKIMMING / INTEREST / RESEARCH
- **Hesitation Pause:** 10+ second pause before CTA click
- **Scroll Velocity:** FAST_SCANNING / SLOW_READING / STABLE
- **Hover Tendency:** CURIOSITY / LONG_CONSIDERATION / REPEATED_HESITATION
- **Temporal Context:** Night browsing (11PM-5AM), Weekend browsing

### Psychology Analysis

- **Journey Sequences:** LOGICAL_CONVERSION_PATH, SERIOUS_PROSPECT_PATH
- **Emotional Tendencies:** FRUSTRATED, HESITANT, RESEARCH_ORIENTED, TRUST_SEEKING, CONFUSED
- **Decision Friction:** COMPLEXITY_FRICTION, TECHNICAL_FRICTION, TRUST_BARRIER, COST_CONCERN

---

## 17. Admin Dashboard Features

### Analytics Summary
- Total users, total events, average score, average session duration
- Bounce rate, returning users, inactive sessions
- Rapid clicks, mouse movement events, repeated page visits
- Top pages by visit count
- Form analytics (started/completed/discarded with rates)
- Behavioral distribution (intent states)
- Clustering segments (personas)

### Conversion Funnel
5-stage funnel with drop-off analysis:
1. VISITORS — All sessions
2. ENGAGED — Multi-page or 30s+ duration or meaningful interactions
3. PRODUCT_INTEREST — Product pages, comparisons, calculator usage
4. APPLICATION_STARTED — Form start or checkout start
5. APPLICATION_COMPLETED — Form submit or checkout complete

### Navigation Paths
- Common navigation sequences ranked by frequency
- Per-path conversion rates, average scores, sentiment classification
- Edge-level flow rates between pages
- Sentiment labels: High Intent, Friction, Hesitant, Positive

### Real-Time Alerts
- CRITICAL: Frustrated sessions, rage clicks, checkout abandonment
- WARNING: Hesitating sessions, inactive sessions, bounce detection
- INFO: High intent users, intervention queued

### Heatmap
- Click/interaction coordinate visualization
- Synthetic coordinate generation for events without x/y (per-page clusters)
- Per-user 500 event limit
- Screen dimension metadata for proper rendering

### User Reports
- Deep behavioral dossier per user
- Engagement metrics: average scroll depth, active ratio, idle time, navigation entropy
- Psychological flags: rage click, high hesitation, churn risk, inactive, bounce
- ML intelligence: conversion probability, drop-off prediction, churn prediction
- Narrative story of user journey
- Last 100 events for timeline replay

### AI Insights
- Aggregated behavioral patterns across all active sessions
- Interest clusters (persona distribution)
- Conversion signals (high-intent users)
- At-risk users (churn prediction)
- Hesitant users needing attention
- Top pages by engagement

### Popup Analytics
- Total shown/clicked/dismissed counts
- CTR and dismiss rate
- Per-trigger type breakdown
- Hourly time series (last 24 hours)

---

## 18. Real-Time Communication

### Socket.IO Architecture
- Server-side: Attached to Express HTTP server
- Room-based: "admin" room for dashboard updates
- Events: trigger_fired, session updates
- Client-side: Both frontend and admin portal connect

### Polling Mechanisms
- Frontend: Polls engine every 3s for admin interventions
- Admin Portal: Polls various endpoints with TTL caching (2-15s)
- Engine: In-memory sessions with 5-minute stale TTL

---

## 19. Privacy & Ethics

### Privacy-Preserving Design
- **No invasive tracking:** Only application interaction events are captured
- **No keystroke logging:** Only field focus/blur, not actual input
- **No personal content tracking:** Only metadata about interactions
- **Guest data TTL:** 2-hour automatic expiry for anonymous visitor data
- **Session cleanup:** Automatic pruning of stale sessions (30 min) and ended sessions (10 min)
- **Professional framing:** "Privacy-preserving behavioral analytics engine"

### Security Measures
- JWT authentication with bcrypt password hashing (12 rounds)
- Role-based access control (user, admin, advisor)
- API rate limiting (auth: 80/15min, events: 600/min)
- CORS restricted to frontend and admin origins
- OTP verification for signup and password reset
- Google OAuth integration

---

## 20. Challenges & Difficulties Faced

### Technical Challenges

**1. Event Normalization Complexity**
The frontend generates 40+ event types across different user interactions. Mapping these to a consistent taxonomy for the engine was complex. Different components used different naming conventions (e.g., "click" vs "button_click", "form_submit" vs "form_completion"). We built a dual normalization layer — one in the Node.js backend (MONGO_EVENT_ALIASES) and one in the Python engine (EventNormalizer.TAXONOMY_MAP) — to ensure consistent intelligence regardless of which frontend sent the event.

**2. Session Deduplication**
Users could appear multiple times in the engine due to multiple browser tabs, guest sessions becoming authenticated sessions, or re-login. We implemented a multi-layer deduplication system: canonical session keys based on email (authenticated) or client_session_id (guest), alias resolution across 7 identifier types, and rank-based selection to pick the "best" session for each user.

**3. Scoring Calibration**
Initial scoring was too easy to max out — a few page visits could push a user to 100. We implemented category caps (6 categories with individual limits), strong diminishing returns (2nd occurrence = 70%, 9th+ = 10%), time decay, and friction penalties. The result: max ~85 through normal browsing, 100 requires form completion.

**4. Bot/Spam Detection**
Simulated traffic and automated testing created noise in the analytics. We built EventValidator to reject: corrupted payloads, impossible timestamps, duplicate events (100ms window), and bot-like spam (50 clicks/sec). This cleaned up the signal significantly.

**5. Heatmap Coordinate System**
Many events (page views, form events) don't have click coordinates. We built a synthetic coordinate system with per-page clusters (center x/y, spread radius) and deterministic jitter based on event hash. This creates visually meaningful heatmaps even for non-click events.

**6. Engine-Backend Event Forwarding**
The Node.js backend forwards every event to the Python engine via HTTP. When the engine was down or slow, this caused cascading failures. We added: try/catch with throttled warning logging (once per 30s), graceful degradation (backend continues working even if engine is offline), and async forwarding that doesn't block the response.

**7. Guest Session Lifecycle**
Anonymous visitors created User records with generated emails (slug@guest.finova.local). These cluttered the user list and consumed MongoDB storage. We implemented: 2-hour TTL on guest events (expireAt index), 30-minute stale session pruning in the engine, and separate handling for guest vs authenticated sessions.

**8. ML Model Cold Start**
The Random Forest classifier needed training data to make predictions. With no initial data, it would return meaningless results. We built a heuristic fallback that provides reasonable predictions based on feature thresholds (calculator usage +18%, pricing view +16%, form progress +25%) while the model is untrained.

**9. Frontend Tracking Hook Lifecycle**
React hooks mount/unmount on page navigation. Form abandonment detection relies on the cleanup function — if a user navigates away from a form, the unmount callback fires the abandon event. But React's strict mode double-mounts caused false positives. We used refs to track form started state and prevent duplicate events.

**10. Popup Fatigue Management**
Sending too many popups annoyed users; too few missed conversion opportunities. We built a multi-layer fatigue system: per-user fatigue score tracking, consecutive dismissal limits, suppression periods, priority-based delivery intervals, and per-trigger cooldowns. The admin can tune all parameters via the PopupPolicy model.

**11. Windows Python Encoding**
Python's print() with emojis crashed on Windows due to charmap codec errors. This silently broke the /analyze endpoint. We discovered this through memory and fixed it by avoiding emoji characters in Python print statements.

**12. Duplicate Session Bug on Logout**
Logging out created a new session instead of ending the existing one, because the session_end event was processed before the user ID was cleared. We fixed the 3-layer tracking lifecycle to properly sequence session end events.

**13. Trigger Pipeline Bug**
The `evaluateRules()` return value was discarded in trackingService.js — triggers were always empty. This was a silent bug that took significant debugging to discover. The fix was properly assigning the return value.

**14. Numpy FastAPI Serialization**
ML model output contained numpy types (int64, float64, ndarray) that FastAPI's JSON serializer couldn't handle. We built a `_sanitize()` function that recursively converts numpy types to native Python types before JSON return.

**15. Vite OXC Parser JSX Restriction**
Vite's OXC parser rejects JSX in .js files. All component files had to use .jsx extension. This caused build failures when files were renamed or created with .js extension.

### Architectural Challenges

**16. Four-Service Coordination**
Running 4 separate services (frontend, backend, engine, admin portal) required careful port management, CORS configuration, and environment variable coordination. A misconfiguration in any service could break the entire pipeline.

**17. Real-Time vs Polling Trade-off**
Socket.IO provided real-time updates but added complexity. We used a hybrid approach: Socket.IO for critical events (trigger_fired) and polling with TTL caching for dashboard data. This balanced freshness with server load.

**18. Dual State Management**
Events are stored in both MongoDB (persistent) and the engine's in-memory sessions (ephemeral). Keeping these in sync — especially for analytics that need historical data — required careful API design. The admin portal merges data from both sources.

---

## 21. Demo Flow

### Presentation Script

1. **Start all 4 services** (engine, backend, frontend, admin portal)
2. **Run traffic simulator** (`npm run simulate:live`) to populate with 8 realistic dummy users
3. **Open Admin Portal** (localhost:5174) — show Overview dashboard with live users
4. **Open Frontend** (localhost:5173) in separate window
5. **Sign up** with new account — show OTP verification flow
6. **Browse products** — visit Mutual Funds, SIP Plans, Insurance
7. **Use calculator** — show investment return calculator
8. **Compare plans** — show side-by-side comparison
9. **Start application** — fill checkout form partially, then navigate away
10. **Return to product** — revisit Mutual Funds page
11. **Switch to Admin Portal** — show:
    - Live events appearing in real-time
    - Session timeline with event replay
    - Behavioral analytics (intent score, persona, state)
    - Heatmap with click coordinates
    - Conversion funnel with drop-off analysis
    - ML intelligence (conversion probability, next action prediction)
    - Real-time alerts (hesitation detected, form abandonment)
    - Triggered notifications
12. **Send manual intervention** — use admin notification engine to send targeted popup
13. **Show popup appearing** on user's screen
14. **Demonstrate AI insights** — aggregated behavioral patterns across all sessions

### Key Demo Points
- Real-time event pipeline from browser → Node → Python → Admin
- Behavioral pattern detection (hesitation, frustration, confusion)
- ML-powered conversion prediction
- Automated intervention triggers
- Professional enterprise UI

---

## 22. Future Scope

- **Deep Learning Models:** LSTM/Transformer-based sequence models for better next-action prediction
- **A/B Testing Engine:** Test different interventions and measure conversion impact
- **Cohort Analysis:** Compare behavioral patterns across user segments over time
- **Predictive Churn Scoring:** Proactive re-engagement before users churn
- **Multi-Platform Tracking:** Extend to mobile apps and email engagement
- **Advanced NLP:** Sentiment analysis of chatbot conversations and support tickets
- **Real-Time Scoring Dashboard:** WebSocket-powered live score updates without polling
- **Integration APIs:** Webhook-based integration with CRM and marketing automation tools
- **Compliance Dashboard:** GDPR/CCPA compliance tools for data deletion and consent management
- **Custom Rule Builder:** Visual interface for admins to create custom behavioral rules without coding

---

## Appendix: Project Structure

```
FinovaWealth/
├── Frontend/                    # React fintech website (port 5173)
│   ├── src/
│   │   ├── api/                 # API services (client.js, eventService.js)
│   │   ├── components/          # Reusable components
│   │   │   ├── common/          # Navbar, ProtectedRoute, AIChatbot
│   │   │   ├── dashboard/       # DashboardLayout
│   │   │   └── modals/          # InvestmentPlanWizard, MutualFundInvestModal, SIPCreationModal
│   │   ├── context/             # AuthContext
│   │   ├── data/                # mockData.js
│   │   ├── hooks/               # useTracking.js, useSocket.js
│   │   ├── pages/               # 25+ page components
│   │   ├── store/               # Zustand store (useStore.js)
│   │   ├── App.jsx              # Root component with routing
│   │   └── main.jsx             # Entry point
│   ├── package.json
│   └── vite.config.js
│
├── Backend/                     # Node.js Express API (port 5000)
│   ├── config/                  # db.js (MongoDB connection)
│   ├── controllers/             # adminController.js, eventController.js
│   ├── middleware/               # rateLimiter.js, auth.js
│   ├── models/                  # User, Session, Event, Trigger, Notification, FatigueState, PopupPolicy
│   ├── routes/                  # authRoutes, eventRoutes, aiRoutes, adminRoutes, analyticsRoutes
│   ├── scripts/                 # humanTrafficSimulator.js
│   ├── services/                # trackingService, intentEngine, triggerEngine, socketService, emailService, llmService, popupOrchestrator, popupPolicyService
│   ├── server.js                # Entry point
│   └── package.json
│
├── engine/                      # Python FastAPI engine (port 8000)
│   ├── admin/                   # api.py (admin endpoints)
│   ├── core/                    # brain.py, scorer.py, detectors.py, ml_model.py, temporal.py, psychology.py, pipeline.py, session_manager.py, metrics.py
│   ├── tests/                   # test_ml_model.py, test_simulated_session_manager.py
│   ├── utils/                   # .joblib model files
│   ├── main.py                  # FastAPI entry point
│   └── requirements.txt
│
├── admin-portal/                # React admin dashboard (port 5174)
│   ├── src/
│   │   ├── api/                 # engineService.js
│   │   ├── components/          # AdminLayout, InterventionModal, UIComponents
│   │   ├── context/             # AdminAuthContext
│   │   ├── hooks/               # useSocket.js
│   │   ├── pages/               # 13 admin pages
│   │   ├── App.jsx              # Root with routing
│   │   └── main.jsx
│   ├── package.json
│   └── vite.config.js
│
├── GEMINI.md                    # Feature brief / hackathon requirements
├── RUN.md                       # Local run instructions
├── README.md                    # Project overview
└── DATABASE_STRUCTURE.md        # Detailed database documentation
```

---

*Document generated for hackathon synopsis submission. FinovaWealth — Smart Behavioral Tracking Engine.*
