import { useEffect, useState } from 'react';
import { motion } from 'framer-motion';
import { Shield, Calculator, TrendingUp, Target, ArrowRight } from 'lucide-react';
import { AreaChart, Area, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer } from 'recharts';
import { usePageTracking } from '../hooks/useTracking';
import { queueEvent } from '../api/eventService';
import { formatCurrency } from '../utils/formatters';

export default function RetirementPlanning() {
  usePageTracking('retirement-planning');
  const [age, setAge] = useState(30);
  const [retireAge, setRetireAge] = useState(60);
  const [monthly, setMonthly] = useState(25000);
  const [existing, setExisting] = useState(500000);

  useEffect(() => {
    queueEvent({
      eventType: 'calculator_usage',
      page: '/retirement-planning',
      metadata: { calculator: 'retirement', age, retireAge, monthly, existing },
    });
  }, [age, retireAge, monthly, existing]);

  const years = retireAge - age;
  const rate = 0.12;
  const monthlyRate = rate / 12;
  const futureValue = monthly * ((Math.pow(1 + monthlyRate, years * 12) - 1) / monthlyRate) * (1 + monthlyRate);
  const existingFV = existing * Math.pow(1 + rate, years);
  const totalCorpus = futureValue + existingFV;

  const projectionData = Array.from({ length: years + 1 }, (_, i) => {
    const sipFV = monthly * ((Math.pow(1 + monthlyRate, i * 12) - 1) / monthlyRate) * (1 + monthlyRate);
    const exFV = existing * Math.pow(1 + rate, i);
    return { year: `Age ${age + i}`, corpus: Math.round(sipFV + exFV), invested: Math.round(monthly * 12 * i + existing) };
  });

  return (
    <div className="space-y-6">
      <div><h1 className="text-2xl font-bold text-surface-900">Retirement Planning</h1><p className="text-surface-500 text-sm mt-1">Calculate and plan for a worry-free retirement</p></div>

      <div className="grid lg:grid-cols-5 gap-6">
        <div className="lg:col-span-2 bg-white rounded-2xl p-6 shadow-card border border-surface-100 space-y-5">
          <h3 className="font-semibold text-surface-900 flex items-center gap-2"><Calculator className="w-5 h-5 text-primary-600" /> Calculator</h3>
          {[
            { label: 'Current Age', value: age, set: setAge, min: 18, max: 55, suffix: ' years' },
            { label: 'Retirement Age', value: retireAge, set: setRetireAge, min: 45, max: 70, suffix: ' years' },
            { label: 'Monthly Investment', value: monthly, set: setMonthly, min: 1000, max: 500000, suffix: '', format: true },
            { label: 'Existing Savings', value: existing, set: setExisting, min: 0, max: 10000000, suffix: '', format: true },
          ].map(({ label, value, set, min, max, suffix, format }) => (
            <div key={label}>
              <div className="flex justify-between mb-2"><label className="text-sm font-medium text-surface-700">{label}</label>
                <span className="text-sm font-semibold text-primary-600">{format ? formatCurrency(value) : `${value}${suffix}`}</span>
              </div>
              <input type="range" min={min} max={max} value={value} onChange={e => set(Number(e.target.value))}
                className="w-full h-2 bg-surface-200 rounded-full appearance-none cursor-pointer accent-primary-600" />
            </div>
          ))}
          <div className="pt-4 border-t border-surface-100">
            <p className="text-sm text-surface-500 mb-1">Estimated Retirement Corpus</p>
            <p className="text-3xl font-bold gradient-text">{formatCurrency(totalCorpus, true)}</p>
            <p className="text-xs text-surface-400 mt-1">at 12% expected annual return</p>
          </div>
        </div>

        <div className="lg:col-span-3 bg-white rounded-2xl p-6 shadow-card border border-surface-100">
          <h3 className="font-semibold text-surface-900 mb-4">Corpus Projection</h3>
          <div className="h-80">
            <ResponsiveContainer width="100%" height="100%">
              <AreaChart data={projectionData}>
                <defs>
                  <linearGradient id="corpusGrad" x1="0" y1="0" x2="0" y2="1"><stop offset="0%" stopColor="#2E51F5" stopOpacity={0.12} /><stop offset="100%" stopColor="#2E51F5" stopOpacity={0} /></linearGradient>
                  <linearGradient id="investedGrad" x1="0" y1="0" x2="0" y2="1"><stop offset="0%" stopColor="#10B981" stopOpacity={0.08} /><stop offset="100%" stopColor="#10B981" stopOpacity={0} /></linearGradient>
                </defs>
                <CartesianGrid strokeDasharray="3 3" stroke="#E2E8F0" />
                <XAxis dataKey="year" axisLine={false} tickLine={false} tick={{ fontSize: 10, fill: '#94A3B8' }} interval={Math.floor(years / 6)} />
                <YAxis axisLine={false} tickLine={false} tick={{ fontSize: 10, fill: '#94A3B8' }} tickFormatter={v => `₹${(v/100000).toFixed(0)}L`} />
                <Tooltip contentStyle={{ borderRadius: '12px', border: '1px solid #E2E8F0' }} formatter={v => [formatCurrency(v, true)]} />
                <Area type="monotone" dataKey="corpus" name="Corpus" stroke="#2E51F5" strokeWidth={2} fill="url(#corpusGrad)" />
                <Area type="monotone" dataKey="invested" name="Invested" stroke="#10B981" strokeWidth={1.5} fill="url(#investedGrad)" />
              </AreaChart>
            </ResponsiveContainer>
          </div>
        </div>
      </div>
    </div>
  );
}
