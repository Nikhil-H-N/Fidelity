import { useState, useEffect } from 'react';
import { engineApi } from '../utils/apiBase';

const ICONS = {
  activity: (
    <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
      <path strokeLinecap="round" strokeLinejoin="round" d="M22 12h-4l-3 9L9 3l-3 9H2" />
    </svg>
  ),
  users: (
    <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
      <path strokeLinecap="round" strokeLinejoin="round" d="M17 20h5v-2a3 3 0 00-5.356-1.857M17 20H7m10 0v-2c0-.656-.126-1.283-.356-1.857M7 20H2v-2a3 3 0 015.356-1.857M7 20v-2c0-.656.126-1.283.356-1.857m0 0a5.002 5.002 0 019.288 0M15 7a3 3 0 11-6 0 3 3 0 016 0z" />
    </svg>
  ),
  'trending-up': (
    <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
      <path strokeLinecap="round" strokeLinejoin="round" d="M13 7h8m0 0v8m0-8l-8 8-4-4-6 6" />
    </svg>
  ),
  'alert-triangle': (
    <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
      <path strokeLinecap="round" strokeLinejoin="round" d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-2.5L13.732 4.5c-.77-.833-2.694-.833-3.464 0L3.34 16.5c-.77.833.192 2.5 1.732 2.5z" />
    </svg>
  ),
  pause: (
    <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
      <path strokeLinecap="round" strokeLinejoin="round" d="M10 9v6m4-6v6m7-3a9 9 0 11-18 0 9 9 0 0118 0z" />
    </svg>
  ),
  map: (
    <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
      <path strokeLinecap="round" strokeLinejoin="round" d="M9 20l-5.447-2.724A1 1 0 013 16.382V5.618a1 1 0 011.447-.894L9 7m0 13l6-3m-6 3V7m6 10l4.553 2.276A1 1 0 0021 18.382V7.618a1 1 0 00-.553-.894L15 4m0 13V4m0 0L9 7" />
    </svg>
  ),
  clock: (
    <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
      <path strokeLinecap="round" strokeLinejoin="round" d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" />
    </svg>
  ),
  'x-circle': (
    <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
      <path strokeLinecap="round" strokeLinejoin="round" d="M10 14l2-2m0 0l2-2m-2 2l-2-2m2 2l2 2m7-2a9 9 0 11-18 0 9 9 0 0118 0z" />
    </svg>
  ),
  zap: (
    <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
      <path strokeLinecap="round" strokeLinejoin="round" d="M13 10V3L4 14h7v7l9-11h-7z" />
    </svg>
  ),
  'bar-chart': (
    <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
      <path strokeLinecap="round" strokeLinejoin="round" d="M9 19v-6a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2a2 2 0 002-2zm0 0V9a2 2 0 012-2h2a2 2 0 012 2v10m-6 0a2 2 0 002 2h2a2 2 0 002-2m0 0V5a2 2 0 012-2h2a2 2 0 012 2v14a2 2 0 01-2 2h-2a2 2 0 01-2-2z" />
    </svg>
  ),
  target: (
    <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
      <path strokeLinecap="round" strokeLinejoin="round" d="M9 12l2 2 4-4m5.618-4.016A11.955 11.955 0 0112 2.944a11.955 11.955 0 01-8.618 3.04A12.02 12.02 0 003 9c0 5.591 3.824 10.29 9 11.622 5.176-1.332 9-6.03 9-11.622 0-1.042-.133-2.052-.382-3.016z" />
    </svg>
  ),
};

const SEVERITY_STYLES = {
  success: { bg: 'bg-emerald-50', border: 'border-emerald-200', icon: 'from-emerald-500 to-teal-600', badge: 'bg-emerald-100 text-emerald-700', dot: 'bg-emerald-500' },
  warning: { bg: 'bg-amber-50', border: 'border-amber-200', icon: 'from-amber-500 to-orange-600', badge: 'bg-amber-100 text-amber-700', dot: 'bg-amber-500' },
  danger: { bg: 'bg-red-50', border: 'border-red-200', icon: 'from-red-500 to-pink-600', badge: 'bg-red-100 text-red-700', dot: 'bg-red-500' },
  info: { bg: 'bg-blue-50', border: 'border-blue-200', icon: 'from-indigo-500 to-purple-600', badge: 'bg-blue-100 text-blue-700', dot: 'bg-blue-500' },
};

const GRADIENTS = [
  'from-indigo-500 to-purple-600',
  'from-emerald-500 to-teal-600',
  'from-amber-500 to-orange-600',
  'from-red-500 to-pink-600',
  'from-blue-500 to-cyan-600',
  'from-violet-500 to-fuchsia-600',
];

const KPICard = ({ label, value, suffix, color, icon }) => (
  <div className="bg-white border border-surface-100 rounded-2xl p-5 shadow-sm hover:shadow-md transition-shadow">
    <div className="flex items-center justify-between mb-3">
      <span className="text-[10px] font-bold uppercase tracking-widest text-surface-400">{label}</span>
      <div className={`w-8 h-8 rounded-xl bg-gradient-to-br ${color} text-white flex items-center justify-center`}>
        {icon}
      </div>
    </div>
    <div className="flex items-baseline gap-1">
      <span className="text-2xl font-black text-surface-900">{value}</span>
      {suffix && <span className="text-sm font-medium text-surface-400">{suffix}</span>}
    </div>
  </div>
);

const InsightCard = ({ insight, index }) => {
  const [expanded, setExpanded] = useState(false);
  const severity = SEVERITY_STYLES[insight.severity] || SEVERITY_STYLES.info;
  const gradient = GRADIENTS[index % GRADIENTS.length];

  return (
    <div className={`rounded-2xl border ${severity.border} ${severity.bg} p-5 hover:shadow-md transition-all cursor-pointer`}
      onClick={() => setExpanded(!expanded)}>
      <div className="flex items-start gap-4">
        <div className={`w-11 h-11 rounded-xl bg-gradient-to-br ${gradient} text-white flex items-center justify-center shrink-0 shadow-lg`}>
          {ICONS[insight.icon] || ICONS.activity}
        </div>
        <div className="flex-1 min-w-0">
          <div className="flex items-center gap-2 mb-1">
            <span className={`text-[10px] font-bold uppercase tracking-widest ${severity.badge} px-2 py-0.5 rounded-full`}>
              {insight.category}
            </span>
            <div className={`w-1.5 h-1.5 rounded-full ${severity.dot}`} />
          </div>
          <p className="text-sm font-bold text-surface-900 mt-1">{insight.title}</p>
          <p className="text-xs text-surface-500 mt-1">{insight.detail}</p>
        </div>
      </div>

      {/* Data table */}
      {expanded && insight.data && (
        <div className="mt-4 space-y-2">
          {typeof insight.data === 'object' && !Array.isArray(insight.data) && (
            <div className="grid grid-cols-2 gap-2">
              {Object.entries(insight.data).slice(0, 8).map(([key, val]) => (
                <div key={key} className="flex items-center justify-between text-xs bg-white/60 rounded-lg px-3 py-2">
                  <span className="text-surface-600 truncate">{key.replace(/_/g, ' ')}</span>
                  <span className="font-bold text-surface-900 ml-2">{val}</span>
                </div>
              ))}
            </div>
          )}
          {Array.isArray(insight.data) && insight.data.length > 0 && (
            <div className="space-y-1.5">
              {insight.data.slice(0, 5).map((item, j) => (
                <div key={j} className="flex items-center justify-between text-xs bg-white/60 rounded-lg px-3 py-2">
                  <span className="text-surface-600 truncate">{item.email || item.state || item}</span>
                  <span className="font-bold text-surface-900 ml-2">
                    {item.score || item.churn || item.probability || ''}
                  </span>
                </div>
              ))}
            </div>
          )}
          {insight.action && (
            <div className="mt-3 p-3 bg-white/80 rounded-xl border border-surface-100">
              <p className="text-[10px] font-bold uppercase tracking-widest text-surface-400 mb-1">Recommended Action</p>
              <p className="text-xs text-surface-700">{insight.action}</p>
            </div>
          )}
        </div>
      )}
    </div>
  );
};

export default function AIInsights() {
  const [data, setData] = useState(null);
  const [loading, setLoading] = useState(true);
  const [lastUpdated, setLastUpdated] = useState(null);

  useEffect(() => {
    const fetchInsights = async () => {
      try {
        const res = await fetch(engineApi('/admin/ai-insights'));
        if (res.ok) {
          const json = await res.json();
          setData(json);
          setLastUpdated(new Date());
        }
      } catch (err) {
        console.error('[AIInsights] Fetch error:', err);
      } finally {
        setLoading(false);
      }
    };

    fetchInsights();
    const interval = setInterval(fetchInsights, 15000);
    return () => clearInterval(interval);
  }, []);

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="w-8 h-8 border-3 border-indigo-200 border-t-indigo-600 rounded-full animate-spin" />
      </div>
    );
  }

  const insights = data?.insights || [];
  const kpis = data?.kpis || {};

  return (
    <div className="space-y-8">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-surface-900">AI Insights</h1>
          <p className="text-sm text-surface-500 mt-1">
            Behavioral intelligence powered by real-time analysis
          </p>
        </div>
        <div className="flex items-center gap-3">
          {lastUpdated && (
            <span className="text-[10px] font-medium text-surface-400">
              Updated {lastUpdated.toLocaleTimeString()}
            </span>
          )}
          <div className="flex items-center gap-2 px-4 py-2 rounded-xl bg-emerald-50 border border-emerald-200">
            <div className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse" />
            <span className="text-sm font-medium text-emerald-700">
              {data?.total_sessions || 0} active sessions
            </span>
          </div>
        </div>
      </div>

      {/* KPI Cards */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        <KPICard label="Total Sessions" value={kpis.total_sessions || 0} color="from-indigo-500 to-purple-600"
          icon={<svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}><path strokeLinecap="round" strokeLinejoin="round" d="M9 19v-6a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2a2 2 0 002-2zm0 0V9a2 2 0 012-2h2a2 2 0 012 2v10m-6 0a2 2 0 002 2h2a2 2 0 002-2m0 0V5a2 2 0 012-2h2a2 2 0 012 2v14a2 2 0 01-2 2h-2a2 2 0 01-2-2z" /></svg>} />
        <KPICard label="Avg Intent Score" value={kpis.avg_intent_score || 0} suffix="/100" color="from-emerald-500 to-teal-600"
          icon={<svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}><path strokeLinecap="round" strokeLinejoin="round" d="M13 7h8m0 0v8m0-8l-8 8-4-4-6 6" /></svg>} />
        <KPICard label="Avg Session" value={kpis.avg_session_minutes || 0} suffix="min" color="from-amber-500 to-orange-600"
          icon={<svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}><path strokeLinecap="round" strokeLinejoin="round" d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" /></svg>} />
        <KPICard label="Conversion Rate" value={kpis.conversion_rate || 0} suffix="%" color="from-blue-500 to-cyan-600"
          icon={<svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}><path strokeLinecap="round" strokeLinejoin="round" d="M9 12l2 2 4-4m5.618-4.016A11.955 11.955 0 0112 2.944a11.955 11.955 0 01-8.618 3.04A12.02 12.02 0 003 9c0 5.591 3.824 10.29 9 11.622 5.176-1.332 9-6.03 9-11.622 0-1.042-.133-2.052-.382-3.016z" /></svg>} />
      </div>

      {/* Summary */}
      {data?.summary && (
        <div className="rounded-2xl bg-gradient-to-r from-indigo-500 to-purple-600 p-6 text-white shadow-xl">
          <div className="flex items-center gap-2 mb-2">
            <svg className="w-5 h-5 opacity-80" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
              <path strokeLinecap="round" strokeLinejoin="round" d="M9.663 17h4.673M12 3v1m6.364 1.636l-.707.707M21 12h-1M4 12H3m3.343-5.657l-.707-.707m2.828 9.9a5 5 0 117.072 0l-.548.547A3.374 3.374 0 0014 18.469V19a2 2 0 11-4 0v-.531c0-.895-.356-1.754-.988-2.386l-.548-.547z" />
            </svg>
            <span className="text-sm font-bold uppercase tracking-widest opacity-80">AI Summary</span>
          </div>
          <p className="text-lg font-semibold">{data.summary}</p>
        </div>
      )}

      {/* Insight Cards */}
      {insights.length === 0 ? (
        <div className="text-center py-16 text-surface-400">
          <svg className="w-16 h-16 mx-auto mb-4 opacity-30" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1}>
            <path strokeLinecap="round" strokeLinejoin="round" d="M9.663 17h4.673M12 3v1m6.364 1.636l-.707.707M21 12h-1M4 12H3m3.343-5.657l-.707-.707m2.828 9.9a5 5 0 117.072 0l-.548.547A3.374 3.374 0 0014 18.469V19a2 2 0 11-4 0v-.531c0-.895-.356-1.754-.988-2.386l-.548-.547z" />
          </svg>
          <p className="text-lg font-semibold">No insights available yet</p>
          <p className="text-sm mt-1">Waiting for user activity data</p>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          {insights.map((insight, i) => (
            <InsightCard key={i} insight={insight} index={i} />
          ))}
        </div>
      )}
    </div>
  );
}
