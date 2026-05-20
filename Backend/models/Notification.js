/**
 * ============================================================
 * FinovaWealth — Notification Model
 * File: models/Notification.js
 * ============================================================
 * Represents notifications dispatched to users (email, push,
 * in-app). Tracks delivery status and engagement (opened,
 * clicked).
 *
 * Indexes:
 *   • userId — fast lookup of a user's notifications
 *   • status — filter by sent / delivered / failed
 *   • sentAt — chronological sorting
 * ============================================================
 */

const mongoose = require("mongoose");

const notificationSchema = new mongoose.Schema(
  {
    userId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
      required: [true, "userId is required"],
      index: true,
    },

    type: {
      type: String,
      enum: ["email", "push", "in_app", "sms"],
      required: [true, "Notification type is required"],
    },

    title: {
      type: String,
      required: [true, "Notification title is required"],
      trim: true,
      maxlength: 200,
    },

    message: {
      type: String,
      required: [true, "Notification message is required"],
      trim: true,
      maxlength: 2000,
    },

    status: {
      type: String,
      enum: ["pending", "sent", "delivered", "failed"],
      default: "pending",
      index: true,
    },

    /** Whether the user opened the notification */
    opened: {
      type: Boolean,
      default: false,
    },

    /** Whether the user clicked through */
    clicked: {
      type: Boolean,
      default: false,
    },

    sentAt: {
      type: Date,
      default: null,
      index: true,
    },

    /** Notification category for behavioral triggers */
    notificationType: {
      type: String,
      enum: ["transactional", "re_engagement", "nudge", "alert", "reminder", "promotional"],
      default: "transactional",
    },

    /** Delivery status tracking */
    deliveryStatus: {
      type: String,
      enum: ["queued", "sending", "delivered", "bounced", "rejected"],
      default: "queued",
    },

    /** Why this notification was triggered */
    triggerReason: {
      type: String,
      trim: true,
      default: null,
    },
  },
  {
    timestamps: true,
  }
);

/* ── Compound Index ───────────────────────────────────────── */
notificationSchema.index({ userId: 1, sentAt: -1 });

const Notification = mongoose.model("Notification", notificationSchema);

module.exports = Notification;
