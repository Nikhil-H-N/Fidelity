export const NATIVE_WIDTH = 1440;
export const NATIVE_HEIGHT = 900;

export const pageIdToRoute = (pageId) => {
  if (!pageId || pageId === 'all' || pageId === 'landing') return '';
  const normalized = String(pageId).replace(/^\/+/, '').replace(/_/g, '-');

  if (normalized.startsWith('know-more-')) {
    return normalized.replace(/^know-more-/, 'know-more/');
  }

  if (normalized.startsWith('product-details-')) {
    return normalized.replace(/^product-details-/, 'know-more/');
  }

  if (normalized.startsWith('checkout-')) {
    return normalized.replace(/^checkout-/, 'checkout/');
  }

  return normalized;
};

export const getHeatmapPoint = (click, iframeHeight, viewport = { scrollLeft: 0, scrollTop: 0 }, scale = 1) => {
  const sourceWidth = Number(click.screenWidth || NATIVE_WIDTH);
  const sourcePageHeight = Number(click.pageHeight || click.screenHeight || iframeHeight);
  const widthScale = sourceWidth > 0 ? NATIVE_WIDTH / sourceWidth : 1;
  const isViewportPinned = click.targetPositionMode === 'fixed' || click.targetPositionMode === 'sticky';
  const sourceX = Number(
    isViewportPinned
      ? click.targetCenterClientX ?? click.x ?? click.targetCenterPageX ?? click.pageX ?? 0
      : click.targetCenterPageX ?? click.pageX ?? click.x ?? 0
  );
  const sourceY = Number(
    isViewportPinned
      ? click.targetCenterClientY ?? click.y ?? click.targetCenterPageY ?? click.pageY ?? 0
      : click.targetCenterPageY ?? click.pageY ?? click.y ?? 0
  );
  const nestedScrollLeft = isViewportPinned ? Number(click.targetScrollContainerLeft || 0) : 0;
  const nestedScrollTop = isViewportPinned ? Number(click.targetScrollContainerTop || 0) : 0;
  const scaledPageHeight = sourcePageHeight > 0 ? sourcePageHeight * widthScale : iframeHeight;
  const maxY = Math.max(iframeHeight, scaledPageHeight);
  return {
    x: Math.max(0, Math.min(NATIVE_WIDTH, (sourceX + nestedScrollLeft) * widthScale)),
    y: Math.max(0, Math.min(maxY, (sourceY + nestedScrollTop) * widthScale)),
  };
};

export const getUserLabel = (event) => {
  if (event.isGuest) return `Guest ${String(event.guestId || event.userId).slice(-6)}`;
  return event.userEmail || event.userName || event.userId;
};
