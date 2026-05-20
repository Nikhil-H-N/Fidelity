import { motion } from 'framer-motion';
import { LineChart, Plus, Pause, Play, Calendar, TrendingUp, CheckCircle2 } from 'lucide-react';
import { useState, useEffect } from 'react';
import { usePageTracking, useClickTracking } from '../hooks/useTracking';
import SIPCreationModal from '../components/modals/SIPCreationModal';

const ACTIVE_SIPS_KEY = 'finova_active_sips';

const loadSIPs = () => {
  try {
    return JSON.parse(localStorage.getItem(ACTIVE_SIPS_KEY)) || [];
  } catch {
    return [];
  }
};

export default function SIPPlans() {
  usePageTracking('sip-plans');
  const trackClick = useClickTracking();
  const [sipModalOpen, setSipModalOpen] = useState(false);
  const [mySIPs, setMySIPs] = useState(loadSIPs);

  useEffect(() => {
    localStorage.setItem(ACTIVE_SIPS_KEY, JSON.stringify(mySIPs));
  }, [mySIPs]);

  const totalMonthly = mySIPs.reduce((s, sip) => s + Number(sip.amount), 0);
  const activeCount = mySIPs.filter(s => s.status === 'active').length;
  const pausedCount = mySIPs.filter(s => s.status === 'paused').length;
  const avgReturns = mySIPs.length > 0 
    ? (mySIPs.reduce((s, sip) => s + Number(sip.returns), 0) / mySIPs.length).toFixed(1)
    : '0.0';

  const openSipModal = (e) => {
    trackClick('start_new_sip', { page: 'sip-plans' }, e);
    setSipModalOpen(true);
  };

  const handleCreated = (newSip) => {
    setMySIPs(prev => [newSip, ...prev]);
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

      {/* Summary KPIs */}
      {mySIPs.length > 0 && (
        <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
          {[
            { label: 'Monthly Investment', value: `₹${totalMonthly.toLocaleString('en-IN')}`, icon: Calendar, color: 'bg-primary-50 text-primary-600' },
            { label: 'Active SIPs', value: activeCount, icon: Play, color: 'bg-accent-50 text-accent-600' },
            { label: 'Paused SIPs', value: pausedCount, icon: Pause, color: 'bg-amber-50 text-amber-600' },
            { label: 'Avg Returns', value: `${avgReturns}%`, icon: TrendingUp, color: 'bg-green-50 text-green-600' },
          ].map((kpi) => (
            <div key={kpi.label} className="kpi-card bg-white p-5 rounded-2xl border border-surface-100 shadow-sm flex flex-col justify-between">
              <div className={`w-10 h-10 rounded-xl ${kpi.color} flex items-center justify-center mb-3`}>
                <kpi.icon className="w-5 h-5" />
              </div>
              <div>
                <p className="text-2xl font-bold text-surface-900">{kpi.value}</p>
                <p className="text-sm text-surface-500 mt-0.5">{kpi.label}</p>
              </div>
            </div>
          ))}
        </div>
      )}

      {/* Empty State */}
      {mySIPs.length === 0 && (
        <div className="text-center py-16 bg-surface-50 border border-surface-100 rounded-[2rem]">
          <div className="w-16 h-16 rounded-2xl bg-white flex items-center justify-center mx-auto mb-4 shadow-sm">
            <LineChart className="w-8 h-8 text-surface-400" />
          </div>
          <h3 className="text-lg font-bold text-surface-900">No Active SIPs</h3>
          <p className="text-surface-500 mt-1 max-w-sm mx-auto">Start a systematic investment plan today to begin building your long-term wealth.</p>
          <button onClick={openSipModal} className="btn-primary mt-6"><Plus className="w-4 h-4 mr-1"/> Start Your First SIP</button>
        </div>
      )}

      {/* My SIPs Section */}
      {mySIPs.length > 0 && (
        <div className="space-y-4">
          <div className="flex items-center gap-2 mb-2">
            <div className="w-8 h-8 rounded-lg bg-accent-100 flex items-center justify-center">
              <CheckCircle2 className="w-4 h-4 text-accent-600" />
            </div>
            <div>
              <h2 className="text-lg font-bold text-surface-900">My SIPs</h2>
              <p className="text-xs text-surface-400">{mySIPs.length} active plan{mySIPs.length > 1 ? 's' : ''}</p>
            </div>
          </div>
          
          <div className="grid gap-4">
            {mySIPs.map((sip, i) => (
              <motion.div key={sip.id} initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: i * 0.05 }}
                className="bg-gradient-to-r from-accent-50 to-white rounded-2xl p-5 shadow-soft border border-accent-200 relative overflow-hidden card-hover">
                <div className="absolute top-3 right-3 px-3 py-1 bg-accent-600 text-white text-[10px] font-bold rounded-full flex items-center gap-1">
                  <CheckCircle2 className="w-3 h-3" /> Active
                </div>
                <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
                  <div className="flex items-center gap-4">
                    <div className="w-12 h-12 rounded-xl bg-white shadow-sm border border-surface-100 flex items-center justify-center text-accent-600">
                      <LineChart className="w-6 h-6" />
                    </div>
                    <div>
                      <h3 className="font-semibold text-surface-900">{sip.name}</h3>
                      <div className="flex items-center gap-3 text-sm text-surface-500 mt-0.5">
                        <span className="badge-info">{sip.category}</span>
                        <span>Every {sip.date}th</span>
                      </div>
                    </div>
                  </div>
                  <div className="flex items-center gap-6 pr-12 sm:pr-24">
                    <div className="text-center"><p className="text-xs text-surface-400">Monthly</p><p className="text-lg font-bold text-surface-900">₹{Number(sip.amount).toLocaleString('en-IN')}</p></div>
                    <div className="text-center"><p className="text-xs text-surface-400">Exp. Returns</p><p className="text-lg font-bold text-accent-600">+{sip.returns}%</p></div>
                  </div>
                </div>
              </motion.div>
            ))}
          </div>
        </div>
      )}

      {/* SIP Creation Modal */}
      <SIPCreationModal 
        isOpen={sipModalOpen} 
        onClose={() => setSipModalOpen(false)} 
        onCreated={handleCreated} 
      />
    </div>
  );
}
