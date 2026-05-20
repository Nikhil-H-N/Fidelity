/**
 * ============================================================
 * FinovaWealth — Auth Routes
 * File: routes/authRoutes.js
 * ============================================================
 */

const express = require("express");
const router = express.Router();
const {
  register,
  verifySignupOTP,
  resendOTP,
  login,
  googleAuth,
  forgotPassword,
  verifyResetOTP,
  resetPassword,
} = require("../controllers/authController");
const { adminLogin } = require("../controllers/adminController");
const { protect } = require("../middleware/authMiddleware");

/* ── Signup ────────────────────────────────────────────────── */
router.post("/register", register);
router.post("/verify-signup-otp", verifySignupOTP);
router.post("/resend-otp", resendOTP);

/* ── Login ─────────────────────────────────────────────────── */
router.post("/login", login);
router.post("/admin-login", adminLogin);
router.post("/google", googleAuth);

/* ── Forgot Password ──────────────────────────────────────── */
router.post("/forgot-password", forgotPassword);
router.post("/verify-reset-otp", verifyResetOTP);
router.post("/reset-password", resetPassword);

/* ── Protected ─────────────────────────────────────────────── */
router.get("/me", protect, async (req, res) => {
  return res.status(200).json({
    success: true,
    message: "Authenticated user retrieved",
    data: {
      user: {
        id: req.user._id,
        fullName: req.user.fullName,
        email: req.user.email,
        role: req.user.role,
        isVerified: req.user.isVerified,
        authProvider: req.user.authProvider,
        riskProfile: req.user.riskProfile,
        investmentGoals: req.user.investmentGoals,
        intentScore: req.user.intentScore,
        createdAt: req.user.createdAt,
      },
    },
  });
});

module.exports = router;
