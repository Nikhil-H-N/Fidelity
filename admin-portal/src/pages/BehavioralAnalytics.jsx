import { useEffect, useState } from 'react';
import { motion } from 'framer-motion';
import {
  Users, Target, Zap, Activity,
  BarChart3, RefreshCw, Eye, Timer
} from 'lucide-react';
import { KPICard } from '../components/UIComponents';
import { getStatusColor } from '../utils/formatters';
import { engineApi } from '../utils/apiBase';

const getDisplayName = (user) => {
  if (!user) return 'Unknown';
  const meta = user.metadata || {};
  const email = meta.email || meta.userEmail;
  const name = meta.name || meta.userName;
  if (email || name) return String(email || name);
  // Fallback: check events for user info
  const ev = (user.events || []).find(e => e.metadata?.userEmail || e.metadata?.userName);
  if (ev) return String(ev.metadata.userEmail || ev.metadata.userName);
  return user.user_id;
};

export default function BehavioralAnalytics() {
  const [activeUsers, setActiveUsers] = useState([]);
  const [summary, setSummary] = useState(null);
  const [loading, setLoading] = useState(true);

  const fetchData = async (signal) => {
    try {
      const [usersRes, summaryRes] = await Promise.all([
        fetch(engineApi('/admin/active-users'), { signal }),
        fetch(engineApi('/admin/analytics/summary'), { signal })
      ]);

      if (usersRes.ok) { try { setActiveUsers(await usersRes.json()); } catch {} }
      if (summaryRes.ok) { try { setSummary(await summaryRes.json()); } catch {} }
    } catch (error) {
      if (error.name === 'AbortError') return;
      console.error('Failed to fetch analytics:', error);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    const ac = new AbortController();
    fetchData(ac.signal);
    const interval = setInterval(() => fetchData(ac.signal), 8000);
    return () => {
      ac.abort();
      clearInterval(interval);
    };
  }, []);

  return (
    <div className="space-y-8">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-surface-900">Behavioral Intelligence</h1>
          <p className="text-surface-500 mt-1 text-sm">Advanced intent tracking and session classification</p>
        </div>
        <button onClick={fetchData} className="p-2.5 hover:bg-surface-50 rounded-xl transition-all border border-surface-200 bg-white">
          <RefreshCw className={`w-5 h-5 text-surface-400 ${loading ? 'animate-spin' : ''}`} />
        </button>
      </div>

      {/* KPIs */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        <KPICard icon={Users} label="Active Users" value={summary?.total_users || 0} trend="+12.4%" />
        <KPICard icon={Target} label="Avg Intent Score" value={Math.round(summary?.avg_score || 0)} trend="+2.3%" />
        <KPICard icon={Timer} label="Conv. Probability" value={`${((summary?.avg_conversion_probability || 0) * 100).toFixed(1)}%`} trend="+4%" />
        <KPICard icon={Eye} label="Global Model" value={summary?.global_model_status || 'Offline'} color="text-accent-600" />
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
        {/* Behavioral Distribution */}
        <div className="bg-white border border-surface-100 rounded-2xl p-6 shadow-card">
          <h3 className="font-bold text-surface-900 mb-6 flex items-center gap-2 text-lg">
            <BarChart3 className="w-5 h-5 text-primary-500" /> State Distribution
          </h3>
          <div className="space-y-5">
            {Object.entries(summary?.behavioral_distribution || {}).map(([state, count]) => {
              const percentage = Math.round((count / (summary?.total_users || 1)) * 100);
              return (
                <div key={state} className="group">
                  <div className="flex items-center justify-between mb-2">
                    <span className="text-xs font-bold text-surface-600 uppercase tracking-widest">{state.replace(/_/g, ' ')}</span>
                    <span className="text-xs font-mono text-surface-400">{count} sessions ({percentage}%)</span>
                  </div>
                  <div className="w-full bg-surface-100 rounded-full h-5 overflow-hidden border border-surface-100 p-1">
                    <motion.div initial={{ width: 0 }} animate={{ width: `${percentage}%` }} transition={{ duration: 1 }}
                      className="h-full rounded-full bg-gradient-to-r from-primary-600 to-primary-400 flex items-center justify-end pr-2 min-w-[20px]">
                      {percentage > 10 && <span className="text-[10px] font-bold text-white/80">{percentage}%</span>}
                    </motion.div>
                  </div>
                </div>
              );
            })}
          </div>
        </div>

        {/* Live Intent Tracking */}
        <div className="bg-white border border-surface-100 rounded-2xl p-6 shadow-card flex flex-col">
          <h3 className="font-bold text-surface-900 mb-6 flex items-center gap-2 text-lg">
            <Zap className="w-5 h-5 text-amber-500" /> Active Session Scores
          </h3>
          <div className="space-y-3 overflow-y-auto max-h-[450px] pr-2">
            {activeUsers.map(user => (
              <div key={user.user_id} className="p-4 rounded-xl bg-surface-50 border border-surface-100 hover:border-primary-200 transition-all group">
                {(() => {
                  const nextAction = user.metadata?.next_action_prediction;
                  return nextAction ? (
                    <div className="mb-3 rounded-xl bg-primary-50 border border-primary-100 p-3">
                      <div className="flex items-center justify-between gap-3">
                        <span className="text-[10px] font-bold text-primary-600 uppercase tracking-widest">Predicted next action</span>
                        <span className="text-[10px] font-mono text-primary-500">{Math.round((nextAction.probability || 0) * 100)}%</span>
                      </div>
                      <p className="text-sm font-bold text-surface-900 mt-1">{nextAction.label || nextAction.action}</p>
                    </div>
                  ) : null;
                })()}
                <div className="flex items-center justify-between mb-3">
                  <div className="flex flex-col">
                    <span className="text-xs font-semibold text-surface-700 w-fit mb-1">{getDisplayName(user)}</span>
                    <span className={`px-2 py-0.5 rounded-full text-[10px] font-bold w-fit ${getStatusColor(user.intent_state)}`}>{user.intent_state}</span>
                  </div>
                  <div className="text-right">
                    <span className="text-2xl font-bold text-primary-600 leading-none">{Math.round(user.total_score)}</span>
                    <p className="text-[8px] font-bold text-surface-400 uppercase tracking-widest mt-1">INTENT SCORE</p>
                  </div>
                </div>
                <div className="flex flex-wrap gap-2">
                  <span className="px-2 py-1 bg-surface-100 rounded-lg text-[10px] text-surface-500 font-bold border border-surface-100">
                    PERSONA: {user.persona.replace(/_/g, ' ')}
                  </span>
                  <span className="px-2 py-1 bg-surface-100 rounded-lg text-[10px] text-surface-500 font-bold border border-surface-100">
                    EVENTS: {user.event_count}
                  </span>
                  {user.manual_interventions_pending > 0 && (
                    <span className="px-2 py-1 bg-red-50 text-red-600 rounded-lg text-[10px] font-bold border border-red-100 animate-pulse">
                      INTERVENTION REQUIRED
                    </span>
                  )}
                </div>
              </div>
            ))}
            {activeUsers.length === 0 && (
              <div className="flex flex-col items-center justify-center py-20 text-surface-300">
                <Activity className="w-12 h-12 mb-2" />
                <p className="text-sm italic">No active user sessions</p>
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
