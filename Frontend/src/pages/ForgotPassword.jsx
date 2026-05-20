import { useState, useEffect } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { motion, AnimatePresence } from 'framer-motion';
import { Mail, TrendingUp, ArrowRight, ArrowLeft, Lock, Eye, EyeOff, Loader2, X, ShieldCheck, CheckCircle2 } from 'lucide-react';
import toast from 'react-hot-toast';
import { usePageTracking } from '../hooks/useTracking';
import { forgotPassword, verifyResetOTP, resetPassword } from '../api/authService';

/**
 * FLOW:
 *   Step 1: Enter email → backend sends reset OTP
 *   Step 2: OTP modal → verify reset OTP
 *   Step 3: New password modal → reset password
 *   Step 4: Success → redirect to login
 */
export default function ForgotPassword() {
  usePageTracking('forgot-password');
  const navigate = useNavigate();

  const [step, setStep] = useState(1);
  const [email, setEmail] = useState('');
  const [otp, setOtp] = useState(['', '', '', '', '', '']);
  const [otpVerified, setOtpVerified] = useState(false);
  const [verifiedOtp, setVerifiedOtp] = useState('');
  const [passwords, setPasswords] = useState({ newPassword: '', confirmPassword: '' });
  const [showPassword, setShowPassword] = useState(false);
  const [loading, setLoading] = useState(false);
  const [resendCooldown, setResendCooldown] = useState(0);

  // Resend timer
  useEffect(() => {
    if (resendCooldown <= 0) return;
    const t = setTimeout(() => setResendCooldown((c) => c - 1), 1000);
    return () => clearTimeout(t);
  }, [resendCooldown]);

  /** Step 1: Send reset OTP */
  const handleSendOTP = async (e) => {
    e.preventDefault();
    if (!email.trim()) { toast.error('Email is required'); return; }

    setLoading(true);
    try {
      const res = await forgotPassword({ email });
      if (res.success) {
        toast.success('Reset OTP sent to your email');
        setStep(2);
        setResendCooldown(60);
      } else {
        toast.error(res.message);
      }
    } catch (error) {
      toast.error(error.response?.data?.message || 'Failed to send OTP');
    } finally {
      setLoading(false);
    }
  };

  /** Step 2: Verify reset OTP */
  const handleVerifyOTP = async () => {
    const code = otp.join('');
    if (code.length !== 6) { toast.error('Enter the full 6-digit OTP'); return; }

    setLoading(true);
    try {
      const res = await verifyResetOTP({ email, otp: code });
      if (res.success) {
        toast.success('OTP verified!');
        setVerifiedOtp(code);
        setOtpVerified(true);
        setStep(3);
      } else {
        toast.error(res.message || 'Invalid OTP');
      }
    } catch (error) {
      toast.error(error.response?.data?.message || 'Verification failed');
    } finally {
      setLoading(false);
    }
  };

  /** Step 3: Reset password */
  const handleResetPassword = async (e) => {
    e.preventDefault();
    if (passwords.newPassword.length < 8) { toast.error('Password must be at least 8 characters'); return; }
    if (passwords.newPassword !== passwords.confirmPassword) { toast.error('Passwords do not match'); return; }

    setLoading(true);
    try {
      const res = await resetPassword({ email, otp: verifiedOtp, newPassword: passwords.newPassword });
      if (res.success) {
        toast.success('Password reset successful!');
        setStep(4);
        setTimeout(() => navigate('/login'), 2000);
      } else {
        toast.error(res.message || 'Reset failed');
      }
    } catch (error) {
      toast.error(error.response?.data?.message || 'Reset failed');
    } finally {
      setLoading(false);
    }
  };

  /** Resend reset OTP */
  const handleResend = async () => {
    if (resendCooldown > 0) return;
    try {
      await forgotPassword({ email });
      toast.success('New OTP sent!');
      setResendCooldown(60);
      setOtp(['', '', '', '', '', '']);
    } catch (error) {
      toast.error(error.response?.data?.message || 'Failed to resend');
    }
  };

  /** OTP input handlers */
  const handleOtpChange = (i, v) => {
    if (v && !/^\d$/.test(v)) return;
    const next = [...otp]; next[i] = v; setOtp(next);
    if (v && i < 5) document.getElementById(`reset-otp-${i + 1}`)?.focus();
  };
  const handleOtpKeyDown = (i, e) => {
    if (e.key === 'Backspace' && !otp[i] && i > 0)
      document.getElementById(`reset-otp-${i - 1}`)?.focus();
  };
  const handleOtpPaste = (e) => {
    e.preventDefault();
    const p = e.clipboardData.getData('text').replace(/\D/g, '').slice(0, 6);
    if (p.length === 6) { setOtp(p.split('')); document.getElementById('reset-otp-5')?.focus(); }
  };

  return (
    <div className="min-h-screen flex items-center justify-center bg-surface-50 p-6">
      <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} className="w-full max-w-md">
        <Link to="/" className="flex items-center gap-2.5 justify-center mb-10">
          <div className="w-9 h-9 rounded-xl gradient-primary flex items-center justify-center shadow-glow"><TrendingUp className="w-5 h-5 text-white" /></div>
          <span className="font-display font-bold text-xl text-surface-900">Finova<span className="text-primary-600">Wealth</span></span>
        </Link>

        <div className="bg-white rounded-2xl shadow-card p-8 border border-surface-100">

          {/* ── Step 1: Enter Email ─────────────────────── */}
          {step === 1 && (
            <>
              <h2 className="text-2xl font-bold text-surface-900 mb-2">Reset your password</h2>
              <p className="text-surface-500 mb-6">Enter your email and we'll send you a verification OTP</p>
              <form onSubmit={handleSendOTP} className="space-y-4">
                <div>
                  <label className="block text-sm font-medium text-surface-700 mb-1.5">Email address</label>
                  <div className="relative">
                    <Mail className="absolute left-3.5 top-1/2 -translate-y-1/2 w-5 h-5 text-surface-400" />
                    <input type="email" className="input-field pl-11" placeholder="you@example.com"
                      value={email} onChange={(e) => setEmail(e.target.value)} />
                  </div>
                </div>
                <button type="submit" disabled={loading} className="btn-primary w-full py-3.5 gap-2 disabled:opacity-60">
                  {loading ? <Loader2 className="w-5 h-5 animate-spin" /> : <>Send OTP <ArrowRight className="w-5 h-5" /></>}
                </button>
              </form>
            </>
          )}

          {/* ── Step 2: OTP Verification ───────────────── */}
          {step === 2 && (
            <>
              <div className="text-center mb-6">
                <div className="w-14 h-14 rounded-2xl bg-primary-50 flex items-center justify-center mx-auto mb-4">
                  <ShieldCheck className="w-7 h-7 text-primary-600" />
                </div>
                <h2 className="text-xl font-bold text-surface-900">Verify OTP</h2>
                <p className="text-sm text-surface-500 mt-1">
                  Enter the 6-digit code sent to <strong className="text-surface-700">{email}</strong>
                </p>
              </div>

              <div className="flex justify-center gap-3 mb-6" onPaste={handleOtpPaste}>
                {otp.map((d, i) => (
                  <input key={i} id={`reset-otp-${i}`} type="text" maxLength={1}
                    className="w-12 h-14 text-center text-xl font-bold border-2 border-surface-200 rounded-xl
                      focus:outline-none focus:ring-2 focus:ring-primary-500/20 focus:border-primary-500 transition-colors"
                    value={d}
                    onChange={(e) => handleOtpChange(i, e.target.value)}
                    onKeyDown={(e) => handleOtpKeyDown(i, e)}
                  />
                ))}
              </div>

              <button onClick={handleVerifyOTP} disabled={loading} className="btn-primary w-full py-3.5 gap-2 disabled:opacity-60">
                {loading ? <Loader2 className="w-5 h-5 animate-spin" /> : <>Verify OTP <ArrowRight className="w-5 h-5" /></>}
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

              <button onClick={() => { setStep(1); setOtp(['','','','','','']); }}
                className="w-full text-center text-sm text-surface-500 mt-4 hover:text-primary-600">
                ← Change email
              </button>
            </>
          )}

          {/* ── Step 3: New Password ───────────────────── */}
          {step === 3 && (
            <>
              <div className="text-center mb-6">
                <div className="w-14 h-14 rounded-2xl bg-accent-50 flex items-center justify-center mx-auto mb-4">
                  <Lock className="w-7 h-7 text-accent-600" />
                </div>
                <h2 className="text-xl font-bold text-surface-900">Set new password</h2>
                <p className="text-sm text-surface-500 mt-1">Choose a strong password for your account</p>
              </div>

              <form onSubmit={handleResetPassword} className="space-y-4">
                <div>
                  <label className="block text-sm font-medium text-surface-700 mb-1.5">New Password</label>
                  <div className="relative">
                    <Lock className="absolute left-3.5 top-1/2 -translate-y-1/2 w-5 h-5 text-surface-400" />
                    <input type={showPassword ? 'text' : 'password'} className="input-field pl-11 pr-11"
                      placeholder="Minimum 8 characters"
                      value={passwords.newPassword}
                      onChange={(e) => setPasswords({ ...passwords, newPassword: e.target.value })} />
                    <button type="button" onClick={() => setShowPassword(!showPassword)}
                      className="absolute right-3.5 top-1/2 -translate-y-1/2 text-surface-400 hover:text-surface-600">
                      {showPassword ? <EyeOff className="w-5 h-5" /> : <Eye className="w-5 h-5" />}
                    </button>
                  </div>
                </div>
                <div>
                  <label className="block text-sm font-medium text-surface-700 mb-1.5">Confirm Password</label>
                  <div className="relative">
                    <Lock className="absolute left-3.5 top-1/2 -translate-y-1/2 w-5 h-5 text-surface-400" />
                    <input type={showPassword ? 'text' : 'password'} className="input-field pl-11"
                      placeholder="Re-enter password"
                      value={passwords.confirmPassword}
                      onChange={(e) => setPasswords({ ...passwords, confirmPassword: e.target.value })} />
                  </div>
                  {passwords.confirmPassword && passwords.newPassword !== passwords.confirmPassword && (
                    <p className="text-xs text-red-500 mt-1">Passwords do not match</p>
                  )}
                </div>
                <button type="submit" disabled={loading} className="btn-primary w-full py-3.5 gap-2 disabled:opacity-60">
                  {loading ? <Loader2 className="w-5 h-5 animate-spin" /> : <>Reset Password <ArrowRight className="w-5 h-5" /></>}
                </button>
              </form>
            </>
          )}

          {/* ── Step 4: Success ────────────────────────── */}
          {step === 4 && (
            <div className="text-center py-4">
              <div className="w-16 h-16 rounded-full bg-accent-50 flex items-center justify-center mx-auto mb-4">
                <CheckCircle2 className="w-8 h-8 text-accent-600" />
              </div>
              <h2 className="text-2xl font-bold text-surface-900 mb-2">Password reset successful</h2>
              <p className="text-surface-500 mb-6">Redirecting to login…</p>
              <Link to="/login" className="btn-primary w-full py-3 gap-2">
                Go to Login <ArrowRight className="w-5 h-5" />
              </Link>
            </div>
          )}
        </div>

        <Link to="/login" className="flex items-center justify-center gap-2 text-sm text-surface-500 hover:text-primary-600 mt-6">
          <ArrowLeft className="w-4 h-4" /> Back to sign in
        </Link>
      </motion.div>
    </div>
  );
}
