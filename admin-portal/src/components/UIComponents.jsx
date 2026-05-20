import { motion } from 'framer-motion';

export function KPICard({ icon: Icon, label, value, trend, color = "text-primary-500" }) {
  return (
    <div className="kpi-card">
      <div className="flex items-center justify-between mb-4">
        <div className={`p-2 rounded-xl bg-primary-50`}>
          <Icon className={`w-5 h-5 ${color}`} />
        </div>
        {trend && <span className={`text-[10px] font-bold ${trend.startsWith('-') ? 'text-red-500' : 'text-accent-600'}`}>{trend} {trend.startsWith('-') ? '↓' : '↑'}</span>}
      </div>
      <p className="text-[10px] font-bold text-surface-400 uppercase tracking-widest mb-1">{label}</p>
      <p className="text-2xl font-bold tracking-tight text-surface-900">{value}</p>
    </div>
  );
}

export function ProgressBar({ value, max = 100, label, percentage }) {
  const progress = Math.min((value / max) * 100, 100);

  return (
    <div>
      <div className="flex justify-between text-[10px] font-bold mb-1">
        <span className="uppercase text-surface-400">{label}</span>
        <span className="text-surface-700">{percentage || `${Math.round(progress)}%`}</span>
      </div>
      <div className="h-1.5 w-full bg-surface-100 rounded-full overflow-hidden">
        <motion.div initial={{ width: 0 }} animate={{ width: `${progress}%` }} className="h-full bg-primary-500" />
      </div>
    </div>
  );
}
