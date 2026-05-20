/**
 * ============================================================
 * FinovaWealth — Auth Context Provider
 * File: Frontend/src/context/AuthContext.jsx
 * ============================================================
 * Provides authentication state to the entire app:
 *   • Persists token + user in localStorage
 *   • Auto-restores session on mount via GET /auth/me
 *   • Exposes login, logout, setAuthData helpers
 *   • Syncs with the existing Zustand store
 *
 * IMPORTANT: This context NEVER redirects the user.
 * Redirection is handled ONLY by <ProtectedRoute>.
 * ============================================================
 */

import { createContext, useContext, useState, useEffect, useCallback } from "react";
import { getMe } from "../api/authService";
import useStore from "../store/useStore";
import { clearAuthIdentity, resetTrackingIdentity } from "../utils/authStorage";

const AuthContext = createContext(null);
const AUTH_ACTIVITY_TIMEOUT_MS = 2 * 60 * 60 * 1000;
const ACTIVITY_EVENTS = ['click', 'keydown', 'mousemove', 'scroll', 'touchstart', 'focus'];

export function AuthProvider({ children }) {
  const [user, setUser] = useState(null);
  const [token, setToken] = useState(() => localStorage.getItem("fw_token"));
  const [loading, setLoading] = useState(true);

  // Zustand sync
  const zustandSetAuth = useStore((s) => s.setAuth);
  const zustandLogout = useStore((s) => s.logout);

  /**
   * Save auth data to state + localStorage + Zustand.
   */
  const setAuthData = useCallback(
    (newToken, newUser) => {
      resetTrackingIdentity();
      setToken(newToken);
      setUser(newUser);
      localStorage.setItem("fw_token", newToken);
      localStorage.setItem("fw_user", JSON.stringify(newUser));
      localStorage.setItem("fw_lastActivityAt", String(Date.now()));
      zustandSetAuth(newUser);
      window.dispatchEvent(new CustomEvent("finova:auth-changed", {
        detail: { token: newToken, user: newUser },
      }));
    },
    [zustandSetAuth]
  );

  /**
   * Clear all auth state. Does NOT navigate — that's ProtectedRoute's job.
   * Sends a session_end event to the engine so the authenticated session
   * is properly closed, and clears the guest ID to avoid duplicate sessions.
   */
  const logout = useCallback(() => {
    // Fire a session_end event to the engine BEFORE clearing auth state,
    // so the event is attributed to the authenticated user (not a new guest).
    try {
      const token = localStorage.getItem('fw_token');
      const guestId = localStorage.getItem('fw_guestId');
      const sessionId = sessionStorage.getItem('fw_sessionId');
      const apiUrl = (import.meta.env.VITE_API_URL || 'http://localhost:5000/api') + '/events';
      const body = JSON.stringify({
        events: [{
          eventType: 'session_end',
          page: window.location.pathname,
          sessionId,
          timestamp: new Date().toISOString(),
          metadata: { reason: 'logout' },
        }],
        sessionId,
        guestId,
      });
      // Use fetch with keepalive so we can include the auth header —
      // this ensures the backend attributes the event to the logged-in user,
      // not the guest ID. keepalive ensures the request survives navigation.
      fetch(apiUrl, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          ...(token ? { Authorization: `Bearer ${token}` } : {}),
        },
        body,
        keepalive: true,
      }).catch(() => {});
    } catch { /* tracking must never block logout */ }

    setToken(null);
    setUser(null);
    clearAuthIdentity();
    zustandLogout();
    window.dispatchEvent(new CustomEvent("finova:auth-changed", {
      detail: { token: null, user: null },
    }));
  }, [zustandLogout]);

  /**
   * On mount — if a token exists, verify it via GET /auth/me.
   * Also ensure a sessionId exists for tracking.
   */
  useEffect(() => {
    // Session ID initialization
    if (!sessionStorage.getItem('fw_sessionId')) {
      sessionStorage.setItem('fw_sessionId', 'sess_' + Math.random().toString(36).substr(2, 9));
    }

    const restoreSession = async () => {
      const isAdminPreview = window.location.search.includes("adminPreview=true");
      if (isAdminPreview) {
        const urlParams = new URLSearchParams(window.location.search);
        const previewName = urlParams.get('previewName') || 'Admin Preview';

        const dummyUser = { _id: "admin-bot", fullName: previewName, email: "bot@admin.local", role: "user" };
        setUser(dummyUser);
        setToken("mock-token");
        zustandSetAuth(dummyUser);
        setLoading(false);
        return;
      }

      const savedToken = localStorage.getItem("fw_token");

      if (!savedToken) {
        setLoading(false);
        return;
      }

      try {
        const res = await getMe();
        if (res.success && res.data?.user) {
          setUser(res.data.user);
          zustandSetAuth(res.data.user);
        } else {
          // Token invalid — clear silently, don't redirect
          logout();
        }
      } catch {
        // Network error or 401 — clear silently, don't redirect
        logout();
      } finally {
        setLoading(false);
      }
    };

    restoreSession();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  useEffect(() => {
    if (!token || !user || window.location.search.includes("adminPreview=true")) return;

    let lastWrite = 0;
    const markActivity = () => {
      const now = Date.now();
      if (now - lastWrite < 15000) return;
      lastWrite = now;
      localStorage.setItem("fw_lastActivityAt", String(now));
    };

    const enforceExpiry = () => {
      const lastActivityAt = Number(localStorage.getItem("fw_lastActivityAt") || Date.now());
      if (Date.now() - lastActivityAt >= AUTH_ACTIVITY_TIMEOUT_MS) {
        logout();
      }
    };

    if (!localStorage.getItem("fw_lastActivityAt")) {
      localStorage.setItem("fw_lastActivityAt", String(Date.now()));
    }

    ACTIVITY_EVENTS.forEach((eventName) => {
      window.addEventListener(eventName, markActivity, { passive: true });
    });
    const interval = setInterval(enforceExpiry, 60 * 1000);
    enforceExpiry();

    return () => {
      ACTIVITY_EVENTS.forEach((eventName) => {
        window.removeEventListener(eventName, markActivity);
      });
      clearInterval(interval);
    };
  }, [token, user, logout]);

  const value = {
    user,
    token,
    loading,
    isAuthenticated: !!token && !!user,
    setAuthData,
    logout,
  };

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
}

/**
 * Hook to access auth context.
 * @returns {{ user, token, loading, isAuthenticated, setAuthData, logout }}
 */
export function useAuth() {
  const ctx = useContext(AuthContext);
  if (!ctx) throw new Error("useAuth must be used inside <AuthProvider>");
  return ctx;
}
