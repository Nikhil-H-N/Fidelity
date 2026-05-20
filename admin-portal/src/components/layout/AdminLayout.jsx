import { useState } from 'react';
import { NavLink, Outlet } from 'react-router-dom';
import {
  LayoutDashboard, Users, Zap, ShieldAlert, Trash2, Cpu,
  Settings, Radio, Clock, BarChart3, LogOut, Menu, X, Bell, Send,
  Thermometer, Filter, GitBranch, TrendingUp, Brain
} from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';
import { engineApi, backendApi } from '../../utils/apiBase';
import { useAdminAuth } from '../../context/AdminAuthContext';

const navItems = [
  { name: 'Overview', icon: LayoutDashboard, path: '/' },
  { name: 'Behavioral Analytics', icon: BarChart3, path: '/analytics' },
  { name: 'Funnel Analytics', icon: Filter, path: '/funnel' },
  { name: 'Path Discovery', icon: GitBranch, path: '/path-discovery' },
  { name: 'System Alerts', icon: Bell, path: '/alerts' },
  { name: 'Live Stream', icon: Radio, path: '/live' },
  { name: 'Click Analytics', icon: Thermometer, path: '/click-analytics' },
  { name: 'Event Tracking', icon: Zap, path: '/events' },
  { name: 'Session Timeline', icon: Clock, path: '/timeline' },
  { name: 'Notification Engine', icon: Send, path: '/notifications' },
  { name: 'ML Intelligence', icon: Cpu, path: '/ml' },
  { name: 'AI Insights', icon: Brain, path: '/ai-insights' },
  { name: 'Popup Analytics', icon: BarChart3, path: '/popup-analytics' },
];

export default function AdminLayout() {
  const { user, logout } = useAdminAuth();
  const [sidebarOpen, setSidebarOpen] = useState(true);
  const [mobileOpen, setMobileOpen] = useState(false);

  const handleReset = async () => {
    if (confirm('Wipe engine state?')) {
      const token = localStorage.getItem('adminToken');
      await fetch(engineApi('/admin/reset-all-sessions'), {
        method: 'POST',
        headers: token ? { Authorization: `Bearer ${token}` } : {},
      });
      window.location.reload();
    }
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
      <nav className="flex-1 overflow-y-auto py-4 px-3 space-y-1">
        {navItems.map((item) => (
          <NavLink key={item.path} to={item.path} onClick={() => setMobileOpen(false)}
            className={({ isActive }) => isActive ? 'sidebar-link-active' : 'sidebar-link'}>
            <item.icon className="w-5 h-5 flex-shrink-0" />
            {sidebarOpen && <span className="text-sm truncate">{item.name}</span>}
          </NavLink>
        ))}
      </nav>

      {/* Actions */}
      {sidebarOpen && (
        <div className="border-t border-surface-100 p-4 space-y-2">
          <button onClick={handleReset} className="w-full flex items-center gap-3 px-4 py-3 text-red-500 hover:bg-red-50 rounded-xl font-medium transition-colors text-sm">
            <Trash2 className="w-4 h-4 flex-shrink-0" />
            <span>Flush Engine</span>
          </button>
          <div className="flex items-center gap-3 px-4 py-2">
            <div className="w-8 h-8 rounded-full bg-gradient-to-br from-primary-500 to-accent-500 flex items-center justify-center text-white font-semibold text-xs">
              {(user?.fullName || user?.email || 'A').charAt(0).toUpperCase()}
            </div>
            <div className="flex-1 min-w-0">
              <p className="text-sm font-semibold text-surface-900 truncate">{user?.fullName || 'Admin'}</p>
              <p className="text-xs text-surface-400 truncate">{user?.email || ''}</p>
            </div>
            <button onClick={logout} className="p-1.5 rounded-lg hover:bg-surface-100 text-surface-400" title="Logout"><LogOut className="w-4 h-4" /></button>
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
          <button onClick={() => { if (window.innerWidth < 1024) setMobileOpen(true); else setSidebarOpen(!sidebarOpen); }}
            className="p-2 rounded-lg hover:bg-surface-50 text-surface-500"><Menu className="w-5 h-5" /></button>

          <div className="flex items-center gap-2 px-3 py-1.5 bg-accent-50 border border-accent-200 rounded-full">
            <div className="w-1.5 h-1.5 bg-accent-500 rounded-full animate-pulse" />
            <span className="text-[10px] font-bold text-accent-700 tracking-wider uppercase">Engine Live</span>
          </div>

          <div className="flex-1" />

          <div className="flex items-center gap-2">
            <div className="hidden md:flex flex-col items-end mr-2">
              <span className="text-xs font-semibold text-surface-700">Admin User</span>
              <span className="text-[10px] text-surface-400 font-mono">ID: FID-8829-X</span>
            </div>
            <div className="w-9 h-9 rounded-full bg-gradient-to-br from-primary-500 to-accent-500 flex items-center justify-center text-white font-semibold text-xs">AD</div>
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
