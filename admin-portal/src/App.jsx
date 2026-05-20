import { BrowserRouter as Router, Routes, Route, Navigate } from 'react-router-dom';
import { useEffect } from 'react';
import { AdminAuthProvider, useAdminAuth } from './context/AdminAuthContext';
import AdminLayout from './components/layout/AdminLayout';
import { useAdminSocket } from './hooks/useSocket';
import Login from './pages/Login';
import Overview from './pages/Overview';
import BehavioralAnalytics from './pages/BehavioralAnalytics';
import Alerts from './pages/Alerts';
import LiveStream from './pages/LiveStream';
import EventTracking from './pages/EventTracking';
import SessionTimeline from './pages/SessionTimeline';
import MLIntelligence from './pages/MLIntelligence';
import NotificationEngine from './pages/NotificationEngine';
import ClickAnalytics from './pages/ClickAnalytics';
import FunnelAnalytics from './pages/FunnelAnalytics';
import PathDiscovery from './pages/PathDiscovery';
import AIInsights from './pages/AIInsights';
import PopupAnalytics from './pages/PopupAnalytics';

function ProtectedRoute({ children }) {
  const { isAuthenticated, loading } = useAdminAuth();
  if (loading) return (
    <div className="min-h-screen flex items-center justify-center bg-surface-50">
      <div className="w-8 h-8 border-3 border-primary-200 border-t-primary-600 rounded-full animate-spin" />
    </div>
  );
  if (!isAuthenticated) return <Navigate to="/login" replace />;
  return children;
}

function AppRoutes() {
  const { isAuthenticated } = useAdminAuth();

  return (
    <Routes>
      <Route path="/login" element={isAuthenticated ? <Navigate to="/" replace /> : <Login />} />
      <Route element={<ProtectedRoute><AdminLayout /></ProtectedRoute>}>
        <Route path="/" element={<Overview />} />
        <Route path="/analytics" element={<BehavioralAnalytics />} />
        <Route path="/funnel" element={<FunnelAnalytics />} />
        <Route path="/path-discovery" element={<PathDiscovery />} />
        <Route path="/alerts" element={<Alerts />} />
        <Route path="/live" element={<LiveStream />} />
        <Route path="/events" element={<EventTracking />} />
        <Route path="/timeline" element={<SessionTimeline />} />
        <Route path="/notifications" element={<NotificationEngine />} />
        <Route path="/ml" element={<MLIntelligence />} />
        <Route path="/click-analytics" element={<ClickAnalytics />} />
        <Route path="/ai-insights" element={<AIInsights />} />
        <Route path="/popup-analytics" element={<PopupAnalytics />} />
      </Route>
    </Routes>
  );
}

function AdminSocketProvider() {
  const { isAuthenticated } = useAdminAuth();
  if (!isAuthenticated) return null;
  useAdminSocket((event, data) => {
    // Events are handled by individual pages via polling
    // This provider maintains the connection for future socket-based features
    console.log('[AdminSocket] Event:', event, data);
  });
  return null;
}

export default function App() {
  return (
    <Router>
      <AdminAuthProvider>
        <AdminSocketProvider />
        <AppRoutes />
      </AdminAuthProvider>
    </Router>
  );
}
