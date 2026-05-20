import { motion } from 'framer-motion';
import { useParams, useNavigate } from 'react-router-dom';
import { useEffect } from 'react';
import { 
  ArrowLeft, CheckCircle2, ShieldCheck, 
  TrendingUp, Clock, Info, ArrowRight,
  Shield, BarChart3, Zap
} from 'lucide-react';
import { useClickTracking, usePageTracking } from '../hooks/useTracking';
import { queueEvent } from '../api/eventService';

const productData = {
  'term-life': {
    title: 'Term Life Insurance',
    category: 'Insurance',
    description: 'High-value protection for your family at affordable premiums.',
    features: [
      'Coverage up to ₹1 Crore',
      'Affordable premiums starting ₹500/mo',
      'Option to add Critical Illness rider',
      'Hassle-free digital claim settlement'
    ],
    stats: [
      { label: 'Claim Ratio', value: '99.4%', icon: CheckCircle2 },
      { label: 'Processing', value: '24 Hours', icon: Clock },
      { label: 'Min Age', value: '18 Years', icon: ShieldCheck }
    ]
  },
  'elss-tax-saver': {
    title: 'ELSS Tax Saver Fund',
    category: 'Tax Saving',
    description: 'Invest in equities while saving tax under Section 80C.',
    features: [
      'Shortest lock-in of 3 years',
      'Historically higher returns than PPF/FD',
      'Save up to ₹46,800 in taxes',
      'Start with as little as ₹500'
    ],
    stats: [
      { label: '3Y Returns', value: '14.2% p.a.', icon: TrendingUp },
      { label: 'Risk', value: 'Very High', icon: Info },
      { label: 'Min Investment', value: '₹500', icon: BarChart3 }
    ]
  },
  'health-insurance': {
    title: 'Health Insurance',
    category: 'Insurance',
    description: 'Comprehensive medical coverage with cashless hospitalization.',
    features: [
      'Coverage up to 25 Lakhs',
      'No claim bonus benefits',
      'Pre and post hospitalization cover',
      'Digital policy issuance'
    ],
    stats: [
      { label: 'Hospitals', value: '8,500+', icon: ShieldCheck },
      { label: 'Claim Time', value: '2 Days', icon: Clock },
      { label: 'Tax Benefit', value: '80D', icon: CheckCircle2 }
    ]
  },
  'wealth-core': {
    title: 'Wealth Core',
    category: 'Wealth Management',
    description: 'Personalized portfolio construction for growing professionals.',
    features: [
      'Quarterly portfolio review',
      'Tax-aware rebalancing',
      'Dedicated advisor callback',
      'Cross-session behavioral memory'
    ],
    stats: [
      { label: 'Min Ticket', value: '5 Lakhs', icon: BarChart3 },
      { label: 'Review', value: 'Quarterly', icon: Clock },
      { label: 'Risk', value: 'Custom', icon: Info }
    ]
  }
};

export default function ProductDetails() {
  const { productId } = useParams();
  const navigate = useNavigate();
  const trackClick = useClickTracking();
  usePageTracking(`product-details-${productId || 'unknown'}`);

  const product = productData[productId] || productData['term-life'];

  useEffect(() => {
    queueEvent({
      eventType: 'product_view',
      page: `/product-details/${productId || 'term-life'}`,
      metadata: {
        productId: productId || 'term-life',
        productName: product.title,
        category: product.category,
      },
    });
  }, [productId, product.title, product.category]);

  const handleApply = (event) => {
    trackClick('apply_now', { page: 'product-details', productId, productName: product.title }, event);
    navigate(`/checkout/${productId || 'term-life'}`);
  };

  const handleBrochure = (event) => {
    trackClick('download_brochure', { page: 'product-details', productId, productName: product.title }, event);
    queueEvent({
      eventType: 'download_brochure',
      page: `/product-details/${productId || 'term-life'}`,
      metadata: {
        productId: productId || 'term-life',
        productName: product.title,
      },
    });
  };

  return (
    <div className="space-y-12 pb-24">
      <button 
        onClick={() => navigate(-1)}
        className="flex items-center gap-2 text-surface-500 hover:text-primary-600 transition-colors font-bold text-sm group"
      >
        <ArrowLeft className="w-4 h-4 group-hover:-translate-x-1 transition-transform" /> BACK TO LIST
      </button>

      <div className="grid lg:grid-cols-5 gap-12">
        {/* Left: Content */}
        <div className="lg:col-span-3 space-y-10">
          <div>
            <span className="text-[10px] font-black px-3 py-1 bg-primary-50 text-primary-600 rounded-full uppercase tracking-widest mb-4 inline-block">
              {product.category}
            </span>
            <h1 className="text-5xl font-black text-surface-900 tracking-tight mt-4">
              {product.title}
            </h1>
            <p className="text-xl text-surface-600 leading-relaxed mt-6">
              {product.description}
            </p>
          </div>

          <div className="grid grid-cols-3 gap-6">
            {product.stats.map(stat => (
              <div key={stat.label} className="p-6 rounded-3xl bg-surface-50 border border-surface-100">
                <stat.icon className="w-6 h-6 text-primary-600 mb-4" />
                <p className="text-xl font-bold text-surface-900">{stat.value}</p>
                <p className="text-[10px] font-black text-surface-400 uppercase tracking-widest mt-1">{stat.label}</p>
              </div>
            ))}
          </div>

          <div className="space-y-6">
            <h3 className="text-2xl font-bold text-surface-900">Key Benefits</h3>
            <div className="grid md:grid-cols-2 gap-4">
              {product.features.map(f => (
                <div key={f} className="flex items-start gap-4 p-5 rounded-2xl bg-white border border-surface-100 shadow-sm">
                  <CheckCircle2 className="w-5 h-5 text-emerald-500 shrink-0 mt-0.5" />
                  <span className="font-medium text-surface-700">{f}</span>
                </div>
              ))}
            </div>
          </div>
        </div>

        {/* Right: Sticky Action Card */}
        <div className="lg:col-span-2">
          <div className="sticky top-24 bg-surface-900 rounded-[2.5rem] p-10 text-white shadow-2xl shadow-primary-900/20 overflow-hidden">
            <Shield className="absolute -right-8 -bottom-8 w-48 h-48 text-white/5 -rotate-12" />
            
            <div className="relative z-10 space-y-8">
              <div className="space-y-2">
                <p className="text-surface-400 text-sm font-bold uppercase tracking-widest">Pricing Policy</p>
                <h3 className="text-3xl font-bold">Zero Hidden Fees</h3>
                <p className="text-surface-400 leading-relaxed">
                  We believe in total transparency. The premium or investment you see is what you pay.
                </p>
              </div>

              <div className="p-6 rounded-2xl bg-white/5 border border-white/10 space-y-4">
                <div className="flex justify-between items-center text-sm font-bold">
                  <span className="text-surface-400">Processing Fee</span>
                  <span className="text-emerald-400">₹0 (Waived)</span>
                </div>
                <div className="flex justify-between items-center text-sm font-bold">
                  <span className="text-surface-400">Convenience Fee</span>
                  <span className="text-emerald-400">FREE</span>
                </div>
              </div>

              <div className="space-y-4">
                <button 
                  onClick={handleApply}
                  className="w-full py-5 bg-primary-600 hover:bg-primary-500 text-white font-black rounded-2xl transition-all shadow-xl shadow-primary-900/40 flex items-center justify-center gap-3 group"
                >
                  Apply Now <ArrowRight className="w-5 h-5 group-hover:translate-x-1 transition-transform" />
                </button>
                <button onClick={handleBrochure} className="w-full py-5 bg-white/5 hover:bg-white/10 text-white font-bold rounded-2xl transition-all border border-white/10 flex items-center justify-center gap-3">
                  Download Brochure
                </button>
              </div>

              <div className="flex items-center gap-3 justify-center text-[10px] font-bold text-surface-500 uppercase tracking-widest">
                <Zap className="w-3 h-3 text-amber-500" /> Powered by AI Intent Analysis
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
