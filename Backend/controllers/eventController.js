/**
 * ============================================================
 * FinovaWealth — Event Controller
 * File: controllers/eventController.js
 * ============================================================
 * Handles behavioural event ingestion from the frontend
 * tracking layer. Supports single and batch event creation.
 * ============================================================
 */

const Event = require("../models/Event");
const Session = require("../models/Session");
const { processBatchEvents, recordFormAbandonment } = require("../services/trackingService");
const { processTriggeredRules } = require("../services/triggerEngine");

/**
 * POST /api/events
 * Accepts a single event or an array of events.
 * Body: { event: {...} } or { events: [{...}, ...] }
 */
const trackEvent = async (req, res) => {
  try {
    const { event, events, guestId, sessionId } = req.body;
    const userId = req.user?._id || guestId || sessionId || "anonymous_guest";
    const clientIp = req.ip || req.headers["x-forwarded-for"] || req.connection.remoteAddress;

    // Normalize to array
    const payload = events || (event ? [event] : []);

    if (payload.length === 0) {
      return res.status(400).json({
        success: false,
        message: "At least one event is required",
      });
    }

    // Process through tracking service (enrichment + intent + rules)
    const result = await processBatchEvents(userId, payload, clientIp);

    // Process any triggered behavioral rules
    if (result.triggers && result.triggers.length > 0) {
      const triggerUserId = result.mongoUserId || userId;
      await processTriggeredRules(triggerUserId, result.triggers, {
        guestId: req.user?._id ? null : guestId,
        intelligence: result.intelligence,
      });
    }

    return res.status(201).json({
      success: true,
      message: `${result.created} event(s) tracked`,
      data: {
        count: result.created,
        intentScore: result.intentScore,
        triggersCount: result.triggers?.length || 0,
        intelligence: result.intelligence,
      },
    });
  } catch (error) {
    console.error(`❌  Event tracking error: ${error.message}`);
    return res.status(500).json({
      success: false,
      message: "Failed to track event(s)",
    });
  }
};

/**
 * POST /api/events/session
 * Creates a new session and returns the sessionId.
 */
const createSession = async (req, res) => {
  try {
    const userId = req.user?._id;
    if (!userId) {
      return res.status(401).json({
        success: false,
        message: "Authentication required",
      });
    }

    const { device, browser, location, entrySource } = req.body;

    const session = await Session.create({
      userId,
      device: device || "unknown",
      browser: browser || "unknown",
      location: location || "unknown",
      entrySource: entrySource || "direct",
      sessionStart: new Date(),
      lastActive: new Date(),
      status: "active",
    });

    return res.status(201).json({
      success: true,
      message: "Session created",
      data: { sessionId: session._id },
    });
  } catch (error) {
    console.error(`❌  Session creation error: ${error.message}`);
    return res.status(500).json({
      success: false,
      message: "Failed to create session",
    });
  }
};

/**
 * POST /api/events/session/end
 * Ends an active session.
 */
const endSession = async (req, res) => {
  try {
    const userId = req.user?._id;
    const { sessionId, pagesVisited } = req.body;

    if (!sessionId) {
      return res.status(400).json({
        success: false,
        message: "sessionId is required",
      });
    }

    const session = await Session.findOne({ _id: sessionId, userId });
    if (!session) {
      return res.status(404).json({
        success: false,
        message: "Session not found",
      });
    }

    const sessionEnd = new Date();
    const duration = Math.round(
      (sessionEnd - new Date(session.sessionStart)) / 1000
    );

    session.sessionEnd = sessionEnd;
    session.duration = duration;
    session.status = duration < 10 ? "abandoned" : "completed";
    session.bounce = duration < 10;

    if (pagesVisited && pagesVisited.length > 0) {
      session.pagesVisited = [
        ...new Set([...session.pagesVisited, ...pagesVisited]),
      ];
    }

    await session.save();

    return res.status(200).json({
      success: true,
      message: "Session ended",
      data: { duration, status: session.status },
    });
  } catch (error) {
    console.error(`❌  Session end error: ${error.message}`);
    return res.status(500).json({
      success: false,
      message: "Failed to end session",
    });
  }
};

/**
 * POST /api/events/form-abandon
 * Records a form abandonment event with context.
 */
const trackFormAbandonment = async (req, res) => {
  try {
    const userId = req.user?._id;

    if (!userId) {
      return res.status(401).json({
        success: false,
        message: "Authentication required",
      });
    }

    const event = await recordFormAbandonment(userId, req.body);

    return res.status(201).json({
      success: true,
      message: "Form abandonment tracked",
      data: { eventId: event._id },
    });
  } catch (error) {
    console.error(`❌  Form abandonment error: ${error.message}`);
    return res.status(500).json({
      success: false,
      message: "Failed to track form abandonment",
    });
  }
};

module.exports = { trackEvent, createSession, endSession, trackFormAbandonment };

