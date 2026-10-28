# SEAM — Interview Question Bank

---

## 🧠 1. The "Big Picture" Questions
*These come first. If you fumble here, they stop listening.*

**Q1. Walk me through SEAM in 60 seconds.**
> Tip: Say the problem → solution → tech stack → what you're proud of. Don't list features.

**Q2. What problem does SEAM actually solve? Why not just use Ctrl+F in Slack?**
> Answer: Ctrl+F only works within one platform and matches exact text. SEAM does semantic search across ALL platforms simultaneously — you can ask "what was the decision about the API rate limit last month?" and it'll pull relevant results from GitHub issues, Slack threads, AND Notion docs in one query, even if none of them contain the exact words you typed.

**Q3. This was a hackathon project. What would you do differently if you had 3 months?**
> They're testing your self-awareness and architectural thinking. Good answers: proper reranking, webhook-based real-time re-indexing, multi-tenant isolation hardening, streaming responses, eval pipeline for RAG quality.

**Q4. Who is the target user and how would you measure if SEAM is working?**
> Target: engineering teams using 3+ tools. Success metric: time-to-answer on knowledge queries, reduction in "hey has anyone done X before?" Slack messages.

---

## 🤖 2. ML / AI Questions
*The deepest area. Be ready to go multiple levels deep.*

**Q5. Why did you use DistilBERT and not just GPT-4 to classify intent?**
> DistilBERT runs locally on-device via ONNX — zero latency, zero API cost, no cold start. GPT-4 would add 1-2 seconds of network latency on every single message just for routing, before even touching the actual RAG pipeline. Classification is a simple 3-class problem; it doesn't need a 175B parameter model.

**Q6. What is DistilBERT? How is it different from BERT?**
> DistilBERT is a distilled (compressed) version of BERT — 40% smaller, 60% faster, retains 97% of BERT's language understanding. It's trained using knowledge distillation: a smaller "student" model learns to mimic a larger "teacher" model's outputs, not just the labels. Same transformer architecture, fewer layers (6 vs 12).

**Q7. What are your 3 intent classes? What happens when a query is ambiguous?**
> `github`, `integration`, `general`. If the model returns low confidence, the system defaults to `general`. (Be honest — if you haven't implemented confidence thresholding, say "that's a gap I identified for the next iteration.")

**Q8. What training data did you use? How many samples?**
> Look at your dataset.csv before the interview — know the count per class. If it's imbalanced, mention you used stratified splitting in train/test.

**Q9. What evaluation metric did you use and why F1 over accuracy?**
> F1 is better for classification with class imbalance. Accuracy can be misleading — if 80% of queries are "general", a model that always predicts "general" hits 80% accuracy but is useless. Weighted F1 accounts for class distribution.

**Q10. What is ONNX and why did you export to it?**
> ONNX (Open Neural Network Exchange) is a format that lets you run models trained in PyTorch in any runtime — including Node.js via `@xenova/transformers`. Without it, you'd need a Python sidecar service just for inference. ONNX + INT8 quantization reduced the model to ~65MB while running directly in the Node.js process.

**Q11. What is quantization? What's the tradeoff?**
> INT8 quantization converts model weights from 32-bit floats to 8-bit integers — ~4x smaller, ~2-3x faster inference. The tradeoff is a slight accuracy drop (usually <1% on classification tasks). For a 3-class router, that's acceptable.

**Q12. What is RAG? Why not just fine-tune an LLM on your codebase?**
> RAG = Retrieval Augmented Generation. Instead of baking knowledge into the model (expensive, becomes stale), you retrieve relevant documents at query time and inject them into the LLM's context. Fine-tuning is expensive, requires retraining when code changes, and LLMs can still hallucinate on memorized facts. RAG is dynamic, cheaper, and self-updating.

**Q13. What is cosine similarity and why is it used for vector search?**
> Cosine similarity measures the angle between two vectors in high-dimensional space, not their magnitude. Two chunks of text that mean the same thing in different lengths will have similar directions. It's used because Gemini's `text-embedding-004` encodes meaning into the direction of the 768-dimensional vector, not its length.

**Q14. Can your RAG system hallucinate? How would you detect it?**
> Yes, RAG reduces but doesn't eliminate hallucination. The LLM can still generate content beyond what's in the retrieved chunks. Detection approach: NLI (Natural Language Inference) — use a model to check if the answer is semantically entailed by the context. Low entailment score = potential hallucination → flag with `low_confidence: true`.

---

## 🗃️ 3. Vector Database / Supabase Questions

**Q15. Why Supabase pgvector and not Pinecone or Weaviate?**
> pgvector runs inside Postgres — so you get vector search AND relational queries in the same DB, with the same auth model. Pinecone is a managed vector DB but it's a separate service with no relational capabilities. For a multi-tenant system where you're already doing user auth, having everything in one Postgres instance with RLS is simpler and cheaper.

**Q16. What is Row-Level Security (RLS) and why does it matter for SEAM?**
> RLS is a Postgres feature that enforces data access policies at the database level. In SEAM, each user's embedded documents are tagged with `user_id`. RLS ensures User A's queries can never accidentally return User B's code, even if there's a bug in the application layer. It's a security layer that operates independently of your Express middleware.

**Q17. Why do you use the service role key in the backend instead of the anon key?**
> The anon key enforces RLS. The service role key bypasses RLS and is intended for trusted server-side operations. We use it in the backend because we apply user-level filtering in the application code (from Clerk auth) and need to perform admin operations like upserts. The service role key must never be exposed to the frontend.

**Q18. What's the difference between `upsert` and `insert` and why do you use it?**
> `upsert` = insert if not exists, update if exists. In `addDocuments()`, if someone re-indexes the same file after a commit, you don't want duplicates — you want to overwrite the old embedding with the fresh one. Using the file's unique ID as the primary key makes this safe.

**Q19. What dimensions do your vectors have? What model generates them?**
> 768 dimensions, generated by Google Gemini `text-embedding-004`. The pgvector column is typed `vector(768)`.

---

## 🔐 4. Auth / Security Questions

**Q20. You have two auth systems — Clerk and Passport.js. Why?**
> They serve different purposes. Clerk handles user identity across the app (JWT-based session management, login/logout, protecting API routes). Passport.js handles GitHub OAuth2 specifically — the OAuth flow requires redirect URIs and session state that Passport manages well. Clerk doesn't natively do OAuth2 token exchange for third-party API access.

**Q21. What is JWT and how does Clerk use it?**
> JWT (JSON Web Token) is a signed, self-contained token. Clerk issues a JWT after login, which the frontend sends on every request via `Authorization: Bearer`. `ClerkExpressRequireAuth()` middleware validates the signature and extracts `userId` — no database lookup needed on every request.

**Q22. How do you prevent one user from accessing another user's chats?**
> Two layers: application-level (all chat queries filter by `userId` extracted from the verified Clerk JWT) and database-level (RLS on pgvector tables). The MongoDB chat collection queries always include `{ userId }` as a filter condition.

**Q23. Your GitHub access tokens are stored in MongoDB. What are the security implications?**
> Tokens at rest should ideally be encrypted. As implemented, a DB breach exposes live GitHub tokens. Production mitigation: encrypt tokens with AES-256 before storing, or use a secrets manager (Vault, AWS Secrets Manager). This is a known gap worth acknowledging proactively.

---

## 🏗️ 5. System Design / Architecture Questions

**Q24. How would SEAM handle 1000 concurrent users?**
> Current bottlenecks: (1) DistilBERT is loaded once in-process — single Node.js process is fine for inference since ONNX is synchronous but fast. (2) Gemini embedding API — would hit rate limits, needs queuing (Bull/BullMQ with Redis). (3) Groq LLM — same, rate limiting per user. (4) Supabase — connection pooling via pgBouncer. Horizontal scaling: stateless Express behind a load balancer, shared Redis for queues.

**Q25. What happens if the DistilBERT model fails to load?**
> It falls back to `general` intent (line 55 in index.js). The `/api/classify` endpoint has a try/catch that defaults to `{ intent: "general" }`. The system degrades gracefully — it still works, just without smart routing.

**Q26. How do you handle the GitHub webhook to keep the vector store updated?**
> `GITHUB_WEBHOOK_SECRET` is in the env — the infrastructure is planned. On a push event, you'd verify the HMAC signature, extract changed file paths, re-fetch those files from the GitHub API, regenerate embeddings, and upsert them in pgvector. Without this, the knowledge base goes stale on every commit.

**Q27. Your chat history is in MongoDB but embeddings are in Supabase. Why split storage?**
> Chat messages are relational, user-scoped, and frequently read/written in sequence — MongoDB's document model fits naturally. Embeddings require vector similarity search with Postgres extensions — pgvector. Using each database for what it's best at avoids forcing a square peg into a round hole.

**Q28. What's the latency breakdown for a single query end-to-end?**
> Roughly: Intent classification (DistilBERT, local) ~50ms → Embedding the query (Gemini API) ~200-400ms → Vector search (Supabase) ~100ms → LLM generation (Groq) ~1-3s. Total: ~2-4 seconds. The single biggest win would be streaming the LLM response to eliminate the wait.

---

## ⚙️ 6. Node.js / Backend Questions

**Q29. Why Node.js for ML inference? Isn't Python the standard?**
> `@xenova/transformers` brings HuggingFace-style inference to Node.js via ONNX Runtime — no Python sidecar needed. This means a single process handles HTTP, auth, database, AND model inference. Fewer moving parts = simpler deployment, lower memory overhead, no inter-process communication.

**Q30. What is LangChain LCEL and why is it better than raw SDK calls?**
> LCEL (LangChain Expression Language) lets you compose a chain as `prompt | model | parser`. It's declarative, type-safe, and each component is independently testable and swappable. Raw SDK calls are imperative — you manually pass outputs between steps, handle errors in each step, and can't swap components without rewriting logic. LCEL also gives you tracing/observability for free.

**Q31. How does `express-session` + Passport interact? What is `serializeUser`?**
> After GitHub OAuth, Passport stores the user object in the session via `serializeUser` (decides what to save to session store). On subsequent requests, `deserializeUser` reconstructs the user object from the session. This lets Passport maintain the GitHub auth state across the redirect flow without re-authenticating on every request.

---

## 🔥 7. Hardball Questions
*They ask these to see if you really built it or just copy-pasted.*

**Q32. What's the hardest bug you hit while building this?**
> Have a real answer ready. Common ones: ONNX model path resolution in ESM vs CommonJS, Clerk JWT not propagating through Passport session, pgvector RLS blocking service role queries, `pdf-parse` ESM compatibility.

**Q33. What does your dataset.csv look like? How did you collect training data?**
> Know this cold. Was it synthetic? Hand-labeled? How many samples? What's the class distribution?

**Q34. If I query "show me the files John changed last Tuesday", what exactly happens step by step?**
> Walk through: Clerk auth check → DistilBERT classifies as `github` → Gemini embeds the query → pgvector cosine search returns top-5 code chunks → LangChain chain formats prompt + chunks → Groq (LLaMA-3.3-70B) generates answer → response returned. Bonus: mention what's missing (date filtering, contributor metadata filtering).

**Q35. What would break first if this went to production tomorrow?**
> Honest answers: no rate limiting on LLM endpoints, GitHub tokens unencrypted at rest, no streaming (UX), webhook re-indexing not implemented (stale knowledge base), no eval pipeline to measure RAG quality degradation over time.

---

> 💡 **Golden Rule**: For every technology you used, be ready to explain (1) what it is, (2) why you chose it over alternatives, and (3) what its limitations are. Depth > breadth.
