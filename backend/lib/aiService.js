// backend/lib/aiService.js
const AI_SERVICE_URL = (process.env.AI_SERVICE_URL || "http://localhost:8000").replace(/\/$/, "");

/**
 * Sends a chat request to the FastAPI AI microservice.
 * Returns { text, intent, provider: "fastapi" } on success, or null if service is offline/errored.
 */
export async function askAIService(prompt, history = []) {
  const endpoint = `${AI_SERVICE_URL}/api/ai/chat`;
  try {
    console.log(`[AI Service] Querying FastAPI at: ${endpoint}`);
    const response = await fetch(endpoint, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ prompt, history }),
      signal: AbortSignal.timeout(15000), // 15s timeout
    });

    if (!response.ok) {
      console.warn(`[AI Service] ${endpoint} returned HTTP ${response.status}. Falling back.`);
      return null;
    }

    const data = await response.json();
    console.log(`[AI Service] ✅ FastAPI responded successfully (Intent: ${data.intent || 'general'})`);
    return { text: data.text, intent: data.intent, provider: "fastapi" };
  } catch (err) {
    console.warn(`[AI Service] ⚠️ Could not reach FastAPI at ${endpoint} (${err.message}). Using local Node fallback.`);
    return null;
  }
}

/**
 * Classifies query intent using the FastAPI microservice (<6ms ONNX).
 * Returns string intent (e.g. 'github' | 'integration' | 'general') or null on error.
 */
export async function classifyWithAIService(text) {
  const endpoint = `${AI_SERVICE_URL}/api/ai/classify`;
  try {
    const response = await fetch(endpoint, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ text }),
      signal: AbortSignal.timeout(5000), // 5s timeout
    });

    if (!response.ok) return null;
    const data = await response.json();
    return data.intent || null;
  } catch (err) {
    return null;
  }
}

