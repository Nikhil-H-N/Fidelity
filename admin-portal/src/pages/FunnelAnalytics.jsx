import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { motion } from 'framer-motion';
import {
  Filter, ArrowRight, TrendingDown,
  Users, MousePointer2, FileCheck,
  Zap, Info, RefreshCw, TimerOff
} from 'lucide-react';
import {
  BarChart, Bar, XAxis, YAxis,
  CartesianGrid, Tooltip, ResponsiveContainer,
  Cell, LabelList
} from 'recharts';
import { engineApi } from '../utils/apiBase';

export default function FunnelAnalytics() {
  const navigate = useNavigate();
  const [data, setData] = useState(null);
  const [loading, setLoading] = useState(true);

  const fetchFunnelData = async () => {
    try {
      const res = await fetch(engineApi('/admin/analytics/conversion-funnel'));
      if (res.ok) {
        const payload = await res.json();
        setData({
          funnel: payload.stages || [],
          summary: payload.summary || {},
        });
      }
    } catch (error) {
      console.error('Failed to fetch funnel:', error);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchFunnelData();
    const interval = setInterval(fetchFunnelData, 10000);
    return () => clearInterval(interval);
  }, []);

  if (loading && !data) return (
    <div className="flex items-center justify-center h-64">
      <div className="w-8 h-8 border-3 border-primary-200 border-t-primary-600 rounded-full animate-spin" />
    </div>
  );

  return (
    <div className="space-y-8">
      <div>
        <h1 className="text-2xl font-bold text-surface-900">Conversion Funnel</h1>
        <p className="text-surface-500 mt-1 text-sm">Macro-level analysis of user drop-off across the conversion journey</p>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-4 gap-6">
        {data?.funnel?.map((item, idx) => {
          return (
            <div key={item.stage} className="bg-white border border-surface-100 rounded-2xl p-6 shadow-card relative overflow-hidden group">
               <div className="flex justify-between items-start mb-4">
                 <div className="p-3 rounded-xl bg-surface-50 border border-surface-100">
                    {idx === 0 && <Users className="w-5 h-5 text-primary-500" />}
                    {idx === 1 && <Zap className="w-5 h-5 text-blue-500" />}
                    {idx === 2 && <MousePointer2 className="w-5 h-5 text-pink-500" />}
                    {idx === 3 && <Filter className="w-5 h-5 text-amber-500" />}
                    {idx === 4 && <FileCheck className="w-5 h-5 text-accent-500" />}
                 </div>
                 {idx > 0 && (
                   <div className="text-right">
                     <p className="text-[10px] font-bold text-red-500 uppercase tracking-widest">Drop-off</p>
                     <p className="text-lg font-bold text-red-500 flex items-center gap-1 justify-end">
                       <TrendingDown className="w-4 h-4" /> {item.dropOff || 0}%
                     </p>
                   </div>
                 )}
               </div>

               <p className="text-4xl font-black text-surface-900 tracking-tighter">{item.count}</p>
               <p className="text-[10px] font-bold text-surface-400 uppercase tracking-widest mt-1">{item.label}</p>
               <p className="text-[10px] font-bold text-primary-600 uppercase tracking-widest mt-3">{item.percentage || 0}% of visitors</p>

               <div className="absolute -right-4 -bottom-4 opacity-5 group-hover:scale-110 transition-transform">
                  <Filter className="w-24 h-24 text-surface-900" />
               </div>
            </div>
          );
        })}
      </div>

      <div className="bg-white border border-surface-100 rounded-2xl p-8 shadow-card">
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          {[
            ['Completion Rate', `${data?.summary?.completion_rate || 0}%`, 'text-accent-600'],
            ['Discard Rate', `${data?.summary?.discard_rate || 0}%`, 'text-red-500'],
            ['Discarded Sessions', data?.summary?.discarded || 0, 'text-primary-600'],
          ].map(([label, value, color]) => (
            <div key={label} className="bg-surface-50 border border-surface-100 rounded-xl p-5">
              <p className="text-[10px] font-bold text-surface-400 uppercase tracking-widest">{label}</p>
              <p className={`text-3xl font-black mt-2 ${color}`}>{value}</p>
            </div>
          ))}
        </div>
      </div>

      <div className="bg-white border border-surface-100 rounded-2xl p-8 shadow-card">
        <h3 className="font-bold text-surface-900 mb-8 flex items-center gap-2 text-xl">
          <Filter className="w-6 h-6 text-primary-500" /> Funnel Visualization
        </h3>

        <div className="h-[400px] w-full">
          <ResponsiveContainer width="100%" height={400}>
            <BarChart data={data?.funnel || []} layout="vertical" margin={{ left: 40, right: 80 }}>
              <CartesianGrid strokeDasharray="3 3" horizontal={false} stroke="#E2E8F0" />
              <XAxis type="number" hide />
              <YAxis
                dataKey="stage"
                type="category"
                axisLine={false}
                tickLine={false}
                tick={{ fill: '#475569', fontSize: 10, fontWeight: 800 }}
              />
              <Tooltip
                cursor={{ fill: 'rgba(26, 54, 235, 0.04)' }}
                contentStyle={{ backgroundColor: '#FFFFFF', border: '1px solid #E2E8F0', borderRadius: '12px', boxShadow: '0 4px 12px rgba(0,0,0,0.08)' }}
              />
              <Bar dataKey="count" radius={[0, 12, 12, 0]} barSize={60}>
                {data?.funnel?.map((entry, index) => (
                  <Cell key={`cell-${index}`} fill={entry.color} fillOpacity={0.85} />
                ))}
                <LabelList dataKey="count" position="right" fill="#0F172A" fontSize={14} fontWeight={900} />
              </Bar>
            </BarChart>
          </ResponsiveContainer>
        </div>
      </div>

      <div className="p-8 rounded-2xl bg-primary-50 border border-primary-100 flex flex-col md:flex-row items-center gap-8">
        <div className="w-16 h-16 rounded-2xl bg-primary-100 flex items-center justify-center shrink-0">
          <Info className="w-8 h-8 text-primary-600" />
        </div>
        <div className="flex-1 text-center md:text-left">
          <h4 className="text-xl font-bold text-surface-900 mb-2">Intent-Driven Optimization</h4>
          <p className="text-surface-500 text-sm leading-relaxed">
            {data?.summary?.insight || 'The funnel updates from live sessions as users move from visit to engagement, product interest, application start, and completion.'}
          </p>
        </div>
        <button onClick={() => navigate('/analytics')} className="px-6 py-3 btn-primary whitespace-nowrap">
          View Detailed Insights
        </button>
      </div>
    </div>
  );
}
