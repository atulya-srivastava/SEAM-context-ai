import { createClient } from "@supabase/supabase-js";
import { GoogleGenAI } from "@google/genai";
import { pipeline } from "@xenova/transformers";
import dotenv from "dotenv";

dotenv.config();

export const supabase = createClient(
  process.env.SUPABASE_URL,
  process.env.SUPABASE_SERVICE_ROLE_KEY // service role for backend operations
);

let localExtractor = null;

export async function getEmbedding(text) {
  // Always use local 768-dim model (Xenova/all-mpnet-base-v2) for 100% vector consistency with stored Supabase embeddings
  try {
    if (!localExtractor) {
      console.log("📦 Loading local 768-dim embedding model (Xenova/all-mpnet-base-v2)...");
      localExtractor = await pipeline("feature-extraction", "Xenova/all-mpnet-base-v2");
    }
    const output = await localExtractor(text, { pooling: "mean", normalize: true });
    return Array.from(output.data); // 768-dim float array
  } catch (localErr) {
    console.error("❌ Local embedding error:", localErr);
    throw localErr;
  }
}

export async function addDocuments(docs, userId) {
  for (const doc of docs) {
    const embedding = await getEmbedding(doc.text);
    const { error } = await supabase.from("github_code").upsert({
      id: doc.id,
      content: doc.text,
      embedding: embedding,
      user_id: userId,
      ...doc.metadata,
    });
    if (error) console.error("Insert error:", error);
  }
}

export async function searchDocuments(query, userId, filters = {}, limit = 5) {
  const embedding = await getEmbedding(query);
  const { data, error } = await supabase.rpc("match_github_code", {
    query_embedding: embedding,
    match_count: limit,
    filter_user_id: userId,
    filter_repo: filters.repo || null,
    filter_branch: filters.branch || null,
  });
  if (error) throw error;
  return data;
}

export async function deleteByBranch(repo, branch, userId) {
  const { error } = await supabase
    .from("github_code")
    .delete()
    .match({ repo, branch, user_id: userId });
  if (error) throw error;
}
