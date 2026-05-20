import { motion } from 'framer-motion';
import { PiggyBank, Receipt, TrendingDown, ArrowRight, ShieldCheck, Calculator } from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import { useClickTracking, usePageTracking } from '../hooks/useTracking';
import { queueEvent } from '../api/eventService';

const sections = [
  {
    id: '80c',
    title: 'Section 80C Deductions',
    limit: '₹1.5 Lakhs',
    description: 'Invest in ELSS, PPF, LIC, and more to save up to ₹46,800 in taxes.',
    icon: Receipt,
    color: 'text-indigo-600',
    bg: 'bg-indigo-50'
  },
  {
    id: '80d',
    title: 'Health Insurance (80D)',
    limit: '₹25,000 - ₹50,000',
    description: 'Tax benefits on premiums paid for health insurance for self and parents.',
    icon: ShieldCheck,
    color: 'text-emerald-600',
    bg: 'bg-emerald-50'
  },
  {
    id: 'nps',
    title: 'NPS (Section 80CCD)',
    limit: 'Extra ₹50,000',
    description: 'Additional deduction over and above the 80C limit for NPS contributions.',
    icon: PiggyBank,
    color: 'text-amber-600',
    bg: 'bg-amber-50'
  },
  {
    id: 'hra',
    title: 'House Rent Allowance',
    limit: 'Exemption based on rent',
    description: 'Exemption for salaried employees living in rented accommodation.',
    icon: Calculator,
    color: 'text-rose-600',
    bg: 'bg-rose-50'
  }
];

export default function TaxSaving() {
  usePageTracking('tax-saving-plans');
  const navigate = useNavigate();
  const trackClick = useClickTracking();

  const viewScheme = (section, event) => {
    trackClick('tax_scheme_view', { page: 'tax-saving-plans', productId: section.id, productName: section.title }, event);
    queueEvent({
      eventType: 'product_view',
      page: '/tax-saving',
      metadata: { productId: section.id, productName: section.title, category: 'Tax Saving' },
    });
    navigate(section.id === '80c' ? '/know-more/elss-tax-saver' : '/plan-comparison');
  };

  const compareRegimes = (event) => {
    trackClick('compare_tax_regimes', { page: 'tax-saving-plans' }, event);
    queueEvent({
      eventType: 'comparison',
      page: '/tax-saving',
      metadata: { comparisonType: 'tax_regime' },
    });
    navigate('/plan-comparison');
  };

  return (
    <div className="space-y-12 pb-20">
      <div className="max-w-3xl">
        <h1 className="text-4xl font-black text-surface-900 tracking-tight">
          Tax Saving Plans
        </h1>
        <p className="text-lg text-surface-600 mt-4 leading-relaxed">
          Maximize your take-home salary by investing in tax-efficient instruments. 
          Save up to ₹1.5 Lakhs and more under various sections of the Income Tax Act.
        </p>
      </div>

      <div className="grid md:grid-cols-2 gap-8">
        {sections.map((section, idx) => (
          <motion.div
            key={section.id}
            initial={{ opacity: 0, x: idx % 2 === 0 ? -20 : 20 }}
            animate={{ opacity: 1, x: 0 }}
            transition={{ delay: idx * 0.1 }}
            className="bg-white rounded-[2.5rem] p-10 border border-surface-100 shadow-card hover:border-primary-200 transition-all flex flex-col h-full"
          >
            <div className={`w-16 h-16 rounded-2xl ${section.bg} ${section.color} flex items-center justify-center mb-8`}>
              <section.icon className="w-9 h-9" />
            </div>
            
            <div className="flex-1">
              <div className="flex items-center justify-between mb-4">
                <h3 className="text-2xl font-bold text-surface-900">{section.title}</h3>
                <span className="text-xs font-black px-3 py-1 bg-surface-100 text-surface-600 rounded-full uppercase">Limit: {section.limit}</span>
              </div>
              <p className="text-surface-500 leading-relaxed mb-8">
                {section.description}
              </p>
            </div>

            <button onClick={(event) => viewScheme(section, event)} className="flex items-center gap-3 text-primary-600 font-black text-sm group">
              VIEW TAX SAVING SCHEMES <ArrowRight className="w-5 h-5 group-hover:translate-x-1 transition-transform" />
            </button>
          </motion.div>
        ))}
      </div>

      <div className="bg-surface-900 rounded-[3rem] p-12 text-white flex flex-col md:flex-row items-center gap-10">
        <div className="flex-1">
          <div className="inline-flex items-center gap-2 px-4 py-1.5 bg-white/10 rounded-full text-xs font-bold text-primary-300 mb-6 tracking-widest uppercase">
            Tax Efficiency Analysis
          </div>
          <h2 className="text-3xl font-bold mb-6">Are you in the Old or New Tax Regime?</h2>
          <p className="text-surface-400 leading-relaxed mb-8 max-w-xl">
            Comparing regimes is crucial for maximum savings. Our tax engine analyzes your income and investments to recommend the most beneficial regime for you.
          </p>
          <button onClick={compareRegimes} className="px-10 py-5 bg-primary-600 text-white font-black rounded-2xl hover:bg-primary-500 transition-all shadow-xl shadow-primary-900/40">
            Compare Regimes Now
          </button>
        </div>
        <div className="w-full md:w-80 h-80 bg-gradient-to-br from-indigo-500/20 to-primary-600/20 rounded-[2.5rem] border border-white/10 flex items-center justify-center backdrop-blur-sm">
          <TrendingDown className="w-32 h-32 text-primary-400 opacity-50" />
        </div>
      </div>
    </div>
  );
}
