import { useState, useEffect, useRef, useCallback } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { X, ChevronRight, ChevronLeft, Shield, CheckCircle2, Bookmark, IndianRupee, User, Phone, Mail, Building2, CreditCard, Wallet, AlertTriangle } from 'lucide-react';
import { useFormTracking, useClickTracking } from '../../hooks/useTracking';
import { queueEvent } from '../../api/eventService';
import { calculateFormCompletion, getFilledFields, validatePAN, validateUPI, validatePhone, validateEmail, validateBankAccount } from '../../utils/tracker';

const STEPS = ['Investment Details', 'Personal Info', 'Bank & Payment', 'Review & Confirm'];

const Field = ({ label, icon: Icon, error, children }) => (
  <div>
    <label className="block text-sm font-medium text-surface-700 mb-1.5">{Icon && <Icon className="w-3.5 h-3.5 inline mr-1.5 text-surface-400" />}{label}</label>
    {children}
    {error && <p className="text-xs text-red-500 mt-1">{error}</p>}
  </div>
);

const overlay = { hidden: { opacity: 0 }, visible: { opacity: 1 }, exit: { opacity: 0 } };
const modal = {
  hidden: { opacity: 0, scale: 0.92, y: 30 },
  visible: { opacity: 1, scale: 1, y: 0, transition: { type: 'spring', damping: 25, stiffness: 300 } },
  exit: { opacity: 0, scale: 0.92, y: 30 },
};

const REQUIRED = ['amount', 'riskAppetite', 'pan', 'annualIncome', 'occupation', 'horizon', 'email', 'phone', 'nomineeName', 'bankAccount', 'upiId', 'termsAccepted'];

const EMPTY_FORM = {
  amount: '', riskAppetite: '', pan: '', annualIncome: '', occupation: '',
  horizon: '', email: '', phone: '', nomineeName: '', bankAccount: '',
  upiId: '', fatcaCompliant: false, termsAccepted: false,
};

const getDraftKey = (fundName) => `finova_draft_mf_${fundName || 'unknown'}`;


export default function MutualFundInvestModal({ isOpen, onClose, fund, onInvested }) {
  const [step, setStep] = useState(0);
  const [errors, setErrors] = useState({});
  const [submitting, setSubmitting] = useState(false);
  const [success, setSuccess] = useState(false);
  const [draftRestored, setDraftRestored] = useState(false);
  const formStartTime = useRef(Date.now());
  const { trackFormStart, trackFormComplete } = useFormTracking('mutual_fund_invest');
  const trackClick = useClickTracking();

  const [form, setForm] = useState({ ...EMPTY_FORM });

  // Restore draft when modal opens
  useEffect(() => {
    if (isOpen && fund?.name) {
      trackFormStart();
      formStartTime.current = Date.now();
      queueEvent({ eventType: 'modal_open', page: '/mutual-funds', formType: 'mutual_fund_invest', metadata: { fundName: fund?.name } });

      // Try to restore saved draft
      try {
        const saved = localStorage.getItem(getDraftKey(fund.name));
        if (saved) {
          const draft = JSON.parse(saved);
          setForm({ ...EMPTY_FORM, ...draft.form });
          setStep(draft.step || 0);
          setDraftRestored(true);
        } else {
          setForm({ ...EMPTY_FORM });
          setStep(0);
          setDraftRestored(false);
        }
      } catch {
        setForm({ ...EMPTY_FORM });
        setStep(0);
      }
    }
  }, [isOpen, fund?.name]);

  const update = useCallback((field, value) => {
    setForm(p => ({ ...p, [field]: value }));
    setErrors(p => ({ ...p, [field]: undefined }));
  }, []);

  const trackFieldBlur = useCallback((field) => {
    queueEvent({ eventType: 'field_change', formType: 'mutual_fund_invest', fieldName: field });
  }, []);

  const validateStep = () => {
    const e = {};
    if (step === 0) {
      if (!form.amount || Number(form.amount) < 500) e.amount = 'Min ₹500';
      if (!form.riskAppetite) e.riskAppetite = 'Required';
      if (!form.horizon) e.horizon = 'Required';
    } else if (step === 1) {
      if (!validatePAN(form.pan)) e.pan = 'Invalid PAN';
      if (!form.annualIncome) e.annualIncome = 'Required';
      if (!form.occupation) e.occupation = 'Required';
      if (!validateEmail(form.email)) e.email = 'Invalid email';
      if (!validatePhone(form.phone)) e.phone = 'Invalid phone';
      if (!form.nomineeName?.trim()) e.nomineeName = 'Required';
    } else if (step === 2) {
      if (!validateBankAccount(form.bankAccount)) e.bankAccount = 'Invalid account';
      if (!validateUPI(form.upiId)) e.upiId = 'Invalid UPI';
    } else if (step === 3) {
      if (!form.termsAccepted) e.termsAccepted = 'Accept terms';
    }
    setErrors(e);
    return Object.keys(e).length === 0;
  };

  const next = () => { if (validateStep()) setStep(s => Math.min(s + 1, 3)); };
  const prev = () => setStep(s => Math.max(s - 1, 0));

  const handleSubmit = async (e) => {
    if (!validateStep()) return;
    setSubmitting(true);
    trackClick('invest_now', { fund: fund?.name, amount: form.amount }, e);
    queueEvent({ eventType: 'form_submit', formType: 'mutual_fund_invest', duration: Math.round((Date.now() - formStartTime.current) / 1000), metadata: { fund: fund?.name, amount: form.amount } });
    trackFormComplete();
    await new Promise(r => setTimeout(r, 1800));
    // Clear draft on successful submission
    localStorage.removeItem(getDraftKey(fund?.name));
    setSubmitting(false);
    setSuccess(true);
    // Notify parent about the investment
    if (onInvested) onInvested(fund, form.amount);
  };

  const handleClose = () => {
    if (!success) {
      const completion = calculateFormCompletion(form, REQUIRED);
      if (completion > 0) {
        queueEvent({ eventType: 'form_abandon', formType: 'mutual_fund_invest', metadata: { completion, filledFields: getFilledFields(form), step }, duration: Math.round((Date.now() - formStartTime.current) / 1000) });
      }
    }
    setStep(0); setForm({ ...EMPTY_FORM });
    setErrors({}); setSuccess(false); setDraftRestored(false);
    onClose();
  };

  const saveDraft = (e) => {
    trackClick('save_for_later', { fund: fund?.name }, e);
    const completion = calculateFormCompletion(form, REQUIRED);
    queueEvent({ eventType: 'form_save_draft', formType: 'mutual_fund_invest', metadata: { completion, step } });
    // Persist draft to localStorage
    try {
      localStorage.setItem(getDraftKey(fund?.name), JSON.stringify({ form, step, savedAt: Date.now() }));
    } catch { /* localStorage full — silently fail */ }
    // Close without resetting form (draft is saved)
    setErrors({}); setSuccess(false);
    onClose();
  };

  if (!isOpen) return null;

  return (
    <AnimatePresence>
      <motion.div variants={overlay} initial="hidden" animate="visible" exit="exit" className="fixed inset-0 z-50 flex items-end sm:items-center justify-center p-0 sm:p-4 bg-black/40 backdrop-blur-sm" onClick={handleClose}>
        <motion.div variants={modal} initial="hidden" animate="visible" exit="exit" className="relative w-full max-w-xl bg-white rounded-2xl shadow-elevated overflow-hidden max-h-[90vh] flex flex-col" onClick={e => e.stopPropagation()}>

          {/* Header */}
          <div className="bg-gradient-to-r from-primary-600 to-primary-500 px-4 sm:px-6 py-5 text-white">
            <div className="flex items-center justify-between">
              <div>
                <h2 className="text-lg font-bold">{success ? 'Investment Confirmed!' : `Invest in ${fund?.name || 'Fund'}`}</h2>
                <p className="text-primary-100 text-sm mt-0.5">{success ? 'Your investment has been processed' : STEPS[step]}</p>
              </div>
              <button onClick={handleClose} className="p-2 rounded-lg hover:bg-white/20 transition-colors"><X className="w-5 h-5" /></button>
            </div>
            {/* Stepper */}
            {!success && (
              <div className="flex gap-2 mt-4">
                {STEPS.map((s, i) => (
                  <div key={i} className="flex-1">
                    <div className={`h-1.5 rounded-full transition-all duration-300 ${i <= step ? 'bg-white' : 'bg-white/30'}`} />
                    <p className={`text-[10px] mt-1 ${i <= step ? 'text-white' : 'text-white/50'}`}>{s}</p>
                  </div>
                ))}
              </div>
            )}
          </div>

          {/* Body */}
          <div className="flex-1 overflow-y-auto px-4 sm:px-6 py-5">
            {success ? (
              <motion.div initial={{ scale: 0.8, opacity: 0 }} animate={{ scale: 1, opacity: 1 }} className="text-center py-8">
                <div className="w-20 h-20 rounded-full bg-accent-100 flex items-center justify-center mx-auto mb-4">
                  <CheckCircle2 className="w-10 h-10 text-accent-600" />
                </div>
                <h3 className="text-xl font-bold text-surface-900 mb-2">Investment Successful!</h3>
                <p className="text-surface-500 mb-1">₹{Number(form.amount).toLocaleString('en-IN')} invested in {fund?.name}</p>
                <p className="text-sm text-surface-400">Confirmation will be sent to {form.email}</p>
                <button onClick={handleClose} className="btn-primary mt-6">Done</button>
              </motion.div>
            ) : (
              <AnimatePresence mode="wait">
                <motion.div key={step} initial={{ x: 20, opacity: 0 }} animate={{ x: 0, opacity: 1 }} exit={{ x: -20, opacity: 0 }} transition={{ duration: 0.2 }} className="space-y-4">

                  {step === 0 && (<>
                    <Field label="Investment Amount (₹)" icon={IndianRupee} error={errors.amount}>
                      <input type="number" className="input-field" placeholder="Min ₹500" value={form.amount} onChange={e => update('amount', e.target.value)} onBlur={() => trackFieldBlur('amount')} />
                    </Field>
                    <div className="grid sm:grid-cols-2 gap-4">
                      <Field label="Risk Appetite" error={errors.riskAppetite}>
                        <select className="input-field" value={form.riskAppetite} onChange={e => update('riskAppetite', e.target.value)}>
                          <option value="">Select</option>
                          <option value="conservative">Conservative</option>
                          <option value="moderate">Moderate</option>
                          <option value="aggressive">Aggressive</option>
                        </select>
                      </Field>
                      <Field label="Investment Horizon" error={errors.horizon}>
                        <select className="input-field" value={form.horizon} onChange={e => update('horizon', e.target.value)}>
                          <option value="">Select</option>
                          <option value="1-3">1–3 Years</option>
                          <option value="3-5">3–5 Years</option>
                          <option value="5-10">5–10 Years</option>
                          <option value="10+">10+ Years</option>
                        </select>
                      </Field>
                    </div>
                    {fund && (
                      <div className="p-4 bg-primary-50 rounded-xl border border-primary-100">
                        <p className="text-sm font-semibold text-surface-900">{fund.name}</p>
                        <div className="flex gap-4 mt-2 text-xs text-surface-500">
                          <span>NAV: ₹{fund.nav}</span><span>1Y: +{fund.returns1y}%</span><span>{fund.risk} Risk</span>
                        </div>
                      </div>
                    )}
                  </>)}

                  {step === 1 && (<>
                    <div className="grid sm:grid-cols-2 gap-4">
                      <Field label="PAN Number" icon={CreditCard} error={errors.pan}>
                        <input className="input-field uppercase" placeholder="ABCDE1234F" maxLength={10} value={form.pan} onChange={e => update('pan', e.target.value.toUpperCase())} onBlur={() => trackFieldBlur('pan')} />
                      </Field>
                      <Field label="Occupation" icon={Building2} error={errors.occupation}>
                        <select className="input-field" value={form.occupation} onChange={e => update('occupation', e.target.value)}>
                          <option value="">Select</option>
                          <option value="salaried">Salaried</option>
                          <option value="self-employed">Self Employed</option>
                          <option value="business">Business</option>
                          <option value="student">Student</option>
                          <option value="retired">Retired</option>
                        </select>
                      </Field>
                    </div>
                    <Field label="Annual Income" error={errors.annualIncome}>
                      <select className="input-field" value={form.annualIncome} onChange={e => update('annualIncome', e.target.value)}>
                        <option value="">Select</option>
                        <option value="below-5l">Below ₹5 Lakh</option>
                        <option value="5-10l">₹5–10 Lakh</option>
                        <option value="10-25l">₹10–25 Lakh</option>
                        <option value="25-50l">₹25–50 Lakh</option>
                        <option value="above-50l">Above ₹50 Lakh</option>
                      </select>
                    </Field>
                    <div className="grid grid-cols-2 gap-4">
                      <Field label="Email" icon={Mail} error={errors.email}>
                        <input className="input-field" type="email" placeholder="you@email.com" value={form.email} onChange={e => update('email', e.target.value)} onBlur={() => trackFieldBlur('email')} />
                      </Field>
                      <Field label="Phone" icon={Phone} error={errors.phone}>
                        <input className="input-field" placeholder="9876543210" maxLength={10} value={form.phone} onChange={e => update('phone', e.target.value)} onBlur={() => trackFieldBlur('phone')} />
                      </Field>
                    </div>
                    <Field label="Nominee Name" icon={User} error={errors.nomineeName}>
                      <input className="input-field" placeholder="Full name" value={form.nomineeName} onChange={e => update('nomineeName', e.target.value)} onBlur={() => trackFieldBlur('nomineeName')} />
                    </Field>
                  </>)}

                  {step === 2 && (<>
                    <Field label="Bank Account Number" icon={Building2} error={errors.bankAccount}>
                      <input className="input-field" placeholder="Account number" value={form.bankAccount} onChange={e => update('bankAccount', e.target.value)} onBlur={() => trackFieldBlur('bankAccount')} />
                    </Field>
                    <Field label="UPI ID" icon={Wallet} error={errors.upiId}>
                      <input className="input-field" placeholder="yourname@upi" value={form.upiId} onChange={e => update('upiId', e.target.value)} onBlur={() => trackFieldBlur('upiId')} />
                    </Field>
                    <label className="flex items-start gap-3 p-4 bg-surface-50 rounded-xl cursor-pointer">
                      <input type="checkbox" className="mt-1 w-4 h-4 rounded accent-primary-600" checked={form.fatcaCompliant} onChange={e => update('fatcaCompliant', e.target.checked)} />
                      <div><p className="text-sm font-medium text-surface-700">FATCA Declaration</p><p className="text-xs text-surface-400 mt-0.5">I declare that I am a tax resident of India only.</p></div>
                    </label>
                  </>)}

                  {step === 3 && (<>
                    <div className="space-y-3 p-4 bg-surface-50 rounded-xl">
                      <h4 className="font-semibold text-surface-900 text-sm">Investment Summary</h4>
                      {[['Fund', fund?.name], ['Amount', `₹${Number(form.amount || 0).toLocaleString('en-IN')}`], ['Risk', form.riskAppetite], ['Horizon', form.horizon], ['PAN', form.pan], ['UPI', form.upiId]].map(([k, v]) => (
                        <div key={k} className="flex justify-between text-sm"><span className="text-surface-500">{k}</span><span className="font-medium text-surface-900">{v || '—'}</span></div>
                      ))}
                    </div>
                    <label className={`flex items-start gap-3 p-4 rounded-xl cursor-pointer border ${errors.termsAccepted ? 'border-red-300 bg-red-50' : 'border-surface-200 bg-white'}`}>
                      <input type="checkbox" className="mt-1 w-4 h-4 rounded accent-primary-600" checked={form.termsAccepted} onChange={e => update('termsAccepted', e.target.checked)} />
                      <div><p className="text-sm font-medium text-surface-700">I agree to the Terms & Conditions</p><p className="text-xs text-surface-400 mt-0.5">Including investment risks and privacy policy.</p></div>
                    </label>
                    {errors.termsAccepted && <p className="text-xs text-red-500">Please accept the terms to continue</p>}
                  </>)}
                </motion.div>
              </AnimatePresence>
            )}
          </div>

          {/* Footer */}
          {!success && (
            <div className="px-4 sm:px-6 py-4 border-t border-surface-100 flex flex-col-reverse sm:flex-row gap-3 sm:items-center sm:justify-between bg-surface-50/50">
              <div className="flex flex-col sm:flex-row gap-2">
                {step > 0 && <button onClick={prev} className="btn-secondary w-full sm:w-auto text-sm py-2 px-4 gap-1"><ChevronLeft className="w-4 h-4" />Back</button>}
                <button onClick={saveDraft} className="w-full sm:w-auto text-sm text-surface-500 hover:text-primary-600 px-3 py-2 flex items-center justify-center gap-1"><Bookmark className="w-3.5 h-3.5" />Save Draft</button>
              </div>
              {step < 3 ? (
                <button onClick={next} className="btn-primary w-full sm:w-auto text-sm py-2.5 px-6 gap-1">Continue<ChevronRight className="w-4 h-4" /></button>
              ) : (
                <button onClick={handleSubmit} disabled={submitting} className="btn-accent w-full sm:w-auto text-sm py-2.5 px-6 gap-1 disabled:opacity-50">
                  {submitting ? <><div className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin" />Processing...</> : <><Shield className="w-4 h-4" />Invest Now</>}
                </button>
              )}
            </div>
          )}
        </motion.div>
      </motion.div>
    </AnimatePresence>
  );
}
