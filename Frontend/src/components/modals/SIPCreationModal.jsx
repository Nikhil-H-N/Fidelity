import { useState, useEffect, useRef } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { X, ChevronRight, ChevronLeft, Play, Calendar, IndianRupee, Building2, Wallet, CheckCircle2, TrendingUp } from 'lucide-react';
import { AreaChart, Area, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer } from 'recharts';
import { useFormTracking, useClickTracking } from '../../hooks/useTracking';
import { queueEvent } from '../../api/eventService';
import { sipCalculator, calculateFormCompletion, getFilledFields } from '../../utils/tracker';
import { mutualFunds } from '../../data/mockData';

const STEPS = ['SIP Details', 'Fund Selection', 'Payment Setup', 'Review'];
const overlay = { hidden: { opacity: 0 }, visible: { opacity: 1 }, exit: { opacity: 0 } };
const modal = { hidden: { opacity: 0, scale: 0.92, y: 30 }, visible: { opacity: 1, scale: 1, y: 0, transition: { type: 'spring', damping: 25, stiffness: 300 } }, exit: { opacity: 0, scale: 0.92, y: 30 } };
const REQUIRED = ['sipAmount', 'sipDate', 'frequency', 'duration', 'selectedFund', 'bankAccount', 'upiId'];

export default function SIPCreationModal({ isOpen, onClose }) {
  const [step, setStep] = useState(0);
  const [errors, setErrors] = useState({});
  const [submitting, setSubmitting] = useState(false);
  const [success, setSuccess] = useState(false);
  const startTime = useRef(Date.now());
  const { trackFormStart, trackFormComplete } = useFormTracking('sip_creation');
  const trackClick = useClickTracking();

  const [form, setForm] = useState({
    sipAmount: 5000, sipDate: '5', frequency: 'monthly', duration: 5,
    expectedReturn: 12, selectedFund: '', bankAccount: '', upiId: '', autoDebit: true,
  });

  useEffect(() => {
    if (isOpen) { trackFormStart(); startTime.current = Date.now(); queueEvent({ eventType: 'modal_open', page: '/sip-plans', formType: 'sip_creation' }); }
  }, [isOpen]);

  const update = (field, value) => {
    setForm(p => ({ ...p, [field]: value }));
    setErrors(p => ({ ...p, [field]: undefined }));
  };

  const projection = sipCalculator.calculate(form.sipAmount, form.expectedReturn, form.duration);
  const chartData = sipCalculator.getProjectionData(form.sipAmount, form.expectedReturn, form.duration);

  const validateStep = () => {
    const e = {};
    if (step === 0) {
      if (form.sipAmount < 500) e.sipAmount = 'Min ₹500';
      if (!form.sipDate) e.sipDate = 'Required';
      if (form.duration < 1) e.duration = 'Min 1 year';
    } else if (step === 1) {
      if (!form.selectedFund) e.selectedFund = 'Select a fund';
    } else if (step === 2) {
      if (!form.bankAccount || form.bankAccount.length < 9) e.bankAccount = 'Invalid account';
      if (!form.upiId || !form.upiId.includes('@')) e.upiId = 'Invalid UPI';
    }
    setErrors(e);
    return Object.keys(e).length === 0;
  };

  const next = () => { if (validateStep()) setStep(s => Math.min(s + 1, 3)); };
  const prev = () => setStep(s => Math.max(s - 1, 0));

  const handleSubmit = async (e) => {
    setSubmitting(true);
    trackClick('create_sip', { amount: form.sipAmount, fund: form.selectedFund }, e);
    queueEvent({ eventType: 'form_submit', formType: 'sip_creation', duration: Math.round((Date.now() - startTime.current) / 1000), metadata: { amount: form.sipAmount, fund: form.selectedFund } });
    trackFormComplete();
    await new Promise(r => setTimeout(r, 1800));
    setSubmitting(false);
    setSuccess(true);
  };

  const handleClose = () => {
    if (!success) {
      const completion = calculateFormCompletion(form, REQUIRED);
      if (completion > 0) queueEvent({ eventType: 'form_abandon', formType: 'sip_creation', metadata: { completion, filledFields: getFilledFields(form), step }, duration: Math.round((Date.now() - startTime.current) / 1000) });
    }
    setStep(0); setForm({ sipAmount: 5000, sipDate: '5', frequency: 'monthly', duration: 5, expectedReturn: 12, selectedFund: '', bankAccount: '', upiId: '', autoDebit: true });
    setErrors({}); setSuccess(false); onClose();
  };

  if (!isOpen) return null;

  const selectedFundData = mutualFunds.find(f => f.name === form.selectedFund);
  const fmt = n => `₹${n.toLocaleString('en-IN')}`;

  return (
    <AnimatePresence>
      <motion.div variants={overlay} initial="hidden" animate="visible" exit="exit" className="fixed inset-0 z-50 flex items-end sm:items-center justify-center p-0 sm:p-4 bg-black/40 backdrop-blur-sm" onClick={handleClose}>
        <motion.div variants={modal} initial="hidden" animate="visible" exit="exit" className="relative w-full max-w-2xl bg-white rounded-2xl shadow-elevated overflow-hidden max-h-[90vh] flex flex-col" onClick={e => e.stopPropagation()}>

          {/* Header */}
          <div className="bg-gradient-to-r from-accent-600 to-accent-500 px-4 sm:px-6 py-5 text-white">
            <div className="flex items-center justify-between">
              <div><h2 className="text-lg font-bold">{success ? 'SIP Created!' : 'Start New SIP'}</h2><p className="text-accent-100 text-sm mt-0.5">{success ? 'Systematic Investment Plan activated' : STEPS[step]}</p></div>
              <button onClick={handleClose} className="p-2 rounded-lg hover:bg-white/20 transition-colors"><X className="w-5 h-5" /></button>
            </div>
            {!success && (
              <div className="flex gap-2 mt-4">
                {STEPS.map((s, i) => (<div key={i} className="flex-1"><div className={`h-1.5 rounded-full transition-all duration-300 ${i <= step ? 'bg-white' : 'bg-white/30'}`} /><p className={`text-[10px] mt-1 ${i <= step ? 'text-white' : 'text-white/50'}`}>{s}</p></div>))}
              </div>
            )}
          </div>

          {/* Body */}
          <div className="flex-1 overflow-y-auto px-4 sm:px-6 py-5">
            {success ? (
              <motion.div initial={{ scale: 0.8, opacity: 0 }} animate={{ scale: 1, opacity: 1 }} className="text-center py-8">
                <div className="w-20 h-20 rounded-full bg-accent-100 flex items-center justify-center mx-auto mb-4"><CheckCircle2 className="w-10 h-10 text-accent-600" /></div>
                <h3 className="text-xl font-bold text-surface-900 mb-2">SIP Activated!</h3>
                <p className="text-surface-500">{fmt(form.sipAmount)}/month in {form.selectedFund}</p>
                <p className="text-sm text-surface-400 mt-1">Next debit: {form.sipDate}th of this month</p>
                <button onClick={handleClose} className="btn-primary mt-6">Done</button>
              </motion.div>
            ) : (
              <AnimatePresence mode="wait">
                <motion.div key={step} initial={{ x: 20, opacity: 0 }} animate={{ x: 0, opacity: 1 }} exit={{ x: -20, opacity: 0 }} transition={{ duration: 0.2 }} className="space-y-5">

                  {step === 0 && (<>
                    <div>
                      <label className="block text-sm font-medium text-surface-700 mb-2"><IndianRupee className="w-3.5 h-3.5 inline mr-1" />Monthly SIP Amount</label>
                      <input type="range" min={500} max={100000} step={500} value={form.sipAmount} onChange={e => update('sipAmount', Number(e.target.value))} className="w-full h-2 bg-surface-200 rounded-lg appearance-none cursor-pointer accent-accent-600" />
                      <div className="flex justify-between mt-1"><span className="text-xs text-surface-400">₹500</span><span className="text-lg font-bold text-accent-600">{fmt(form.sipAmount)}</span><span className="text-xs text-surface-400">₹1L</span></div>
                      {errors.sipAmount && <p className="text-xs text-red-500 mt-1">{errors.sipAmount}</p>}
                    </div>
                    <div className="grid sm:grid-cols-3 gap-3">
                      <div><label className="block text-xs font-medium text-surface-600 mb-1">SIP Date</label><select className="input-field text-sm" value={form.sipDate} onChange={e => update('sipDate', e.target.value)}>{['1','5','10','15','20','25'].map(d => <option key={d} value={d}>{d}th</option>)}</select></div>
                      <div><label className="block text-xs font-medium text-surface-600 mb-1">Frequency</label><select className="input-field text-sm" value={form.frequency} onChange={e => update('frequency', e.target.value)}><option value="monthly">Monthly</option><option value="quarterly">Quarterly</option></select></div>
                      <div><label className="block text-xs font-medium text-surface-600 mb-1">Duration (Yrs)</label><input type="number" className="input-field text-sm" min={1} max={30} value={form.duration} onChange={e => update('duration', Number(e.target.value))} />{errors.duration && <p className="text-xs text-red-500 mt-1">{errors.duration}</p>}</div>
                    </div>
                    <div><label className="block text-xs font-medium text-surface-600 mb-1">Expected Return (%)</label><input type="range" min={6} max={25} step={0.5} value={form.expectedReturn} onChange={e => update('expectedReturn', Number(e.target.value))} className="w-full h-2 bg-surface-200 rounded-lg appearance-none cursor-pointer accent-primary-600" /><span className="text-sm font-semibold text-primary-600">{form.expectedReturn}% p.a.</span></div>

                    {/* Projection Card */}
                    <div className="bg-gradient-to-br from-surface-50 to-primary-50 rounded-xl p-4 border border-surface-100">
                      <div className="flex items-center gap-2 mb-3"><TrendingUp className="w-4 h-4 text-primary-600" /><span className="text-sm font-semibold text-surface-900">Projected Wealth</span></div>
                      <div className="grid grid-cols-3 gap-3 mb-3">
                        <div><p className="text-[10px] text-surface-400 uppercase">Invested</p><p className="text-sm font-bold text-surface-700">{fmt(projection.totalInvested)}</p></div>
                        <div><p className="text-[10px] text-surface-400 uppercase">Returns</p><p className="text-sm font-bold text-accent-600">{fmt(projection.estimatedReturns)}</p></div>
                        <div><p className="text-[10px] text-surface-400 uppercase">Total Value</p><p className="text-sm font-bold text-primary-600">{fmt(projection.totalValue)}</p></div>
                      </div>
                      <div className="h-36">
                        <ResponsiveContainer width="100%" height="100%">
                          <AreaChart data={chartData}><CartesianGrid strokeDasharray="3 3" stroke="#e2e8f0" /><XAxis dataKey="year" tick={{ fontSize: 10 }} /><YAxis tick={{ fontSize: 10 }} tickFormatter={v => `${(v/100000).toFixed(0)}L`} /><Tooltip formatter={v => [fmt(v)]} /><Area type="monotone" dataKey="invested" stroke="#94A3B8" fill="#F1F5F9" /><Area type="monotone" dataKey="value" stroke="#10B981" fill="#ECFDF5" /></AreaChart>
                        </ResponsiveContainer>
                      </div>
                    </div>
                  </>)}

                  {step === 1 && (
                    <div className="space-y-3">
                      <p className="text-sm font-medium text-surface-700">Select Fund</p>
                      {errors.selectedFund && <p className="text-xs text-red-500">{errors.selectedFund}</p>}
                      {mutualFunds.slice(0, 6).map(f => (
                        <label key={f.id} className={`flex items-center gap-4 p-4 rounded-xl border cursor-pointer transition-all ${form.selectedFund === f.name ? 'border-accent-300 bg-accent-50 ring-2 ring-accent-200' : 'border-surface-100 bg-white hover:border-surface-200'}`}>
                          <input type="radio" name="fund" className="accent-accent-600" checked={form.selectedFund === f.name} onChange={() => update('selectedFund', f.name)} />
                          <div className="flex-1 min-w-0">
                            <p className="text-sm font-semibold text-surface-900 truncate">{f.name}</p>
                            <p className="text-xs text-surface-400">{f.category} · {f.risk}</p>
                          </div>
                          <div className="text-right"><p className="text-sm font-bold text-accent-600">+{f.returns1y}%</p><p className="text-[10px] text-surface-400">1Y Returns</p></div>
                        </label>
                      ))}
                    </div>
                  )}

                  {step === 2 && (<>
                    <div><label className="block text-sm font-medium text-surface-700 mb-1.5"><Building2 className="w-3.5 h-3.5 inline mr-1" />Bank Account</label><input className="input-field" placeholder="Account number" value={form.bankAccount} onChange={e => update('bankAccount', e.target.value)} />{errors.bankAccount && <p className="text-xs text-red-500 mt-1">{errors.bankAccount}</p>}</div>
                    <div><label className="block text-sm font-medium text-surface-700 mb-1.5"><Wallet className="w-3.5 h-3.5 inline mr-1" />UPI ID (for mandate)</label><input className="input-field" placeholder="yourname@upi" value={form.upiId} onChange={e => update('upiId', e.target.value)} />{errors.upiId && <p className="text-xs text-red-500 mt-1">{errors.upiId}</p>}</div>
                    <label className="flex items-center gap-3 p-4 bg-surface-50 rounded-xl cursor-pointer"><input type="checkbox" className="w-4 h-4 accent-accent-600" checked={form.autoDebit} onChange={e => update('autoDebit', e.target.checked)} /><div><p className="text-sm font-medium text-surface-700">Enable Auto-Debit</p><p className="text-xs text-surface-400">Automatically debit on your selected SIP date</p></div></label>
                  </>)}

                  {step === 3 && (<>
                    <div className="space-y-3 p-4 bg-surface-50 rounded-xl">
                      <h4 className="font-semibold text-surface-900 text-sm">SIP Summary</h4>
                      {[['Fund', form.selectedFund], ['Monthly', fmt(form.sipAmount)], ['Date', `${form.sipDate}th of month`], ['Duration', `${form.duration} years`], ['Expected Return', `${form.expectedReturn}%`], ['Projected Value', fmt(projection.totalValue)], ['UPI', form.upiId], ['Auto-Debit', form.autoDebit ? 'Enabled' : 'Disabled']].map(([k, v]) => (
                        <div key={k} className="flex justify-between text-sm"><span className="text-surface-500">{k}</span><span className="font-medium text-surface-900">{v || '—'}</span></div>
                      ))}
                    </div>
                  </>)}
                </motion.div>
              </AnimatePresence>
            )}
          </div>

          {/* Footer */}
          {!success && (
            <div className="px-4 sm:px-6 py-4 border-t border-surface-100 flex flex-col-reverse sm:flex-row gap-3 sm:items-center sm:justify-between bg-surface-50/50">
              <div>{step > 0 && <button onClick={prev} className="btn-secondary w-full sm:w-auto text-sm py-2 px-4 gap-1"><ChevronLeft className="w-4 h-4" />Back</button>}</div>
              {step < 3 ? (
                <button onClick={next} className="btn-primary w-full sm:w-auto text-sm py-2.5 px-6 gap-1">Continue<ChevronRight className="w-4 h-4" /></button>
              ) : (
                <button onClick={handleSubmit} disabled={submitting} className="btn-accent w-full sm:w-auto text-sm py-2.5 px-6 gap-1 disabled:opacity-50">
                  {submitting ? <><div className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin" />Processing...</> : <><Play className="w-4 h-4" />Start SIP</>}
                </button>
              )}
            </div>
          )}
        </motion.div>
      </motion.div>
    </AnimatePresence>
  );
}
