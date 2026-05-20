/**
 * ============================================================
 * FinovaWealth — Analytics Service
 * File: services/analyticsService.js
 * ============================================================
 * Aggregation queries for the analytics dashboard.
 * ============================================================
 */


const Event = require("../models/Event");
const Session = require("../models/Session");
const User = require("../models/User");

/**
 * Get dashboard analytics summary.
 */
const getDashboardAnalytics = async () => {
  const now = new Date();
  const last24h = new Date(now - 24 * 60 * 60 * 1000);
  const last7d = new Date(now - 7 * 24 * 60 * 60 * 1000);

  const [
    totalEvents24h,
    activeSessions,
    totalUsers,
    eventBreakdown,
    recentAbandons,
    highIntentUsers,
  ] = await Promise.all([
    Event.countDocuments({ timestamp: { $gte: last24h } }),
    Session.countDocuments({ status: "active" }),
    User.countDocuments({}),
    Event.aggregate([
      { $match: { timestamp: { $gte: last24h } } },
      { $group: { _id: "$eventType", count: { $sum: 1 } } },
      { $sort: { count: -1 } },
    ]),
    Event.countDocuments({
      eventType: "form_abandon",
      timestamp: { $gte: last24h },
    }),
    User.countDocuments({ intentScore: { $gte: 70 } }),
  ]);

  // Average session duration (completed sessions in last 7 days)
  const avgDurationResult = await Session.aggregate([
    {
      $match: {
        status: "completed",
        sessionStart: { $gte: last7d },
        duration: { $gt: 0 },
      },
    },
    { $group: { _id: null, avgDuration: { $avg: "$duration" } } },
  ]);
  const avgSessionDuration = avgDurationResult[0]?.avgDuration || 0;

  // Conversion funnel
  const funnel = await buildConversionFunnel(last7d);

  return {
    totalEvents24h,
    activeSessions,
    totalUsers,
    eventBreakdown,
    recentAbandons,
    highIntentUsers,
    avgSessionDuration: Math.round(avgSessionDuration),
    funnel,
  };
};

/**
 * Build conversion funnel data.
 */
const buildConversionFunnel = async (since) => {
  const [visitors, signups, formStarts, formSubmits, investments] =
    await Promise.all([
      Session.countDocuments({ sessionStart: { $gte: since } }),
      User.countDocuments({ createdAt: { $gte: since } }),
      Event.countDocuments({
        eventType: "form_start",
        timestamp: { $gte: since },
      }),
      Event.countDocuments({
        eventType: "form_submit",
        timestamp: { $gte: since },
      }),
      Event.countDocuments({
        eventType: "investment_intent",
        timestamp: { $gte: since },
      }),
    ]);

  const total = visitors || 1;
  return [
    { stage: "Site Visitors", users: visitors, percentage: 100 },
    { stage: "Signed Up", users: signups, percentage: Math.round((signups / total) * 100) },
    { stage: "Started Form", users: formStarts, percentage: Math.round((formStarts / total) * 100) },
    { stage: "Submitted Form", users: formSubmits, percentage: Math.round((formSubmits / total) * 100) },
    { stage: "Investment Intent", users: investments, percentage: Math.round((investments / total) * 100) },
  ];
};

/**
 * Get recent events feed.
 */
const getRecentEvents = async (limit = 50) => {
  return Event.find({})
    .sort({ timestamp: -1 })
    .limit(limit)
    .populate("userId", "fullName email")
    .lean();
};

/**
 * Get high-intent users.
 */
const getHighIntentUsers = async (minScore = 60, limit = 20) => {
  return User.find({ intentScore: { $gte: minScore } })
    .sort({ intentScore: -1 })
    .limit(limit)
    .select("fullName email intentScore riskProfile createdAt")
    .lean();
};

/**
 * Get session analytics.
 */
const getSessionAnalytics = async (limit = 50) => {
  return Session.find({})
    .sort({ sessionStart: -1 })
    .limit(limit)
    .populate("userId", "fullName email")
    .lean();
};

/**
 * Get top clicked elements.
 */
const getTopClicked = async (days = 7) => {
  const since = new Date(Date.now() - days * 24 * 60 * 60 * 1000);
  return Event.aggregate([
    {
      $match: {
        eventType: "button_click",
        timestamp: { $gte: since },
        element: { $ne: null },
      },
    },
    { $group: { _id: "$element", clicks: { $sum: 1 } } },
    { $sort: { clicks: -1 } },
    { $limit: 10 },
  ]);
};

module.exports = {
  getDashboardAnalytics,
  buildConversionFunnel,
  getRecentEvents,
  getHighIntentUsers,
  getSessionAnalytics,
  getTopClicked,
};
