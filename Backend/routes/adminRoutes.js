/**
 * ============================================================
 * FinovaWealth — Admin Routes
 * File: routes/adminRoutes.js
 * ============================================================
 * All routes require authentication + admin role.
 * ============================================================
 */

const express = require("express");
const router = express.Router();
const { protect, authorize } = require("../middleware/authMiddleware");
const {
  getAllUsers,
  getAllEvents,
  getHeatmapEvents,
  getAllSessions,
  getAnalytics,
  deleteUser,
  getPopupPolicySettings,
  updatePopupPolicySettings,
} = require("../controllers/adminController");

// Every route below requires admin access
router.use(protect, authorize("admin"));

router.delete("/users/:id", deleteUser);
router.get("/heatmap", getHeatmapEvents);

router.get("/users", getAllUsers);
router.get("/events", getAllEvents);
router.get("/sessions", getAllSessions);
router.get("/analytics", getAnalytics);
router.get("/popup-policy", getPopupPolicySettings);
router.put("/popup-policy", updatePopupPolicySettings);

module.exports = router;
