import { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import { User, Mail, Phone, Shield, Bell, Lock, Save, Camera, Loader2 } from 'lucide-react';
import toast from 'react-hot-toast';
import { usePageTracking } from '../hooks/useTracking';
import { useAuth } from '../context/AuthContext';

/** Get initials from fullName */
function getInitials(name) {
  if (!name) return '??';
  const parts = name.trim().split(/\s+/);
  if (parts.length === 1) return parts[0][0].toUpperCase();
  return (parts[0][0] + parts[parts.length - 1][0]).toUpperCase();
}

/** Format date to "Month Year" */
function formatJoinDate(dateStr) {
  if (!dateStr) return '';
  const d = new Date(dateStr);
  return `Since ${d.toLocaleDateString('en-IN', { month: 'short', year: 'numeric' })}`;
}

export default function ProfileSettings() {
  usePageTracking('profile-settings');
  const { user } = useAuth();
  const [tab, setTab] = useState('profile');
  const [form, setForm] = useState({ fullName: '', email: '', phone: '' });

  // Populate form from auth user
  useEffect(() => {
    if (user) {
      setForm({
        fullName: user.fullName || '',
        email: user.email || '',
        phone: user.phone || '',
      });
    }
  }, [user]);

  const tabs = [
    { id: 'profile', label: 'Profile', icon: User },
    { id: 'security', label: 'Security', icon: Lock },
    { id: 'notifications', label: 'Notifications', icon: Bell },
  ];

  const handleSaveProfile = (e) => {
    e.preventDefault();
    // TODO: wire to PUT /api/auth/profile when endpoint is ready
    toast.success('Profile saved (local only — backend endpoint coming soon)');
  };

  return (
    <div className="space-y-6">
      <h1 className="text-2xl font-bold text-surface-900">Settings</h1>

      <div className="flex gap-2 border-b border-surface-200 pb-0.5">
        {tabs.map(t => (
          <button key={t.id} onClick={() => setTab(t.id)}
            className={`flex items-center gap-2 px-4 py-3 text-sm font-medium border-b-2 transition-colors ${
              tab === t.id ? 'border-primary-600 text-primary-600' : 'border-transparent text-surface-500 hover:text-surface-700'
            }`}><t.icon className="w-4 h-4" /> {t.label}</button>
        ))}
      </div>

      {tab === 'profile' && (
        <div className="bg-white rounded-2xl p-6 shadow-card border border-surface-100">
          <div className="flex items-center gap-4 mb-8">
            <div className="relative">
              <div className="w-20 h-20 rounded-full bg-gradient-to-br from-primary-500 to-accent-500 flex items-center justify-center text-white font-bold text-2xl">{getInitials(user?.fullName)}</div>
              <button className="absolute bottom-0 right-0 w-8 h-8 bg-white rounded-full shadow-card flex items-center justify-center border border-surface-200 hover:bg-surface-50">
                <Camera className="w-4 h-4 text-surface-500" />
              </button>
            </div>
            <div>
              <p className="text-lg font-bold text-surface-900">{user?.fullName || 'User'}</p>
              <p className="text-sm text-surface-500">{user?.role === 'admin' ? 'Admin' : 'Investor'} · {formatJoinDate(user?.createdAt)}</p>
            </div>
          </div>
          <form onSubmit={handleSaveProfile}>
            <div className="grid sm:grid-cols-2 gap-4">
              <div><label className="block text-sm font-medium text-surface-700 mb-1.5">Full Name</label><input type="text" className="input-field" value={form.fullName} onChange={(e) => setForm({ ...form, fullName: e.target.value })} /></div>
              <div><label className="block text-sm font-medium text-surface-700 mb-1.5">Email</label><input type="email" className="input-field bg-surface-50" value={form.email} readOnly /></div>
              <div><label className="block text-sm font-medium text-surface-700 mb-1.5">Phone</label><input type="tel" className="input-field" value={form.phone} onChange={(e) => setForm({ ...form, phone: e.target.value })} /></div>
              <div><label className="block text-sm font-medium text-surface-700 mb-1.5">Auth Provider</label><input type="text" className="input-field bg-surface-50" value={user?.authProvider === 'google' ? 'Google' : 'Email'} readOnly disabled /></div>
            </div>
            <button type="submit" className="btn-primary mt-6 gap-2"><Save className="w-4 h-4" /> Save Changes</button>
          </form>
        </div>
      )}

      {tab === 'security' && (
        <div className="bg-white rounded-2xl p-6 shadow-card border border-surface-100 space-y-6">
          <div>
            <h3 className="font-semibold text-surface-900 mb-4">Change Password</h3>
            {user?.authProvider === 'google' ? (
              <p className="text-sm text-surface-500 bg-surface-50 p-4 rounded-xl">Password management is not available for Google accounts.</p>
            ) : (
              <div className="space-y-4 max-w-md">
                <div><label className="block text-sm font-medium text-surface-700 mb-1.5">Current Password</label><input type="password" className="input-field" /></div>
                <div><label className="block text-sm font-medium text-surface-700 mb-1.5">New Password</label><input type="password" className="input-field" /></div>
                <button className="btn-primary gap-2"><Lock className="w-4 h-4" /> Update Password</button>
              </div>
            )}
          </div>
          <div className="pt-4 border-t border-surface-100">
            <h3 className="font-semibold text-surface-900 mb-3">Two-Factor Authentication</h3>
            <div className="flex items-center justify-between p-4 bg-surface-50 rounded-xl">
              <div><p className="text-sm font-medium text-surface-900">2FA via SMS</p><p className="text-xs text-surface-500">Receive OTP on your phone</p></div>
              <div className="w-12 h-6 bg-accent-500 rounded-full p-0.5 cursor-pointer"><div className="w-5 h-5 bg-white rounded-full shadow-sm ml-auto" /></div>
            </div>
          </div>
        </div>
      )}

      {tab === 'notifications' && (
        <div className="bg-white rounded-2xl p-6 shadow-card border border-surface-100 space-y-4">
          {['SIP Reminders', 'Market Alerts', 'AI Recommendations', 'Transaction Updates', 'Goal Milestones', 'Weekly Reports'].map((n, i) => (
            <div key={n} className="flex items-center justify-between p-4 bg-surface-50 rounded-xl">
              <div><p className="text-sm font-medium text-surface-900">{n}</p></div>
              <div className={`w-12 h-6 rounded-full p-0.5 cursor-pointer ${i < 4 ? 'bg-accent-500' : 'bg-surface-300'}`}>
                <div className={`w-5 h-5 bg-white rounded-full shadow-sm transition-all ${i < 4 ? 'ml-auto' : ''}`} />
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
