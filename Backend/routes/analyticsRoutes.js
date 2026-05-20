/**
 * ============================================================
 * FinovaWealth — Analytics Routes
 * File: routes/analyticsRoutes.js
 * ============================================================
 * API routes for the behavioral analytics dashboard.
 * All routes require authentication.
 * ============================================================
 */

const express = require("express");
const router = express.Router();
const { protect, authorize } = require("../middleware/authMiddleware");
const {
  dashboardAnalytics,
  recentEvents,
  highIntentUsers,
  sessionAnalytics,
  funnelAnalytics,
  topClicked,
  userIntent,
} = require("../controllers/analyticsController");

// All analytics routes require admin access
router.use(protect, authorize("admin"));

router.get("/dashboard", dashboardAnalytics);
router.get("/events", recentEvents);
router.get("/high-intent", highIntentUsers);
router.get("/sessions", sessionAnalytics);
router.get("/funnel", funnelAnalytics);
router.get("/top-clicked", topClicked);
router.get("/intent/:userId", userIntent);

module.exports = router;
