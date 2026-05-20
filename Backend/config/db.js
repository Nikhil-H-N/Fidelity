/**
 * ============================================================
 * FinovaWealth — MongoDB Connection Configuration
 * File: config/db.js
 * ============================================================
 * Establishes a resilient connection to MongoDB Atlas using
 * Mongoose. Includes retry logic and graceful shutdown hooks.
 * ============================================================
 */

const mongoose = require("mongoose");
const dns = require("dns");

// Force Node.js DNS resolver to prefer IPv4 — fixes the common
// "querySrv ECONNREFUSED" error on certain Windows / ISP networks.
dns.setDefaultResultOrder("ipv4first");

const MAX_RETRIES = 3;
const RETRY_DELAY_MS = 3000;

// Non-SRV fallback URI (used when SRV DNS resolution fails).
// Built from the actual shard hostnames of the Atlas cluster.
const buildFallbackUri = () => {
  const primary = process.env.MONGO_URI;
  if (!primary) return null;

  // Extract credentials and DB name from the SRV URI
  const match = primary.match(
    /mongodb\+srv:\/\/([^@]+)@[^/]+\/([^?]+)\??(.*)/
  );
  if (!match) return null;

  const [, credentials, dbName, params] = match;
  const shards = [
    "ac-rnosrti-shard-00-00.f2gv7j5.mongodb.net:27017",
    "ac-rnosrti-shard-00-01.f2gv7j5.mongodb.net:27017",
    "ac-rnosrti-shard-00-02.f2gv7j5.mongodb.net:27017",
  ].join(",");

  return `mongodb://${credentials}@${shards}/${dbName}?ssl=true&authSource=admin&${params}`;
};

const sleep = (ms) => new Promise((resolve) => setTimeout(resolve, ms));

const connectDB = async () => {
  const mongoOptions = {
    autoIndex: process.env.NODE_ENV !== "production",
    serverSelectionTimeoutMS: 10000,   // 10 s instead of default 30 s
    socketTimeoutMS: 45000,
    family: 4,                         // Force IPv4
  };

  for (let attempt = 1; attempt <= MAX_RETRIES; attempt++) {
    try {
      console.log(
        `🔌  MongoDB connection attempt ${attempt}/${MAX_RETRIES}…`
      );

      const conn = await mongoose.connect(
        process.env.MONGO_URI,
        mongoOptions
      );

      console.log(`✅  MongoDB connected: ${conn.connection.host}`);

      // ---------- Connection event listeners ----------
      mongoose.connection.on("error", (err) => {
        console.error(`❌  MongoDB connection error: ${err.message}`);
      });

      mongoose.connection.on("disconnected", () => {
        console.warn("⚠️  MongoDB disconnected. Attempting reconnect…");
      });

      mongoose.connection.on("reconnected", () => {
        console.log("🔄  MongoDB reconnected successfully.");
      });

      return; // success — stop retrying
    } catch (error) {
      console.error(
        `❌  Attempt ${attempt} failed: ${error.message}`
      );

      // On last SRV attempt, try the non-SRV fallback URI
      if (attempt === MAX_RETRIES) {
        const fallbackUri = buildFallbackUri();
        if (fallbackUri) {
          try {
            console.log("🔄  Trying non-SRV fallback connection…");
            const conn = await mongoose.connect(fallbackUri, mongoOptions);
            console.log(
              `✅  MongoDB connected (fallback): ${conn.connection.host}`
            );
            return; // success via fallback
          } catch (fbErr) {
            console.error(
              `❌  Fallback also failed: ${fbErr.message}`
            );
          }
        }

        console.error("❌  All MongoDB connection attempts exhausted.");
        process.exit(1);
      }

      console.log(`⏳  Retrying in ${RETRY_DELAY_MS / 1000}s…`);
      await sleep(RETRY_DELAY_MS);
    }
  }
};

// ---------- Graceful shutdown ----------
const gracefulShutdown = async (signal) => {
  console.log(`\n🛑  Received ${signal}. Closing MongoDB connection…`);
  await mongoose.connection.close();
  console.log("💤  MongoDB connection closed. Exiting.");
  process.exit(0);
};

process.on("SIGINT", () => gracefulShutdown("SIGINT"));
process.on("SIGTERM", () => gracefulShutdown("SIGTERM"));

module.exports = connectDB;
