const AUTH_KEYS = [
  'fw_token',
  'fw_user',
];

const TRACKING_LOCAL_KEYS = [
  'fw_guestId',
  'fw_lastInteractionContext',
  'fw_interactionHistory',
  'fw_lastActivityAt',
];

const TRACKING_SESSION_KEYS = [
  'fw_sessionId',
  'fw_sessionStartedAt',
  'fw_interactionCount',
  'fw_pageCount',
  'fw_bounceSent',
  'fw_returnVisitSent',
];

export const clearAuthIdentity = () => {
  AUTH_KEYS.forEach((key) => localStorage.removeItem(key));
};

export const resetTrackingIdentity = () => {
  AUTH_KEYS.forEach((key) => localStorage.removeItem(key));
  TRACKING_LOCAL_KEYS.forEach((key) => localStorage.removeItem(key));
  TRACKING_SESSION_KEYS.forEach((key) => sessionStorage.removeItem(key));
};
