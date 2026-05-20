import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { motion } from 'framer-motion';
import {
  GitBranch, ArrowRight, Map, Globe, Navigation,
  ChevronRight, TrendingUp, Users, Clock, Activity
} from 'lucide-react';
import { engineApi } from '../utils/apiBase';

const sentimentClass = (sentiment) => {
  if (sentiment === 'High Intent') return 'bg-accent-50 text-accent-700';
  if (sentiment === 'Friction') return 'bg-red-50 text-red-600';
  if (sentiment === 'Hesitant') return 'bg-amber-50 text-amber-700';
  return 'bg-primary-50 text-primary-700';
};

export default function PathDiscovery() {
  const navigate = useNavigate();
  const [paths, setPaths] = useState([]);
  const [summary, setSummary] = useState(null);
  const [activePath, setActivePath] = useState(null);
  const [loading, setLoading] = useState(true);

  const fetchPaths = async () => {
    try {
      const res = await fetch(engineApi('/admin/analytics/navigation-paths'));
      if (!res.ok) return;

      const payload = await res.json();
      const nextPaths = payload.paths || [];
      setPaths(nextPaths);
      setSummary(payload.summary || null);
      setActivePath((current) => {
        if (!nextPaths.length) return null;
        return nextPaths.find((path) => path.id === current?.id) || nextPaths[0];
      });
    } catch (error) {
      console.error('Failed to fetch navigation paths:', error);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchPaths();
    const interval = setInterval(fetchPaths, 5000);
    return () => clearInterval(interval);
  }, []);

  return (
    <div className="space-y-8 pb-20">
      <div className="flex flex-col gap-4 xl:flex-row xl:items-start xl:justify-between">
        <div>
          <h1 className="text-2xl font-bold text-surface-900">Path Discovery</h1>
          <p className="text-surface-500 mt-1 text-sm">Common user navigation sequences mined from live session telemetry</p>
        </div>
        <div className="grid grid-cols-2 gap-3 md:flex">
          {[
            ['Sessions', summary?.total_sessions || 0],
            ['Unique Paths', summary?.unique_paths || 0],
            ['Avg Conversion', `${summary?.avg_conversion_rate || 0}%`],
          ].map(([label, value]) => (
            <div key={label} className="px-4 py-2 bg-white border border-surface-100 rounded-xl shadow-sm">
              <p className="text-[10px] font-black text-surface-400 uppercase tracking-widest">{label}</p>
              <p className="text-sm font-black text-surface-900 mt-1">{value}</p>
            </div>
          ))}
          <div className="px-4 py-2 bg-accent-50 border border-accent-200 rounded-xl flex items-center gap-2">
            <Clock className="w-4 h-4 text-accent-600" />
            <span className="text-xs font-bold text-accent-700 uppercase tracking-widest">Live</span>
          </div>
        </div>
      </div>

      <div className="grid lg:grid-cols-3 gap-8">
        <div className="lg:col-span-1 space-y-4">
          <h3 className="text-xs font-black text-surface-400 uppercase tracking-widest mb-4 flex items-center gap-2">
            <Navigation className="w-4 h-4" /> Top Navigation Paths
          </h3>
          {paths.map((path) => (
            <button
              key={path.id}
              onClick={() => setActivePath(path)}
              className={`w-full p-6 rounded-2xl border text-left transition-all ${activePath?.id === path.id ? 'bg-primary-50 border-primary-200 shadow-glow' : 'bg-white border-surface-100 hover:border-surface-200 shadow-card'}`}
            >
              <div className="flex justify-between items-center mb-3">
                <span className={`px-2 py-0.5 rounded-full text-[10px] font-black uppercase ${sentimentClass(path.sentiment)}`}>
                  {path.sentiment}
                </span>
                <span className="text-sm font-black text-surface-900">{path.frequencyLabel}</span>
              </div>
              <div className="flex items-center gap-2 text-surface-500 text-xs font-bold overflow-hidden whitespace-nowrap overflow-ellipsis">
                {path.nodes.join(' -> ')}
              </div>
              <div className="mt-4 flex items-center justify-between text-[10px] font-black text-surface-400 uppercase tracking-tighter">
                <span className="flex items-center gap-1"><Users className="w-3 h-3" /> {path.users} Users</span>
                <span className="flex items-center gap-1"><Clock className="w-3 h-3" /> {path.timeSpent}</span>
              </div>
            </button>
          ))}

          {paths.length === 0 && !loading && (
            <div className="p-8 rounded-2xl border border-dashed border-surface-200 bg-white text-center">
              <Navigation className="w-10 h-10 text-surface-200 mx-auto mb-3" />
              <p className="text-sm text-surface-400 italic">No navigation paths captured yet.</p>
            </div>
          )}
        </div>

        <div className="lg:col-span-2 space-y-6">
          <div className="bg-white border border-surface-100 rounded-2xl p-8 h-full flex flex-col min-h-[500px] shadow-card">
            <div className="flex justify-between items-center mb-12">
              <h3 className="font-bold text-surface-900 text-xl flex items-center gap-2">
                <GitBranch className="w-6 h-6 text-primary-500" /> Path Visualizer
              </h3>
              <div className="flex items-center gap-2 rounded-xl border border-surface-100 bg-surface-50 px-3 py-2">
                <Activity className="w-4 h-4 text-accent-500" />
                <span className="text-[10px] font-black text-surface-500 uppercase tracking-widest">
                  {activePath ? `${activePath.conversionRate}% Convert` : 'Awaiting Data'}
                </span>
              </div>
            </div>

            <div className="flex-1 flex items-center justify-center relative overflow-x-auto overflow-y-hidden">
              {activePath ? (
                <div className="flex items-center gap-6 relative z-10 min-w-max px-4">
                  {activePath.nodes.map((node, idx) => {
                    const edge = activePath.edges?.[idx];

                    return (
                      <div key={`${node}-${idx}`} className="flex items-center gap-6">
                        <motion.div
                          initial={{ opacity: 0, scale: 0.8 }}
                          animate={{ opacity: 1, scale: 1 }}
                          className="w-32 h-32 rounded-2xl bg-surface-50 border border-surface-100 flex flex-col items-center justify-center p-4 text-center shadow-card group hover:border-primary-300 hover:shadow-glow transition-all cursor-pointer"
                        >
                          <div className="w-10 h-10 rounded-xl bg-primary-50 flex items-center justify-center mb-3 text-primary-500 group-hover:scale-110 transition-transform">
                            {idx === 0 && <Globe className="w-5 h-5" />}
                            {idx > 0 && idx < activePath.nodes.length - 1 && <Map className="w-5 h-5" />}
                            {idx === activePath.nodes.length - 1 && <TrendingUp className="w-5 h-5" />}
                          </div>
                          <span className="text-[10px] font-black text-surface-700 uppercase tracking-widest">{node}</span>
                        </motion.div>
                        {idx < activePath.nodes.length - 1 && (
                          <div className="flex flex-col items-center gap-1">
                            <ArrowRight className="w-6 h-6 text-surface-300" />
                            <span className="text-[8px] font-black text-surface-400 uppercase tracking-tighter">
                              {edge?.rate || 0}%
                            </span>
                          </div>
                        )}
                      </div>
                    );
                  })}
                </div>
              ) : (
                <div className="text-center text-surface-300">
                  <GitBranch className="w-14 h-14 mx-auto mb-4 opacity-30" />
                  <p className="text-sm italic">Waiting for page-view events.</p>
                </div>
              )}

              <div className="absolute inset-0 flex items-center justify-center pointer-events-none opacity-10">
                <div className="w-full h-px bg-gradient-to-r from-transparent via-primary-300 to-transparent" />
              </div>
            </div>

            <div className="mt-12 p-6 rounded-2xl bg-surface-50 border border-surface-100 flex flex-col gap-4 md:flex-row md:items-center md:justify-between">
              <div className="flex items-center gap-4">
                <div className="w-10 h-10 rounded-xl bg-accent-50 text-accent-600 flex items-center justify-center">
                  <TrendingUp className="w-5 h-5" />
                </div>
                <div>
                  <p className="text-sm font-bold text-surface-900">Conversion Efficiency</p>
                  <p className="text-xs text-surface-500">
                    {activePath
                      ? `${activePath.conversionLift >= 0 ? '+' : ''}${activePath.conversionLift}% versus the live average. Avg score ${activePath.avgScore}.`
                      : 'Live conversion comparison will appear once sessions arrive.'}
                  </p>
                </div>
              </div>
              <button onClick={() => navigate('/events')} className="text-xs font-black text-primary-600 uppercase tracking-widest flex items-center gap-1 hover:gap-2 transition-all">
                Analyze Node Data <ChevronRight className="w-4 h-4" />
              </button>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
