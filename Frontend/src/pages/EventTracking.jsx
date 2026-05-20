import { motion } from 'framer-motion';
import { Radio, Eye, MousePointerClick, Activity, FormInput, Zap, Download } from 'lucide-react';
import { liveEvents } from '../data/mockData';
import { usePageTracking } from '../hooks/useTracking';
import useStore from '../store/useStore';
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer } from 'recharts';

const eventTypeData = [
  { type: 'Page Views', count: 4521 },
  { type: 'Clicks', count: 2340 },
  { type: 'Scrolls', count: 1890 },
  { type: 'Form Starts', count: 856 },
  { type: 'Form Completes', count: 642 },
  { type: 'Abandons', count: 214 },
];

export default function EventTracking() {
  usePageTracking('event-tracking');
  const storeEvents = useStore(s => s.events);

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-surface-900">Event Tracking</h1>
          <p className="text-surface-500 text-sm mt-1">Monitor all tracked events in real-time</p>
        </div>
        <button className="btn-secondary text-sm py-2 px-4 gap-2">
          <Download className="w-4 h-4" /> Export
        </button>
      </div>

      <div className="grid lg:grid-cols-3 gap-6">
        <div className="lg:col-span-2 bg-white rounded-2xl p-6 shadow-card border border-surface-100">
          <h3 className="font-semibold text-surface-900 mb-4">Event Distribution</h3>
          <div className="h-64">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={eventTypeData}>
                <CartesianGrid strokeDasharray="3 3" stroke="#E2E8F0" />
                <XAxis dataKey="type" axisLine={false} tickLine={false} tick={{ fontSize: 11, fill: '#94A3B8' }} />
                <YAxis axisLine={false} tickLine={false} tick={{ fontSize: 11, fill: '#94A3B8' }} />
                <Tooltip contentStyle={{ borderRadius: '12px', border: '1px solid #E2E8F0' }} />
                <Bar dataKey="count" fill="#2E51F5" radius={[6, 6, 0, 0]} />
              </BarChart>
            </ResponsiveContainer>
          </div>
        </div>

        <div className="bg-white rounded-2xl p-6 shadow-card border border-surface-100">
          <h3 className="font-semibold text-surface-900 mb-4">Quick Stats</h3>
          <div className="space-y-4">
            {[
              { label: 'Total Events', value: '12,456', icon: Activity, color: 'text-primary-600 bg-primary-50' },
              { label: 'Unique Users', value: '3,842', icon: Eye, color: 'text-accent-600 bg-accent-50' },
              { label: 'Events/Session', value: '8.4', icon: Zap, color: 'text-amber-600 bg-amber-50' },
              { label: 'Abandonment', value: '24.9%', icon: FormInput, color: 'text-red-600 bg-red-50' },
            ].map(s => (
              <div key={s.label} className="flex items-center gap-3 p-3 rounded-xl bg-surface-50">
                <div className={`w-10 h-10 rounded-xl flex items-center justify-center ${s.color}`}>
                  <s.icon className="w-5 h-5" />
                </div>
                <div>
                  <p className="text-lg font-bold text-surface-900">{s.value}</p>
                  <p className="text-xs text-surface-500">{s.label}</p>
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>

      <div className="bg-white rounded-2xl p-6 shadow-card border border-surface-100">
        <h3 className="font-semibold text-surface-900 mb-4 flex items-center gap-2">
          <Radio className="w-5 h-5 text-red-500 animate-pulse" /> Live Event Stream
        </h3>
        <div className="space-y-2 max-h-96 overflow-y-auto">
          {liveEvents.map((e, i) => (
            <motion.div key={e.id} initial={{ opacity: 0, x: -10 }} animate={{ opacity: 1, x: 0 }}
              transition={{ delay: i * 0.03 }}
              className="flex items-center justify-between p-3 rounded-xl bg-surface-50 hover:bg-surface-100 transition-colors text-sm">
              <div className="flex items-center gap-3">
                <div className={`w-2 h-2 rounded-full ${
                  e.event === 'form_abandon' ? 'bg-red-500' : 
                  e.event === 'button_click' ? 'bg-accent-500' : 'bg-primary-500'
                }`} />
                <span className="font-medium text-surface-900">
                  {e.event.replace(/_/g, ' ')}
                </span>
                <span className="text-surface-400">
                  {e.page || e.element || e.form || e.depth || ''}
                </span>
              </div>
              <div className="flex items-center gap-4 text-surface-400">
                <span>{e.user}</span>
                <span>{e.timestamp}</span>
              </div>
            </motion.div>
          ))}
        </div>
      </div>
    </div>
  );
}
