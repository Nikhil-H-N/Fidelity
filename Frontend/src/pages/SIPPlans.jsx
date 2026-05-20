import { motion } from 'framer-motion';
import { LineChart, Plus, Pause, Play, Calendar, TrendingUp, ArrowUpRight } from 'lucide-react';
import { useState } from 'react';
import { activeSIPs } from '../data/mockData';
import { usePageTracking, useClickTracking } from '../hooks/useTracking';
import SIPCreationModal from '../components/modals/SIPCreationModal';

export default function SIPPlans() {
  usePageTracking('sip-plans');
  const trackClick = useClickTracking();
  const [sipModalOpen, setSipModalOpen] = useState(false);

  const totalMonthly = activeSIPs.reduce((s, sip) => s + sip.amount, 0);

  const openSipModal = (e) => {
    trackClick('start_new_sip', { page: 'sip-plans' }, e);
    setSipModalOpen(true);
  };

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold text-surface-900">SIP Plans</h1>
          <p className="text-surface-500 text-sm mt-1">Manage your systematic investment plans</p>
        </div>
        <button onClick={openSipModal} className="btn-primary text-sm py-2.5 px-5 gap-2"><Plus className="w-4 h-4" /> Start New SIP</button>
      </div>

      {/* Summary */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        {[
          { label: 'Monthly Investment', value: `₹${totalMonthly.toLocaleString('en-IN')}`, icon: Calendar, color: 'bg-primary-50 text-primary-600' },
          { label: 'Active SIPs', value: activeSIPs.filter(s => s.status === 'active').length, icon: Play, color: 'bg-accent-50 text-accent-600' },
          { label: 'Paused SIPs', value: activeSIPs.filter(s => s.status === 'paused').length, icon: Pause, color: 'bg-amber-50 text-amber-600' },
          { label: 'Avg Returns', value: `${(activeSIPs.reduce((s, sip) => s + sip.returns, 0) / activeSIPs.length).toFixed(1)}%`, icon: TrendingUp, color: 'bg-green-50 text-green-600' },
        ].map((kpi) => (
          <div key={kpi.label} className="kpi-card">
            <div className={`w-10 h-10 rounded-xl ${kpi.color} flex items-center justify-center mb-3`}>
              <kpi.icon className="w-5 h-5" />
            </div>
            <p className="text-2xl font-bold text-surface-900">{kpi.value}</p>
            <p className="text-sm text-surface-500 mt-0.5">{kpi.label}</p>
          </div>
        ))}
      </div>

      {/* SIP List */}
      <div className="space-y-4">
        {activeSIPs.map((sip, i) => (
          <motion.div key={sip.id} initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: i * 0.05 }}
            className="bg-white rounded-2xl p-5 shadow-soft border border-surface-100 card-hover">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
              <div className="flex items-center gap-4">
                <div className="w-12 h-12 rounded-xl bg-gradient-to-br from-primary-500 to-accent-500 flex items-center justify-center text-white">
                  <LineChart className="w-6 h-6" />
                </div>
                <div>
                  <h3 className="font-semibold text-surface-900">{sip.name}</h3>
                  <div className="flex items-center gap-3 text-sm text-surface-500 mt-0.5">
                    <span className="badge-info">{sip.category}</span>
                    <span>Every {sip.date}</span>
                  </div>
                </div>
              </div>
              <div className="flex items-center gap-6">
                <div className="text-center"><p className="text-xs text-surface-400">Monthly</p><p className="text-lg font-bold text-surface-900">₹{sip.amount.toLocaleString('en-IN')}</p></div>
                <div className="text-center"><p className="text-xs text-surface-400">Returns</p><p className="text-lg font-bold text-accent-600">+{sip.returns}%</p></div>
                <span className={`px-3 py-1 rounded-full text-xs font-semibold ${sip.status === 'active' ? 'bg-accent-50 text-accent-700' : 'bg-amber-50 text-amber-700'}`}>
                  {sip.status === 'active' ? '● Active' : '⏸ Paused'}
                </span>
              </div>
            </div>
          </motion.div>
        ))}
      </div>

      {/* SIP Creation Modal */}
      <SIPCreationModal isOpen={sipModalOpen} onClose={() => setSipModalOpen(false)} />
    </div>
  );
}
