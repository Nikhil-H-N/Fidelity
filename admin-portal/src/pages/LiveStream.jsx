import { useState, useEffect } from 'react';
import {
  Radio, Eye, MousePointerClick, FormInput, Zap,
  MousePointer2, Focus, Clock
} from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';
import { engineApi } from '../utils/apiBase';

const displayEventType = (event) => (
  event.raw_event_type ||
  event.metadata?.raw_event_type ||
  event.metadata?.rawEventType ||
  event.event_type ||
  'unknown'
);

export default function LiveStream() {
  const [activeUsers, setActiveUsers] = useState([]);
  const [loading, setLoading] = useState(true);
  const POLL_INTERVAL = Number(import.meta.env.VITE_POLL_INTERVAL_MS) || 8000;

  const fetchData = async () => {
    try {
      const res = await fetch(engineApi('/admin/active-users'));
      if (res.ok) {
        setActiveUsers(await res.json());
      }
    } catch (error) {
      console.error('Failed to fetch users:', error);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchData();
    const interval = setInterval(fetchData, POLL_INTERVAL);
    return () => clearInterval(interval);
  }, []);

  const userMap = Object.fromEntries(activeUsers.map(u => [u.user_id, u]));
  const allEvents = activeUsers.flatMap(u => (u.events || []).map(e => ({...e, user_id: u.user_id})))
    .sort((a, b) => b.timestamp - a.timestamp)
    .slice(0, 50);

  const getDisplayName = (userId) => {
    const u = userMap[userId];
    if (!u) return userId;
    const meta = u.metadata || {};
    const email = meta.email || meta.userEmail;
    const name = meta.name || meta.userName;
    if (email || name) return String(email || name);
    const ev = (u.events || []).find(e => e.metadata?.userEmail || e.metadata?.userName);
    if (ev) return String(ev.metadata.userEmail || ev.metadata.userName);
    return userId;
  };

  return (
    <div className="space-y-8">
      <div>
        <h1 className="text-2xl font-bold text-surface-900">Live Behavioral Stream</h1>
        <p className="text-surface-500 mt-1 text-sm">Real-time raw event ingestion across all active sessions</p>
      </div>

      <div className="bg-white border border-surface-100 rounded-2xl overflow-hidden shadow-card">
        <div className="p-6 border-b border-surface-100 flex items-center justify-between">
          <h3 className="font-bold flex items-center gap-2 text-surface-900">
            <Radio className="w-5 h-5 text-red-500 animate-pulse" /> ENGINE ADAPTER: INCOMING
          </h3>
          <div className="flex items-center gap-4 text-[10px] font-bold text-surface-400">
            <span className="flex items-center gap-1.5"><div className="w-2 h-2 rounded-full bg-primary-500" /> PAGE VIEW</span>
            <span className="flex items-center gap-1.5"><div className="w-2 h-2 rounded-full bg-accent-500" /> CLICK</span>
            <span className="flex items-center gap-1.5"><div className="w-2 h-2 rounded-full bg-amber-500" /> FORM</span>
            <span className="flex items-center gap-1.5"><div className="w-2 h-2 rounded-full bg-indigo-500" /> HOVER</span>
          </div>
        </div>

        <div className="min-h-[600px] p-6 space-y-3">
          <AnimatePresence initial={false}>
            {allEvents.map((e, idx) => {
              const eventType = displayEventType(e);

              return (
              <motion.div
                key={`${e.timestamp}-${e.user_id}-${idx}`}
                initial={{ opacity: 0, x: -20 }}
                animate={{ opacity: 1, x: 0 }}
                className="flex items-center justify-between p-4 rounded-xl bg-surface-50 border border-surface-100 hover:border-primary-200 transition-all group"
              >
                <div className="flex items-center gap-4">
                  <div className={`w-10 h-10 rounded-xl flex items-center justify-center ${
                    eventType.includes('page') ? 'bg-primary-50 text-primary-500' :
                    eventType.includes('click') ? 'bg-accent-50 text-accent-500' :
                    eventType.includes('form') ? 'bg-amber-50 text-amber-500' :
                    eventType.includes('hover') ? 'bg-indigo-50 text-indigo-500' :
                    eventType.includes('focus') ? 'bg-purple-50 text-purple-500' :
                    eventType.includes('idle') || eventType.includes('inactive') ? 'bg-red-50 text-red-500' :
                    'bg-surface-100 text-surface-400'
                  }`}>
                    {eventType.includes('page') ? <Eye className="w-5 h-5" /> :
                     eventType.includes('click') ? <MousePointerClick className="w-5 h-5" /> :
                     eventType.includes('form') ? <FormInput className="w-5 h-5" /> :
                     eventType.includes('hover') ? <MousePointer2 className="w-5 h-5" /> :
                     eventType.includes('focus') ? <Focus className="w-5 h-5" /> :
                     eventType.includes('idle') || eventType.includes('inactive') ? <Clock className="w-5 h-5" /> :
                     <Zap className="w-5 h-5" />}
                  </div>
                  <div>
                    <div className="flex items-center gap-2">
                      <span className="text-xs font-bold text-surface-700 uppercase tracking-wider">{eventType.replace(/_/g, ' ')}</span>
                      <span className="text-[10px] text-surface-500 tracking-tighter bg-surface-100 px-1.5 py-0.5 rounded">{getDisplayName(e.user_id)}</span>
                      {e.metadata?.connectionOrigin && (
                        <span className={`text-[10px] font-bold px-1.5 py-0.5 rounded uppercase tracking-tighter ${
                          e.metadata.connectionOrigin === 'internal' ? 'bg-accent-50 text-accent-700' :
                          e.metadata.connectionOrigin === 'remote' ? 'bg-amber-50 text-amber-700' :
                          'bg-primary-50 text-primary-700'
                        }`}>
                          {e.metadata.connectionOrigin}
                        </span>
                      )}
                    </div>
                    <p className="text-sm font-medium text-surface-500 mt-0.5">
                      {e.page_id} {e.element_id ? <span className="text-surface-300 mx-1">/</span> : ''}
                      <span className="text-surface-400">{e.element_id}</span>
                      {e.metadata?.clientIp && (
                        <span className="text-[10px] text-surface-300 ml-2 font-mono">[{e.metadata.clientIp}]</span>
                      )}
                    </p>
                  </div>
                </div>
                <div className="text-right">
                  <p className="text-xs font-mono text-primary-600 font-bold">{new Date(e.timestamp * 1000).toLocaleTimeString()}</p>
                  <p className="text-[10px] text-surface-400 mt-1">{new Date(e.timestamp * 1000).toLocaleDateString()}</p>
                </div>
              </motion.div>
              );
            })}
          </AnimatePresence>

          {allEvents.length === 0 && !loading && (
            <div className="flex flex-col items-center justify-center py-32 text-surface-300">
              <Radio className="w-12 h-12 mb-4 opacity-20 animate-pulse" />
              <p className="text-lg font-medium italic">Listening for behavioral signals...</p>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
