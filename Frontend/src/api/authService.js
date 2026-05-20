/**
 * ============================================================
 * FinovaWealth — Auth API Service
 * File: Frontend/src/api/authService.js
 * ============================================================
 */

import apiClient from "./client";

/** Register (sends OTP email) */
export const registerUser = (data) =>
  apiClient.post("/auth/register", data).then((r) => r.data);

/** Verify signup OTP → creates account → returns JWT */
export const verifySignupOTP = (data) =>
  apiClient.post("/auth/verify-signup-otp", data).then((r) => r.data);

/** Resend signup OTP */
export const resendOTP = (data) =>
  apiClient.post("/auth/resend-otp", data).then((r) => r.data);

/** Login with email + password */
export const loginUser = (data) =>
  apiClient.post("/auth/login", data).then((r) => r.data);

/** Google OAuth */
export const googleLogin = (data) =>
  apiClient.post("/auth/google", data).then((r) => r.data);

/** Forgot password — sends reset OTP */
export const forgotPassword = (data) =>
  apiClient.post("/auth/forgot-password", data).then((r) => r.data);

/** Verify reset OTP */
export const verifyResetOTP = (data) =>
  apiClient.post("/auth/verify-reset-otp", data).then((r) => r.data);

/** Reset password (after OTP verified) */
export const resetPassword = (data) =>
  apiClient.post("/auth/reset-password", data).then((r) => r.data);

/** Get current user profile */
export const getMe = () =>
  apiClient.get("/auth/me").then((r) => r.data);
