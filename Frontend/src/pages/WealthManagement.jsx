import { motion } from 'framer-motion';
import { Landmark, TrendingUp, Gem, PieChart, ArrowRight, UserCheck, Star } from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import { useClickTracking, usePageTracking } from '../hooks/useTracking';
import { queueEvent } from '../api/eventService';

const tiers = [
  {
    name: 'Wealth Core',
    id: 'wealth-core',
    minInvest: '₹5 Lakhs',
    description: 'Perfect for growing professionals seeking structured wealth creation.',
    icon: Star,
    color: 'text-primary-500',
    features: ['Personalized Portfolio', 'Quarterly Review', 'Tax Optimization']
  },
  {
    name: 'Wealth Elite',
    id: 'wealth-elite',
    minInvest: '₹25 Lakhs',
    description: 'Advanced strategies for high-net-worth individuals.',
    icon: Gem,
    color: 'text-indigo-500',
    features: ['Dedicated Advisor', 'Exclusive Alternative Assets', 'Estate Planning']
  },
  {
    name: 'Wealth Prime',
    id: 'wealth-prime',
    minInvest: '₹1 Crore+',
    description: 'Family office services and complex asset management.',
    icon: Landmark,
    color: 'text-amber-500',
    features: ['Family Office Support', 'Global Asset Exposure', 'Bespoke Concierge']
  }
];

export default function WealthManagement() {
  usePageTracking('wealth-management');
  const navigate = useNavigate();
  const trackClick = useClickTracking();

  const startTier = (tier, event) => {
    trackClick('wealth_tier_start', { page: 'wealth-management', productId: tier.id, productName: tier.name }, event);
    queueEvent({
      eventType: 'product_view',
      page: '/wealth-management',
      metadata: { productId: tier.id, productName: tier.name, category: 'Wealth Management' },
    });
    navigate(tier.id === 'wealth-core' ? '/know-more/wealth-core' : `/checkout/${tier.id}`);
  };

  return (
    <div className="space-y-12 pb-20">
      <div className="text-center max-w-4xl mx-auto space-y-4">
        <div className="inline-flex items-center gap-2 px-4 py-1.5 bg-primary-50 rounded-full text-xs font-black text-primary-600 tracking-widest uppercase">
          Private Client Services
        </div>
        <h1 className="text-5xl font-black text-surface-900 tracking-tight">
          Wealth Management
        </h1>
        <p className="text-xl text-surface-600 leading-relaxed max-w-2xl mx-auto">
          Elevate your financial future with expert-led strategies and personalized 
          asset allocation designed for your unique legacy.
        </p>
      </div>

      <div className="grid lg:grid-cols-3 gap-8">
        {tiers.map((tier, idx) => (
          <motion.div
            key={tier.name}
            initial={{ opacity: 0, y: 30 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: idx * 0.15 }}
            className={`relative overflow-hidden bg-white rounded-[3rem] p-10 border border-surface-100 shadow-xl shadow-surface-200/50 hover:shadow-primary-900/10 transition-all flex flex-col h-full group`}
          >
            <div className={`w-16 h-16 rounded-3xl bg-surface-50 ${tier.color} flex items-center justify-center mb-8 group-hover:scale-110 transition-transform`}>
              <tier.icon className="w-9 h-9" />
            </div>
            
            <h3 className="text-3xl font-bold text-surface-900 mb-4">{tier.name}</h3>
            <div className="flex items-center gap-2 text-primary-600 font-bold text-sm mb-6 bg-primary-50 w-fit px-3 py-1 rounded-lg">
              Min. Invest: {tier.minInvest}
            </div>
            <p className="text-surface-500 mb-8 leading-relaxed">
              {tier.description}
            </p>

            <div className="flex-1 space-y-4 mb-10">
              {tier.features.map(f => (
                <div key={f} className="flex items-center gap-3 text-sm font-bold text-surface-800">
                  <div className="w-1.5 h-1.5 rounded-full bg-primary-500" />
                  {f}
                </div>
              ))}
            </div>

            <button onClick={(event) => startTier(tier, event)} className="w-full py-5 bg-surface-900 hover:bg-primary-600 text-white font-black rounded-2xl transition-all shadow-xl shadow-surface-900/20">
              Get Started
            </button>
          </motion.div>
        ))}
      </div>

      <div className="grid md:grid-cols-2 gap-8 mt-20">
        <div className="p-10 rounded-[2.5rem] bg-indigo-600 text-white relative overflow-hidden group">
          <TrendingUp className="absolute -right-6 -bottom-6 w-48 h-48 opacity-10 group-hover:scale-110 transition-transform" />
          <h3 className="text-2xl font-bold mb-4">Tactical Asset Allocation</h3>
          <p className="text-indigo-100 mb-8 leading-relaxed">
            We actively monitor global markets to adjust your portfolio exposure, 
            capitalizing on opportunities while managing downside risk.
          </p>
          <button className="flex items-center gap-2 text-sm font-black text-white hover:gap-4 transition-all uppercase">
            Learn More <ArrowRight className="w-4 h-4" />
          </button>
        </div>
        <div className="p-10 rounded-[2.5rem] bg-surface-50 border border-surface-100 text-surface-900 relative overflow-hidden group">
          <UserCheck className="absolute -right-6 -bottom-6 w-48 h-48 text-surface-200/50 group-hover:scale-110 transition-transform" />
          <h3 className="text-2xl font-bold mb-4">Dedicated Wealth Advisor</h3>
          <p className="text-surface-500 mb-8 leading-relaxed">
            Your personal advisor acts as a financial quarterback, coordinating 
            investment, tax, and estate planning in one cohesive strategy.
          </p>
          <button className="flex items-center gap-2 text-sm font-black text-primary-600 hover:gap-4 transition-all uppercase">
            Meet the Team <ArrowRight className="w-4 h-4" />
          </button>
        </div>
      </div>
    </div>
  );
}
