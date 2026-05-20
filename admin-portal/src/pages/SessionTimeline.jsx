import { useEffect, useMemo, useState } from 'react';
import { useSearchParams } from 'react-router-dom';
import { motion } from 'framer-motion';
import {
  Activity, AlertCircle, BarChart3, CheckCircle2, Clock,
  Footprints, Info, MessageSquare, Radio, RotateCcw, Search,
  TimerOff, User, Zap, Trash2,
} from 'lucide-react';
import InterventionModal from '../components/InterventionModal';
import { engineApi, backendApi } from '../utils/apiBase';

const formatDuration = (seconds = 0) => {
  const safeSeconds = Math.max(0, Math.round(seconds || 0));
  if (safeSeconds < 60) return `${safeSeconds}s`;
  if (safeSeconds < 3600) return `${Math.floor(safeSeconds / 60)}m ${safeSeconds % 60}s`;
  return `${Math.floor(safeSeconds / 3600)}h ${Math.floor((safeSeconds % 3600) / 60)}m`;
};

const formatClock = (timestamp) => {
  if (!timestamp) return '--:--';
  const numericTimestamp = Number(timestamp);
  const millis = numericTimestamp > 1e12 ? numericTimestamp : numericTimestamp * 1000;
  const date = new Date(millis);
  if (Number.isNaN(date.getTime())) return '--:--';
  return date.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
};

const getDisplayName = (user) => {
  if (!user) return 'Unknown';
  const meta = user.metadata || {};
  const email = meta.email || meta.userEmail;
  const name = meta.name || meta.userName;
  if (email || name) return String(email || name);
  const ev = (user.events || []).find(e => e.metadata?.userEmail || e.metadata?.userName);
  if (ev) return String(ev.metadata.userEmail || ev.metadata.userName);
  return user.user_id;
};

const userInitial = (name = 'U') => name.replace(/[^a-z0-9]/gi, '').charAt(0).toUpperCase() || 'U';

export default function SessionTimeline() {
  const [searchParams] = useSearchParams();
  const [activeUsers, setActiveUsers] = useState([]);
  const [summary, setSummary] = useState(null);
  const [selectedUser, setSelectedUser] = useState(null);
  const [report, setReport] = useState(null);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');
  const [showOnlineOnly, setShowOnlineOnly] = useState(false);
  const [isInterventionModalOpen, setIsInterventionModalOpen] = useState(false);

  const fetchUsers = async (signal) => {
    try {
      const [usersRes, summaryRes] = await Promise.all([
        fetch(engineApi('/admin/all-users'), { signal }),
        fetch(engineApi('/admin/analytics/summary'), { signal }),
      ].map((p) => p.catch((err) => {
        if (err.name === 'AbortError') throw err;
        return new Response(null, { status: 200 });
      })));
      if (usersRes?.ok) { try { setActiveUsers(await usersRes.json()); } catch {} }
      if (summaryRes?.ok) { try { setSummary(await summaryRes.json()); } catch {} }
    } catch (error) {
      if (error.name === 'AbortError') return;
      console.error('Failed to fetch users:', error);
    } finally {
      setLoading(false);
    }
  };

  const fetchReport = async (userId, signal) => {
    if (!userId) return;
    try {
      const res = await fetch(engineApi(`/admin/user-report/${encodeURIComponent(userId)}`), { signal });
      if (res.ok) setReport(await res.json());
      else setReport(null);
    } catch (error) {
      if (error.name === 'AbortError') return;
      console.error('Failed to fetch user report:', error);
      setReport(null);
    }
  };

  useEffect(() => {
    const ac = new AbortController();
    fetchUsers(ac.signal);
    const interval = setInterval(() => fetchUsers(ac.signal), 8000);
    return () => {
      ac.abort();
      clearInterval(interval);
    };
  }, []);

  // Auto-select user from URL query param (e.g., from Alerts "View Session Timeline")
  useEffect(() => {
    const urlUser = searchParams.get('user');
    if (urlUser && activeUsers.length > 0 && !selectedUser) {
      const match = activeUsers.find(u => u.user_id === urlUser);
      if (match) {
        setSelectedUser(urlUser);
      }
    }
  }, [searchParams, activeUsers, selectedUser]);

  const handleDeleteUser = async () => {
    if (!selectedUser) return;
    if (!window.confirm(`Are you sure you want to permanently delete user ${getDisplayName(selectedSession)}? They will need to sign up again.`)) return;
    try {
      const token = localStorage.getItem('adminToken');
      const metadata = selectedSession?.metadata || {};
      const res = await fetch(backendApi(`/api/admin/users/${selectedUser}`), {
        method: 'DELETE',
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          engineUserId: selectedUser,
          email: metadata.email,
          userName: metadata.name,
          clientSessionId: metadata.client_session_id,
          trackingUserId: metadata.tracking_user_id,
          aliases: selectedSession?.aliases || [],
        }),
      });
      if (res.ok) {
        setSelectedUser(null);
        setReport(null);
        setActiveUsers((users) => users.filter((user) => user.user_id !== selectedUser));
        fetchUsers();
      } else {
        const data = await res.json();
        alert(data.message || 'Failed to delete user');
      }
    } catch (error) {
      console.error('Delete error:', error);
      alert('Failed to delete user');
    }
  };

  useEffect(() => {
    setReport(null);
    if (selectedUser) {
      const ac = new AbortController();
      fetchReport(selectedUser, ac.signal);
      const interval = setInterval(() => fetchReport(selectedUser, ac.signal), 5000);
      return () => {
        ac.abort();
        clearInterval(interval);
      };
    }
    return undefined;
  }, [selectedUser, fetchReport]);

  const now = Date.now() / 1000;
  const filteredUsers = activeUsers.filter((user) => {
    const dName = getDisplayName(user).toLowerCase();
    const matchesSearch = dName.includes(search.toLowerCase());
    const isActive = (now - user.last_active) < 60;
    return matchesSearch && (!showOnlineOnly || isActive);
  });

  const selectedSession = useMemo(
    () => activeUsers.find((user) => user.user_id === selectedUser),
    [activeUsers, selectedUser]
  );

  useEffect(() => {
    if (selectedUser && activeUsers.length > 0 && !selectedSession) {
      setSelectedUser(null);
      setReport(null);
    }
  }, [activeUsers, selectedSession, selectedUser]);

  const replayTimeline = useMemo(() => {
    const timeline = report?.replay_timeline || selectedSession?.replay_timeline || [];
    return [...timeline].sort((a, b) => b.timestamp - a.timestamp);
  }, [report, selectedSession]);
  const signalDefinitions = [
    { key: 'rage_click_detected', label: 'Rage clicks detected' },
    { key: 'high_hesitation', label: 'High hesitation' },
    { key: 'churn_risk', label: 'Churn risk' },
    { key: 'inactive_session', label: 'Inactive session' },
    { key: 'bounce_detected', label: 'Bounce detected' },
  ];
  const navigationFlow = useMemo(() => {
    const flow = report?.session?.navigation_flow || selectedSession?.navigation_flow || [];
    return [...flow].sort((a, b) => b.timestamp - a.timestamp);
  }, [report, selectedSession]);
  const pagesVisited = report?.session?.pages_visited || selectedSession?.pages_visited || [];
  const sessionDuration = report?.session?.total_duration ?? selectedSession?.total_duration ?? 0;
  const sessionDetails = report?.session || selectedSession || {};
  const reportSummary = report?.summary || {};
  const finalIntent = reportSummary.final_intent || selectedSession?.intent_state || 'UNKNOWN';
  const persona = reportSummary.persona || selectedSession?.persona || 'UNKNOWN';
  const overallScore = Number(reportSummary.overall_score ?? selectedSession?.total_score ?? 0);

  return (
    <div className="space-y-8">
      <div>
        <h1 className="text-2xl font-bold text-surface-900">Session Management Engine</h1>
        <p className="text-surface-500 mt-1 text-sm">Full user sessions, navigation flow, bounce logic, and replay timeline</p>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-4 gap-4">
        {[
          { label: 'Tracked Sessions', value: summary?.total_users || activeUsers.length, icon: User, color: 'text-primary-600 bg-primary-50' },
          { label: 'Avg Duration', value: formatDuration(summary?.avg_session_duration || 0), icon: Clock, color: 'text-accent-600 bg-accent-50' },
          { label: 'Bounce Rate', value: `${(summary?.bounce_rate || 0).toFixed(1)}%`, icon: TimerOff, color: 'text-red-600 bg-red-50' },
          { label: 'Returning Users', value: summary?.returning_users || 0, icon: RotateCcw, color: 'text-indigo-600 bg-indigo-50' },
        ].map((metric) => (
          <div key={metric.label} className="bg-white border border-surface-100 rounded-2xl p-5 shadow-card">
            <div className={`w-10 h-10 rounded-xl flex items-center justify-center ${metric.color}`}>
              <metric.icon className="w-5 h-5" />
            </div>
            <p className="text-2xl font-bold text-surface-900 mt-4">{metric.value}</p>
            <p className="text-[10px] font-bold text-surface-400 uppercase tracking-widest">{metric.label}</p>
          </div>
        ))}
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-4 gap-8">
        <div className="lg:col-span-1 space-y-4">
          <div className="flex flex-col gap-3">
            <div className="relative">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-surface-400" />
              <input
                type="text"
                placeholder="Filter sessions..."
                value={search}
                onChange={(event) => setSearch(event.target.value)}
                className="w-full pl-10 pr-4 py-2.5 bg-white border border-surface-200 rounded-xl text-sm focus:border-primary-500 focus:ring-2 focus:ring-primary-500/20 outline-none transition-colors text-surface-900"
              />
            </div>
            <button
              onClick={() => setShowOnlineOnly(!showOnlineOnly)}
              className={`px-4 py-2 rounded-xl text-[10px] font-bold uppercase tracking-widest transition-all border ${showOnlineOnly ? 'bg-accent-50 border-accent-200 text-accent-700' : 'bg-white border-surface-200 text-surface-500'}`}
            >
              {showOnlineOnly ? 'Online Only' : 'Show All Users'}
            </button>
          </div>

          <div className="bg-white border border-surface-100 rounded-2xl overflow-hidden shadow-card">
            <div className="p-4 border-b border-surface-100 flex justify-between items-center">
              <h3 className="text-[10px] font-bold text-surface-400 uppercase tracking-widest">Sessions</h3>
              <span className="text-[9px] font-bold text-primary-600 bg-primary-50 px-1.5 py-0.5 rounded">Recency</span>
            </div>
            <div className="max-h-[560px] overflow-y-auto">
              {filteredUsers.map((user) => {
                const isActive = (now - user.last_active) < 60;
                return (
                  <button
                    key={user.user_id}
                    onClick={() => setSelectedUser(user.user_id)}
                    className={`w-full p-4 text-left border-b border-surface-50 transition-all hover:bg-surface-50 flex items-center gap-3 ${selectedUser === user.user_id ? 'bg-primary-50 border-l-4 border-l-primary-500' : ''}`}
                  >
                    <div className="relative">
                      <div className={`w-9 h-9 rounded-lg flex items-center justify-center font-bold text-xs ${selectedUser === user.user_id ? 'bg-primary-500 text-white' : 'bg-surface-100 text-surface-500'}`}>
                        {userInitial(getDisplayName(user))}
                      </div>
                      {isActive && <div className="absolute -top-1 -right-1 w-2.5 h-2.5 bg-accent-500 rounded-full border-2 border-white animate-pulse" />}
                    </div>
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center justify-between gap-2">
                        <p className="text-sm font-bold text-surface-700 truncate" title={user.user_id}>{getDisplayName(user)}</p>
                        {isActive && <span className="text-[8px] font-black text-accent-600 uppercase">Active</span>}
                      </div>
                      <p className="text-[10px] text-surface-400 font-medium uppercase tracking-tighter">
                        {formatDuration(user.total_duration)} / {user.pages_visited?.length || 0} pages / Active {formatDuration(now - user.last_active)} ago
                      </p>
                    </div>
                  </button>
                );
              })}
              {filteredUsers.length === 0 && (
                <p className="p-8 text-center text-xs text-surface-300 italic">No matching sessions</p>
              )}
            </div>
          </div>
        </div>

        <div className="lg:col-span-3">
          {!selectedUser ? (
            <div className="min-h-[560px] flex flex-col items-center justify-center bg-white border-2 border-dashed border-surface-200 rounded-2xl p-12 text-center text-surface-300">
              <User className="w-16 h-16 mb-4 opacity-20" />
              <h3 className="text-xl font-bold text-surface-400">No Session Selected</h3>
              <p className="max-w-xs mt-2 italic text-surface-300">Select a session to inspect duration, pages visited, navigation flow, and replay timeline.</p>
            </div>
          ) : !report && !selectedSession ? (
            <div className="flex items-center justify-center h-64">
              <div className="w-8 h-8 border-3 border-primary-200 border-t-primary-600 rounded-full animate-spin" />
            </div>
          ) : (
            <div className="space-y-6">
              <div className="bg-white border border-surface-100 rounded-2xl p-6 shadow-card">
                <div className="flex flex-col md:flex-row md:items-center gap-6 mb-8 p-6 rounded-2xl bg-surface-50 border border-surface-100">
                  <div className="w-20 h-20 rounded-2xl bg-gradient-to-br from-primary-500 to-accent-500 flex items-center justify-center text-white font-bold text-3xl shadow-glow">
                    {userInitial(getDisplayName(selectedSession))}
                  </div>
                  <div className="flex-1 min-w-0">
                    <div className="flex flex-wrap items-center gap-3 mb-1">
                      <h2 className="text-2xl font-bold text-surface-900 truncate" title={selectedUser}>{getDisplayName(selectedSession)}</h2>
                      <span className="px-3 py-1 bg-primary-50 text-primary-700 border border-primary-100 rounded-full text-[10px] font-bold uppercase tracking-widest">
                        {persona.replace(/_/g, ' ')}
                      </span>
                    </div>
                    <p className="text-surface-500 text-sm">
                      Engine Assessment: <span className="font-bold text-primary-600 uppercase tracking-tighter">{finalIntent.replace(/_/g, ' ')}</span>
                    </p>
                    <div className="flex gap-2 mt-4">
                      <button
                        onClick={() => setIsInterventionModalOpen(true)}
                        className="px-4 py-2 btn-primary text-xs rounded-xl flex items-center gap-2"
                      >
                        <MessageSquare className="w-4 h-4" /> Send Custom Message
                      </button>
                      <button
                        onClick={handleDeleteUser}
                        className="px-4 py-2 bg-red-50 border border-red-200 hover:bg-red-100 text-red-600 text-xs font-bold rounded-xl transition-all flex items-center gap-2"
                      >
                        <Trash2 className="w-4 h-4" /> Delete User
                      </button>
                    </div>
                  </div>
                  <div className="text-right flex flex-col items-end">
                    <span className="text-4xl font-black text-surface-900 leading-none">{Math.round(overallScore)}</span>
                    <span className="text-[10px] font-bold text-surface-400 uppercase tracking-widest mt-1">Intent Score</span>
                  </div>
                </div>

                <div className="grid md:grid-cols-2 xl:grid-cols-5 gap-4">
                  {[
                    { label: 'Session Start', value: formatClock(sessionDetails.session_start), icon: Clock },
                    { label: 'Total Duration', value: formatDuration(sessionDuration), icon: Activity },
                    { label: 'Last Active', value: `${formatDuration(now - (selectedSession?.last_active || 0))} ago`, icon: Radio },
                    { label: 'Pages Visited', value: pagesVisited.length, icon: Footprints },
                    { label: 'Bounce Status', value: sessionDetails.bounce ? 'Bounced' : 'Engaged', icon: TimerOff },
                  ].map((metric) => (
                    <div key={metric.label} className="p-4 rounded-xl bg-surface-50 border border-surface-100">
                      <metric.icon className="w-4 h-4 text-primary-500 mb-3" />
                      <p className="text-xl font-bold text-surface-900 font-mono">{metric.value}</p>
                      <p className="text-[10px] font-bold text-surface-400 uppercase tracking-widest mt-1">{metric.label}</p>
                    </div>
                  ))}
                </div>
              </div>

              <div className="grid grid-cols-1 xl:grid-cols-2 gap-6">
                <div className="bg-white border border-surface-100 rounded-2xl p-6 shadow-card">
                  <h3 className="font-bold text-surface-900 mb-6 flex items-center gap-2 text-lg">
                    <Footprints className="w-5 h-5 text-accent-500" /> Navigation Flow
                  </h3>
                  <div className="space-y-3">
                    {navigationFlow.map((step, index) => (
                      <div key={`${step.page}-${step.timestamp}-${index}`} className="flex items-center gap-3">
                        <div className="w-8 h-8 rounded-lg bg-primary-50 border border-primary-100 flex items-center justify-center text-[10px] font-black text-primary-600">
                          {index + 1}
                        </div>
                        <div className="flex-1 p-3 rounded-xl bg-surface-50 border border-surface-100">
                          <p className="text-sm font-bold text-surface-700">{step.page}</p>
                          <p className="text-[10px] text-surface-400 font-mono">{formatClock(step.timestamp)} / {step.event_type?.replace(/_/g, ' ')}</p>
                        </div>
                      </div>
                    ))}
                    {navigationFlow.length === 0 && <p className="text-sm text-surface-300 italic">No navigation steps captured yet.</p>}
                  </div>
                </div>

                <div className="bg-white border border-surface-100 rounded-2xl p-6 shadow-card">
                  <div className="flex items-center justify-between gap-3 mb-6">
                    <h3 className="font-bold text-surface-900 flex items-center gap-2 text-lg">
                      <Info className="w-5 h-5 text-primary-500" /> Session Signals
                    </h3>
                    <span className="text-[10px] uppercase tracking-widest text-surface-400">Green = no issue, red = flagged</span>
                  </div>
                  <div className="grid grid-cols-1 gap-3">
                    {signalDefinitions.map(({ key, label }) => {
                      const active = report?.psychological_flags?.[key];
                      return (
                        <div
                          key={key}
                          className={`flex items-center justify-between p-4 rounded-xl border ${active ? 'bg-red-50 border-red-200 text-red-700' : 'bg-accent-50 border-accent-200 text-accent-700'}`}
                        >
                          <div className="min-w-0">
                            <p className="text-sm font-bold text-surface-900 truncate">{label}</p>
                            <p className="text-[10px] text-surface-400 mt-1">{active ? 'Flagged' : 'Not flagged'}</p>
                          </div>
                          <span className={`inline-flex items-center gap-2 px-3 py-1 rounded-full text-[10px] font-bold uppercase ${active ? 'bg-red-100 text-red-700' : 'bg-accent-100 text-accent-700'}`}>
                            {active ? 'Yes' : 'No'}
                          </span>
                        </div>
                      );
                    })}
                  </div>
                </div>
              </div>

              <div className="bg-white border border-surface-100 rounded-2xl p-6 shadow-card">
                <h3 className="font-bold text-surface-900 mb-6 flex items-center gap-2 text-lg">
                  <Radio className="w-5 h-5 text-red-500" /> Session Replay Timeline
                </h3>
                <div className="rounded-xl bg-surface-50 border border-surface-100 p-5 font-mono text-sm max-h-[420px] overflow-y-auto">
                  {replayTimeline.map((entry, index) => (
                    <motion.div
                      key={`${entry.timestamp}-${index}`}
                      initial={{ opacity: 0, y: 6 }}
                      animate={{ opacity: 1, y: 0 }}
                      className="grid grid-cols-[70px_1fr] gap-4 py-2 border-b border-surface-100 last:border-b-0"
                    >
                      <span className="text-primary-600 font-bold">{formatClock(entry.timestamp)}</span>
                      <span className="text-surface-600">{entry.description}</span>
                    </motion.div>
                  ))}
                  {replayTimeline.length === 0 && (
                    <p className="text-surface-300 italic">Waiting for replay events...</p>
                  )}
                </div>
              </div>

              <div className="grid grid-cols-1 xl:grid-cols-2 gap-6">
                <div className="bg-white border border-surface-100 rounded-2xl p-6 shadow-card">
                  <h3 className="font-bold text-surface-900 mb-6 flex items-center gap-2 text-lg">
                    <BarChart3 className="w-5 h-5 text-indigo-500" /> Page Engagement Depth
                  </h3>
                  <div className="grid grid-cols-2 gap-4">
                    {(report?.top_pages || []).map(([page, count]) => (
                      <div key={page} className="p-4 rounded-xl bg-surface-50 border border-surface-100 text-center">
                        <p className="text-2xl font-bold text-surface-900 mb-1">{count}</p>
                        <p className="text-[10px] text-surface-400 font-bold truncate uppercase tracking-tighter">{page}</p>
                      </div>
                    ))}
                    {(report?.top_pages || []).length === 0 && <p className="text-sm text-surface-300 italic">No page affinity yet.</p>}
                  </div>
                </div>

                <div className="bg-white border border-surface-100 rounded-2xl p-6 shadow-card">
                  <h3 className="font-bold text-surface-900 mb-6 flex items-center gap-2 text-lg">
                    <Zap className="w-5 h-5 text-amber-500" /> Engine Interventions
                  </h3>
                  <div className="grid grid-cols-1 gap-3">
                    {(report?.recommendations || []).map((recommendation) => (
                      <div key={recommendation} className="flex items-center gap-3 p-4 rounded-xl bg-amber-50 border border-amber-100">
                        <div className="w-8 h-8 rounded-lg bg-amber-100 flex items-center justify-center text-amber-600">
                          <CheckCircle2 className="w-4 h-4" />
                        </div>
                        <span className="text-xs font-bold text-amber-700 uppercase tracking-tight">{recommendation.replace(/_/g, ' ')}</span>
                      </div>
                    ))}
                    {(report?.recommendations || []).length === 0 && (
                      <p className="text-sm text-surface-300 italic py-4">No proactive recommendations generated.</p>
                    )}
                  </div>
                </div>
              </div>
            </div>
          )}
        </div>
      </div>

      <InterventionModal
        isOpen={isInterventionModalOpen}
        onClose={() => setIsInterventionModalOpen(false)}
        userId={selectedUser}
      />
    </div>
  );
}
