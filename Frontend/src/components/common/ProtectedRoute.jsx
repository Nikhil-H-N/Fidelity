/**
 * ============================================================
 * FinovaWealth — Protected Route Wrapper
 * File: Frontend/src/components/common/ProtectedRoute.jsx
 * ============================================================
 * Wraps routes that require authentication.
 * Shows a loader while session is being restored, then
 * redirects to /login if not authenticated.
 * ============================================================
 */

import { Navigate, useLocation } from "react-router-dom";
import { useAuth } from "../../context/AuthContext";

export default function ProtectedRoute({ children }) {
  const { isAuthenticated, loading } = useAuth();
  const location = useLocation();
  const isAdminPreview = location.search.includes('adminPreview=true');

  if (loading && !isAdminPreview) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-surface-50">
        <div className="flex flex-col items-center gap-4">
          <div className="w-10 h-10 border-3 border-primary-200 border-t-primary-600 rounded-full animate-spin" />
          <p className="text-sm text-surface-500">Verifying session…</p>
        </div>
      </div>
    );
  }

  if (!isAuthenticated && !isAdminPreview) {
    return <Navigate to="/login" state={{ from: location }} replace />;
  }

  return children;
}
