/**
 * ============================================================
 * FinovaWealth — Google Auth Service
 * File: services/googleAuthService.js
 * ============================================================
 * Verifies Google OAuth2 ID tokens received from the frontend
 * "Continue with Google" button.
 *
 * Flow:
 *   1. Frontend opens Google sign-in popup
 *   2. Frontend receives a credential (ID token)
 *   3. Frontend POSTs the token to /api/auth/google
 *   4. This service verifies the token with Google's servers
 *   5. Returns the decoded user payload (email, name, sub, etc.)
 * ============================================================
 */

const { OAuth2Client } = require("google-auth-library");

const client = new OAuth2Client(process.env.GOOGLE_CLIENT_ID);

/**
 * Verify a Google ID token and extract user information.
 * @param {string} idToken — The credential token from the Google popup
 * @returns {Promise<Object>} Decoded payload: { sub, email, name, picture, … }
 * @throws {Error} If token verification fails
 */
const verifyGoogleToken = async (idToken) => {
  try {
    const ticket = await client.verifyIdToken({
      idToken,
      audience: process.env.GOOGLE_CLIENT_ID,
    });

    const payload = ticket.getPayload();

    // Ensure the token was intended for our client
    if (payload.aud !== process.env.GOOGLE_CLIENT_ID) {
      throw new Error("Token audience mismatch");
    }

    return {
      googleId: payload.sub,
      email: payload.email,
      fullName: payload.name,
      picture: payload.picture,
      emailVerified: payload.email_verified,
    };
  } catch (error) {
    console.error(`❌  Google token verification failed: ${error.message}`);
    throw new Error("Invalid Google credential. Please try again.");
  }
};

module.exports = { verifyGoogleToken };
