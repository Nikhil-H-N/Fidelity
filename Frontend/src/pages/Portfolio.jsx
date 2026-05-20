import { motion } from 'framer-motion';
import { PieChart as PIcon, TrendingUp, TrendingDown, ArrowUpRight } from 'lucide-react';
import { portfolioSummary, portfolioAllocation, portfolioPerformance } from '../data/mockData';
import { formatCurrency, formatPercent } from '../utils/formatters';
import { AreaChart, Area, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, PieChart, Pie, Cell } from 'recharts';
import { KPICard } from '../components/common/UIComponents';
import { usePageTracking } from '../hooks/useTracking';

const holdings = [
  { name: 'Axis Bluechip Fund', units: 1250.34, nav: 48.52, invested: 50000, current: 60650, returns: 21.3 },
  { name: 'Parag Parikh Flexi Cap', units: 802.37, nav: 62.34, invested: 40000, current: 50020, returns: 25.05 },
  { name: 'SBI Small Cap Fund', units: 420.15, nav: 128.90, invested: 35000, current: 54157, returns: 54.7 },
  { name: 'HDFC Mid-Cap Opp.', units: 380.20, nav: 105.67, invested: 30000, current: 40175, returns: 33.9 },
  { name: 'Mirae Asset Large Cap', units: 650.80, nav: 82.15, invested: 45000, current: 53456, returns: 18.8 },
];

export default function Portfolio() {
  usePageTracking('portfolio');

  return (
    <div className="space-y-6">
      <div><h1 className="text-2xl font-bold text-surface-900">Portfolio</h1><p className="text-surface-500 text-sm mt-1">Your complete investment overview</p></div>

      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        <KPICard icon={PIcon} label="Total Value" value={formatCurrency(portfolioSummary.totalValue, true)} change={formatPercent(portfolioSummary.todayChangePercent)} changeType="positive" />
        <KPICard icon={TrendingUp} label="Total Returns" value={formatCurrency(portfolioSummary.totalReturns, true)} change={formatPercent(portfolioSummary.returnPercent)} changeType="positive" />
        <KPICard icon={ArrowUpRight} label="Invested" value={formatCurrency(portfolioSummary.totalInvested, true)} />
        <KPICard icon={TrendingUp} label="Today's P&L" value={formatCurrency(portfolioSummary.todayChange)} change={formatPercent(portfolioSummary.todayChangePercent)} changeType="positive" />
      </div>

      <div className="grid lg:grid-cols-3 gap-6">
        <div className="lg:col-span-2 bg-white rounded-2xl p-6 shadow-card border border-surface-100">
          <h3 className="font-semibold text-surface-900 mb-4">Portfolio Growth</h3>
          <div className="h-64">
            <ResponsiveContainer width="100%" height="100%">
              <AreaChart data={portfolioPerformance}>
                <defs><linearGradient id="portGrad" x1="0" y1="0" x2="0" y2="1"><stop offset="0%" stopColor="#2E51F5" stopOpacity={0.12} /><stop offset="100%" stopColor="#2E51F5" stopOpacity={0} /></linearGradient></defs>
                <CartesianGrid strokeDasharray="3 3" stroke="#E2E8F0" /><XAxis dataKey="month" axisLine={false} tickLine={false} tick={{ fontSize: 11, fill: '#94A3B8' }} /><YAxis hide />
                <Tooltip contentStyle={{ borderRadius: '12px', border: '1px solid #E2E8F0' }} formatter={v => [formatCurrency(v, true)]} />
                <Area type="monotone" dataKey="value" stroke="#2E51F5" strokeWidth={2} fill="url(#portGrad)" />
              </AreaChart>
            </ResponsiveContainer>
          </div>
        </div>
        <div className="bg-white rounded-2xl p-6 shadow-card border border-surface-100">
          <h3 className="font-semibold text-surface-900 mb-4">Allocation</h3>
          <div className="h-48"><ResponsiveContainer width="100%" height="100%"><PieChart><Pie data={portfolioAllocation} cx="50%" cy="50%" innerRadius={50} outerRadius={80} paddingAngle={3} dataKey="value">
            {portfolioAllocation.map((e, i) => <Cell key={i} fill={e.color} />)}</Pie><Tooltip formatter={v => [`${v}%`]} /></PieChart></ResponsiveContainer></div>
          <div className="space-y-2 mt-2">{portfolioAllocation.map(a => (
            <div key={a.name} className="flex items-center justify-between text-sm">
              <div className="flex items-center gap-2"><div className="w-3 h-3 rounded-full" style={{ backgroundColor: a.color }} /><span className="text-surface-600">{a.name}</span></div>
              <span className="font-semibold">{formatCurrency(a.amount, true)}</span>
            </div>
          ))}</div>
        </div>
      </div>

      {/* Holdings */}
      <div className="bg-white rounded-2xl shadow-card border border-surface-100 overflow-hidden">
        <div className="p-6 border-b border-surface-100"><h3 className="font-semibold text-surface-900">Holdings</h3></div>
        <div className="overflow-x-auto">
          <table className="w-full">
            <thead className="bg-surface-50"><tr>{['Fund Name', 'Units', 'NAV', 'Invested', 'Current', 'Returns'].map(h => (
              <th key={h} className="px-6 py-3 text-left text-xs font-semibold text-surface-500 uppercase tracking-wider">{h}</th>
            ))}</tr></thead>
            <tbody className="divide-y divide-surface-100">{holdings.map(h => (
              <tr key={h.name} className="hover:bg-surface-50 transition-colors">
                <td className="px-6 py-4 text-sm font-medium text-surface-900">{h.name}</td>
                <td className="px-6 py-4 text-sm text-surface-600">{h.units.toFixed(2)}</td>
                <td className="px-6 py-4 text-sm text-surface-600">₹{h.nav}</td>
                <td className="px-6 py-4 text-sm text-surface-600">{formatCurrency(h.invested)}</td>
                <td className="px-6 py-4 text-sm font-semibold text-surface-900">{formatCurrency(h.current)}</td>
                <td className="px-6 py-4"><span className="text-sm font-semibold text-accent-600">+{h.returns}%</span></td>
              </tr>
            ))}</tbody>
          </table>
        </div>
      </div>
    </div>
  );
}
