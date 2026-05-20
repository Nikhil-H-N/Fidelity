import { useState, useEffect } from 'react';
import {
  Cpu, Settings, Save, Trash2,
  ShieldCheck, AlertTriangle, Zap,
  BarChart3, RefreshCw
} from 'lucide-react';
import { motion } from 'framer-motion';
import { engineApi } from '../utils/apiBase';

function formatTimeAgo(ts) {
  const diff = Math.floor((Date.now() - ts) / 1000);
  if (diff < 60) return 'just now';
  if (diff < 3600) return `${Math.floor(diff / 60)}m ago`;
  if (diff < 86400) return `${Math.floor(diff / 3600)}h ago`;
  return `${Math.floor(diff / 86400)}d ago`;
}

export default function MLIntelligence() {
  const [config, setConfig] = useState(null);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [training, setTraining] = useState(false);
  const [lastTrain, setLastTrain] = useState(() => {
    try { return JSON.parse(localStorage.getItem('ml_last_training')); } catch { return null; }
  });

  const fetchConfig = async () => {
    try {
      const res = await fetch(engineApi('/admin/config'));
      if (res.ok) {
        setConfig(await res.json());
      }
    } catch (error) {
      console.error('Failed to fetch config:', error);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchConfig();
  }, []);

  const handleUpdateConfig = async () => {
    setSaving(true);
    try {
      const res = await fetch(engineApi('/admin/config/update'), {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(config),
      });
      if (res.ok) {
        alert('Engine synchronized successfully');
      } else {
        alert('Update Failed: ' + (await res.text()));
      }
    } catch (e) { alert('Update Failed'); }
    setSaving(false);
  };

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
          featureCount: (conv.feature_names || []).length,
        };
        localStorage.setItem('ml_last_training', JSON.stringify(info));
        setLastTrain(info);
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

  if (loading) return (
    <div className="flex items-center justify-center h-64">
      <div className="w-8 h-8 border-3 border-primary-200 border-t-primary-600 rounded-full animate-spin" />
    </div>
  );

  return (
    <div className="space-y-8">
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold text-surface-900">ML Intelligence & Configuration</h1>
          <p className="text-surface-500 mt-1 text-sm">Fine-tune the behavioral brain and heuristic weights</p>
        </div>
        <div className="flex gap-3">
          <button onClick={handleTrain} disabled={training} className="flex items-center gap-2 px-4 py-2.5 btn-primary text-sm rounded-xl disabled:opacity-50">
            <Cpu className="w-4 h-4" /> {training ? 'Training...' : 'Start Global Training'}
          </button>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        {/* Main Config Column */}
        <div className="lg:col-span-2 space-y-8">
          {/* Page Importance */}
          <div className="bg-white border border-surface-100 rounded-2xl p-6 shadow-card">
            <div className="flex items-center justify-between mb-8">
              <h3 className="font-bold text-surface-900 flex items-center gap-2 text-lg">
                <BarChart3 className="w-5 h-5 text-primary-500" /> Behavioral Weight Matrix
              </h3>
              <button onClick={handleUpdateConfig} disabled={saving} className="flex items-center gap-2 px-4 py-2 bg-accent-500 hover:bg-accent-600 text-white rounded-lg text-xs font-bold transition-all disabled:opacity-50">
                <Save className="w-4 h-4" /> {saving ? 'SYNCING...' : 'SYNC CHANGES'}
              </button>
            </div>

            <div className="grid md:grid-cols-2 gap-x-12 gap-y-6">
              {config && Object.entries(config.page_weights).map(([page, w]) => (
                <div key={page} className="flex items-center justify-between group p-3 rounded-xl hover:bg-surface-50 transition-all">
                  <div className="flex flex-col">
                    <span className="text-xs font-bold text-surface-700 uppercase tracking-tighter">{page.split('/').pop() || 'landing'}</span>
                    <span className="text-[10px] text-surface-400 font-mono">{page}</span>
                  </div>
                  <input
                    type="number"
                    step="0.1"
                    value={w}
                    onChange={(e) => setConfig({...config, page_weights: {...config.page_weights, [page]: parseFloat(e.target.value)}})}
                    className="w-16 h-9 bg-surface-50 border border-surface-200 rounded-lg text-center text-xs font-bold text-primary-600 focus:border-primary-500 outline-none transition-colors"
                  />
                </div>
              ))}
            </div>
          </div>

          {/* Active Detectors */}
          <div className="bg-white border border-surface-100 rounded-2xl p-6 shadow-card">
            <h3 className="font-bold text-surface-900 mb-6 flex items-center gap-2 text-lg">
              <ShieldCheck className="w-5 h-5 text-accent-500" /> Cognitive Detectors
            </h3>
            <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-4">
              {config && Object.entries(config.detectors_enabled).map(([detector, enabled]) => (
                <label key={detector} className={`flex items-center justify-between p-4 rounded-xl border cursor-pointer transition-all ${enabled ? 'bg-accent-50 border-accent-200 text-accent-700' : 'bg-surface-50 border-surface-100 text-surface-400'}`}>
                  <span className="text-[10px] font-bold uppercase tracking-widest">{detector.replace(/_/g, ' ')}</span>
                  <input
                    type="checkbox"
                    checked={enabled}
                    onChange={(e) => setConfig({...config, detectors_enabled: {...config.detectors_enabled, [detector]: e.target.checked}})}
                    className="w-4 h-4 rounded border-surface-200 bg-white text-accent-500 focus:ring-accent-500"
                  />
                </label>
              ))}
            </div>
          </div>
        </div>

        {/* Sidebar Column */}
        <div className="space-y-8">
          {/* Thresholds */}
          <div className="bg-white border border-surface-100 rounded-2xl p-6 shadow-card">
            <h3 className="font-bold text-surface-900 mb-6 flex items-center gap-2">
              <Settings className="w-5 h-5 text-surface-400" /> Sensitivity Thresholds
            </h3>
            <div className="space-y-6">
              {config && Object.entries(config.score_thresholds).map(([key, val]) => (
                <div key={key} className="space-y-3">
                  <div className="flex justify-between text-[10px] font-bold">
                    <span className="text-surface-500 uppercase tracking-widest">{key.replace(/_/g, ' ')}</span>
                    <span className="text-primary-600">{val}</span>
                  </div>
                  <input
                    type="range"
                    min="0"
                    max="200"
                    value={val}
                    onChange={(e) => setConfig({...config, score_thresholds: {...config.score_thresholds, [key]: parseFloat(e.target.value)}})}
                    className="w-full h-1.5 bg-surface-100 rounded-lg appearance-none cursor-pointer accent-primary-500"
                  />
                </div>
              ))}
            </div>
          </div>

          {/* Training Info */}
          <div className="bg-gradient-to-br from-primary-600 to-primary-500 rounded-2xl p-6 shadow-glow text-white relative overflow-hidden">
            <Zap className="absolute -right-4 -bottom-4 w-32 h-32 text-white/10 -rotate-12" />
            <h3 className="font-bold mb-4 flex items-center gap-2 relative z-10">
              <Cpu className="w-5 h-5" /> Model Lifecycle
            </h3>
            <p className="text-sm text-primary-100 mb-6 relative z-10 leading-relaxed">
              Global ML models are updated periodically using cross-session anonymized behavioral data. Training improves persona clustering and conversion probability accuracy.
            </p>
            <div className="space-y-3 relative z-10">
              <div className="flex items-center justify-between text-xs font-bold">
                <span className="text-primary-200 uppercase tracking-tighter">Last Train</span>
                <span>{lastTrain?.timestamp ? formatTimeAgo(lastTrain.timestamp) : 'Never'}</span>
              </div>
              <div className="flex items-center justify-between text-xs font-bold">
                <span className="text-primary-200 uppercase tracking-tighter">Sessions Used</span>
                <span>{lastTrain?.sessionCount ?? '—'}</span>
              </div>
              <div className="flex items-center justify-between text-xs font-bold">
                <span className="text-primary-200 uppercase tracking-tighter">Conversion Model</span>
                <span>{lastTrain?.convStatus ?? '—'}</span>
              </div>
              <div className="flex items-center justify-between text-xs font-bold">
                <span className="text-primary-200 uppercase tracking-tighter">Segmentation</span>
                <span>{lastTrain?.segStatus ?? '—'}</span>
              </div>
            </div>
          </div>

          <div className="p-4 bg-amber-50 border border-amber-200 rounded-xl flex items-start gap-3">
            <AlertTriangle className="w-5 h-5 text-amber-500 shrink-0" />
            <p className="text-[10px] text-amber-700 leading-normal">
              <strong>Warning:</strong> Modifying behavioral weights and thresholds directly affects real-time intent classification and re-engagement triggers.
            </p>
          </div>
        </div>
      </div>
    </div>
  );
}
