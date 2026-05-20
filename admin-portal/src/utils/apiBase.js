const normalizeUrl = (url) => String(url || '').replace(/\/+$|\s+/g, '').replace(/\/+$/, '');

export const ENGINE_API_HOST = (() => {
  const envUrl = import.meta.env.VITE_ENGINE_URL;
  if (envUrl) return normalizeUrl(envUrl);
  const protocol = window.location.protocol || 'http:';
  const hostname = window.location.hostname || 'localhost';
  return `${protocol}//${hostname}:8000`;
})();

export const BACKEND_API_HOST = (() => {
  const envUrl = import.meta.env.VITE_BACKEND_URL;
  if (envUrl) return normalizeUrl(envUrl);
  const protocol = window.location.protocol || 'http:';
  const hostname = window.location.hostname || 'localhost';
  return `${protocol}//${hostname}:5000`;
})();

export const engineApi = (path) => {
  const normalizedPath = path?.startsWith('/') ? path : `/${path}`;
  return `${ENGINE_API_HOST}${normalizedPath}`;
};

export const backendApi = (path) => {
  const normalizedPath = path?.startsWith('/') ? path : `/${path}`;
  return `${BACKEND_API_HOST}${normalizedPath}`;
};
