/**
 * ============================================================
 * FinovaWealth — Session Model
 * File: models/Session.js
 * ============================================================
 * Tracks individual browsing sessions for behavioural
 * analytics. Each session links to a user and captures
 * device, location, conversion, and engagement data.
 *
 * Indexes:
 *   • userId       — fast lookup of a user's sessions
 *   • sessionStart — time-range queries
 *   • status       — filter active / completed / abandoned
 * ============================================================
 */

const mongoose = require("mongoose");

const sessionSchema = new mongoose.Schema(
  {
    userId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
      required: [true, "userId is required"],
      index: true,
    },

    sessionStart: {
      type: Date,
      required: true,
      default: Date.now,
    },

    sessionEnd: {
      type: Date,
      default: null,
    },

    /** Duration in seconds — computed on session close */
    duration: {
      type: Number,
      default: 0,
    },

    /** Ordered list of page paths visited during the session */
    pagesVisited: {
      type: [String],
      default: [],
    },

    device: {
      type: String,
      trim: true,
      default: "unknown",
    },

    browser: {
      type: String,
      trim: true,
      default: "unknown",
    },

    clientIp: {
      type: String,
      trim: true,
      default: null,
    },

    connectionOrigin: {
      type: String,
      enum: ["internal", "external", "remote"],
      default: "external",
    },

    /** Approximate location string, e.g. "Bengaluru, IN" */
    location: {
      type: String,
      trim: true,
      default: "unknown",
    },

    /** True if user left without meaningful interaction */
    bounce: {
      type: Boolean,
      default: false,
    },

    /** True when this browser/user has visited before */
    returningUser: {
      type: Boolean,
      default: false,
    },

    /** True if a key conversion event occurred in the session */
    conversion: {
      type: Boolean,
      default: false,
    },

    status: {
      type: String,
      enum: ["active", "completed", "abandoned"],
      default: "active",
    },

    /** Last user activity timestamp (for inactivity detection) */
    lastActive: {
      type: Date,
      default: Date.now,
    },

    eventCount: {
      type: Number,
      default: 0,
    },

    rapidClickCount: {
      type: Number,
      default: 0,
    },

    inactiveDetected: {
      type: Boolean,
      default: false,
    },

    lastPage: {
      type: String,
      trim: true,
      default: null,
    },

    /** Traffic source: direct, organic, email_campaign, referral */
    entrySource: {
      type: String,
      trim: true,
      default: "direct",
    },

    /** Ordered navigation path with timestamps */
    navigationPath: {
      type: [{
        page: String,
        timestamp: { type: Date, default: Date.now },
        duration: { type: Number, default: 0 },
      }],
      default: [],
    },
  },
  {
    timestamps: true,
  }
);

/* ── Indexes ──────────────────────────────────────────────── */
sessionSchema.index({ sessionStart: -1 });
sessionSchema.index({ status: 1 });
sessionSchema.index({ userId: 1, sessionStart: -1 }); // Compound: user's recent sessions

const Session = mongoose.model("Session", sessionSchema);

module.exports = Session;
