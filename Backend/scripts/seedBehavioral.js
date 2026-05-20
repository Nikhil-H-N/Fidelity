/**
 * ============================================================
 * FinovaWealth — Live Engine Seeder
 * File: Backend/scripts/seedBehavioral.js
 * ============================================================
 * Sends events directly to the Python engine's /analyze endpoint.
 * Sessions stay alive in the engine for ~10 minutes, then auto-expire.
 * No MongoDB required — everything lives in engine memory.
 * ============================================================
 */

const ENGINE_URL = process.env.ENGINE_URL || "http://127.0.0.1:8000/analyze";
const SESSION_LIFETIME_MS = 10 * 60 * 1000; // 10 minutes

// --- Personas with distinct behavioral patterns ---
const PERSONAS = [
  {
    name: "Priya Sharma",
    email: "priya.sharma@gmail.com",
    type: "hesitant_investor",
    pages: ["landing", "investment-plans", "mutual-funds", "sip-plans", "investment-calculator", "mutual-funds", "sip-plans"],
    clickRate: 0.3,
    scrollDepth: [25, 50],
    dwellRange: [15, 40],
    revisitPages: true,
  },
  {
    name: "Rahul Mehta",
    email: "rahul.mehta@outlook.com",
    type: "aggressive_investor",
    pages: ["landing", "dashboard", "mutual-funds", "investment-plans", "sip-plans", "investment-calculator"],
    clickRate: 0.7,
    scrollDepth: [50, 75, 100],
    dwellRange: [5, 15],
    revisitPages: false,
  },
  {
    name: "Ananya Reddy",
    email: "ananya.r@company.io",
    type: "premium_explorer",
    pages: ["landing", "investment-plans", "insurance-plans", "wealth-management", "investment-plans", "dashboard"],
    clickRate: 0.5,
    scrollDepth: [50, 75],
    dwellRange: [10, 30],
    revisitPages: true,
  },
  {
    name: "Vikram Patel",
    email: "vikram.p@yahoo.com",
    type: "confused_browser",
    pages: ["landing", "mutual-funds", "sip-plans", "mutual-funds", "investment-calculator", "sip-plans", "landing", "faq"],
    clickRate: 0.4,
    scrollDepth: [25, 50],
    dwellRange: [5, 12],
    revisitPages: true,
  },
  {
    name: "Sneha Iyer",
    email: "sneha.iyer@gmail.com",
    type: "high_intent",
    pages: ["landing", "sip-plans", "investment-calculator", "sip-plans", "investment-plans"],
    clickRate: 0.8,
    scrollDepth: [75, 100],
    dwellRange: [20, 50],
    revisitPages: true,
  },
  {
    name: "Arjun Singh",
    email: "arjun.s@techcorp.in",
    type: "quick_bouncer",
    pages: ["landing", "investment-plans"],
    clickRate: 0.1,
    scrollDepth: [25],
    dwellRange: [2, 6],
    revisitPages: false,
  },
];

const ELEMENTS = [
  "invest-now-btn", "learn-more-link", "calculate-cta", "apply-btn",
  "nav-mutual-funds", "nav-sip", "nav-insurance", "profile-icon",
  "search-bar", "filter-dropdown", "compare-btn", "download-brochure",
  "contact-advisor", "chatbot-toggle", "plan-card", "faq-expand",
];

const randomChoice = (arr) => arr[Math.floor(Math.random() * arr.length)];
const randomInt = (min, max) => Math.floor(Math.random() * (max - min + 1)) + min;
const randomFloat = (min, max) => min + Math.random() * (max - min);
const sleep = (ms) => new Promise((r) => setTimeout(r, ms));

// Clustered coordinates to simulate real heatmap patterns
const getHeatmapCoords = (page) => {
  const clusters = {
    "landing": [
      { x: 960, y: 400, r: 120 },  // Hero CTA
      { x: 960, y: 800, r: 200 },  // Feature cards
      { x: 200, y: 60, r: 40 },    // Nav
    ],
    "investment-plans": [
      { x: 400, y: 500, r: 150 },  // Plan cards left
      { x: 960, y: 500, r: 150 },  // Plan cards center
      { x: 1500, y: 500, r: 150 }, // Plan cards right
    ],
    "mutual-funds": [
      { x: 700, y: 600, r: 180 },  // Fund list
      { x: 1400, y: 400, r: 100 }, // Compare button
    ],
    "sip-plans": [
      { x: 960, y: 450, r: 150 },  // SIP calculator
      { x: 960, y: 700, r: 100 },  // Start SIP button
    ],
    "investment-calculator": [
      { x: 960, y: 350, r: 100 },  // Input fields
      { x: 960, y: 550, r: 80 },   // Calculate button
    ],
    "insurance-plans": [
      { x: 600, y: 500, r: 150 },
      { x: 1200, y: 500, r: 150 },
    ],
    "dashboard": [
      { x: 400, y: 300, r: 100 },  // Portfolio summary
      { x: 960, y: 500, r: 200 },  // Charts
      { x: 1500, y: 300, r: 80 },  // Notifications
    ],
    "faq": [
      { x: 960, y: 400, r: 300 },  // FAQ list
    ],
  };
  const pageClusters = clusters[page] || clusters["landing"];
  const c = randomChoice(pageClusters);
  return {
    x: Math.round(c.x + (Math.random() - 0.5) * c.r * 2),
    y: Math.round(c.y + (Math.random() - 0.5) * c.r * 2),
  };
};

async function sendEvent(event) {
  try {
    const res = await fetch(ENGINE_URL, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(event),
    });
    return res.ok;
  } catch (err) {
    console.error(`  [!] Failed to send event: ${err.message}`);
    return false;
  }
}

async function simulateUserJourney(persona, index) {
  const userId = `sim_${persona.type}_${index}_${Date.now()}`;
  const now = Date.now() / 1000;

  console.log(`\n>> Simulating: ${persona.name} (${persona.type})`);
  console.log(`   user_id: ${userId}`);
  console.log(`   journey: ${persona.pages.join(" -> ")}`);

  let elapsed = 0;
  const pagesVisited = [];

  for (let i = 0; i < persona.pages.length; i++) {
    const page = persona.pages[i];
    const isRevisit = pagesVisited.includes(page);
    pagesVisited.push(page);

    // Page view
    await sendEvent({
      user_id: userId,
      event_type: isRevisit ? "repeated_page_visit" : "page_visit",
      page_id: page,
      timestamp: now + elapsed,
      metadata: {
        email: persona.email,
        userName: persona.name,
        trackingUserId: userId,
        clientSessionId: `sim_sess_${index}`,
      },
    });

    // Simulate interactions on this page
    const numInteractions = randomInt(3, 8);
    for (let j = 0; j < numInteractions; j++) {
      elapsed += randomInt(2, 8);
      const coords = getHeatmapCoords(page);
      const roll = Math.random();

      if (roll < persona.clickRate * 0.5) {
        // Button click
        await sendEvent({
          user_id: userId,
          event_type: "button_click",
          page_id: page,
          element_id: randomChoice(ELEMENTS),
          x: coords.x,
          y: coords.y,
          timestamp: now + elapsed,
          metadata: {
            email: persona.email,
            userName: persona.name,
            globalClick: true,
          },
        });
      } else if (roll < persona.clickRate * 0.5 + 0.2) {
        // Hover
        await sendEvent({
          user_id: userId,
          event_type: "hover",
          page_id: page,
          element_id: randomChoice(ELEMENTS),
          dwell_time: randomFloat(0.5, 3),
          timestamp: now + elapsed,
          metadata: { email: persona.email, userName: persona.name },
        });
      } else if (roll < persona.clickRate * 0.5 + 0.4) {
        // Scroll
        await sendEvent({
          user_id: userId,
          event_type: "scroll_depth",
          page_id: page,
          scroll_depth: randomChoice(persona.scrollDepth),
          timestamp: now + elapsed,
          metadata: { email: persona.email, userName: persona.name },
        });
      } else {
        // Mouse movement
        await sendEvent({
          user_id: userId,
          event_type: "mouse_movement",
          page_id: page,
          x: coords.x,
          y: coords.y,
          mouse_move_count: randomInt(5, 30),
          timestamp: now + elapsed,
          metadata: { email: persona.email, userName: persona.name },
        });
      }
    }

    // Dwell time on page
    const dwell = randomInt(persona.dwellRange[0], persona.dwellRange[1]);
    elapsed += dwell;
    await sendEvent({
      user_id: userId,
      event_type: "time_spent",
      page_id: page,
      dwell_time: dwell,
      timestamp: now + elapsed,
      metadata: { email: persona.email, userName: persona.name },
    });
  }

  // Some personas trigger special events
  if (persona.type === "hesitant_investor" && Math.random() > 0.5) {
    elapsed += 3;
    await sendEvent({
      user_id: userId,
      event_type: "rapid_click",
      page_id: persona.pages[persona.pages.length - 1],
      element_id: "invest-now-btn",
      timestamp: now + elapsed,
      metadata: { email: persona.email, userName: persona.name, clickCount: 5 },
    });
  }

  if (persona.type === "quick_bouncer") {
    elapsed += 2;
    await sendEvent({
      user_id: userId,
      event_type: "bounce",
      page_id: persona.pages[persona.pages.length - 1],
      timestamp: now + elapsed,
      metadata: { email: persona.email, userName: persona.name },
    });
  }

  console.log(`   done: ${pagesVisited.length} pages, ~${elapsed}s of activity`);
  return userId;
}

async function main() {
  console.log("=== FinovaWealth Live Engine Seeder ===\n");
  console.log(`Engine: ${ENGINE_URL}`);
  console.log(`Sessions will persist for 10 minutes, then auto-expire.\n`);

  // Check engine is running
  try {
    const health = await fetch(ENGINE_URL.replace("/analyze", "/"));
    if (!health.ok) throw new Error("Engine not healthy");
    const data = await health.json();
    console.log(`Engine online: ${data.engine} (${data.active_sessions} active sessions)\n`);
  } catch (err) {
    console.error(`Cannot reach engine at ${ENGINE_URL}. Start it first:`);
    console.error("  cd engine && python -m uvicorn engine.main:app --port 8000");
    process.exit(1);
  }

  // Send events for all personas with staggered timing
  const userIds = [];
  for (let i = 0; i < PERSONAS.length; i++) {
    const uid = await simulateUserJourney(PERSONAS[i], i);
    userIds.push(uid);
    if (i < PERSONAS.length - 1) await sleep(500); // stagger
  }

  console.log(`\n>> ${userIds.length} dummy users created in engine memory.`);
  console.log("   They will appear in Session Timeline and Heatmap now.");
  console.log("   Sessions auto-expire after 10 minutes of inactivity.\n");

  // Keep sessions alive with periodic pings for 10 minutes
  const startTime = Date.now();
  const pingInterval = 60_000; // ping every 60s

  console.log(">> Keeping sessions alive with periodic activity...");
  console.log("   Press Ctrl+C to stop early.\n");

  const keepAlive = setInterval(async () => {
    const elapsed = Date.now() - startTime;
    if (elapsed >= SESSION_LIFETIME_MS) {
      clearInterval(keepAlive);
      console.log("\n>> 10 minutes elapsed. Sessions will now expire naturally.");
      console.log("   Done.");
      process.exit(0);
    }

    const remaining = Math.round((SESSION_LIFETIME_MS - elapsed) / 1000);
    const now = Date.now() / 1000;

    // Send a light event for each user to keep their session alive
    for (const uid of userIds) {
      const persona = PERSONAS.find((p) => uid.includes(p.type)) || PERSONAS[0];
      const page = randomChoice(persona.pages);
      await sendEvent({
        user_id: uid,
        event_type: "mouse_movement",
        page_id: page,
        x: randomInt(200, 1700),
        y: randomInt(100, 900),
        mouse_move_count: randomInt(1, 5),
        timestamp: now,
        metadata: { email: persona.email, userName: persona.name, keepAlive: true },
      });
    }

    console.log(`   [${Math.round(elapsed / 1000)}s] Pinged ${userIds.length} sessions — ${remaining}s remaining`);
  }, pingInterval);

  // Also send an initial burst of activity to make sessions look rich
  console.log(">> Sending follow-up activity burst...");
  await sleep(2000);
  const now = Date.now() / 1000;
  for (const uid of userIds) {
    const persona = PERSONAS.find((p) => uid.includes(p.type)) || PERSONAS[0];
    for (let k = 0; k < 5; k++) {
      const page = randomChoice(persona.pages);
      const coords = getHeatmapCoords(page);
      await sendEvent({
        user_id: uid,
        event_type: randomChoice(["button_click", "hover", "scroll_depth"]),
        page_id: page,
        element_id: randomChoice(ELEMENTS),
        scroll_depth: randomChoice(persona.scrollDepth),
        x: coords.x,
        y: coords.y,
        timestamp: now + k * 3,
        metadata: { email: persona.email, userName: persona.name },
      });
    }
  }
  console.log("   Activity burst complete.\n");
}

main().catch((err) => {
  console.error("Seeder failed:", err);
  process.exit(1);
});
