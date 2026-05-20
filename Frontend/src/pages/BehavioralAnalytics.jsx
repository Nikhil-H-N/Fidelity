import { motion } from 'framer-motion';
import { Activity, Users, TrendingUp, Zap, Target, MousePointerClick, Timer, FormInput, Radio, Eye, BarChart3 } from 'lucide-react';
import { KPICard } from '../components/common/UIComponents';
import { conversionAnalytics, intentScores, funnelData, heatmapData, liveEvents } from '../data/mockData';
import { getStatusColor } from '../utils/formatters';
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer } from 'recharts';
import { usePageTracking } from '../hooks/useTracking';

export default function BehavioralAnalytics() {
  usePageTracking('behavioral-analytics');

  return (
    <div className="space-y-6">
      <div><h1 className="text-2xl font-bold text-surface-900">Behavioral Analytics</h1><p className="text-surface-500 text-sm mt-1">Smart behavioral tracking & re-engagement dashboard</p></div>

      {/* KPIs */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        <KPICard icon={Users} label="Active Users" value={conversionAnalytics.activeUsers.toLocaleString('en-IN')} change="+12.4%" changeType="positive" />
        <KPICard icon={Target} label="Conversion Rate" value={`${conversionAnalytics.conversionRate}%`} change="+2.3%" changeType="positive" />
        <KPICard icon={Timer} label="Avg Session" value={conversionAnalytics.avgSessionDuration} change="+18s" changeType="positive" />
        <KPICard icon={Eye} label="Bounce Rate" value={`${conversionAnalytics.bounceRate}%`} change="-3.2%" changeType="positive" />
      </div>

      <div className="grid lg:grid-cols-2 gap-6">
        {/* Funnel */}
        <div className="bg-white rounded-2xl p-6 shadow-card border border-surface-100">
          <h3 className="font-semibold text-surface-900 mb-4 flex items-center gap-2"><BarChart3 className="w-5 h-5 text-primary-600" /> Conversion Funnel</h3>
          <div className="space-y-3">
            {funnelData.map((stage, i) => (
              <div key={stage.stage}>
                <div className="flex items-center justify-between mb-1"><span className="text-sm font-medium text-surface-700">{stage.stage}</span>
                  <span className="text-sm text-surface-500">{stage.users.toLocaleString('en-IN')} ({stage.percentage}%)</span></div>
                <div className="w-full bg-surface-100 rounded-full h-6 overflow-hidden">
                  <motion.div initial={{ width: 0 }} whileInView={{ width: `${stage.percentage}%` }} viewport={{ once: true }} transition={{ duration: 0.8, delay: i * 0.1 }}
                    className="h-full rounded-full bg-gradient-to-r from-primary-500 to-primary-400 flex items-center justify-end pr-2">
                    {stage.percentage > 15 && <span className="text-[10px] font-bold text-white">{stage.percentage}%</span>}
                  </motion.div>
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* Intent Scores */}
        <div className="bg-white rounded-2xl p-6 shadow-card border border-surface-100">
          <h3 className="font-semibold text-surface-900 mb-4 flex items-center gap-2"><Zap className="w-5 h-5 text-amber-500" /> Intent Scoring</h3>
          <div className="space-y-3">
            {intentScores.map(user => (
              <div key={user.user} className="p-3 rounded-xl bg-surface-50 hover:bg-surface-100 transition-colors">
                <div className="flex items-center justify-between mb-1">
                  <span className="text-sm font-semibold text-surface-900">{user.user}</span>
                  <div className="flex items-center gap-2">
                    <span className="text-sm font-bold text-primary-600">{user.score}</span>
                    <span className={`px-2 py-0.5 rounded-full text-[10px] font-bold ${getStatusColor(user.status)}`}>{user.status}</span>
                  </div>
                </div>
                <div className="flex flex-wrap gap-1 mt-1">{user.signals.map(s => (
                  <span key={s} className="px-2 py-0.5 bg-white rounded-md text-[10px] text-surface-500 border border-surface-200">{s}</span>
                ))}</div>
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* Heatmap */}
      <div className="bg-white rounded-2xl p-6 shadow-card border border-surface-100">
        <h3 className="font-semibold text-surface-900 mb-4 flex items-center gap-2"><Activity className="w-5 h-5 text-accent-600" /> Activity Heatmap</h3>
        <div className="overflow-x-auto">
          <table className="w-full">
            <thead><tr><th className="px-3 py-2 text-xs text-surface-400"></th>
              {['Mon','Tue','Wed','Thu','Fri','Sat','Sun'].map(d => <th key={d} className="px-3 py-2 text-xs font-medium text-surface-500">{d}</th>)}
            </tr></thead>
            <tbody>{heatmapData.map(row => (
              <tr key={row.hour}><td className="px-3 py-2 text-xs font-medium text-surface-500">{row.hour}</td>
                {['Mon','Tue','Wed','Thu','Fri','Sat','Sun'].map(d => {
                  const v = row[d]; const intensity = Math.min(v / 95, 1);
                  return <td key={d} className="px-1 py-1"><div className="w-full h-10 rounded-lg flex items-center justify-center text-[10px] font-bold transition-all hover:scale-105"
                    style={{ backgroundColor: `rgba(46, 81, 245, ${0.05 + intensity * 0.8})`, color: intensity > 0.5 ? 'white' : '#475569' }}>{v}</div></td>;
                })}
              </tr>
            ))}</tbody>
          </table>
        </div>
      </div>

      {/* Live Events */}
      <div className="bg-white rounded-2xl p-6 shadow-card border border-surface-100">
        <h3 className="font-semibold text-surface-900 mb-4 flex items-center gap-2"><Radio className="w-5 h-5 text-red-500 animate-pulse" /> Live Events</h3>
        <div className="space-y-2">
          {liveEvents.map(e => (
            <motion.div key={e.id} initial={{ opacity: 0, x: -10 }} animate={{ opacity: 1, x: 0 }}
              className="flex items-center justify-between p-3 rounded-xl bg-surface-50 hover:bg-surface-100 transition-colors">
              <div className="flex items-center gap-3">
                <div className={`w-8 h-8 rounded-lg flex items-center justify-center ${
                  e.event === 'page_view' ? 'bg-blue-50 text-blue-600' :
                  e.event === 'button_click' ? 'bg-accent-50 text-accent-600' :
                  e.event === 'scroll_depth' ? 'bg-purple-50 text-purple-600' :
                  e.event === 'form_abandon' ? 'bg-red-50 text-red-600' :
                  'bg-surface-100 text-surface-500'
                }`}>
                  {e.event === 'page_view' ? <Eye className="w-4 h-4" /> :
                   e.event === 'button_click' ? <MousePointerClick className="w-4 h-4" /> :
                   e.event === 'scroll_depth' ? <Activity className="w-4 h-4" /> :
                   e.event === 'form_abandon' ? <FormInput className="w-4 h-4" /> :
                   <Zap className="w-4 h-4" />}
                </div>
                <div>
                  <p className="text-sm font-medium text-surface-900">{e.event.replace(/_/g, ' ')}</p>
                  <p className="text-xs text-surface-500">{e.page || e.element || e.form || e.depth || `Duration: ${e.duration}`}</p>
                </div>
              </div>
              <div className="text-right">
                <p className="text-xs text-surface-500">{e.user}</p>
                <p className="text-xs text-surface-400">{e.timestamp}</p>
              </div>
            </motion.div>
          ))}
        </div>
      </div>
    </div>
  );
}
