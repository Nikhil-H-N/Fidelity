import { BrowserRouter as Router, Routes, Route } from 'react-router-dom';
import { lazy, Suspense, useEffect } from 'react';
import toast, { Toaster } from 'react-hot-toast';
import { AuthProvider, useAuth } from './context/AuthContext';
import ProtectedRoute from './components/common/ProtectedRoute';
import ErrorBoundary from './components/common/ErrorBoundary';
import DashboardLayout from './components/dashboard/DashboardLayout';
import AIChatbot from './components/common/AIChatbot';
import PopupContainer from './components/PopupContainer';
import { useInteractionTracking, useScrollDepth, useSessionLifecycleTracking } from './hooks/useTracking';
import { getTrackingUserId, queueEvent } from './api/eventService';
import { useSocket } from './hooks/useSocket';

function GlobalTracker() {
  useInteractionTracking();
  useScrollDepth();
  useSessionLifecycleTracking();
  return null;
}

function TargetedNotificationPoller() {
  useEffect(() => {
    let cancelled = false;

    const showNotification = (notification) => {
      const title = notification.title || 'FinovaWealth';
      const message = notification.payload?.message || notification.message || '';

      toast.custom(
        (t) => (
          <div
            className={`max-w-md w-[calc(100vw-32px)] rounded-2xl border border-primary-200 bg-white shadow-elevated p-4 transition-all ${t.visible ? 'opacity-100 translate-y-0' : 'opacity-0 translate-y-2'}`}
          >
            <div className="flex items-start gap-3">
              <div className="w-10 h-10 rounded-xl bg-primary-50 text-primary-600 flex items-center justify-center font-black">
                FW
              </div>
              <div className="flex-1 min-w-0">
                <p className="text-sm font-bold text-surface-900">{title}</p>
                <p className="text-sm text-surface-600 mt-1 leading-relaxed">{message}</p>
              </div>
              <button
                onClick={() => toast.dismiss(t.id)}
                className="text-surface-400 hover:text-surface-700 text-lg leading-none"
                aria-label="Dismiss notification"
              >
                x
              </button>
            </div>
          </div>
        ),
        { duration: 9000 }
      );

      queueEvent({
        eventType: 'notification_open',
        metadata: {
          source: 'admin_notification_engine',
          notificationId: notification.id,
          title,
          message,
        },
      });
    };

    const poll = async () => {
      const userId = getTrackingUserId();
      if (!userId) return;

      try {
        const ENGINE_URL = import.meta.env.VITE_ENGINE_URL || 'http://localhost:8000';
        const response = await fetch(`${ENGINE_URL}/admin/interventions/${encodeURIComponent(userId)}`);
        if (!response.ok || cancelled) return;

        const data = await response.json();
        (data.interventions || []).forEach(showNotification);
      } catch {
        // The intelligence engine may be offline while the website is still usable.
      }
    };

    poll();
    const interval = setInterval(poll, 3000);

    return () => {
      cancelled = true;
      clearInterval(interval);
    };
  }, []);

  return null;
}

// Lazy load pages
const Landing = lazy(() => import('./pages/Landing'));
const Login = lazy(() => import('./pages/Login'));
const Signup = lazy(() => import('./pages/Signup'));
const ForgotPassword = lazy(() => import('./pages/ForgotPassword'));
const Onboarding = lazy(() => import('./pages/Onboarding'));
const Dashboard = lazy(() => import('./pages/Dashboard'));
const Portfolio = lazy(() => import('./pages/Portfolio'));
const Transactions = lazy(() => import('./pages/Transactions'));
const MutualFunds = lazy(() => import('./pages/MutualFunds'));
const SIPPlans = lazy(() => import('./pages/SIPPlans'));
const InvestmentPlans = lazy(() => import('./pages/InvestmentPlans'));
const InsurancePlans = lazy(() => import('./pages/InsurancePlans'));
const TaxSaving = lazy(() => import('./pages/TaxSaving'));
const WealthManagement = lazy(() => import('./pages/WealthManagement'));
const ProductDetails = lazy(() => import('./pages/ProductDetails'));
const ApplicationForm = lazy(() => import('./pages/ApplicationForm'));
const PlanComparison = lazy(() => import('./pages/PlanComparison'));
const Confirmation = lazy(() => import('./pages/Confirmation'));
const GoalPlanning = lazy(() => import('./pages/GoalPlanning'));
const RetirementPlanning = lazy(() => import('./pages/RetirementPlanning'));
const InvestmentReturnCalculator = lazy(() => import('./pages/InvestmentReturnCalculator'));
const AIRecommendations = lazy(() => import('./pages/AIRecommendations'));
const FAQ = lazy(() => import('./pages/FAQ'));
const BeginnerGuides = lazy(() => import('./pages/BeginnerGuides'));
const SuccessStories = lazy(() => import('./pages/SuccessStories'));
const Notifications = lazy(() => import('./pages/Notifications'));
const ProfileSettings = lazy(() => import('./pages/ProfileSettings'));
const About = lazy(() => import('./pages/About'));
const Blog = lazy(() => import('./pages/Blog'));
const Contact = lazy(() => import('./pages/Contact'));
const Help = lazy(() => import('./pages/Help'));
const NotFound = lazy(() => import('./pages/NotFound'));

function PageLoader() {
  return (
    <div className="min-h-screen flex items-center justify-center bg-surface-50">
      <div className="flex flex-col items-center gap-4">
        <div className="w-10 h-10 border-3 border-primary-200 border-t-primary-600 rounded-full animate-spin" />
        <p className="text-sm text-surface-500">Loading...</p>
      </div>
    </div>
  );
}

function AdminPreviewIframeBridge() {
  useEffect(() => {
    if (!window.location.search.includes('adminPreview=true')) return;
    
    // Let the admin preview own the scrollbar while still measuring full page height.
    document.documentElement.style.overflowY = 'hidden';
    
    const sendHeight = () => {
      const height = Math.max(
        document.body.scrollHeight,
        document.body.offsetHeight,
        document.documentElement.clientHeight,
        document.documentElement.scrollHeight,
        document.documentElement.offsetHeight
      );
      window.parent.postMessage({ type: 'adminPreviewHeight', height }, '*');
    };

    const observer = new ResizeObserver(sendHeight);
    observer.observe(document.body);
    observer.observe(document.documentElement);
    sendHeight();
    const timeout = setTimeout(sendHeight, 500);

    return () => {
      clearTimeout(timeout);
      observer.disconnect();
      document.documentElement.style.overflowY = '';
    };
  }, []);
  return null;
}

function SocketProvider() {
  useSocket();
  return null;
}

function AuthenticatedProviders() {
  const { isAuthenticated, loading } = useAuth();
  if (loading || !isAuthenticated) return null;
  return (
    <>
      <SocketProvider />
      <PopupContainer />
      <TargetedNotificationPoller />
    </>
  );
}

export default function App() {
  return (
    <Router>
      <ErrorBoundary>
      <AuthProvider>
        <AuthenticatedProviders />
        <AdminPreviewIframeBridge />
        <GlobalTracker />
        <AIChatbot />
        {/* Global toast notifications */}
        <Toaster
          position="top-right"
          toastOptions={{
            duration: 4000,
            style: {
              borderRadius: '12px',
              background: '#1e293b',
              color: '#f8fafc',
              fontSize: '14px',
            },
          }}
        />

        <Suspense fallback={<PageLoader />}>
          <Routes>
            {/* Public pages */}
            <Route path="/" element={<Landing />} />
            <Route path="/login" element={<Login />} />
            <Route path="/signup" element={<Signup />} />
            <Route path="/forgot-password" element={<ForgotPassword />} />
            <Route path="/onboarding" element={<Onboarding />} />
            <Route path="/about" element={<About />} />
            <Route path="/blog" element={<Blog />} />
            <Route path="/contact" element={<Contact />} />
            <Route path="/help" element={<Help />} />

            {/* Dashboard pages (protected + sidebar layout) — regular users */}
            <Route element={<ProtectedRoute><DashboardLayout /></ProtectedRoute>}>
              <Route path="/dashboard" element={<Dashboard />} />
              <Route path="/portfolio" element={<Portfolio />} />
              <Route path="/transactions" element={<Transactions />} />
              <Route path="/mutual-funds" element={<MutualFunds />} />
              <Route path="/sip-plans" element={<SIPPlans />} />
              <Route path="/investment-plans" element={<InvestmentPlans />} />
              <Route path="/insurance-plans" element={<InsurancePlans />} />
              <Route path="/tax-saving" element={<TaxSaving />} />
              <Route path="/wealth-management" element={<WealthManagement />} />
              <Route path="/product-details/:productId" element={<ProductDetails />} />
              <Route path="/know-more/:productId" element={<ProductDetails />} />
              <Route path="/checkout/:productId" element={<ApplicationForm />} />
              <Route path="/plan-comparison" element={<PlanComparison />} />
              <Route path="/confirmation" element={<Confirmation />} />
              <Route path="/goal-planning" element={<GoalPlanning />} />
              <Route path="/retirement-planning" element={<RetirementPlanning />} />
              <Route path="/investment-calculator" element={<InvestmentReturnCalculator />} />
              <Route path="/ai-recommendations" element={<AIRecommendations />} />
              <Route path="/faq" element={<FAQ />} />
              <Route path="/beginner-guides" element={<BeginnerGuides />} />
              <Route path="/success-stories" element={<SuccessStories />} />
              <Route path="/notifications" element={<Notifications />} />
              <Route path="/profile" element={<ProfileSettings />} />
            </Route>

            {/* Redirect for nav links */}
            <Route path="/invest" element={<Landing />} />
            <Route path="/plan" element={<Landing />} />
            <Route path="*" element={<NotFound />} />
          </Routes>
        </Suspense>
      </AuthProvider>
      </ErrorBoundary>
    </Router>
  );
}
