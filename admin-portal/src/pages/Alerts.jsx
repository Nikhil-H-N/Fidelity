import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import {
  AlertTriangle, ShieldAlert, Zap,
  MousePointerClick, Info, User,
  CheckCircle2, Radio
} from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';
import { engineApi } from '../utils/apiBase';

export default function Alerts() {
  const navigate = useNavigate();
  const [alerts, setAlerts] = useState([]);
  const [summary, setSummary] = useState(null);
  const [loading, setLoading] = useState(true);
  const [filter, setFilter] = useState('ALL');
  const [resolved, setResolved] = useState(() => new Set());

  const fetchAlerts = async () => {
    try {
      const res = await fetch(engineApi('/admin/alerts'));
      if (res.ok) {
        const payload = await res.json();
        setAlerts(payload.alerts || []);
        setSummary(payload.summary || null);
      }
    } catch (error) {
      console.error('Failed to fetch alerts:', error);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    const ac = new AbortController();
    fetchAlerts();
    const interval = setInterval(fetchAlerts, 8000);
    return () => {
      ac.abort();
      clearInterval(interval);
    };
  }, []);

  const iconFor = (alert) => {
    if (alert.type === 'CRITICAL') return ShieldAlert;
    if (alert.event_type?.includes('click')) return MousePointerClick;
    if (alert.title?.toLowerCase().includes('intent')) return Zap;
    if (alert.type === 'WARNING') return AlertTriangle;
    return Info;
  };

  const activeAlerts = alerts.filter((alert) => !resolved.has(alert.id));
  const filteredAlerts = filter === 'ALL' ? activeAlerts : activeAlerts.filter(a => a.type === filter);
  const markResolved = (id) => setResolved((current) => new Set([...current, id]));
  const relativeTime = (timestamp) => {
    const seconds = Math.max(0, Math.floor(Date.now() / 1000 - (timestamp || 0)));
    if (seconds < 10) return 'Just now';
    if (seconds < 60) return `${seconds}s ago`;
    const minutes = Math.floor(seconds / 60);
    if (minutes < 60) return `${minutes}m ago`;
    return `${Math.floor(minutes / 60)}h ago`;
  };

  return (
    <div className="space-y-8">
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold text-surface-900">System Alerts</h1>
          <p className="text-surface-500 mt-1 text-sm">Real-time behavioral triggers, friction spikes, and intervention signals</p>
        </div>
        <div className="flex flex-col gap-3 md:flex-row md:items-center">
          <div className="flex items-center gap-2 px-4 py-2 rounded-xl border border-red-200 bg-red-50">
            <Radio className="w-4 h-4 text-red-500 animate-pulse" />
            <span className="text-[10px] font-bold text-red-700 uppercase tracking-widest">
              {summary?.total || 0} Live Alerts
            </span>
          </div>
          <div className="flex gap-1 bg-surface-100 p-1 rounded-xl border border-surface-200">
            {['ALL', 'CRITICAL', 'WARNING', 'INFO'].map(t => (
              <button
                key={t}
                onClick={() => setFilter(t)}
                className={`px-4 py-1.5 rounded-lg text-[10px] font-bold transition-all ${filter === t ? 'bg-white text-primary-600 shadow-sm' : 'text-surface-500 hover:text-surface-700'}`}
              >
                {t}
              </button>
            ))}
          </div>
        </div>
      </div>

      <div className="space-y-4">
        <AnimatePresence>
          {filteredAlerts.map((alert) => (
            <motion.div
              key={alert.id}
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, scale: 0.95 }}
              className={`p-6 rounded-2xl border flex items-start gap-4 transition-all hover:shadow-card bg-white ${
                alert.type === 'CRITICAL' ? 'border-red-200' :
                alert.type === 'WARNING' ? 'border-amber-200' :
                'border-primary-200'
              }`}
            >
              {(() => {
                const Icon = iconFor(alert);
                return (
              <div className={`p-3 rounded-xl flex-shrink-0 ${
                alert.type === 'CRITICAL' ? 'bg-red-50 text-red-500' :
                alert.type === 'WARNING' ? 'bg-amber-50 text-amber-500' :
                'bg-primary-50 text-primary-500'
              }`}>
                <Icon className="w-6 h-6" />
              </div>
                );
              })()}

              <div className="flex-1">
                <div className="flex items-center justify-between mb-1">
                  <h3 className="font-bold text-surface-900 text-lg">{alert.title}</h3>
                  <span className="text-xs font-mono text-surface-400 bg-surface-50 px-2 py-1 rounded">UID: {alert.user_id}</span>
                </div>
                <p className="text-surface-500 text-sm leading-relaxed mb-4">{alert.message}</p>
                <div className="mb-4 flex flex-wrap gap-2 text-[10px] font-bold uppercase tracking-widest">
                  {alert.page && <span className="px-2 py-1 rounded bg-surface-50 text-surface-500 border border-surface-100">Page: {alert.page}</span>}
                  {alert.event_type && <span className="px-2 py-1 rounded bg-surface-50 text-surface-500 border border-surface-100">Event: {alert.event_type}</span>}
                  {alert.score !== undefined && <span className="px-2 py-1 rounded bg-primary-50 text-primary-600 border border-primary-100">Score: {alert.score}</span>}
                </div>
                <div className="flex items-center gap-4">
                  <button
                    onClick={() => navigate(`/timeline?user=${encodeURIComponent(alert.user_id)}`)}
                    className="text-[10px] font-bold uppercase tracking-widest text-primary-600 hover:text-primary-500 transition-colors flex items-center gap-1.5"
                  >
                    <User className="w-3 h-3" /> View Session Timeline
                  </button>
                  <button
                    onClick={() => markResolved(alert.id)}
                    className="text-[10px] font-bold uppercase tracking-widest text-accent-600 hover:text-accent-500 transition-colors flex items-center gap-1.5"
                  >
                    <CheckCircle2 className="w-3 h-3" /> Mark as Resolved
                  </button>
                </div>
              </div>

              <div className="text-right">
                <span className="text-[10px] font-bold text-surface-400 uppercase tracking-widest">{relativeTime(alert.timestamp)}</span>
              </div>
            </motion.div>
          ))}
        </AnimatePresence>

        {filteredAlerts.length === 0 && !loading && (
          <div className="flex flex-col items-center justify-center py-32 bg-white border-2 border-dashed border-surface-200 rounded-3xl">
            <CheckCircle2 className="w-16 h-16 text-accent-200 mb-4" />
            <p className="text-surface-400 font-medium italic">No active system alerts detected.</p>
          </div>
        )}
      </div>
    </div>
  );
}
