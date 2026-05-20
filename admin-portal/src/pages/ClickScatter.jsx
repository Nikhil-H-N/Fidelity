import { useState, useEffect, useMemo, useRef } from 'react';
import { RefreshCw, Filter, Layers, Eye, MousePointer2, Users, X } from 'lucide-react';
import useHeatmapData from '../hooks/useHeatmapData';
import { NATIVE_WIDTH, NATIVE_HEIGHT, pageIdToRoute, getHeatmapPoint, getUserLabel } from '../utils/heatmapUtils';

const ScatterOverlay = ({ clickEvents, iframeHeight, scale }) => {
  const [hoveredIdx, setHoveredIdx] = useState(null);
  const [tooltipPos, setTooltipPos] = useState({ x: 0, y: 0 });

  if (clickEvents.length === 0) return null;

  const handleMouseEnter = (idx, e) => {
    const rect = e.currentTarget.getBoundingClientRect();
    setTooltipPos({ x: rect.left + rect.width / 2, y: rect.top - 8 });
    setHoveredIdx(idx);
  };

  return (
    <div className="absolute inset-0 pointer-events-none" style={{ zIndex: 50 }}>
      {clickEvents.map((click, idx) => {
        const point = getHeatmapPoint(click, iframeHeight, { scrollLeft: 0, scrollTop: 0 }, 1);
        const dotSize = Math.max(8, 12 * scale);
        const isHovered = hoveredIdx === idx;

        return (
          <div
            key={`dot-${click.timestamp}-${idx}`}
            className="pointer-events-auto cursor-pointer"
            style={{
              position: 'absolute',
              left: `${point.x}px`,
              top: `${point.y}px`,
              width: `${dotSize}px`,
              height: `${dotSize}px`,
              borderRadius: '50%',
              backgroundColor: isHovered ? 'rgba(239, 68, 68, 1)' : 'rgba(239, 68, 68, 0.8)',
              transform: `translate(-50%, -50%) scale(${isHovered ? 1.8 : 1})`,
              boxShadow: isHovered
                ? `0 0 0 4px rgba(239, 68, 68, 0.3), 0 0 20px rgba(185, 28, 28, 0.5)`
                : `0 0 0 ${Math.max(2, 4 * scale)}px rgba(239, 68, 68, 0.2), 0 0 ${Math.max(8, 14 * scale)}px rgba(185, 28, 28, 0.25)`,
              transition: 'transform 0.15s ease, box-shadow 0.15s ease',
              zIndex: isHovered ? 100 : 10,
            }}
            onMouseEnter={(e) => handleMouseEnter(idx, e)}
            onMouseLeave={() => setHoveredIdx(null)}
          />
        );
      })}

      {hoveredIdx !== null && clickEvents[hoveredIdx] && (
        <div
          className="pointer-events-none fixed z-[9999]"
          style={{
            left: `${tooltipPos.x}px`,
            top: `${tooltipPos.y}px`,
            transform: 'translate(-50%, -100%)',
          }}
        >
          <div className="bg-surface-900 text-white rounded-xl px-4 py-3 shadow-elevated text-xs whitespace-nowrap max-w-xs">
            <div className="font-bold text-sm mb-1.5 text-white">
              {clickEvents[hoveredIdx].element || 'Unknown Element'}
            </div>
            <div className="space-y-1 text-surface-300">
              <div className="flex items-center gap-2">
                <span className="text-surface-500 w-12">Page</span>
                <span className="text-white font-medium">{clickEvents[hoveredIdx].page?.replace(/_/g, ' ')}</span>
              </div>
              <div className="flex items-center gap-2">
                <span className="text-surface-500 w-12">User</span>
                <span className="text-white font-medium">{getUserLabel(clickEvents[hoveredIdx])}</span>
              </div>
              <div className="flex items-center gap-2">
                <span className="text-surface-500 w-12">Time</span>
                <span className="text-white font-medium">
                  {clickEvents[hoveredIdx].timestamp
                    ? new Date(clickEvents[hoveredIdx].timestamp).toLocaleTimeString()
                    : 'N/A'}
                </span>
              </div>
              <div className="flex items-center gap-2">
                <span className="text-surface-500 w-12">Coords</span>
                <span className="text-white font-mono">
                  ({Math.round(clickEvents[hoveredIdx].x || 0)}, {Math.round(clickEvents[hoveredIdx].y || 0)})
                </span>
              </div>
            </div>
            <div className="absolute left-1/2 -bottom-1.5 -translate-x-1/2 w-3 h-3 bg-surface-900 rotate-45" />
          </div>
        </div>
      )}
    </div>
  );
};

const ScatterPreview = ({ selectedPage, clickEvents, loading, isExpanded = false, previewUser = 'Admin Preview' }) => {
  const [scale, setScale] = useState(1);
  const [iframeHeight, setIframeHeight] = useState(NATIVE_HEIGHT);
  const [containerEl, setContainerEl] = useState(null);
  const [scrollEl, setScrollEl] = useState(null);
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

            {/* Dots rendered directly inside the iframe container — bound to preview */}
            <ScatterOverlay clickEvents={clickEvents} iframeHeight={iframeHeight} scale={scale} />
          </div>
        </div>
      </div>

      {!loading && clickEvents.length === 0 && selectedPage !== 'all' && (
        <div className="absolute inset-0 flex flex-col items-center justify-center text-surface-400 bg-white/80 z-20 p-6 pointer-events-none">
          <MousePointer2 className="w-12 h-12 mb-4 opacity-30" />
          <p className="text-xl font-semibold text-surface-600">No clicks on this page yet</p>
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

export default function ClickScatter() {
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
          <h1 className="text-2xl font-bold text-surface-900">Click Scatter</h1>
          <p className="text-surface-500 mt-1 text-sm">Individual click positions across platform pages</p>
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
                <span className="text-sm text-surface-500">Total Clicks</span>
                <span className="text-sm font-bold text-surface-900 font-mono">{clickEvents.length}</span>
              </div>
              <div className="flex items-center justify-between">
                <span className="text-sm text-surface-500">Unique Users</span>
                <span className="text-sm font-bold text-surface-900 font-mono">{new Set(clickEvents.map(c => c.userId)).size}</span>
              </div>
              <div className="flex items-center justify-between">
                <span className="text-sm text-surface-500">Pages</span>
                <span className="text-sm font-bold text-surface-900 font-mono">{pages.length}</span>
              </div>
              <div className="rounded-xl bg-surface-50 border border-surface-100 p-4">
                <div className="flex items-center justify-between mb-2">
                  <span className="text-xs uppercase tracking-widest text-surface-400">Page Distribution</span>
                  <span className="text-xs text-surface-400">Showing {selectedPage === 'all' ? 'all' : selectedPage}</span>
                </div>
                <div className="grid grid-cols-2 gap-2 text-xs">
                  {pages.slice(0, 6).map(page => (
                    <div key={page} className="rounded-lg bg-white border border-surface-100 p-2">
                      <span className="block text-surface-600 truncate">{page.replace(/_/g, ' ')}</span>
                      <span className="font-bold text-surface-900">{pageTotals[page] || 0} clicks</span>
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
              <div className="w-3 h-3 rounded-full bg-red-500 opacity-85" />
              <span className="text-[11px] text-surface-500">Each dot = one click</span>
            </div>
            <div className="flex items-center gap-2">
              <div className="w-3 h-3 rounded-full bg-red-500 opacity-85" style={{ boxShadow: '0 0 6px rgba(185,28,28,0.4)' }} />
              <span className="text-[11px] text-surface-500">Hover for details</span>
            </div>
          </div>
        </div>

        <div className="lg:col-span-3">
          <ScatterPreview selectedPage={selectedPage} clickEvents={clickEvents} loading={loadingPreview}
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
                <h2 className="text-2xl font-bold text-surface-900">Expanded Scatter Preview</h2>
                <p className="text-sm text-surface-500">Full-size viewport for inspecting click positions.</p>
              </div>
              <button onClick={() => setExpanded(false)}
                className="inline-flex items-center gap-2 rounded-xl border border-surface-200 bg-white px-4 py-2 text-sm text-surface-600 hover:bg-surface-50 transition font-medium">
                Close
              </button>
            </div>
            <ScatterPreview selectedPage={selectedPage} clickEvents={clickEvents} loading={loadingPreview}
              isExpanded={true} previewUser={selectedUser === 'all' ? 'Admin Preview' : selectedUser} />
          </div>
        </div>
      )}
    </div>
  );
}
