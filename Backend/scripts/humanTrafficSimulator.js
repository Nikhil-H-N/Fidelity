/**
 * ============================================================
 * FinovaWealth - Human Traffic Simulator
 * File: Backend/scripts/humanTrafficSimulator.js
 * ============================================================
 * Creates dummy users with realistic emails, browsing sessions,
 * clicks, hovers, scrolls, form activity, and heatmap coordinates.
 *
 * Default behavior is safe and additive: it does not delete data.
 *
 * Examples:
 *   npm run simulate:humans
 *   npm run simulate:humans -- --users=25 --sessions=3 --days=7
 *   npm run simulate:humans -- --mode=engine --users=8
 *   npm run simulate:humans -- --mode=live --users=8
 *   npm run simulate:humans -- --mode=live --users=6 --live-minutes=15
 *   npm run simulate:humans -- --email-domain=demo.local
 *   npm run simulate:humans -- --dry-run
 * ============================================================
 */

const mongoose = require("mongoose");
const dotenv = require("dotenv");
const dns = require("dns");
const path = require("path");
const User = require("../models/User");
const Session = require("../models/Session");
const Event = require("../models/Event");

dns.setDefaultResultOrder("ipv4first");
dotenv.config({ path: path.join(__dirname, "../.env") });

const DEFAULTS = {
  users: 15,
  sessions: 2,
  days: 3,
  mode: "both",
  engineUrl: process.env.ENGINE_URL || "http://127.0.0.1:8000/analyze",
  emailDomain: "example.test",
  dryRun: false,
  liveMinutes: 10,
};

const VIEWPORTS = {
  desktop: { width: 1440, height: 900 },
  tablet: { width: 1024, height: 768 },
  mobile: { width: 390, height: 844 },
};

const BROWSERS = ["Chrome 125", "Chrome 126", "Edge 125", "Safari 17", "Firefox 126"];
const LOCATIONS = ["Mumbai, IN", "Delhi, IN", "Bengaluru, IN", "Hyderabad, IN", "Pune, IN", "New York, US"];
const SOURCES = ["direct", "organic", "email_campaign", "referral", "social"];
const RISK_PROFILES = ["conservative", "moderate", "aggressive"];

const FIRST_NAMES = [
  "Aarav", "Aditi", "Ananya", "Arjun", "Dev", "Diya", "Ishani", "Kabir",
  "Krishna", "Meera", "Myra", "Neha", "Rahul", "Reyansh", "Riya", "Saanvi",
  "Tara", "Vihaan", "Zara", "Zoya",
];

const LAST_NAMES = [
  "Bose", "Gupta", "Iyer", "Jain", "Kapoor", "Khan", "Malhotra", "Nair",
  "Patel", "Rao", "Reddy", "Shah", "Sharma", "Singh", "Verma",
];

const GOALS = [
  "retirement", "tax_saving", "wealth_creation", "child_education",
  "emergency_fund", "home_purchase", "vacation",
];

const PAGE_DEFS = {
  landing: {
    path: "landing",
    next: ["investment-plans", "mutual-funds", "sip-plans", "insurance-plans", "faq"],
    elements: [
      { id: "hero-start-investing", label: "Start Investing", x: 735, y: 465, radius: 70 },
      { id: "nav-investment-plans", label: "Investment Plans", x: 550, y: 72, radius: 50 },
      { id: "nav-login", label: "Login", x: 1260, y: 72, radius: 45 },
      { id: "learn-more", label: "Learn More", x: 610, y: 465, radius: 65 },
      { id: "success-card", label: "Success Story", x: 1040, y: 690, radius: 90 },
    ],
  },
  "investment-plans": {
    path: "investment-plans",
    next: ["plan-comparison", "product-details/term-life", "application-form", "investment-calculator"],
    elements: [
      { id: "plan-card-growth", label: "Growth Plan", x: 365, y: 520, radius: 90 },
      { id: "compare-plans", label: "Compare Plans", x: 725, y: 760, radius: 80 },
      { id: "invest-now", label: "Invest Now", x: 1050, y: 520, radius: 80 },
      { id: "filter-risk", label: "Risk Filter", x: 240, y: 260, radius: 60 },
    ],
  },
  "mutual-funds": {
    path: "mutual-funds",
    next: ["product-details/bluechip-fund", "sip-plans", "plan-comparison", "application-form"],
    elements: [
      { id: "fund-card-bluechip", label: "Bluechip Fund", x: 345, y: 495, radius: 85 },
      { id: "fund-card-elss", label: "ELSS Fund", x: 720, y: 495, radius: 85 },
      { id: "start-sip", label: "Start SIP", x: 1050, y: 715, radius: 80 },
      { id: "download-factsheet", label: "Download Factsheet", x: 1110, y: 335, radius: 70 },
    ],
  },
  "sip-plans": {
    path: "sip-plans",
    next: ["investment-calculator", "application-form", "dashboard"],
    elements: [
      { id: "sip-amount-input", label: "SIP Amount", x: 460, y: 360, radius: 65 },
      { id: "sip-duration-slider", label: "Duration Slider", x: 630, y: 520, radius: 75 },
      { id: "create-sip", label: "Create SIP", x: 970, y: 690, radius: 90 },
      { id: "view-projection", label: "View Projection", x: 1010, y: 430, radius: 85 },
    ],
  },
  "investment-calculator": {
    path: "investment-calculator",
    next: ["sip-plans", "plan-comparison", "application-form"],
    elements: [
      { id: "monthly-investment", label: "Monthly Investment", x: 455, y: 345, radius: 70 },
      { id: "expected-return", label: "Expected Return", x: 455, y: 475, radius: 70 },
      { id: "calculate-returns", label: "Calculate Returns", x: 740, y: 650, radius: 95 },
      { id: "save-calculation", label: "Save Calculation", x: 1010, y: 650, radius: 75 },
    ],
  },
  "plan-comparison": {
    path: "plan-comparison",
    next: ["product-details/term-life", "application-form", "contact"],
    elements: [
      { id: "comparison-table", label: "Comparison Table", x: 720, y: 520, radius: 180 },
      { id: "select-plan-a", label: "Select Plan A", x: 410, y: 725, radius: 60 },
      { id: "select-plan-b", label: "Select Plan B", x: 735, y: 725, radius: 60 },
      { id: "talk-to-advisor", label: "Talk To Advisor", x: 1070, y: 725, radius: 75 },
    ],
  },
  "product-details/term-life": {
    path: "product-details/term-life",
    next: ["application-form", "contact", "faq"],
    elements: [
      { id: "benefits-tab", label: "Benefits Tab", x: 315, y: 260, radius: 55 },
      { id: "premium-breakdown", label: "Premium Breakdown", x: 965, y: 430, radius: 110 },
      { id: "apply-now", label: "Apply Now", x: 1050, y: 690, radius: 85 },
      { id: "download-brochure", label: "Download Brochure", x: 840, y: 690, radius: 75 },
    ],
  },
  "insurance-plans": {
    path: "insurance-plans",
    next: ["product-details/term-life", "plan-comparison", "application-form"],
    elements: [
      { id: "term-life-card", label: "Term Life", x: 385, y: 510, radius: 95 },
      { id: "health-insurance-card", label: "Health Insurance", x: 720, y: 510, radius: 95 },
      { id: "compare-insurance", label: "Compare Insurance", x: 1035, y: 710, radius: 80 },
    ],
  },
  faq: {
    path: "faq",
    next: ["beginner-guides", "contact", "landing"],
    elements: [
      { id: "faq-tax-saving", label: "Tax Saving FAQ", x: 440, y: 350, radius: 80 },
      { id: "faq-sip-risk", label: "SIP Risk FAQ", x: 440, y: 495, radius: 80 },
      { id: "faq-contact", label: "Contact Support", x: 980, y: 700, radius: 75 },
    ],
  },
  "application-form": {
    path: "application-form",
    next: ["confirmation", "dashboard"],
    elements: [
      { id: "full-name", label: "Full Name", x: 465, y: 255, radius: 55 },
      { id: "pan-number", label: "PAN Number", x: 465, y: 390, radius: 55 },
      { id: "investment-amount", label: "Investment Amount", x: 465, y: 525, radius: 55 },
      { id: "submit-application", label: "Submit Application", x: 795, y: 720, radius: 85 },
    ],
  },
  contact: {
    path: "contact",
    next: ["landing", "dashboard"],
    elements: [
      { id: "message-field", label: "Message Field", x: 520, y: 480, radius: 80 },
      { id: "request-callback", label: "Request Callback", x: 795, y: 695, radius: 85 },
      { id: "chatbot-open", label: "Chatbot", x: 1260, y: 765, radius: 60 },
    ],
  },
  dashboard: {
    path: "dashboard",
    next: ["portfolio", "transactions", "profile-settings"],
    elements: [
      { id: "portfolio-card", label: "Portfolio Card", x: 380, y: 320, radius: 100 },
      { id: "recommended-plan", label: "Recommended Plan", x: 920, y: 420, radius: 110 },
      { id: "add-investment", label: "Add Investment", x: 1120, y: 680, radius: 75 },
    ],
  },
};

const PERSONAS = {
  CONVERTER: ["landing", "investment-plans", "investment-calculator", "sip-plans", "application-form", "confirmation"],
  FORM_ABANDONER: ["landing", "investment-plans", "plan-comparison", "investment-calculator", "application-form"],
  RESEARCHER: ["landing", "faq", "beginner-guides", "plan-comparison", "mutual-funds", "landing"],
  TAX_SAVER: ["landing", "mutual-funds", "plan-comparison", "product-details/term-life", "application-form"],
  HESITANT: ["landing", "insurance-plans", "product-details/term-life", "faq", "product-details/term-life", "contact"],
  DASHBOARD_RETURNER: ["landing", "dashboard", "portfolio", "transactions", "dashboard"],
  BOUNCER: ["landing"],
};

const PERSONA_BEHAVIOR = {
  CONVERTER: {
    weight: 24,
    conversionIntent: 0.92,
    formCompletionRate: 0.9,
    interactionRange: [9, 15],
    clickRate: 0.4,
    ctaBias: 0.8,
    scrollDepths: [50, 75, 100],
    dwellRange: [28, 85],
    extraStepChance: 0.25,
  },
  FORM_ABANDONER: {
    weight: 16,
    conversionIntent: 0.72,
    formCompletionRate: 0.08,
    interactionRange: [8, 14],
    clickRate: 0.35,
    ctaBias: 0.65,
    scrollDepths: [50, 75],
    dwellRange: [25, 70],
    extraStepChance: 0.15,
  },
  RESEARCHER: {
    weight: 18,
    conversionIntent: 0.25,
    formCompletionRate: 0.05,
    interactionRange: [7, 13],
    clickRate: 0.22,
    ctaBias: 0.2,
    scrollDepths: [50, 75, 100],
    dwellRange: [45, 140],
    extraStepChance: 0.45,
  },
  TAX_SAVER: {
    weight: 13,
    conversionIntent: 0.55,
    formCompletionRate: 0.5,
    interactionRange: [8, 14],
    clickRate: 0.3,
    ctaBias: 0.5,
    scrollDepths: [50, 75, 100],
    dwellRange: [35, 100],
    extraStepChance: 0.35,
  },
  HESITANT: {
    weight: 13,
    conversionIntent: 0.42,
    formCompletionRate: 0.15,
    interactionRange: [6, 12],
    clickRate: 0.18,
    ctaBias: 0.25,
    scrollDepths: [25, 50, 75],
    dwellRange: [55, 170],
    extraStepChance: 0.25,
  },
  DASHBOARD_RETURNER: {
    weight: 8,
    conversionIntent: 0.35,
    formCompletionRate: 0.2,
    interactionRange: [6, 10],
    clickRate: 0.24,
    ctaBias: 0.25,
    scrollDepths: [50, 75],
    dwellRange: [20, 65],
    extraStepChance: 0.2,
  },
  BOUNCER: {
    weight: 8,
    conversionIntent: 0.02,
    formCompletionRate: 0,
    interactionRange: [1, 3],
    clickRate: 0.05,
    ctaBias: 0.02,
    scrollDepths: [25],
    dwellRange: [5, 22],
    extraStepChance: 0,
  },
};

const CTA_ELEMENTS = new Set([
  "hero-start-investing",
  "invest-now",
  "start-sip",
  "create-sip",
  "apply-now",
  "submit-application",
  "request-callback",
  "talk-to-advisor",
  "save-calculation",
]);

const randomInt = (min, max) => Math.floor(Math.random() * (max - min + 1)) + min;
const randomChoice = (items) => items[randomInt(0, items.length - 1)];
const clamp = (value, min, max) => Math.max(min, Math.min(max, value));
const sleep = (ms) => new Promise((resolve) => setTimeout(resolve, ms));
const weightedChoice = (items) => {
  const total = items.reduce((sum, item) => sum + item.weight, 0);
  let roll = Math.random() * total;
  for (const item of items) {
    roll -= item.weight;
    if (roll <= 0) return item.value;
  }
  return items[items.length - 1].value;
};

const parseArgs = () => {
  const args = { ...DEFAULTS };

  for (const arg of process.argv.slice(2)) {
    if (arg === "--dry-run") {
      args.dryRun = true;
      continue;
    }

    const [key, rawValue] = arg.replace(/^--/, "").split("=");
    if (!key || rawValue === undefined) continue;

    if (["users", "sessions", "days"].includes(key)) {
      args[key] = Math.max(1, Number.parseInt(rawValue, 10) || DEFAULTS[key]);
    } else if (key === "live-minutes") {
      args.liveMinutes = Math.max(1, Number.parseInt(rawValue, 10) || DEFAULTS.liveMinutes);
    } else if (key === "mode") {
      args.mode = ["both", "db", "engine", "live"].includes(rawValue) ? rawValue : DEFAULTS.mode;
    } else if (key === "engine-url") {
      args.engineUrl = rawValue;
    } else if (key === "email-domain") {
      args.emailDomain = rawValue.replace(/^@/, "") || DEFAULTS.emailDomain;
    }
  }

  return args;
};

const buildFallbackUri = (mongoUri) => {
  if (!mongoUri) return null;
  const match = mongoUri.match(/mongodb\+srv:\/\/([^@]+)@[^/]+\/([^?]+)\??(.*)/);
  if (!match) return null;

  const [, credentials, dbName, params] = match;
  const shards = [
    "ac-rnosrti-shard-00-00.f2gv7j5.mongodb.net:27017",
    "ac-rnosrti-shard-00-01.f2gv7j5.mongodb.net:27017",
    "ac-rnosrti-shard-00-02.f2gv7j5.mongodb.net:27017",
  ].join(",");

  return `mongodb://${credentials}@${shards}/${dbName}?ssl=true&authSource=admin&${params}`;
};

const connectMongo = async () => {
  const mongoUri = process.env.MONGO_URI;
  if (!mongoUri) {
    throw new Error("MONGO_URI is missing. Add it to Backend/.env or use --mode=engine.");
  }

  const options = { family: 4, serverSelectionTimeoutMS: 10000 };
  try {
    await mongoose.connect(mongoUri, options);
  } catch (error) {
    const fallback = buildFallbackUri(mongoUri);
    if (!fallback) throw error;
    await mongoose.connect(fallback, options);
  }
};

const makeRunId = () => new Date().toISOString().replace(/[-:.TZ]/g, "").slice(0, 14);

const makeDummyUserData = (runId, index, emailDomain) => {
  const fullName = `${randomChoice(FIRST_NAMES)} ${randomChoice(LAST_NAMES)}`;
  const localPart = fullName.toLowerCase().replace(/[^a-z]+/g, ".");

  return {
    fullName,
    email: `${localPart}.${runId}.${index}@${emailDomain}`,
    phone: `9${randomInt(100000000, 999999999)}`,
    passwordHash: "DummyUser@123",
    authProvider: "email",
    role: "user",
    isVerified: true,
    riskProfile: randomChoice(RISK_PROFILES),
    investmentGoals: [randomChoice(GOALS), randomChoice(GOALS)].filter((goal, i, arr) => arr.indexOf(goal) === i),
    monthlyInvestment: randomInt(3000, 75000),
    preferredInvestments: [randomChoice(["SIP", "Mutual Funds", "ELSS", "Insurance", "Retirement"])],
    intentScore: randomInt(12, 88),
  };
};

const createDummyUser = async (userData, persist) => {
  if (!persist) {
    return {
      _id: `dummy_${userData.email.split("@")[0].replace(/\./g, "_")}`,
      ...userData,
    };
  }

  return User.create(userData);
};

const scalePoint = (point, viewport) => ({
  x: Math.round((point.x / VIEWPORTS.desktop.width) * viewport.width),
  y: Math.round((point.y / VIEWPORTS.desktop.height) * viewport.height),
});

const jitterPoint = (element, viewport) => {
  const native = {
    x: element.x + randomInt(-element.radius, element.radius),
    y: element.y + randomInt(-element.radius, element.radius),
  };
  const scaled = scalePoint(native, viewport);

  return {
    x: clamp(scaled.x, 8, viewport.width - 8),
    y: clamp(scaled.y, 8, viewport.height - 8),
  };
};

const normalizePageForEngine = (page) => String(page || "unknown").replace(/^\//, "").replace(/-/g, "_");

const pickPersona = () => {
  return weightedChoice(
    Object.entries(PERSONA_BEHAVIOR).map(([value, config]) => ({
      value,
      weight: config.weight,
    }))
  );
};

const makeJourney = (persona) => {
  const template = PERSONAS[persona] || PERSONAS.RESEARCHER;
  if (persona === "BOUNCER") return template;

  const journey = [...template];
  const behavior = PERSONA_BEHAVIOR[persona] || PERSONA_BEHAVIOR.RESEARCHER;
  if (Math.random() < behavior.extraStepChance) {
    const lastKnownPage = PAGE_DEFS[journey[journey.length - 1]] || PAGE_DEFS.landing;
    journey.push(randomChoice(lastKnownPage.next));
  }

  return journey;
};

const makeTimestamp = (daysBack) => {
  const date = new Date();
  date.setDate(date.getDate() - randomInt(0, daysBack));
  date.setHours(randomInt(8, 22), randomInt(0, 59), randomInt(0, 59), 0);
  return date;
};

const addEvent = (events, base) => {
  events.push({
    ...base,
    metadata: {
      ...(base.metadata || {}),
      screenWidth: base.metadata?.screenWidth,
      screenHeight: base.metadata?.screenHeight,
    },
  });
};

const buildSessionEvents = ({ user, sessionId, persona, device, browser, source, startTime, daysBack }) => {
  const viewport = VIEWPORTS[device];
  const events = [];
  const behavior = PERSONA_BEHAVIOR[persona] || PERSONA_BEHAVIOR.RESEARCHER;
  const journey = makeJourney(persona);
  const visitedPages = [];
  let current = new Date(startTime);
  let lastScrollDepth = 0;
  const clientSessionId = `sim_${sessionId}_${randomInt(1000, 9999)}`;
  let converted = false;
  let abandonedForm = false;

  const baseMetadata = {
    simulated: true,
    persona,
    conversionIntent: behavior.conversionIntent,
    userEmail: user.email,
    userName: user.fullName,
    trackingUserId: String(user._id),
    clientSessionId,
    screenWidth: viewport.width,
    screenHeight: viewport.height,
    connectionOrigin: "simulated",
  };

  addEvent(events, {
    eventType: "session_start",
    page: journey[0],
    source,
    timestamp: new Date(current),
    metadata: baseMetadata,
  });

  journey.forEach((page, pageIndex) => {
    const def = PAGE_DEFS[page] || PAGE_DEFS.landing;
    const pageEntry = new Date(current);
    visitedPages.push(page);

    addEvent(events, {
      eventType: pageIndex > 0 && journey.indexOf(page) !== pageIndex ? "repeated_page_visit" : "page_view",
      page,
      source,
      timestamp: new Date(current),
      device,
      browser,
      metadata: { ...baseMetadata, pageIndex },
    });

    if (pageIndex > 0 && Math.random() > 0.8) {
      current.setSeconds(current.getSeconds() + randomInt(1, 4));
      addEvent(events, {
        eventType: "return_visit",
        page,
        source,
        timestamp: new Date(current),
        device,
        browser,
        metadata: { ...baseMetadata, previousPage: journey[pageIndex - 1] },
      });
    }

    const interactions = randomInt(behavior.interactionRange[0], behavior.interactionRange[1]);

    for (let i = 0; i < interactions; i++) {
      current.setSeconds(current.getSeconds() + randomInt(2, 12));
      const element = randomChoice(def.elements);
      const point = jitterPoint(element, viewport);
      const roll = Math.random();

      if (roll < 0.22) {
        lastScrollDepth = Math.max(lastScrollDepth, randomChoice(behavior.scrollDepths));
        addEvent(events, {
          eventType: "scroll_depth",
          page,
          scrollDepth: lastScrollDepth,
          duration: randomInt(2, 9),
          timestamp: new Date(current),
          device,
          browser,
          metadata: { ...baseMetadata, depth: lastScrollDepth },
        });
      } else if (roll < 0.38) {
        addEvent(events, {
          eventType: "hover",
          page,
          element: element.id,
          duration: randomInt(1, 6),
          x: point.x,
          y: point.y,
          timestamp: new Date(current),
          device,
          browser,
          metadata: { ...baseMetadata, element: element.id, label: element.label, x: point.x, y: point.y },
        });
      } else if (roll < 0.48) {
        addEvent(events, {
          eventType: "mouse_movement",
          page,
          x: point.x,
          y: point.y,
          timestamp: new Date(current),
          device,
          browser,
          metadata: { ...baseMetadata, moveCount: randomInt(15, 130), x: point.x, y: point.y },
        });
      } else if (roll < 0.48 + behavior.clickRate) {
        const isLikelyCta = CTA_ELEMENTS.has(element.id);
        const clickType = isLikelyCta && Math.random() < behavior.ctaBias ? "cta_click" : "button_click";
        addEvent(events, {
          eventType: clickType,
          page,
          element: element.id,
          buttonName: element.label,
          x: point.x,
          y: point.y,
          timestamp: new Date(current),
          device,
          browser,
          metadata: {
            ...baseMetadata,
            element: element.id,
            label: element.label,
            x: point.x,
            y: point.y,
            globalClick: true,
            ctaCandidate: isLikelyCta,
          },
        });
      } else {
        addEvent(events, {
          eventType: "hover",
          page,
          element: element.id,
          duration: randomInt(2, 9),
          x: point.x,
          y: point.y,
          timestamp: new Date(current),
          device,
          browser,
          metadata: { ...baseMetadata, element: element.id, label: element.label, x: point.x, y: point.y },
        });
      }

      if (page === "investment-calculator" && Math.random() < Math.max(0.35, behavior.conversionIntent)) {
        current.setSeconds(current.getSeconds() + randomInt(3, 8));
        addEvent(events, {
          eventType: "calculator_usage",
          page,
          element: "calculate-returns",
          duration: randomInt(10, 45),
          timestamp: new Date(current),
          device,
          browser,
          metadata: {
            ...baseMetadata,
            monthlyAmount: randomInt(5000, 50000),
            years: randomInt(5, 25),
            expectedReturn: randomInt(8, 15),
          },
        });
      }

      if (page === "plan-comparison" && Math.random() < (persona === "RESEARCHER" ? 0.75 : 0.38)) {
        current.setSeconds(current.getSeconds() + randomInt(3, 8));
        addEvent(events, {
          eventType: "comparison",
          page,
          element: "comparison-table",
          duration: randomInt(8, 35),
          timestamp: new Date(current),
          device,
          browser,
          metadata: { ...baseMetadata, productsCompared: randomInt(2, 4) },
        });
      }
    }

    if (page.includes("product-details") && Math.random() > 0.35) {
      current.setSeconds(current.getSeconds() + randomInt(5, 18));
      addEvent(events, {
        eventType: "product_view",
        page,
        element: "premium-breakdown",
        duration: randomInt(15, 90),
        timestamp: new Date(current),
        device,
        browser,
        metadata: { ...baseMetadata, product: page.split("/").pop() },
      });
    }

    if (["investment-plans", "mutual-funds", "sip-plans", "insurance-plans"].includes(page) && Math.random() < behavior.conversionIntent) {
      current.setSeconds(current.getSeconds() + randomInt(4, 14));
      addEvent(events, {
        eventType: "price_check",
        page,
        element: def.elements.find((item) => CTA_ELEMENTS.has(item.id))?.id || def.elements[0]?.id,
        duration: randomInt(8, 35),
        timestamp: new Date(current),
        device,
        browser,
        metadata: { ...baseMetadata, pricingIntent: true },
      });
    }

    if (page === "faq" || persona === "RESEARCHER") {
      const faqRepeats = page === "faq" ? randomInt(1, persona === "RESEARCHER" ? 4 : 2) : 0;
      for (let faqIndex = 0; faqIndex < faqRepeats; faqIndex += 1) {
        current.setSeconds(current.getSeconds() + randomInt(4, 14));
        addEvent(events, {
          eventType: "opened_faq",
          page,
          element: randomChoice(PAGE_DEFS.faq.elements).id,
          timestamp: new Date(current),
          device,
          browser,
          metadata: { ...baseMetadata, faqIndex },
        });
      }
    }

    if (page === "application-form") {
      current.setSeconds(current.getSeconds() + randomInt(4, 10));
      addEvent(events, {
        eventType: "form_start",
        page,
        formType: "investment_application",
        timestamp: new Date(current),
        device,
        browser,
        metadata: { ...baseMetadata, form: "investment_application" },
      });

      const fields = ["fullName", "panNumber", "investmentAmount", "riskProfile", "nominee"];
      const maxFields = persona === "FORM_ABANDONER" ? randomInt(2, 4) : fields.length;
      for (const [fieldIndex, field] of fields.slice(0, maxFields).entries()) {
        current.setSeconds(current.getSeconds() + randomInt(3, 10));
        addEvent(events, {
          eventType: "field_focus",
          page,
          fieldName: field,
          formType: "investment_application",
          timestamp: new Date(current),
          device,
          browser,
          metadata: { ...baseMetadata, field },
        });

        current.setSeconds(current.getSeconds() + randomInt(2, 8));
        addEvent(events, {
          eventType: "progress",
          page,
          formType: "investment_application",
          timestamp: new Date(current),
          device,
          browser,
          metadata: {
            ...baseMetadata,
            form: "investment_application",
            progress: Math.round(((fieldIndex + 1) / fields.length) * 100),
          },
        });

        if (field === "panNumber" && (persona === "FORM_ABANDONER" || Math.random() > 0.82)) {
          current.setSeconds(current.getSeconds() + randomInt(2, 6));
          addEvent(events, {
            eventType: "form_validation_error",
            page,
            fieldName: field,
            formType: "investment_application",
            timestamp: new Date(current),
            device,
            browser,
            metadata: { ...baseMetadata, field, error: "invalid_format" },
          });
        }
      }

      current.setSeconds(current.getSeconds() + randomInt(8, 25));
      const completes = Math.random() < behavior.formCompletionRate;
      converted = completes;
      abandonedForm = !completes;
      if (completes && Math.random() < 0.55) {
        addEvent(events, {
          eventType: "otp_request",
          page,
          formType: "investment_application",
          timestamp: new Date(current),
          device,
          browser,
          metadata: { ...baseMetadata, form: "investment_application" },
        });
        current.setSeconds(current.getSeconds() + randomInt(5, 16));
      }
      addEvent(events, {
        eventType: completes ? "form_submit" : "form_abandon",
        page,
        formType: "investment_application",
        duration: Math.max(1, Math.round((current - pageEntry) / 1000)),
        timestamp: new Date(current),
        device,
        browser,
        metadata: {
          ...baseMetadata,
          form: "investment_application",
          completionPercent: completes ? 100 : randomChoice([40, 60, 80]),
          progress: completes ? 100 : randomChoice([40, 60, 80]),
        },
      });
    }

    if (page === "contact" && Math.random() > 0.55) {
      current.setSeconds(current.getSeconds() + randomInt(4, 12));
      addEvent(events, {
        eventType: "contact_advisor",
        page,
        element: "request-callback",
        timestamp: new Date(current),
        device,
        browser,
        metadata: { ...baseMetadata, channel: "callback" },
      });
    }

    const pageDuration = Math.max(
      5,
      Math.round((current - pageEntry) / 1000) + randomInt(behavior.dwellRange[0], behavior.dwellRange[1])
    );
    current.setSeconds(current.getSeconds() + pageDuration);
    addEvent(events, {
      eventType: "time_spent",
      page,
      duration: pageDuration,
      timestamp: new Date(current),
      device,
      browser,
      metadata: { ...baseMetadata, duration: pageDuration },
    });

    if ((persona === "HESITANT" || persona === "FORM_ABANDONER") && Math.random() > 0.55) {
      current.setSeconds(current.getSeconds() + randomInt(31, 65));
      addEvent(events, {
        eventType: "inactive_session",
        page,
        duration: randomInt(31, 65),
        timestamp: new Date(current),
        device,
        browser,
        metadata: { ...baseMetadata, idleTime: randomInt(31, 65) },
      });
    }
  });

  if (persona === "BOUNCER") {
    addEvent(events, {
      eventType: "bounce",
      page: journey[0],
      duration: randomInt(8, 25),
      timestamp: new Date(current),
      device,
      browser,
      metadata: baseMetadata,
    });
  }

  addEvent(events, {
    eventType: "session_end",
    page: visitedPages[visitedPages.length - 1] || journey[0],
    duration: Math.max(1, Math.round((current - startTime) / 1000)),
    timestamp: new Date(current),
    device,
    browser,
    metadata: baseMetadata,
  });

  return {
    events,
    visitedPages,
    sessionStart: startTime,
    sessionEnd: current,
    duration: Math.max(1, Math.round((current - startTime) / 1000)),
    conversion: converted,
    abandonedForm,
    bounce: persona === "BOUNCER",
    daysBack,
  };
};

const persistSession = async ({ user, sessionBlueprint, device, browser, location, source }) => {
  const session = await Session.create({
    userId: user._id,
    sessionStart: sessionBlueprint.sessionStart,
    sessionEnd: sessionBlueprint.sessionEnd,
    duration: sessionBlueprint.duration,
    pagesVisited: [...new Set(sessionBlueprint.visitedPages)],
    device,
    browser,
    location,
    entrySource: source,
    connectionOrigin: "internal",
    bounce: sessionBlueprint.bounce,
    returningUser: sessionBlueprint.daysBack > 0,
    conversion: sessionBlueprint.conversion,
    status: sessionBlueprint.bounce ? "abandoned" : "completed",
    lastActive: sessionBlueprint.sessionEnd,
    eventCount: sessionBlueprint.events.length,
    rapidClickCount: sessionBlueprint.events.filter((event) => event.eventType === "rapid_click").length,
    inactiveDetected: sessionBlueprint.events.some((event) => event.eventType === "inactive_session"),
    lastPage: sessionBlueprint.visitedPages[sessionBlueprint.visitedPages.length - 1] || null,
    navigationPath: sessionBlueprint.visitedPages.map((page) => ({ page, timestamp: sessionBlueprint.sessionStart })),
  });

  const docs = sessionBlueprint.events.map((event) => ({
    userId: user._id,
    sessionId: session._id,
    eventType: event.eventType,
    page: event.page,
    element: event.element || null,
    source: event.source || source,
    buttonName: event.buttonName || null,
    formType: event.formType || null,
    fieldName: event.fieldName || null,
    duration: event.duration || null,
    scrollDepth: event.scrollDepth || null,
    intentScore: event.intentScore || null,
    x: event.x ?? null,
    y: event.y ?? null,
    device,
    browser,
    metadata: event.metadata || {},
    timestamp: event.timestamp,
  }));

  await Event.insertMany(docs, { ordered: false });
  return { session, insertedEvents: docs.length };
};

const postToEngine = async ({ user, sessionBlueprint, engineUrl, delayMs = 15 }) => {
  let sent = 0;
  let failed = 0;

  for (const event of sessionBlueprint.events) {
    const metadata = event.metadata || {};
    const payload = {
      user_id: String(user._id),
      event_type: event.eventType,
      page_id: normalizePageForEngine(event.page),
      element_id: event.element || event.buttonName || event.fieldName || null,
      dwell_time: event.duration || metadata.duration || 0,
      scroll_depth: event.scrollDepth || metadata.depth || 0,
      idle_time: metadata.idleTime || (event.eventType === "inactive_session" ? event.duration || 0 : 0),
      mouse_move_count: metadata.moveCount || 0,
      x: event.x ?? metadata.x ?? null,
      y: event.y ?? metadata.y ?? null,
      metadata: {
        ...metadata,
        userEmail: user.email,
        userName: user.fullName,
        fullName: user.fullName,
        email: user.email,
        rawEventType: event.eventType,
      },
      timestamp: new Date(event.timestamp).getTime() / 1000,
    };

    try {
      const response = await fetch(engineUrl, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload),
      });

      if (!response.ok) {
        failed += 1;
      } else {
        sent += 1;
      }
    } catch {
      failed += 1;
    }

    if (delayMs > 0) await sleep(delayMs);
  }

  return { sent, failed };
};

const buildSessionEventsLive = ({ user, sessionId, persona, device, browser, source }) => {
  const viewport = VIEWPORTS[device];
  const events = [];
  const journey = makeJourney(persona);
  const visitedPages = [];
  const now = Date.now() / 1000;
  let elapsed = 0;
  const clientSessionId = `live_${sessionId}_${randomInt(1000, 9999)}`;

  const baseMetadata = {
    simulated: true,
    persona,
    userEmail: user.email,
    userName: user.fullName,
    trackingUserId: String(user._id),
    clientSessionId,
    screenWidth: viewport.width,
    screenHeight: viewport.height,
    connectionOrigin: "simulated",
  };

  journey.forEach((page, pageIndex) => {
    const def = PAGE_DEFS[page] || PAGE_DEFS.landing;
    visitedPages.push(page);

    events.push({
      eventType: pageIndex > 0 && journey.indexOf(page) !== pageIndex ? "repeated_page_visit" : "page_view",
      page,
      source,
      timestamp: now + elapsed,
      device,
      browser,
      metadata: { ...baseMetadata, pageIndex },
    });

    const interactions = randomInt(5, 12);
    for (let i = 0; i < interactions; i++) {
      elapsed += randomInt(2, 8);
      const element = randomChoice(def.elements);
      const point = jitterPoint(element, viewport);
      const roll = Math.random();

      if (roll < 0.22) {
        events.push({
          eventType: "scroll_depth",
          page,
          scrollDepth: randomChoice([25, 50, 75, 100]),
          duration: randomInt(2, 9),
          timestamp: now + elapsed,
          device,
          browser,
          metadata: { ...baseMetadata, depth: randomChoice([25, 50, 75, 100]) },
        });
      } else if (roll < 0.38) {
        events.push({
          eventType: "hover",
          page,
          element: element.id,
          duration: randomInt(1, 6),
          x: point.x,
          y: point.y,
          timestamp: now + elapsed,
          device,
          browser,
          metadata: { ...baseMetadata, element: element.id, label: element.label },
        });
      } else if (roll < 0.48) {
        events.push({
          eventType: "mouse_movement",
          page,
          x: point.x,
          y: point.y,
          timestamp: now + elapsed,
          device,
          browser,
          metadata: { ...baseMetadata, moveCount: randomInt(15, 130) },
        });
      } else {
        events.push({
          eventType: Math.random() > 0.9 ? "cta_click" : "button_click",
          page,
          element: element.id,
          buttonName: element.label,
          x: point.x,
          y: point.y,
          timestamp: now + elapsed,
          device,
          browser,
          metadata: { ...baseMetadata, element: element.id, label: element.label, globalClick: true },
        });
      }
    }

    elapsed += randomInt(15, 55);
    events.push({
      eventType: "time_spent",
      page,
      duration: randomInt(15, 55),
      timestamp: now + elapsed,
      device,
      browser,
      metadata: { ...baseMetadata, duration: randomInt(15, 55) },
    });
  });

  return { events, visitedPages };
};

const postEventToEngine = async (event, engineUrl) => {
  const metadata = event.metadata || {};
  const payload = {
    user_id: String(event._userId),
    event_type: event.eventType,
    page_id: normalizePageForEngine(event.page),
    element_id: event.element || event.buttonName || null,
    dwell_time: event.duration || metadata.duration || 0,
    scroll_depth: event.scrollDepth || metadata.depth || 0,
    idle_time: metadata.idleTime || 0,
    mouse_move_count: metadata.moveCount || 0,
    x: event.x ?? null,
    y: event.y ?? null,
    metadata: {
      ...metadata,
      rawEventType: event.eventType,
      // Engine uses these keys for session metadata & deduplication
      email: metadata.userEmail || metadata.email || null,
      name: metadata.userName || metadata.fullName || null,
      client_session_id: metadata.clientSessionId || null,
    },
    timestamp: event.timestamp,
  };

  try {
    const res = await fetch(engineUrl, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(payload),
    });
    return res.ok;
  } catch {
    return false;
  }
};

const runLiveMode = async (args) => {
  console.log("\n=== LIVE ENGINE MODE ===");
  console.log("Events sent directly to engine — no MongoDB required.");
  console.log(`Sessions will stay alive for ${args.liveMinutes} minutes.\n`);

  // Check engine health
  try {
    const health = await fetch(args.engineUrl.replace("/analyze", "/"));
    if (!health.ok) throw new Error("not ok");
    const data = await health.json();
    console.log(`Engine online: ${data.engine} (${data.active_sessions} active sessions)\n`);
  } catch {
    console.error(`Cannot reach engine at ${args.engineUrl}. Start it first:`);
    console.error("  cd engine && python -m uvicorn engine.main:app --port 8000");
    process.exit(1);
  }

  const liveUsers = [];

  for (let i = 1; i <= args.users; i++) {
    const runId = makeRunId();
    const userData = makeDummyUserData(runId, i, args.emailDomain);
    const user = { _id: `live_${runId}_${i}`, ...userData };
    const persona = pickPersona();
    const device = randomChoice(["desktop", "desktop", "desktop", "mobile", "tablet"]);
    const browser = randomChoice(BROWSERS);
    const source = randomChoice(SOURCES);

    console.log(`[${i}/${args.users}] ${user.fullName} <${user.email}> (${persona})`);

    const sessionBlueprint = buildSessionEvents({
      user,
      sessionId: `live_${i}`,
      persona,
      device,
      browser,
      source,
      startTime: new Date(),
      daysBack: 0,
    });

    const result = await postToEngine({
      user,
      sessionBlueprint,
      engineUrl: args.engineUrl,
      delayMs: 20,
    });

    console.log(`  -> ${result.sent}/${sessionBlueprint.events.length} events sent, journey: ${sessionBlueprint.visitedPages.join(" -> ")}`);

    liveUsers.push({ user, persona, events: sessionBlueprint.events, visitedPages: sessionBlueprint.visitedPages });
    await sleep(300);
  }

  console.log(`\n>> ${liveUsers.length} live dummy users created.`);
  console.log("   They are now visible in Session Timeline and Heatmap.");
  console.log(`   Keeping sessions alive for ${args.liveMinutes} minutes...`);
  console.log("   Press Ctrl+C to stop early.\n");

  // Keep-alive loop: send periodic activity to prevent session staleness
  const startTime = Date.now();
  const endTime = args.liveMinutes * 60 * 1000;
  const pingEvery = 60_000; // every 60s

  const keepAlive = setInterval(async () => {
    const elapsed = Date.now() - startTime;
    if (elapsed >= endTime) {
      clearInterval(keepAlive);
      console.log(`\n>> ${args.liveMinutes} minutes elapsed. Sessions will expire naturally.`);
      console.log("   Done.");
      process.exit(0);
    }

    const remaining = Math.round((endTime - elapsed) / 1000);
    const now = Date.now() / 1000;

    for (const { user, persona, visitedPages } of liveUsers) {
      const page = randomChoice(visitedPages);
      await postEventToEngine({
        _userId: String(user._id),
        eventType: "mouse_movement",
        page,
        timestamp: now,
        metadata: {
          simulated: true,
          persona,
          userEmail: user.email,
          userName: user.fullName,
          email: user.email,
          name: user.fullName,
          clientSessionId: `live_keep_${user._id}`,
          moveCount: randomInt(1, 5),
          keepAlive: true,
        },
      }, args.engineUrl);
    }

    console.log(`  [${Math.round(elapsed / 1000)}s] Pinged ${liveUsers.length} sessions — ${remaining}s remaining`);
  }, pingEvery);
};

const summarize = (summary) => {
  console.log("\nHuman traffic simulation complete");
  console.log("---------------------------------");
  console.log(`Run ID: ${summary.runId}`);
  console.log(`Dummy users: ${summary.users}`);
  console.log(`Sessions: ${summary.sessions}`);
  console.log(`Conversions: ${summary.conversions}`);
  console.log(`Form abandons: ${summary.formAbandons}`);
  console.log(`Bounces: ${summary.bounces}`);
  console.log(`Mongo events: ${summary.mongoEvents}`);
  console.log(`Engine events sent: ${summary.engineEvents}`);
  console.log(`Engine failures: ${summary.engineFailures}`);
  console.log(`Dummy email domain: ${summary.emailDomain}`);
  console.log("Persona mix:");
  Object.entries(summary.personas)
    .sort((a, b) => b[1] - a[1])
    .forEach(([persona, count]) => console.log(`  ${persona}: ${count}`));
};

const main = async () => {
  const args = parseArgs();

  // Live mode: engine-only, real-time, keep sessions alive
  if (args.mode === "live") {
    return runLiveMode(args);
  }

  const persistToDb = ["both", "db"].includes(args.mode);
  const pushToEngine = ["both", "engine"].includes(args.mode);
  const runId = makeRunId();

  if (args.dryRun) {
    console.log("Dry run enabled. No database writes or engine posts will be made.");
  }

  if (persistToDb && !args.dryRun) {
    console.log("Connecting to MongoDB...");
    await connectMongo();
  }

  const summary = {
    runId,
    users: 0,
    sessions: 0,
    conversions: 0,
    formAbandons: 0,
    bounces: 0,
    mongoEvents: 0,
    engineEvents: 0,
    engineFailures: 0,
    emailDomain: args.emailDomain,
    personas: {},
  };

  for (let userIndex = 1; userIndex <= args.users; userIndex += 1) {
    const userData = makeDummyUserData(runId, userIndex, args.emailDomain);
    const user = args.dryRun
      ? { _id: `dry_${runId}_${userIndex}`, ...userData }
      : await createDummyUser(userData, persistToDb);
    const persona = pickPersona();
    summary.personas[persona] = (summary.personas[persona] || 0) + 1;

    summary.users += 1;
    console.log(`\n[${userIndex}/${args.users}] ${user.fullName} <${user.email}> (${persona})`);

    for (let sessionIndex = 1; sessionIndex <= args.sessions; sessionIndex += 1) {
      const device = randomChoice(["desktop", "desktop", "desktop", "mobile", "tablet"]);
      const browser = randomChoice(BROWSERS);
      const location = randomChoice(LOCATIONS);
      const source = randomChoice(SOURCES);
      const daysBack = randomInt(0, args.days);
      const startTime = makeTimestamp(daysBack);

      const sessionBlueprint = buildSessionEvents({
        user,
        sessionId: `${runId}_${userIndex}_${sessionIndex}`,
        persona,
        device,
        browser,
        source,
        startTime,
        daysBack,
      });

      summary.sessions += 1;
      if (sessionBlueprint.conversion) summary.conversions += 1;
      if (sessionBlueprint.abandonedForm) summary.formAbandons += 1;
      if (sessionBlueprint.bounce) summary.bounces += 1;

      if (args.dryRun) {
        console.log(`  session ${sessionIndex}: ${sessionBlueprint.events.length} events, ${sessionBlueprint.visitedPages.join(" -> ")}`);
        continue;
      }

      if (persistToDb) {
        const persisted = await persistSession({ user, sessionBlueprint, device, browser, location, source });
        summary.mongoEvents += persisted.insertedEvents;
      }

      if (pushToEngine) {
        const result = await postToEngine({ user, sessionBlueprint, engineUrl: args.engineUrl });
        summary.engineEvents += result.sent;
        summary.engineFailures += result.failed;
      }

      console.log(`  session ${sessionIndex}: ${sessionBlueprint.events.length} events, ${sessionBlueprint.visitedPages.join(" -> ")}`);
    }
  }

  if (mongoose.connection.readyState !== 0) {
    await mongoose.connection.close();
  }

  summarize(summary);

  if (pushToEngine && summary.engineFailures > 0) {
    console.log(`\nNote: ${summary.engineFailures} engine event(s) failed. Start the engine or use --mode=db if you only need Mongo seed data.`);
  }
};

main().catch(async (error) => {
  console.error("\nHuman traffic simulation failed:");
  console.error(error.message);

  if (mongoose.connection.readyState !== 0) {
    await mongoose.connection.close();
  }

  process.exit(1);
});
