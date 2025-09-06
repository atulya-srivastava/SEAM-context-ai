
import axios from "axios";
import { CloudClient } from "chromadb";
import { InferenceClient } from "@huggingface/inference";
import dotenv from "dotenv";
import { CohereClient } from "cohere-ai";

dotenv.config();


export const client = new CloudClient({
    apiKey: process.env.CHROMA_API_KEY,
    tenant: process.env.CHROMA_TENANT_ID,
    database: process.env.CHROMA_DB_NAME,
});

console.log("HF_TOKEN:", process.env.HF_TOKEN);

const cohere = new CohereClient({
    token: process.env.COHERE_API_KEY,
});


export async function getEmbedding(text) {
  try {
    const response = await cohere.embed({
      model: "embed-english-v3.0",   // or "embed-multilingual-v3.0"
      texts: [text],
      input_type: "search_document", // 👈 required
    });

    return response.embeddings[0];
  } catch (err) {
    console.error("❌ Cohere embedding error:", err);
    throw err;
  }
}

export async function getCollection() {
  return client.getOrCreateCollection({
    name: "github_code",
    dimension: 384, // Cohere embed-english-v3.0
  });
}
 
export async function addToChroma(docs) {
    const collection = await getCollection();

    for (const doc of docs) {
        const embedding = await getEmbedding(doc.text);

        await collection.add({
            ids: [doc.id.toString()],
            documents: [doc.text],
            embeddings: [embedding],
            metadatas: [doc.metadata],
        });
    }
}

export async function deleteBranchData({ owner, repo, branch }) {
    const collection = await getCollection();
    await collection.delete({ where: { owner, repo, branch } });
}
