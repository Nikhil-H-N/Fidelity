import { motion } from 'framer-motion';
import { useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { 
  CheckCircle2, XCircle, HelpCircle, 
  ArrowRight, ShieldCheck, Zap, 
  TrendingUp, Scale, Info
} from 'lucide-react';
import { usePageTracking } from '../hooks/useTracking';
import { queueEvent } from '../api/eventService';

const comparisonData = {
  categories: ['Returns', 'Risk Level', 'Lock-in', 'Tax Benefit', 'Ideal For'],
  plans: [
    {
      name: 'SIP (Mutual Fund)',
      values: ['12-15% p.a.', 'Moderate to High', 'None', 'Variable', 'Wealth Creation'],
      highlight: false,
    },
    {
      name: 'ELSS Tax Saver',
      values: ['14-16% p.a.', 'High', '3 Years', 'Up to ₹46,800', 'Tax Saving + Growth'],
      highlight: true,
    },
    {
      name: 'Fixed Deposit',
      values: ['6-7% p.a.', 'Zero/Low', 'Variable', 'None', 'Capital Safety'],
      highlight: false,
    }
  ]
};

export default function PlanComparison() {
  usePageTracking('plan-comparison');
  const navigate = useNavigate();

  useEffect(() => {
    queueEvent({
      eventType: 'comparison',
      page: '/plan-comparison',
      metadata: {
        plans: comparisonData.plans.map((plan) => plan.name),
        comparisonType: 'investment_plan',
      },
    });
  }, []);

  const choosePlan = (plan) => {
    queueEvent({
      eventType: 'checkout_start',
      page: '/plan-comparison',
      metadata: { planName: plan.name, source: 'comparison_table' },
    });
    navigate(`/checkout/${plan.highlight ? 'elss-tax-saver' : 'wealth-core'}`);
  };

  return (
    <div className="space-y-12 pb-24">
      <div className="max-w-3xl">
        <h1 className="text-4xl font-black text-surface-900 tracking-tight">
          Plan Comparison
        </h1>
        <p className="text-lg text-surface-600 mt-4 leading-relaxed">
          Side-by-side analysis to help you make data-driven investment decisions.
        </p>
      </div>

      <div className="overflow-x-auto pb-8">
        <div className="min-w-[800px]">
          <table className="w-full border-separate border-spacing-x-4 border-spacing-y-0">
            <thead>
              <tr>
                <th className="w-1/4 p-6 text-left">
                  <div className="flex items-center gap-2 text-surface-400 font-black text-xs uppercase tracking-widest">
                    <Scale className="w-4 h-4" /> Attributes
                  </div>
                </th>
                {comparisonData.plans.map(plan => (
                  <th key={plan.name} className="w-1/4 p-8 text-center align-bottom">
                    <div className={`p-6 rounded-[2rem] border ${plan.highlight ? 'bg-primary-600 text-white border-primary-500 shadow-xl shadow-primary-900/20' : 'bg-white border-surface-100 text-surface-900 shadow-sm'}`}>
                      <h3 className="text-xl font-black mb-2">{plan.name}</h3>
                      {plan.highlight && <span className="text-[10px] font-black bg-white/20 px-2 py-0.5 rounded-full uppercase">Most Efficient</span>}
                    </div>
                  </th>
                ))}
              </tr>
            </thead>
            <tbody>
              {comparisonData.categories.map((cat, catIdx) => (
                <tr key={cat}>
                  <td className="p-6">
                    <div className="flex items-center gap-2">
                      <span className="font-bold text-surface-700">{cat}</span>
                      <Info className="w-3.5 h-3.5 text-surface-300 cursor-help" />
                    </div>
                  </td>
                  {comparisonData.plans.map(plan => (
                    <td key={`${plan.name}-${cat}`} className="p-6 text-center">
                      <div className="p-4 rounded-2xl bg-surface-50 border border-surface-100 font-bold text-surface-800 text-sm">
                        {plan.values[catIdx]}
                      </div>
                    </td>
                  ))}
                </tr>
              ))}
              <tr>
                <td className="p-6"></td>
                {comparisonData.plans.map(plan => (
                  <td key={`${plan.name}-action`} className="p-6 text-center">
                    <button onClick={() => choosePlan(plan)} className={`w-full py-4 rounded-2xl font-black text-xs transition-all flex items-center justify-center gap-2 ${plan.highlight ? 'bg-primary-600 text-white hover:bg-primary-500' : 'bg-surface-900 text-white hover:bg-primary-600'}`}>
                      CHOOSE {plan.name.split(' ')[0].toUpperCase()} <ArrowRight className="w-4 h-4" />
                    </button>
                  </td>
                ))}
              </tr>
            </tbody>
          </table>
        </div>
      </div>

      <div className="grid md:grid-cols-2 gap-8">
        <div className="p-10 rounded-[2.5rem] bg-emerald-50 border border-emerald-100 flex items-start gap-6">
          <div className="w-12 h-12 rounded-2xl bg-emerald-600 text-white flex items-center justify-center shrink-0">
            <ShieldCheck className="w-6 h-6" />
          </div>
          <div>
            <h4 className="text-xl font-bold text-surface-900 mb-2">Safe & Regulated</h4>
            <p className="text-surface-600 leading-relaxed">
              All plans listed are SEBI regulated and managed by top-tier Asset Management Companies in India.
            </p>
          </div>
        </div>
        <div className="p-10 rounded-[2.5rem] bg-primary-50 border border-primary-100 flex items-start gap-6">
          <div className="w-12 h-12 rounded-2xl bg-primary-600 text-white flex items-center justify-center shrink-0">
            <Zap className="w-6 h-6" />
          </div>
          <div>
            <h4 className="text-xl font-bold text-surface-900 mb-2">Intent-Based Match</h4>
            <p className="text-surface-600 leading-relaxed">
              Our AI analyzes your browsing behavior to recommend the plan that best fits your risk-reward profile.
            </p>
          </div>
        </div>
      </div>
    </div>
  );
}
