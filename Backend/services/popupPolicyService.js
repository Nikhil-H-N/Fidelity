const PopupPolicy = require("../models/PopupPolicy");

const DEFAULT_POLICY = {
  maxPopupsPerSession: 3,
  fatigueSuppressionMinutes: 30,
  dismissalCooldownMinutes: 15,
  consecutiveDismissalsLimit: 3,
  highFatigueThreshold: 0.9,
  mediumFatigueThreshold: 0.7,
  priorityIntervalsSeconds: {
    CRITICAL: 0,
    HIGH: 20,
    MEDIUM: 45,
    LOW: 90,
  },
  triggerCooldownMinutes: {
    form_abandon_nudge: 10,
    checkout_recovery: 10,
    likely_converter: 30,
    high_intent_abandoner: 45,
    comparison_without_conversion: 30,
    default: 60,
  },
};

let cachedPolicy = null;
let cachedAt = 0;
const CACHE_MS = 5000;

const clampNumber = (value, fallback, min, max) => {
  const number = Number(value);
  if (!Number.isFinite(number)) return fallback;
  return Math.min(max, Math.max(min, number));
};

const sanitizePolicy = (input = {}) => ({
  maxPopupsPerSession: clampNumber(input.maxPopupsPerSession, DEFAULT_POLICY.maxPopupsPerSession, 1, 20),
  fatigueSuppressionMinutes: clampNumber(input.fatigueSuppressionMinutes, DEFAULT_POLICY.fatigueSuppressionMinutes, 1, 1440),
  dismissalCooldownMinutes: clampNumber(input.dismissalCooldownMinutes, DEFAULT_POLICY.dismissalCooldownMinutes, 1, 1440),
  consecutiveDismissalsLimit: clampNumber(input.consecutiveDismissalsLimit, DEFAULT_POLICY.consecutiveDismissalsLimit, 1, 20),
  highFatigueThreshold: clampNumber(input.highFatigueThreshold, DEFAULT_POLICY.highFatigueThreshold, 0, 1),
  mediumFatigueThreshold: clampNumber(input.mediumFatigueThreshold, DEFAULT_POLICY.mediumFatigueThreshold, 0, 1),
  priorityIntervalsSeconds: {
    CRITICAL: clampNumber(input.priorityIntervalsSeconds?.CRITICAL, DEFAULT_POLICY.priorityIntervalsSeconds.CRITICAL, 0, 86400),
    HIGH: clampNumber(input.priorityIntervalsSeconds?.HIGH, DEFAULT_POLICY.priorityIntervalsSeconds.HIGH, 0, 86400),
    MEDIUM: clampNumber(input.priorityIntervalsSeconds?.MEDIUM, DEFAULT_POLICY.priorityIntervalsSeconds.MEDIUM, 0, 86400),
    LOW: clampNumber(input.priorityIntervalsSeconds?.LOW, DEFAULT_POLICY.priorityIntervalsSeconds.LOW, 0, 86400),
  },
  triggerCooldownMinutes: {
    form_abandon_nudge: clampNumber(input.triggerCooldownMinutes?.form_abandon_nudge, DEFAULT_POLICY.triggerCooldownMinutes.form_abandon_nudge, 0, 10080),
    checkout_recovery: clampNumber(input.triggerCooldownMinutes?.checkout_recovery, DEFAULT_POLICY.triggerCooldownMinutes.checkout_recovery, 0, 10080),
    likely_converter: clampNumber(input.triggerCooldownMinutes?.likely_converter, DEFAULT_POLICY.triggerCooldownMinutes.likely_converter, 0, 10080),
    high_intent_abandoner: clampNumber(input.triggerCooldownMinutes?.high_intent_abandoner, DEFAULT_POLICY.triggerCooldownMinutes.high_intent_abandoner, 0, 10080),
    comparison_without_conversion: clampNumber(input.triggerCooldownMinutes?.comparison_without_conversion, DEFAULT_POLICY.triggerCooldownMinutes.comparison_without_conversion, 0, 10080),
    default: clampNumber(input.triggerCooldownMinutes?.default, DEFAULT_POLICY.triggerCooldownMinutes.default, 0, 10080),
  },
});

async function getPopupPolicy({ force = false } = {}) {
  if (!force && cachedPolicy && Date.now() - cachedAt < CACHE_MS) return cachedPolicy;

  try {
    const policy = await PopupPolicy.findOneAndUpdate(
      { singletonKey: "global" },
      { $setOnInsert: { singletonKey: "global", ...DEFAULT_POLICY } },
      { upsert: true, returnDocument: "after", setDefaultsOnInsert: true, lean: true }
    );
    cachedPolicy = sanitizePolicy(policy || DEFAULT_POLICY);
  } catch (error) {
    console.warn(`Popup policy unavailable, using defaults: ${error.message}`);
    cachedPolicy = DEFAULT_POLICY;
  }

  cachedAt = Date.now();
  return cachedPolicy;
}

async function updatePopupPolicy(input) {
  const nextPolicy = sanitizePolicy(input);
  const policy = await PopupPolicy.findOneAndUpdate(
    { singletonKey: "global" },
    { $set: { singletonKey: "global", ...nextPolicy } },
    { upsert: true, returnDocument: "after", setDefaultsOnInsert: true, lean: true }
  );
  cachedPolicy = sanitizePolicy(policy);
  cachedAt = Date.now();
  return cachedPolicy;
}

module.exports = {
  DEFAULT_POLICY,
  getPopupPolicy,
  updatePopupPolicy,
};
