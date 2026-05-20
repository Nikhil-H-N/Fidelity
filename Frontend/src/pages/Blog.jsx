import { motion } from 'framer-motion';
import { Calendar, Clock, ArrowRight } from 'lucide-react';
import Navbar from '../components/common/Navbar';
import Footer from '../components/common/Footer';
import { usePageTracking } from '../hooks/useTracking';

const posts = [
  { id: 1, title: 'How SIP Can Build Long-Term Wealth', excerpt: 'Discover why systematic investment plans remain the gold standard for wealth creation.', category: 'Investment', date: 'Jan 15, 2025', readTime: '5 min' },
  { id: 2, title: 'Tax Saving Strategies for FY 2025', excerpt: 'Maximize your Section 80C benefits with these smart investment strategies.', category: 'Tax Planning', date: 'Jan 10, 2025', readTime: '7 min' },
  { id: 3, title: 'Understanding Mutual Fund Categories', excerpt: 'A comprehensive guide to choosing the right mutual fund category for your goals.', category: 'Education', date: 'Jan 5, 2025', readTime: '6 min' },
  { id: 4, title: 'The Power of Behavioral Analytics in Fintech', excerpt: 'How AI and behavioral data are transforming investment recommendations.', category: 'Technology', date: 'Dec 28, 2024', readTime: '8 min' },
  { id: 5, title: 'Retirement Planning in Your 30s', excerpt: 'It\'s never too early to start. Here\'s your complete retirement planning guide.', category: 'Retirement', date: 'Dec 20, 2024', readTime: '6 min' },
  { id: 6, title: 'Market Outlook 2025: What to Expect', excerpt: 'Our analysts share their predictions for the Indian equity markets in 2025.', category: 'Market', date: 'Dec 15, 2024', readTime: '10 min' },
];

const colors = { Investment: 'bg-blue-50 text-blue-700', 'Tax Planning': 'bg-green-50 text-green-700', Education: 'bg-purple-50 text-purple-700', Technology: 'bg-amber-50 text-amber-700', Retirement: 'bg-red-50 text-red-700', Market: 'bg-primary-50 text-primary-700' };

export default function Blog() {
  usePageTracking('blog');

  return (
    <div className="min-h-screen"><Navbar />
      <main className="pt-20">
        <section className="section-padding gradient-hero">
          <div className="container-custom text-center">
            <h1 className="font-display text-4xl font-bold text-surface-900 mb-4">Finova Blog</h1>
            <p className="text-lg text-surface-500 max-w-xl mx-auto">Insights, guides, and market analysis for smarter investing</p>
          </div>
        </section>
        <section className="section-padding bg-white">
          <div className="container-custom">
            <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-6">
              {posts.map((post, i) => (
                <motion.article key={post.id} initial={{ opacity: 0, y: 20 }} whileInView={{ opacity: 1, y: 0 }} viewport={{ once: true }} transition={{ delay: i * 0.08 }}
                  className="bg-white rounded-2xl border border-surface-100 shadow-soft card-hover overflow-hidden group cursor-pointer">
                  <div className="h-40 bg-gradient-to-br from-primary-100 to-accent-50 flex items-center justify-center">
                    <span className="font-display text-4xl font-bold text-primary-200">{post.id}</span>
                  </div>
                  <div className="p-6">
                    <span className={`px-2.5 py-1 rounded-full text-xs font-semibold ${colors[post.category]}`}>{post.category}</span>
                    <h2 className="text-lg font-semibold text-surface-900 mt-3 mb-2 group-hover:text-primary-600 transition-colors">{post.title}</h2>
                    <p className="text-sm text-surface-500 mb-4">{post.excerpt}</p>
                    <div className="flex items-center gap-4 text-xs text-surface-400">
                      <span className="flex items-center gap-1"><Calendar className="w-3 h-3" /> {post.date}</span>
                      <span className="flex items-center gap-1"><Clock className="w-3 h-3" /> {post.readTime}</span>
                    </div>
                  </div>
                </motion.article>
              ))}
            </div>
          </div>
        </section>
      </main>
      <Footer />
    </div>
  );
}
