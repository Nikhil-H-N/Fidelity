import { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import { User, Mail, Phone, Shield, Save, Camera, Loader2 } from 'lucide-react';
import toast from 'react-hot-toast';
import axios from 'axios';
import { usePageTracking } from '../hooks/useTracking';
import { useAuth } from '../context/AuthContext';

const API_URL = import.meta.env.VITE_API_URL || 'http://localhost:5000/api';

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
  const { user, setUser, token } = useAuth();
  const [form, setForm] = useState({ fullName: '', email: '', phone: '' });
  const [saving, setSaving] = useState(false);

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

  const handleSaveProfile = async (e) => {
    e.preventDefault();
    if (!form.fullName.trim()) {
      toast.error('Full name is required');
      return;
    }
    setSaving(true);
    try {
      const res = await axios.put(
        `${API_URL}/users/profile`,
        { fullName: form.fullName, phone: form.phone },
        { headers: { Authorization: `Bearer ${token}` } }
      );
      if (res.data.success && res.data.data?.user) {
        // Update auth context so the header, sidebar etc. reflect new name instantly
        setUser(res.data.data.user);
        // Also update localStorage
        localStorage.setItem('fw_user', JSON.stringify(res.data.data.user));
        toast.success('Profile saved successfully!');
      } else {
        toast.error(res.data.message || 'Failed to save profile');
      }
    } catch (err) {
      toast.error(err.response?.data?.message || 'Failed to save profile');
    } finally {
      setSaving(false);
    }
  };

  return (
    <div className="space-y-6">
      <h1 className="text-2xl font-bold text-surface-900">Settings</h1>

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
            <button type="submit" disabled={saving} className="btn-primary mt-6 gap-2">
              {saving ? <Loader2 className="w-4 h-4 animate-spin" /> : <Save className="w-4 h-4" />}
              {saving ? 'Saving...' : 'Save Changes'}
            </button>
          </form>
        </div>
    </div>
  );
}
