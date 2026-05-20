const OPENAI_URL = "https://api.openai.com/v1/chat/completions";

const hasOpenAI = () => Boolean(process.env.OPENAI_API_KEY);
const hasGemini = () => Boolean(process.env.GEMINI_API_KEY || process.env.GOOGLE_API_KEY);

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

async function callGemini(prompt, options = {}) {
  const key = process.env.GEMINI_API_KEY || process.env.GOOGLE_API_KEY;
  // Fallback chain: preferred → cheap/free models that have generous free-tier quotas
  const preferred = process.env.GEMINI_MODEL || "gemini-2.0-flash-lite";
  const models = [...new Set([preferred, "gemini-2.0-flash-lite", "gemini-1.5-flash", "gemini-2.0-flash"])];
  let lastError = "";

  for (const model of models) {
    try {
      const response = await fetch(
        `https://generativelanguage.googleapis.com/v1beta/models/${model}:generateContent?key=${key}`,
        {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            contents: [{ role: "user", parts: [{ text: prompt }] }],
            generationConfig: {
              temperature: options.temperature ?? 0.45,
              maxOutputTokens: options.maxTokens || 500,
              responseMimeType: options.json ? "application/json" : "text/plain",
            },
          }),
        }
      );

      if (response.ok) {
        const data = await response.json();
        return data.candidates?.[0]?.content?.parts?.map((part) => part.text || "").join("") || "";
      }

      lastError = `${response.status} ${(await response.text()).slice(0, 200)}`;
      // On 429 (quota) or 404 (not found), try next model
      if (response.status !== 429 && response.status !== 404) break;
    } catch (err) {
      lastError = err.message;
      continue;
    }
  }

  throw new Error(`Gemini request failed: ${lastError}`);
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

  if (hasOpenAI()) {
    const content = await callOpenAI(
      [
        { role: "system", content: system },
        ...compactHistory,
        { role: "user", content: JSON.stringify(userPayload) },
      ],
      { json: true, maxTokens: 450 }
    );
    return cleanJson(content);
  }

  if (hasGemini()) {
    const content = await callGemini(
      `${system}\nConversation: ${JSON.stringify(compactHistory)}\nUser payload: ${JSON.stringify(userPayload)}`,
      { json: true, maxTokens: 450 }
    );
    return cleanJson(content);
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

  try {
    if (hasOpenAI()) {
      return cleanJson(await callOpenAI(
        [
          { role: "system", content: instruction },
          { role: "user", content: JSON.stringify(payload) },
        ],
        { json: true, maxTokens: 220 }
      ));
    }

    if (hasGemini()) {
      return cleanJson(await callGemini(`${instruction}\n${JSON.stringify(payload)}`, {
        json: true,
        maxTokens: 220,
      }));
    }
  } catch (error) {
    console.warn(`LLM popup generation failed: ${error.message}`);
  }

  return fallback;
}

module.exports = {
  generateChatReply,
  generatePopupCopy,
  hasLLM: () => hasOpenAI() || hasGemini(),
};
