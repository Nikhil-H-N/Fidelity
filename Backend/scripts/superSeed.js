/**
 * ============================================================
 * FinovaWealth — Super Behavioral Seeder
 * File: Backend/scripts/superSeed.js
 * ============================================================
 * Generates high-fidelity, realistic behavioral data for demo.
 * Creates NEW users, sessions, and granular events.
 * Supports DNS fallback for MongoDB Atlas.
 * ============================================================
 */

const mongoose = require("mongoose");
const dotenv = require("dotenv");
const dns = require("dns");
const path = require("path");
const User = require("../models/User");
const Session = require("../models/Session");
const Event = require("../models/Event");

// Fix DNS for MongoDB Atlas on Windows/certain ISPs
dns.setDefaultResultOrder("ipv4first");

// Load config
dotenv.config({ path: path.join(__dirname, "../.env") });

const MONGO_URI = process.env.MONGO_URI;

const buildFallbackUri = () => {
  const primary = MONGO_URI;
  if (!primary) return null;
  const match = primary.match(/mongodb\+srv:\/\/([^@]+)@[^/]+\/([^?]+)\??(.*)/);
  if (!match) return null;
  const [, credentials, dbName, params] = match;
  const shards = [
    "ac-rnosrti-shard-00-00.f2gv7j5.mongodb.net:27017",
    "ac-rnosrti-shard-00-01.f2gv7j5.mongodb.net:27017",
    "ac-rnosrti-shard-00-02.f2gv7j5.mongodb.net:27017",
  ].join(",");
  return `mongodb://${credentials}@${shards}/${dbName}?ssl=true&authSource=admin&${params}`;
};

const PAGES = [
  "landing", "investment-plans", "insurance-plans", "tax-saving-plans",
  "wealth-management", "mutual-funds", "sip-plans", "faq",
  "beginner-guides", "success-stories", "investment-calculator",
  "dashboard", "portfolio", "plan-comparison", "product-details/term-life"
];

const NAMES = ["Aarav", "Ishani", "Vihaan", "Aditi", "Arjun", "Saanvi", "Reyansh", "Ananya", "Krishna", "Myra"];
const SURNAMES = ["Sharma", "Verma", "Gupta", "Malhotra", "Kapoor", "Jain", "Reddy", "Nair", "Patel", "Singh"];

const randomChoice = (arr) => arr[Math.floor(Math.random() * arr.length)];
const randomInt = (min, max) => Math.floor(Math.random() * (max - min + 1)) + min;

// Heatmap Coordinate Generator (Clustered around typical UI elements)
const getCoords = (type) => {
  const clusters = {
    "nav": { x: 400, y: 50, r: 100 },
    "hero": { x: 960, y: 500, r: 150 },
    "card": { x: 500, y: 800, r: 200 },
    "sidebar": { x: 100, y: 400, r: 50 },
    "calc": { x: 1400, y: 450, r: 150 }
  };
  const c = clusters[type] || clusters["hero"];
  return {
    x: Math.round(c.x + (Math.random() - 0.5) * c.r),
    y: Math.round(c.y + (Math.random() - 0.5) * c.r)
  };
};

async function createDummyUser() {
  const name = `${randomChoice(NAMES)} ${randomChoice(SURNAMES)}`;
  const email = `${name.toLowerCase().replace(' ', '.')}.${randomInt(10, 999)}@example.com`;
  return await User.create({
    fullName: name,
    email,
    isVerified: true,
    role: "user",
    riskProfile: randomChoice(["moderate", "aggressive", "conservative"])
  });
}

async function simulateSession(user, persona, dateOffset) {
  const startTime = new Date();
  startTime.setDate(startTime.getDate() - dateOffset);
  
  // Persona specific timing
  if (persona === "NIGHT_OWL") {
    startTime.setHours(randomInt(23, 27) % 24, randomInt(0, 59));
  } else {
    startTime.setHours(randomInt(9, 21), randomInt(0, 59));
  }

  const session = await Session.create({
    userId: user._id,
    sessionStart: startTime,
    device: randomChoice(["desktop", "mobile", "desktop"]),
    browser: randomChoice(["Chrome", "Safari", "Firefox"]),
    location: randomChoice(["Mumbai, IN", "Delhi, IN", "Bengaluru, IN", "Hyderabad, IN"]),
    entrySource: randomChoice(["organic", "direct", "email_campaign"])
  });

  let currentTime = new Date(startTime);
  const path = [];
  
  // Define Journey based on Persona
  let journey = ["landing"];
  if (persona === "CONVERTER") {
    journey = ["landing", "investment-calculator", "sip-plans", "product-details/term-life", "confirmation"];
  } else if (persona === "RESEARCHER") {
    journey = ["landing", "plan-comparison", "faq", "beginner-guides", "success-stories", "landing"];
  } else if (persona === "TAX_SAVER") {
    journey = ["landing", "tax-saving-plans", "investment-calculator", "wealth-management"];
  } else {
    journey = ["landing", randomChoice(PAGES)];
  }

  for (const page of journey) {
    // 1. Page View
    await Event.create({
      userId: user._id, sessionId: session._id,
      eventType: "page_view", page, timestamp: new Date(currentTime)
    });

    // 2. Interaction Loop
    const interactions = randomInt(5, 12);
    for (let i = 0; i < interactions; i++) {
      currentTime.setSeconds(currentTime.getSeconds() + randomInt(2, 15));
      
      const type = randomChoice(["button_click", "button_click", "hover", "scroll_depth", "mouse_movement"]);
      const coords = getCoords(page === "landing" ? "hero" : "calc");
      
      const eventData = {
        userId: user._id, sessionId: session._id,
        eventType: type, page, timestamp: new Date(currentTime),
        x: coords.x, y: coords.y, metadata: {}
      };

      if (type === "button_click") {
        eventData.element = randomChoice(["cta-primary", "nav-invest", "calc-btn", "apply-now"]);
        eventData.metadata.globalClick = true;
      } else if (type === "scroll_depth") {
        eventData.scrollDepth = randomChoice([25, 50, 75, 100]);
      } else if (type === "form_validation_error" && Math.random() > 0.8) {
        eventData.eventType = "form_validation_error";
        eventData.metadata = { field: "pan_number", error: "invalid_format" };
      }

      await Event.create(eventData);
    }
    
    currentTime.setMinutes(currentTime.getMinutes() + randomInt(1, 3));
  }

  session.sessionEnd = new Date(currentTime);
  session.duration = Math.round((session.sessionEnd - session.sessionStart) / 1000);
  session.pagesVisited = journey;
  session.conversion = persona === "CONVERTER";
  session.status = "completed";
  await session.save();
}

async function main() {
  try {
    const mongoOptions = { family: 4, serverSelectionTimeoutMS: 10000 };
    try {
      console.log("Connecting to MongoDB (SRV)...");
      await mongoose.connect(MONGO_URI, mongoOptions);
    } catch (err) {
      console.log("SRV failed, trying fallback URI...");
      const fallback = buildFallbackUri();
      await mongoose.connect(fallback, mongoOptions);
    }

    console.log("CLEANING UP EXISTING DATA (Users, Sessions, Events)...");
    await User.deleteMany({ role: "user" });
    await Session.deleteMany({});
    await Event.deleteMany({});

    console.log("SEEDING 15 NEW DUMMY USERS...");
    for (let i = 0; i < 15; i++) {
      const user = await createDummyUser();
      const persona = randomChoice(["CONVERTER", "RESEARCHER", "TAX_SAVER", "NIGHT_OWL", "BOUNCER"]);
      
      // 2-4 sessions per user over last 48 hours
      const sessCount = randomInt(2, 4);
      for (let s = 0; s < sessCount; s++) {
        await simulateSession(user, persona, randomInt(0, 2));
      }
      console.log(`User ${i+1}/15 seeded: ${user.fullName} (${persona})`);
    }

    console.log("\n✅ SUPER SEED COMPLETE!");
    console.log("Run this script whenever you want to reset and repopulate demo data.");
    process.exit(0);
  } catch (err) {
    console.error("Super Seed failed:", err);
    process.exit(1);
  }
}

main();
