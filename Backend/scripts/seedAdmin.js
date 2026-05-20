/**
 * ============================================================
 * FinovaWealth — Admin Seed Script
 * File: scripts/seedAdmin.js
 * ============================================================
 * Run: node scripts/seedAdmin.js
 * Creates a default admin user if one doesn't already exist.
 * ============================================================
 */

require("dotenv").config();
const mongoose = require("mongoose");
const dns = require("dns");

// Fix DNS resolution
dns.setDefaultResultOrder("ipv4first");

const User = require("../models/User");

const ADMIN_DATA = {
  fullName: "Finova Admin",
  email: "admin@finovawealth.com",
  passwordHash: "Admin@2026",   // Will be hashed by the pre-save hook
  role: "admin",
  authProvider: "email",
  isVerified: true,
};

async function seedAdmin() {
  try {
    console.log("🔌  Connecting to MongoDB…");
    await mongoose.connect(process.env.MONGO_URI, {
      family: 4,
      serverSelectionTimeoutMS: 10000,
    });
    console.log("✅  Connected to MongoDB");

    const existing = await User.findOne({ email: ADMIN_DATA.email });
    if (existing) {
      if (existing.role !== "admin") {
        existing.role = "admin";
        await existing.save();
        console.log(`🔄  Updated existing user '${ADMIN_DATA.email}' to admin role.`);
      } else {
        console.log(`ℹ️   Admin user '${ADMIN_DATA.email}' already exists. Skipping.`);
      }
    } else {
      await User.create(ADMIN_DATA);
      console.log(`✅  Admin user created:`);
      console.log(`    Email:    ${ADMIN_DATA.email}`);
      console.log(`    Password: Admin@2026`);
    }

    await mongoose.connection.close();
    console.log("💤  Done. MongoDB connection closed.");
    process.exit(0);
  } catch (error) {
    console.error("❌  Seed error:", error.message);
    process.exit(1);
  }
}

seedAdmin();
