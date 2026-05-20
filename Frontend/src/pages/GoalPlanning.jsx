import { motion } from 'framer-motion';
import { Target, Plus, Home, GraduationCap, Plane, Shield, Umbrella } from 'lucide-react';
import { goals } from '../data/mockData';
import { formatCurrency } from '../utils/formatters';
import { ProgressBar } from '../components/common/UIComponents';
import { usePageTracking } from '../hooks/useTracking';

const iconMap = { Home, GraduationCap, Palmtree: Umbrella, Shield, Plane };

export default function GoalPlanning() {
  usePageTracking('goal-planning');

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div><h1 className="text-2xl font-bold text-surface-900">Goal Planning</h1><p className="text-surface-500 text-sm mt-1">Track and manage your financial goals</p></div>
        <button className="btn-primary text-sm py-2.5 px-5 gap-2"><Plus className="w-4 h-4" /> Add Goal</button>
      </div>

      <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-6">
        {goals.map((goal, i) => {
          const Icon = iconMap[goal.icon] || Target;
          const pct = Math.round((goal.current / goal.target) * 100);
          return (
            <motion.div key={goal.id} initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: i * 0.1 }}
              className="bg-white rounded-2xl p-6 shadow-card border border-surface-100 card-hover">
              <div className="flex items-center justify-between mb-4">
                <div className={`w-12 h-12 rounded-xl ${goal.onTrack ? 'bg-accent-50' : 'bg-amber-50'} flex items-center justify-center`}>
                  <Icon className={`w-6 h-6 ${goal.onTrack ? 'text-accent-600' : 'text-amber-600'}`} />
                </div>
                <span className={`text-xs font-semibold px-2.5 py-1 rounded-full ${goal.onTrack ? 'bg-accent-50 text-accent-700' : 'bg-amber-50 text-amber-700'}`}>
                  {goal.onTrack ? '✓ On Track' : '⚠ Behind'}
                </span>
              </div>
              <h3 className="text-lg font-bold text-surface-900 mb-1">{goal.name}</h3>
              <p className="text-sm text-surface-500 mb-4">Target by {goal.deadline}</p>
              <ProgressBar value={goal.current} max={goal.target} color={goal.onTrack ? 'accent' : 'warning'} />
              <div className="flex justify-between mt-2 text-sm">
                <span className="text-surface-500">{formatCurrency(goal.current, true)}</span>
                <span className="font-semibold text-surface-900">{formatCurrency(goal.target, true)}</span>
              </div>
              <div className="mt-4 pt-4 border-t border-surface-100 flex justify-between text-sm">
                <span className="text-surface-500">Monthly SIP</span>
                <span className="font-semibold text-primary-600">₹{goal.monthly.toLocaleString('en-IN')}</span>
              </div>
            </motion.div>
          );
        })}
      </div>
    </div>
  );
}
