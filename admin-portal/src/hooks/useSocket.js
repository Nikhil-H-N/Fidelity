import { useEffect, useRef } from 'react';
import { io } from 'socket.io-client';

const SOCKET_URL = import.meta.env.VITE_SOCKET_URL || 'http://localhost:5000';

let adminSocket = null;

export function getAdminSocket() {
  return adminSocket;
}

export function useAdminSocket(onEvent) {
  const connected = useRef(false);
  const callbackRef = useRef(onEvent);
  callbackRef.current = onEvent;

  useEffect(() => {
    if (connected.current) return;

    const token = localStorage.getItem('adminToken');

    adminSocket = io(SOCKET_URL, {
      auth: { token: token || null },
      transports: ['websocket', 'polling'],
      reconnection: true,
      reconnectionDelay: 2000,
    });

    adminSocket.on('connect', () => {
      console.log('[AdminSocket] Connected:', adminSocket.id);
      connected.current = true;
    });

    adminSocket.on('disconnect', (reason) => {
      console.log('[AdminSocket] Disconnected:', reason);
      connected.current = false;
    });

    // Real-time trigger events
    adminSocket.on('trigger_fired', (data) => {
      console.log('[AdminSocket] Trigger fired:', data);
      callbackRef.current?.('trigger_fired', data);
    });

    // Real-time popup events
    adminSocket.on('popup_event', (data) => {
      console.log('[AdminSocket] Popup event:', data);
      callbackRef.current?.('popup_event', data);
    });

    // User activity updates
    adminSocket.on('user_activity', (data) => {
      callbackRef.current?.('user_activity', data);
    });

    // Session updates
    adminSocket.on('session_update', (data) => {
      callbackRef.current?.('session_update', data);
    });

    return () => {
      if (adminSocket) {
        adminSocket.disconnect();
        adminSocket = null;
        connected.current = false;
      }
    };
  }, []);
}
