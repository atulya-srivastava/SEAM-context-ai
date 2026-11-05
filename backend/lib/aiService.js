// backend/lib/aiService.js
const AI_SERVICE_URL = process.env.AI_SERVICE_URL || "http://localhost:8000";

/**
 * Sends a chat request to the FastAPI AI microservice.
 * Returns { text, intent } on success, or null if service is offline/errored.
 */
export async function askAIService(prompt, history = []) {
  try {
    const response = await fetch(`${AI_SERVICE_URL}/api/ai/chat`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ prompt, history }),
      signal: AbortSignal.timeout(10000), // 10s timeout
    });

    if (!response.ok) {
      console.warn(`[AI Service] Returned status ${response.status}. Falling back.`);
      return null;
    }

    const data = await response.json();
    return { text: data.text, intent: data.intent };
  } catch (err) {
    // Graceful silent fallback if FastAPI is offline
    console.warn(`[AI Service] Offline (${err.message}). Using local fallback.`);
    return null;
  }
}

/**
 * Classifies query intent using the FastAPI microservice (<6ms ONNX).
 * Returns string intent (e.g. 'github' | 'integration' | 'general') or null on error.
 */
export async function classifyWithAIService(text) {
  try {
    const response = await fetch(`${AI_SERVICE_URL}/api/ai/classify`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ text }),
      signal: AbortSignal.timeout(3000), // 3s timeout
    });

    if (!response.ok) return null;
    const data = await response.json();
    return data.intent || null;
  } catch (err) {
    return null;
  }
}

