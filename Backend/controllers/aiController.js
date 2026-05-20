const { generateChatReply, hasLLM } = require("../services/llmService");

const sanitizeRoute = (route, fallback = null) => {
  if (!route || typeof route !== "string") return fallback;
  return route.startsWith("/") ? route : fallback;
};

const chat = async (req, res) => {
  try {
    const { prompt, context, lastInteraction, history } = req.body;
    if (!prompt || !String(prompt).trim()) {
      return res.status(400).json({ success: false, message: "prompt is required" });
    }

    const reply = await generateChatReply({
      prompt: String(prompt).trim(),
      context: context || {},
      lastInteraction: lastInteraction || null,
      history: Array.isArray(history) ? history : [],
    });

    if (!reply) {
      return res.status(503).json({
        success: false,
        message: "No LLM provider configured. Add OPENAI_API_KEY or GEMINI_API_KEY to Backend/.env.",
        provider: "fallback",
      });
    }

    return res.json({
      success: true,
      provider: hasLLM() ? "llm" : "fallback",
      data: {
        text: String(reply.text || "").trim(),
        intent: String(reply.intent || "general_guidance"),
        route: sanitizeRoute(reply.route),
      },
    });
  } catch (error) {
    console.error(`AI chat error: ${error.message}`);
    return res.status(502).json({
      success: false,
      message: "LLM request failed",
    });
  }
};

module.exports = { chat };
