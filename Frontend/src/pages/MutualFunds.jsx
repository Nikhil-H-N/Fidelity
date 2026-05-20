import { motion } from 'framer-motion';
import { Star, Search, Filter, ArrowUpDown, TrendingUp, ChevronRight, CheckCircle2, IndianRupee } from 'lucide-react';
import { useState, useEffect } from 'react';
import { mutualFunds } from '../data/mockData';
import { getRiskColor } from '../utils/formatters';
import { usePageTracking, useClickTracking } from '../hooks/useTracking';
import MutualFundInvestModal from '../components/modals/MutualFundInvestModal';

const INVESTED_KEY = 'finova_invested_funds';

const loadInvested = () => {
  try {
    return JSON.parse(localStorage.getItem(INVESTED_KEY)) || [];
  } catch { return []; }
};

export default function MutualFunds() {
  usePageTracking('mutual-funds');
  const trackClick = useClickTracking();
  const [search, setSearch] = useState('');
  const [filter, setFilter] = useState('All');
  const [investModal, setInvestModal] = useState({ open: false, fund: null });
  const [investedFunds, setInvestedFunds] = useState(loadInvested);
  const categories = ['All', 'Large Cap', 'Mid Cap', 'Small Cap', 'Flexi Cap', 'Sectoral'];

  // Persist invested funds
  useEffect(() => {
    localStorage.setItem(INVESTED_KEY, JSON.stringify(investedFunds));
  }, [investedFunds]);

  const investedIds = new Set(investedFunds.map(f => f.id));

  const filtered = mutualFunds.filter(f =>
    !investedIds.has(f.id) &&
    (filter === 'All' || f.category === filter) &&
    f.name.toLowerCase().includes(search.toLowerCase())
  );

  const openInvest = (fund, e) => {
    trackClick('invest_button', { fund: fund.name, page: 'mutual-funds' }, e);
    setInvestModal({ open: true, fund });
  };

  const handleInvested = (fund, amount) => {
    if (!fund) return;
    setInvestedFunds(prev => {
      const exists = prev.find(f => f.id === fund.id);
      if (exists) {
        return prev.map(f => f.id === fund.id ? { ...f, amount: Number(f.amount) + Number(amount), investedAt: new Date().toISOString() } : f);
      }
      return [...prev, { ...fund, amount: Number(amount), investedAt: new Date().toISOString() }];
    });
  };

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold text-surface-900">Mutual Funds</h1>
        <p className="text-surface-500 text-sm mt-1">Explore curated funds across categories</p>
      </div>

      {/* ── My Investments Section ── */}
      {investedFunds.length > 0 && (
        <div className="space-y-4">
          <div className="flex items-center gap-2">
            <div className="w-8 h-8 rounded-lg bg-accent-100 flex items-center justify-center">
              <CheckCircle2 className="w-4 h-4 text-accent-600" />
            </div>
            <div>
              <h2 className="text-lg font-bold text-surface-900">My Investments</h2>
              <p className="text-xs text-surface-400">{investedFunds.length} fund{investedFunds.length > 1 ? 's' : ''} · Total ₹{investedFunds.reduce((s, f) => s + Number(f.amount), 0).toLocaleString('en-IN')}</p>
            </div>
          </div>

          {investedFunds.map((fund, i) => (
            <motion.div key={`inv-${fund.id}`} initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: i * 0.05 }}
              className="bg-gradient-to-r from-accent-50 to-white rounded-2xl p-5 shadow-soft border border-accent-200 relative overflow-hidden">
              {/* Invested badge */}
              <div className="absolute top-3 right-3 px-3 py-1 bg-accent-600 text-white text-[10px] font-bold rounded-full flex items-center gap-1">
                <CheckCircle2 className="w-3 h-3" /> Invested
              </div>
              <div className="flex flex-col sm:flex-row sm:items-center gap-4">
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-2 mb-1">
                    <h3 className="font-semibold text-surface-900 truncate">{fund.name}</h3>
                    <span className="badge-info">{fund.category}</span>
                  </div>
                  <div className="flex items-center gap-4 text-sm text-surface-500">
                    <span>NAV: ₹{fund.nav}</span>
                    <span>AUM: {fund.aum}</span>
                    <span className={getRiskColor(fund.risk)}>{fund.risk}</span>
                    <span className="flex gap-0.5">{[...Array(5)].map((_, j) => <Star key={j} className={`w-3 h-3 ${j < fund.rating ? 'fill-amber-400 text-amber-400' : 'text-surface-300'}`} />)}</span>
                  </div>
                </div>
                <div className="flex items-center gap-6">
                  <div className="text-center">
                    <p className="text-xs text-surface-400">Invested</p>
                    <p className="text-lg font-bold text-accent-600 flex items-center gap-0.5"><IndianRupee className="w-3.5 h-3.5" />{Number(fund.amount).toLocaleString('en-IN')}</p>
                  </div>
                  <div className="text-center"><p className="text-xs text-surface-400">1Y Returns</p><p className="text-lg font-bold text-accent-600">+{fund.returns1y}%</p></div>
                  <div className="text-center hidden md:block"><p className="text-xs text-surface-400">3Y Returns</p><p className="text-lg font-bold text-surface-700">+{fund.returns3y}%</p></div>
                  <button onClick={(e) => openInvest(fund, e)} className="btn-secondary text-sm py-2 px-4 whitespace-nowrap gap-1">
                    Invest More <ChevronRight className="w-4 h-4" />
                  </button>
                </div>
              </div>
            </motion.div>
          ))}
        </div>
      )}

      {/* ── Explore Funds Section ── */}
      <div>
        {investedFunds.length > 0 && (
          <h2 className="text-lg font-bold text-surface-900 mb-4">Explore Funds</h2>
        )}

        {/* Filters */}
        <div className="flex flex-col sm:flex-row gap-4 mb-4">
          <div className="relative flex-1">
            <Search className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-surface-400" />
            <input type="text" className="input-field pl-10 text-sm" placeholder="Search funds..." value={search} onChange={e => setSearch(e.target.value)} />
          </div>
          <div className="flex gap-2 overflow-x-auto pb-1">
            {categories.map(c => (
              <button key={c} onClick={(e) => { setFilter(c); trackClick('filter_category', { category: c }, e); }}
                className={`px-4 py-2 rounded-lg text-sm font-medium whitespace-nowrap transition-colors ${filter === c ? 'bg-primary-600 text-white' : 'bg-white text-surface-600 border border-surface-200 hover:bg-surface-50'}`}>
                {c}
              </button>
            ))}
          </div>
        </div>

        {/* Fund Cards */}
        <div className="grid gap-4">
          {filtered.map((fund, i) => (
            <motion.div key={fund.id} initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: i * 0.05 }}
              className="bg-white rounded-2xl p-5 shadow-soft border border-surface-100 card-hover cursor-pointer">
              <div className="flex flex-col sm:flex-row sm:items-center gap-4">
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-2 mb-1">
                    <h3 className="font-semibold text-surface-900 truncate">{fund.name}</h3>
                    <span className="badge-info">{fund.category}</span>
                  </div>
                  <div className="flex items-center gap-4 text-sm text-surface-500">
                    <span>NAV: ₹{fund.nav}</span>
                    <span>AUM: {fund.aum}</span>
                    <span className={getRiskColor(fund.risk)}>{fund.risk}</span>
                    <span className="flex gap-0.5">{[...Array(5)].map((_, j) => <Star key={j} className={`w-3 h-3 ${j < fund.rating ? 'fill-amber-400 text-amber-400' : 'text-surface-300'}`} />)}</span>
                  </div>
                </div>
                <div className="flex items-center gap-6">
                  <div className="text-center"><p className="text-xs text-surface-400">1Y Returns</p><p className="text-lg font-bold text-accent-600">+{fund.returns1y}%</p></div>
                  <div className="text-center hidden md:block"><p className="text-xs text-surface-400">3Y Returns</p><p className="text-lg font-bold text-surface-700">+{fund.returns3y}%</p></div>
                  <div className="text-center hidden lg:block"><p className="text-xs text-surface-400">5Y Returns</p><p className="text-lg font-bold text-surface-700">+{fund.returns5y}%</p></div>
                  <button onClick={(e) => openInvest(fund, e)}
                    className="btn-primary text-sm py-2 px-4 whitespace-nowrap gap-1">
                    Invest <ChevronRight className="w-4 h-4" />
                  </button>
                </div>
              </div>
            </motion.div>
          ))}
          {filtered.length === 0 && (
            <div className="text-center py-12 text-surface-400">
              <p className="text-lg font-medium">No funds found</p>
              <p className="text-sm mt-1">{investedIds.size > 0 ? 'All matching funds are in your investments above' : 'Try adjusting your search or filters'}</p>
            </div>
          )}
        </div>
      </div>

      {/* Investment Modal */}
      <MutualFundInvestModal
        isOpen={investModal.open}
        onClose={() => setInvestModal({ open: false, fund: null })}
        fund={investModal.fund}
        onInvested={handleInvested}
      />
    </div>
  );
}

