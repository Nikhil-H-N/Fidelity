import { useEffect, useRef, useCallback } from 'react';
import { io } from 'socket.io-client';

const SOCKET_URL = import.meta.env.VITE_SOCKET_URL || 'http://localhost:5000';

let socket = null;

export function getSocket() {
  return socket;
}

function createSocketConnection(token) {
  return io(SOCKET_URL, {
    auth: { token: token || null },
    transports: ['websocket', 'polling'],
    reconnection: true,
    reconnectionDelay: 2000,
    reconnectionAttempts: 10,
  });
}

export function useSocket() {
  const connected = useRef(false);

  useEffect(() => {
    const attachHandlers = () => {
      socket.on('connect', () => {
        console.log('[Socket] Connected:', socket.id);
        connected.current = true;
        const guestId = localStorage.getItem('fw_guestId');
        if (guestId) socket.emit('join_guest', guestId);
      });

      socket.on('disconnect', (reason) => {
        console.log('[Socket] Disconnected:', reason);
        connected.current = false;
      });

      socket.on('connect_error', (err) => {
        console.warn('[Socket] Connection error:', err.message);
      });

      // Listen for real-time notifications from trigger engine
      socket.on('notification', (data) => {
        console.log('[Socket] Notification received:', data);
        window.dispatchEvent(new CustomEvent('finova:notification', { detail: data }));
      });

      // Listen for intent updates
      socket.on('intent_update', (data) => {
        console.log('[Socket] Intent update:', data);
      });
    };

    const connect = (token = localStorage.getItem('fw_token')) => {
      socket?.disconnect();
      connected.current = false;
      socket = createSocketConnection(token);
      attachHandlers();
    };

    connect();

    const handleAuthChanged = (event) => {
      connect(event.detail?.token || null);
    };

    window.addEventListener('finova:auth-changed', handleAuthChanged);

    return () => {
      window.removeEventListener('finova:auth-changed', handleAuthChanged);
      if (socket) {
        socket.disconnect();
        socket = null;
        connected.current = false;
      }
    };
  }, []);

  const emit = useCallback((event, data) => {
    if (socket?.connected) {
      socket.emit(event, data);
    }
  }, []);

  return { socket, emit };
}
