// Supabase client + Gemini embedding (replaces chroma.js + Cohere)
import { createClient } from "@supabase/supabase-js";
import { GoogleGenAI } from "@google/genai";
import dotenv from "dotenv";

dotenv.config();

export const supabase = createClient(
  process.env.SUPABASE_URL,
  process.env.SUPABASE_SERVICE_ROLE_KEY // service role for backend operations
);

const genai = new GoogleGenAI({ apiKey: process.env.GEMINI_API_KEY });

export async function getEmbedding(text) {
  const result = await genai.models.embedContent({
    model: "text-embedding-004",
    contents: text,
  });
  return result.embedding.values; // 768-dim float array
}

export async function addDocuments(docs, userId) {
  for (const doc of docs) {
    const embedding = await getEmbedding(doc.text);
    const { error } = await supabase.from("github_code").upsert({
      id: doc.id,
      content: doc.text,
      embedding: JSON.stringify(embedding),
      user_id: userId,
      ...doc.metadata,
    });
    if (error) console.error("Insert error:", error);
  }
}

export async function searchDocuments(query, userId, filters = {}, limit = 5) {
  const embedding = await getEmbedding(query);
  const { data, error } = await supabase.rpc("match_github_code", {
    query_embedding: JSON.stringify(embedding),
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
