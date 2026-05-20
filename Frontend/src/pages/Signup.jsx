import { useState, useEffect } from 'react';
import { Link, useNavigate, useLocation } from 'react-router-dom';
import { motion, AnimatePresence } from 'framer-motion';
import { Mail, Lock, Eye, EyeOff, User, TrendingUp, ArrowRight, Check, Phone, Loader2, X, ShieldCheck } from 'lucide-react';
import { GoogleLogin } from '@react-oauth/google';
import toast from 'react-hot-toast';
import { usePageTracking, useFormTracking } from '../hooks/useTracking';
import { registerUser, verifySignupOTP, resendOTP } from '../api/authService';
import { useAuth } from '../context/AuthContext';
import useGoogleAuth from '../hooks/useGoogleAuth';

/* ── Password strength indicator ─────────────────────────── */
function PasswordStrength({ password }) {
  const getStrength = () => {
    let s = 0;
    if (password.length >= 8) s++;
    if (/[A-Z]/.test(password)) s++;
    if (/[0-9]/.test(password)) s++;
    if (/[^A-Za-z0-9]/.test(password)) s++;
    return s;
  };
  const strength = getStrength();
  const labels = ['Weak', 'Fair', 'Good', 'Strong'];
  const colors = ['bg-red-500', 'bg-amber-500', 'bg-blue-500', 'bg-accent-500'];
  if (!password) return null;
  return (
    <div className="mt-2">
      <div className="flex gap-1 mb-1">{[0,1,2,3].map(i => <div key={i} className={`h-1 flex-1 rounded-full ${i < strength ? colors[strength-1] : 'bg-surface-200'}`} />)}</div>
      <p className="text-xs text-surface-500">{labels[strength-1] || 'Too weak'}</p>
    </div>
  );
}

/* ── OTP Verification Modal ──────────────────────────────── */
function OTPModal({ email, onVerified, onClose }) {
  const [otp, setOtp] = useState(['', '', '', '', '', '']);
  const [loading, setLoading] = useState(false);
  const [resendCooldown, setResendCooldown] = useState(60);

  // Resend cooldown timer
  useEffect(() => {
    if (resendCooldown <= 0) return;
    const t = setTimeout(() => setResendCooldown((c) => c - 1), 1000);
    return () => clearTimeout(t);
  }, [resendCooldown]);

  // Auto-focus first input
  useEffect(() => {
    document.getElementById('otp-modal-0')?.focus();
  }, []);

  const handleChange = (index, value) => {
    if (value && !/^\d$/.test(value)) return;
    const next = [...otp];
    next[index] = value;
    setOtp(next);
    if (value && index < 5) document.getElementById(`otp-modal-${index + 1}`)?.focus();
  };

  const handleKeyDown = (index, e) => {
    if (e.key === 'Backspace' && !otp[index] && index > 0)
      document.getElementById(`otp-modal-${index - 1}`)?.focus();
  };

  const handlePaste = (e) => {
    e.preventDefault();
    const p = e.clipboardData.getData('text').replace(/\D/g, '').slice(0, 6);
    if (p.length === 6) {
      setOtp(p.split(''));
      document.getElementById('otp-modal-5')?.focus();
    }
  };

  const handleVerify = async () => {
    const code = otp.join('');
    if (code.length !== 6) { toast.error('Enter the full 6-digit OTP'); return; }

    setLoading(true);
    try {
      const res = await verifySignupOTP({ email, otp: code });
      if (res.success) {
        onVerified(res.data.token, res.data.user);
      } else {
        toast.error(res.message || 'Verification failed');
      }
    } catch (error) {
      toast.error(error.response?.data?.message || 'Verification failed');
    } finally {
      setLoading(false);
    }
  };

  const handleResend = async () => {
    if (resendCooldown > 0) return;
    try {
      await resendOTP({ email });
      toast.success('New OTP sent!');
      setResendCooldown(60);
      setOtp(['', '', '', '', '', '']);
      document.getElementById('otp-modal-0')?.focus();
    } catch (error) {
      toast.error(error.response?.data?.message || 'Failed to resend');
    }
  };

  return (
    <motion.div
      initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
      className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 backdrop-blur-sm p-4"
      onClick={(e) => { if (e.target === e.currentTarget) onClose(); }}
    >
      <motion.div
        initial={{ opacity: 0, scale: 0.95, y: 20 }}
        animate={{ opacity: 1, scale: 1, y: 0 }}
        exit={{ opacity: 0, scale: 0.95, y: 20 }}
        className="bg-white rounded-2xl shadow-2xl w-full max-w-md p-8 relative"
      >
        <button onClick={onClose} className="absolute top-4 right-4 text-surface-400 hover:text-surface-600">
          <X className="w-5 h-5" />
        </button>

        <div className="text-center mb-6">
          <div className="w-14 h-14 rounded-2xl bg-primary-50 flex items-center justify-center mx-auto mb-4">
            <ShieldCheck className="w-7 h-7 text-primary-600" />
          </div>
          <h3 className="text-xl font-bold text-surface-900">Verify your email</h3>
          <p className="text-sm text-surface-500 mt-1">
            Enter the 6-digit OTP sent to <strong className="text-surface-700">{email}</strong>
          </p>
        </div>

        <div className="flex justify-center gap-3 mb-6" onPaste={handlePaste}>
          {otp.map((d, i) => (
            <input key={i} id={`otp-modal-${i}`} type="text" maxLength={1}
              className="w-12 h-14 text-center text-xl font-bold border-2 border-surface-200 rounded-xl
                focus:outline-none focus:ring-2 focus:ring-primary-500/20 focus:border-primary-500
                transition-colors"
              value={d}
              onChange={(e) => handleChange(i, e.target.value)}
              onKeyDown={(e) => handleKeyDown(i, e)}
            />
          ))}
        </div>

        <button onClick={handleVerify} disabled={loading}
          className="btn-primary w-full py-3.5 gap-2 disabled:opacity-60">
          {loading ? <Loader2 className="w-5 h-5 animate-spin" /> : <>Verify & Continue <ArrowRight className="w-5 h-5" /></>}
        </button>

        <div className="text-center mt-4">
          <p className="text-sm text-surface-400">
            Didn't receive?{' '}
            <button onClick={handleResend} disabled={resendCooldown > 0}
              className="text-primary-600 font-semibold disabled:text-surface-400">
              {resendCooldown > 0 ? `Resend in ${resendCooldown}s` : 'Resend OTP'}
            </button>
          </p>
          <p className="text-xs text-surface-400 mt-2">OTP expires in 10 minutes</p>
        </div>
      </motion.div>
    </motion.div>
  );
}

/* ── Main Signup Page ────────────────────────────────────── */
export default function Signup() {
  usePageTracking('signup');
  const { trackFormStart } = useFormTracking('signup');
  const [showPassword, setShowPassword] = useState(false);
  const [form, setForm] = useState({ name: '', email: '', phone: '', password: '' });
  const [loading, setLoading] = useState(false);
  const [showOtpModal, setShowOtpModal] = useState(false);
  const navigate = useNavigate();
  const location = useLocation();
  const { setAuthData } = useAuth();
  const { handleCredentialResponse } = useGoogleAuth();

  // If redirected from login (unverified account), show OTP modal directly
  useEffect(() => {
    if (location.state?.step === 2 && location.state?.email) {
      setForm((f) => ({ ...f, email: location.state.email }));
      setShowOtpModal(true);
    }
  }, [location.state]);

  const handleRegister = async (e) => {
    e.preventDefault();

    const emailRegex = /^[a-zA-Z0-9._%+-]+@[a-zA-Z0-9.-]+\.[a-zA-Z]{2,}$/;
    if (!emailRegex.test(form.email)) { toast.error('Enter a valid email address'); return; }
    if (!form.name.trim()) { toast.error('Full name is required'); return; }
    if (form.password.length < 8) { toast.error('Password must be at least 8 characters'); return; }

    setLoading(true);
    try {
      const res = await registerUser({
        fullName: form.name,
        email: form.email,
        phone: form.phone || undefined,
        password: form.password,
      });

      if (res.success) {
        toast.success('OTP sent to your email!');
        setShowOtpModal(true);
      } else {
        toast.error(res.message || 'Registration failed');
      }
    } catch (error) {
      toast.error(error.response?.data?.message || 'Registration failed. Try again.');
    } finally {
      setLoading(false);
    }
  };

  const handleOtpVerified = (token, user) => {
    setAuthData(token, user);
    toast.success('Welcome to FinovaWealth!');
    setShowOtpModal(false);
    navigate('/dashboard');
  };

  return (
    <div className="min-h-screen flex">
      {/* Left panel */}
      <div className="hidden lg:flex lg:w-1/2 bg-gradient-to-br from-accent-600 via-accent-500 to-primary-500 text-white p-12 flex-col justify-between relative overflow-hidden">
        <div className="absolute inset-0"><div className="absolute -top-20 -right-20 w-80 h-80 bg-white/5 rounded-full" /><div className="absolute -bottom-40 -left-20 w-96 h-96 bg-white/5 rounded-full" /></div>
        <div className="relative z-10">
          <Link to="/" className="flex items-center gap-2.5 mb-16">
            <div className="w-10 h-10 rounded-xl bg-white/20 flex items-center justify-center"><TrendingUp className="w-6 h-6" /></div>
            <span className="font-display font-bold text-2xl">FinovaWealth</span>
          </Link>
          <h1 className="font-display text-4xl font-bold leading-tight mb-6">Begin your wealth creation journey</h1>
          <p className="text-lg text-white/70 max-w-md">Join 1.25 lakh+ investors. Set up in under 5 minutes with zero paperwork.</p>
        </div>
        <div className="relative z-10 space-y-3">
          {['100% digital onboarding', 'SEBI registered platform', 'No hidden charges'].map(t => (
            <div key={t} className="flex items-center gap-3"><Check className="w-5 h-5 text-white/80" /><span className="text-white/80">{t}</span></div>
          ))}
        </div>
      </div>

      {/* Right panel */}
      <div className="w-full lg:w-1/2 flex items-center justify-center p-6 sm:p-12 bg-surface-50">
        <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} className="w-full max-w-md">
          <div className="lg:hidden flex items-center gap-2.5 mb-8">
            <div className="w-9 h-9 rounded-xl gradient-primary flex items-center justify-center"><TrendingUp className="w-5 h-5 text-white" /></div>
            <span className="font-display font-bold text-xl text-surface-900">Finova<span className="text-primary-600">Wealth</span></span>
          </div>

          <h2 className="text-2xl font-bold text-surface-900 mb-2">Create your account</h2>
          <p className="text-surface-500 mb-8">Start investing in 5 minutes</p>

          {/* Google */}
          <div className="mb-6 flex justify-center">
            <GoogleLogin
              onSuccess={handleCredentialResponse}
              onError={() => toast.error('Google sign-in failed')}
              theme="outline" size="large" width="100%" text="continue_with" shape="rectangular"
            />
          </div>
          <div className="flex items-center gap-4 mb-6"><div className="flex-1 h-px bg-surface-200" /><span className="text-sm text-surface-400">or</span><div className="flex-1 h-px bg-surface-200" /></div>

          <form onSubmit={handleRegister} className="space-y-4" onFocus={trackFormStart} autoComplete="off">
            <div>
              <label className="block text-sm font-medium text-surface-700 mb-1.5">Full Name</label>
              <div className="relative"><User className="absolute left-3.5 top-1/2 -translate-y-1/2 w-5 h-5 text-surface-400" />
                <input type="text" className="input-field pl-11" placeholder="Your full name" value={form.name} onChange={(e) => setForm({...form, name: e.target.value})} autoComplete="off" /></div>
            </div>
            <div>
              <label className="block text-sm font-medium text-surface-700 mb-1.5">Email</label>
              <div className="relative"><Mail className="absolute left-3.5 top-1/2 -translate-y-1/2 w-5 h-5 text-surface-400" />
                <input type="email" className="input-field pl-11" placeholder="you@example.com" value={form.email} onChange={(e) => setForm({...form, email: e.target.value})} autoComplete="off" /></div>
            </div>
            <div>
              <label className="block text-sm font-medium text-surface-700 mb-1.5">Phone</label>
              <div className="relative"><Phone className="absolute left-3.5 top-1/2 -translate-y-1/2 w-5 h-5 text-surface-400" />
                <input type="tel" className="input-field pl-11" placeholder="+91 XXXXX XXXXX" value={form.phone} onChange={(e) => setForm({...form, phone: e.target.value})} autoComplete="off" /></div>
            </div>
            <div>
              <label className="block text-sm font-medium text-surface-700 mb-1.5">Password</label>
              <div className="relative"><Lock className="absolute left-3.5 top-1/2 -translate-y-1/2 w-5 h-5 text-surface-400" />
                <input type={showPassword ? 'text' : 'password'} className="input-field pl-11 pr-11" placeholder="Create password" value={form.password} onChange={(e) => setForm({...form, password: e.target.value})} autoComplete="new-password" />
                <button type="button" onClick={() => setShowPassword(!showPassword)} className="absolute right-3.5 top-1/2 -translate-y-1/2 text-surface-400 hover:text-surface-600">
                  {showPassword ? <EyeOff className="w-5 h-5" /> : <Eye className="w-5 h-5" />}
                </button>
              </div>
              <PasswordStrength password={form.password} />
            </div>
            <button type="submit" disabled={loading} className="btn-primary w-full py-3.5 gap-2 mt-2 disabled:opacity-60">
              {loading ? <Loader2 className="w-5 h-5 animate-spin" /> : <>Continue <ArrowRight className="w-5 h-5" /></>}
            </button>
          </form>

          <p className="text-center text-sm text-surface-500 mt-6">
            Already have an account? <Link to="/login" className="text-primary-600 font-semibold hover:text-primary-700">Sign in</Link>
          </p>
        </motion.div>
      </div>

      {/* OTP Modal */}
      <AnimatePresence>
        {showOtpModal && (
          <OTPModal
            email={form.email}
            onVerified={handleOtpVerified}
            onClose={() => setShowOtpModal(false)}
          />
        )}
      </AnimatePresence>
    </div>
  );
}
