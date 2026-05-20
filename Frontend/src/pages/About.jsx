import { motion } from 'framer-motion';
import { Shield, Users, Award, Target, TrendingUp, Globe } from 'lucide-react';
import Navbar from '../components/common/Navbar';
import Footer from '../components/common/Footer';
import { AnimatedCounter } from '../components/common/UIComponents';
import { usePageTracking } from '../hooks/useTracking';

export default function About() {
  usePageTracking('about');
  const team = [
    { name: 'Arjun Mehta', role: 'CEO & Co-Founder', avatar: 'AM' },
    { name: 'Sneha Reddy', role: 'CTO', avatar: 'SR' },
    { name: 'Vikram Joshi', role: 'Head of Product', avatar: 'VJ' },
    { name: 'Priya Nair', role: 'Head of Design', avatar: 'PN' },
  ];

  return (
    <div className="min-h-screen">
      <Navbar />
      <main className="pt-20">
        <section className="section-padding gradient-hero">
          <div className="container-custom text-center">
            <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }}>
              <h1 className="font-display text-4xl sm:text-5xl font-bold text-surface-900 mb-4">About Finova Wealth</h1>
              <p className="text-lg text-surface-500 max-w-2xl mx-auto">We're building the future of personal finance with AI-powered investment management and behavioral intelligence.</p>
            </motion.div>
          </div>
        </section>

        <section className="section-padding bg-white">
          <div className="container-custom">
            <div className="grid md:grid-cols-4 gap-8 text-center">
              {[{ v: 125000, s: '+', l: 'Investors' }, { v: 2840, s: ' Cr', l: 'AUM', p: '₹' }, { v: 98, s: '%', l: 'Satisfaction' }, { v: 15, s: '+', l: 'Awards' }].map(s => (
                <div key={s.l} className="p-6">
                  <p className="text-3xl font-bold text-surface-900"><AnimatedCounter end={s.v} prefix={s.p || ''} suffix={s.s} /></p>
                  <p className="text-sm text-surface-500 mt-1">{s.l}</p>
                </div>
              ))}
            </div>
          </div>
        </section>

        <section className="section-padding bg-surface-50">
          <div className="container-custom">
            <h2 className="text-2xl font-bold text-surface-900 text-center mb-10">Leadership Team</h2>
            <div className="grid sm:grid-cols-2 lg:grid-cols-4 gap-6">
              {team.map((m, i) => (
                <motion.div key={m.name} initial={{ opacity: 0, y: 20 }} whileInView={{ opacity: 1, y: 0 }} viewport={{ once: true }} transition={{ delay: i * 0.1 }}
                  className="bg-white rounded-2xl p-6 shadow-soft border border-surface-100 text-center card-hover">
                  <div className="w-16 h-16 rounded-full bg-gradient-to-br from-primary-500 to-accent-500 flex items-center justify-center text-white font-bold text-xl mx-auto mb-4">{m.avatar}</div>
                  <h3 className="font-semibold text-surface-900">{m.name}</h3>
                  <p className="text-sm text-surface-500">{m.role}</p>
                </motion.div>
              ))}
            </div>
          </div>
        </section>
      </main>
      <Footer />
    </div>
  );
}
