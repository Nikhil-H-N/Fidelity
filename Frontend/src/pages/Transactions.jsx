import { useState } from 'react';
import { motion } from 'framer-motion';
import { ArrowLeftRight, Download, Filter } from 'lucide-react';
import { transactions } from '../data/mockData';
import { formatCurrency, formatDate, getStatusColor } from '../utils/formatters';
import { usePageTracking } from '../hooks/useTracking';

export default function Transactions() {
  usePageTracking('transactions');
  const [filter, setFilter] = useState('All');
  const types = ['All', 'SIP', 'Lumpsum', 'Withdrawal'];
  const filtered = filter === 'All' ? transactions : transactions.filter(t => t.type === filter);

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div><h1 className="text-2xl font-bold text-surface-900">Transactions</h1><p className="text-surface-500 text-sm mt-1">Your investment transaction history</p></div>
        <button className="btn-secondary text-sm py-2 px-4 gap-2"><Download className="w-4 h-4" /> Export</button>
      </div>

      <div className="flex gap-2 overflow-x-auto pb-1">{types.map(t => (
        <button key={t} onClick={() => setFilter(t)}
          className={`px-4 py-2 rounded-lg text-sm font-medium whitespace-nowrap transition-colors ${filter === t ? 'bg-primary-600 text-white' : 'bg-white text-surface-600 border border-surface-200 hover:bg-surface-50'}`}>{t}</button>
      ))}</div>

      <div className="bg-white rounded-2xl shadow-card border border-surface-100 overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full">
            <thead className="bg-surface-50"><tr>{['Date', 'Type', 'Fund', 'Amount', 'Units', 'Status'].map(h => (
              <th key={h} className="px-6 py-3 text-left text-xs font-semibold text-surface-500 uppercase tracking-wider">{h}</th>
            ))}</tr></thead>
            <tbody className="divide-y divide-surface-100">{filtered.map((t, i) => (
              <motion.tr key={t.id} initial={{ opacity: 0 }} animate={{ opacity: 1 }} transition={{ delay: i * 0.03 }}
                className="hover:bg-surface-50 transition-colors">
                <td className="px-6 py-4 text-sm text-surface-600">{formatDate(t.date)}</td>
                <td className="px-6 py-4"><span className={`badge ${t.type === 'Withdrawal' ? 'badge-warning' : t.type === 'SIP' ? 'badge-info' : 'badge-success'}`}>{t.type}</span></td>
                <td className="px-6 py-4 text-sm font-medium text-surface-900">{t.fund}</td>
                <td className="px-6 py-4 text-sm font-semibold text-surface-900">{t.type === 'Withdrawal' ? '-' : '+'}{formatCurrency(t.amount)}</td>
                <td className="px-6 py-4 text-sm text-surface-600">{t.units > 0 ? '+' : ''}{t.units.toFixed(2)}</td>
                <td className="px-6 py-4"><span className={`px-2.5 py-1 rounded-full text-xs font-semibold ${getStatusColor(t.status)}`}>{t.status}</span></td>
              </motion.tr>
            ))}</tbody>
          </table>
        </div>
      </div>
    </div>
  );
}
