import { pipeline, env } from "@xenova/transformers";
import path from "path";
import { fileURLToPath } from "url";

const __dirname = path.dirname(fileURLToPath(import.meta.url));

let classifier = null;

export async function loadClassifier() {
  if (!classifier) {
    console.log("🧠 Loading local fine-tuned intent classifier...");
    env.localModelPath = __dirname;
    env.allowRemoteModels = false;
    classifier = await pipeline("text-classification", "model", {
      quantized: true,
      local_files_only: true,
    });
    console.log("✅ Local fine-tuned intent classifier loaded");
  }
  return classifier;
}

/*
const GENERAL_GREETINGS = [
  "hello", "hi", "hey", "hello there", "hi there", "hey there",
  "good morning", "good afternoon", "good evening", "how are you",
  "who are you", "what can you do", "help", "thanks", "thank you"
];

const GITHUB_KEYWORDS = [
  "in this project", "this project", "in this repo", "in this repository",
  "our project", "our repo", "project", "repo", "repository", "github",
  "commit", "routing", "route", "routes", "branch", "pr", "pull request",
  "function", "codebase", "api gateway", "api-gateway", "annotationplus",
  "seam", "backend", "frontend", "file", "line", "variable", "class", "method"
];
*/

export async function classifyIntent(text) {
  const startTime = Date.now();

  // Keyword overrides commented out to test raw ONNX model predictions directly
  const clf = await loadClassifier();
  const [result] = await clf(text);
  const label = result.label;
  const score = result.score;

  const duration = Date.now() - startTime;
  const confidence = (score * 100).toFixed(2);

  console.log(`\n=================== INTENT CLASSIFIER LOG ===================`);
  console.log(` User Query: "${text}"`);
  console.log(` Predicted Intent: [ ${label.toUpperCase()} ]`);
  console.log(` Confidence Score: ${confidence}%`);
  console.log(` Inference Time: ${duration}ms`);
  console.log(`=================================================================\n`);

  return label; // "github" | "integration" | "general"
}
