import { motion } from 'framer-motion';
import { Check, ArrowRight, Sparkles } from 'lucide-react';
import { useState } from 'react';
import { investmentPlans } from '../data/mockData';
import { usePageTracking, useClickTracking } from '../hooks/useTracking';
import InvestmentPlanWizard from '../components/modals/InvestmentPlanWizard';

export default function InvestmentPlans() {
  usePageTracking('investment-plans');
  const trackClick = useClickTracking();
  const [wizard, setWizard] = useState({ open: false, planName: '' });

  const openWizard = (plan, e) => {
    trackClick('get_started', { plan: plan.name, page: 'investment-plans' }, e);
    setWizard({ open: true, planName: plan.name });
  };

  return (
    <div className="space-y-6">
      <div className="text-center max-w-2xl mx-auto">
        <h1 className="text-2xl font-bold text-surface-900">Investment Plans</h1>
        <p className="text-surface-500 text-sm mt-2">Choose a plan that matches your risk appetite and financial goals</p>
      </div>

      <div className="grid sm:grid-cols-2 lg:grid-cols-4 gap-6">
        {investmentPlans.map((plan, i) => (
          <motion.div key={plan.id} initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: i * 0.1 }}
            className={`bg-white rounded-2xl p-6 shadow-card border ${i === 0 ? 'border-primary-200 ring-2 ring-primary-100' : 'border-surface-100'} card-hover relative`}>
            {i === 0 && (
              <div className="absolute -top-3 left-1/2 -translate-x-1/2 px-3 py-1 bg-primary-600 text-white text-xs font-semibold rounded-full flex items-center gap-1">
                <Sparkles className="w-3 h-3" /> Popular
              </div>
            )}
            <h3 className="text-lg font-bold text-surface-900 mb-2">{plan.name}</h3>
            <p className="text-sm text-surface-500 mb-4 leading-relaxed">{plan.description}</p>
            <div className="space-y-3 mb-6">
              <div className="flex justify-between text-sm"><span className="text-surface-500">Min. Investment</span><span className="font-semibold text-surface-900">₹{plan.minInvestment.toLocaleString('en-IN')}</span></div>
              <div className="flex justify-between text-sm"><span className="text-surface-500">Expected Returns</span><span className="font-semibold text-accent-600">{plan.expectedReturns}</span></div>
              <div className="flex justify-between text-sm"><span className="text-surface-500">Horizon</span><span className="font-semibold text-surface-900">{plan.horizon}</span></div>
              <div className="flex justify-between text-sm"><span className="text-surface-500">Risk Level</span><span className="font-semibold text-amber-600">{plan.risk}</span></div>
            </div>
            <div className="space-y-2 mb-6">
              {plan.features.map(f => (
                <div key={f} className="flex items-center gap-2 text-sm text-surface-600">
                  <Check className="w-4 h-4 text-accent-500 flex-shrink-0" />{f}
                </div>
              ))}
            </div>
            <button onClick={(e) => openWizard(plan, e)} className={`w-full py-3 rounded-xl font-semibold text-sm flex items-center justify-center gap-2 transition-all ${
              i === 0 ? 'btn-primary' : 'btn-secondary'
            }`}>
              Get Started <ArrowRight className="w-4 h-4" />
            </button>
          </motion.div>
        ))}
      </div>

      {/* Investment Plan Wizard Modal */}
      <InvestmentPlanWizard
        isOpen={wizard.open}
        onClose={() => setWizard({ open: false, planName: '' })}
        planName={wizard.planName}
      />
    </div>
  );
}
