import { GoogleGenAI } from "@google/genai";

const apiKey = process.env.GEMINI_API_KEY;

if (!apiKey) {
  console.warn(
    "WARNING: GEMINI_API_KEY is not set. AI features (compatibility analysis, oracle, chat) will not work. Get a key from https://aistudio.google.com/app/apikey",
  );
}

export const ai = new GoogleGenAI({
  apiKey: apiKey || "dummy-key",
});
