const mongoose = require("mongoose");

const popupPolicySchema = new mongoose.Schema(
  {
    singletonKey: {
      type: String,
      default: "global",
      unique: true,
      index: true,
    },
    maxPopupsPerSession: { type: Number, default: 3, min: 1, max: 20 },
    fatigueSuppressionMinutes: { type: Number, default: 30, min: 1, max: 1440 },
    dismissalCooldownMinutes: { type: Number, default: 15, min: 1, max: 1440 },
    consecutiveDismissalsLimit: { type: Number, default: 3, min: 1, max: 20 },
    highFatigueThreshold: { type: Number, default: 0.9, min: 0, max: 1 },
    mediumFatigueThreshold: { type: Number, default: 0.7, min: 0, max: 1 },
    priorityIntervalsSeconds: {
      CRITICAL: { type: Number, default: 0, min: 0, max: 86400 },
      HIGH: { type: Number, default: 20, min: 0, max: 86400 },
      MEDIUM: { type: Number, default: 45, min: 0, max: 86400 },
      LOW: { type: Number, default: 90, min: 0, max: 86400 },
    },
    triggerCooldownMinutes: {
      form_abandon_nudge: { type: Number, default: 10, min: 0, max: 10080 },
      checkout_recovery: { type: Number, default: 10, min: 0, max: 10080 },
      likely_converter: { type: Number, default: 30, min: 0, max: 10080 },
      high_intent_abandoner: { type: Number, default: 45, min: 0, max: 10080 },
      comparison_without_conversion: { type: Number, default: 30, min: 0, max: 10080 },
      default: { type: Number, default: 60, min: 0, max: 10080 },
    },
  },
  { timestamps: true }
);

module.exports = mongoose.model("PopupPolicy", popupPolicySchema);
