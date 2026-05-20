import { useState } from 'react';
import { motion } from 'framer-motion';
import { HelpCircle, ChevronDown, Search, MessageSquare, BookOpen, Phone } from 'lucide-react';
import Navbar from '../components/common/Navbar';
import Footer from '../components/common/Footer';
import { usePageTracking } from '../hooks/useTracking';

const faqs = [
  { q: 'How do I start investing?', a: 'Sign up, complete KYC, and you can start investing in mutual funds or SIPs in under 5 minutes.' },
  { q: 'What is the minimum investment?', a: 'You can start with as low as ₹500 per month through our SIP plans.' },
  { q: 'How safe is my money?', a: 'All investments are held with SEBI-registered AMCs. We are a registered investment advisor with bank-grade security.' },
  { q: 'Can I withdraw anytime?', a: 'Yes, for open-ended funds you can redeem anytime. Proceeds are credited within 1-3 business days.' },
  { q: 'What is behavioral analytics?', a: 'Our AI tracks your investment patterns to provide personalized recommendations and alerts.' },
  { q: 'Are there any hidden charges?', a: 'No hidden charges. We are transparent about all fees which are clearly shown before any transaction.' },
];

export default function Help() {
  usePageTracking('help');
  const [open, setOpen] = useState(null);
  const [search, setSearch] = useState('');

  const filtered = faqs.filter(f => f.q.toLowerCase().includes(search.toLowerCase()) || f.a.toLowerCase().includes(search.toLowerCase()));

  return (
    <div className="min-h-screen"><Navbar />
      <main className="pt-20">
        <section className="section-padding gradient-hero">
          <div className="container-custom text-center">
            <h1 className="font-display text-4xl font-bold text-surface-900 mb-4">Help Center</h1>
            <p className="text-lg text-surface-500 max-w-xl mx-auto mb-6">Find answers to common questions</p>
            <div className="max-w-lg mx-auto relative">
              <Search className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-surface-400" />
              <input className="input-field pl-12 py-4 text-base shadow-card" placeholder="Search for help..." value={search} onChange={e => setSearch(e.target.value)} />
            </div>
          </div>
        </section>

        <section className="section-padding bg-white">
          <div className="container-custom max-w-3xl">
            <h2 className="text-xl font-bold text-surface-900 mb-6">Frequently Asked Questions</h2>
            <div className="space-y-3">
              {filtered.map((faq, i) => (
                <motion.div key={i} initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: i * 0.05 }}
                  className="bg-white rounded-xl border border-surface-100 shadow-soft overflow-hidden">
                  <button onClick={() => setOpen(open === i ? null : i)}
                    className="w-full flex items-center justify-between p-5 text-left">
                    <span className="font-medium text-surface-900 text-sm">{faq.q}</span>
                    <ChevronDown className={`w-5 h-5 text-surface-400 transition-transform ${open === i ? 'rotate-180' : ''}`} />
                  </button>
                  {open === i && (
                    <motion.div initial={{ height: 0 }} animate={{ height: 'auto' }} className="px-5 pb-5">
                      <p className="text-sm text-surface-600 leading-relaxed">{faq.a}</p>
                    </motion.div>
                  )}
                </motion.div>
              ))}
            </div>
          </div>
        </section>

        <section className="section-padding bg-surface-50">
          <div className="container-custom">
            <div className="grid md:grid-cols-3 gap-6">
              {[
                { icon: MessageSquare, title: 'Live Chat', desc: 'Chat with our support team', action: 'Start Chat' },
                { icon: BookOpen, title: 'Documentation', desc: 'Browse our detailed guides', action: 'View Docs' },
                { icon: Phone, title: 'Call Us', desc: '+91 1800-XXX-XXXX', action: 'Call Now' },
              ].map(c => (
                <div key={c.title} className="bg-white rounded-2xl p-6 shadow-soft border border-surface-100 text-center card-hover">
                  <div className="w-12 h-12 rounded-xl bg-primary-50 flex items-center justify-center mx-auto mb-4"><c.icon className="w-6 h-6 text-primary-600" /></div>
                  <h3 className="font-semibold text-surface-900 mb-1">{c.title}</h3>
                  <p className="text-sm text-surface-500 mb-4">{c.desc}</p>
                  <button className="btn-secondary text-sm py-2 px-4">{c.action}</button>
                </div>
              ))}
            </div>
          </div>
        </section>
      </main>
      <Footer />
    </div>
  );
}
