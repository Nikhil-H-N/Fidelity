import { motion } from 'framer-motion';
import { BookOpen, Compass, Lightbulb, Map, ArrowRight, CheckCircle2 } from 'lucide-react';
import { usePageTracking } from '../hooks/useTracking';

const guides = [
  {
    title: 'Investment Basics 101',
    duration: '10 min read',
    description: 'Understand the core concepts of risk, return, and asset allocation.',
    icon: BookOpen,
    color: 'text-primary-600',
    bg: 'bg-primary-50'
  },
  {
    title: 'The Power of Compounding',
    duration: '8 min read',
    description: 'Learn why starting early is the most important factor in wealth creation.',
    icon: Lightbulb,
    color: 'text-amber-600',
    bg: 'bg-amber-50'
  },
  {
    title: 'Choosing Your First Fund',
    duration: '12 min read',
    description: 'A step-by-step guide to selecting mutual funds that align with your goals.',
    icon: Compass,
    color: 'text-emerald-600',
    bg: 'bg-emerald-50'
  },
  {
    title: 'Financial Roadmap',
    duration: '15 min read',
    description: 'Create a comprehensive plan for life milestones like marriage and home buying.',
    icon: Map,
    color: 'text-indigo-600',
    bg: 'bg-indigo-50'
  }
];

export default function BeginnerGuides() {
  usePageTracking('beginner-guides');

  return (
    <div className="space-y-12 pb-24">
      <div className="max-w-3xl">
        <h1 className="text-4xl font-black text-surface-900 tracking-tight">
          Beginner Guides
        </h1>
        <p className="text-lg text-surface-600 mt-4 leading-relaxed">
          New to investing? Don't worry, we've got you covered. Our curated guides break down complex financial concepts into simple, actionable steps.
        </p>
      </div>

      <div className="grid md:grid-cols-2 gap-8">
        {guides.map((guide, idx) => (
          <motion.div
            key={guide.title}
            initial={{ opacity: 0, scale: 0.95 }}
            animate={{ opacity: 1, scale: 1 }}
            transition={{ delay: idx * 0.1 }}
            className="group bg-white rounded-[2.5rem] p-8 border border-surface-100 shadow-sm hover:shadow-xl hover:shadow-primary-900/5 transition-all"
          >
            <div className={`w-14 h-14 rounded-2xl ${guide.bg} ${guide.color} flex items-center justify-center mb-6`}>
              <guide.icon className="w-8 h-8" />
            </div>
            
            <div className="flex items-center gap-2 mb-3">
              <span className="text-[10px] font-black px-2 py-0.5 bg-surface-100 text-surface-500 rounded-full uppercase tracking-wider">
                {guide.duration}
              </span>
            </div>

            <h3 className="text-2xl font-bold text-surface-900 mb-3">{guide.title}</h3>
            <p className="text-surface-500 mb-8 leading-relaxed">{guide.description}</p>
            
            <button className="flex items-center gap-3 text-sm font-black text-primary-600 group-hover:gap-4 transition-all">
              START READING <ArrowRight className="w-5 h-5" />
            </button>
          </motion.div>
        ))}
      </div>

      <div className="bg-surface-50 rounded-[3rem] p-12 border border-surface-100">
        <div className="flex flex-col md:flex-row items-center gap-12">
          <div className="flex-1 space-y-6">
            <h2 className="text-3xl font-bold text-surface-900">Learning Path for Success</h2>
            <div className="space-y-4">
              {[
                'Define your financial goals and time horizon.',
                'Understand your risk tolerance profile.',
                'Start small but be consistent with SIPs.',
                'Diversify across asset classes and categories.'
              ].map(step => (
                <div key={step} className="flex items-start gap-4">
                  <div className="w-6 h-6 rounded-full bg-emerald-500 flex items-center justify-center shrink-0 mt-1">
                    <CheckCircle2 className="w-4 h-4 text-white" />
                  </div>
                  <p className="text-surface-700 font-medium leading-relaxed">{step}</p>
                </div>
              ))}
            </div>
            <button className="mt-4 px-8 py-4 bg-surface-900 text-white font-black rounded-2xl hover:bg-primary-600 transition-all">
              Take Free Assessment
            </button>
          </div>
          <div className="w-full md:w-1/3 aspect-square bg-white rounded-[3rem] shadow-card flex items-center justify-center p-12 relative">
             <div className="absolute inset-0 bg-gradient-to-br from-primary-500/10 to-transparent rounded-[3rem]" />
             <BookOpen className="w-full h-full text-primary-200" />
          </div>
        </div>
      </div>
    </div>
  );
}
