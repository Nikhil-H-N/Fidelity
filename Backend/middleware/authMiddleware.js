/**
 * ============================================================
 * FinovaWealth — Auth Middleware
 * File: middleware/authMiddleware.js
 * ============================================================
 * Protects routes by verifying the JWT in the Authorization
 * header (Bearer scheme). Attaches the decoded user to req.user.
 *
 * Usage in routes:
 *   const { protect, authorize } = require("../middleware/authMiddleware");
 *   router.get("/dashboard", protect, dashboardController);
 *   router.get("/admin", protect, authorize("admin"), adminController);
 * ============================================================
 */

const jwt = require("jsonwebtoken");
const User = require("../models/User");

/**
 * Protect — ensures the request has a valid JWT.
 * Attaches the full user document (minus passwordHash) to req.user.
 */
const protect = async (req, res, next) => {
  try {
    let token;

    // Extract token from Authorization header
    if (
      req.headers.authorization &&
      req.headers.authorization.startsWith("Bearer")
    ) {
      token = req.headers.authorization.split(" ")[1];
    }

    if (!token) {
      return res.status(401).json({
        success: false,
        message: "Not authorized — no token provided",
      });
    }

    // Verify token
    const decoded = jwt.verify(token, process.env.JWT_SECRET);

    // Fetch user and attach to request
    const user = await User.findById(decoded.id);
    if (!user) {
      return res.status(401).json({
        success: false,
        message: "Not authorized — user no longer exists",
      });
    }

    req.user = user;
    next();
  } catch (error) {
    // Handle specific JWT errors
    if (error.name === "TokenExpiredError") {
      return res.status(401).json({
        success: false,
        message: "Token expired — please log in again",
      });
    }
    if (error.name === "JsonWebTokenError") {
      return res.status(401).json({
        success: false,
        message: "Invalid token — authorization denied",
      });
    }

    return res.status(500).json({
      success: false,
      message: "Server error during authentication",
    });
  }
};

/**
 * Authorize — restricts access to specific roles.
 * Must be used AFTER the `protect` middleware.
 * @param  {...string} roles — Allowed roles, e.g. "admin", "advisor"
 */
const optionalProtect = async (req, _res, next) => {
  try {
    let token;

    if (
      req.headers.authorization &&
      req.headers.authorization.startsWith("Bearer")
    ) {
      token = req.headers.authorization.split(" ")[1];
    }

    if (!token) return next();

    const decoded = jwt.verify(token, process.env.JWT_SECRET);
    const user = await User.findById(decoded.id);
    if (user) req.user = user;
  } catch {
    // Tracking should keep working when an optional token is absent or stale.
  }

  next();
};

const authorize = (...roles) => {
  return (req, res, next) => {
    if (!roles.includes(req.user.role)) {
      return res.status(403).json({
        success: false,
        message: `Role '${req.user.role}' is not authorized to access this resource`,
      });
    }
    next();
  };
};

module.exports = { protect, optionalProtect, authorize };
