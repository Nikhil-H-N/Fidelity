/**
 * ============================================================
 * FinovaWealth — Popup Orchestrator
 * File: services/popupOrchestrator.js
 * ============================================================
 * Manages popup queue, priority, cooldown, and delivery
 * via Socket.IO with fatigue-aware scheduling.
 * ============================================================
 */

const { getIO } = require("./socketService");
const { shouldShowPopup, recordShown, PRIORITY } = require("./fatigueEngine");
const { getPopupPolicy } = require("./popupPolicyService");

// In-memory popup queue per user
const popupQueues = new Map();

const sessionPopupCounts = new Map();

const popupLastActive = new Map();
const POPUP_TTL_MS = 30 * 60 * 1000;
const CLEANUP_INTERVAL_MS = 5 * 60 * 1000;

setInterval(() => {
  const now = Date.now();
  for (const [userId, lastActive] of popupLastActive) {
    if (now - lastActive > POPUP_TTL_MS) {
      popupQueues.delete(userId);
      sessionPopupCounts.delete(userId);
      popupLastActive.delete(userId);
    }
  }
}, CLEANUP_INTERVAL_MS);

function touchLastActive(userId) {
  popupLastActive.set(userId, Date.now());
}

/**
 * Enqueue a popup for delivery.
 * @param {string} userId
 * @param {Object} popup - { title, message, priority, triggerType, triggerReason, cta, ctaLink }
 */
async function enqueue(userId, popup) {
  touchLastActive(userId);
  const priority = popup.priority || "MEDIUM";
  const policy = await getPopupPolicy();

  // Check session popup limit
  const count = sessionPopupCounts.get(userId) || 0;
  if (count >= policy.maxPopupsPerSession && priority !== "CRITICAL") {
    console.log(`[Orchestrator] User ${userId} reached max popups (${policy.maxPopupsPerSession})`);
    return false;
  }

  // Check fatigue
  const fatigueCheck = await shouldShowPopup(userId, priority);
  if (!fatigueCheck.allowed) {
    console.log(`[Orchestrator] Popup suppressed for ${userId}: ${fatigueCheck.reason}`);
    return false;
  }

  // Add to queue
  if (!popupQueues.has(userId)) {
    popupQueues.set(userId, []);
  }
  popupQueues.get(userId).push({
    ...popup,
    enqueuedAt: Date.now(),
  });

  // Sort by priority (highest first)
  popupQueues.get(userId).sort(
    (a, b) => (PRIORITY[b.priority] || 0) - (PRIORITY[a.priority] || 0)
  );

  // Try to deliver
  await deliverNext(userId);
  return true;
}

/**
 * Deliver the next popup in the user's queue.
 */
async function deliverNext(userId) {
  touchLastActive(userId);
  const queue = popupQueues.get(userId);
  if (!queue || queue.length === 0) return;

  const popup = queue.shift();

  try {
    const io = getIO();
    const notificationData = {
      id: `popup_${Date.now()}_${Math.random().toString(36).slice(2, 8)}`,
      title: popup.title,
      message: popup.message,
      type: popup.triggerType || "nudge",
      triggerReason: popup.triggerReason,
      priority: popup.priority,
      cta: popup.cta,
      ctaLink: popup.ctaLink,
      mongoUserId: String(userId),
      timestamp: Date.now(),
    };

    io.to(`user:${userId}`).emit("notification", notificationData);
    if (popup.guestId) {
      io.to(`guest:${popup.guestId}`).emit("notification", notificationData);
    }

    // Track
    await recordShown(userId);
    sessionPopupCounts.set(userId, (sessionPopupCounts.get(userId) || 0) + 1);

    // Notify admin
    io.to("admin").emit("popup_event", {
      type: "shown",
      userId,
      ...notificationData,
    });

    console.log(`[Orchestrator] Delivered popup to ${userId}: "${popup.title}"`);
  } catch (err) {
    console.error(`[Orchestrator] Delivery failed for ${userId}:`, err.message);
  }
}

/**
 * Reset session popup count (call on new session).
 */
function resetSession(userId) {
  sessionPopupCounts.delete(userId);
  popupQueues.delete(userId);
  popupLastActive.delete(userId);
}

module.exports = { enqueue, resetSession };
