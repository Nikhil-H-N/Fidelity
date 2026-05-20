import { useCallback, useState, useEffect, useRef } from 'react';
import { useNavigate } from 'react-router-dom';
import { getSocket } from '../hooks/useSocket';

const AUTO_DISMISS_MS = 12000;

const ICONS = {
  high_intent: (
    <svg className="w-6 h-6" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
      <path strokeLinecap="round" strokeLinejoin="round" d="M13 7h8m0 0v8m0-8l-8 8-4-4-6 6" />
    </svg>
  ),
  form_abandon: (
    <svg className="w-6 h-6" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
      <path strokeLinecap="round" strokeLinejoin="round" d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
    </svg>
  ),
  conversion: (
    <svg className="w-6 h-6" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
      <path strokeLinecap="round" strokeLinejoin="round" d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
    </svg>
  ),
  nudge: (
    <svg className="w-6 h-6" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
      <path strokeLinecap="round" strokeLinejoin="round" d="M15 17h5l-1.405-1.405A2.032 2.032 0 0118 14.158V11a6.002 6.002 0 00-4-5.659V5a2 2 0 10-4 0v.341C7.67 6.165 6 8.388 6 11v3.159c0 .538-.214 1.055-.595 1.436L4 17h5m6 0v1a3 3 0 11-6 0v-1m6 0H9" />
    </svg>
  ),
};

const GRADIENTS = {
  CRITICAL: 'from-red-500 to-orange-500',
  HIGH: 'from-indigo-500 to-purple-600',
  MEDIUM: 'from-blue-500 to-cyan-500',
  LOW: 'from-gray-400 to-gray-500',
};

export default function SmartPopup({ data, onDismiss, onAction }) {
  const [visible, setVisible] = useState(false);
  const [progress, setProgress] = useState(100);
  const timerRef = useRef(null);
  const dismissTimeoutRef = useRef(null);
  const navigate = useNavigate();

  const handleDismiss = useCallback(() => {
    clearInterval(timerRef.current);
    if (dismissTimeoutRef.current) clearTimeout(dismissTimeoutRef.current);
    setVisible(false);
    const socket = getSocket();
    if (socket?.connected) {
      socket.emit('popup_dismissed', {
        notificationId: data.id,
        triggerReason: data.triggerReason,
        mongoUserId: data.mongoUserId,
      });
    }
    dismissTimeoutRef.current = setTimeout(() => onDismiss?.(), 300);
  }, [data.id, data.mongoUserId, data.triggerReason, onDismiss]);

  useEffect(() => {
    // Animate in
    requestAnimationFrame(() => setVisible(true));

    const socket = getSocket();
    if (socket?.connected) {
      socket.emit('popup_shown', {
        notificationId: data.id,
        triggerReason: data.triggerReason,
        mongoUserId: data.mongoUserId,
      });
    }

    // Auto-dismiss timer
    const startTime = Date.now();
    timerRef.current = setInterval(() => {
      const elapsed = Date.now() - startTime;
      const remaining = Math.max(0, 100 - (elapsed / AUTO_DISMISS_MS) * 100);
      setProgress(remaining);
      if (remaining <= 0) {
        handleDismiss();
      }
    }, 100);

    return () => {
      clearInterval(timerRef.current);
      if (dismissTimeoutRef.current) clearTimeout(dismissTimeoutRef.current);
    };
  }, [data.id, data.mongoUserId, data.triggerReason, handleDismiss]);

  const handleClick = () => {
    clearInterval(timerRef.current);
    const socket = getSocket();
    if (socket?.connected) {
      socket.emit('popup_clicked', {
        notificationId: data.id,
        triggerReason: data.triggerReason,
        mongoUserId: data.mongoUserId,
      });
    }
    if (data.ctaLink) {
      navigate(data.ctaLink);
    }
    onAction?.(data);
    setVisible(false);
    if (dismissTimeoutRef.current) clearTimeout(dismissTimeoutRef.current);
    dismissTimeoutRef.current = setTimeout(() => onDismiss?.(), 300);
  };

  const priority = data.priority || 'MEDIUM';
  const type = data.type || 'nudge';
  const icon = ICONS[type] || ICONS.nudge;
  const gradient = GRADIENTS[priority] || GRADIENTS.MEDIUM;

  return (
    <div
      className={`
        w-[380px] rounded-2xl border border-white/20 bg-white/95 backdrop-blur-xl
        shadow-[0_20px_60px_-15px_rgba(0,0,0,0.3)] overflow-hidden
        transition-all duration-500 ease-out
        ${visible ? 'opacity-100 translate-y-0 scale-100' : 'opacity-0 translate-y-6 scale-95'}
      `}
    >
      {/* Progress bar */}
      <div className="h-1 bg-gray-100">
        <div
          className={`h-full bg-gradient-to-r ${gradient} transition-all duration-100 ease-linear`}
          style={{ width: `${progress}%` }}
        />
      </div>

      <div className="p-5">
        <div className="flex items-start gap-4">
          {/* Icon */}
          <div className={`w-12 h-12 rounded-2xl bg-gradient-to-br ${gradient} text-white flex items-center justify-center shadow-lg shrink-0`}>
            {icon}
          </div>

          {/* Content */}
          <div className="flex-1 min-w-0">
            <p className="text-sm font-bold text-gray-900 leading-tight">{data.title}</p>
            <p className="text-sm text-gray-600 mt-1.5 leading-relaxed">{data.message}</p>
          </div>

          {/* Dismiss */}
          <button
            onClick={handleDismiss}
            className="text-gray-400 hover:text-gray-700 text-xl leading-none p-1.5 rounded-xl hover:bg-gray-100 transition-colors shrink-0"
          >
            &times;
          </button>
        </div>

        {/* CTA */}
        {data.cta && (
          <button
            onClick={handleClick}
            className={`
              mt-4 w-full py-2.5 px-4 rounded-xl text-sm font-semibold text-white
              bg-gradient-to-r ${gradient} hover:shadow-lg
              transition-all duration-200 active:scale-[0.98]
            `}
          >
            {data.cta}
          </button>
        )}

        <p className="text-[10px] text-gray-400 mt-2 text-center">
          Powered by FinovaWealth AI
        </p>
      </div>
    </div>
  );
}
