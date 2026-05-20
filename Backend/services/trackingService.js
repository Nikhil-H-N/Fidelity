/**
 * ============================================================
 * FinovaWealth - Tracking Service
 * File: services/trackingService.js
 * ============================================================
 * Centralized service for processing, enriching, persisting, and
 * forwarding behavioural events.
 * ============================================================
 */

const Event = require("../models/Event");
const Session = require("../models/Session");
const User = require("../models/User");
const { updateUserIntentScore, evaluateRules } = require("./intentEngine");

const ENGINE_URL = process.env.ENGINE_URL || "http://127.0.0.1:8000";
const GUEST_HEATMAP_TTL_MS = 2 * 60 * 60 * 1000;
let lastEngineForwardWarningAt = 0;

const MONGO_EVENT_ALIASES = {
  click: "button_click",
  cta_click: "button_click",
  scroll: "scroll_depth",
  form_complete: "form_submit",
  form_completion: "form_submit",
  form_abandonment: "form_abandon",
  comparison_view: "comparison",
  pricing_view: "product_view",
  checkout_abandonment: "checkout_abandon",
  exit_near_conversion: "checkout_abandon",
  calculator: "calculator_usage",
  mouse_activity: "mouse_movement",
  idle_timeout: "inactive_session",
  return_session: "return_visit",
  page_visit: "page_view",
};

const MEANINGFUL_SESSION_EVENTS = new Set([
  "button_click",
  "form_start",
  "form_submit",
  "form_abandon",
  "checkout_start",
  "checkout_complete",
  "checkout_abandon",
  "comparison",
  "product_view",
  "calculator_usage",
  "notification_open",
  "chatbot_message",
  "return_visit",
  "repeated_page_visit",
  "investment_intent",
  "modal_open",
]);

const isValidObjectId = (id) => /^[0-9a-fA-F]{24}$/.test(String(id || ""));

const getGuestSlug = (value) => {
  const slug = String(value || "anonymous_guest").toLowerCase().replace(/[^a-z0-9]+/g, "-").replace(/^-|-$/g, "");
  return slug.slice(0, 48) || "anonymous-guest";
};

const resolveGuestUser = async (rawUserId) => {
  const slug = getGuestSlug(rawUserId);
  const email = `${slug}@guest.finova.local`;

  return User.findOneAndUpdate(
    { email },
    {
      $setOnInsert: {
        fullName: `Guest ${slug.slice(-6)}`,
        email,
        authProvider: "email",
        role: "user",
        isVerified: true,
      },
    },
    { returnDocument: "after", upsert: true, setDefaultsOnInsert: true }
  );
};

const asNumber = (value, fallback = null) => {
  if (value === undefined || value === null || value === "") return fallback;
  const number = Number(value);
  return Number.isFinite(number) ? number : fallback;
};

const parseTimestamp = (value) => {
  if (!value) return new Date();
  if (typeof value === "number") {
    const millis = value > 1e12 ? value : value * 1000;
    const date = new Date(millis);
    return Number.isNaN(date.getTime()) ? new Date() : date;
  }
  const date = new Date(value);
  return Number.isNaN(date.getTime()) ? new Date() : date;
};

const normalizeEventType = (eventType) => {
  const normalized = String(eventType || "").trim().toLowerCase();
  return MONGO_EVENT_ALIASES[normalized] || normalized;
};

const normalizePageId = (page) => {
  const value = String(page || "unknown").trim() || "unknown";
  return value.replace(/^\//, "").replace(/-/g, "_");
};

const getMetadata = (event) => (
  event.metadata && typeof event.metadata === "object" ? event.metadata : {}
);

const resolveMongoSession = async (userId, rawEvent, cache, clientIp) => {
  const metadata = getMetadata(rawEvent);
  const rawSessionId = rawEvent.sessionId || rawEvent.session_id || metadata.clientSessionId;
  const cacheKey = rawSessionId || "active";

  if (cache.has(cacheKey)) return cache.get(cacheKey);

  let session = null;
  if (isValidObjectId(rawSessionId)) {
    session = await Session.findOne({ _id: rawSessionId, userId });
  }

  if (!session) {
    session = await Session.findOne({ userId, status: "active" }).sort({ lastActive: -1 });
  }

  if (!session) {
    const priorSessions = await Session.countDocuments({ userId });
    const page = rawEvent.page || rawEvent.page_id || rawEvent.pageId || metadata.page || null;
    
    // Determine connection origin
    let connectionOrigin = "external";
    if (clientIp) {
      if (clientIp === "127.0.0.1" || clientIp === "::1" || clientIp.startsWith("192.168.") || clientIp.startsWith("10.")) {
        connectionOrigin = "internal";
      } else {
        connectionOrigin = "remote";
      }
    }

    session = await Session.create({
      userId,
      device: rawEvent.device || metadata.device || "unknown",
      browser: rawEvent.browser || metadata.browser || "unknown",
      location: rawEvent.location || metadata.location || "unknown",
      clientIp,
      connectionOrigin,
      entrySource: rawEvent.source || metadata.source || "direct",
      returningUser: priorSessions > 0 || Boolean(metadata.returningUser),
      sessionStart: new Date(),
      lastActive: new Date(),
      pagesVisited: page ? [page] : [],
      navigationPath: page ? [{ page, timestamp: new Date(), duration: 0 }] : [],
      status: "active",
    });
  }

  cache.set(cacheKey, session);
  return session;
};

const buildEnrichedEvent = (userId, rawEvent, session) => {
  const metadata = getMetadata(rawEvent);
  const originalEventType = rawEvent.eventType || rawEvent.event_type || rawEvent.type;
  const eventType = normalizeEventType(originalEventType);
  const timestamp = parseTimestamp(rawEvent.timestamp);
  const scrollDepth = asNumber(
    rawEvent.scrollDepth ?? rawEvent.scroll_depth ?? metadata.scrollDepth ?? metadata.depth,
    null
  );

  return {
    userId,
    sessionId: session?._id || null,
    eventType,
    page: rawEvent.page || rawEvent.page_id || rawEvent.pageId || metadata.page || null,
    element: rawEvent.element || rawEvent.element_id || rawEvent.elementId || metadata.element || null,
    source: rawEvent.source || metadata.source || null,
    buttonName: rawEvent.buttonName || rawEvent.button_name || metadata.buttonName || metadata.label || null,
    formType: rawEvent.formType || rawEvent.form_type || metadata.form || metadata.formType || null,
    fieldName: rawEvent.fieldName || rawEvent.field_name || metadata.field || null,
    duration: asNumber(rawEvent.duration ?? rawEvent.dwellTime ?? metadata.duration ?? metadata.timeSpent, null),
    scrollDepth,
    intentScore: asNumber(rawEvent.intentScore ?? rawEvent.intent_score, null),
    x: asNumber(metadata.pageX ?? rawEvent.pageX ?? rawEvent.x ?? metadata.x, null),
    y: asNumber(metadata.pageY ?? rawEvent.pageY ?? rawEvent.y ?? metadata.y, null),
    xRatio: asNumber(metadata.xRatio ?? null, null),
    yRatio: asNumber(metadata.yRatio ?? null, null),
    viewportWidth: asNumber(metadata.viewportWidth ?? rawEvent.viewportWidth ?? null, null),
    viewportHeight: asNumber(metadata.viewportHeight ?? rawEvent.viewportHeight ?? null, null),
    targetPositionMode: metadata.targetPositionMode || 'document',
    targetCenterClientX: asNumber(metadata.targetCenterClientX ?? null, null),
    targetCenterClientY: asNumber(metadata.targetCenterClientY ?? null, null),
    targetCenterPageX: asNumber(metadata.targetCenterPageX ?? null, null),
    targetCenterPageY: asNumber(metadata.targetCenterPageY ?? null, null),
    targetScrollContainerTop: asNumber(metadata.targetScrollContainerTop ?? 0, 0),
    targetScrollContainerLeft: asNumber(metadata.targetScrollContainerLeft ?? 0, 0),
    device: rawEvent.device || metadata.device || null,
    browser: rawEvent.browser || metadata.browser || null,
    metadata: {
      ...metadata,
      rawEventType: originalEventType || eventType,
      clientSessionId: rawEvent.sessionId || rawEvent.session_id || metadata.clientSessionId || null,
      clientIp: session?.clientIp || null,
      connectionOrigin: session?.connectionOrigin || "external",
    },
    timestamp,
  };
};

const applySessionEvents = async (sessionId, events) => {
  const session = await Session.findById(sessionId);
  if (!session) return;

  const sorted = [...events].sort((a, b) => new Date(a.timestamp) - new Date(b.timestamp));
  let meaningfulInBatch = false;

  for (const event of sorted) {
    const timestamp = parseTimestamp(event.timestamp);
    const page = event.page;

    session.eventCount += 1;
    session.lastActive = timestamp;

    if (page) {
      session.lastPage = page;
      if (!session.pagesVisited.includes(page)) {
        if (session.pagesVisited.length < 100) {
          session.pagesVisited.push(page);
        }
      }

      if (["page_view", "return_visit", "repeated_page_visit"].includes(event.eventType)) {
        if (session.navigationPath.length < 200) {
          session.navigationPath.push({
            page,
            timestamp,
            duration: event.duration || 0,
          });
        }
      }

      if (event.eventType === "time_spent" && session.navigationPath.length > 0) {
        const lastVisit = [...session.navigationPath].reverse().find((entry) => entry.page === page);
        if (lastVisit) lastVisit.duration = event.duration || lastVisit.duration || 0;
      }
    }

    if (MEANINGFUL_SESSION_EVENTS.has(event.eventType)) meaningfulInBatch = true;
    if (event.eventType === "form_submit") session.conversion = true;
    if (["return_visit", "repeated_page_visit"].includes(event.eventType)) session.returningUser = true;
    if (event.eventType === "rapid_click") session.rapidClickCount += 1;
    if (event.eventType === "inactive_session") session.inactiveDetected = true;

    if (event.eventType === "session_end") {
      session.sessionEnd = timestamp;
      session.duration = Math.max(0, Math.round((timestamp - new Date(session.sessionStart)) / 1000));
      session.status = "completed";
    }

    if (event.eventType === "bounce") {
      session.bounce = true;
      if (!session.sessionEnd) session.sessionEnd = timestamp;
      session.duration = Math.max(0, Math.round((timestamp - new Date(session.sessionStart)) / 1000));
      session.status = "abandoned";
    }
  }

  if (meaningfulInBatch || session.pagesVisited.length > 1 || session.eventCount > 4 || session.conversion) {
    session.bounce = false;
  } else if (session.sessionEnd && session.pagesVisited.length <= 1 && !session.conversion) {
    session.bounce = true;
    session.status = "abandoned";
  }

  await session.save();
};

const forwardToEngine = async (userId, event) => {
  try {
    const metadata = event.metadata || {};
    const analyzeUrl = ENGINE_URL.endsWith("/analyze") ? ENGINE_URL : `${ENGINE_URL.replace(/\/$/, "")}/analyze`;
    const response = await fetch(analyzeUrl, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        user_id: String(userId),
        event_type: event.eventType,
        page_id: normalizePageId(event.page),
        element_id: event.element || event.buttonName || metadata.element || null,
        timestamp: new Date(event.timestamp).getTime() / 1000,
        dwell_time: event.duration || asNumber(metadata.dwellTime ?? metadata.timeSpent, 0),
        scroll_depth: event.scrollDepth || asNumber(metadata.scrollDepth ?? metadata.depth, 0),
        idle_time: asNumber(metadata.idleTime ?? metadata.idle_time, event.eventType === "inactive_session" ? event.duration || 0 : 0),
        mouse_move_count: asNumber(metadata.moveCount ?? metadata.move_count ?? metadata.mouseMoveCount, 0),
        x: event.x,
        y: event.y,
        metadata,
      }),
    });

    return response.ok ? response.json() : null;
  } catch (error) {
    const now = Date.now();
    if (now - lastEngineForwardWarningAt > 30000) {
      lastEngineForwardWarningAt = now;
      console.warn(`Engine forwarding failed: ${error.message}. Is the Python engine running on ${ENGINE_URL}?`);
    }
    return null;
  }
};

/**
 * Process and persist a batch of events.
 * Enriches each event with user/session context, computes intent, and forwards
 * all events to the Python engine even when Mongo persistence is unavailable.
 */
const processBatchEvents = async (userId, events, clientIp) => {
  const guestUser = isValidObjectId(userId) ? null : await resolveGuestUser(userId);
  const mongoUserId = isValidObjectId(userId) ? userId : guestUser?._id;
  const isGuest = Boolean(guestUser);
  const hasMongoUser = Boolean(mongoUserId);
  const sessionCache = new Map();
  const enriched = [];
  const sessionEventGroups = new Map();
  let triggers = [];
  let actualIntentScore = 0;

  for (const rawEvent of events) {
    const session = hasMongoUser
      ? await resolveMongoSession(mongoUserId, rawEvent, sessionCache, clientIp)
      : null;
    const event = buildEnrichedEvent(mongoUserId || userId, rawEvent, session);

    if (isGuest) {
      event.expireAt = new Date(Date.now() + GUEST_HEATMAP_TTL_MS);
      event.metadata = {
        ...event.metadata,
        isGuest: true,
        guestId: String(userId),
        retentionHours: 2,
      };
    }

    enriched.push(event);

    if (session?._id) {
      const key = String(session._id);
      if (!sessionEventGroups.has(key)) sessionEventGroups.set(key, []);
      sessionEventGroups.get(key).push(event);
    }
  }

  let createdCount = 0;
  if (hasMongoUser) {
    const persistable = enriched.filter((event) => event.sessionId && event.eventType);
    try {
      if (persistable.length > 0) {
        const created = await Event.insertMany(persistable, { ordered: false });
        createdCount = created.length;
      }

      await Promise.all(
        [...sessionEventGroups.entries()].map(([sessionId, group]) => applySessionEvents(sessionId, group))
      );

      if (mongoUserId) {
        const score = await updateUserIntentScore(mongoUserId);
        if (score != null) actualIntentScore = score;
        triggers = await evaluateRules(mongoUserId);
      }
    } catch (mongoError) {
      console.warn(`MongoDB persistence failed: ${mongoError.message}`);
    }
  }

  const results = await Promise.allSettled(
    enriched.map((event) => forwardToEngine(userId, event))
  );
  const intelligence = results
    .filter((r) => r.status === "fulfilled" && r.value)
    .map((r) => r.value);

  return {
    created: createdCount,
    intentScore: actualIntentScore,
    triggers: triggers || [],
    intelligence,
    mongoUserId: mongoUserId || null,
  };
};

/**
 * Record a form abandonment event with context.
 */
const recordFormAbandonment = async (userId, abandonData) => {
  const session = await resolveMongoSession(userId, {
    ...abandonData,
    eventType: "form_abandon",
  }, new Map());

  const event = await Event.create({
    userId,
    sessionId: session._id,
    eventType: "form_abandon",
    page: abandonData.page || null,
    formType: abandonData.formType || null,
    metadata: {
      filledFields: abandonData.filledFields || [],
      totalFields: abandonData.totalFields || 0,
      completionPercent: abandonData.completionPercent || 0,
      timeSpent: abandonData.timeSpent || 0,
      lastFieldFocused: abandonData.lastFieldFocused || null,
    },
    duration: abandonData.timeSpent || null,
    timestamp: new Date(),
  });

  await applySessionEvents(session._id, [event.toObject()]);
  await updateUserIntentScore(userId);

  return event;
};

module.exports = {
  processBatchEvents,
  recordFormAbandonment,
};
