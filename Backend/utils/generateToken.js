/**
 * ============================================================
 * FinovaWealth — JWT Token Generator Utility
 * File: utils/generateToken.js
 * ============================================================
 * Signs and returns a JWT containing the user's ID and role.
 * Token expiry is configurable via environment variable.
 * ============================================================
 */

const jwt = require("jsonwebtoken");

/**
 * Generate a signed JWT for a given user.
 * @param {Object} user — Mongoose user document
 * @param {string} user._id — User's MongoDB ObjectId
 * @param {string} user.role — User's role (e.g. "user", "admin")
 * @returns {string} Signed JWT string
 */
const generateToken = (user) => {
  return jwt.sign(
    {
      id: user._id,
      role: user.role,
    },
    process.env.JWT_SECRET,
    {
      expiresIn: process.env.JWT_EXPIRES_IN || "7d",
    }
  );
};

module.exports = generateToken;
