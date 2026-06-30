import express from "express";
import { addDocuments, searchDocuments, getEmbedding } from "../supabase.js";
import GithubConnection from "../models/GithubConnection.js";
import { ClerkExpressRequireAuth } from "@clerk/clerk-sdk-node";
import { groq } from "../groq.js";
import { InferenceClient } from "@huggingface/inference";

const router = express.Router();

router.post("/import", ClerkExpressRequireAuth(), async (req, res) => {

});

export default router;

