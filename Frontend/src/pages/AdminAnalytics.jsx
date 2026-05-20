import { motion } from 'framer-motion';
import { Users, TrendingUp, Bell, Zap, BarChart3, Target, ArrowUpRight, Activity } from 'lucide-react';
import { KPICard } from '../components/common/UIComponents';
import { adminStats, funnelData } from '../data/mockData';
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, LineChart, Line } from 'recharts';
import { usePageTracking } from '../hooks/useTracking';

const userGrowth = [
  { month: 'Jul', users: 85000 }, { month: 'Aug', users: 92000 }, { month: 'Sep', users: 98000 },
  { month: 'Oct', users: 105000 }, { month: 'Nov', users: 115000 }, { month: 'Dec', users: 125000 },
];

const triggerData = [
  { trigger: 'Abandoned Cart', fired: 3200, converted: 890, rate: '27.8%' },
  { trigger: 'Inactive 7 days', fired: 4500, converted: 1200, rate: '26.7%' },
  { trigger: 'High Intent Score', fired: 1800, converted: 720, rate: '40.0%' },
  { trigger: 'Goal Milestone', fired: 2100, converted: 580, rate: '27.6%' },
  { trigger: 'Price Alert', fired: 1200, converted: 340, rate: '28.3%' },
];

export default function AdminAnalytics() {
  usePageTracking('admin-analytics');

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold text-surface-900">Admin Analytics</h1>
        <p className="text-surface-500 text-sm mt-1">Platform-wide analytics overview</p>
      </div>

      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        <KPICard icon={Users} label="Total Users" value={adminStats.totalUsers.toLocaleString()} change={`+${adminStats.newUsersToday} today`} changeType="positive" />
        <KPICard icon={TrendingUp} label="Total AUM" value={adminStats.totalAUM} change={`+${adminStats.monthlyGrowth}%`} changeType="positive" />
        <KPICard icon={Bell} label="Notifications Sent" value={adminStats.notificationsSent.toLocaleString()} />
        <KPICard icon={Zap} label="Triggers Fired" value={adminStats.triggersFired.toLocaleString()} change={`${adminStats.conversionFromTriggers}% CVR`} changeType="positive" />
      </div>

      <div className="grid lg:grid-cols-2 gap-6">
        <div className="bg-white rounded-2xl p-6 shadow-card border border-surface-100">
          <h3 className="font-semibold text-surface-900 mb-4">User Growth</h3>
          <div className="h-64">
            <ResponsiveContainer width="100%" height="100%">
              <LineChart data={userGrowth}>
                <CartesianGrid strokeDasharray="3 3" stroke="#E2E8F0" />
                <XAxis dataKey="month" axisLine={false} tickLine={false} tick={{ fontSize: 11, fill: '#94A3B8' }} />
                <YAxis axisLine={false} tickLine={false} tick={{ fontSize: 11, fill: '#94A3B8' }} tickFormatter={v => `${(v/1000)}K`} />
                <Tooltip contentStyle={{ borderRadius: '12px', border: '1px solid #E2E8F0' }} />
                <Line type="monotone" dataKey="users" stroke="#2E51F5" strokeWidth={2.5} dot={{ r: 4, fill: '#2E51F5' }} />
              </LineChart>
            </ResponsiveContainer>
          </div>
        </div>

        <div className="bg-white rounded-2xl p-6 shadow-card border border-surface-100">
          <h3 className="font-semibold text-surface-900 mb-4">Trigger Analytics</h3>
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead><tr className="border-b border-surface-100">
                {['Trigger', 'Fired', 'Converted', 'Rate'].map(h => (
                  <th key={h} className="pb-3 text-left text-xs font-semibold text-surface-500 uppercase">{h}</th>
                ))}
              </tr></thead>
              <tbody>{triggerData.map(t => (
                <tr key={t.trigger} className="border-b border-surface-50">
                  <td className="py-3 text-sm font-medium text-surface-900">{t.trigger}</td>
                  <td className="py-3 text-sm text-surface-600">{t.fired.toLocaleString()}</td>
                  <td className="py-3 text-sm text-surface-600">{t.converted.toLocaleString()}</td>
                  <td className="py-3 text-sm font-semibold text-accent-600">{t.rate}</td>
                </tr>
              ))}</tbody>
            </table>
          </div>
        </div>
      </div>
    </div>
  );
}
