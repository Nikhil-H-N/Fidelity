/**
 * ============================================================
 * FinovaWealth — Trigger Model
 * File: models/Trigger.js
 * ============================================================
 * Represents automated triggers fired by the analytics engine
 * when specific behavioural conditions are met (e.g. a user
 * abandons a form, or intent score crosses a threshold).
 *
 * Indexes:
 *   • userId      — triggers for a specific user
 *   • triggerType — filter by trigger category
 *   • status      — filter active / resolved / dismissed
 *   • createdAt   — chronological queries
 * ============================================================
 */

const mongoose = require("mongoose");

const triggerSchema = new mongoose.Schema(
  {
    userId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
      required: [true, "userId is required"],
      index: true,
    },

    triggerType: {
      type: String,
      enum: [
        "form_abandon",
        "high_intent",
        "drop_off",
        "return_visit",
        "inactivity",
        "conversion",
        "custom",
      ],
      required: [true, "triggerType is required"],
      index: true,
    },

    /** Human-readable reason the trigger was fired */
    reason: {
      type: String,
      required: [true, "Trigger reason is required"],
      trim: true,
      maxlength: 500,
    },

    status: {
      type: String,
      enum: ["active", "resolved", "dismissed"],
      default: "active",
      index: true,
    },

    /** JSON condition object for rule engine evaluation */
    triggerCondition: {
      type: mongoose.Schema.Types.Mixed,
      default: null,
    },

    /** Number of matching events required to fire */
    eventThreshold: {
      type: Number,
      default: 1,
    },

    /** Cooldown period in minutes before trigger can fire again */
    cooldown: {
      type: Number,
      default: 60,
    },

    /** Action to take: email, notification, flag, webhook */
    triggerAction: {
      type: String,
      enum: ["email", "in_app", "flag", "webhook", "sms"],
      default: "in_app",
    },

    /** Email template identifier for email actions */
    emailTemplate: {
      type: String,
      trim: true,
      default: null,
    },

    /** Whether this trigger rule is active */
    isActive: {
      type: Boolean,
      default: true,
    },

    /** Last time this trigger fired */
    lastFiredAt: {
      type: Date,
      default: null,
    },
  },
  {
    timestamps: true, // createdAt + updatedAt
  }
);

/* ── Compound Indexes ─────────────────────────────────────── */
triggerSchema.index({ userId: 1, createdAt: -1 });
triggerSchema.index({ triggerType: 1, status: 1 });

const Trigger = mongoose.model("Trigger", triggerSchema);

module.exports = Trigger;
