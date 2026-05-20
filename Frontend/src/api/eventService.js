/**
 * ============================================================
 * FinovaWealth — Event Tracking API Service
 * File: Frontend/src/api/eventService.js
 * ============================================================
 * Sends behavioural events to POST /api/events.
 * Uses a debounced batch queue to avoid flooding the backend.
 * ============================================================
 */

import apiClient from "./client";
import toast from "react-hot-toast";
import { getBrowserInfo, getDeviceType } from "../utils/tracker";

/** In-memory queue — flushed every FLUSH_INTERVAL ms */
let eventQueue = [];
let flushTimer = null;
const FLUSH_INTERVAL = 3000; // 3 seconds
const MAX_BATCH_SIZE = 20;
const MAX_QUEUE_SIZE = 200;
const MAX_RETRY_ATTEMPTS = 3;
const LAST_INTERACTION_KEY = 'fw_lastInteractionContext';
const INTERACTION_HISTORY_KEY = 'fw_interactionHistory';
const CONTEXT_EVENT_TYPES = new Set([
  'page_view',
  'button_click',
  'cta_click',
  'form_start',
  'form_progress',
  'form_submit',
  'form_abandon',
  'checkout_start',
  'checkout_abandon',
  'checkout_complete',
  'product_view',
  'comparison',
  'calculator_usage',
]);

const CHATBOT_LABEL_PATTERN = /open ai assistant|close chatbot|send message|continue recommended path|finova ai/i;

const getGuestId = () => {
  let gid = localStorage.getItem('fw_guestId');
  if (!gid) {
    gid = 'guest_' + Math.random().toString(36).substr(2, 9);
    localStorage.setItem('fw_guestId', gid);
  }
  return gid;
};

const getStoredUser = () => {
  try {
    return JSON.parse(localStorage.getItem('fw_user') || 'null');
  } catch {
    return null;
  }
};

export const getTrackingUserId = () => {
  const user = getStoredUser();
  return user?.id || user?._id || getGuestId();
};

const getSessionId = () => {
  let sessionId = sessionStorage.getItem('fw_sessionId');
  if (!sessionId) {
    sessionId = 'sess_' + Math.random().toString(36).slice(2, 11);
    sessionStorage.setItem('fw_sessionId', sessionId);
  }
  return sessionId;
};

const getSessionDuration = () => {
  const startedAt = Number(sessionStorage.getItem('fw_sessionStartedAt') || Date.now());
  return Math.max(0, Math.round((Date.now() - startedAt) / 1000));
};

const buildEvent = (event) => {
  const sessionId = getSessionId();
  const metadata = event.metadata || {};
  const user = getStoredUser();

  return {
    ...event,
    page: event.page || window.location.pathname,
    sessionId,
    device: event.device || getDeviceType(),
    browser: event.browser || getBrowserInfo(),
    metadata: {
      ...metadata,
      page: event.page || metadata.page || window.location.pathname,
      clientSessionId: sessionId,
      trackingUserId: getTrackingUserId(),
      userEmail: user?.email || metadata.userEmail || null,
      userName: user?.fullName || metadata.userName || null,
    },
    timestamp: event.timestamp || new Date().toISOString(),
  };
};

const isChatbotContext = (context = {}) => {
  const label = [
    context.element,
    context.product,
    context.form,
    context.actionLabel,
  ].filter(Boolean).join(' ');

  return Boolean(
    context.isChatbot ||
    context.surface === 'chatbot' ||
    context.source === 'chatbot_action' ||
    String(context.eventType || '').startsWith('chatbot_') ||
    CHATBOT_LABEL_PATTERN.test(label)
  );
};

const isChatbotInteraction = (event) => {
  const metadata = event.metadata || {};
  const label = [
    event.element,
    metadata.element,
    event.buttonName,
    metadata.label,
    metadata.actionLabel,
  ].filter(Boolean).join(' ');

  return Boolean(
    metadata.trackingSurface === 'chatbot' ||
    metadata.source === 'chatbot_action' ||
    String(event.eventType || '').startsWith('chatbot_') ||
    CHATBOT_LABEL_PATTERN.test(label)
  );
};

export const getLastInteractionContext = () => {
  if (typeof window === 'undefined') return null;

  try {
    const history = JSON.parse(localStorage.getItem(INTERACTION_HISTORY_KEY) || '[]');
    const latestNonChatbot = Array.isArray(history)
      ? history.find((entry) => !isChatbotContext(entry))
      : null;

    if (latestNonChatbot) return latestNonChatbot;

    const fallback = JSON.parse(localStorage.getItem(LAST_INTERACTION_KEY) || 'null');
    return fallback && !isChatbotContext(fallback) ? fallback : null;
  } catch {
    return null;
  }
};

const rememberLastInteraction = (event) => {
  if (typeof window === 'undefined' || !CONTEXT_EVENT_TYPES.has(event.eventType)) return;

  const metadata = event.metadata || {};
  const context = {
    eventType: event.eventType,
    page: event.page || metadata.page || window.location.pathname,
    element: event.element || metadata.element || event.buttonName || null,
    form: event.formType || metadata.form || metadata.formType || null,
    completion: metadata.completionPercent ?? metadata.completion ?? metadata.progress ?? null,
    product: metadata.productName || metadata.productId || metadata.fund || null,
    surface: metadata.trackingSurface || 'page',
    source: metadata.source || null,
    actionLabel: metadata.actionLabel || null,
    isChatbot: isChatbotInteraction(event),
    timestamp: event.timestamp || new Date().toISOString(),
  };

  try {
    const history = JSON.parse(localStorage.getItem(INTERACTION_HISTORY_KEY) || '[]');
    const nextHistory = [context, ...(Array.isArray(history) ? history : [])].slice(0, 12);
    localStorage.setItem(INTERACTION_HISTORY_KEY, JSON.stringify(nextHistory));

    if (!context.isChatbot) {
      localStorage.setItem(LAST_INTERACTION_KEY, JSON.stringify(context));
    }
  } catch {
    // Ignore storage failures; tracking should never block the UI.
  }
};

/**
 * Queue a single event for batch dispatch.
 * @param {Object} event
 */
export const queueEvent = (event) => {
  const builtEvent = buildEvent(event);
  rememberLastInteraction(builtEvent);

  // Drop oldest events if queue exceeds max size
  if (eventQueue.length >= MAX_QUEUE_SIZE) {
    eventQueue.splice(0, eventQueue.length - MAX_QUEUE_SIZE + 1);
  }

  eventQueue.push(builtEvent);

  // Flush immediately if batch is full
  if (eventQueue.length >= MAX_BATCH_SIZE) {
    flushEvents();
    return;
  }

  // Otherwise schedule a flush
  if (!flushTimer) {
    flushTimer = setTimeout(flushEvents, FLUSH_INTERVAL);
  }
};

/**
 * Flush the event queue to the backend.
 */
export const flushEvents = async () => {
  if (flushTimer) {
    clearTimeout(flushTimer);
    flushTimer = null;
  }

  if (eventQueue.length === 0) return;

  const batch = [...eventQueue];
  eventQueue = [];

  try {
    const sessionId = sessionStorage.getItem('fw_sessionId');
    const guestId = getGuestId();
    const res = await apiClient.post("/events", { 
      events: batch,
      sessionId,
      guestId
    });

    // Handle real-time interventions from Python Engine
    const intelligence = res.data?.data?.intelligence || [];
    intelligence.forEach(intel => {
      if (intel.interventions && intel.interventions.length > 0) {
        intel.interventions.forEach(iv => {
          // Display the intervention as a cinematic nudge
          toast(iv.payload.message, {
            icon: iv.type === 'nudge' ? '🔔' : '🚀',
            duration: 6000,
            style: {
              border: '2px solid #6366f1',
              padding: '20px',
              color: '#1e293b',
              fontWeight: 'bold',
              borderRadius: '16px',
              boxShadow: '0 20px 25px -5px rgb(0 0 0 / 0.1)',
            },
          });
        });
      }
    });

  } catch (error) {
    // Track retry count via metadata to cap retries
    const retried = batch.map((e) => ({
      ...e,
      _retryCount: (e._retryCount || 0) + 1,
    }));
    const retryable = retried.filter((e) => e._retryCount <= MAX_RETRY_ATTEMPTS);
    const dropped = retried.length - retryable.length;
    if (dropped > 0) {
      console.warn(`Dropped ${dropped} event(s) after ${MAX_RETRY_ATTEMPTS} failed retries`);
    }
    eventQueue = [...retryable, ...eventQueue];
  }
};

const appendExitEvents = () => {
  const duration = getSessionDuration();
  const pageCount = Number(sessionStorage.getItem('fw_pageCount') || 0);
  const interactionCount = Number(sessionStorage.getItem('fw_interactionCount') || 0);
  const bounceSent = sessionStorage.getItem('fw_bounceSent') === 'true';

  eventQueue.push(buildEvent({
    eventType: 'session_end',
    duration,
    metadata: {
      duration,
      pageCount,
      interactionCount,
      reason: 'page_unload',
    },
  }));

  if (!bounceSent && pageCount <= 1 && interactionCount <= 1 && duration <= 30) {
    sessionStorage.setItem('fw_bounceSent', 'true');
    eventQueue.push(buildEvent({
      eventType: 'bounce',
      duration,
      metadata: {
        duration,
        pageCount,
        interactionCount,
      },
    }));
  }
};

/**
 * Create a new tracking session.
 * @param {{ device?: string, browser?: string, location?: string }} meta
 * @returns {Promise<string>} sessionId
 */
export const createTrackingSession = async (meta = {}) => {
  try {
    const res = await apiClient.post("/events/session", meta);
    return res.data?.data?.sessionId;
  } catch (error) {
    console.warn("Failed to create tracking session", error.message);
    return null;
  }
};

// Flush on page unload
if (typeof window !== "undefined") {
  window.addEventListener("beforeunload", () => {
    appendExitEvents();

    if (eventQueue.length > 0) {
      // Use sendBeacon for reliability during unload
      const token = localStorage.getItem("fw_token");
      const url = (import.meta.env.VITE_API_URL || "http://localhost:5000/api") + "/events";
      const sessionId = getSessionId();
      const guestId = getGuestId();
      const blob = new Blob(
        [JSON.stringify({ events: eventQueue, sessionId, guestId })],
        { type: "application/json" }
      );
      // sendBeacon doesn't support custom headers, so fall back to fetch with keepalive
      fetch(url, {
        method: "POST",
        body: blob,
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${token}`,
        },
        keepalive: true,
      }).catch(() => {});
    }
  });
}
