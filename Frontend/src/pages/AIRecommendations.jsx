import { motion } from 'framer-motion';
import { Brain, TrendingUp, RefreshCw, Shield, Sparkles, ArrowRight } from 'lucide-react';
import { aiRecommendations } from '../data/mockData';
import { usePageTracking } from '../hooks/useTracking';

const iconMap = { increase_sip: TrendingUp, rebalance: RefreshCw, tax_saving: Shield, new_fund: Sparkles };
const colorMap = { high: 'border-red-200 bg-red-50/30', medium: 'border-amber-200 bg-amber-50/30', low: 'border-blue-200 bg-blue-50/30' };

export default function AIRecommendations() {
  usePageTracking('ai-recommendations');

  return (
    <div className="space-y-6">
      <div className="flex items-center gap-3">
        <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-primary-500 to-purple-500 flex items-center justify-center">
          <Brain className="w-5 h-5 text-white" />
        </div>
        <div>
          <h1 className="text-2xl font-bold text-surface-900">AI Recommendations</h1>
          <p className="text-surface-500 text-sm mt-1">Personalized insights powered by machine learning</p>
        </div>
      </div>

      <div className="grid gap-6">
        {aiRecommendations.map((rec, i) => {
          const Icon = iconMap[rec.type] || Sparkles;
          return (
            <motion.div key={rec.id} initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: i * 0.1 }}
              className={`bg-white rounded-2xl p-6 shadow-card border ${colorMap[rec.priority]} card-hover`}>
              <div className="flex flex-col sm:flex-row sm:items-start gap-4">
                <div className="w-12 h-12 rounded-xl bg-primary-50 flex items-center justify-center flex-shrink-0">
                  <Icon className="w-6 h-6 text-primary-600" />
                </div>
                <div className="flex-1">
                  <div className="flex items-center gap-2 mb-1">
                    <h3 className="text-lg font-semibold text-surface-900">{rec.title}</h3>
                    <span className={`px-2 py-0.5 rounded-full text-[10px] font-bold uppercase ${
                      rec.priority === 'high' ? 'bg-red-100 text-red-700' : rec.priority === 'medium' ? 'bg-amber-100 text-amber-700' : 'bg-blue-100 text-blue-700'
                    }`}>{rec.priority}</span>
                  </div>
                  <p className="text-sm text-surface-600 mb-3 leading-relaxed">{rec.description}</p>
                  <div className="flex items-center gap-4">
                    <span className="text-sm font-semibold text-accent-600">Impact: {rec.impact}</span>
                    <span className="text-sm text-surface-500">Confidence: {rec.confidence}%</span>
                  </div>
                </div>
                <button className="btn-primary text-sm py-2 px-4 gap-1 flex-shrink-0">
                  Apply <ArrowRight className="w-4 h-4" />
                </button>
              </div>
            </motion.div>
          );
        })}
      </div>
    </div>
  );
}
