import { pipeline } from "@xenova/transformers";
import path from "path";
import { fileURLToPath } from "url";

const __dirname = path.dirname(fileURLToPath(import.meta.url));

let classifier = null;

export async function loadClassifier() {
  if (!classifier) {
    console.log("🧠 Loading intent classifier...");
    const modelPath = path.join(__dirname, "model");
    classifier = await pipeline("text-classification", modelPath, {
      local_files_only: true,
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
