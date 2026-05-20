import { useState, useEffect, useMemo, useRef } from 'react';
import { createPortal } from 'react-dom';
import { RefreshCw, Filter, Layers, Eye, Thermometer, Users } from 'lucide-react';
import useHeatmapData from '../hooks/useHeatmapData';
import { NATIVE_WIDTH, NATIVE_HEIGHT, pageIdToRoute, getHeatmapPoint, getUserLabel } from '../utils/heatmapUtils';

const heatmapColor = (value) => {
  const t = Math.min(1, Math.max(0, value));
  if (t < 0.2) {
    const p = t / 0.2;
    return [40 + 215 * p, 120 + 80 * p, 190 - 50 * p, 40 + 60 * p];
  }
  if (t < 0.5) {
    const p = (t - 0.2) / 0.3;
    return [255, 200 - 80 * p, 140 - 100 * p, 100 + 55 * p];
  }
  if (t < 0.75) {
    const p = (t - 0.5) / 0.25;
    return [255, 120 - 60 * p, 40 - 20 * p, 155 + 50 * p];
  }
  const p = (t - 0.75) / 0.25;
  return [255, 60 - 40 * p, 20 - 15 * p, 205 + 50 * p];
};

const MAX_CANVAS_HEIGHT = 2000;

const renderHeatmapCanvas = (canvas, points, width, height) => {
  const ctx = canvas.getContext('2d');
  const dpr = window.devicePixelRatio || 1;

  // Cap canvas height to prevent OOM
  const cappedHeight = Math.min(height, MAX_CANVAS_HEIGHT);
  const yScale = cappedHeight / height;

  canvas.width = width * dpr;
  canvas.height = cappedHeight * dpr;
  ctx.scale(dpr, dpr);
  ctx.clearRect(0, 0, width, cappedHeight);

  if (points.length === 0) return;

  const radius = Math.max(20, Math.min(50, Math.round(width / 28)));

  // Use Float32Array for density — no 255 saturation
  const density = new Float32Array(width * cappedHeight);

  // Precompute gradient kernel
  const kernelSize = radius * 2;
  const kernel = new Float32Array(kernelSize * kernelSize);
  for (let ky = 0; ky < kernelSize; ky++) {
    for (let kx = 0; kx < kernelSize; kx++) {
      const dx = kx - radius;
      const dy = ky - radius;
      const dist = Math.sqrt(dx * dx + dy * dy);
      if (dist <= radius) {
        const t = dist / radius;
        // Smooth falloff: 1 at center, 0 at edge
        kernel[ky * kernelSize + kx] = (1 - t * t) * (1 - t * t);
      }
    }
  }

  // Accumulate density for each point
  points.forEach(({ x, y }) => {
    const cx = Math.round(x);
    const cy = Math.round(y * yScale);
    if (cy < 0 || cy >= cappedHeight) return;

    const startX = Math.max(0, cx - radius);
    const endX = Math.min(width - 1, cx + radius);
    const startY = Math.max(0, cy - radius);
    const endY = Math.min(cappedHeight - 1, cy + radius);

    for (let py = startY; py <= endY; py++) {
      const ky = py - cy + radius;
      for (let px = startX; px <= endX; px++) {
        const kx = px - cx + radius;
        density[py * width + px] += kernel[ky * kernelSize + kx];
      }
    }
  });

  // Find max density for normalization
  let maxDensity = 0;
  for (let i = 0; i < density.length; i++) {
    if (density[i] > maxDensity) maxDensity = density[i];
  }

  if (maxDensity === 0) return;

  // Render to canvas
  const imageData = ctx.createImageData(width, cappedHeight);
  const pixels = imageData.data;

  for (let i = 0; i < density.length; i++) {
    const normalized = Math.min(1, density[i] / maxDensity);
    if (normalized < 0.01) continue; // Skip transparent pixels
    const [r, g, b, a] = heatmapColor(normalized);
    const pi = i * 4;
    pixels[pi] = r;
    pixels[pi + 1] = g;
    pixels[pi + 2] = b;
    pixels[pi + 3] = a;
  }

  ctx.putImageData(imageData, 0, 0);
};

const HeatmapCanvasOverlay = ({ scrollRef, clickEvents, iframeHeight, scale, zIndex }) => {
  const [viewport, setViewport] = useState(null);
  const canvasRef = useRef(null);
  const heatmapPointsRef = useRef([]);

  useEffect(() => {
    if (clickEvents.length === 0) { heatmapPointsRef.current = []; return; }
    heatmapPointsRef.current = clickEvents.map(click => {
      const point = getHeatmapPoint(click, iframeHeight, { scrollLeft: 0, scrollTop: 0 }, 1);
      return { x: point.x, y: point.y };
    });
  }, [clickEvents, iframeHeight]);

  useEffect(() => {
    const scrollEl = scrollRef.current;
    if (!scrollEl) return;
    let frameId = null;
    const updateViewport = () => {
      if (frameId) cancelAnimationFrame(frameId);
      frameId = requestAnimationFrame(() => {
        const rect = scrollEl.getBoundingClientRect();
        setViewport({ left: rect.left, top: rect.top, width: rect.width, height: rect.height, scrollLeft: scrollEl.scrollLeft, scrollTop: scrollEl.scrollTop });
        frameId = null;
      });
    };
    updateViewport();
    scrollEl.addEventListener('scroll', updateViewport, { passive: true });
    window.addEventListener('scroll', updateViewport, true);
    window.addEventListener('resize', updateViewport);
    const observer = new ResizeObserver(updateViewport);
    observer.observe(scrollEl);
    return () => {
      if (frameId) cancelAnimationFrame(frameId);
      scrollEl.removeEventListener('scroll', updateViewport);
      window.removeEventListener('scroll', updateViewport, true);
      window.removeEventListener('resize', updateViewport);
      observer.disconnect();
    };
  }, [scrollRef, clickEvents.length, iframeHeight, scale]);

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas || heatmapPointsRef.current.length === 0) return;
    renderHeatmapCanvas(canvas, heatmapPointsRef.current, NATIVE_WIDTH, iframeHeight);
  }, [clickEvents, iframeHeight]);

  if (!viewport || typeof document === 'undefined') return null;

  return createPortal(
    <div aria-hidden="true" style={{
      position: 'fixed', left: `${viewport.left}px`, top: `${viewport.top}px`,
      width: `${viewport.width}px`, height: `${viewport.height}px`,
      overflow: 'hidden', pointerEvents: 'none', zIndex,
    }}>
      <div style={{
        position: 'absolute', left: `${-viewport.scrollLeft}px`, top: `${-viewport.scrollTop}px`,
        width: `${NATIVE_WIDTH * scale}px`, height: `${iframeHeight * scale}px`,
      }}>
        <canvas ref={canvasRef} style={{ width: `${NATIVE_WIDTH}px`, height: `${Math.min(iframeHeight, MAX_CANVAS_HEIGHT)}px`, opacity: 0.75 }} />
      </div>
      {clickEvents.length > 0 && (
        <div style={{
          position: 'absolute', top: 4, right: 4,
          background: 'rgba(0,0,0,0.75)', color: 'white',
          fontSize: 10, padding: '2px 6px', borderRadius: 4,
        }}>
          {clickEvents.length} points
        </div>
      )}
    </div>,
    document.body
  );
};

const HeatmapPreview = ({ selectedPage, clickEvents, loading, isExpanded = false, previewUser = 'Admin Preview' }) => {
  const [containerEl, setContainerEl] = useState(null);
  const [scrollEl, setScrollEl] = useState(null);
  const [scale, setScale] = useState(1);
  const [iframeHeight, setIframeHeight] = useState(NATIVE_HEIGHT);
  const iframeRoute = selectedPage === 'all' ? '' : pageIdToRoute(selectedPage);
  const frontendUrl = import.meta.env.VITE_FRONTEND_URL || `http://${window.location.hostname}:${window.location.port || 5173}`;
  const iframeSrc = `${frontendUrl}/${iframeRoute}?adminPreview=true&previewName=${encodeURIComponent(previewUser)}`;

  useEffect(() => {
    if (!containerEl) return;
    const updateScale = () => {
      if (!containerEl) return;
      setScale(isExpanded ? Math.min(containerEl.offsetWidth / NATIVE_WIDTH, 1) : containerEl.offsetWidth / NATIVE_WIDTH);
    };
    updateScale();
    const observer = new ResizeObserver(updateScale);
    observer.observe(containerEl);
    return () => observer.disconnect();
  }, [isExpanded, containerEl]);

  useEffect(() => {
    const handlePreviewHeight = (event) => {
      if (event.data?.type !== 'adminPreviewHeight') return;
      const nextHeight = Math.ceil(Number(event.data.height));
      if (Number.isFinite(nextHeight) && nextHeight > 0) setIframeHeight(Math.max(NATIVE_HEIGHT, nextHeight));
    };
    window.addEventListener('message', handlePreviewHeight);
    return () => window.removeEventListener('message', handlePreviewHeight);
  }, []);

  useEffect(() => {
    setIframeHeight(NATIVE_HEIGHT);
    if (scrollEl) scrollEl.scrollTop = 0;
  }, [iframeSrc, scrollEl]);

  const scaledViewportHeight = NATIVE_HEIGHT * scale;
  const scaledContentHeight = iframeHeight * scale;

  return (
    <div ref={el => setContainerEl(el)} className="relative w-full bg-white border border-surface-200 rounded-2xl shadow-card overflow-hidden">
      <div ref={el => setScrollEl(el)} className="overflow-auto" style={{ height: `${scaledViewportHeight}px` }}>
        <div style={{ width: `${NATIVE_WIDTH * scale}px`, height: `${scaledContentHeight}px`, overflow: 'hidden', position: 'relative' }}>
          <div style={{
            width: `${NATIVE_WIDTH}px`, minHeight: `${iframeHeight}px`,
            transform: `scale(${scale})`, transformOrigin: 'top left', position: 'relative',
          }}>
            <iframe src={iframeSrc} style={{ width: '100%', height: `${iframeHeight}px`, border: 'none', pointerEvents: 'none', position: 'relative', zIndex: 1 }}
              title={`Live Preview - ${selectedPage === 'all' ? 'Landing' : selectedPage}`} />
          </div>
        </div>
      </div>

      {scrollEl && (
        <HeatmapCanvasOverlay scrollRef={{ current: scrollEl }} clickEvents={clickEvents} iframeHeight={iframeHeight} scale={scale} zIndex={isExpanded ? 60 : 40} />
      )}

      <div className="absolute bottom-4 left-4 bg-white/95 backdrop-blur border border-surface-200 p-3 rounded-xl flex flex-col gap-2 shadow-lg z-20">
        <div className="flex items-center gap-2 text-[10px] uppercase tracking-widest text-surface-500 font-semibold">
          <Thermometer className="w-3 h-3" /> Intensity
        </div>
        <div className="flex items-center gap-2">
          <div className="w-3 h-3 rounded-full" style={{ background: 'rgba(40,120,190,0.6)', border: '1px solid rgba(40,120,190,0.8)' }} />
          <span className="text-[10px] text-surface-500">Low</span>
        </div>
        <div className="flex items-center gap-2">
          <div className="w-3 h-3 rounded-full" style={{ background: 'rgba(255,200,40,0.7)', border: '1px solid rgba(255,200,40,0.9)' }} />
          <span className="text-[10px] text-surface-500">Medium</span>
        </div>
        <div className="flex items-center gap-2">
          <div className="w-3 h-3 rounded-full" style={{ background: 'rgba(255,60,20,0.85)', border: '1px solid rgba(255,60,20,0.95)' }} />
          <span className="text-[10px] text-surface-500">High</span>
        </div>
      </div>

      {!loading && clickEvents.length === 0 && selectedPage !== 'all' && (
        <div className="absolute inset-0 flex flex-col items-center justify-center text-surface-400 bg-white/80 z-20 p-6 pointer-events-none">
          <Thermometer className="w-12 h-12 mb-4 opacity-30" />
          <p className="text-xl font-semibold text-surface-600">No heatmap data for this page yet</p>
          <p className="text-sm mt-2 text-center text-surface-400">Interact with the site to generate data.</p>
        </div>
      )}

      {loading && (
        <div className="absolute inset-0 flex flex-col items-center justify-center text-primary-600 bg-white/80 z-30 p-6">
          <RefreshCw className="w-8 h-8 mb-3 animate-spin opacity-80" />
          <p className="text-sm font-bold uppercase tracking-widest">Updating...</p>
        </div>
      )}
    </div>
  );
};

export default function ClickHeatmap() {
  const { normalizedEvents, loading, loadingPreview, fetchData, sourceStatus, users, pages, pageTotals } = useHeatmapData();
  const [selectedPage, setSelectedPage] = useState('all');
  const [selectedUser, setSelectedUser] = useState('all');
  const [expanded, setExpanded] = useState(false);

  const filteredEvents = useMemo(() => {
    let events = normalizedEvents;
    if (selectedUser !== 'all') {
      events = events.filter(e => getUserLabel(e) === selectedUser);
    }
    return events;
  }, [normalizedEvents, selectedUser]);

  const clickEvents = useMemo(() => {
    return filteredEvents
      .filter(e => selectedPage === 'all' || e.page === selectedPage)
      .map(e => ({
        x: e.x, y: e.y, pageX: e.pageX, pageY: e.pageY,
        targetCenterClientX: e.targetCenterClientX, targetCenterClientY: e.targetCenterClientY,
        targetCenterPageX: e.targetCenterPageX, targetCenterPageY: e.targetCenterPageY,
        targetPositionMode: e.targetPositionMode,
        targetScrollContainerTop: e.targetScrollContainerTop, targetScrollContainerLeft: e.targetScrollContainerLeft,
        screenWidth: e.screenWidth, screenHeight: e.screenHeight,
        pageWidth: e.pageWidth, pageHeight: e.pageHeight,
        page: e.page, element: e.element, userId: e.userId, timestamp: e.timestamp,
        isGuest: e.isGuest, guestId: e.guestId, userEmail: e.userEmail,
      }));
  }, [filteredEvents, selectedPage]);

  return (
    <div className="space-y-8">
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold text-surface-900">Click Heatmap</h1>
          <p className="text-surface-500 mt-1 text-sm">Density heat visualization of user interactions</p>
        </div>
        <div className="flex items-center gap-3">
          <button onClick={fetchData} className="p-2.5 bg-white border border-surface-200 rounded-xl text-surface-400 hover:text-primary-600 transition-colors" title="Refresh">
            <RefreshCw className={`w-5 h-5 ${loading ? 'animate-spin' : ''}`} />
          </button>
          <button onClick={() => setExpanded(true)} className="p-2.5 bg-white border border-surface-200 rounded-xl text-surface-400 hover:text-primary-600 transition-colors" title="Expand">
            <Eye className="w-5 h-5" />
          </button>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-4 gap-8">
        <div className="space-y-6">
          <div className="bg-white border border-surface-100 rounded-2xl p-6 shadow-card">
            <h3 className="font-bold text-surface-900 mb-4 flex items-center gap-2">
              <Filter className="w-4 h-4 text-primary-500" /> Filters
            </h3>
            <div className="space-y-4">
              <div>
                <label className="text-[10px] font-bold text-surface-400 uppercase tracking-widest mb-2 block">Target User</label>
                <select value={selectedUser} onChange={e => setSelectedUser(e.target.value)}
                  className="w-full bg-surface-50 border border-surface-200 rounded-xl p-3 text-sm text-surface-900 focus:border-primary-500 outline-none">
                  <option value="all">All Users ({users.length})</option>
                  {users.map(u => (
                    <option key={u.label} value={u.label}>{u.label.length > 35 ? u.label.slice(0, 20) + '...' + u.label.slice(-10) : u.label}</option>
                  ))}
                </select>
              </div>
              <div>
                <label className="text-[10px] font-bold text-surface-400 uppercase tracking-widest mb-2 block">Target Page</label>
                <select value={selectedPage} onChange={e => setSelectedPage(e.target.value)}
                  className="w-full bg-surface-50 border border-surface-200 rounded-xl p-3 text-sm text-surface-900 focus:border-primary-500 outline-none">
                  <option value="all">All Pages (Landing Preview)</option>
                  {pages.map(p => <option key={p} value={p}>{p.replace(/_/g, ' ')}</option>)}
                </select>
              </div>
            </div>
          </div>

          <div className="bg-white border border-surface-100 rounded-2xl p-6 shadow-card">
            <h3 className="font-bold text-surface-900 mb-4 flex items-center gap-2">
              <Layers className="w-4 h-4 text-amber-500" /> Stats
            </h3>
            <div className="space-y-4">
              <div className="flex items-center justify-between">
                <span className="text-sm text-surface-500">Total Points</span>
                <span className="text-sm font-bold text-surface-900 font-mono">{clickEvents.length}</span>
              </div>
              <div className="flex items-center justify-between">
                <span className="text-sm text-surface-500">Unique Users</span>
                <span className="text-sm font-bold text-surface-900 font-mono">{new Set(clickEvents.map(c => c.userId)).size}</span>
              </div>
              <div className="flex items-center justify-between">
                <span className="text-sm text-surface-500">Density</span>
                <span className="text-sm font-bold text-accent-600 font-mono">
                  {clickEvents.length > 0 ? (clickEvents.length / (pages.length || 1)).toFixed(1) : 0}
                </span>
              </div>
              <div className="rounded-xl bg-surface-50 border border-surface-100 p-4">
                <div className="flex items-center justify-between mb-2">
                  <span className="text-xs uppercase tracking-widest text-surface-400">Top Pages</span>
                  <span className="text-xs text-surface-400">{selectedPage === 'all' ? 'all' : selectedPage}</span>
                </div>
                <div className="grid grid-cols-2 gap-2 text-xs">
                  {pages.slice(0, 6).map(page => (
                    <div key={page} className="rounded-lg bg-white border border-surface-100 p-2">
                      <span className="block text-surface-600 truncate">{page.replace(/_/g, ' ')}</span>
                      <span className="font-bold text-surface-900">{pageTotals[page] || 0}</span>
                    </div>
                  ))}
                  {pages.length > 6 && (
                    <div className="col-span-2 rounded-lg bg-white border border-surface-100 p-2 text-surface-400 text-[10px]">
                      +{pages.length - 6} more pages
                    </div>
                  )}
                </div>
              </div>
            </div>
          </div>

          <div className="bg-white border border-surface-100 rounded-2xl p-6 shadow-card">
            <h3 className="font-bold text-surface-900 mb-4 flex items-center gap-2">
              <Users className="w-4 h-4 text-blue-500" /> Legend
            </h3>
            <div className="flex items-center gap-2 mb-2">
              <div className="w-3 h-3 rounded" style={{ background: 'rgba(40,120,190,0.5)' }} />
              <span className="text-[11px] text-surface-500">Low density</span>
            </div>
            <div className="flex items-center gap-2 mb-2">
              <div className="w-3 h-3 rounded" style={{ background: 'rgba(255,200,40,0.6)' }} />
              <span className="text-[11px] text-surface-500">Medium density</span>
            </div>
            <div className="flex items-center gap-2">
              <div className="w-3 h-3 rounded" style={{ background: 'rgba(255,60,20,0.8)' }} />
              <span className="text-[11px] text-surface-500">High density</span>
            </div>
          </div>
        </div>

        <div className="lg:col-span-3">
          <HeatmapPreview selectedPage={selectedPage} clickEvents={clickEvents} loading={loadingPreview}
            previewUser={selectedUser === 'all' ? 'Admin Preview' : selectedUser} />
          {!loading && (
            <div className="mt-3 flex flex-wrap gap-2 text-[10px] font-bold uppercase tracking-widest text-surface-400">
              <span className={`px-2 py-1 rounded-lg border ${sourceStatus.engine === 'ok' ? 'bg-accent-50 text-accent-700 border-accent-100' : 'bg-amber-50 text-amber-700 border-amber-100'}`}>
                Engine: {sourceStatus.engine}
              </span>
              <span className={`px-2 py-1 rounded-lg border ${sourceStatus.backend === 'ok' ? 'bg-accent-50 text-accent-700 border-accent-100' : 'bg-amber-50 text-amber-700 border-amber-100'}`}>
                Mongo: {sourceStatus.backend}
              </span>
            </div>
          )}
        </div>
      </div>

      {expanded && (
        <div className="fixed inset-0 z-50 bg-black/50 backdrop-blur-sm p-6 overflow-auto">
          <div className="relative mx-auto max-w-[1500px] bg-white rounded-2xl p-6 shadow-elevated border border-surface-200">
            <div className="flex items-center justify-between gap-4 mb-6">
              <div>
                <h2 className="text-2xl font-bold text-surface-900">Expanded Heatmap Preview</h2>
                <p className="text-sm text-surface-500">Full-size viewport for inspecting interaction density.</p>
              </div>
              <button onClick={() => setExpanded(false)}
                className="inline-flex items-center gap-2 rounded-xl border border-surface-200 bg-white px-4 py-2 text-sm text-surface-600 hover:bg-surface-50 transition font-medium">
                Close
              </button>
            </div>
            <HeatmapPreview selectedPage={selectedPage} clickEvents={clickEvents} loading={loadingPreview}
              isExpanded={true} previewUser={selectedUser === 'all' ? 'Admin Preview' : selectedUser} />
          </div>
        </div>
      )}
    </div>
  );
}
