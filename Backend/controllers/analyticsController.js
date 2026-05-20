/**
 * ============================================================
 * FinovaWealth — Analytics Controller
 * File: controllers/analyticsController.js
 * ============================================================
 * Handles analytics API endpoints for the behavioral
 * intelligence dashboard.
 * ============================================================
 */

const {
  getDashboardAnalytics,
  buildConversionFunnel,
  getRecentEvents,
  getHighIntentUsers,
  getSessionAnalytics,
  getTopClicked,
} = require("../services/analyticsService");
const { calculateIntentScore } = require("../services/intentEngine");

/**
 * GET /api/analytics/dashboard
 * Returns aggregated dashboard analytics.
 */
const dashboardAnalytics = async (req, res) => {
  try {
    const data = await getDashboardAnalytics();
    return res.status(200).json({ success: true, data });
  } catch (error) {
    console.error("Dashboard analytics error:", error.message);
    return res.status(500).json({ success: false, message: "Failed to fetch analytics" });
  }
};

/**
 * GET /api/analytics/events
 * Returns recent event feed.
 */
const recentEvents = async (req, res) => {
  try {
    const limit = parseInt(req.query.limit) || 50;
    const data = await getRecentEvents(limit);
    return res.status(200).json({ success: true, data });
  } catch (error) {
    console.error("Recent events error:", error.message);
    return res.status(500).json({ success: false, message: "Failed to fetch events" });
  }
};

/**
 * GET /api/analytics/high-intent
 * Returns high-intent users.
 */
const highIntentUsers = async (req, res) => {
  try {
    const minScore = parseInt(req.query.minScore) || 60;
    const data = await getHighIntentUsers(minScore);
    return res.status(200).json({ success: true, data });
  } catch (error) {
    console.error("High intent users error:", error.message);
    return res.status(500).json({ success: false, message: "Failed to fetch high-intent users" });
  }
};

/**
 * GET /api/analytics/sessions
 * Returns session analytics.
 */
const sessionAnalytics = async (req, res) => {
  try {
    const limit = parseInt(req.query.limit) || 50;
    const data = await getSessionAnalytics(limit);
    return res.status(200).json({ success: true, data });
  } catch (error) {
    console.error("Session analytics error:", error.message);
    return res.status(500).json({ success: false, message: "Failed to fetch sessions" });
  }
};

/**
 * GET /api/analytics/funnel
 * Returns conversion funnel data.
 */
const funnelAnalytics = async (req, res) => {
  try {
    const last7d = new Date(Date.now() - 7 * 24 * 60 * 60 * 1000);
    const funnel = await buildConversionFunnel(last7d);
    return res.status(200).json({ success: true, data: funnel });
  } catch (error) {
    console.error("Funnel analytics error:", error.message);
    return res.status(500).json({ success: false, message: "Failed to fetch funnel data" });
  }
};

/**
 * GET /api/analytics/top-clicked
 * Returns most clicked elements.
 */
const topClicked = async (req, res) => {
  try {
    const days = parseInt(req.query.days) || 7;
    const data = await getTopClicked(days);
    return res.status(200).json({ success: true, data });
  } catch (error) {
    console.error("Top clicked error:", error.message);
    return res.status(500).json({ success: false, message: "Failed to fetch top clicked" });
  }
};

/**
 * GET /api/analytics/intent/:userId
 * Returns intent score for a specific user.
 */
const userIntent = async (req, res) => {
  try {
    const { userId } = req.params;
    const data = await calculateIntentScore(userId);
    return res.status(200).json({ success: true, data });
  } catch (error) {
    console.error("User intent error:", error.message);
    return res.status(500).json({ success: false, message: "Failed to calculate intent" });
  }
};

module.exports = {
  dashboardAnalytics,
  recentEvents,
  highIntentUsers,
  sessionAnalytics,
  funnelAnalytics,
  topClicked,
  userIntent,
};
