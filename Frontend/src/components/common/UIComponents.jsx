import { useEffect, useRef, useState } from 'react';
import { motion } from 'framer-motion';

export function AnimatedCounter({ end, duration = 2, prefix = '', suffix = '', decimals = 0 }) {
  const [count, setCount] = useState(0);
  const ref = useRef(null);
  const started = useRef(false);

  useEffect(() => {
    let rafId = null;
    const observer = new IntersectionObserver(([entry]) => {
      if (entry.isIntersecting && !started.current) {
        started.current = true;
        const start = 0;
        const startTime = performance.now();
        const animate = (currentTime) => {
          const elapsed = (currentTime - startTime) / 1000;
          const progress = Math.min(elapsed / duration, 1);
          const eased = 1 - Math.pow(1 - progress, 3);
          setCount(start + (end - start) * eased);
          if (progress < 1) rafId = requestAnimationFrame(animate);
        };
        rafId = requestAnimationFrame(animate);
      }
    }, { threshold: 0.3 });

    if (ref.current) observer.observe(ref.current);
    return () => {
      if (rafId) cancelAnimationFrame(rafId);
      observer.disconnect();
    };
  }, [end, duration]);

  return (
    <span ref={ref}>
      {prefix}{decimals > 0 ? count.toFixed(decimals) : Math.round(count).toLocaleString('en-IN')}{suffix}
    </span>
  );
}

export function KPICard({ icon: Icon, label, value, change, changeType = 'positive', prefix = '' }) {
  return (
    <motion.div initial={{ opacity: 0, y: 20 }} whileInView={{ opacity: 1, y: 0 }} viewport={{ once: true }}
      className="kpi-card group">
      <div className="flex items-start justify-between mb-3">
        <div className={`p-2.5 rounded-xl ${changeType === 'positive' ? 'bg-accent-50' : changeType === 'negative' ? 'bg-red-50' : 'bg-primary-50'}`}>
          <Icon className={`w-5 h-5 ${changeType === 'positive' ? 'text-accent-600' : changeType === 'negative' ? 'text-red-500' : 'text-primary-600'}`} />
        </div>
        {change && (
          <span className={`text-xs font-semibold px-2 py-1 rounded-full ${
            changeType === 'positive' ? 'text-accent-700 bg-accent-50' : 'text-red-700 bg-red-50'
          }`}>
            {changeType === 'positive' ? '+' : ''}{change}
          </span>
        )}
      </div>
      <p className="text-2xl font-bold text-surface-900 mb-1">{prefix}{value}</p>
      <p className="text-sm text-surface-500">{label}</p>
    </motion.div>
  );
}

export function LoadingSkeleton({ className = '', lines = 3 }) {
  return (
    <div className={`animate-pulse space-y-3 ${className}`}>
      {Array.from({ length: lines }).map((_, i) => (
        <div key={i} className={`h-4 bg-surface-200 rounded-lg ${i === lines - 1 ? 'w-2/3' : 'w-full'}`} />
      ))}
    </div>
  );
}

export function SkeletonCard() {
  return (
    <div className="bg-white rounded-2xl p-6 shadow-card border border-surface-100 animate-pulse">
      <div className="flex items-center gap-3 mb-4">
        <div className="w-10 h-10 rounded-xl bg-surface-200" />
        <div className="flex-1 space-y-2">
          <div className="h-4 bg-surface-200 rounded w-2/3" />
          <div className="h-3 bg-surface-100 rounded w-1/3" />
        </div>
      </div>
      <div className="h-8 bg-surface-200 rounded w-1/2 mb-2" />
      <div className="h-3 bg-surface-100 rounded w-1/4" />
    </div>
  );
}

export function EmptyState({ icon: Icon, title, description, action }) {
  return (
    <div className="flex flex-col items-center justify-center py-16 text-center">
      <div className="w-16 h-16 rounded-2xl bg-surface-100 flex items-center justify-center mb-4">
        <Icon className="w-8 h-8 text-surface-400" />
      </div>
      <h3 className="text-lg font-semibold text-surface-900 mb-2">{title}</h3>
      <p className="text-sm text-surface-500 max-w-md mb-6">{description}</p>
      {action}
    </div>
  );
}

export function ProgressBar({ value, max = 100, color = 'primary', size = 'md' }) {
  const percentage = Math.min((value / max) * 100, 100);
  const heightClass = size === 'sm' ? 'h-1.5' : size === 'lg' ? 'h-3' : 'h-2';
  const colorClass = {
    primary: 'bg-primary-500',
    accent: 'bg-accent-500',
    warning: 'bg-amber-500',
    danger: 'bg-red-500',
  }[color] || 'bg-primary-500';

  return (
    <div className={`w-full bg-surface-100 rounded-full ${heightClass} overflow-hidden`}>
      <motion.div initial={{ width: 0 }} whileInView={{ width: `${percentage}%` }} viewport={{ once: true }}
        transition={{ duration: 1, ease: 'easeOut' }}
        className={`${heightClass} ${colorClass} rounded-full`} />
    </div>
  );
}
