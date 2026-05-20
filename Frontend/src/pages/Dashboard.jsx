import { motion } from 'framer-motion';
import { TrendingUp, TrendingDown, Wallet, PieChart, Target, ArrowUpRight, BarChart3, Bell, Brain, Activity } from 'lucide-react';
import { KPICard, AnimatedCounter, ProgressBar } from '../components/common/UIComponents';
import { portfolioSummary, portfolioAllocation, portfolioPerformance, activeSIPs, goals, notifications, aiRecommendations } from '../data/mockData';
import { formatCurrency, formatPercent } from '../utils/formatters';
import { AreaChart, Area, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, PieChart as RPieChart, Pie, Cell } from 'recharts';
import { Link } from 'react-router-dom';
import { usePageTracking } from '../hooks/useTracking';
import { useAuth } from '../context/AuthContext';

function getGreeting() {
  const h = new Date().getHours();
  if (h < 12) return 'Good morning';
  if (h < 17) return 'Good afternoon';
  return 'Good evening';
}

function getFirstName(name) {
  if (!name) return 'there';
  return name.trim().split(/\s+/)[0];
}

export default function Dashboard() {
  usePageTracking('dashboard');
  const { user } = useAuth();

  return (
    <div className="space-y-6">
      {/* Welcome */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold text-surface-900">{getGreeting()}, {getFirstName(user?.fullName)} 👋</h1>
          <p className="text-surface-500 text-sm mt-1">Here's your portfolio overview for today</p>
        </div>
        <Link to="/mutual-funds" className="btn-primary text-sm py-2.5 px-5 gap-2">
          <TrendingUp className="w-4 h-4" /> Quick Invest
        </Link>
      </div>

      {/* KPIs */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        <KPICard icon={Wallet} label="Total Portfolio" value={formatCurrency(portfolioSummary.totalValue, true)} change={`${formatPercent(portfolioSummary.todayChangePercent)}`} changeType="positive" />
        <KPICard icon={TrendingUp} label="Total Returns" value={formatCurrency(portfolioSummary.totalReturns, true)} change={`${formatPercent(portfolioSummary.returnPercent)}`} changeType="positive" />
        <KPICard icon={BarChart3} label="Active SIPs" value="5" change="₹25,000/mo" changeType="neutral" />
        <KPICard icon={Target} label="Goals On Track" value="4/5" change="80%" changeType="positive" />
      </div>

      {/* Charts Row */}
      <div className="grid lg:grid-cols-3 gap-6">
        {/* Portfolio Performance */}
        <div className="lg:col-span-2 bg-white rounded-2xl p-6 shadow-card border border-surface-100">
          <div className="flex items-center justify-between mb-4">
            <h3 className="font-semibold text-surface-900">Portfolio Performance</h3>
            <div className="flex gap-1">{['1M','3M','6M','1Y','All'].map(p => (
              <button key={p} className={`px-3 py-1 rounded-lg text-xs font-medium ${p === '1Y' ? 'bg-primary-50 text-primary-600' : 'text-surface-400 hover:bg-surface-50'}`}>{p}</button>
            ))}</div>
          </div>
          <div className="h-64">
            <ResponsiveContainer width="100%" height="100%">
              <AreaChart data={portfolioPerformance}>
                <defs>
                  <linearGradient id="dashGrad" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="0%" stopColor="#2E51F5" stopOpacity={0.12} /><stop offset="100%" stopColor="#2E51F5" stopOpacity={0} />
                  </linearGradient>
                </defs>
                <CartesianGrid strokeDasharray="3 3" stroke="#E2E8F0" />
                <XAxis dataKey="month" axisLine={false} tickLine={false} tick={{ fontSize: 11, fill: '#94A3B8' }} />
                <YAxis hide />
                <Tooltip contentStyle={{ borderRadius: '12px', border: '1px solid #E2E8F0' }} formatter={(v) => [`₹${(v/100000).toFixed(1)}L`]} />
                <Area type="monotone" dataKey="value" stroke="#2E51F5" strokeWidth={2} fill="url(#dashGrad)" />
                <Area type="monotone" dataKey="benchmark" stroke="#10B981" strokeWidth={1.5} fill="none" strokeDasharray="5 5" />
              </AreaChart>
            </ResponsiveContainer>
          </div>
        </div>

        {/* Allocation */}
        <div className="bg-white rounded-2xl p-6 shadow-card border border-surface-100">
          <h3 className="font-semibold text-surface-900 mb-4">Asset Allocation</h3>
          <div className="h-48">
            <ResponsiveContainer width="100%" height="100%">
              <RPieChart>
                <Pie data={portfolioAllocation} cx="50%" cy="50%" innerRadius={50} outerRadius={80} paddingAngle={3} dataKey="value">
                  {portfolioAllocation.map((entry, i) => <Cell key={i} fill={entry.color} />)}
                </Pie>
                <Tooltip formatter={(v) => [`${v}%`]} />
              </RPieChart>
            </ResponsiveContainer>
          </div>
          <div className="space-y-2 mt-2">
            {portfolioAllocation.map(a => (
              <div key={a.name} className="flex items-center justify-between text-sm">
                <div className="flex items-center gap-2"><div className="w-3 h-3 rounded-full" style={{ backgroundColor: a.color }} /><span className="text-surface-600">{a.name}</span></div>
                <span className="font-semibold text-surface-900">{a.value}%</span>
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* Bottom Row */}
      <div className="grid lg:grid-cols-3 gap-6">
        {/* Active SIPs */}
        <div className="bg-white rounded-2xl p-6 shadow-card border border-surface-100">
          <div className="flex items-center justify-between mb-4">
            <h3 className="font-semibold text-surface-900">Active SIPs</h3>
            <Link to="/sip-plans" className="text-sm text-primary-600 font-medium hover:text-primary-700">View all →</Link>
          </div>
          <div className="space-y-3">
            {activeSIPs.slice(0, 4).map(sip => (
              <div key={sip.id} className="flex items-center justify-between p-3 rounded-xl bg-surface-50 hover:bg-surface-100 transition-colors">
                <div className="min-w-0 flex-1">
                  <p className="text-sm font-medium text-surface-900 truncate">{sip.name}</p>
                  <p className="text-xs text-surface-500">{sip.category} · {sip.date} every month</p>
                </div>
                <div className="text-right ml-3">
                  <p className="text-sm font-semibold text-surface-900">₹{sip.amount.toLocaleString('en-IN')}</p>
                  <p className="text-xs text-accent-600 font-medium">+{sip.returns}%</p>
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* Goals */}
        <div className="bg-white rounded-2xl p-6 shadow-card border border-surface-100">
          <div className="flex items-center justify-between mb-4">
            <h3 className="font-semibold text-surface-900">Goal Progress</h3>
            <Link to="/goal-planning" className="text-sm text-primary-600 font-medium hover:text-primary-700">View all →</Link>
          </div>
          <div className="space-y-4">
            {goals.slice(0, 4).map(goal => (
              <div key={goal.id}>
                <div className="flex items-center justify-between mb-1.5">
                  <p className="text-sm font-medium text-surface-900">{goal.name}</p>
                  <span className="text-xs text-surface-500">{Math.round((goal.current/goal.target)*100)}%</span>
                </div>
                <ProgressBar value={goal.current} max={goal.target} color={goal.onTrack ? 'accent' : 'warning'} size="sm" />
                <div className="flex justify-between mt-1">
                  <span className="text-xs text-surface-400">{formatCurrency(goal.current, true)}</span>
                  <span className="text-xs text-surface-400">{formatCurrency(goal.target, true)}</span>
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* AI + Notifications */}
        <div className="space-y-6">
          <div className="bg-white rounded-2xl p-6 shadow-card border border-surface-100">
            <div className="flex items-center justify-between mb-3">
              <div className="flex items-center gap-2"><Brain className="w-5 h-5 text-primary-600" /><h3 className="font-semibold text-surface-900 text-sm">AI Insights</h3></div>
              <Link to="/ai-recommendations" className="text-xs text-primary-600 font-medium">View all →</Link>
            </div>
            {aiRecommendations.slice(0, 2).map(r => (
              <div key={r.id} className="p-3 rounded-xl bg-primary-50/50 border border-primary-100 mb-2 last:mb-0">
                <p className="text-sm font-medium text-surface-900">{r.title}</p>
                <p className="text-xs text-surface-500 mt-0.5">{r.impact} · {r.confidence}% confidence</p>
              </div>
            ))}
          </div>

          <div className="bg-white rounded-2xl p-6 shadow-card border border-surface-100">
            <div className="flex items-center justify-between mb-3">
              <div className="flex items-center gap-2"><Bell className="w-5 h-5 text-amber-500" /><h3 className="font-semibold text-surface-900 text-sm">Recent Alerts</h3></div>
              <Link to="/notifications" className="text-xs text-primary-600 font-medium">View all →</Link>
            </div>
            {notifications.slice(0, 3).map(n => (
              <div key={n.id} className={`p-3 rounded-xl mb-2 last:mb-0 ${n.read ? 'bg-surface-50' : 'bg-amber-50/50 border border-amber-100'}`}>
                <p className="text-sm font-medium text-surface-900">{n.title}</p>
                <p className="text-xs text-surface-500 mt-0.5">{n.time}</p>
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
}
