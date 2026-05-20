/**
 * ============================================================
 * FinovaWealth — User Model
 * File: models/User.js
 * ============================================================
 */

const mongoose = require("mongoose");
const bcrypt = require("bcryptjs");

const SALT_ROUNDS = 12;

const userSchema = new mongoose.Schema(
  {
    /* ── Identity ─────────────────────────────────────────── */
    fullName: {
      type: String,
      required: [true, "Full name is required"],
      trim: true,
      minlength: [2, "Name must be at least 2 characters"],
      maxlength: [100, "Name must not exceed 100 characters"],
    },

    email: {
      type: String,
      required: [true, "Email is required"],
      unique: true,
      lowercase: true,
      trim: true,
      match: [
        /^[a-zA-Z0-9._%+-]+@[a-zA-Z0-9.-]+\.[a-zA-Z]{2,}$/,
        "Enter a valid email address",
      ],
    },

    phone: {
      type: String,
      trim: true,
      default: null,
    },

    /* ── Authentication ───────────────────────────────────── */
    passwordHash: {
      type: String,
      select: false,
    },

    googleId: {
      type: String,
      sparse: true,
      default: null,
    },

    authProvider: {
      type: String,
      enum: ["email", "google"],
      default: "email",
    },

    role: {
      type: String,
      enum: ["user", "admin", "advisor"],
      default: "user",
    },

    /* ── Signup OTP Verification ───────────────────────────── */
    isVerified: {
      type: Boolean,
      default: false,
    },

    otp: {
      type: String,
      select: false,
    },

    otpExpires: {
      type: Date,
      select: false,
    },

    /* ── Password Reset OTP ───────────────────────────────── */
    resetOtp: {
      type: String,
      select: false,
    },

    resetOtpExpires: {
      type: Date,
      select: false,
    },

    /* ── FinovaWealth Investment Profile ──────────────────── */
    riskProfile: {
      type: String,
      enum: ["conservative", "moderate", "aggressive", null],
      default: null,
    },

    investmentGoals: {
      type: [String],
      default: [],
    },

    monthlyInvestment: {
      type: Number,
      min: [0, "Monthly investment cannot be negative"],
      default: 0,
    },

    preferredInvestments: {
      type: [String],
      default: [],
    },

    intentScore: {
      type: Number,
      min: 0,
      max: 100,
      default: 0,
    },
  },
  {
    timestamps: true,
    toJSON: { virtuals: true },
    toObject: { virtuals: true },
  }
);

/* ── Indexes ──────────────────────────────────────────────── */
userSchema.index({ authProvider: 1 });
userSchema.index({ createdAt: -1 });

/* ── Pre-save hook: hash password ─────────────────────────── *
 * IMPORTANT: Mongoose 7+ does NOT pass `next` to async hooks.
 * Simply return / throw — Mongoose awaits the promise.          */
userSchema.pre("save", async function () {
  if (!this.isModified("passwordHash")) return;
  if (!this.passwordHash) return;
  this.passwordHash = await bcrypt.hash(this.passwordHash, SALT_ROUNDS);
});

/* ── Instance method: compare password ────────────────────── */
userSchema.methods.comparePassword = async function (candidatePassword) {
  if (!this.passwordHash) return false;
  return bcrypt.compare(candidatePassword, this.passwordHash);
};

/* ── Static: find by email with sensitive fields ──────────── */
userSchema.statics.findByEmailWithPassword = function (email) {
  return this.findOne({ email }).select(
    "+passwordHash +otp +otpExpires +resetOtp +resetOtpExpires"
  );
};

const User = mongoose.model("User", userSchema);

module.exports = User;
