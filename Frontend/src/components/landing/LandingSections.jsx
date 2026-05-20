import { motion } from 'framer-motion';
import { Link } from 'react-router-dom';
import { ArrowRight, TrendingUp, Shield, PieChart, BarChart3, Target, Lightbulb, Users, Award, Star, ChevronRight, Activity, Zap, Brain, BellRing, CheckCircle2, LineChart, Wallet, GraduationCap, Home, Plane } from 'lucide-react';
import { AnimatedCounter } from '../common/UIComponents';
import { portfolioPerformance, testimonials } from '../../data/mockData';
import { AreaChart, Area, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer } from 'recharts';

/* ─── HERO ─────────────────────────────────────────────── */
export function HeroSection() {
  return (
    <section className="relative min-h-screen flex items-center gradient-hero overflow-hidden">
      {/* Background decoration */}
      <div className="absolute inset-0 overflow-hidden">
        <div className="absolute -top-40 -right-40 w-96 h-96 bg-primary-200/30 rounded-full blur-3xl animate-float" />
        <div className="absolute -bottom-40 -left-40 w-96 h-96 bg-accent-200/30 rounded-full blur-3xl animate-float" style={{ animationDelay: '3s' }} />
      </div>

      <div className="container-custom relative z-10 pt-24 pb-16">
        <div className="grid lg:grid-cols-2 gap-12 lg:gap-16 items-center">
          <motion.div initial={{ opacity: 0, y: 30 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.6 }}>
            <div className="inline-flex items-center gap-2 px-4 py-2 rounded-full bg-primary-50 border border-primary-100 mb-6">
              <Activity className="w-4 h-4 text-primary-600" />
              <span className="text-sm font-medium text-primary-700">AI-Powered Wealth Management</span>
            </div>

            <h1 className="font-display text-4xl sm:text-5xl lg:text-6xl font-bold text-surface-900 leading-tight mb-6">
              Invest with clarity.{' '}
              <span className="gradient-text">Plan your Financial Freedom.</span>
            </h1>

            <p className="text-lg text-surface-500 mb-8 max-w-lg leading-relaxed">
              Smart investment strategies powered by intelligent behavioral analytics.
              Build wealth with personalized AI recommendations and real-time portfolio insights.
            </p>

            <div className="flex flex-wrap gap-4 mb-12">
              <Link to="/signup" className="btn-primary text-base px-8 py-3.5 gap-2">
                Start Investing <ArrowRight className="w-5 h-5" />
              </Link>
              <Link to="/about" className="btn-secondary text-base px-8 py-3.5">
                Learn More
              </Link>
            </div>

            <div className="flex items-center gap-8">
              {[
                { value: 125000, suffix: '+', label: 'Active Investors' },
                { value: 2840, prefix: '₹', suffix: ' Cr', label: 'Assets Managed' },
                { value: 98, suffix: '%', label: 'Satisfaction' },
              ].map((stat) => (
                <div key={stat.label}>
                  <p className="text-2xl font-bold text-surface-900">
                    <AnimatedCounter end={stat.value} prefix={stat.prefix || ''} suffix={stat.suffix} />
                  </p>
                  <p className="text-xs text-surface-500 mt-0.5">{stat.label}</p>
                </div>
              ))}
            </div>
          </motion.div>

          {/* Analytics Card */}
          <motion.div initial={{ opacity: 0, x: 40 }} animate={{ opacity: 1, x: 0 }} transition={{ duration: 0.6, delay: 0.2 }}>
            <div className="bg-white rounded-3xl shadow-elevated p-6 border border-surface-100">
              <div className="flex items-center justify-between mb-4">
                <div>
                  <p className="text-sm text-surface-500">Portfolio Performance</p>
                  <p className="text-2xl font-bold text-surface-900 mt-1">₹28,47,500</p>
                </div>
                <span className="badge-success text-sm px-3 py-1">+26.56%</span>
              </div>
              <div className="h-48">
                <ResponsiveContainer width="100%" height="100%">
                  <AreaChart data={portfolioPerformance}>
                    <defs>
                      <linearGradient id="heroGradient" x1="0" y1="0" x2="0" y2="1">
                        <stop offset="0%" stopColor="#2E51F5" stopOpacity={0.15} />
                        <stop offset="100%" stopColor="#2E51F5" stopOpacity={0} />
                      </linearGradient>
                    </defs>
                    <CartesianGrid strokeDasharray="3 3" stroke="#E2E8F0" />
                    <XAxis dataKey="month" axisLine={false} tickLine={false} tick={{ fontSize: 11, fill: '#94A3B8' }} />
                    <YAxis hide />
                    <Tooltip contentStyle={{ borderRadius: '12px', border: '1px solid #E2E8F0', boxShadow: '0 4px 12px rgba(0,0,0,0.08)' }}
                      formatter={(v) => [`₹${(v/100000).toFixed(1)}L`, '']} />
                    <Area type="monotone" dataKey="value" stroke="#2E51F5" strokeWidth={2.5} fill="url(#heroGradient)" />
                  </AreaChart>
                </ResponsiveContainer>
              </div>
              <div className="grid grid-cols-3 gap-3 mt-4">
                {[
                  { label: 'Invested', value: '₹22.5L', color: 'text-surface-600' },
                  { label: 'Returns', value: '₹5.97L', color: 'text-accent-600' },
                  { label: 'Today', value: '+₹12,350', color: 'text-primary-600' },
                ].map((item) => (
                  <div key={item.label} className="bg-surface-50 rounded-xl p-3 text-center">
                    <p className="text-xs text-surface-500">{item.label}</p>
                    <p className={`text-sm font-bold ${item.color} mt-0.5`}>{item.value}</p>
                  </div>
                ))}
              </div>
            </div>
          </motion.div>
        </div>
      </div>
    </section>
  );
}

/* ─── INVESTMENT PRODUCTS ──────────────────────────────── */
export function InvestmentProducts() {
  const products = [
    { icon: PieChart, title: 'Mutual Funds', desc: 'Curated funds across large, mid, and small cap categories', link: '/mutual-funds', color: 'primary' },
    { icon: BarChart3, title: 'SIP Plans', desc: 'Systematic investment plans with auto-debit and smart step-up', link: '/sip-plans', color: 'accent' },
    { icon: Shield, title: 'Fixed Deposits', desc: 'Secure deposits with competitive rates from top banks', link: '#', color: 'amber' },
    { icon: TrendingUp, title: 'Stocks & ETFs', desc: 'Direct equity investments with real-time market data', link: '#', color: 'purple' },
    { icon: Wallet, title: 'Digital Gold', desc: '24K digital gold starting from just ₹1 with secure storage', link: '#', color: 'yellow' },
    { icon: LineChart, title: 'Bonds', desc: 'Government and corporate bonds for stable income', link: '#', color: 'blue' },
  ];

  const colorMap = { primary: 'bg-primary-50 text-primary-600', accent: 'bg-accent-50 text-accent-600', amber: 'bg-amber-50 text-amber-600', purple: 'bg-purple-50 text-purple-600', yellow: 'bg-yellow-50 text-yellow-600', blue: 'bg-blue-50 text-blue-600' };

  return (
    <section className="section-padding bg-white">
      <div className="container-custom">
        <motion.div initial={{ opacity: 0, y: 20 }} whileInView={{ opacity: 1, y: 0 }} viewport={{ once: true }} className="text-center mb-14">
          <h2 className="font-display text-3xl sm:text-4xl font-bold text-surface-900 mb-4">Investment Products</h2>
          <p className="text-surface-500 max-w-2xl mx-auto">Diversify your portfolio across multiple asset classes with India's most trusted investment platform</p>
        </motion.div>
        <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-6">
          {products.map((p, i) => (
            <motion.div key={p.title} initial={{ opacity: 0, y: 20 }} whileInView={{ opacity: 1, y: 0 }} viewport={{ once: true }} transition={{ delay: i * 0.1 }}>
              <Link to={p.link} className="block bg-white rounded-2xl p-6 border border-surface-100 shadow-soft card-hover group">
                <div className={`w-12 h-12 rounded-xl ${colorMap[p.color]} flex items-center justify-center mb-4`}>
                  <p.icon className="w-6 h-6" />
                </div>
                <h3 className="text-lg font-semibold text-surface-900 mb-2 group-hover:text-primary-600 transition-colors">{p.title}</h3>
                <p className="text-sm text-surface-500 mb-4">{p.desc}</p>
                <span className="text-sm font-medium text-primary-600 flex items-center gap-1 group-hover:gap-2 transition-all">
                  Explore <ChevronRight className="w-4 h-4" />
                </span>
              </Link>
            </motion.div>
          ))}
        </div>
      </div>
    </section>
  );
}

/* ─── GOAL INVESTING ───────────────────────────────────── */
export function GoalInvesting() {
  const goals = [
    { icon: Home, title: 'Dream Home', desc: 'Plan for your first home with a tailored savings strategy', color: 'bg-blue-500' },
    { icon: GraduationCap, title: 'Child Education', desc: 'Secure your child\'s future education with smart investments', color: 'bg-purple-500' },
    { icon: Plane, title: 'World Trip', desc: 'Fund your dream vacation without breaking the bank', color: 'bg-accent-500' },
    { icon: Shield, title: 'Retirement', desc: 'Build a corpus for a worry-free retirement life', color: 'bg-primary-500' },
  ];

  return (
    <section className="section-padding bg-surface-50">
      <div className="container-custom">
        <motion.div initial={{ opacity: 0, y: 20 }} whileInView={{ opacity: 1, y: 0 }} viewport={{ once: true }} className="text-center mb-14">
          <h2 className="font-display text-3xl sm:text-4xl font-bold text-surface-900 mb-4">Goal-Based Investing</h2>
          <p className="text-surface-500 max-w-2xl mx-auto">Set a goal, and we'll create a personalized investment roadmap to help you get there</p>
        </motion.div>
        <div className="grid sm:grid-cols-2 lg:grid-cols-4 gap-6">
          {goals.map((g, i) => (
            <motion.div key={g.title} initial={{ opacity: 0, y: 20 }} whileInView={{ opacity: 1, y: 0 }} viewport={{ once: true }} transition={{ delay: i * 0.1 }}
              className="bg-white rounded-2xl p-6 shadow-soft border border-surface-100 card-hover text-center group cursor-pointer">
              <div className={`w-14 h-14 rounded-2xl ${g.color} flex items-center justify-center mx-auto mb-4 shadow-lg group-hover:scale-110 transition-transform`}>
                <g.icon className="w-7 h-7 text-white" />
              </div>
              <h3 className="font-semibold text-surface-900 mb-2">{g.title}</h3>
              <p className="text-sm text-surface-500">{g.desc}</p>
            </motion.div>
          ))}
        </div>
      </div>
    </section>
  );
}

/* ─── WHY CHOOSE US ────────────────────────────────────── */
export function WhyChooseUs() {
  const reasons = [
    { icon: Brain, title: 'AI-Powered Insights', desc: 'Machine learning algorithms analyze your behavior to provide hyper-personalized investment recommendations' },
    { icon: Shield, title: 'Bank-Grade Security', desc: '256-bit encryption, 2FA authentication, and SEBI-registered platform ensuring your investments are always safe' },
    { icon: Target, title: 'Goal Tracking', desc: 'Real-time progress monitoring with intelligent alerts and automatic portfolio rebalancing' },
    { icon: Lightbulb, title: 'Smart Analytics', desc: 'Behavioral tracking engine that understands your investment patterns and optimizes your journey' },
    { icon: Users, title: '1.25 Lakh+ Investors', desc: 'Trusted by over 125,000 investors across India with ₹2,840 Cr assets under management' },
    { icon: Award, title: 'Award Winning', desc: 'Recognized by leading fintech publications and winner of Best Investment Platform 2024' },
  ];

  return (
    <section className="section-padding bg-white">
      <div className="container-custom">
        <motion.div initial={{ opacity: 0, y: 20 }} whileInView={{ opacity: 1, y: 0 }} viewport={{ once: true }} className="text-center mb-14">
          <h2 className="font-display text-3xl sm:text-4xl font-bold text-surface-900 mb-4">Why Choose Finova Wealth?</h2>
          <p className="text-surface-500 max-w-2xl mx-auto">Built by investors, for investors — with cutting-edge technology at its core</p>
        </motion.div>
        <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-8">
          {reasons.map((r, i) => (
            <motion.div key={r.title} initial={{ opacity: 0, y: 20 }} whileInView={{ opacity: 1, y: 0 }} viewport={{ once: true }} transition={{ delay: i * 0.08 }}
              className="flex gap-4 group">
              <div className="w-12 h-12 rounded-xl bg-primary-50 flex items-center justify-center flex-shrink-0 group-hover:bg-primary-100 transition-colors">
                <r.icon className="w-6 h-6 text-primary-600" />
              </div>
              <div>
                <h3 className="font-semibold text-surface-900 mb-1.5">{r.title}</h3>
                <p className="text-sm text-surface-500 leading-relaxed">{r.desc}</p>
              </div>
            </motion.div>
          ))}
        </div>
      </div>
    </section>
  );
}

/* ─── PORTFOLIO PERFORMANCE ────────────────────────────── */
export function PortfolioPerformanceSection() {
  return (
    <section className="section-padding bg-surface-50">
      <div className="container-custom">
        <div className="grid lg:grid-cols-2 gap-12 items-center">
          <motion.div initial={{ opacity: 0, x: -30 }} whileInView={{ opacity: 1, x: 0 }} viewport={{ once: true }}>
            <h2 className="font-display text-3xl sm:text-4xl font-bold text-surface-900 mb-4">Track Performance in Real-Time</h2>
            <p className="text-surface-500 mb-8 leading-relaxed">Monitor your investments with interactive charts, benchmark comparisons, and AI-driven insights — all in one dashboard.</p>
            <div className="space-y-4">
              {['Live portfolio tracking with real-time NAV', 'Benchmark comparison against Nifty 50', 'Tax-loss harvesting suggestions', 'Automated monthly performance reports'].map((item) => (
                <div key={item} className="flex items-center gap-3">
                  <CheckCircle2 className="w-5 h-5 text-accent-500 flex-shrink-0" />
                  <span className="text-sm text-surface-700">{item}</span>
                </div>
              ))}
            </div>
          </motion.div>
          <motion.div initial={{ opacity: 0, x: 30 }} whileInView={{ opacity: 1, x: 0 }} viewport={{ once: true }}
            className="bg-white rounded-2xl shadow-card p-6 border border-surface-100">
            <div className="flex items-center justify-between mb-4">
              <h3 className="font-semibold text-surface-900">Your Portfolio vs Benchmark</h3>
              <span className="text-xs text-surface-400">Last 12 months</span>
            </div>
            <div className="h-64">
              <ResponsiveContainer width="100%" height="100%">
                <AreaChart data={portfolioPerformance}>
                  <defs>
                    <linearGradient id="pfGrad" x1="0" y1="0" x2="0" y2="1">
                      <stop offset="0%" stopColor="#2E51F5" stopOpacity={0.12} />
                      <stop offset="100%" stopColor="#2E51F5" stopOpacity={0} />
                    </linearGradient>
                    <linearGradient id="bmGrad" x1="0" y1="0" x2="0" y2="1">
                      <stop offset="0%" stopColor="#10B981" stopOpacity={0.08} />
                      <stop offset="100%" stopColor="#10B981" stopOpacity={0} />
                    </linearGradient>
                  </defs>
                  <CartesianGrid strokeDasharray="3 3" stroke="#E2E8F0" />
                  <XAxis dataKey="month" axisLine={false} tickLine={false} tick={{ fontSize: 11, fill: '#94A3B8' }} />
                  <YAxis hide />
                  <Tooltip contentStyle={{ borderRadius: '12px', border: '1px solid #E2E8F0' }}
                    formatter={(v) => [`₹${(v/100000).toFixed(1)}L`, '']} />
                  <Area type="monotone" dataKey="value" name="Portfolio" stroke="#2E51F5" strokeWidth={2} fill="url(#pfGrad)" />
                  <Area type="monotone" dataKey="benchmark" name="Nifty 50" stroke="#10B981" strokeWidth={2} fill="url(#bmGrad)" strokeDasharray="5 5" />
                </AreaChart>
              </ResponsiveContainer>
            </div>
          </motion.div>
        </div>
      </div>
    </section>
  );
}

/* ─── TESTIMONIALS ─────────────────────────────────────── */
export function TestimonialsSection() {
  return (
    <section className="section-padding bg-white">
      <div className="container-custom">
        <motion.div initial={{ opacity: 0, y: 20 }} whileInView={{ opacity: 1, y: 0 }} viewport={{ once: true }} className="text-center mb-14">
          <h2 className="font-display text-3xl sm:text-4xl font-bold text-surface-900 mb-4">Loved by Investors</h2>
          <p className="text-surface-500">See what our community says about their experience</p>
        </motion.div>
        <div className="grid md:grid-cols-3 gap-6">
          {testimonials.map((t, i) => (
            <motion.div key={t.name} initial={{ opacity: 0, y: 20 }} whileInView={{ opacity: 1, y: 0 }} viewport={{ once: true }} transition={{ delay: i * 0.1 }}
              className="bg-white rounded-2xl p-6 border border-surface-100 shadow-soft card-hover">
              <div className="flex gap-1 mb-4">
                {[...Array(5)].map((_, j) => <Star key={j} className="w-4 h-4 fill-amber-400 text-amber-400" />)}
              </div>
              <p className="text-surface-600 text-sm mb-6 leading-relaxed">"{t.quote}"</p>
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-3">
                  <div className="w-10 h-10 rounded-full bg-gradient-to-br from-primary-500 to-accent-500 flex items-center justify-center text-white font-semibold text-sm">{t.avatar}</div>
                  <div>
                    <p className="font-semibold text-surface-900 text-sm">{t.name}</p>
                    <p className="text-xs text-surface-500">{t.role}</p>
                  </div>
                </div>
                <span className="text-accent-600 font-bold text-sm">{t.returns}</span>
              </div>
            </motion.div>
          ))}
        </div>
      </div>
    </section>
  );
}

/* ─── BEHAVIORAL SHOWCASE ──────────────────────────────── */
export function BehavioralShowcase() {
  const steps = [
    { icon: Activity, title: 'User Visit', desc: 'Track every interaction', color: 'bg-blue-500' },
    { icon: Zap, title: 'Event Tracking', desc: 'Clicks, scrolls, forms', color: 'bg-purple-500' },
    { icon: Target, title: 'Intent Detection', desc: 'ML-powered scoring', color: 'bg-amber-500' },
    { icon: Brain, title: 'AI Decision Engine', desc: 'Smart trigger logic', color: 'bg-primary-500' },
    { icon: BellRing, title: 'Smart Notification', desc: 'Personalized nudges', color: 'bg-accent-500' },
    { icon: CheckCircle2, title: 'Conversion', desc: 'Higher engagement', color: 'bg-green-500' },
  ];

  return (
    <section className="section-padding bg-surface-900 text-white">
      <div className="container-custom">
        <motion.div initial={{ opacity: 0, y: 20 }} whileInView={{ opacity: 1, y: 0 }} viewport={{ once: true }} className="text-center mb-14">
          <div className="inline-flex items-center gap-2 px-4 py-2 rounded-full bg-white/10 border border-white/10 mb-6">
            <Brain className="w-4 h-4 text-primary-400" />
            <span className="text-sm font-medium text-primary-300">Core Technology</span>
          </div>
          <h2 className="font-display text-3xl sm:text-4xl font-bold mb-4">Behavioral Tracking & Re-engagement</h2>
          <p className="text-surface-400 max-w-2xl mx-auto">Our intelligent engine tracks user behavior in real-time and triggers personalized re-engagement campaigns</p>
        </motion.div>

        <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-6 gap-4 relative">
          {steps.map((s, i) => (
            <motion.div key={s.title} initial={{ opacity: 0, y: 20 }} whileInView={{ opacity: 1, y: 0 }} viewport={{ once: true }} transition={{ delay: i * 0.1 }}
              className="relative text-center group">
              <div className={`w-14 h-14 rounded-2xl ${s.color} flex items-center justify-center mx-auto mb-3 shadow-lg group-hover:scale-110 transition-transform`}>
                <s.icon className="w-7 h-7 text-white" />
              </div>
              <h4 className="font-semibold text-sm mb-1">{s.title}</h4>
              <p className="text-xs text-surface-400">{s.desc}</p>
              {i < steps.length - 1 && (
                <div className="hidden lg:block absolute top-7 -right-2 w-4">
                  <ChevronRight className="w-4 h-4 text-surface-600" />
                </div>
              )}
            </motion.div>
          ))}
        </div>
      </div>
    </section>
  );
}

/* ─── CTA ──────────────────────────────────────────────── */
export function CTASection() {
  return (
    <section className="section-padding bg-gradient-to-br from-primary-600 via-primary-500 to-accent-500 text-white relative overflow-hidden">
      <div className="absolute inset-0">
        <div className="absolute -top-20 -right-20 w-80 h-80 bg-white/5 rounded-full" />
        <div className="absolute -bottom-20 -left-20 w-60 h-60 bg-white/5 rounded-full" />
      </div>
      <div className="container-custom relative z-10 text-center">
        <motion.div initial={{ opacity: 0, y: 20 }} whileInView={{ opacity: 1, y: 0 }} viewport={{ once: true }}>
          <h2 className="font-display text-3xl sm:text-4xl lg:text-5xl font-bold mb-6">
            Start Your Investment Journey Today
          </h2>
          <p className="text-lg text-white/80 max-w-2xl mx-auto mb-10">
            Join 1.25 lakh+ investors who trust Finova Wealth. Get started in under 5 minutes with zero paperwork.
          </p>
          <div className="flex flex-wrap justify-center gap-4">
            <Link to="/signup" className="inline-flex items-center gap-2 px-8 py-4 bg-white text-primary-600 font-bold rounded-xl shadow-elevated hover:-translate-y-1 transition-all text-lg">
              Create Free Account <ArrowRight className="w-5 h-5" />
            </Link>
            <Link to="/contact" className="inline-flex items-center gap-2 px-8 py-4 bg-white/10 text-white font-semibold rounded-xl border border-white/20 hover:bg-white/20 transition-all text-lg">
              Talk to Advisor
            </Link>
          </div>
        </motion.div>
      </div>
    </section>
  );
}
