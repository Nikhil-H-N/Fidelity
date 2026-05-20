import { useState, useEffect, useMemo } from 'react';
import {
  Users, TrendingUp, Zap, Activity,
  Settings, Save, Cpu, Globe, Eye
} from 'lucide-react';
import { motion } from 'framer-motion';
import { KPICard } from '../components/UIComponents';
import { engineApi } from '../utils/apiBase';

export default function Overview() {
  const [summary, setSummary] = useState(null);
  const [activeUsers, setActiveUsers] = useState([]);
  const [config, setConfig] = useState(null);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    const ac = new AbortController();
    fetchData(ac.signal);
    const interval = setInterval(() => fetchData(ac.signal), 10000);
    return () => {
      ac.abort();
      clearInterval(interval);
    };
  }, []);

  const fetchData = async (signal) => {
    try {
      const [summaryRes, configRes, usersRes] = await Promise.all([
        fetch(engineApi('/admin/analytics/summary'), { signal }),
        fetch(engineApi('/admin/config'), { signal }),
        fetch(engineApi('/admin/active-users'), { signal }).catch(() => new Response(null, { status: 200 }))
      ]);

      if (summaryRes?.ok) { try { setSummary(await summaryRes.json()); } catch {} }
      if (configRes?.ok) { try { setConfig(await configRes.json()); } catch {} }
      if (usersRes?.ok) { try { setActiveUsers(await usersRes.json()); } catch {} }
    } catch (error) {
      if (error.name === 'AbortError') return;
      console.error('Failed to fetch data:', error);
    } finally {
      setLoading(false);
    }
  };

  const externalCount = useMemo(() => {
    return activeUsers.filter(u => u.metadata?.connection_origin === 'remote').length;
  }, [activeUsers]);

  const handleUpdateConfig = async () => {
    setSaving(true);
    try {
      const res = await fetch(engineApi('/admin/config/update'), {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(config),
      });
      if (res.ok) {
        alert('Config Synced to Engine');
      } else {
        alert('Update Failed: ' + (await res.text()));
      }
    } catch (e) { alert('Update Failed'); }
    setSaving(false);
  };

  const [training, setTraining] = useState(false);

  const handleTrain = async () => {
    setTraining(true);
    try {
      const res = await fetch(engineApi('/admin/train-global-model'), { method: 'POST' });
      if (!res.ok) throw new Error('Training request failed');
      const data = await res.json();
      if (data.status === 'training_complete') {
        const conv = data.conversion_model || {};
        const seg = data.segmentation_model || {};
        const info = {
          timestamp: Date.now(),
          sessionCount: data.session_count || 0,
          convStatus: conv.status || 'unknown',
          segStatus: seg.status || 'unknown',
          classCounts: conv.class_counts || {},
        };
        localStorage.setItem('ml_last_training', JSON.stringify(info));
        const convLabel = conv.status === 'trained'
          ? `Conversion model trained on ${data.session_count} sessions (classes: ${JSON.stringify(conv.class_counts)})`
          : `Conversion model: ${conv.status} — ${conv.reason || 'check session data'}`;
        const segLabel = seg.status === 'trained'
          ? `Segmentation model: ${seg.clusters} clusters from ${seg.session_count} sessions`
          : `Segmentation model: ${seg.status} — ${seg.reason || ''}`;
        alert(`Training complete!\n\n${convLabel}\n${segLabel}`);
      } else {
        alert(`Training skipped: ${data.message || data.status || 'unknown reason'}`);
      }
    } catch (e) {
      alert(`Training failed: ${e.message}`);
    } finally {
      setTraining(false);
    }
  };

  if (loading && !summary) return (
    <div className="flex items-center justify-center h-64">
      <div className="w-8 h-8 border-3 border-primary-200 border-t-primary-600 rounded-full animate-spin" />
    </div>
  );

  return (
    <div className="space-y-8">
      {/* Header Info */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold text-surface-900">System Overview</h1>
          <p className="text-surface-500 mt-1 text-sm">Real-time health and behavioral aggregates</p>
        </div>
        <div className="flex gap-3">
          <button onClick={handleTrain} disabled={training} className="flex items-center gap-2 px-4 py-2.5 bg-white border border-surface-200 hover:border-primary-200 hover:shadow-glow rounded-xl text-sm font-semibold transition-all text-surface-700 disabled:opacity-50">
            <Cpu className="w-4 h-4 text-primary-500" /> {training ? 'Training...' : 'Train ML Model'}
          </button>
        </div>
      </div>

      {/* Stats Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        <KPICard icon={Users} label="LIVE SESSIONS" value={summary?.total_users || 0} trend="+12%" />
        <KPICard icon={Globe} label="REMOTE USERS" value={externalCount} color="text-amber-500" />
        <KPICard icon={TrendingUp} label="AVG INTENT" value={Math.round(summary?.avg_score || 0)} trend="+4.2" />
        <KPICard icon={Zap} label="CONV. PROB" value={`${((summary?.avg_conversion_probability || 0) * 100).toFixed(1)}%`} />
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        {/* Behavioral Distribution */}
        <div className="lg:col-span-2 bg-white border border-surface-100 rounded-2xl p-6 shadow-card">
          <div className="flex items-center justify-between mb-8">
            <h3 className="font-bold flex items-center gap-2 text-lg text-surface-900">
              <Zap className="w-5 h-5 text-primary-500" /> Behavioral States Distribution
            </h3>
            <span className="text-[10px] font-bold px-2.5 py-1 bg-accent-50 text-accent-700 rounded-full uppercase tracking-widest">Live Data</span>
          </div>
          <div className="space-y-6">
            {Object.entries(summary?.behavioral_distribution || {}).map(([state, count]) => {
              const percentage = Math.round((count / (summary?.total_users || 1)) * 100);
              return (
                <div key={state} className="space-y-2">
                  <div className="flex justify-between text-xs font-bold">
                    <span className="uppercase text-surface-600 tracking-wider">{state.replace(/_/g, ' ')}</span>
                    <span className="text-primary-600">{count} users ({percentage}%)</span>
                  </div>
                  <div className="h-2 w-full bg-surface-100 rounded-full overflow-hidden">
                    <motion.div initial={{ width: 0 }} animate={{ width: `${percentage}%` }} transition={{ duration: 1 }} className="h-full bg-gradient-to-r from-primary-600 to-primary-400 rounded-full" />
                  </div>
                </div>
              );
            })}
          </div>
        </div>

        {/* Quick Config */}
        <div className="bg-white border border-surface-100 rounded-2xl p-6 shadow-card">
          <div className="flex items-center justify-between mb-6">
            <h3 className="font-bold flex items-center gap-2 text-lg text-surface-900">
              <Settings className="w-5 h-5 text-surface-400" /> Engine Config
            </h3>
            <button onClick={handleUpdateConfig} disabled={saving} className="p-2 bg-primary-600 hover:bg-primary-500 text-white rounded-lg transition-all shadow-glow">
              <Save className="w-4 h-4" />
            </button>
          </div>

          <div className="space-y-6">
            <div>
              <h4 className="text-[10px] font-bold text-surface-400 uppercase tracking-widest mb-4">Priority Weights</h4>
              <div className="space-y-4">
                {config && Object.entries(config.page_weights).slice(0, 5).map(([page, w]) => (
                  <div key={page} className="flex items-center justify-between">
                    <span className="text-xs text-surface-500">{page}</span>
                    <input type="number" value={w} onChange={(e) => setConfig({...config, page_weights: {...config.page_weights, [page]: parseFloat(e.target.value)}})}
                      className="w-12 h-7 bg-surface-50 border border-surface-200 rounded-lg text-center text-[10px] font-bold text-primary-600 focus:border-primary-500 outline-none transition-colors" />
                  </div>
                ))}
                <p className="text-[10px] text-center text-surface-400 italic mt-4 underline cursor-pointer">View all weights in ML Settings</p>
              </div>
            </div>

            <div className="pt-6 border-t border-surface-100">
              <h4 className="text-[10px] font-bold text-surface-400 uppercase tracking-widest mb-4">State Thresholds</h4>
              <div className="space-y-5">
                {config && Object.entries(config.score_thresholds).map(([key, val]) => (
                  <div key={key} className="space-y-2">
                    <div className="flex justify-between text-[10px] font-bold">
                      <span className="text-surface-500 uppercase tracking-tighter">{key.replace(/_/g, ' ')}</span>
                      <span className="text-primary-600">{val}</span>
                    </div>
                    <input type="range" min="0" max="150" value={val} onChange={(e) => setConfig({...config, score_thresholds: {...config.score_thresholds, [key]: parseFloat(e.target.value)}})}
                      className="w-full h-1 bg-surface-100 rounded-lg appearance-none cursor-pointer accent-primary-500" />
                  </div>
                ))}
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Top Pages & Persona Clusters */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        <div className="lg:col-span-1 bg-white border border-surface-100 rounded-2xl p-6 shadow-card">
           <h3 className="font-bold mb-6 flex items-center gap-2 text-lg text-surface-900">
            <Eye className="w-5 h-5 text-primary-500" /> Top Visited Pages
          </h3>
          <div className="space-y-4">
            {summary?.top_pages?.map(([page, count], idx) => (
              <div key={page} className="flex items-center justify-between p-3 rounded-xl bg-surface-50 border border-surface-100">
                <div className="flex items-center gap-3">
                  <span className="text-[10px] font-bold text-surface-400 font-mono">#{idx + 1}</span>
                  <span className="text-sm text-surface-600 truncate max-w-[150px]">{page}</span>
                </div>
                <span className="text-sm font-bold text-primary-600 font-mono">{count}</span>
              </div>
            ))}
          </div>
        </div>

        <div className="lg:col-span-2 bg-white border border-surface-100 rounded-2xl p-6 shadow-card">
          <h3 className="font-bold mb-6 flex items-center gap-2 text-lg text-surface-900">
            <Activity className="w-5 h-5 text-accent-500" /> Psychological Persona Clustering
          </h3>
          <div className="grid grid-cols-2 md:grid-cols-3 gap-4">
            {Object.entries(summary?.clustering_segments || {}).map(([persona, count]) => (
              <div key={persona} className="p-5 rounded-2xl bg-surface-50 border border-surface-100 hover:border-primary-200 hover:shadow-glow transition-all group">
                <p className="text-[10px] font-bold text-surface-400 uppercase mb-3 tracking-widest group-hover:text-primary-500 transition-colors">{persona.replace(/_/g, ' ')}</p>
                <div className="flex items-end justify-between">
                  <p className="text-3xl font-bold text-surface-900 tracking-tighter">{count}</p>
                  <div className="w-1.5 h-8 bg-surface-100 rounded-full overflow-hidden">
                    <div className="w-full bg-primary-500 rounded-full" style={{ height: `${(count / (summary?.total_users || 1)) * 100}%` }} />
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
}
