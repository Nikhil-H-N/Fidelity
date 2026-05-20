/**
 * ============================================================
 * FinovaWealth — Axios API Client
 * File: Frontend/src/api/client.js
 * ============================================================
 * Centralized Axios instance with:
 *   • Base URL targeting the backend
 *   • Automatic Bearer token injection via request interceptor
 *   • 401 auto-logout via response interceptor
 * ============================================================
 */

import axios from "axios";
import { clearAuthIdentity } from "../utils/authStorage";

const API_BASE_URL = import.meta.env.VITE_API_URL || "http://localhost:5000/api";

/** Public pages that should NEVER be redirected away from */
const PUBLIC_PATHS = ["/login", "/signup", "/forgot-password", "/", "/about", "/blog", "/contact", "/help", "/onboarding"];

const apiClient = axios.create({
  baseURL: API_BASE_URL,
  timeout: 15000,
  headers: {
    "Content-Type": "application/json",
  },
});

/* ── Request Interceptor: attach JWT ──────────────────────── */
apiClient.interceptors.request.use(
  (config) => {
    const isAdminPreview = window.location.search.includes("adminPreview=true");
    const token = isAdminPreview ? "mock-token" : localStorage.getItem("fw_token");
    if (token) {
      config.headers.Authorization = `Bearer ${token}`;
    }
    return config;
  },
  (error) => Promise.reject(error)
);

/* ── Response Interceptor: handle 401 ─────────────────────── */
apiClient.interceptors.response.use(
  (response) => response,
  (error) => {
    if (error.response?.status === 401) {
      clearAuthIdentity();

      // Only hard-redirect if user is on a PROTECTED page.
      // Never redirect if:
      //   1. Already on a public/auth page (prevents redirect loop)
      window.dispatchEvent(new CustomEvent("finova:auth-expired"));
    }
    return Promise.reject(error);
  }
);

export default apiClient;
