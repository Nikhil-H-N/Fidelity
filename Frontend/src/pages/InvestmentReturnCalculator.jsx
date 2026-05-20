import { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { motion } from 'framer-motion';
import { Calculator, TrendingUp, PieChart, ArrowRight, Info } from 'lucide-react';
import { AreaChart, Area, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer } from 'recharts';
import { usePageTracking } from '../hooks/useTracking';
import { queueEvent } from '../api/eventService';
import { formatCurrency } from '../utils/formatters';

export default function InvestmentReturnCalculator() {
  usePageTracking('investment-calculator');
  const [investment, setInvestment] = useState(100000);
  const [rate, setRate] = useState(12);
  const [years, setYears] = useState(5);
  const navigate = useNavigate();

  useEffect(() => {
    queueEvent({
      eventType: 'calculator_usage',
      page: '/investment-calculator',
      metadata: { calculator: 'investment_return', investment, rate, years },
    });
  }, [investment, rate, years]);

  const calculateReturns = () => {
    const totalValue = investment * Math.pow(1 + rate / 100, years);
    const returns = totalValue - investment;
    return { totalValue, returns };
  };

  const { totalValue, returns } = calculateReturns();

  const data = Array.from({ length: years + 1 }, (_, i) => {
    const value = investment * Math.pow(1 + rate / 100, i);
    return {
      year: `Year ${i}`,
      value: Math.round(value),
      invested: investment
    };
  });

  return (
    <div className="space-y-12 pb-24">
      <div className="max-w-2xl">
        <h1 className="text-4xl font-black text-surface-900 tracking-tight">
          Investment Return Calculator
        </h1>
        <p className="text-surface-600 mt-4 text-lg leading-relaxed">
          Estimate the future value of your lump sum investments based on expected returns and time horizon.
        </p>
      </div>

      <div className="grid lg:grid-cols-5 gap-8">
        {/* Controls */}
        <div className="lg:col-span-2 bg-white rounded-[2.5rem] p-10 border border-surface-100 shadow-sm space-y-8 h-fit">
          <div className="flex items-center gap-3 text-primary-600 mb-2">
            <Calculator className="w-6 h-6" />
            <h3 className="font-bold text-lg">Input Parameters</h3>
          </div>

          <div className="space-y-6">
            <div>
              <div className="flex justify-between mb-3">
                <label className="text-sm font-black text-surface-500 uppercase tracking-wider">Total Investment</label>
                <span className="text-lg font-black text-primary-600">{formatCurrency(investment)}</span>
              </div>
              <input 
                type="range" min="10000" max="10000000" step="10000" 
                value={investment} onChange={e => setInvestment(Number(e.target.value))}
                className="w-full h-2 bg-surface-100 rounded-full appearance-none cursor-pointer accent-primary-600" 
              />
            </div>

            <div>
              <div className="flex justify-between mb-3">
                <label className="text-sm font-black text-surface-500 uppercase tracking-wider">Expected Return (p.a)</label>
                <span className="text-lg font-black text-primary-600">{rate}%</span>
              </div>
              <input 
                type="range" min="1" max="30" step="0.5" 
                value={rate} onChange={e => setRate(Number(e.target.value))}
                className="w-full h-2 bg-surface-100 rounded-full appearance-none cursor-pointer accent-primary-600" 
              />
            </div>

            <div>
              <div className="flex justify-between mb-3">
                <label className="text-sm font-black text-surface-500 uppercase tracking-wider">Time Period</label>
                <span className="text-lg font-black text-primary-600">{years} Years</span>
              </div>
              <input 
                type="range" min="1" max="40" step="1" 
                value={years} onChange={e => setYears(Number(e.target.value))}
                className="w-full h-2 bg-surface-100 rounded-full appearance-none cursor-pointer accent-primary-600" 
              />
            </div>
          </div>

          <div className="pt-8 border-t border-surface-50 space-y-6">
            <div className="flex justify-between items-end">
              <div>
                <p className="text-xs font-black text-surface-400 uppercase tracking-widest mb-1">Total Value</p>
                <p className="text-4xl font-black text-surface-900">{formatCurrency(totalValue, true)}</p>
              </div>
              <div className="text-right">
                <p className="text-xs font-black text-emerald-500 uppercase tracking-widest mb-1">Est. Returns</p>
                <p className="text-xl font-bold text-emerald-600">+{formatCurrency(returns, true)}</p>
              </div>
            </div>
            
            <button onClick={() => {
              queueEvent({ eventType: 'checkout_start', page: '/investment-calculator', metadata: { source: 'investment_calculator', investment, rate, years } });
              navigate('/checkout/wealth-core');
            }} className="w-full py-5 bg-primary-600 hover:bg-primary-700 text-white font-black rounded-2xl transition-all shadow-xl shadow-primary-900/20 flex items-center justify-center gap-3 group">
              Start Investing Now <ArrowRight className="w-5 h-5 group-hover:translate-x-1 transition-transform" />
            </button>
          </div>
        </div>

        {/* Chart/Analysis */}
        <div className="lg:col-span-3 space-y-8">
          <div className="bg-white rounded-[2.5rem] p-10 border border-surface-100 shadow-sm">
            <h3 className="font-bold text-surface-900 mb-8 flex items-center gap-2">
              <TrendingUp className="w-5 h-5 text-indigo-500" /> Growth Projection
            </h3>
            <div className="h-80 w-full">
              <ResponsiveContainer width="100%" height="100%">
                <AreaChart data={data}>
                  <defs>
                    <linearGradient id="colorValue" x1="0" y1="0" x2="0" y2="1">
                      <stop offset="5%" stopColor="#3b82f6" stopOpacity={0.1}/>
                      <stop offset="95%" stopColor="#3b82f6" stopOpacity={0}/>
                    </linearGradient>
                  </defs>
                  <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#f1f5f9" />
                  <XAxis dataKey="year" axisLine={false} tickLine={false} tick={{ fontSize: 10, fill: '#94a3b8' }} />
                  <YAxis axisLine={false} tickLine={false} tick={{ fontSize: 10, fill: '#94a3b8' }} tickFormatter={v => `₹${(v/100000).toFixed(1)}L`} />
                  <Tooltip 
                    contentStyle={{ borderRadius: '16px', border: 'none', boxShadow: '0 10px 15px -3px rgb(0 0 0 / 0.1)' }}
                    formatter={(value) => [formatCurrency(value), 'Value']}
                  />
                  <Area type="monotone" dataKey="value" stroke="#3b82f6" strokeWidth={3} fillOpacity={1} fill="url(#colorValue)" />
                </AreaChart>
              </ResponsiveContainer>
            </div>
          </div>

          <div className="grid md:grid-cols-2 gap-6">
            <div className="p-8 rounded-[2rem] bg-indigo-50 border border-indigo-100">
               <div className="w-10 h-10 rounded-xl bg-indigo-600 text-white flex items-center justify-center mb-4">
                 <PieChart className="w-5 h-5" />
               </div>
               <h4 className="font-bold text-surface-900 mb-2">Diversification Tip</h4>
               <p className="text-sm text-surface-600 leading-relaxed">
                 For a {years}-year horizon, consider a mix of Large Cap and Flexi Cap funds to balance stability and growth.
               </p>
            </div>
            <div className="p-8 rounded-[2rem] bg-emerald-50 border border-emerald-100">
               <div className="w-10 h-10 rounded-xl bg-emerald-600 text-white flex items-center justify-center mb-4">
                 <Info className="w-5 h-5" />
               </div>
               <h4 className="font-bold text-surface-900 mb-2">Regulated & Safe</h4>
               <p className="text-sm text-surface-600 leading-relaxed">
                 All projections are based on historical AMC data. Mutual fund investments are subject to market risks.
               </p>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
