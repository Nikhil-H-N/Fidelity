/**
 * ============================================================
 * FinovaWealth — OTP Generator Utility
 * File: utils/generateOTP.js
 * ============================================================
 * Generates a cryptographically random 6-digit numeric OTP
 * using the otp-generator library.
 * ============================================================
 */

const otpGenerator = require("otp-generator");

/**
 * Generate a 6-digit numeric OTP.
 * @returns {string} A 6-digit OTP string (e.g. "482917")
 */
const generateOTP = () => {
  return otpGenerator.generate(6, {
    digits: true,
    lowerCaseAlphabets: false,
    upperCaseAlphabets: false,
    specialChars: false,
  });
};

module.exports = generateOTP;
