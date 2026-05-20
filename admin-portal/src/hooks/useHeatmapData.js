import { useState, useEffect, useMemo, useCallback } from 'react';
import { backendApi, engineApi } from '../utils/apiBase';
import { NATIVE_WIDTH, NATIVE_HEIGHT, getUserLabel } from '../utils/heatmapUtils';

export default function useHeatmapData({ startDate, endDate } = {}) {
  const [rawEvents, setRawEvents] = useState([]);
  const [loading, setLoading] = useState(true);
  const [loadingPreview, setLoadingPreview] = useState(false);
  const [sourceStatus, setSourceStatus] = useState({ backend: 'pending', engine: 'pending' });

  const fetchData = useCallback(async () => {
    try {
      const initialLoad = rawEvents.length === 0;
      setLoading(initialLoad);
      setLoadingPreview(!initialLoad);
      setSourceStatus({ backend: 'pending', engine: 'pending' });

      const backendUrl = backendApi('/api/admin/heatmap?limit=500' +
        (startDate ? `&startDate=${startDate}` : '') +
        (endDate ? `&endDate=${endDate}` : ''));
      const engineUrl = engineApi('/admin/heatmap?limit=500' +
        (startDate ? `&startDate=${startDate}` : '') +
        (endDate ? `&endDate=${endDate}` : ''));

      const [backendRes, engineRes] = await Promise.allSettled([
        fetch(backendUrl, {
          headers: localStorage.getItem('adminToken')
            ? { Authorization: `Bearer ${localStorage.getItem('adminToken')}` }
            : {},
        }),
        fetch(engineUrl),
      ]);

      let allEvents = [];
      let engineEvents = [];
      let nextStatus = { backend: 'offline', engine: 'offline' };

      if (engineRes.status === 'fulfilled' && engineRes.value.ok) {
        const data = await engineRes.value.json();
        engineEvents = data.events || [];
        nextStatus.engine = 'ok';
      } else if (engineRes.status === 'rejected') {
        console.warn('[Heatmap] Engine fetch failed:', engineRes.reason);
      } else if (engineRes.status === 'fulfilled' && !engineRes.value.ok) {
        nextStatus.engine = `error ${engineRes.value.status}`;
      }

      const engineEmails = new Set(
        engineEvents.map(e => e.userId?.email).filter(Boolean)
      );

      if (backendRes.status === 'fulfilled' && backendRes.value.ok) {
        const data = await backendRes.value.json();
        nextStatus.backend = data.success === false ? 'degraded' : 'ok';
        const backendEvents = (data.events || []).filter(e => {
          const email = e.userId?.email;
          if (!email) return true;
          if (engineEmails.has(email)) return false;
          const domain = email.split('@')[1] || '';
          if (domain === 'example.test' || domain === 'example.com' || domain === 'example.org') return false;
          return true;
        });
        allEvents = allEvents.concat(backendEvents);
      } else if (backendRes.status === 'rejected') {
        console.warn('[Heatmap] Backend fetch failed:', backendRes.reason);
      } else if (backendRes.status === 'fulfilled') {
        nextStatus.backend = `error ${backendRes.value.status}`;
      }

      allEvents = allEvents.concat(engineEvents);
      setRawEvents(allEvents);
      setSourceStatus(nextStatus);
    } catch (error) {
      console.error('[Heatmap] Fetch error:', error);
    } finally {
      setLoading(false);
      setLoadingPreview(false);
    }
  }, [startDate, endDate]);

  useEffect(() => {
    fetchData();
    const interval = setInterval(fetchData, 150000);
    return () => clearInterval(interval);
  }, [fetchData]);

  const normalizedEvents = useMemo(() => {
    return rawEvents.map(e => {
      const meta = e.metadata || {};
      return {
        eventType: e.eventType || e.type,
        page: e.page || e.pageId || 'unknown',
        element: e.element || e.buttonName,
        x: e.x ?? meta.x ?? meta.clientX ?? null,
        y: e.y ?? meta.y ?? meta.clientY ?? null,
        xRatio: e.xRatio ?? meta.xRatio ?? null,
        yRatio: e.yRatio ?? meta.yRatio ?? null,
        viewportWidth: e.viewportWidth ?? meta.viewportWidth ?? null,
        viewportHeight: e.viewportHeight ?? meta.viewportHeight ?? null,
        pageX: meta.pageX ?? null,
        pageY: meta.pageY ?? null,
        targetCenterClientX: e.targetCenterClientX ?? meta.targetCenterClientX ?? null,
        targetCenterClientY: e.targetCenterClientY ?? meta.targetCenterClientY ?? null,
        targetCenterPageX: e.targetCenterPageX ?? meta.targetCenterPageX ?? null,
        targetCenterPageY: e.targetCenterPageY ?? meta.targetCenterPageY ?? null,
        targetPositionMode: e.targetPositionMode || meta.targetPositionMode || 'document',
        targetScrollContainerTop: e.targetScrollContainerTop ?? meta.targetScrollContainerTop ?? 0,
        targetScrollContainerLeft: e.targetScrollContainerLeft ?? meta.targetScrollContainerLeft ?? 0,
        screenWidth: meta.screenWidth || NATIVE_WIDTH,
        screenHeight: meta.screenHeight || NATIVE_HEIGHT,
        pageWidth: meta.pageWidth ?? null,
        pageHeight: meta.pageHeight ?? null,
        userId: e.userId?._id || e.userId || 'unknown',
        userName: e.userId?.fullName,
        userEmail: e.userId?.email,
        isGuest: Boolean(meta.isGuest),
        guestId: meta.guestId || meta.trackingUserId || null,
        timestamp: e.timestamp,
        intentScore: e.intentScore ?? meta.intentScore ?? 0,
      };
    }).filter(e => {
      const hasAbsolute = e.x != null && e.y != null;
      const hasRatio = e.xRatio != null && e.yRatio != null;
      return hasAbsolute || hasRatio;
    });
  }, [rawEvents]);

  const users = useMemo(() => {
    const unique = new Map();
    normalizedEvents.forEach(e => {
      const label = getUserLabel(e);
      if (!unique.has(label)) unique.set(label, { label, userId: e.userId });
    });
    return Array.from(unique.values()).sort((a, b) => a.label.localeCompare(b.label));
  }, [normalizedEvents]);

  const pages = useMemo(() => {
    return [...new Set(normalizedEvents.map(e => e.page))].sort();
  }, [normalizedEvents]);

  const pageTotals = useMemo(() => {
    const totals = {};
    normalizedEvents.forEach(e => {
      totals[e.page] = (totals[e.page] || 0) + 1;
    });
    return totals;
  }, [normalizedEvents]);

  return {
    fetchData,
    rawEvents,
    normalizedEvents,
    loading,
    loadingPreview,
    sourceStatus,
    users,
    pages,
    pageTotals,
  };
}
