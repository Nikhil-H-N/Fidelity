import { useState, useEffect, useRef } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { X, ChevronRight, ChevronLeft, Sparkles, Target, Wallet, Shield, TrendingUp, CheckCircle2, PieChart, Brain } from 'lucide-react';
import { PieChart as RePieChart, Pie, Cell, ResponsiveContainer, Tooltip } from 'recharts';
import { useFormTracking, useClickTracking } from '../../hooks/useTracking';
import { queueEvent } from '../../api/eventService';
import { calculateFormCompletion, getFilledFields } from '../../utils/tracker';

const STEPS = ['Financial Goals', 'Income & Savings', 'Risk Profile', 'Your Plan'];
const overlay = { hidden: { opacity: 0 }, visible: { opacity: 1 }, exit: { opacity: 0 } };
const modal = { hidden: { opacity: 0, scale: 0.92, y: 30 }, visible: { opacity: 1, scale: 1, y: 0, transition: { type: 'spring', damping: 25, stiffness: 300 } }, exit: { opacity: 0, scale: 0.92, y: 30 } };
const REQUIRED = ['goals', 'salaryRange', 'monthlySavings', 'riskAppetite', 'retirementAge'];
const COLORS = ['#2E51F5', '#10B981', '#F59E0B', '#8B5CF6', '#EC4899'];
const GOALS = ['Wealth Creation', 'Retirement', 'Child Education', 'Home Purchase', 'Emergency Fund', 'Tax Saving', 'Passive Income', 'Vacation'];
const riskOptionClasses = {
  conservative: 'border-accent-300 bg-accent-50 ring-1 ring-accent-200',
  moderate: 'border-primary-300 bg-primary-50 ring-1 ring-primary-200',
  aggressive: 'border-amber-300 bg-amber-50 ring-1 ring-amber-200',
};

export default function InvestmentPlanWizard({ isOpen, onClose, planName }) {
  const [step, setStep] = useState(0);
  const [errors, setErrors] = useState({});
  const [showResult, setShowResult] = useState(false);
  const startTime = useRef(Date.now());
  const { trackFormStart, trackFormComplete } = useFormTracking('investment_plan');
  const trackClick = useClickTracking();

  const [form, setForm] = useState({
    goals: [], salaryRange: '', existingInvestments: '', debtObligations: '',
    riskAppetite: '', retirementAge: 60, expectedReturns: '', monthlySavings: '',
  });

  useEffect(() => {
    if (isOpen) { trackFormStart(); startTime.current = Date.now(); queueEvent({ eventType: 'modal_open', page: '/investment-plans', formType: 'investment_plan', metadata: { planName } }); }
  }, [isOpen]);

  const update = (field, value) => { setForm(p => ({ ...p, [field]: value })); setErrors(p => ({ ...p, [field]: undefined })); };
  const toggleGoal = (g) => { setForm(p => ({ ...p, goals: p.goals.includes(g) ? p.goals.filter(x => x !== g) : [...p.goals, g] })); setErrors(p => ({ ...p, goals: undefined })); };

  const validateStep = () => {
    const e = {};
    if (step === 0) { if (form.goals.length === 0) e.goals = 'Select at least 1 goal'; }
    else if (step === 1) { if (!form.salaryRange) e.salaryRange = 'Required'; if (!form.monthlySavings) e.monthlySavings = 'Required'; }
    else if (step === 2) { if (!form.riskAppetite) e.riskAppetite = 'Required'; }
    setErrors(e);
    return Object.keys(e).length === 0;
  };

  const next = (e) => { if (validateStep()) { if (step === 2) { generatePlan(e); } setStep(s => Math.min(s + 1, 3)); } };
  const prev = () => { if (step === 3) setShowResult(false); setStep(s => Math.max(s - 1, 0)); };

  // AI Plan generation
  const [plan, setPlan] = useState(null);
  const generatePlan = (e) => {
    trackClick('generate_plan', { goals: form.goals }, e);
    queueEvent({ eventType: 'investment_intent', formType: 'investment_plan', metadata: form });

    const riskMap = { conservative: 30, moderate: 50, aggressive: 75 };
    const equity = riskMap[form.riskAppetite] || 50;
    const allocation = [
      { name: 'Equity MF', value: equity, color: COLORS[0] },
      { name: 'Debt MF', value: Math.round((100 - equity) * 0.5), color: COLORS[1] },
      { name: 'Gold', value: Math.round((100 - equity) * 0.2), color: COLORS[2] },
      { name: 'FD/Bonds', value: Math.round((100 - equity) * 0.3), color: COLORS[3] },
    ];
    const riskScore = form.riskAppetite === 'aggressive' ? 82 : form.riskAppetite === 'moderate' ? 55 : 28;
    const savings = parseInt(form.monthlySavings?.replace(/\D/g, '')) || 10000;
    const years = form.retirementAge - 30;
    const rate = form.riskAppetite === 'aggressive' ? 15 : form.riskAppetite === 'moderate' ? 12 : 9;
    const n = years * 12; const r = rate / 100 / 12;
    const projectedValue = r > 0 ? savings * ((Math.pow(1 + r, n) - 1) / r) * (1 + r) : savings * n;

    setPlan({ allocation, riskScore, projectedValue: Math.round(projectedValue), expectedReturn: rate, suggestedSIP: savings, recommendations: [
      `Start ${form.riskAppetite} portfolio with ${equity}% equity allocation`,
      `Maintain ₹${savings.toLocaleString('en-IN')}/month SIP discipline`,
      form.goals.includes('Tax Saving') ? 'Maximize Section 80C with ELSS funds' : 'Consider tax-saving ELSS for additional benefits',
      `Target retirement corpus by age ${form.retirementAge}`,
    ]});
    setShowResult(true);
  };

  const handleClose = () => {
    if (!showResult) {
      const completion = calculateFormCompletion(form, REQUIRED);
      if (completion > 0) queueEvent({ eventType: 'form_abandon', formType: 'investment_plan', metadata: { completion, filledFields: getFilledFields(form), step }, duration: Math.round((Date.now() - startTime.current) / 1000) });
    }
    setStep(0); setForm({ goals: [], salaryRange: '', existingInvestments: '', debtObligations: '', riskAppetite: '', retirementAge: 60, expectedReturns: '', monthlySavings: '' });
    setErrors({}); setShowResult(false); setPlan(null); onClose();
  };

  const handleAdopt = () => {
    trackFormComplete();
    queueEvent({ eventType: 'form_submit', formType: 'investment_plan', duration: Math.round((Date.now() - startTime.current) / 1000), metadata: { plan: form.riskAppetite, goals: form.goals } });
    handleClose();
  };

  if (!isOpen) return null;
  const fmt = n => `₹${n.toLocaleString('en-IN')}`;

  return (
    <AnimatePresence>
      <motion.div variants={overlay} initial="hidden" animate="visible" exit="exit" className="fixed inset-0 z-50 flex items-end sm:items-center justify-center p-0 sm:p-4 bg-black/40 backdrop-blur-sm" onClick={handleClose}>
        <motion.div variants={modal} initial="hidden" animate="visible" exit="exit" className="relative w-full max-w-2xl bg-white rounded-2xl shadow-elevated overflow-hidden max-h-[90vh] flex flex-col" onClick={e => e.stopPropagation()}>

          {/* Header */}
          <div className="bg-gradient-to-r from-primary-700 via-primary-600 to-accent-600 px-4 sm:px-6 py-5 text-white">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-3"><Brain className="w-6 h-6" /><div><h2 className="text-lg font-bold">{showResult ? 'Your Personalized Plan' : planName || 'Investment Plan Wizard'}</h2><p className="text-white/70 text-sm mt-0.5">{showResult ? 'AI-powered recommendation' : STEPS[step]}</p></div></div>
              <button onClick={handleClose} className="p-2 rounded-lg hover:bg-white/20 transition-colors"><X className="w-5 h-5" /></button>
            </div>
            {!showResult && (
              <div className="flex gap-2 mt-4">
                {STEPS.map((s, i) => (<div key={i} className="flex-1"><div className={`h-1.5 rounded-full transition-all duration-300 ${i <= step ? 'bg-white' : 'bg-white/30'}`} /><p className={`text-[10px] mt-1 ${i <= step ? 'text-white' : 'text-white/50'}`}>{s}</p></div>))}
              </div>
            )}
          </div>

          {/* Body */}
          <div className="flex-1 overflow-y-auto px-4 sm:px-6 py-5">
            <AnimatePresence mode="wait">
              <motion.div key={step} initial={{ x: 20, opacity: 0 }} animate={{ x: 0, opacity: 1 }} exit={{ x: -20, opacity: 0 }} transition={{ duration: 0.2 }} className="space-y-5">

                {step === 0 && (<>
                  <div><p className="text-sm font-semibold text-surface-700 mb-3"><Target className="w-4 h-4 inline mr-1.5" />What are your financial goals?</p>
                    {errors.goals && <p className="text-xs text-red-500 mb-2">{errors.goals}</p>}
                    <div className="grid sm:grid-cols-2 gap-2">
                      {GOALS.map(g => (
                        <button key={g} onClick={() => toggleGoal(g)} className={`p-3 rounded-xl text-sm font-medium text-left transition-all border ${form.goals.includes(g) ? 'bg-primary-50 border-primary-300 text-primary-700 ring-1 ring-primary-200' : 'bg-white border-surface-200 text-surface-600 hover:border-surface-300'}`}>
                          {form.goals.includes(g) && <CheckCircle2 className="w-3.5 h-3.5 inline mr-1.5 text-primary-600" />}{g}
                        </button>
                      ))}
                    </div>
                  </div>
                </>)}

                {step === 1 && (<>
                  <div><label className="block text-sm font-medium text-surface-700 mb-1.5"><Wallet className="w-3.5 h-3.5 inline mr-1" />Annual Salary Range</label>
                    <select className="input-field" value={form.salaryRange} onChange={e => update('salaryRange', e.target.value)}>
                      <option value="">Select</option><option value="below-5l">Below ₹5 Lakh</option><option value="5-10l">₹5–10 Lakh</option><option value="10-25l">₹10–25 Lakh</option><option value="25-50l">₹25–50 Lakh</option><option value="50l+">Above ₹50 Lakh</option>
                    </select>{errors.salaryRange && <p className="text-xs text-red-500 mt-1">{errors.salaryRange}</p>}</div>
                  <div><label className="block text-sm font-medium text-surface-700 mb-1.5">Monthly Savings Capacity</label>
                    <select className="input-field" value={form.monthlySavings} onChange={e => update('monthlySavings', e.target.value)}>
                      <option value="">Select</option><option value="5000">₹5,000</option><option value="10000">₹10,000</option><option value="25000">₹25,000</option><option value="50000">₹50,000</option><option value="100000">₹1,00,000+</option>
                    </select>{errors.monthlySavings && <p className="text-xs text-red-500 mt-1">{errors.monthlySavings}</p>}</div>
                  <div><label className="block text-sm font-medium text-surface-700 mb-1.5">Existing Investments</label>
                    <select className="input-field" value={form.existingInvestments} onChange={e => update('existingInvestments', e.target.value)}>
                      <option value="">Select</option><option value="none">No existing investments</option><option value="below-5l">Below ₹5 Lakh</option><option value="5-25l">₹5–25 Lakh</option><option value="25l+">Above ₹25 Lakh</option>
                    </select></div>
                  <div><label className="block text-sm font-medium text-surface-700 mb-1.5">Monthly Debt/EMI Obligations</label>
                    <select className="input-field" value={form.debtObligations} onChange={e => update('debtObligations', e.target.value)}>
                      <option value="">Select</option><option value="none">No EMIs</option><option value="below-10k">Below ₹10,000</option><option value="10-30k">₹10,000–₹30,000</option><option value="30k+">Above ₹30,000</option>
                    </select></div>
                </>)}

                {step === 2 && (<>
                  <div><p className="text-sm font-semibold text-surface-700 mb-3"><Shield className="w-4 h-4 inline mr-1.5" />Risk Appetite</p>
                    {errors.riskAppetite && <p className="text-xs text-red-500 mb-2">{errors.riskAppetite}</p>}
                    <div className="space-y-3">
                      {[
                        { value: 'conservative', label: 'Conservative', desc: 'Capital protection, steady 8-10% returns', color: 'accent' },
                        { value: 'moderate', label: 'Moderate', desc: 'Balanced growth, 12-15% expected returns', color: 'primary' },
                        { value: 'aggressive', label: 'Aggressive', desc: 'Maximum growth, 15-20% potential returns', color: 'amber' },
                      ].map(r => (
                        <label key={r.value} className={`flex items-center gap-4 p-4 rounded-xl border cursor-pointer transition-all ${form.riskAppetite === r.value ? riskOptionClasses[r.value] : 'border-surface-100 hover:border-surface-200'}`}>
                          <input type="radio" name="risk" className="accent-primary-600 w-4 h-4" checked={form.riskAppetite === r.value} onChange={() => update('riskAppetite', r.value)} />
                          <div><p className="text-sm font-semibold text-surface-900">{r.label}</p><p className="text-xs text-surface-400">{r.desc}</p></div>
                        </label>
                      ))}
                    </div>
                  </div>
                  <div><label className="block text-sm font-medium text-surface-700 mb-2">Target Retirement Age: <span className="text-primary-600 font-bold">{form.retirementAge}</span></label>
                    <input type="range" min={40} max={70} value={form.retirementAge} onChange={e => update('retirementAge', Number(e.target.value))} className="w-full h-2 bg-surface-200 rounded-lg appearance-none cursor-pointer accent-primary-600" />
                    <div className="flex justify-between text-xs text-surface-400"><span>40</span><span>70</span></div>
                  </div>
                </>)}

                {step === 3 && plan && (<>
                  {/* AI Recommendation Card */}
                  <div className="bg-gradient-to-br from-primary-50 via-white to-accent-50 rounded-xl p-5 border border-primary-100">
                    <div className="flex items-center gap-2 mb-4"><Sparkles className="w-5 h-5 text-primary-600" /><h3 className="font-bold text-surface-900">AI Recommendation</h3></div>
                    <div className="grid sm:grid-cols-2 gap-4 mb-4">
                      <div className="text-center p-3 bg-white rounded-xl shadow-soft"><p className="text-[10px] uppercase text-surface-400">Risk Score</p><p className="text-2xl font-bold text-primary-600">{plan.riskScore}</p><p className="text-[10px] text-surface-400">/100</p></div>
                      <div className="text-center p-3 bg-white rounded-xl shadow-soft"><p className="text-[10px] uppercase text-surface-400">Projected Value</p><p className="text-lg font-bold text-accent-600">{fmt(plan.projectedValue)}</p><p className="text-[10px] text-surface-400">at {plan.expectedReturn}% p.a.</p></div>
                    </div>

                    {/* Allocation Chart */}
                    <div className="flex items-center gap-4">
                      <div className="w-32 h-32">
                        <ResponsiveContainer><RePieChart><Pie data={plan.allocation} dataKey="value" cx="50%" cy="50%" innerRadius={30} outerRadius={55} strokeWidth={2}>{plan.allocation.map((e, i) => <Cell key={i} fill={e.color} />)}</Pie><Tooltip /></RePieChart></ResponsiveContainer>
                      </div>
                      <div className="flex-1 space-y-1.5">
                        {plan.allocation.map((a, i) => (
                          <div key={i} className="flex items-center gap-2 text-xs"><div className="w-3 h-3 rounded-full" style={{ background: a.color }} /><span className="text-surface-600">{a.name}</span><span className="ml-auto font-semibold text-surface-900">{a.value}%</span></div>
                        ))}
                      </div>
                    </div>
                  </div>

                  {/* Recommendations */}
                  <div className="space-y-2">
                    <p className="text-sm font-semibold text-surface-700">Recommendations</p>
                    {plan.recommendations.map((r, i) => (
                      <div key={i} className="flex items-start gap-2 text-sm"><CheckCircle2 className="w-4 h-4 text-accent-500 mt-0.5 flex-shrink-0" /><span className="text-surface-600">{r}</span></div>
                    ))}
                  </div>
                </>)}
              </motion.div>
            </AnimatePresence>
          </div>

          {/* Footer */}
          <div className="px-4 sm:px-6 py-4 border-t border-surface-100 flex flex-col-reverse sm:flex-row gap-3 sm:items-center sm:justify-between bg-surface-50/50">
            <div>{step > 0 && <button onClick={prev} className="btn-secondary w-full sm:w-auto text-sm py-2 px-4 gap-1"><ChevronLeft className="w-4 h-4" />Back</button>}</div>
            {step < 3 ? (
              <button onClick={next} className="btn-primary w-full sm:w-auto text-sm py-2.5 px-6 gap-1">{step === 2 ? <><Sparkles className="w-4 h-4" />Generate Plan</> : <>Continue<ChevronRight className="w-4 h-4" /></>}</button>
            ) : (
              <button onClick={handleAdopt} className="btn-accent w-full sm:w-auto text-sm py-2.5 px-6 gap-1"><TrendingUp className="w-4 h-4" />Adopt This Plan</button>
            )}
          </div>
        </motion.div>
      </motion.div>
    </AnimatePresence>
  );
}
