import { useState } from 'react';
import { NavLink, Outlet, useLocation, useNavigate } from 'react-router-dom';
import { motion, AnimatePresence } from 'framer-motion';
import {
  LayoutDashboard, PieChart, BarChart3, Target, Wallet, ArrowLeftRight, Activity, Radio,
  Brain, Bell, UserCircle, Settings, TrendingUp, Menu, X, Search, ChevronDown,
  LineChart, Shield, Users, Zap, HelpCircle, LogOut, Clock
} from 'lucide-react';
import useStore from '../../store/useStore';
import { useAuth } from '../../context/AuthContext';

const navItems = [
  { section: 'Main', items: [
    { name: 'Dashboard', icon: LayoutDashboard, path: '/dashboard' },
    { name: 'Portfolio', icon: PieChart, path: '/portfolio' },
    { name: 'Transactions', icon: ArrowLeftRight, path: '/transactions' },
  ]},
  { section: 'Invest', items: [
    { name: 'Mutual Funds', icon: BarChart3, path: '/mutual-funds' },
    { name: 'SIP Plans', icon: LineChart, path: '/sip-plans' },
    { name: 'Investment Plans', icon: Wallet, path: '/investment-plans' },
    { name: 'Insurance', icon: Shield, path: '/insurance-plans' },
    { name: 'Tax Saving', icon: TrendingUp, path: '/tax-saving' },
    { name: 'Wealth', icon: Users, path: '/wealth-management' },
  ]},
  { section: 'Plan', items: [
    { name: 'Goal Planning', icon: Target, path: '/goal-planning' },
    { name: 'Retirement', icon: Shield, path: '/retirement-planning' },
    { name: 'Compare Plans', icon: Activity, path: '/plan-comparison' },
    { name: 'Return Calculator', icon: Radio, path: '/investment-calculator' },
  ]},

  { section: 'Other', items: [
    { name: 'AI Insights', icon: Brain, path: '/ai-recommendations' },
    { name: 'Beginner Guides', icon: HelpCircle, path: '/beginner-guides' },
    { name: 'Notifications', icon: Bell, path: '/notifications' },
    { name: 'Settings', icon: Settings, path: '/profile' },
  ]},
];

/** Get user initials from fullName (e.g. "Nikhil H" → "NH") */
function getInitials(name) {
  if (!name) return '??';
  const parts = name.trim().split(/\s+/);
  if (parts.length === 1) return parts[0][0].toUpperCase();
  return (parts[0][0] + parts[parts.length - 1][0]).toUpperCase();
}

/** Get first name from fullName */
function getFirstName(name) {
  if (!name) return 'User';
  return name.trim().split(/\s+/)[0];
}

export default function DashboardLayout() {
  const { sidebarOpen, toggleSidebar, unreadCount } = useStore();
  const [mobileOpen, setMobileOpen] = useState(false);
  const location = useLocation();
  const navigate = useNavigate();
  const { user, logout } = useAuth();

  const initials = getInitials(user?.fullName);
  const firstName = getFirstName(user?.fullName);

  const handleLogout = () => {
    logout();
    navigate('/login');
  };

  const SidebarContent = () => (
    <div className="flex flex-col h-full">
      {/* Logo */}
      <div className="flex items-center gap-2.5 px-5 h-16 border-b border-surface-100 flex-shrink-0">
        <div className="w-8 h-8 rounded-lg gradient-primary flex items-center justify-center">
          <TrendingUp className="w-4 h-4 text-white" />
        </div>
        {sidebarOpen && <span className="font-display font-bold text-lg text-surface-900">Finova<span className="text-primary-600">Wealth</span></span>}
      </div>

      {/* Nav */}
      <nav className="flex-1 overflow-y-auto py-4 px-3 space-y-6">
        {navItems.map((group) => (
          <div key={group.section}>
            {sidebarOpen && <p className="text-[10px] uppercase tracking-widest font-semibold text-surface-400 px-3 mb-2">{group.section}</p>}
            <div className="space-y-1">
              {group.items.map((item) => (
                <NavLink key={item.path} to={item.path} onClick={() => setMobileOpen(false)}
                  className={({ isActive }) => isActive ? 'sidebar-link-active' : 'sidebar-link'}>
                  <item.icon className="w-5 h-5 flex-shrink-0" />
                  {sidebarOpen && <span className="text-sm truncate">{item.name}</span>}
                  {item.name === 'Notifications' && unreadCount > 0 && sidebarOpen && (
                    <span className="ml-auto bg-red-500 text-white text-[10px] font-bold rounded-full w-5 h-5 flex items-center justify-center">{unreadCount}</span>
                  )}
                </NavLink>
              ))}
            </div>
          </div>
        ))}
      </nav>

      {/* User */}
      {sidebarOpen && (
        <div className="border-t border-surface-100 p-4">
          <div className="flex items-center gap-3">
            <div className="w-9 h-9 rounded-full bg-gradient-to-br from-primary-500 to-accent-500 flex items-center justify-center text-white font-semibold text-sm">{initials}</div>
            <div className="flex-1 min-w-0">
              <p className="text-sm font-semibold text-surface-900 truncate">{user?.fullName || 'User'}</p>
              <p className="text-xs text-surface-400 truncate">{user?.email || ''}</p>
            </div>
            <button onClick={handleLogout} className="p-1.5 rounded-lg hover:bg-surface-100 text-surface-400" title="Logout"><LogOut className="w-4 h-4" /></button>
          </div>
        </div>
      )}
    </div>
  );

  return (
    <div className="min-h-screen bg-surface-50 flex">
      {/* Desktop Sidebar */}
      <aside className={`hidden lg:block ${sidebarOpen ? 'w-64' : 'w-20'} bg-white border-r border-surface-100 fixed inset-y-0 left-0 z-30 transition-all duration-300`}>
        <SidebarContent />
      </aside>

      {/* Mobile Sidebar Overlay */}
      <AnimatePresence>
        {mobileOpen && (
          <>
            <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
              className="fixed inset-0 bg-black/30 z-40 lg:hidden" onClick={() => setMobileOpen(false)} />
            <motion.aside initial={{ x: -280 }} animate={{ x: 0 }} exit={{ x: -280 }}
              className="fixed inset-y-0 left-0 w-64 bg-white z-50 lg:hidden shadow-elevated">
              <SidebarContent />
            </motion.aside>
          </>
        )}
      </AnimatePresence>

      {/* Main Content */}
      <div className={`flex-1 ${sidebarOpen ? 'lg:ml-64' : 'lg:ml-20'} transition-all duration-300`}>
        {/* TopBar */}
        <header className="sticky top-0 z-20 bg-white/90 backdrop-blur-xl border-b border-surface-100 h-16 flex items-center px-4 sm:px-6 gap-4">
          <button onClick={() => { if (window.innerWidth < 1024) setMobileOpen(true); else toggleSidebar(); }}
            className="p-2 rounded-lg hover:bg-surface-50 text-surface-500"><Menu className="w-5 h-5" /></button>
          
          <div className="flex-1 max-w-md">
            <div className="relative">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-surface-400" />
              <input type="text" placeholder="Search funds, SIPs, goals..." className="w-full pl-10 pr-4 py-2 bg-surface-50 border border-surface-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-primary-500/20 focus:border-primary-500" />
            </div>
          </div>

          <div className="flex items-center gap-2">
            <NavLink to="/notifications" className="relative p-2 rounded-lg hover:bg-surface-50">
              <Bell className="w-5 h-5 text-surface-500" />
              {unreadCount > 0 && <span className="absolute top-1 right-1 w-2 h-2 bg-red-500 rounded-full" />}
            </NavLink>
            <NavLink to="/help" className="p-2 rounded-lg hover:bg-surface-50 hidden sm:flex"><HelpCircle className="w-5 h-5 text-surface-500" /></NavLink>
            <NavLink to="/profile" className="flex items-center gap-2 pl-2 pr-3 py-1.5 rounded-lg hover:bg-surface-50">
              <div className="w-8 h-8 rounded-full bg-gradient-to-br from-primary-500 to-accent-500 flex items-center justify-center text-white font-semibold text-xs">{initials}</div>
              <span className="text-sm font-medium text-surface-700 hidden sm:block">{firstName}</span>
            </NavLink>
          </div>
        </header>

        {/* Page Content */}
        <main className="p-4 sm:p-6 lg:p-8">
          <Outlet />
        </main>
      </div>
    </div>
  );
}
