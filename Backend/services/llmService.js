const Groq = require("groq-sdk");

const OPENAI_URL = "https://api.openai.com/v1/chat/completions";

const groq = process.env.GROQ_API_KEY ? new Groq({ apiKey: process.env.GROQ_API_KEY }) : null;

const hasOpenAI = () => Boolean(process.env.OPENAI_API_KEY);
const hasGroq = () => Boolean(groq);

const cleanJson = (text) => {
  const trimmed = String(text || "").trim();
  const fenced = trimmed.match(/```(?:json)?\s*([\s\S]*?)```/i);
  const raw = fenced ? fenced[1] : trimmed;
  return JSON.parse(raw);
};

async function callOpenAI(messages, options = {}) {
  const response = await fetch(OPENAI_URL, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      Authorization: `Bearer ${process.env.OPENAI_API_KEY}`,
    },
    body: JSON.stringify({
      model: process.env.OPENAI_MODEL || "gpt-4o-mini",
      messages,
      temperature: options.temperature ?? 0.45,
      max_tokens: options.maxTokens || 500,
      response_format: options.json ? { type: "json_object" } : undefined,
    }),
  });

  if (!response.ok) {
    const errorText = await response.text();
    throw new Error(`OpenAI request failed: ${response.status} ${errorText.slice(0, 200)}`);
  }

  const data = await response.json();
  return data.choices?.[0]?.message?.content || "";
}

async function callGroq(messages, options = {}) {
  if (!groq) {
    throw new Error("Groq API Key is not configured.");
  }

  try {
    const chatCompletion = await groq.chat.completions.create({
      messages: messages,
      model: "llama-3.3-70b-versatile",
      temperature: options.temperature ?? 0.45,
      max_completion_tokens: options.maxTokens || 500,
      response_format: options.json ? { type: "json_object" } : undefined,
    });

    return chatCompletion.choices?.[0]?.message?.content || "";
  } catch (err) {
    throw new Error(`Groq request failed: ${err.message}`);
  }
}

async function generateChatReply({ prompt, context = {}, lastInteraction = null, history = [] }) {
  const system = [
    "You are Finova AI, a concise fintech investment guidance assistant.",
    "Give practical, non-advisory educational guidance for SIPs, mutual funds, retirement, tax saving, insurance, and application recovery.",
    "Use the current page context and last behavior signal. Never promise guaranteed returns.",
    "Return JSON with keys: text, intent, route.",
  ].join(" ");

  const compactHistory = history.slice(-8).map((message) => ({
    role: message.role === "user" ? "user" : "assistant",
    content: String(message.text || "").slice(0, 500),
  }));

  const userPayload = {
    prompt,
    context,
    lastInteraction,
    allowedRoutes: [
      "/plan-comparison",
      "/investment-calculator",
      "/retirement-planning",
      "/tax-saving",
      "/sip-plans",
      "/mutual-funds",
      "/insurance-plans",
      "/checkout/wealth-core",
    ],
  };

  const messages = [
    { role: "system", content: system },
    ...compactHistory,
    { role: "user", content: JSON.stringify(userPayload) },
  ];

  if (hasOpenAI()) {
    try {
      const content = await callOpenAI(messages, { json: true, maxTokens: 450 });
      return cleanJson(content);
    } catch (error) {
      console.warn(`OpenAI failed, falling back to Groq if available: ${error.message}`);
    }
  }

  if (hasGroq()) {
    try {
      const content = await callGroq(messages, { json: true, maxTokens: 450 });
      return cleanJson(content);
    } catch (error) {
      console.error(`Groq chat failed: ${error.message}`);
    }
  }

  return null;
}

async function generatePopupCopy({ rule, reason, page, interests, fatigueScore, intentScore }) {
  const fallback = null;
  const payload = { rule, reason, page, interests, fatigueScore, intentScore };
  const instruction = [
    "Create one short contextual fintech engagement popup.",
    "Return JSON with title, message, cta, ctaLink.",
    "Keep title under 45 chars and message under 130 chars.",
    "Do not guarantee returns. Be helpful, specific, and not pushy.",
  ].join(" ");

  const messages = [
    { role: "system", content: instruction },
    { role: "user", content: JSON.stringify(payload) },
  ];

  try {
    if (hasOpenAI()) {
      return cleanJson(await callOpenAI(messages, { json: true, maxTokens: 220 }));
    }
  } catch (error) {
    console.warn(`OpenAI popup generation failed: ${error.message}`);
  }

  try {
    if (hasGroq()) {
      return cleanJson(await callGroq(messages, { json: true, maxTokens: 220 }));
    }
  } catch (error) {
    console.error(`Groq popup generation failed: ${error.message}`);
  }

  return fallback;
}

module.exports = {
  generateChatReply,
  generatePopupCopy,
  hasLLM: () => hasOpenAI() || hasGroq(),
};
