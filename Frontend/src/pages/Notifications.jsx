import { useState } from 'react';
import { motion } from 'framer-motion';
import { Bell, Check, CheckCheck, Trash2, TrendingUp, AlertTriangle, Brain, Settings } from 'lucide-react';
import { notifications } from '../data/mockData';
import { usePageTracking } from '../hooks/useTracking';

const iconMap = { investment: TrendingUp, alert: AlertTriangle, recommendation: Brain, system: Settings };
const colorMap = { investment: 'bg-accent-50 text-accent-600', alert: 'bg-amber-50 text-amber-600', recommendation: 'bg-primary-50 text-primary-600', system: 'bg-surface-100 text-surface-600' };

export default function Notifications() {
  usePageTracking('notifications');
  const [items, setItems] = useState(notifications);
  const [filter, setFilter] = useState('all');

  const filtered = filter === 'all' ? items : filter === 'unread' ? items.filter(n => !n.read) : items.filter(n => n.type === filter);

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-surface-900">Notifications</h1>
          <p className="text-surface-500 text-sm mt-1">{items.filter(n => !n.read).length} unread</p>
        </div>
        <button onClick={() => setItems(items.map(n => ({ ...n, read: true })))}
          className="btn-secondary text-sm py-2 px-4 gap-2"><CheckCheck className="w-4 h-4" /> Mark all read</button>
      </div>

      <div className="flex gap-2 overflow-x-auto pb-1">
        {['all', 'unread', 'investment', 'alert', 'recommendation', 'system'].map(t => (
          <button key={t} onClick={() => setFilter(t)}
            className={`px-4 py-2 rounded-lg text-sm font-medium whitespace-nowrap capitalize transition-colors ${
              filter === t ? 'bg-primary-600 text-white' : 'bg-white text-surface-600 border border-surface-200 hover:bg-surface-50'
            }`}>{t}</button>
        ))}
      </div>

      <div className="space-y-3">
        {filtered.map((n, i) => {
          const Icon = iconMap[n.type] || Bell;
          return (
            <motion.div key={n.id} initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: i * 0.05 }}
              className={`bg-white rounded-2xl p-5 shadow-soft border card-hover ${n.read ? 'border-surface-100' : 'border-primary-200 bg-primary-50/20'}`}>
              <div className="flex items-start gap-4">
                <div className={`w-10 h-10 rounded-xl flex items-center justify-center flex-shrink-0 ${colorMap[n.type]}`}>
                  <Icon className="w-5 h-5" />
                </div>
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-2">
                    <h3 className="font-semibold text-surface-900 text-sm">{n.title}</h3>
                    {!n.read && <div className="w-2 h-2 rounded-full bg-primary-500" />}
                  </div>
                  <p className="text-sm text-surface-600 mt-1">{n.message}</p>
                  <p className="text-xs text-surface-400 mt-2">{n.time}</p>
                </div>
              </div>
            </motion.div>
          );
        })}
      </div>
    </div>
  );
}
