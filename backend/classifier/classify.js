import { pipeline, env } from "@xenova/transformers";
import path from "path";
import { fileURLToPath } from "url";

const __dirname = path.dirname(fileURLToPath(import.meta.url));

// Tell @xenova/transformers to look for models in the classifier directory
env.localModelPath = __dirname;
env.allowRemoteModels = false;

let classifier = null;

export async function loadClassifier() {
  if (!classifier) {
    console.log("🧠 Loading intent classifier...");
    classifier = await pipeline("text-classification", "model", {
      quantized: false,
    });
    console.log("✅ Intent classifier loaded");
  }
  return classifier;
}

export async function classifyIntent(text) {
  const clf = await loadClassifier();
  const [result] = await clf(text);
  return result.label; // "github" | "integration" | "general"
}
