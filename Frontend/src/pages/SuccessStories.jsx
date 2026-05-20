import { motion } from 'framer-motion';
import { Quote, Trophy, TrendingUp, Users } from 'lucide-react';
import { usePageTracking } from '../hooks/useTracking';

const stories = [
  {
    name: 'Anjali Sharma',
    role: 'Software Engineer',
    story: 'Starting an SIP at 22 was the best decision. Five years later, I have a significant corpus for my higher education without touching my parents savings.',
    metric: '₹2.5L to ₹8L in 5 years',
    tag: 'Early Investor'
  },
  {
    name: 'Vikram Mehta',
    role: 'Business Owner',
    story: 'FinovaWealth automated my tax saving investments. I used to scramble in March, but now my 80C is fully utilized by January every year.',
    metric: 'Save ₹46k tax annually',
    tag: 'Tax Efficiency'
  },
  {
    name: 'Rahul & Priya',
    role: 'Young Couple',
    story: 'We planned our first international trip solely through goal-based investing. Seeing the progress bar hit 100% was an incredible feeling.',
    metric: 'Goal achieved in 18 months',
    tag: 'Goal Focused'
  }
];

export default function SuccessStories() {
  usePageTracking('success-stories');

  return (
    <div className="space-y-16 pb-24">
      <div className="text-center max-w-3xl mx-auto space-y-4">
        <h1 className="text-4xl font-black text-surface-900 tracking-tight">
          Investor Success Stories
        </h1>
        <p className="text-lg text-surface-600 leading-relaxed">
          Real people, real goals, real wealth. Join 50,000+ investors who are building their financial future with FinovaWealth.
        </p>
      </div>

      <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-8">
        {stories.map((item, idx) => (
          <motion.div
            key={item.name}
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: idx * 0.1 }}
            className="bg-white rounded-[2.5rem] p-10 border border-surface-100 shadow-sm relative group"
          >
            <Quote className="w-12 h-12 text-primary-500/10 absolute top-8 left-8" />
            
            <div className="relative z-10 h-full flex flex-col">
              <div className="mb-8">
                <span className="text-[10px] font-black px-3 py-1 bg-primary-50 text-primary-600 rounded-full uppercase tracking-widest">
                  {item.tag}
                </span>
              </div>

              <p className="text-lg font-medium text-surface-700 italic leading-relaxed mb-10 flex-1">
                "{item.story}"
              </p>

              <div className="space-y-4">
                <div className="p-4 bg-surface-50 rounded-2xl flex items-center justify-between">
                   <div className="flex items-center gap-3">
                     <TrendingUp className="w-4 h-4 text-emerald-500" />
                     <span className="text-sm font-bold text-surface-900">{item.metric}</span>
                   </div>
                </div>
                
                <div className="flex items-center gap-4">
                  <div className="w-12 h-12 rounded-full bg-surface-200" />
                  <div>
                    <h4 className="font-bold text-surface-900">{item.name}</h4>
                    <p className="text-xs text-surface-500 uppercase tracking-tighter">{item.role}</p>
                  </div>
                </div>
              </div>
            </div>
          </motion.div>
        ))}
      </div>

      <div className="bg-primary-600 rounded-[3rem] p-12 text-white flex flex-col md:flex-row items-center gap-12">
        <div className="w-24 h-24 bg-white/20 rounded-full flex items-center justify-center shrink-0">
          <Trophy className="w-12 h-12 text-white" />
        </div>
        <div className="flex-1">
          <h2 className="text-3xl font-bold mb-4">Your Success Story Starts Here</h2>
          <p className="text-primary-100 text-lg mb-0">
            Automate your investments, track your goals, and see your wealth grow 
            with India's smartest behavioral investment platform.
          </p>
        </div>
        <button className="px-10 py-5 bg-white text-primary-600 font-black rounded-2xl hover:scale-105 transition-transform shrink-0">
          Start Investing Today
        </button>
      </div>

      <div className="flex flex-col items-center gap-6 mt-12">
        <div className="flex -space-x-4">
          {[1,2,3,4,5].map(i => (
            <div key={i} className="w-12 h-12 rounded-full border-4 border-white bg-surface-200" />
          ))}
        </div>
        <p className="text-surface-500 font-bold flex items-center gap-2">
          <Users className="w-5 h-5 text-primary-500" /> Join 50,000+ Happy Investors
        </p>
      </div>
    </div>
  );
}
