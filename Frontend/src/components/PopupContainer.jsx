import { useState, useEffect, useCallback, useRef } from 'react';
import SmartPopup from './SmartPopup';

export default function PopupContainer() {
  const [activePopup, setActivePopup] = useState(null);
  const [, setQueue] = useState([]);
  const activePopupRef = useRef(activePopup);
  activePopupRef.current = activePopup;
  const dismissTimerRef = useRef(null);

  useEffect(() => {
    return () => {
      if (dismissTimerRef.current) clearTimeout(dismissTimerRef.current);
    };
  }, []);

  useEffect(() => {
    const handleNotification = (data) => {
      console.log('[PopupContainer] Notification received:', data);
      if (activePopupRef.current) {
        setQueue((prev) => [...prev, data]);
      } else {
        setActivePopup(data);
      }
    };

    const handleWindowNotification = (event) => handleNotification(event.detail);

    window.addEventListener('finova:notification', handleWindowNotification);

    return () => {
      window.removeEventListener('finova:notification', handleWindowNotification);
    };
  }, []);

  const handleDismiss = useCallback(() => {
    setActivePopup(null);
    dismissTimerRef.current = setTimeout(() => {
      setQueue((prev) => {
        if (prev.length > 0) {
          const [next, ...rest] = prev;
          setActivePopup(next);
          return rest;
        }
        return prev;
      });
    }, 1000);
  }, []);

  const handleAction = useCallback((data) => {
    console.log('[PopupContainer] Action taken:', data);
  }, []);

  if (!activePopup) return null;

  return (
    <div className="fixed bottom-6 right-6 z-[9999]">
      <SmartPopup
        data={activePopup}
        onDismiss={handleDismiss}
        onAction={handleAction}
      />
    </div>
  );
}
