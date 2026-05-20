import { useState, useEffect } from 'react';
import { engineApi } from '../utils/apiBase';

export default function PopupAnalytics() {
  const [data, setData] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchData = async () => {
      try {
        const res = await fetch(engineApi('/admin/popup-analytics'));
        if (res.ok) setData(await res.json());
      } catch (err) {
        console.error('[PopupAnalytics] Error:', err);
      } finally {
        setLoading(false);
      }
    };

    fetchData();
    const interval = setInterval(fetchData, 10000);
    return () => clearInterval(interval);
  }, []);

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="w-8 h-8 border-3 border-indigo-200 border-t-indigo-600 rounded-full animate-spin" />
      </div>
    );
  }

  const overview = data?.overview || {};
  const byTrigger = data?.by_trigger || {};

  const StatCard = ({ label, value, suffix, color }) => (
    <div className="rounded-2xl border border-surface-100 bg-white p-6 shadow-sm">
      <p className="text-xs font-bold uppercase tracking-wider text-surface-400">{label}</p>
      <p className={`text-3xl font-bold mt-2 ${color || 'text-surface-900'}`}>
        {value}
        {suffix && <span className="text-lg text-surface-400 ml-1">{suffix}</span>}
      </p>
    </div>
  );

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold text-surface-900">Popup Analytics</h1>
        <p className="text-sm text-surface-500 mt-1">
          Track popup effectiveness and user engagement
        </p>
      </div>

      {/* Overview Cards */}
      <div className="grid grid-cols-2 md:grid-cols-5 gap-4">
        <StatCard label="Total Shown" value={overview.total_shown || 0} />
        <StatCard label="Total Clicked" value={overview.total_clicked || 0} color="text-emerald-600" />
        <StatCard label="Total Dismissed" value={overview.total_dismissed || 0} color="text-red-500" />
        <StatCard label="Click Rate" value={overview.ctr || 0} suffix="%" color="text-indigo-600" />
        <StatCard label="Dismiss Rate" value={overview.dismiss_rate || 0} suffix="%" color="text-amber-600" />
      </div>

      {/* Per Trigger Breakdown */}
      <div className="rounded-2xl border border-surface-100 bg-white p-6 shadow-sm">
        <h2 className="text-lg font-semibold text-surface-900 mb-4">Performance by Trigger Type</h2>
        {Object.keys(byTrigger).length === 0 ? (
          <p className="text-sm text-surface-400 py-8 text-center">
            No popup events recorded yet. Popups will appear here once users interact with them.
          </p>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr className="border-b border-surface-100">
                  <th className="text-left py-3 px-4 font-semibold text-surface-600">Trigger Type</th>
                  <th className="text-right py-3 px-4 font-semibold text-surface-600">Shown</th>
                  <th className="text-right py-3 px-4 font-semibold text-surface-600">Clicked</th>
                  <th className="text-right py-3 px-4 font-semibold text-surface-600">Dismissed</th>
                  <th className="text-right py-3 px-4 font-semibold text-surface-600">CTR</th>
                </tr>
              </thead>
              <tbody>
                {Object.entries(byTrigger).map(([trigger, stats]) => (
                  <tr key={trigger} className="border-b border-surface-50 hover:bg-surface-50">
                    <td className="py-3 px-4 font-medium text-surface-900">{trigger}</td>
                    <td className="py-3 px-4 text-right text-surface-700">{stats.shown}</td>
                    <td className="py-3 px-4 text-right text-emerald-600 font-medium">{stats.clicked}</td>
                    <td className="py-3 px-4 text-right text-red-500">{stats.dismissed}</td>
                    <td className="py-3 px-4 text-right font-semibold text-indigo-600">
                      {stats.ctr.toFixed(1)}%
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>

      {/* Funnel Visualization */}
      {overview.total_shown > 0 && (
        <div className="rounded-2xl border border-surface-100 bg-white p-6 shadow-sm">
          <h2 className="text-lg font-semibold text-surface-900 mb-4">Popup Funnel</h2>
          <div className="space-y-3">
            {[
              { label: 'Shown', value: overview.total_shown, color: 'bg-indigo-500', width: '100%' },
              { label: 'Clicked', value: overview.total_clicked, color: 'bg-emerald-500', width: `${overview.ctr}%` },
              { label: 'Dismissed', value: overview.total_dismissed, color: 'bg-red-400', width: `${overview.dismiss_rate}%` },
            ].map((item) => (
              <div key={item.label} className="flex items-center gap-4">
                <span className="text-xs font-medium text-surface-600 w-20">{item.label}</span>
                <div className="flex-1 h-8 bg-surface-50 rounded-lg overflow-hidden">
                  <div
                    className={`h-full ${item.color} rounded-lg flex items-center justify-end pr-3 transition-all duration-500`}
                    style={{ width: item.width, minWidth: item.value > 0 ? '40px' : '0' }}
                  >
                    <span className="text-xs font-bold text-white">{item.value}</span>
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}
