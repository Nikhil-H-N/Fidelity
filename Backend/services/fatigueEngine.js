/**
 * ============================================================
 * FinovaWealth — Fatigue Engine
 * File: services/fatigueEngine.js
 * ============================================================
 * Tracks popup interactions and adapts delivery frequency
 * to avoid annoying users.
 * ============================================================
 */

const FatigueState = require("../models/FatigueState");
const { getPopupPolicy } = require("./popupPolicyService");

const PRIORITY = { CRITICAL: 4, HIGH: 3, MEDIUM: 2, LOW: 1 };

/**
 * Get or create fatigue state for a user.
 */
async function getFatigueState(userId) {
  let state = await FatigueState.findOne({ userId });
  if (!state) {
    state = await FatigueState.create({ userId });
  }
  return state;
}

/**
 * Check if a popup should be shown to the user.
 * @param {string} userId
 * @param {string} priority - "CRITICAL" | "HIGH" | "MEDIUM" | "LOW"
 * @returns {{ allowed: boolean, reason: string }}
 */
async function shouldShowPopup(userId, priority = "MEDIUM") {
  const state = await getFatigueState(userId);
  const policy = await getPopupPolicy();
  const now = new Date();

  // Check if currently suppressed
  if (state.suppressedUntil && now < state.suppressedUntil) {
    return {
      allowed: false,
      reason: `Suppressed until ${state.suppressedUntil.toISOString()}`,
    };
  }

  // CRITICAL popups always go through (abandonment recovery)
  if (priority === "CRITICAL") {
    return { allowed: true, reason: "Critical priority bypasses fatigue" };
  }

  // High fatigue — suppress non-critical
  if (state.fatigueScore > policy.highFatigueThreshold) {
    state.suppressedUntil = new Date(now.getTime() + policy.fatigueSuppressionMinutes * 60 * 1000);
    await state.save();
    return {
      allowed: false,
      reason: `Fatigue score ${state.fatigueScore.toFixed(2)} > ${policy.highFatigueThreshold}, suppressed for ${policy.fatigueSuppressionMinutes} min`,
    };
  }

  // Medium-high fatigue — suppress low priority
  if (state.fatigueScore > policy.mediumFatigueThreshold && priority === "LOW") {
    return {
      allowed: false,
      reason: `Fatigue score ${state.fatigueScore.toFixed(2)} > ${policy.mediumFatigueThreshold}, low priority suppressed`,
    };
  }

  // Consecutive dismissals — cooldown
  if (state.consecutiveDismissals >= policy.consecutiveDismissalsLimit) {
    const cooldownEnd = new Date(
      (state.lastDismissedAt?.getTime() || now.getTime()) + policy.dismissalCooldownMinutes * 60 * 1000
    );
    if (now < cooldownEnd) {
      return {
        allowed: false,
        reason: `${state.consecutiveDismissals} consecutive dismissals, cooldown until ${cooldownEnd.toISOString()}`,
      };
    }
    // Reset consecutive dismissals after cooldown
    state.consecutiveDismissals = 0;
    await state.save();
  }

  // Minimum interval between popups, configurable per priority
  if (state.lastShownAt) {
    const timeSinceLastShown = now.getTime() - state.lastShownAt.getTime();
    const minIntervalMs = (policy.priorityIntervalsSeconds?.[priority] ?? policy.priorityIntervalsSeconds?.MEDIUM ?? 30) * 1000;
    if (timeSinceLastShown < minIntervalMs) {
      return {
        allowed: false,
        reason: `Only ${Math.round(timeSinceLastShown / 1000)}s since last popup (min ${Math.round(minIntervalMs / 1000)}s for ${priority})`,
      };
    }
  }

  return { allowed: true, reason: "Passed fatigue checks" };
}

/**
 * Record that a popup was shown to the user.
 */
async function recordShown(userId) {
  const state = await getFatigueState(userId);
  state.shownCount += 1;
  state.lastShownAt = new Date();
  state.fatigueScore = state.dismissedCount / Math.max(state.shownCount, 1);
  await state.save();
}

/**
 * Record that a popup was dismissed by the user.
 */
async function recordDismissed(userId) {
  const state = await getFatigueState(userId);
  state.dismissedCount += 1;
  state.consecutiveDismissals += 1;
  state.lastDismissedAt = new Date();
  state.fatigueScore = state.dismissedCount / Math.max(state.shownCount, 1);
  await state.save();
}

/**
 * Record that a popup was clicked by the user.
 */
async function recordClicked(userId) {
  const state = await getFatigueState(userId);
  state.clickedCount += 1;
  state.consecutiveDismissals = 0; // Reset on positive interaction
  state.fatigueScore = state.dismissedCount / Math.max(state.shownCount, 1);
  await state.save();
}

module.exports = {
  shouldShowPopup,
  recordShown,
  recordDismissed,
  recordClicked,
  getFatigueState,
  PRIORITY,
};
