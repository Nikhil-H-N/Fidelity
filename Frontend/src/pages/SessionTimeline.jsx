import { motion } from 'framer-motion';
import { Clock, Eye, MousePointerClick, Activity, FormInput, Navigation, CheckCircle2 } from 'lucide-react';
import { sessionTimeline } from '../data/mockData';
import { usePageTracking } from '../hooks/useTracking';

const iconMap = {
  session: Clock, scroll: Activity, click: MousePointerClick,
  navigation: Navigation, form: FormInput, conversion: CheckCircle2,
};
const colorMap = {
  session: 'bg-surface-100 text-surface-600', scroll: 'bg-purple-50 text-purple-600',
  click: 'bg-blue-50 text-blue-600', navigation: 'bg-primary-50 text-primary-600',
  form: 'bg-amber-50 text-amber-600', conversion: 'bg-accent-50 text-accent-600',
};

export default function SessionTimeline() {
  usePageTracking('session-timeline');

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold text-surface-900">Session Timeline</h1>
        <p className="text-surface-500 text-sm mt-1">Detailed user session replay</p>
      </div>

      <div className="bg-white rounded-2xl p-6 shadow-card border border-surface-100">
        <div className="flex items-center gap-3 mb-6 p-4 rounded-xl bg-surface-50">
          <div className="w-10 h-10 rounded-full bg-gradient-to-br from-primary-500 to-accent-500 flex items-center justify-center text-white font-bold text-sm">U</div>
          <div>
            <p className="font-semibold text-surface-900">user_4821 · Session #1284</p>
            <p className="text-sm text-surface-500">Duration: 3m 30s · 11 events · Mobile · Mumbai</p>
          </div>
        </div>

        <div className="relative">
          <div className="absolute left-6 top-0 bottom-0 w-0.5 bg-surface-200" />
          <div className="space-y-1">
            {sessionTimeline.map((event, i) => {
              const Icon = iconMap[event.type] || Eye;
              return (
                <motion.div key={i} initial={{ opacity: 0, x: -20 }} animate={{ opacity: 1, x: 0 }}
                  transition={{ delay: i * 0.08 }}
                  className="relative flex items-start gap-4 pl-2 py-3">
                  <div className={`w-9 h-9 rounded-xl flex items-center justify-center flex-shrink-0 z-10 ${colorMap[event.type]}`}>
                    <Icon className="w-4 h-4" />
                  </div>
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center justify-between">
                      <p className="text-sm font-medium text-surface-900">{event.action}</p>
                      <span className="text-xs text-surface-400 font-mono">{event.time}</span>
                    </div>
                    <p className="text-xs text-surface-500 mt-0.5">{event.page}</p>
                  </div>
                </motion.div>
              );
            })}
          </div>
        </div>
      </div>
    </div>
  );
}
