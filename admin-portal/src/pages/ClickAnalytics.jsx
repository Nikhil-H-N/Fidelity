import { useState, useMemo } from 'react';
import { RefreshCw, Filter, Layers, Eye, Thermometer, MousePointer2, Users, Map } from 'lucide-react';
import useHeatmapData from '../hooks/useHeatmapData';
import { NATIVE_WIDTH, NATIVE_HEIGHT, pageIdToRoute, getHeatmapPoint, getUserLabel } from '../utils/heatmapUtils';

/* ─── Shared helpers ─── */
const heatmapColor = (value) => {
  const t = Math.min(1, Math.max(0, value));
  if (t < 0.2) { const p = t / 0.2; return [40 + 215 * p, 120 + 80 * p, 190 - 50 * p, 40 + 60 * p]; }
  if (t < 0.5) { const p = (t - 0.2) / 0.3; return [255, 200 - 80 * p, 140 - 100 * p, 100 + 55 * p]; }
  if (t < 0.75) { const p = (t - 0.5) / 0.25; return [255, 120 - 60 * p, 40 - 20 * p, 155 + 50 * p]; }
  const p = (t - 0.75) / 0.25; return [255, 60 - 40 * p, 20 - 15 * p, 205 + 50 * p];
};

const MAX_CANVAS_HEIGHT = 2000;

const renderHeatmapCanvas = (canvas, points, width, height) => {
  const ctx = canvas.getContext('2d');
  const dpr = window.devicePixelRatio || 1;
  const cappedHeight = Math.min(height, MAX_CANVAS_HEIGHT);
  const yScale = cappedHeight / height;
  canvas.width = width * dpr;
  canvas.height = cappedHeight * dpr;
  ctx.scale(dpr, dpr);
  ctx.clearRect(0, 0, width, cappedHeight);
  if (points.length === 0) return;

  const radius = Math.max(20, Math.min(50, Math.round(width / 28)));
  const density = new Float32Array(width * cappedHeight);
  const kernelSize = radius * 2;
  const kernel = new Float32Array(kernelSize * kernelSize);
  for (let ky = 0; ky < kernelSize; ky++) {
    for (let kx = 0; kx < kernelSize; kx++) {
      const dx = kx - radius, dy = ky - radius;
      const dist = Math.sqrt(dx * dx + dy * dy);
      if (dist <= radius) { const t = dist / radius; kernel[ky * kernelSize + kx] = (1 - t * t) * (1 - t * t); }
    }
  }

  points.forEach(({ x, y }) => {
    const cx = Math.round(x), cy = Math.round(y * yScale);
    if (cy < 0 || cy >= cappedHeight) return;
    const startX = Math.max(0, cx - radius), endX = Math.min(width - 1, cx + radius);
    const startY = Math.max(0, cy - radius), endY = Math.min(cappedHeight - 1, cy + radius);
    for (let py = startY; py <= endY; py++) {
      const ky = py - cy + radius;
      for (let px = startX; px <= endX; px++) {
        density[py * width + px] += kernel[ky * kernelSize + (px - cx + radius)];
      }
    }
  });

  let maxDensity = 0;
  for (let i = 0; i < density.length; i++) { if (density[i] > maxDensity) maxDensity = density[i]; }
  if (maxDensity === 0) return;

  const imageData = ctx.createImageData(width, cappedHeight);
  const pixels = imageData.data;
  for (let i = 0; i < density.length; i++) {
    const normalized = Math.min(1, density[i] / maxDensity);
    if (normalized < 0.01) continue;
    const [r, g, b, a] = heatmapColor(normalized);
    const pi = i * 4; pixels[pi] = r; pixels[pi + 1] = g; pixels[pi + 2] = b; pixels[pi + 3] = a;
  }
  ctx.putImageData(imageData, 0, 0);
};

/* ─── Scatter dot with tooltip ─── */
const ScatterDot = ({ click, iframeHeight, idx, hoveredIdx, setHoveredIdx, setTooltipPos }) => {
  const point = getHeatmapPoint(click, iframeHeight, { scrollLeft: 0, scrollTop: 0 }, 1);
  const dotSize = 10;
  const isHovered = hoveredIdx === idx;
  return (
    <div
      className="pointer-events-auto cursor-pointer"
      style={{
        position: 'absolute', left: `${point.x}px`, top: `${point.y}px`,
        width: `${dotSize}px`, height: `${dotSize}px`, borderRadius: '50%',
        backgroundColor: isHovered ? 'rgba(239, 68, 68, 1)' : 'rgba(239, 68, 68, 0.8)',
        transform: `translate(-50%, -50%) scale(${isHovered ? 1.8 : 1})`,
        boxShadow: isHovered
          ? '0 0 0 4px rgba(239,68,68,0.3), 0 0 20px rgba(185,28,28,0.5)'
          : '0 0 0 2px rgba(239,68,68,0.2), 0 0 8px rgba(185,28,28,0.25)',
        transition: 'transform 0.15s ease, box-shadow 0.15s ease',
        zIndex: isHovered ? 100 : 10,
      }}
      onMouseEnter={(e) => { const r = e.currentTarget.getBoundingClientRect(); setTooltipPos({ x: r.left + r.width / 2, y: r.top - 8 }); setHoveredIdx(idx); }}
      onMouseLeave={() => setHoveredIdx(null)}
    />
  );
};

/* ─── Heatmap canvas overlay (portal-based for scroll sync) ─── */
const HeatmapOverlay = ({ scrollRef, clickEvents, iframeHeight, scale }) => {
  const [viewport, setViewport] = useState(null);
  const canvasRef = { current: null };

  useMemo(() => {
    if (!scrollRef.current || clickEvents.length === 0) return;
    const canvas = document.createElement('canvas');
    const points = clickEvents.map(c => getHeatmapPoint(c, iframeHeight, { scrollLeft: 0, scrollTop: 0 }, 1));
    renderHeatmapCanvas(canvas, points, NATIVE_WIDTH, iframeHeight);
    canvasRef.current = canvas;
  }, [clickEvents, iframeHeight]);

  if (!canvasRef.current || clickEvents.length === 0) return null;

  return (
    <div className="absolute inset-0 pointer-events-none" style={{ zIndex: 40 }}>
      <img
        src={canvasRef.current.toDataURL()}
        style={{ width: `${NATIVE_WIDTH}px`, height: `${Math.min(iframeHeight, MAX_CANVAS_HEIGHT)}px`, opacity: 0.75 }}
        alt=""
      />
    </div>
  );
};

/* ─── Combined preview ─── */
const AnalyticsPreview = ({ selectedPage, clickEvents, loading, mode, isExpanded = false, previewUser = 'Admin Preview' }) => {
  const [scale, setScale] = useState(1);
  const [iframeHeight, setIframeHeight] = useState(NATIVE_HEIGHT);
  const [containerEl, setContainerEl] = useState(null);
  const [scrollEl, setScrollEl] = useState(null);
  const [hoveredIdx, setHoveredIdx] = useState(null);
  const [tooltipPos, setTooltipPos] = useState({ x: 0, y: 0 });
  const iframeRoute = selectedPage === 'all' ? '' : pageIdToRoute(selectedPage);
  const frontendUrl = import.meta.env.VITE_FRONTEND_URL || `http://${window.location.hostname}:${window.location.port || 5173}`;
  const iframeSrc = `${frontendUrl}/${iframeRoute}?adminPreview=true&previewName=${encodeURIComponent(previewUser)}`;

  useMemo(() => {
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

  useMemo(() => {
    const handlePreviewHeight = (event) => {
      if (event.data?.type !== 'adminPreviewHeight') return;
      const nextHeight = Math.ceil(Number(event.data.height));
      if (Number.isFinite(nextHeight) && nextHeight > 0) setIframeHeight(Math.max(NATIVE_HEIGHT, nextHeight));
    };
    window.addEventListener('message', handlePreviewHeight);
    return () => window.removeEventListener('message', handlePreviewHeight);
  }, []);

  useMemo(() => {
    setIframeHeight(NATIVE_HEIGHT);
    if (scrollEl) scrollEl.scrollTop = 0;
  }, [iframeSrc, scrollEl]);

  const scaledViewportHeight = NATIVE_HEIGHT * scale;
  const scaledContentHeight = iframeHeight * scale;

  return (
    <div ref={el => setContainerEl(el)} className="relative w-full bg-white border border-surface-200 rounded-2xl shadow-card overflow-hidden">
      <div ref={el => setScrollEl(el)} className="overflow-auto" style={{ height: `${scaledViewportHeight}px` }}>
        <div style={{ width: `${NATIVE_WIDTH * scale}px`, height: `${scaledContentHeight}px`, overflow: 'hidden', position: 'relative' }}>
          <div style={{ width: `${NATIVE_WIDTH}px`, minHeight: `${iframeHeight}px`, transform: `scale(${scale})`, transformOrigin: 'top left', position: 'relative' }}>
            <iframe src={iframeSrc} style={{ width: '100%', height: `${iframeHeight}px`, border: 'none', pointerEvents: 'none', position: 'relative', zIndex: 1 }}
              title={`Live Preview - ${selectedPage === 'all' ? 'Landing' : selectedPage}`} />

            {mode === 'heatmap' && (
              <HeatmapOverlay scrollRef={{ current: scrollEl }} clickEvents={clickEvents} iframeHeight={iframeHeight} scale={scale} />
            )}

            {mode === 'scatter' && (
              <div className="absolute inset-0 pointer-events-none" style={{ zIndex: 50 }}>
                {clickEvents.map((click, idx) => (
                  <ScatterDot key={`dot-${click.timestamp}-${idx}`} click={click} iframeHeight={iframeHeight} idx={idx}
                    hoveredIdx={hoveredIdx} setHoveredIdx={setHoveredIdx} setTooltipPos={setTooltipPos} />
                ))}
              </div>
            )}
          </div>
        </div>
      </div>

      {/* Scatter tooltip */}
      {mode === 'scatter' && hoveredIdx !== null && clickEvents[hoveredIdx] && (
        <div className="pointer-events-none fixed z-[9999]" style={{ left: `${tooltipPos.x}px`, top: `${tooltipPos.y}px`, transform: 'translate(-50%, -100%)' }}>
          <div className="bg-surface-900 text-white rounded-xl px-4 py-3 shadow-elevated text-xs whitespace-nowrap">
            <div className="font-bold text-sm mb-1.5 text-white">{clickEvents[hoveredIdx].element || 'Unknown Element'}</div>
            <div className="space-y-1 text-surface-300">
              <div className="flex items-center gap-2"><span className="text-surface-500 w-12">Page</span><span className="text-white font-medium">{clickEvents[hoveredIdx].page?.replace(/_/g, ' ')}</span></div>
              <div className="flex items-center gap-2"><span className="text-surface-500 w-12">User</span><span className="text-white font-medium">{getUserLabel(clickEvents[hoveredIdx])}</span></div>
              <div className="flex items-center gap-2"><span className="text-surface-500 w-12">Time</span><span className="text-white font-medium">{clickEvents[hoveredIdx].timestamp ? new Date(clickEvents[hoveredIdx].timestamp).toLocaleTimeString() : 'N/A'}</span></div>
              <div className="flex items-center gap-2"><span className="text-surface-500 w-12">Coords</span><span className="text-white font-mono">({Math.round(clickEvents[hoveredIdx].x || 0)}, {Math.round(clickEvents[hoveredIdx].y || 0)})</span></div>
            </div>
            <div className="absolute left-1/2 -bottom-1.5 -translate-x-1/2 w-3 h-3 bg-surface-900 rotate-45" />
          </div>
        </div>
      )}

      {/* Heatmap legend */}
      {mode === 'heatmap' && (
        <div className="absolute bottom-4 left-4 bg-white/95 backdrop-blur border border-surface-200 p-3 rounded-xl flex flex-col gap-2 shadow-lg z-20">
          <div className="flex items-center gap-2 text-[10px] uppercase tracking-widest text-surface-500 font-semibold"><Thermometer className="w-3 h-3" /> Intensity</div>
          <div className="flex items-center gap-2"><div className="w-3 h-3 rounded-full" style={{ background: 'rgba(40,120,190,0.6)', border: '1px solid rgba(40,120,190,0.8)' }} /><span className="text-[10px] text-surface-500">Low</span></div>
          <div className="flex items-center gap-2"><div className="w-3 h-3 rounded-full" style={{ background: 'rgba(255,200,40,0.7)', border: '1px solid rgba(255,200,40,0.9)' }} /><span className="text-[10px] text-surface-500">Medium</span></div>
          <div className="flex items-center gap-2"><div className="w-3 h-3 rounded-full" style={{ background: 'rgba(255,60,20,0.85)', border: '1px solid rgba(255,60,20,0.95)' }} /><span className="text-[10px] text-surface-500">High</span></div>
        </div>
      )}

      {!loading && clickEvents.length === 0 && selectedPage !== 'all' && (
        <div className="absolute inset-0 flex flex-col items-center justify-center text-surface-400 bg-white/80 z-20 p-6 pointer-events-none">
          {mode === 'heatmap' ? <Thermometer className="w-12 h-12 mb-4 opacity-30" /> : <MousePointer2 className="w-12 h-12 mb-4 opacity-30" />}
          <p className="text-xl font-semibold text-surface-600">No {mode === 'heatmap' ? 'heatmap' : 'click'} data for this page yet</p>
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

/* ─── Main page ─── */
export default function ClickAnalytics() {
  const { normalizedEvents, loading, loadingPreview, fetchData, sourceStatus, users, pages, pageTotals } = useHeatmapData();
  const [selectedPage, setSelectedPage] = useState('all');
  const [selectedUser, setSelectedUser] = useState('all');
  const [mode, setMode] = useState('heatmap');
  const [expanded, setExpanded] = useState(false);

  const filteredEvents = useMemo(() => {
    let events = normalizedEvents;
    if (selectedUser !== 'all') events = events.filter(e => getUserLabel(e) === selectedUser);
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
          <h1 className="text-2xl font-bold text-surface-900">Click Analytics</h1>
          <p className="text-surface-500 mt-1 text-sm">Heat density and individual click positions across platform pages</p>
        </div>
        <div className="flex items-center gap-3">
          {/* Mode toggle */}
          <div className="flex bg-surface-100 rounded-xl p-1 border border-surface-200">
            <button
              onClick={() => setMode('heatmap')}
              className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-bold uppercase tracking-wider transition-all ${mode === 'heatmap' ? 'bg-white text-primary-600 shadow-sm' : 'text-surface-400 hover:text-surface-600'}`}
            >
              <Thermometer className="w-3.5 h-3.5" /> Heatmap
            </button>
            <button
              onClick={() => setMode('scatter')}
              className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-bold uppercase tracking-wider transition-all ${mode === 'scatter' ? 'bg-white text-primary-600 shadow-sm' : 'text-surface-400 hover:text-surface-600'}`}
            >
              <Map className="w-3.5 h-3.5" /> Scatter
            </button>
          </div>
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
            <h3 className="font-bold text-surface-900 mb-4 flex items-center gap-2"><Filter className="w-4 h-4 text-primary-500" /> Filters</h3>
            <div className="space-y-4">
              <div>
                <label className="text-[10px] font-bold text-surface-400 uppercase tracking-widest mb-2 block">Target User</label>
                <select value={selectedUser} onChange={e => setSelectedUser(e.target.value)}
                  className="w-full bg-surface-50 border border-surface-200 rounded-xl p-3 text-sm text-surface-900 focus:border-primary-500 outline-none">
                  <option value="all">All Users ({users.length})</option>
                  {users.map(u => <option key={u.label} value={u.label}>{u.label.length > 35 ? u.label.slice(0, 20) + '...' + u.label.slice(-10) : u.label}</option>)}
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
            <h3 className="font-bold text-surface-900 mb-4 flex items-center gap-2"><Layers className="w-4 h-4 text-amber-500" /> Stats</h3>
            <div className="space-y-4">
              <div className="flex items-center justify-between"><span className="text-sm text-surface-500">Total Points</span><span className="text-sm font-bold text-surface-900 font-mono">{clickEvents.length}</span></div>
              <div className="flex items-center justify-between"><span className="text-sm text-surface-500">Unique Users</span><span className="text-sm font-bold text-surface-900 font-mono">{new Set(clickEvents.map(c => c.userId)).size}</span></div>
              <div className="flex items-center justify-between"><span className="text-sm text-surface-500">Density</span><span className="text-sm font-bold text-accent-600 font-mono">{clickEvents.length > 0 ? (clickEvents.length / (pages.length || 1)).toFixed(1) : 0}</span></div>
              <div className="rounded-xl bg-surface-50 border border-surface-100 p-4">
                <div className="flex items-center justify-between mb-2"><span className="text-xs uppercase tracking-widest text-surface-400">Top Pages</span><span className="text-xs text-surface-400">{selectedPage === 'all' ? 'all' : selectedPage}</span></div>
                <div className="grid grid-cols-2 gap-2 text-xs">
                  {pages.slice(0, 6).map(page => (
                    <div key={page} className="rounded-lg bg-white border border-surface-100 p-2">
                      <span className="block text-surface-600 truncate">{page.replace(/_/g, ' ')}</span>
                      <span className="font-bold text-surface-900">{pageTotals[page] || 0}</span>
                    </div>
                  ))}
                  {pages.length > 6 && <div className="col-span-2 rounded-lg bg-white border border-surface-100 p-2 text-surface-400 text-[10px]">+{pages.length - 6} more pages</div>}
                </div>
              </div>
            </div>
          </div>

          <div className="bg-white border border-surface-100 rounded-2xl p-6 shadow-card">
            <h3 className="font-bold text-surface-900 mb-4 flex items-center gap-2"><Users className="w-4 h-4 text-blue-500" /> Legend</h3>
            {mode === 'heatmap' ? (
              <>
                <div className="flex items-center gap-2 mb-2"><div className="w-3 h-3 rounded-full" style={{ background: 'rgba(40,120,190,0.6)', border: '1px solid rgba(40,120,190,0.8)' }} /><span className="text-[11px] text-surface-500">Low density</span></div>
                <div className="flex items-center gap-2 mb-2"><div className="w-3 h-3 rounded-full" style={{ background: 'rgba(255,200,40,0.7)', border: '1px solid rgba(255,200,40,0.9)' }} /><span className="text-[11px] text-surface-500">Medium density</span></div>
                <div className="flex items-center gap-2"><div className="w-3 h-3 rounded-full" style={{ background: 'rgba(255,60,20,0.85)', border: '1px solid rgba(255,60,20,0.95)' }} /><span className="text-[11px] text-surface-500">High density</span></div>
              </>
            ) : (
              <>
                <div className="flex items-center gap-2 mb-2"><div className="w-3 h-3 rounded-full bg-red-500 opacity-85" /><span className="text-[11px] text-surface-500">Each dot = one click</span></div>
                <div className="flex items-center gap-2"><div className="w-3 h-3 rounded-full bg-red-500 opacity-85" style={{ boxShadow: '0 0 6px rgba(185,28,28,0.4)' }} /><span className="text-[11px] text-surface-500">Hover for details</span></div>
              </>
            )}
          </div>
        </div>

        <div className="lg:col-span-3">
          <AnalyticsPreview selectedPage={selectedPage} clickEvents={clickEvents} loading={loadingPreview} mode={mode}
            previewUser={selectedUser === 'all' ? 'Admin Preview' : selectedUser} />
          {!loading && (
            <div className="mt-3 flex flex-wrap gap-2 text-[10px] font-bold uppercase tracking-widest text-surface-400">
              <span className={`px-2 py-1 rounded-lg border ${sourceStatus.engine === 'ok' ? 'bg-accent-50 text-accent-700 border-accent-100' : 'bg-amber-50 text-amber-700 border-amber-100'}`}>Engine: {sourceStatus.engine}</span>
              <span className={`px-2 py-1 rounded-lg border ${sourceStatus.backend === 'ok' ? 'bg-accent-50 text-accent-700 border-accent-100' : 'bg-amber-50 text-amber-700 border-amber-100'}`}>Mongo: {sourceStatus.backend}</span>
            </div>
          )}
        </div>
      </div>

      {expanded && (
        <div className="fixed inset-0 z-50 bg-black/50 backdrop-blur-sm p-6 overflow-auto">
          <div className="relative mx-auto max-w-[1500px] bg-white rounded-2xl p-6 shadow-elevated border border-surface-200">
            <div className="flex items-center justify-between gap-4 mb-6">
              <div>
                <h2 className="text-2xl font-bold text-surface-900">Expanded {mode === 'heatmap' ? 'Heatmap' : 'Scatter'} Preview</h2>
                <p className="text-sm text-surface-500">Full-size viewport for inspecting interaction data.</p>
              </div>
              <button onClick={() => setExpanded(false)} className="inline-flex items-center gap-2 rounded-xl border border-surface-200 bg-white px-4 py-2 text-sm text-surface-600 hover:bg-surface-50 transition font-medium">Close</button>
            </div>
            <AnalyticsPreview selectedPage={selectedPage} clickEvents={clickEvents} loading={loadingPreview} mode={mode} isExpanded={true}
              previewUser={selectedUser === 'all' ? 'Admin Preview' : selectedUser} />
          </div>
        </div>
      )}
    </div>
  );
}
