import { createClient } from "@supabase/supabase-js";
import dotenv from "dotenv";

dotenv.config();

export const supabase = createClient(
  process.env.SUPABASE_URL,
  process.env.SUPABASE_SERVICE_ROLE_KEY // service role for backend operations
);

export async function getEmbedding(text) {
  // Use Google Gemini API (gemini-embedding-001 with outputDimensionality: 768)
  // 0 MB server RAM, 0 MB disk, 100% vector consistency with Supabase 768-dim column
  const apiKey = process.env.GEMINI_API_KEY;
  if (!apiKey) {
    throw new Error("GEMINI_API_KEY is missing in environment variables.");
  }

  const modelName = "models/gemini-embedding-001";
  const url = `https://generativelanguage.googleapis.com/v1beta/${modelName}:embedContent?key=${apiKey}`;

  try {
    const res = await fetch(url, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        content: {
          parts: [{ text: text.slice(0, 8000) }] // Sanitize input text length
        },
        outputDimensionality: 768
      })
    });

    const data = await res.json();

    if (!res.ok) {
      console.error("❌ Gemini Embedding API Error:", data);
      throw new Error(`Gemini Embedding API Error: ${data.error?.message || res.statusText}`);
    }

    const embedding = data.embedding?.values;
    if (!embedding || !Array.isArray(embedding) || embedding.length !== 768) {
      throw new Error(`Invalid embedding vector received from Gemini API (Length: ${embedding?.length || 0})`);
    }

    return embedding; // 768-dim float array
  } catch (err) {
    console.error("❌ Failed to get Gemini embedding:", err.message);
    throw err;
  }
}

export async function addDocuments(docs, userId) {
  console.log(`📦 [EMBEDDING LOG] Starting embedding creation for ${docs.length} documents...`);
  for (let i = 0; i < docs.length; i++) {
    const doc = docs[i];
    try {
      const embedding = await getEmbedding(doc.text);
      const { error } = await supabase.from("github_code").upsert({
        id: doc.id,
        content: doc.text,
        embedding: embedding,
        user_id: userId,
        ...doc.metadata,
      });

      if (error) {
        console.error(`❌ [EMBEDDING LOG] Supabase DB Insert failed for doc [${doc.id}]:`, error);
        throw new Error(`Supabase DB Insert Error: ${error.message} (Details: ${error.details || ''})`);
      }
      console.log(`✅ [EMBEDDING LOG] [${i + 1}/${docs.length}] Embedded & stored: ${doc.id}`);
    } catch (embErr) {
      console.error(`❌ [EMBEDDING LOG] Error embedding document [${doc.id}]:`, embErr.message);
      throw embErr;
    }
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
