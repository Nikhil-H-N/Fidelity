import { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Target, Plus, Home, GraduationCap, Plane, Shield, Umbrella, Heart, Car, Compass, X, ArrowRight, ArrowLeft, CheckCircle2, AlertCircle, TrendingUp } from 'lucide-react';
import { goals as mockGoals } from '../data/mockData';
import { formatCurrency } from '../utils/formatters';
import { ProgressBar } from '../components/common/UIComponents';
import { usePageTracking } from '../hooks/useTracking';

const iconMap = { Home, GraduationCap, Palmtree: Umbrella, Shield, Plane, Heart, Car, Compass };

const goalTypes = [
  { id: 'home', label: 'Buy a Home', icon: Home, color: 'text-blue-600', bg: 'bg-blue-50' },
  { id: 'education', label: 'Education', icon: GraduationCap, color: 'text-purple-600', bg: 'bg-purple-50' },
  { id: 'travel', label: 'Travel', icon: Plane, color: 'text-cyan-600', bg: 'bg-cyan-50' },
  { id: 'retirement', label: 'Retirement', icon: Shield, color: 'text-emerald-600', bg: 'bg-emerald-50' },
  { id: 'wedding', label: 'Wedding', icon: Heart, color: 'text-rose-600', bg: 'bg-rose-50' },
  { id: 'car', label: 'Buy a Car', icon: Car, color: 'text-amber-600', bg: 'bg-amber-50' },
  { id: 'emergency', label: 'Emergency Fund', icon: Umbrella, color: 'text-indigo-600', bg: 'bg-indigo-50' },
  { id: 'other', label: 'Other Goal', icon: Compass, color: 'text-slate-600', bg: 'bg-slate-50' },
];

const STORAGE_KEY = 'fw_custom_goals';

function loadCustomGoals() {
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    return raw ? JSON.parse(raw) : [];
  } catch { return []; }
}

function saveCustomGoals(goals) {
  localStorage.setItem(STORAGE_KEY, JSON.stringify(goals));
}

const stepLabels = ['Type', 'Details', 'Risk', 'Summary', 'Save'];

export default function GoalPlanning() {
  usePageTracking('goal-planning');
  const [showWizard, setShowWizard] = useState(false);
  const [step, setStep] = useState(0);
  const [customGoals, setCustomGoals] = useState(loadCustomGoals);
  const [wizardData, setWizardData] = useState({
    type: null,
    name: '',
    targetAmount: '',
    currentAmount: '',
    deadline: '',
    riskLevel: 'moderate',
    monthlySIP: '',
  });

  // All goals = mock + custom
  const allGoals = [
    ...mockGoals,
    ...customGoals.map((g, i) => ({
      id: `custom-${i}`,
      name: g.name,
      icon: goalTypes.find(t => t.id === g.type)?.label || 'Target',
      target: Number(g.targetAmount),
      current: Number(g.currentAmount) || 0,
      deadline: g.deadline,
      onTrack: true,
      riskLevel: g.riskLevel,
      monthlySIP: g.monthlySIP,
      isCustom: true,
      type: g.type,
    })),
  ];

  const openWizard = () => {
    setWizardData({ type: null, name: '', targetAmount: '', currentAmount: '', deadline: '', riskLevel: 'moderate', monthlySIP: '' });
    setStep(0);
    setShowWizard(true);
  };

  const closeWizard = () => setShowWizard(false);

  const nextStep = () => setStep(s => Math.min(s + 1, 4));
  const prevStep = () => setStep(s => Math.max(s - 1, 0));

  const canProceed = () => {
    if (step === 0) return !!wizardData.type;
    if (step === 1) return wizardData.name && wizardData.targetAmount && wizardData.deadline;
    if (step === 2) return !!wizardData.riskLevel;
    return true;
  };

  const handleSaveGoal = () => {
    const updated = [...customGoals, { ...wizardData }];
    setCustomGoals(updated);
    saveCustomGoals(updated);
    closeWizard();
  };

  const deleteCustomGoal = (index) => {
    const updated = customGoals.filter((_, i) => i !== index);
    setCustomGoals(updated);
    saveCustomGoals(updated);
  };

  // Calculate suggested monthly SIP
  const suggestedSIP = (() => {
    const target = Number(wizardData.targetAmount) || 0;
    const current = Number(wizardData.currentAmount) || 0;
    const deadlineDate = new Date(wizardData.deadline);
    const months = Math.max(1, Math.round((deadlineDate - new Date()) / (1000 * 60 * 60 * 24 * 30)));
    const remaining = target - current;
    if (remaining <= 0) return 0;
    // Assuming ~12% annual returns for moderate risk
    const rate = wizardData.riskLevel === 'aggressive' ? 0.15 : wizardData.riskLevel === 'conservative' ? 0.08 : 0.12;
    const monthlyRate = rate / 12;
    if (monthlyRate === 0) return Math.round(remaining / months);
    const sip = remaining * monthlyRate / (Math.pow(1 + monthlyRate, months) - 1);
    return Math.round(sip);
  })();

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div><h1 className="text-2xl font-bold text-surface-900">Goal Planning</h1><p className="text-surface-500 text-sm mt-1">Track and manage your financial goals</p></div>
        <button onClick={openWizard} className="btn-primary text-sm py-2.5 px-5 gap-2"><Plus className="w-4 h-4" /> Add Goal</button>
      </div>

      <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-6">
        {allGoals.map((goal, i) => {
          const typeInfo = goal.isCustom ? goalTypes.find(t => t.id === goal.type) : null;
          const Icon = goal.isCustom ? (typeInfo?.icon || Target) : (iconMap[goal.icon] || Target);
          const pct = Math.round((goal.current / goal.target) * 100);
          return (
            <motion.div key={goal.id} initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: i * 0.1 }}
              className="bg-white rounded-2xl p-6 shadow-card border border-surface-100 card-hover relative group">
              {goal.isCustom && (
                <button onClick={() => deleteCustomGoal(customGoals.findIndex(g => g.name === goal.name))}
                  className="absolute top-3 right-3 p-1 rounded-lg bg-red-50 text-red-400 opacity-0 group-hover:opacity-100 transition-opacity hover:bg-red-100">
                  <X className="w-3.5 h-3.5" />
                </button>
              )}
              <div className="flex items-center justify-between mb-4">
                <div className={`w-12 h-12 rounded-xl ${goal.isCustom ? (typeInfo?.bg || 'bg-surface-50') : (goal.onTrack ? 'bg-accent-50' : 'bg-amber-50')} flex items-center justify-center`}>
                  <Icon className={`w-6 h-6 ${goal.isCustom ? (typeInfo?.color || 'text-surface-600') : (goal.onTrack ? 'text-accent-600' : 'text-amber-600')}`} />
                </div>
                <span className={`badge ${goal.onTrack !== false ? 'badge-success' : 'badge-warning'}`}>{goal.onTrack !== false ? 'On Track' : 'Behind'}</span>
              </div>
              <h3 className="font-bold text-surface-900 mb-1">{goal.name}</h3>
              <p className="text-sm text-surface-500 mb-4">{goal.deadline ? `Target: ${new Date(goal.deadline).toLocaleDateString('en-IN', { month: 'short', year: 'numeric' })}` : ''}</p>
              <div className="space-y-2">
                <div className="flex justify-between text-sm"><span className="text-surface-500">Progress</span><span className="font-semibold text-surface-900">{pct}%</span></div>
                <ProgressBar value={pct} />
                <div className="flex justify-between text-xs text-surface-400">
                  <span>{formatCurrency(goal.current)}</span>
                  <span>{formatCurrency(goal.target)}</span>
                </div>
              </div>
              {goal.monthlySIP && (
                <div className="mt-3 pt-3 border-t border-surface-100 text-xs text-surface-500">
                  Monthly SIP: <span className="font-semibold text-surface-700">{formatCurrency(Number(goal.monthlySIP))}</span>
                </div>
              )}
            </motion.div>
          );
        })}
      </div>

      {/* ─── Wizard Modal ─── */}
      <AnimatePresence>
        {showWizard && (
          <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
            className="fixed inset-0 z-[100] bg-black/40 backdrop-blur-sm flex items-center justify-center p-4"
            onClick={(e) => e.target === e.currentTarget && closeWizard()}>
            <motion.div initial={{ scale: 0.9, opacity: 0 }} animate={{ scale: 1, opacity: 1 }} exit={{ scale: 0.9, opacity: 0 }}
              className="bg-white rounded-3xl shadow-elevated w-full max-w-lg overflow-hidden">
              
              {/* Header */}
              <div className="flex items-center justify-between px-6 py-4 border-b border-surface-100">
                <h2 className="text-lg font-bold text-surface-900">Create a Goal</h2>
                <button onClick={closeWizard} className="p-2 rounded-lg hover:bg-surface-50"><X className="w-5 h-5 text-surface-400" /></button>
              </div>

              {/* Step indicator */}
              <div className="px-6 pt-4">
                <div className="flex items-center gap-1">
                  {stepLabels.map((label, i) => (
                    <div key={label} className="flex-1">
                      <div className={`h-1.5 rounded-full transition-colors ${i <= step ? 'bg-primary-500' : 'bg-surface-200'}`} />
                      <p className={`text-[10px] mt-1 font-medium ${i <= step ? 'text-primary-600' : 'text-surface-400'}`}>{label}</p>
                    </div>
                  ))}
                </div>
              </div>

              {/* Step Content */}
              <div className="px-6 py-6 min-h-[280px]">
                <AnimatePresence mode="wait">
                  {step === 0 && (
                    <motion.div key="step0" initial={{ opacity: 0, x: 20 }} animate={{ opacity: 1, x: 0 }} exit={{ opacity: 0, x: -20 }}>
                      <p className="text-sm text-surface-600 mb-4">What are you saving for?</p>
                      <div className="grid grid-cols-2 gap-3">
                        {goalTypes.map(type => (
                          <button key={type.id} onClick={() => setWizardData(d => ({ ...d, type: type.id, name: type.label }))}
                            className={`flex items-center gap-3 p-3 rounded-xl border-2 transition-all text-left ${
                              wizardData.type === type.id ? 'border-primary-500 bg-primary-50' : 'border-surface-200 hover:border-surface-300'
                            }`}>
                            <div className={`w-10 h-10 rounded-lg ${type.bg} ${type.color} flex items-center justify-center`}>
                              <type.icon className="w-5 h-5" />
                            </div>
                            <span className="text-sm font-medium text-surface-900">{type.label}</span>
                          </button>
                        ))}
                      </div>
                    </motion.div>
                  )}

                  {step === 1 && (
                    <motion.div key="step1" initial={{ opacity: 0, x: 20 }} animate={{ opacity: 1, x: 0 }} exit={{ opacity: 0, x: -20 }} className="space-y-4">
                      <div>
                        <label className="block text-sm font-medium text-surface-700 mb-1.5">Goal Name</label>
                        <input type="text" className="input-field" value={wizardData.name} onChange={e => setWizardData(d => ({ ...d, name: e.target.value }))} placeholder="e.g. Dream House" />
                      </div>
                      <div className="grid grid-cols-2 gap-3">
                        <div>
                          <label className="block text-sm font-medium text-surface-700 mb-1.5">Target Amount (₹)</label>
                          <input type="number" className="input-field" value={wizardData.targetAmount} onChange={e => setWizardData(d => ({ ...d, targetAmount: e.target.value }))} placeholder="50,00,000" />
                        </div>
                        <div>
                          <label className="block text-sm font-medium text-surface-700 mb-1.5">Already Saved (₹)</label>
                          <input type="number" className="input-field" value={wizardData.currentAmount} onChange={e => setWizardData(d => ({ ...d, currentAmount: e.target.value }))} placeholder="0" />
                        </div>
                      </div>
                      <div className="grid grid-cols-2 gap-3">
                        <div>
                          <label className="block text-sm font-medium text-surface-700 mb-1.5">Target Date</label>
                          <input type="date" className="input-field" value={wizardData.deadline} onChange={e => setWizardData(d => ({ ...d, deadline: e.target.value }))} />
                        </div>
                        <div>
                          <label className="block text-sm font-medium text-surface-700 mb-1.5">Monthly SIP (₹)</label>
                          <input type="number" className="input-field" value={wizardData.monthlySip || ''} onChange={e => setWizardData(d => ({ ...d, monthlySip: e.target.value }))} placeholder="e.g. 5000" />
                        </div>
                      </div>
                    </motion.div>
                  )}

                  {step === 2 && (
                    <motion.div key="step2" initial={{ opacity: 0, x: 20 }} animate={{ opacity: 1, x: 0 }} exit={{ opacity: 0, x: -20 }}>
                      <p className="text-sm text-surface-600 mb-4">Select your risk appetite for this goal</p>
                      <div className="space-y-3">
                        {[
                          { id: 'conservative', label: 'Conservative', desc: 'Lower returns, lower risk (8% p.a.)', color: 'text-blue-600', bg: 'bg-blue-50' },
                          { id: 'moderate', label: 'Moderate', desc: 'Balanced returns and risk (12% p.a.)', color: 'text-emerald-600', bg: 'bg-emerald-50' },
                          { id: 'aggressive', label: 'Aggressive', desc: 'Higher returns, higher risk (15% p.a.)', color: 'text-red-600', bg: 'bg-red-50' },
                        ].map(risk => (
                          <button key={risk.id} onClick={() => setWizardData(d => ({ ...d, riskLevel: risk.id }))}
                            className={`w-full flex items-center gap-4 p-4 rounded-xl border-2 transition-all text-left ${
                              wizardData.riskLevel === risk.id ? 'border-primary-500 bg-primary-50' : 'border-surface-200 hover:border-surface-300'
                            }`}>
                            <div className={`w-10 h-10 rounded-lg ${risk.bg} ${risk.color} flex items-center justify-center`}>
                              {wizardData.riskLevel === risk.id ? <CheckCircle2 className="w-5 h-5" /> : <AlertCircle className="w-5 h-5" />}
                            </div>
                            <div>
                              <p className="font-semibold text-surface-900">{risk.label}</p>
                              <p className="text-xs text-surface-500">{risk.desc}</p>
                            </div>
                          </button>
                        ))}
                      </div>
                    </motion.div>
                  )}

                  {step === 3 && (
                    <motion.div key="step3" initial={{ opacity: 0, x: 20 }} animate={{ opacity: 1, x: 0 }} exit={{ opacity: 0, x: -20 }}>
                      <p className="text-sm text-surface-600 mb-4">Here's your goal summary</p>
                      <div className="bg-surface-50 rounded-2xl p-5 space-y-3">
                        <div className="flex justify-between"><span className="text-sm text-surface-500">Goal</span><span className="text-sm font-semibold text-surface-900">{wizardData.name}</span></div>
                        <div className="flex justify-between"><span className="text-sm text-surface-500">Target</span><span className="text-sm font-semibold text-surface-900">{formatCurrency(Number(wizardData.targetAmount))}</span></div>
                        <div className="flex justify-between"><span className="text-sm text-surface-500">Already Saved</span><span className="text-sm font-semibold text-surface-900">{formatCurrency(Number(wizardData.currentAmount) || 0)}</span></div>
                        <div className="flex justify-between"><span className="text-sm text-surface-500">Deadline</span><span className="text-sm font-semibold text-surface-900">{new Date(wizardData.deadline).toLocaleDateString('en-IN', { month: 'long', year: 'numeric' })}</span></div>
                        <div className="flex justify-between"><span className="text-sm text-surface-500">Risk Level</span><span className="text-sm font-semibold text-surface-900 capitalize">{wizardData.riskLevel}</span></div>
                        <div className="border-t border-surface-200 pt-3 mt-3 flex justify-between items-center">
                          <span className="text-sm font-medium text-primary-600 flex items-center gap-1"><TrendingUp className="w-4 h-4" /> Suggested Monthly SIP</span>
                          <span className="text-lg font-black text-primary-600">{formatCurrency(suggestedSIP)}</span>
                        </div>
                      </div>
                    </motion.div>
                  )}

                  {step === 4 && (
                    <motion.div key="step4" initial={{ opacity: 0, x: 20 }} animate={{ opacity: 1, x: 0 }} exit={{ opacity: 0, x: -20 }} className="space-y-4">
                      <div>
                        <label className="block text-sm font-medium text-surface-700 mb-1.5">Monthly SIP Amount (₹)</label>
                        <input type="number" className="input-field" value={wizardData.monthlySIP || suggestedSIP} onChange={e => setWizardData(d => ({ ...d, monthlySIP: e.target.value }))} />
                        <p className="text-xs text-surface-400 mt-1">Suggested: {formatCurrency(suggestedSIP)}/month</p>
                      </div>
                      <div className="bg-emerald-50 rounded-xl p-4 flex items-center gap-3">
                        <CheckCircle2 className="w-6 h-6 text-emerald-600 shrink-0" />
                        <p className="text-sm text-emerald-800">Your goal is ready! Click "Save Goal" to add it to your dashboard.</p>
                      </div>
                    </motion.div>
                  )}
                </AnimatePresence>
              </div>

              {/* Footer */}
              <div className="flex items-center justify-between px-6 py-4 border-t border-surface-100">
                <button onClick={step === 0 ? closeWizard : prevStep}
                  className="flex items-center gap-2 text-sm font-medium text-surface-600 hover:text-surface-900 transition-colors">
                  <ArrowLeft className="w-4 h-4" /> {step === 0 ? 'Cancel' : 'Back'}
                </button>
                {step < 4 ? (
                  <button onClick={nextStep} disabled={!canProceed()}
                    className={`flex items-center gap-2 text-sm font-medium py-2 px-5 rounded-xl transition-all ${
                      canProceed() ? 'btn-primary' : 'bg-surface-200 text-surface-400 cursor-not-allowed'
                    }`}>
                    Next <ArrowRight className="w-4 h-4" />
                  </button>
                ) : (
                  <button onClick={handleSaveGoal} className="btn-primary text-sm py-2 px-5 gap-2">
                    <CheckCircle2 className="w-4 h-4" /> Save Goal
                  </button>
                )}
              </div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}
