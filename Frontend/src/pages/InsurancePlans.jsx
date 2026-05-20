import { motion } from 'framer-motion';
import { Shield, CheckCircle2, ArrowRight, Umbrella, Heart, Car, Home } from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import { useClickTracking, usePageTracking } from '../hooks/useTracking';
import { queueEvent } from '../api/eventService';

const plans = [
  {
    title: 'Term Life Insurance',
    id: 'term-life',
    description: 'High cover at affordable premiums to secure your family\'s future.',
    icon: Heart,
    color: 'text-rose-500',
    bg: 'bg-rose-50',
    features: ['Life Cover up to ₹1 Cr', 'Flexible Premium Terms', 'Critical Illness Cover']
  },
  {
    title: 'Health Insurance',
    id: 'health-insurance',
    description: 'Comprehensive medical coverage for you and your loved ones.',
    icon: Umbrella,
    color: 'text-blue-500',
    bg: 'bg-blue-50',
    features: ['Cashless Hospitalization', 'No Claim Bonus', 'Pre & Post Hospitalization']
  },
  {
    title: 'Motor Insurance',
    id: 'motor-insurance',
    description: 'Protect your vehicle against accidents, theft, and natural disasters.',
    icon: Car,
    color: 'text-amber-500',
    bg: 'bg-amber-50',
    features: ['Zero Depreciation', '24/7 Roadside Assistance', 'Quick Claim Settlement']
  },
  {
    title: 'Home Insurance',
    id: 'home-insurance',
    description: 'Safeguard your most valuable asset against unforeseen events.',
    icon: Home,
    color: 'text-emerald-500',
    bg: 'bg-emerald-50',
    features: ['Fire & Burglary Cover', 'Natural Calamity Protection', 'Content Insurance']
  }
];

export default function InsurancePlans() {
  usePageTracking('insurance-plans');
  const navigate = useNavigate();
  const trackClick = useClickTracking();

  const explorePlan = (plan, event) => {
    trackClick('know_more_insurance', { page: 'insurance-plans', productId: plan.id, productName: plan.title }, event);
    queueEvent({
      eventType: 'product_view',
      page: '/insurance-plans',
      metadata: { productId: plan.id, productName: plan.title, category: 'Insurance' },
    });
    navigate(`/know-more/${plan.id}`);
  };

  const contactAdvisor = (event) => {
    trackClick('contact_advisor', { page: 'insurance-plans' }, event);
    queueEvent({
      eventType: 'contact_advisor',
      page: '/insurance-plans',
      metadata: { topic: 'insurance' },
    });
  };

  return (
    <div className="space-y-10 pb-20">
      <div className="max-w-3xl">
        <h1 className="text-4xl font-black text-surface-900 tracking-tight">
          Insurance Plans
        </h1>
        <p className="text-lg text-surface-600 mt-4 leading-relaxed">
          Comprehensive protection for everything that matters. Choose from our range of 
          tailored insurance products designed to provide peace of mind.
        </p>
      </div>

      <div className="grid md:grid-cols-2 gap-6">
        {plans.map((plan, idx) => (
          <motion.div
            key={plan.title}
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: idx * 0.1 }}
            className="group bg-white rounded-3xl p-8 border border-surface-100 shadow-sm hover:shadow-xl hover:shadow-primary-900/5 transition-all"
          >
            <div className={`w-14 h-14 rounded-2xl ${plan.bg} ${plan.color} flex items-center justify-center mb-6 group-hover:scale-110 transition-transform`}>
              <plan.icon className="w-8 h-8" />
            </div>
            <h3 className="text-2xl font-bold text-surface-900 mb-3">{plan.title}</h3>
            <p className="text-surface-500 mb-6 leading-relaxed">{plan.description}</p>
            
            <ul className="space-y-3 mb-8">
              {plan.features.map(feature => (
                <li key={feature} className="flex items-center gap-3 text-sm font-medium text-surface-700">
                  <CheckCircle2 className="w-4 h-4 text-emerald-500" />
                  {feature}
                </li>
              ))}
            </ul>

            <button onClick={(event) => explorePlan(plan, event)} className="w-full py-4 bg-surface-50 hover:bg-primary-600 hover:text-white text-surface-900 font-bold rounded-2xl transition-all flex items-center justify-center gap-2 group/btn">
              Explore Plan <ArrowRight className="w-4 h-4 group-hover/btn:translate-x-1 transition-transform" />
            </button>
          </motion.div>
        ))}
      </div>

      <div className="bg-primary-600 rounded-[2rem] p-10 text-white relative overflow-hidden">
        <Shield className="absolute -right-10 -bottom-10 w-64 h-64 text-white/10 -rotate-12" />
        <div className="relative z-10 max-w-2xl">
          <h2 className="text-3xl font-bold mb-4">Need Expert Advice?</h2>
          <p className="text-primary-100 text-lg mb-8">
            Our insurance specialists can help you calculate the right cover amount based 
            on your lifestyle and financial goals.
          </p>
          <button onClick={contactAdvisor} className="px-8 py-4 bg-white text-primary-600 font-black rounded-2xl hover:scale-105 transition-transform shadow-xl shadow-primary-900/20">
            Talk to an Advisor
          </button>
        </div>
      </div>
    </div>
  );
}
