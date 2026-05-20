import { useEffect, useMemo, useState } from 'react';
import { motion } from 'framer-motion';
import {
  Bell, CalendarClock, CheckCircle2, Clock, Copy, Mail,
  MessageSquare, Radio, RefreshCw, Send, Sparkles, User, Zap,
} from 'lucide-react';
import { backendApi, engineApi } from '../utils/apiBase';

const TEMPLATES = [
  {
    id: 'sip_reconsider',
    label: 'SIP Nudge',
    title: 'Still thinking about SIPs?',
    message: 'Still thinking about SIPs? I can help you compare options and pick a monthly amount that feels comfortable.',
  },
  {
    id: 'retirement_setup',
    label: 'Retirement Setup',
    title: 'Complete your retirement investment setup',
    message: 'Complete your retirement investment setup. You are only a few steps away from seeing a long-term projection.',
  },
  {
    id: 'form_help',
    label: 'Form Recovery',
    title: 'Need help finishing this?',
    message: 'Need help finishing this? Your progress is safe, and I can guide you through the remaining details.',
  },
  {
    id: 'advisor_help',
    label: 'Advisor Help',
    title: 'Want a quick recommendation?',
    message: 'Want a quick recommendation? Based on your browsing, a balanced SIP plan may be a good place to start.',
  },
];

const userLabel = (user) => {
  if (!user) return 'Select user';
  const email = user.metadata?.email;
  return email ? `${user.user_id} / ${email}` : user.user_id;
};

const DEFAULT_POPUP_POLICY = {
  maxPopupsPerSession: 3,
  fatigueSuppressionMinutes: 30,
  dismissalCooldownMinutes: 15,
  consecutiveDismissalsLimit: 3,
  priorityIntervalsSeconds: { CRITICAL: 0, HIGH: 20, MEDIUM: 45, LOW: 90 },
  triggerCooldownMinutes: {
    form_abandon_nudge: 10,
    checkout_recovery: 10,
    likely_converter: 30,
    high_intent_abandoner: 45,
    comparison_without_conversion: 30,
    default: 60,
  },
};

const PRIORITY_LABELS = [
  ['CRITICAL', 'Critical'],
  ['HIGH', 'High'],
  ['MEDIUM', 'Medium'],
  ['LOW', 'Low'],
];

const TRIGGER_LABELS = [
  ['form_abandon_nudge', 'Form abandon'],
  ['checkout_recovery', 'Checkout recovery'],
  ['likely_converter', 'Likely converter'],
  ['high_intent_abandoner', 'High intent'],
  ['comparison_without_conversion', 'Comparison nudge'],
  ['default', 'Default'],
];

const formatLastActive = (timestamp) => {
  if (!timestamp) return 'unknown';
  const seconds = Math.max(0, Math.round(Date.now() / 1000 - timestamp));
  if (seconds < 60) return `${seconds}s ago`;
  if (seconds < 3600) return `${Math.floor(seconds / 60)}m ago`;
  return `${Math.floor(seconds / 3600)}h ago`;
};

export default function NotificationEngine() {
  const [activeUsers, setActiveUsers] = useState([]);
  const [selectedUserId, setSelectedUserId] = useState('');
  const [showOnlineOnly, setShowOnlineOnly] = useState(false);
  const [title, setTitle] = useState(TEMPLATES[0].title);
  const [message, setMessage] = useState(TEMPLATES[0].message);
  const [emailTo, setEmailTo] = useState('');
  const [emailSubject, setEmailSubject] = useState(TEMPLATES[0].title);
  const [type, setType] = useState('INFO');
  const [template, setTemplate] = useState(TEMPLATES[0].id);
  const [scheduleAt, setScheduleAt] = useState('');
  const [channels, setChannels] = useState({ popup: true, email: false, push: false });
  const [loading, setLoading] = useState(true);
  const [sending, setSending] = useState(false);
  const [result, setResult] = useState(null);
  const [popupPolicy, setPopupPolicy] = useState(DEFAULT_POPUP_POLICY);
  const [policySaving, setPolicySaving] = useState(false);
  const [policyResult, setPolicyResult] = useState(null);

  const selectedUser = useMemo(
    () => activeUsers.find((user) => user.user_id === selectedUserId),
    [activeUsers, selectedUserId]
  );

  const fetchUsers = async () => {
    try {
      const response = await fetch(engineApi('/admin/all-users'));
      if (response.ok) {
        const users = await response.json();
        setActiveUsers(users);
        setSelectedUserId((current) => current || users[0]?.user_id || '');
      }
    } catch (error) {
      console.error('Failed to fetch users:', error);
    } finally {
      setLoading(false);
    }
  };

  const fetchPopupPolicy = async () => {
    try {
      const token = localStorage.getItem('adminToken');
      const response = await fetch(backendApi('/api/admin/popup-policy'), {
        headers: token ? { Authorization: `Bearer ${token}` } : {},
      });
      if (!response.ok) return;
      const data = await response.json();
      if (data.success) {
        setPopupPolicy({ ...DEFAULT_POPUP_POLICY, ...data.data });
      }
    } catch (error) {
      console.error('Failed to fetch popup policy:', error);
    }
  };

  useEffect(() => {
    fetchUsers();
    fetchPopupPolicy();
    const interval = setInterval(fetchUsers, 10000);
    return () => clearInterval(interval);
  }, []);

  useEffect(() => {
    const email = selectedUser?.metadata?.email || '';
    setEmailTo(email);
  }, [selectedUserId, selectedUser]);

  const applyTemplate = (templateId) => {
    const next = TEMPLATES.find((item) => item.id === templateId);
    if (!next) return;
    setTemplate(templateId);
    setTitle(next.title);
    setEmailSubject(next.title);
    setMessage(next.message);
  };

  const applyRecommendation = () => {
    const state = selectedUser?.intent_state || 'EXPLORING';
    const score = Math.round(selectedUser?.total_score || 0);
    const page = selectedUser?.pages_visited?.slice(-1)?.[0] || 'the current page';

    setTemplate('recommendation_based');
    setTitle('Personalized investment help');
    setEmailSubject('Personalized investment help from FinovaWealth');
    setMessage(
      `Hi, we noticed you are currently on ${page} with an intent score of ${score}. Based on your ${state.toLowerCase().replace(/_/g, ' ')} behavior, we can help you choose the next best investment step.`
    );
  };

  const selectedChannels = Object.entries(channels)
    .filter(([, enabled]) => enabled)
    .map(([channel]) => channel);

  const updatePolicyNumber = (path, value) => {
    const numericValue = Number(value);
    setPopupPolicy((current) => {
      if (path.length === 1) {
        return { ...current, [path[0]]: numericValue };
      }
      return {
        ...current,
        [path[0]]: {
          ...current[path[0]],
          [path[1]]: numericValue,
        },
      };
    });
  };

  const savePopupPolicy = async () => {
    setPolicySaving(true);
    setPolicyResult(null);
    try {
      const token = localStorage.getItem('adminToken');
      const response = await fetch(backendApi('/api/admin/popup-policy'), {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
          ...(token ? { Authorization: `Bearer ${token}` } : {}),
        },
        body: JSON.stringify(popupPolicy),
      });
      if (!response.ok) throw new Error('Failed to save popup policy');
      const data = await response.json();
      if (!data.success) throw new Error(data.message || 'Failed to save popup policy');
      setPopupPolicy({ ...DEFAULT_POPUP_POLICY, ...data.data });
      setPolicyResult({ status: 'saved', message: 'Automatic popup timing updated.' });
    } catch (error) {
      setPolicyResult({ status: 'failed', message: error.message });
    } finally {
      setPolicySaving(false);
    }
  };

  const handleSubmit = async (event) => {
    event.preventDefault();
    if (!selectedUserId || !message.trim() || selectedChannels.length === 0) return;

    setSending(true);
    setResult(null);

    try {
      const response = await fetch(engineApi('/admin/notification/dispatch'), {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          user_id: selectedUserId,
          title, message, type,
          channels: selectedChannels,
          email_to: channels.email ? emailTo : null,
          email_subject: emailSubject,
          template,
          schedule_at: scheduleAt ? new Date(scheduleAt).toISOString() : null,
          reason: 'Admin Notification Engine',
        }),
      });

      if (!response.ok) {
        const text = await response.text().catch(() => '');
        throw new Error(text || 'Notification dispatch failed');
      }
      const data = await response.json();
      setResult(data);
    } catch (error) {
      setResult({ status: 'failed', message: error.message });
    } finally {
      setSending(false);
    }
  };

  const filteredUsers = useMemo(() => {
    if (!showOnlineOnly) return activeUsers;
    const now = Date.now() / 1000;
    return activeUsers.filter((user) => (now - user.last_active) < 60);
  }, [activeUsers, showOnlineOnly]);

  return (
    <div className="space-y-8">
      <div className="flex flex-col gap-4 xl:flex-row xl:items-center xl:justify-between">
        <div>
          <h1 className="text-2xl font-bold text-surface-900">Notification Engine</h1>
          <p className="text-surface-500 mt-1 text-sm">Send targeted popup, push, and email messages to one selected user</p>
        </div>
        <div className="flex flex-col sm:flex-row gap-3 items-start sm:items-center">
          <button
            onClick={() => setShowOnlineOnly(!showOnlineOnly)}
            className={`px-4 py-2.5 rounded-xl text-[10px] font-bold uppercase tracking-widest transition-all border ${showOnlineOnly ? 'bg-accent-50 border-accent-200 text-accent-700' : 'bg-white border-surface-200 text-surface-500'}`}
          >
            {showOnlineOnly ? 'Online Only' : 'Show All Users'}
          </button>
          <button
            onClick={fetchUsers}
            className="w-fit flex items-center gap-2 px-4 py-2.5 bg-white border border-surface-200 hover:border-primary-200 rounded-xl text-sm font-semibold transition-all text-surface-700"
          >
            <RefreshCw className={`w-4 h-4 ${loading ? 'animate-spin' : ''}`} /> Refresh users
          </button>
        </div>
      </div>

      <div className="grid grid-cols-1 xl:grid-cols-4 gap-6">
        {[
          { label: 'Users', value: filteredUsers.length, icon: Radio, color: 'text-accent-600 bg-accent-50' },
          { label: 'Popup Ready', value: channels.popup ? 'On' : 'Off', icon: MessageSquare, color: 'text-primary-600 bg-primary-50' },
          { label: 'Email Channel', value: channels.email ? 'On' : 'Off', icon: Mail, color: 'text-amber-600 bg-amber-50' },
          { label: 'Push Channel', value: channels.push ? 'On' : 'Off', icon: Bell, color: 'text-indigo-600 bg-indigo-50' },
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

      <div className="bg-white border border-surface-100 rounded-2xl p-6 shadow-card">
        <div className="flex flex-col gap-4 xl:flex-row xl:items-start xl:justify-between">
          <div>
            <h3 className="font-bold text-surface-900 flex items-center gap-2">
              <Clock className="w-5 h-5 text-primary-500" /> Automatic Popup Timing
            </h3>
            <p className="text-sm text-surface-500 mt-1">
              Tune cooldowns for behavioral popups without changing code.
            </p>
          </div>
          <button
            type="button"
            onClick={savePopupPolicy}
            disabled={policySaving}
            className="px-4 py-2.5 btn-primary rounded-xl text-sm font-bold disabled:opacity-50"
          >
            {policySaving ? 'Saving...' : 'Save Timing'}
          </button>
        </div>

        <div className="grid md:grid-cols-3 gap-4 mt-6">
          {[
            ['maxPopupsPerSession', 'Max per session', 'count'],
            ['fatigueSuppressionMinutes', 'High fatigue pause', 'minutes'],
            ['dismissalCooldownMinutes', 'Dismissal pause', 'minutes'],
          ].map(([key, label, unit]) => (
            <label key={key} className="block">
              <span className="text-xs font-bold text-surface-400 uppercase tracking-widest">{label}</span>
              <div className="mt-2 flex rounded-xl border border-surface-200 bg-white overflow-hidden">
                <input
                  type="number"
                  min="0"
                  value={popupPolicy[key]}
                  onChange={(event) => updatePolicyNumber([key], event.target.value)}
                  className="w-full p-3 text-sm outline-none text-surface-900"
                />
                <span className="px-3 py-3 text-xs font-bold text-surface-400 bg-surface-50 border-l border-surface-100">{unit}</span>
              </div>
            </label>
          ))}
        </div>

        <div className="grid xl:grid-cols-2 gap-6 mt-6">
          <div className="rounded-2xl bg-surface-50 border border-surface-100 p-5">
            <h4 className="text-sm font-bold text-surface-900 mb-4">Minimum Gap By Priority</h4>
            <div className="grid sm:grid-cols-2 gap-3">
              {PRIORITY_LABELS.map(([key, label]) => (
                <label key={key} className="block">
                  <span className="text-[10px] font-bold text-surface-400 uppercase tracking-widest">{label}</span>
                  <input
                    type="number"
                    min="0"
                    value={popupPolicy.priorityIntervalsSeconds?.[key] ?? 0}
                    onChange={(event) => updatePolicyNumber(['priorityIntervalsSeconds', key], event.target.value)}
                    className="mt-2 w-full bg-white border border-surface-200 rounded-xl p-3 text-sm text-surface-900 outline-none"
                  />
                  <span className="text-[10px] text-surface-400">seconds</span>
                </label>
              ))}
            </div>
          </div>

          <div className="rounded-2xl bg-surface-50 border border-surface-100 p-5">
            <h4 className="text-sm font-bold text-surface-900 mb-4">Cooldown By Trigger Type</h4>
            <div className="grid sm:grid-cols-2 gap-3">
              {TRIGGER_LABELS.map(([key, label]) => (
                <label key={key} className="block">
                  <span className="text-[10px] font-bold text-surface-400 uppercase tracking-widest">{label}</span>
                  <input
                    type="number"
                    min="0"
                    value={popupPolicy.triggerCooldownMinutes?.[key] ?? 0}
                    onChange={(event) => updatePolicyNumber(['triggerCooldownMinutes', key], event.target.value)}
                    className="mt-2 w-full bg-white border border-surface-200 rounded-xl p-3 text-sm text-surface-900 outline-none"
                  />
                  <span className="text-[10px] text-surface-400">minutes</span>
                </label>
              ))}
            </div>
          </div>
        </div>

        {policyResult && (
          <p className={`mt-4 text-sm font-semibold ${policyResult.status === 'failed' ? 'text-red-600' : 'text-accent-600'}`}>
            {policyResult.message}
          </p>
        )}
      </div>

      <form onSubmit={handleSubmit} className="grid grid-cols-1 xl:grid-cols-3 gap-8">
        <div className="xl:col-span-1 space-y-6">
          <div className="bg-white border border-surface-100 rounded-2xl p-6 shadow-card">
            <h3 className="font-bold text-surface-900 mb-5 flex items-center gap-2">
              <User className="w-5 h-5 text-primary-500" /> Select Target User
            </h3>

            <select
              value={selectedUserId}
              onChange={(event) => setSelectedUserId(event.target.value)}
              className="w-full bg-surface-50 border border-surface-200 rounded-xl p-3 text-sm text-surface-900 focus:border-primary-500 outline-none"
            >
              <option value="">Choose user</option>
              {filteredUsers.map((user) => (
                <option key={user.user_id} value={user.user_id}>
                  {userLabel(user)}
                </option>
              ))}
            </select>

            {selectedUser && (
              <div className="mt-5 p-4 rounded-xl bg-surface-50 border border-surface-100 space-y-3">
                <div className="flex items-center justify-between gap-3">
                  <span className="text-[10px] font-bold text-surface-400 uppercase tracking-widest">Selected</span>
                  <span className="text-[10px] font-mono text-primary-600">{formatLastActive(selectedUser.last_active)}</span>
                </div>
                <p className="text-sm font-bold text-surface-900 break-all">{selectedUser.user_id}</p>
                <div className="grid grid-cols-2 gap-3">
                  <div>
                    <p className="text-[10px] text-surface-400 uppercase font-bold">Intent</p>
                    <p className="text-sm text-surface-600">{selectedUser.intent_state}</p>
                  </div>
                  <div>
                    <p className="text-[10px] text-surface-400 uppercase font-bold">Score</p>
                    <p className="text-sm text-surface-600">{Math.round(selectedUser.total_score || 0)}</p>
                  </div>
                </div>
                {selectedUser.metadata?.email && (
                  <p className="text-xs text-surface-400 break-all">{selectedUser.metadata.email}</p>
                )}
              </div>
            )}
          </div>

          <div className="bg-white border border-surface-100 rounded-2xl p-6 shadow-card">
            <h3 className="font-bold text-surface-900 mb-5 flex items-center gap-2">
              <Zap className="w-5 h-5 text-amber-500" /> Delivery Channels
            </h3>
            <div className="space-y-3">
              {[
                { id: 'popup', label: 'In-app popup', icon: MessageSquare },
                { id: 'push', label: 'Push notification', icon: Bell },
                { id: 'email', label: 'Email', icon: Mail },
              ].map((channel) => (
                <label key={channel.id} className="flex items-center justify-between p-4 rounded-xl bg-surface-50 border border-surface-100 cursor-pointer hover:border-primary-200">
                  <span className="flex items-center gap-3 text-sm font-bold text-surface-600">
                    <channel.icon className="w-4 h-4 text-primary-500" /> {channel.label}
                  </span>
                  <input
                    type="checkbox"
                    checked={channels[channel.id]}
                    onChange={(event) => setChannels((current) => ({ ...current, [channel.id]: event.target.checked }))}
                    className="w-4 h-4 accent-primary-500"
                  />
                </label>
              ))}
            </div>
          </div>
        </div>

        <div className="xl:col-span-2 space-y-6">
          <div className="bg-white border border-surface-100 rounded-2xl p-6 shadow-card">
            <div className="flex items-center justify-between gap-4 mb-5">
              <h3 className="font-bold text-surface-900 flex items-center gap-2">
                <Sparkles className="w-5 h-5 text-primary-500" /> Message Composer
              </h3>
              <button
                type="button"
                onClick={applyRecommendation}
                disabled={!selectedUser}
                className="px-3 py-2 rounded-xl bg-primary-50 text-primary-600 border border-primary-100 text-[10px] font-bold uppercase tracking-widest disabled:opacity-40 hover:bg-primary-100 transition-colors"
              >
                Use Recommendation
              </button>
            </div>

            <div className="grid md:grid-cols-2 gap-4 mb-6">
              {TEMPLATES.map((item) => (
                <button
                  key={item.id}
                  type="button"
                  onClick={() => applyTemplate(item.id)}
                  className={`text-left p-4 rounded-xl border transition-all ${template === item.id ? 'bg-primary-50 border-primary-200' : 'bg-surface-50 border-surface-100 hover:border-surface-200'}`}
                >
                  <div className="flex items-center justify-between gap-3">
                    <p className="text-sm font-bold text-surface-900">{item.label}</p>
                    <Copy className="w-4 h-4 text-surface-300" />
                  </div>
                  <p className="text-xs text-surface-400 mt-2">{item.title}</p>
                </button>
              ))}
            </div>

            <div className="space-y-4">
              <div>
                <label className="text-xs font-bold text-surface-400 uppercase tracking-widest">Popup Title</label>
                <input
                  value={title}
                  onChange={(event) => {
                    setTitle(event.target.value);
                    if (!emailSubject) setEmailSubject(event.target.value);
                  }}
                  className="mt-2 w-full bg-white border border-surface-200 rounded-xl p-3 text-sm text-surface-900 focus:border-primary-500 focus:ring-2 focus:ring-primary-500/20 outline-none"
                />
              </div>

              <div>
                <label className="text-xs font-bold text-surface-400 uppercase tracking-widest">Message</label>
                <textarea
                  value={message}
                  onChange={(event) => setMessage(event.target.value)}
                  placeholder="Type the exact popup/email message for this user..."
                  className="mt-2 w-full min-h-36 bg-white border border-surface-200 rounded-xl p-4 text-sm text-surface-900 focus:border-primary-500 focus:ring-2 focus:ring-primary-500/20 outline-none resize-none"
                />
              </div>

              <div className="grid md:grid-cols-3 gap-4">
                <div>
                  <label className="text-xs font-bold text-surface-400 uppercase tracking-widest">Priority</label>
                  <select
                    value={type}
                    onChange={(event) => setType(event.target.value)}
                    className="mt-2 w-full bg-white border border-surface-200 rounded-xl p-3 text-sm text-surface-900 focus:border-primary-500 outline-none"
                  >
                    <option value="INFO">Info</option>
                    <option value="WARNING">Warning</option>
                    <option value="CRITICAL">Critical</option>
                  </select>
                </div>

                <div>
                  <label className="text-xs font-bold text-surface-400 uppercase tracking-widest">Schedule</label>
                  <div className="relative mt-2">
                    <CalendarClock className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-surface-400" />
                    <input
                      type="datetime-local"
                      value={scheduleAt}
                      onChange={(event) => setScheduleAt(event.target.value)}
                      className="w-full pl-10 bg-white border border-surface-200 rounded-xl p-3 text-sm text-surface-900 focus:border-primary-500 outline-none"
                    />
                  </div>
                </div>

                <div>
                  <label className="text-xs font-bold text-surface-400 uppercase tracking-widest">Email To</label>
                  <input
                    type="email"
                    value={emailTo}
                    onChange={(event) => setEmailTo(event.target.value)}
                    placeholder="user@example.com"
                    disabled={!channels.email}
                    className="mt-2 w-full bg-white border border-surface-200 rounded-xl p-3 text-sm text-surface-900 focus:border-primary-500 outline-none disabled:opacity-40"
                  />
                </div>
              </div>

              {channels.email && (
                <div>
                  <label className="text-xs font-bold text-surface-400 uppercase tracking-widest">Email Subject</label>
                  <input
                    value={emailSubject}
                    onChange={(event) => setEmailSubject(event.target.value)}
                    className="mt-2 w-full bg-white border border-surface-200 rounded-xl p-3 text-sm text-surface-900 focus:border-primary-500 outline-none"
                  />
                </div>
              )}
            </div>

            <button
              type="submit"
              disabled={sending || !selectedUserId || !message.trim() || selectedChannels.length === 0}
              className="mt-6 w-full py-4 btn-primary disabled:opacity-50 rounded-xl font-bold flex items-center justify-center gap-2"
            >
              {sending ? (
                <div className="w-5 h-5 border-2 border-white/30 border-t-white rounded-full animate-spin" />
              ) : (
                <>
                  <Send className="w-5 h-5" /> Send To Selected User
                </>
              )}
            </button>
          </div>

          {result && (
            <motion.div
              initial={{ opacity: 0, y: 8 }}
              animate={{ opacity: 1, y: 0 }}
              className={`rounded-2xl border p-5 ${result.status === 'failed' ? 'bg-red-50 border-red-200' : 'bg-accent-50 border-accent-200'}`}
            >
              <div className="flex items-start gap-3">
                {result.status === 'failed' ? (
                  <Clock className="w-5 h-5 text-red-500 mt-0.5" />
                ) : (
                  <CheckCircle2 className="w-5 h-5 text-accent-500 mt-0.5" />
                )}
                <div>
                  <p className="font-bold text-surface-900 capitalize">{result.status}</p>
                  <p className="text-sm text-surface-500 mt-1">
                    {result.message || `Target user: ${result.user_id}. Channels: ${(result.channels || []).join(', ')}`}
                  </p>
                  {result.results?.email?.status && (
                    <p className="text-xs text-surface-400 mt-2">Email status: {result.results.email.status}</p>
                  )}
                </div>
              </div>
            </motion.div>
          )}
        </div>
      </form>
    </div>
  );
}
