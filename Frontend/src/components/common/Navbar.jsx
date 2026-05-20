import { useState, useEffect } from 'react';
import { Link, useLocation } from 'react-router-dom';
import { motion, AnimatePresence } from 'framer-motion';
import { Menu, X, ChevronDown, Bell, User, TrendingUp, Shield } from 'lucide-react';
import useStore from '../../store/useStore';

const navLinks = [
  { name: 'Invest', href: '/invest', children: [
    { name: 'Mutual Funds', href: '/mutual-funds' },
    { name: 'SIP Plans', href: '/sip-plans' },
    { name: 'Investment Plans', href: '/investment-plans' },
    { name: 'Insurance Plans', href: '/insurance-plans' },
    { name: 'Tax Saving', href: '/tax-saving' },
    { name: 'Wealth Management', href: '/wealth-management' },
  ]},
  { name: 'Plan', href: '/plan', children: [
    { name: 'Goal Planning', href: '/goal-planning' },
    { name: 'Retirement', href: '/retirement-planning' },
    { name: 'Compare Plans', href: '/plan-comparison' },
    { name: 'Calculators', href: '/investment-calculator' },
  ]},
  { name: 'Learn', href: '/blog', children: [
    { name: 'Blogs', href: '/blog' },
    { name: 'Beginner Guides', href: '/beginner-guides' },
    { name: 'Success Stories', href: '/success-stories' },
    { name: 'FAQ', href: '/faq' },
  ]},
  { name: 'Portfolio', href: '/portfolio' },
  { name: 'Dashboard', href: '/dashboard' },
  { name: 'About', href: '/about' },
];

export default function Navbar() {
  const [scrolled, setScrolled] = useState(false);
  const [mobileOpen, setMobileOpen] = useState(false);
  const [activeDropdown, setActiveDropdown] = useState(null);
  const location = useLocation();
  const { unreadCount } = useStore();

  useEffect(() => {
    const handleScroll = () => setScrolled(window.scrollY > 20);
    window.addEventListener('scroll', handleScroll, { passive: true });
    return () => window.removeEventListener('scroll', handleScroll);
  }, []);

  useEffect(() => { setMobileOpen(false); }, [location]);

  return (
    <nav className={`fixed top-0 left-0 right-0 z-50 transition-all duration-300 ${
      scrolled ? 'bg-white/90 backdrop-blur-xl shadow-soft' : 'bg-transparent'
    }`}>
      <div className="container-custom">
        <div className="flex items-center justify-between h-16 lg:h-20">
          {/* Logo */}
          <Link to="/" className="flex items-center gap-2.5">
            <div className="w-9 h-9 rounded-xl gradient-primary flex items-center justify-center shadow-glow">
              <TrendingUp className="w-5 h-5 text-white" />
            </div>
            <span className="font-display font-bold text-xl text-surface-900">
              Finova<span className="text-primary-600">Wealth</span>
            </span>
          </Link>

          {/* Desktop Nav */}
          <div className="hidden lg:flex items-center gap-1">
            {navLinks.map((link) => (
              <div key={link.name} className="relative"
                onMouseEnter={() => link.children && setActiveDropdown(link.name)}
                onMouseLeave={() => setActiveDropdown(null)}>
                <Link to={link.href}
                  className={`flex items-center gap-1 px-4 py-2 rounded-lg text-sm font-medium transition-colors ${
                    location.pathname === link.href ? 'text-primary-600 bg-primary-50' : 'text-surface-600 hover:text-surface-900 hover:bg-surface-50'
                  }`}>
                  {link.name}
                  {link.children && <ChevronDown className="w-3.5 h-3.5" />}
                </Link>
                
                <AnimatePresence>
                  {link.children && activeDropdown === link.name && (
                    <motion.div initial={{ opacity: 0, y: 8 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: 8 }}
                      className="absolute top-full left-0 mt-1 w-52 bg-white rounded-xl shadow-elevated border border-surface-100 py-2 overflow-hidden">
                      {link.children.map((child) => (
                        <Link key={child.name} to={child.href}
                          className="block px-4 py-2.5 text-sm text-surface-600 hover:text-primary-600 hover:bg-primary-50 transition-colors">
                          {child.name}
                        </Link>
                      ))}
                    </motion.div>
                  )}
                </AnimatePresence>
              </div>
            ))}
          </div>

          {/* Desktop Actions */}
          <div className="hidden lg:flex items-center gap-3">
            <Link to="/notifications" className="relative p-2 rounded-lg hover:bg-surface-50 transition-colors">
              <Bell className="w-5 h-5 text-surface-500" />
              {unreadCount > 0 && (
                <span className="absolute -top-0.5 -right-0.5 w-4.5 h-4.5 bg-red-500 text-white text-[10px] font-bold rounded-full flex items-center justify-center">
                  {unreadCount}
                </span>
              )}
            </Link>
            <Link to="/profile" className="p-2 rounded-lg hover:bg-surface-50 transition-colors">
              <User className="w-5 h-5 text-surface-500" />
            </Link>
            <a href={import.meta.env.VITE_ADMIN_URL || 'http://localhost:5174'} className="text-sm py-2 px-4 font-medium text-surface-500 hover:text-surface-900 transition-colors flex items-center gap-1.5">
              <Shield className="w-3.5 h-3.5" />
              Admin
            </a>
            <Link to="/login" className="btn-secondary text-sm py-2 px-4">Log In</Link>
            <Link to="/signup" className="btn-primary text-sm py-2 px-4">Get Started</Link>
          </div>

          {/* Mobile Toggle */}
          <button className="lg:hidden p-2 rounded-lg hover:bg-surface-50" onClick={() => setMobileOpen(!mobileOpen)}>
            {mobileOpen ? <X className="w-6 h-6" /> : <Menu className="w-6 h-6" />}
          </button>
        </div>
      </div>

      {/* Mobile Menu */}
      <AnimatePresence>
        {mobileOpen && (
          <motion.div initial={{ opacity: 0, height: 0 }} animate={{ opacity: 1, height: 'auto' }} exit={{ opacity: 0, height: 0 }}
            className="lg:hidden bg-white border-t border-surface-100 shadow-elevated">
            <div className="container-custom py-4 space-y-1">
              {navLinks.map((link) => (
                <div key={link.name}>
                  <Link to={link.href} className="block px-4 py-3 rounded-lg text-surface-700 font-medium hover:bg-primary-50 hover:text-primary-600">
                    {link.name}
                  </Link>
                  {link.children?.map((child) => (
                    <Link key={child.name} to={child.href} className="block px-8 py-2.5 text-sm text-surface-500 hover:text-primary-600">
                      {child.name}
                    </Link>
                  ))}
                </div>
              ))}
              <div className="pt-4 space-y-2">
                <a href={import.meta.env.VITE_ADMIN_URL || 'http://localhost:5174'} className="flex items-center justify-center gap-1.5 text-sm py-2.5 text-surface-500 hover:text-surface-900 border border-surface-200 rounded-xl font-medium">
                  <Shield className="w-3.5 h-3.5" />
                  Admin Login
                </a>
                <div className="flex gap-3">
                  <Link to="/login" className="btn-secondary flex-1 text-sm py-2.5">Log In</Link>
                  <Link to="/signup" className="btn-primary flex-1 text-sm py-2.5">Get Started</Link>
                </div>
              </div>
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </nav>
  );
}
