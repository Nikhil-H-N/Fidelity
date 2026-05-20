/**
 * ============================================================
 * FinovaWealth — Auth Controller
 * File: controllers/authController.js
 * ============================================================
 *
 * SIGNUP FLOW:
 *   POST /api/auth/register        → validate + store temp user + send OTP
 *   POST /api/auth/verify-signup-otp → verify OTP → mark verified → JWT
 *   POST /api/auth/resend-otp      → resend signup OTP
 *
 * LOGIN:
 *   POST /api/auth/login           → email + password → JWT
 *   POST /api/auth/google          → Google OAuth → JWT
 *
 * FORGOT PASSWORD:
 *   POST /api/auth/forgot-password → send reset OTP
 *   POST /api/auth/verify-reset-otp → verify reset OTP
 *   POST /api/auth/reset-password  → set new password
 *
 * ============================================================
 */

const User = require("../models/User");
const generateOTP = require("../utils/generateOTP");
const generateToken = require("../utils/generateToken");
const { sendOTPEmail } = require("../services/emailService");
const { verifyGoogleToken } = require("../services/googleAuthService");

const OTP_EXPIRY = () => {
  const mins = parseInt(process.env.OTP_EXPIRY_MINUTES, 10) || 10;
  return new Date(Date.now() + mins * 60 * 1000);
};

/* ═══════════════════════════════════════════════════════════
 * SIGNUP FLOW
 * ═══════════════════════════════════════════════════════════ */

/**
 * POST /api/auth/register
 * Creates user (unverified) + sends OTP email.
 */
const register = async (req, res) => {
  try {
    const { fullName, email, phone, password } = req.body;

    if (!fullName || !email || !password) {
      return res.status(400).json({
        success: false,
        message: "Full name, email, and password are required",
      });
    }

    const emailRegex = /^[a-zA-Z0-9._%+-]+@[a-zA-Z0-9.-]+\.[a-zA-Z]{2,}$/;
    if (!emailRegex.test(email)) {
      return res.status(400).json({
        success: false,
        message: "Enter a valid email address",
      });
    }

    if (password.length < 8) {
      return res.status(400).json({
        success: false,
        message: "Password must be at least 8 characters long",
      });
    }

    const normalizedEmail = email.toLowerCase().trim();

    // Check if user already exists
    const existingUser = await User.findOne({ email: normalizedEmail });

    if (existingUser && existingUser.isVerified) {
      return res.status(409).json({
        success: false,
        message: "An account with this email already exists. Please login.",
      });
    }

    const otp = generateOTP();
    const otpExpires = OTP_EXPIRY();

    if (existingUser && !existingUser.isVerified) {
      // User registered but never verified — update and resend OTP
      existingUser.fullName = fullName;
      existingUser.phone = phone || null;
      existingUser.passwordHash = password; // pre-save hook will hash
      existingUser.otp = otp;
      existingUser.otpExpires = otpExpires;
      await existingUser.save();

      await sendOTPEmail(normalizedEmail, otp);

      return res.status(200).json({
        success: true,
        message: "OTP sent to your email. Please verify to complete registration.",
        data: { email: normalizedEmail },
      });
    }

    // Create new user (unverified)
    await User.create({
      fullName,
      email: normalizedEmail,
      phone: phone || null,
      passwordHash: password,
      authProvider: "email",
      otp,
      otpExpires,
      isVerified: false,
    });

    await sendOTPEmail(normalizedEmail, otp);

    return res.status(201).json({
      success: true,
      message: "OTP sent to your email. Please verify to complete registration.",
      data: { email: normalizedEmail },
    });
  } catch (error) {
    console.error("Register error:", error.message);
    return res.status(500).json({
      success: false,
      message: "Internal server error during registration",
    });
  }
};

/**
 * POST /api/auth/verify-signup-otp
 * Verifies signup OTP → marks user verified → returns JWT.
 */
const verifySignupOTP = async (req, res) => {
  try {
    const { email, otp } = req.body;

    if (!email || !otp) {
      return res.status(400).json({
        success: false,
        message: "Email and OTP are required",
      });
    }

    const user = await User.findByEmailWithPassword(email.toLowerCase().trim());
    if (!user) {
      return res.status(404).json({
        success: false,
        message: "No account found with this email",
      });
    }

    if (user.isVerified) {
      return res.status(400).json({
        success: false,
        message: "Email is already verified. Please login.",
      });
    }

    if (!user.otp || user.otp !== String(otp)) {
      return res.status(400).json({
        success: false,
        message: "Invalid OTP. Please check and try again.",
      });
    }

    if (user.otpExpires < new Date()) {
      return res.status(400).json({
        success: false,
        message: "OTP has expired. Please request a new one.",
      });
    }

    // Mark verified & clear OTP
    user.isVerified = true;
    user.otp = undefined;
    user.otpExpires = undefined;
    await user.save();
    
    console.log(`✅ User ${user.email} verified and updated in database.`);

    const token = generateToken(user);

    return res.status(200).json({
      success: true,
      message: "Email verified successfully. Welcome to FinovaWealth!",
      data: {
        token,
        user: {
          id: user._id,
          fullName: user.fullName,
          email: user.email,
          role: user.role,
          isVerified: true,
          authProvider: user.authProvider,
        },
      },
    });
  } catch (error) {
    console.error("Verify signup OTP error:", error.message);
    return res.status(500).json({
      success: false,
      message: "Internal server error during OTP verification",
    });
  }
};

/**
 * POST /api/auth/resend-otp
 * Resends signup OTP (only for unverified accounts).
 */
const resendOTP = async (req, res) => {
  try {
    const { email } = req.body;

    if (!email) {
      return res.status(400).json({
        success: false,
        message: "Email is required",
      });
    }

    const user = await User.findByEmailWithPassword(email.toLowerCase().trim());
    if (!user) {
      return res.status(404).json({
        success: false,
        message: "No account found with this email",
      });
    }

    if (user.isVerified) {
      return res.status(400).json({
        success: false,
        message: "Email is already verified. Please login.",
      });
    }

    const otp = generateOTP();
    user.otp = otp;
    user.otpExpires = OTP_EXPIRY();
    await user.save();

    await sendOTPEmail(user.email, otp);

    return res.status(200).json({
      success: true,
      message: "New OTP sent to your email",
    });
  } catch (error) {
    console.error("Resend OTP error:", error.message);
    return res.status(500).json({
      success: false,
      message: "Failed to resend OTP",
    });
  }
};

/* ═══════════════════════════════════════════════════════════
 * LOGIN
 * ═══════════════════════════════════════════════════════════ */

/**
 * POST /api/auth/login
 */
const login = async (req, res) => {
  try {
    const { email, password } = req.body;

    if (!email || !password) {
      return res.status(400).json({
        success: false,
        message: "Email and password are required",
      });
    }

    const user = await User.findByEmailWithPassword(email.toLowerCase().trim());
    if (!user) {
      return res.status(401).json({
        success: false,
        message: "Invalid email or password",
      });
    }

    if (user.authProvider === "google") {
      return res.status(400).json({
        success: false,
        message: "This account uses Google sign-in. Please continue with Google.",
      });
    }

    const isMatch = await user.comparePassword(password);
    if (!isMatch) {
      return res.status(401).json({
        success: false,
        message: "Invalid email or password",
      });
    }

    if (!user.isVerified) {
      // Resend OTP automatically
      const otp = generateOTP();
      user.otp = otp;
      user.otpExpires = OTP_EXPIRY();
      await user.save();
      await sendOTPEmail(user.email, otp);

      return res.status(403).json({
        success: false,
        message: "Email not verified. A new OTP has been sent to your email.",
        data: { requiresVerification: true, email: user.email },
      });
    }

    const token = generateToken(user);

    return res.status(200).json({
      success: true,
      message: "Login successful",
      data: {
        token,
        user: {
          id: user._id,
          fullName: user.fullName,
          email: user.email,
          role: user.role,
          isVerified: user.isVerified,
          authProvider: user.authProvider,
          riskProfile: user.riskProfile,
          intentScore: user.intentScore,
        },
      },
    });
  } catch (error) {
    console.error("Login error:", error.message);
    return res.status(500).json({
      success: false,
      message: "Internal server error during login",
    });
  }
};

/**
 * POST /api/auth/google
 */
const googleAuth = async (req, res) => {
  try {
    const { credential } = req.body;

    if (!credential) {
      return res.status(400).json({
        success: false,
        message: "Google credential token is required",
      });
    }

    const googleUser = await verifyGoogleToken(credential);

    let user = await User.findOne({ email: googleUser.email });
    let isNewUser = false;

    if (user) {
      if (!user.googleId) {
        user.googleId = googleUser.googleId;
        user.authProvider = "google";
        user.isVerified = true;
        await user.save();
      }
    } else {
      isNewUser = true;
      user = await User.create({
        fullName: googleUser.fullName,
        email: googleUser.email,
        googleId: googleUser.googleId,
        authProvider: "google",
        isVerified: true,
      });
    }

    const token = generateToken(user);

    return res.status(200).json({
      success: true,
      message: isNewUser
        ? "Account created successfully via Google"
        : "Login successful via Google",
      data: {
        token,
        user: {
          id: user._id,
          fullName: user.fullName,
          email: user.email,
          role: user.role,
          isVerified: user.isVerified,
          authProvider: user.authProvider,
          riskProfile: user.riskProfile,
          intentScore: user.intentScore,
        },
      },
    });
  } catch (error) {
    console.error("Google auth error:", error.message);
    return res.status(500).json({
      success: false,
      message: "Google authentication failed. Please try again.",
    });
  }
};

/* ═══════════════════════════════════════════════════════════
 * FORGOT PASSWORD FLOW
 * ═══════════════════════════════════════════════════════════ */

/**
 * POST /api/auth/forgot-password
 * Sends a reset OTP to the user's email.
 */
const forgotPassword = async (req, res) => {
  try {
    const { email } = req.body;

    if (!email) {
      return res.status(400).json({
        success: false,
        message: "Email is required",
      });
    }

    const user = await User.findByEmailWithPassword(email.toLowerCase().trim());
    if (!user) {
      // Don't reveal whether the email exists (security)
      return res.status(200).json({
        success: true,
        message: "If an account exists with this email, a reset OTP has been sent.",
      });
    }

    if (user.authProvider === "google") {
      return res.status(400).json({
        success: false,
        message: "This account uses Google sign-in. Password reset is not available.",
      });
    }

    const otp = generateOTP();
    user.resetOtp = otp;
    user.resetOtpExpires = OTP_EXPIRY();
    await user.save();

    await sendOTPEmail(user.email, otp);

    return res.status(200).json({
      success: true,
      message: "Reset OTP sent to your email",
      data: { email: user.email },
    });
  } catch (error) {
    console.error("Forgot password error:", error.message);
    return res.status(500).json({
      success: false,
      message: "Failed to send reset OTP",
    });
  }
};

/**
 * POST /api/auth/verify-reset-otp
 * Verifies the password reset OTP.
 */
const verifyResetOTP = async (req, res) => {
  try {
    const { email, otp } = req.body;

    if (!email || !otp) {
      return res.status(400).json({
        success: false,
        message: "Email and OTP are required",
      });
    }

    const user = await User.findByEmailWithPassword(email.toLowerCase().trim());
    if (!user) {
      return res.status(404).json({
        success: false,
        message: "No account found with this email",
      });
    }

    if (!user.resetOtp || user.resetOtp !== String(otp)) {
      return res.status(400).json({
        success: false,
        message: "Invalid OTP. Please check and try again.",
      });
    }

    if (user.resetOtpExpires < new Date()) {
      return res.status(400).json({
        success: false,
        message: "OTP has expired. Please request a new one.",
      });
    }

    return res.status(200).json({
      success: true,
      message: "OTP verified. You can now reset your password.",
      data: { email: user.email, verified: true },
    });
  } catch (error) {
    console.error("Verify reset OTP error:", error.message);
    return res.status(500).json({
      success: false,
      message: "OTP verification failed",
    });
  }
};

/**
 * POST /api/auth/reset-password
 * Sets the new password after OTP verification.
 */
const resetPassword = async (req, res) => {
  try {
    const { email, otp, newPassword } = req.body;

    if (!email || !otp || !newPassword) {
      return res.status(400).json({
        success: false,
        message: "Email, OTP, and new password are required",
      });
    }

    if (newPassword.length < 8) {
      return res.status(400).json({
        success: false,
        message: "Password must be at least 8 characters long",
      });
    }

    const user = await User.findByEmailWithPassword(email.toLowerCase().trim());
    if (!user) {
      return res.status(404).json({
        success: false,
        message: "No account found with this email",
      });
    }

    if (!user.resetOtp || user.resetOtp !== String(otp)) {
      return res.status(400).json({
        success: false,
        message: "Invalid or expired reset session. Please start over.",
      });
    }

    if (user.resetOtpExpires < new Date()) {
      return res.status(400).json({
        success: false,
        message: "Reset session has expired. Please request a new OTP.",
      });
    }

    // Update password & clear reset OTP
    user.passwordHash = newPassword; // pre-save hook will hash
    user.resetOtp = undefined;
    user.resetOtpExpires = undefined;
    await user.save();

    return res.status(200).json({
      success: true,
      message: "Password reset successful. Please login with your new password.",
    });
  } catch (error) {
    console.error("Reset password error:", error.message);
    return res.status(500).json({
      success: false,
      message: "Password reset failed",
    });
  }
};

module.exports = {
  register,
  verifySignupOTP,
  resendOTP,
  login,
  googleAuth,
  forgotPassword,
  verifyResetOTP,
  resetPassword,
};
