/**
 * ============================================================
 * FinovaWealth — Core Tracking Engine
 * File: Frontend/src/utils/tracker.js
 * ============================================================
 * Lightweight utilities for device detection, session management,
 * and behavioral event enrichment.
 * ============================================================
 */

/**
 * Detect device type from user agent.
 * @returns {"mobile"|"tablet"|"desktop"}
 */
export const getDeviceType = () => {
  const ua = navigator.userAgent;
  if (/tablet|ipad|playbook|silk/i.test(ua)) return 'tablet';
  if (/mobile|iphone|ipod|android|blackberry|opera mini|iemobile/i.test(ua)) return 'mobile';
  return 'desktop';
};

/**
 * Detect browser name and version.
 * @returns {string}
 */
export const getBrowserInfo = () => {
  const ua = navigator.userAgent;
  if (ua.includes('Firefox/')) return `Firefox ${ua.split('Firefox/')[1]?.split(' ')[0]}`;
  if (ua.includes('Edg/')) return `Edge ${ua.split('Edg/')[1]?.split(' ')[0]}`;
  if (ua.includes('Chrome/')) return `Chrome ${ua.split('Chrome/')[1]?.split(' ')[0]}`;
  if (ua.includes('Safari/') && !ua.includes('Chrome')) return `Safari ${ua.split('Version/')[1]?.split(' ')[0]}`;
  return 'Unknown';
};

/**
 * Calculate form completion percentage.
 * @param {Object} formData — current form state
 * @param {string[]} requiredFields — list of required field names
 * @returns {number} 0-100
 */
export const calculateFormCompletion = (formData, requiredFields) => {
  if (!requiredFields || requiredFields.length === 0) return 0;
  const filled = requiredFields.filter((f) => {
    const val = formData[f];
    if (typeof val === 'boolean') return val;
    if (typeof val === 'number') return val > 0;
    return val && String(val).trim().length > 0;
  });
  return Math.round((filled.length / requiredFields.length) * 100);
};

/**
 * Get list of filled fields from form data.
 * @param {Object} formData
 * @returns {string[]}
 */
export const getFilledFields = (formData) => {
  return Object.entries(formData)
    .filter(([, val]) => {
      if (typeof val === 'boolean') return val;
      if (typeof val === 'number') return val > 0;
      return val && String(val).trim().length > 0;
    })
    .map(([key]) => key);
};

/**
 * Format seconds into human-readable duration.
 * @param {number} seconds
 * @returns {string}
 */
export const formatDuration = (seconds) => {
  if (seconds < 60) return `${seconds}s`;
  const m = Math.floor(seconds / 60);
  const s = seconds % 60;
  return `${m}m ${s.toString().padStart(2, '0')}s`;
};

/**
 * Debounce utility for field-level tracking.
 * @param {Function} fn
 * @param {number} delay
 * @returns {Function}
 */
export const debounce = (fn, delay = 500) => {
  let timer;
  return (...args) => {
    clearTimeout(timer);
    timer = setTimeout(() => fn(...args), delay);
  };
};

/**
 * PAN validation (Indian format).
 * @param {string} pan
 * @returns {boolean}
 */
export const validatePAN = (pan) => /^[A-Z]{5}[0-9]{4}[A-Z]{1}$/.test(pan?.toUpperCase());

/**
 * UPI ID validation.
 * @param {string} upi
 * @returns {boolean}
 */
export const validateUPI = (upi) => /^[a-zA-Z0-9._-]+@[a-zA-Z0-9]+$/.test(upi);

/**
 * Phone validation (Indian).
 * @param {string} phone
 * @returns {boolean}
 */
export const validatePhone = (phone) => /^[6-9]\d{9}$/.test(phone?.replace(/\D/g, ''));

/**
 * Email validation.
 * @param {string} email
 * @returns {boolean}
 */
export const validateEmail = (email) => /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email);

/**
 * Bank account number validation.
 * @param {string} acc
 * @returns {boolean}
 */
export const validateBankAccount = (acc) => /^\d{9,18}$/.test(acc?.replace(/\s/g, ''));

/**
 * SIP amount calculation utilities.
 */
export const sipCalculator = {
  /**
   * Calculate future value of SIP.
   * @param {number} monthly — monthly SIP amount
   * @param {number} ratePercent — expected annual return %
   * @param {number} years — investment duration
   * @returns {{ totalInvested: number, estimatedReturns: number, totalValue: number }}
   */
  calculate: (monthly, ratePercent, years) => {
    const n = years * 12;
    const r = ratePercent / 100 / 12;
    const totalInvested = monthly * n;
    
    if (r === 0) {
      return { totalInvested, estimatedReturns: 0, totalValue: totalInvested };
    }

    const totalValue = monthly * ((Math.pow(1 + r, n) - 1) / r) * (1 + r);
    const estimatedReturns = totalValue - totalInvested;

    return {
      totalInvested: Math.round(totalInvested),
      estimatedReturns: Math.round(estimatedReturns),
      totalValue: Math.round(totalValue),
    };
  },

  /**
   * Generate monthly projection data for charts.
   * @param {number} monthly
   * @param {number} ratePercent
   * @param {number} years
   * @returns {Array<{ month: number, invested: number, value: number }>}
   */
  getProjectionData: (monthly, ratePercent, years) => {
    const r = ratePercent / 100 / 12;
    const data = [];
    const step = Math.max(1, Math.floor((years * 12) / 12));
    
    for (let m = step; m <= years * 12; m += step) {
      const invested = monthly * m;
      const value = r === 0
        ? invested
        : monthly * ((Math.pow(1 + r, m) - 1) / r) * (1 + r);
      data.push({
        month: m,
        year: `${Math.floor(m / 12)}Y`,
        invested: Math.round(invested),
        value: Math.round(value),
      });
    }
    return data;
  },
};
