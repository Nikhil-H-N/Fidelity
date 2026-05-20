import { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Plus, Minus, Search, MessageCircleQuestion } from 'lucide-react';
import { usePageTracking } from '../hooks/useTracking';

const faqs = [
  {
    category: 'Getting Started',
    questions: [
      {
        q: 'How do I start my investment journey with FinovaWealth?',
        a: 'Simply create an account, complete your digital Onboarding (KYC), and you can start investing in SIPs or Mutual Funds in under 5 minutes.'
      },
      {
        q: 'What documents are required for KYC?',
        a: 'You only need your PAN card, Aadhaar number (for e-KYC), and bank account details for mandate setup.'
      }
    ]
  },
  {
    category: 'Investments',
    questions: [
      {
        q: 'What is the minimum amount to start an SIP?',
        a: 'You can start an SIP with as little as ₹500 per month in many top-rated mutual funds.'
      },
      {
        q: 'Are there any hidden charges or commissions?',
        a: 'No. FinovaWealth is transparent about all costs. We show you the expense ratio and any applicable exit loads upfront.'
      }
    ]
  },
  {
    category: 'Security',
    questions: [
      {
        q: 'Is my data and money safe?',
        a: 'Absolutely. We use 256-bit encryption for all data. Your investments are held with SEBI-regulated Asset Management Companies (AMCs).'
      }
    ]
  }
];

export default function FAQ() {
  usePageTracking('faq');
  const [activeIdx, setActiveIdx] = useState('0-0');
  const [search, setSearch] = useState('');

  const toggle = (id) => setActiveIdx(activeIdx === id ? null : id);

  return (
    <div className="max-w-4xl mx-auto py-12 pb-24">
      <div className="text-center mb-16 space-y-4">
        <h1 className="text-4xl font-black text-surface-900 tracking-tight">
          Frequently Asked Questions
        </h1>
        <p className="text-surface-500 text-lg">
          Everything you need to know about our platform and services.
        </p>
      </div>

      <div className="relative mb-12">
        <Search className="absolute left-6 top-1/2 -translate-y-1/2 text-surface-400 w-5 h-5" />
        <input
          type="text"
          placeholder="Search for questions..."
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          className="w-full pl-14 pr-8 py-5 bg-white border border-surface-200 rounded-3xl shadow-sm focus:border-primary-500 focus:ring-4 focus:ring-primary-500/5 outline-none transition-all text-surface-900"
        />
      </div>

      <div className="space-y-10">
        {faqs.map((cat, catIdx) => (
          <div key={cat.category}>
            <h2 className="text-xs font-black text-surface-400 uppercase tracking-widest mb-6 px-2">
              {cat.category}
            </h2>
            <div className="space-y-4">
              {cat.questions
                .filter(q => q.q.toLowerCase().includes(search.toLowerCase()))
                .map((item, qIdx) => {
                  const id = `${catIdx}-${qIdx}`;
                  const isOpen = activeIdx === id;
                  
                  return (
                    <div 
                      key={id}
                      className={`bg-white border rounded-[2rem] transition-all overflow-hidden ${isOpen ? 'border-primary-200 shadow-xl shadow-primary-900/5' : 'border-surface-100'}`}
                    >
                      <button
                        onClick={() => toggle(id)}
                        className="w-full px-8 py-6 flex items-center justify-between text-left group"
                      >
                        <span className={`text-lg font-bold transition-colors ${isOpen ? 'text-primary-600' : 'text-surface-900'}`}>
                          {item.q}
                        </span>
                        <div className={`w-8 h-8 rounded-full flex items-center justify-center transition-all ${isOpen ? 'bg-primary-600 text-white rotate-90' : 'bg-surface-50 text-surface-400 group-hover:bg-surface-100'}`}>
                          {isOpen ? <Minus className="w-4 h-4" /> : <Plus className="w-4 h-4" />}
                        </div>
                      </button>
                      
                      <AnimatePresence>
                        {isOpen && (
                          <motion.div
                            initial={{ height: 0, opacity: 0 }}
                            animate={{ height: 'auto', opacity: 1 }}
                            exit={{ height: 0, opacity: 0 }}
                            className="overflow-hidden"
                          >
                            <div className="px-8 pb-8 text-surface-600 leading-relaxed border-t border-surface-50 pt-4">
                              {item.a}
                            </div>
                          </motion.div>
                        )}
                      </AnimatePresence>
                    </div>
                  );
                })}
            </div>
          </div>
        ))}
      </div>

      <div className="mt-20 p-10 bg-surface-900 rounded-[3rem] text-center text-white relative overflow-hidden">
        <MessageCircleQuestion className="absolute -left-4 -bottom-4 w-32 h-32 opacity-10 -rotate-12" />
        <h3 className="text-2xl font-bold mb-4">Still have questions?</h3>
        <p className="text-surface-400 mb-8 max-w-md mx-auto">
          Our support team is available 24/7 to help you with any queries.
        </p>
        <button className="px-8 py-4 bg-primary-600 text-white font-black rounded-2xl hover:scale-105 transition-transform">
          Contact Support
        </button>
      </div>
    </div>
  );
}
