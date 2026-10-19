import { GoogleGenAI } from "@google/genai";
import { AIProviderError } from "../utils/AppError.js";

const SYSTEM_PROMPT = `You are a focused technical assistant embedded in a ChatGPT-clone learning project.

Only answer questions about programming, software engineering, computer science, and IT-related topics — for example programming languages, frameworks, algorithms, data structures, databases, debugging, DevOps, networking, and system design.

If the user asks about anything unrelated to these areas (for example food, relationships, sports, general trivia, etc.), politely decline and redirect them back to asking a programming or IT-related question instead. Do not answer the unrelated question, even partially.

Keep answers clear, correct, and reasonably concise. Use markdown, including fenced code blocks, when showing code.`;

const MODEL = process.env.GEMINI_MODEL || "gemini-3.5-flash-lite";

// Caps how long a single reply is allowed to be. Configurable via .env so you
// can tune cost/latency vs. answer length without touching code.
const MAX_OUTPUT_TOKENS = Number(process.env.GEMINI_MAX_OUTPUT_TOKENS) || 300;

let client = null;

const getClient = () => {
  if (!process.env.GEMINI_API_KEY) {
    throw new AIProviderError(
      "GEMINI_API_KEY is not set. Add it to backend/.env.",
    );
  }

  if (!client) {
    client = new GoogleGenAI({ apiKey: process.env.GEMINI_API_KEY });
  }

  return client;
};

// Gemini's Content type only accepts role "user" or "model" — our database
// stores "assistant", so it needs to be translated on the way out.
const toGeminiContents = (history, question) => [
  ...history.map((msg) => ({
    role: msg.role === "assistant" ? "model" : "user",
    parts: [{ text: msg.content }],
  })),
  { role: "user", parts: [{ text: question }] },
];

export const getAssistantReply = async (question, history = []) => {
  try {
    const ai = getClient();

    const response = await ai.models.generateContent({
      model: MODEL,
      contents: toGeminiContents(history, question),
      config: {
        systemInstruction: SYSTEM_PROMPT,
        maxOutputTokens: MAX_OUTPUT_TOKENS,
      },
    });

    const reply = response.text?.trim();

    if (!reply) {
      throw new Error("Empty response from AI provider.");
    }

    const tokenCount = response.usageMetadata?.totalTokenCount ?? null;

    return { content: reply, tokenCount };
  } catch (error) {
    if (error instanceof AIProviderError) {
      throw error;
    }

    console.error("AI provider error:", error.message);
    throw new AIProviderError(
      "There was an error generating a response. Please try again.",
    );
  }
};
