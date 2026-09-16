import express from "express";
import { addDocuments, searchDocuments, deleteByBranch, getEmbedding } from "../lib/supabase.js";
import GithubConnection from "../models/GithubConnection.js";
import { ClerkExpressRequireAuth } from "@clerk/clerk-sdk-node";
import { chatModel } from "../lib/groq.js";
import { ChatPromptTemplate } from "@langchain/core/prompts";
import { JsonOutputParser } from "@langchain/core/output_parsers";
import { RunnableSequence } from "@langchain/core/runnables";
import Chat from "../models/chatModel.js";

const router = express.Router();

// Check GitHub Connection Status
router.get("/status", ClerkExpressRequireAuth(), async (req, res) => {
    try {
        const { userId } = req.auth;
        const connection = await GithubConnection.findOne({ userId });
        if (!connection || !connection.accessToken) {
            return res.json({ connected: false, githubUsername: null });
        }
        return res.json({
            connected: true,
            githubUsername: connection.githubUsername,
            createdAt: connection.createdAt,
        });
    } catch (err) {
        console.error("Error fetching GitHub connection status:", err);
        res.status(500).json({ error: "Failed to fetch GitHub status" });
    }
});

// Debug route to inspect stored Supabase vectors for logged in user
router.get("/debug-supabase", ClerkExpressRequireAuth(), async (req, res) => {
    try {
        const { userId } = req.auth;
        const { supabase } = await import("../lib/supabase.js");
        const { count, error } = await supabase
            .from("github_code")
            .select("*", { count: "exact", head: true })
            .eq("user_id", userId);

        if (error) {
            return res.status(500).json({ status: "error", error: error.message });
        }

        const { data: sampleDocs } = await supabase
            .from("github_code")
            .select("id, repo, branch, file, created_at")
            .eq("user_id", userId)
            .limit(5);

        return res.json({
            status: "connected",
            userId,
            totalDocsInSupabase: count,
            sampleDocs: sampleDocs || []
        });
    } catch (err) {
        return res.status(500).json({ status: "exception", error: err.message });
    }
});

// Connect via GitHub Personal Access Token (PAT)
router.post("/connect-pat", ClerkExpressRequireAuth(), async (req, res) => {
    try {
        const { userId } = req.auth;
        const { token } = req.body;

        if (!token || typeof token !== "string" || !token.trim()) {
            return res.status(400).json({ error: "Personal Access Token is required" });
        }

        const cleanToken = token.trim();

        // Validate token against GitHub API
        const ghRes = await fetch("https://api.github.com/user", {
            headers: {
                Authorization: `Bearer ${cleanToken}`,
                "User-Agent": "SEAM-App",
            },
        });

        if (!ghRes.ok) {
            return res.status(400).json({ error: "Invalid GitHub Personal Access Token or missing permissions" });
        }

        const ghUser = await ghRes.json();
        const githubUsername = ghUser.login;

        await GithubConnection.findOneAndUpdate(
            { userId },
            { userId, githubUsername, accessToken: cleanToken },
            { upsert: true, new: true }
        );

        return res.json({
            message: "GitHub Personal Access Token connected successfully",
            connected: true,
            githubUsername,
        });
    } catch (err) {
        console.error("Error connecting GitHub PAT:", err);
        res.status(500).json({ error: "Failed to connect GitHub token" });
    }
});

// Disconnect GitHub Connection
router.delete("/disconnect", ClerkExpressRequireAuth(), async (req, res) => {
    try {
        const { userId } = req.auth;
        await GithubConnection.deleteOne({ userId });
        return res.json({ message: "GitHub connection disconnected successfully", connected: false });
    } catch (err) {
        console.error("Error disconnecting GitHub:", err);
        res.status(500).json({ error: "Failed to disconnect GitHub" });
    }
});

router.post("/sync-issues", ClerkExpressRequireAuth(), async (req, res) => {
    const { userId } = req.auth; // Clerk middleware
    const connection = await GithubConnection.findOne({ userId });
    console.log("GitHub connection:", connection);

    if (!connection) return res.status(403).json({ error: "No GitHub token" });

    const ghRes = await fetch("https://api.github.com/issues", {
        headers: { Authorization: `token ${connection.accessToken}` },
    });

    const issues = await ghRes.json();
    // prepare docs for Supabase
    const docs = issues.map((i) => ({
        id: `issue-${i.id}`,
        text: `${i.title} - ${i.body}`,
        metadata: { repo: i.repository?.full_name || "unknown" },
    }));

    await addDocuments(docs, userId);

    console.log("Synced issues to Supabase:", docs.length);

    res.json({ message: "Synced issues into Supabase", count: docs.length });
});

router.get("/all-repos", ClerkExpressRequireAuth(), async (req, res) => {
    try {
        const { userId } = req.auth;
        const connection = await GithubConnection.findOne({ userId });
        if (!connection) {
            return res.json([]);
        }
        console.log("GitHub connection:", connection);

        const response = await fetch("https://api.github.com/user/repos", {
            headers: {
                Authorization: `token ${connection.accessToken}`,
                "User-Agent": "HackQuest-App",
            },
        });

        const data = await response.json();
        res.json(data);
    } catch (error) {
        console.error(error);
        res.status(500).json({ error: "Failed to fetch repos" });
    }
});


// TODO: /repos route commented out — it used a separate "github_repos" ChromaDB collection.
// The /all-repos endpoint above fetches repos directly from GitHub API and still works.
// If repo-level semantic search is needed later, create a github_repos table in Supabase.

/*
router.get("/repos", async (req, res) => {
    // ... old ChromaDB github_repos code removed ...
});
*/


// --- LangChain LCEL Chains ---
// Architecture: ChatPromptTemplate → ChatGroq → JsonOutputParser
// Both chains enforce JSON-only output, eliminating fragile regex parsing.

const FILE_CHANGE_SYSTEM = `You are SEAM (Context AI), an expert developer assistant analyzing code changes in a GitHub repository.
Respond ONLY with valid JSON (no markdown fences, no extra text) matching this JSON format:
{{
  "summary": "A detailed, technical, step-by-step explanation answering the user's specific question based on the provided code snippets and context.",
  "contributor": "Author or contributor name if mentioned in context, else empty string",
  "lastEdited": "ISO timestamp or commit date if present in context, else empty string",
  "commitUrl": "GitHub commit URL if present in context, else empty string",
  "combinedCode": "Key code snippet or diff related to the user query",
  "project_name": "Repository or project name if present in context, else empty string",
  "language": "Programming language of the snippets",
  "database": "Database technology if identified in code, else empty string"
}}`;

const GENERAL_QA_SYSTEM = `You are SEAM (Context AI), an intelligent developer assistant answering questions about a user's GitHub codebase.

CRITICAL INSTRUCTION:
Your 'summary' field MUST directly and thoroughly answer the user's SPECIFIC question using the provided code context. Do NOT give a generic project summary. Explain the relevant functions, logic, architecture, or code files in detail.

Respond ONLY with valid JSON (no markdown fences, no extra text) matching this JSON format:
{{
  "summary": "Detailed, comprehensive, code-backed answer directly addressing the user's specific question.",
  "contributor": "Author or primary contributor if relevant to the query, else empty string",
  "repo": "Repository name if present in context, else empty string",
  "file": "Most relevant file path for this answer if applicable, else empty string",
  "branch": "Branch name if present in context, else empty string",
  "commit": "Commit SHA if present in context, else empty string",
  "project_name": "Project name if present in context, else empty string",
  "language": "Programming language if identifiable, else empty string",
  "database": "Database technology if present in code, else empty string"
}}`;

const jsonParser = new JsonOutputParser();

const fileChangeChain = RunnableSequence.from([
    ChatPromptTemplate.fromMessages([
        ["system", FILE_CHANGE_SYSTEM],
        ["user", "User Question: {question}\n\nRelevant Context:\n{context}"],
    ]),
    chatModel,
    jsonParser,
]);

const generalChain = RunnableSequence.from([
    ChatPromptTemplate.fromMessages([
        ["system", GENERAL_QA_SYSTEM],
        ["user", "User Question: {question}\n\nRelevant Context:\n{context}"],
    ]),
    chatModel,
    jsonParser,
]);


router.post("/ask", ClerkExpressRequireAuth(), async (req, res) => {
    const { question, chatId } = req.body;
    try {
        const { userId } = req.auth;
        console.log("User ID:", userId);
        if (!userId) return res.status(403).json({ error: "Unauthorized" });
        if (!question) {
            return res.status(400).json({ error: "Question is required" });
        }

        let finalResponse = {
            question,
            summary: "",
            combinedCode: "", 
            contributor: "",
            lastEdited: "",
            commitUrl: "",
            project_name: "",
            language: "",
            database: "",
            matches: [],
        };

        // Detect file-change query (e.g., "changes in db.go in main branch of Assignment")
        const match = question.match(
            /changes.*in\s+(.+)\s+in\s+(\w+)\s+branch\s+of\s+(\w+)/i
        );

        let result = [];
        let context = "";

        if (match) {
            // File-specific query
            const [_, fileName, branchName, repoName] = match;
            console.log(`Detected file-change query for ${repoName}/${branchName}/${fileName}`);

            try {
                let results = await searchDocuments(question, userId, { repo: repoName, branch: branchName }, 20);
                if (Array.isArray(results)) {
                    const fileFiltered = results.filter(r => r.file && r.file.includes(fileName.trim()));
                    result = fileFiltered.length > 0 ? fileFiltered.slice(0, 10) : results.slice(0, 10);
                }
            } catch (searchErr) {
                console.warn("File vector search error:", searchErr.message);
            }
        } else {
            // Semantic search via Supabase pgvector RPC
            try {
                result = await searchDocuments(question, userId);
            } catch (searchErr) {
                console.warn("Vector search error, attempting direct table query:", searchErr.message);
            }

            // Fallback: If RPC match threshold returned 0 records, retrieve user's indexed code directly
            if (!Array.isArray(result) || result.length === 0) {
                try {
                    const { data: dbData } = await supabase
                        .from("github_code")
                        .select("*")
                        .eq("user_id", userId)
                        .limit(5);

                    if (dbData && dbData.length > 0) {
                        result = dbData.map((d) => ({
                            content: d.content,
                            repo: d.repo,
                            branch: d.branch || "main", 
                            file: d.file,
                            author: d.author || "Unknown",
                            commit_sha: d.commit_sha || "Unknown",
                            last_edited: d.last_edited || "Unknown",
                            similarity: 0.5,
                        }));
                    }
                } catch (dbErr) {
                    console.warn("Direct table query error:", dbErr.message);
                }
            }
        }

        context = (Array.isArray(result) ? result : [])
            .map((doc) => {
                return `From ${doc.repo}/${doc.branch || "main"}/${doc.file}:\n${doc.content}\n
Author: ${doc.author || "Unknown"}
Commit: ${doc.commit_sha || "Unknown"}`;
            })
            .join("\n\n");

        if (!context || context.trim() === "") {
            context = "No specific indexed codebase context found. Please answer the question accurately using general programming knowledge.";
        }

        // Run LangChain LCEL chain with resilient fallback
        let metadata = {};
        try {
            const chain = match ? fileChangeChain : generalChain;
            metadata = await chain.invoke({ question, context });
        } catch (chainErr) {
            console.warn("Chain JSON parsing failed, running raw Groq fallback:", chainErr.message);
            try {
                const rawResponse = await chatModel.invoke([
                    ["system", "You are SEAM (Context AI). Answer the user's question directly, clearly, and in detail based on the codebase context provided:\n\n" + context],
                    ["user", question]
                ]);
                metadata = {
                    summary: typeof rawResponse.content === "string" ? rawResponse.content : JSON.stringify(rawResponse.content)
                };
            } catch (groqErr) {
                console.error("Groq fallback error:", groqErr.message);
                metadata = { summary: "Sorry, I could not process your request at this time." };
            }
        }
        const explanation = metadata.summary || "No explanation generated.";

        finalResponse = {
            ...finalResponse,
            summary: explanation,
            ...metadata,
            matches: Array.isArray(result) ? result.map((doc) => ({
                text: doc.content,
                metadata: {
                    repo: doc.repo,
                    branch: doc.branch,
                    file: doc.file,
                    author: doc.author,
                    username: doc.username,
                    commit_sha: doc.commit_sha,
                    last_edited: doc.last_edited,
                },
                score: doc.similarity || 0,
            })) : [],
        };

        // Save chat history safely
        let responseChatId = chatId || null;
        try {
            let chat;
            if (chatId) {
                chat = await Chat.findById(chatId);
            }
            if (!chat) {
                chat = new Chat({ userId, title: question.slice(0, 30), messages: [] });
            }

            chat.messages.push({ content: question, role: "user" });
            chat.messages.push({ content: finalResponse.summary, role: "bot", meta: finalResponse });
            await chat.save();
            responseChatId = chat._id;
        } catch (chatErr) {
            console.warn("Failed to save chat to database:", chatErr.message);
        }

        return res.json({ chatId: responseChatId, ...finalResponse });
    } catch (err) {
        console.error("Error in /ask endpoint:", err);
        return res.status(500).json({
            error: "Failed to process question",
            details: err.message,
            stack: process.env.NODE_ENV === "development" ? err.stack : undefined,
        });
    }
});




router.post("/sync-all-repos-code", ClerkExpressRequireAuth(), async (req, res) => {
    try {
        const { userId } = req.auth;

        const connection = await GithubConnection.findOne({ userId });

        if (!connection) return res.status(403).json({ error: "No GitHub token found" });

        // 1. Get all repos for user
        const reposRes = await fetch("https://api.github.com/user/repos?per_page=100", {
            headers: {
                Authorization: `token ${connection.accessToken}`,
                "User-Agent": "HackQuest-App",
            },
        });
        const repos = await reposRes.json();
        if (!Array.isArray(repos)) return res.status(400).json({ error: "Failed to fetch repos" });

        let totalFiles = 0;
        let totalRepos = 0;

        // 2. Loop through each repo and index code
        for (const repo of repos) {
            const owner = repo.owner.login;
            const repoName = repo.name;
            const branch = repo.default_branch || "main";

            console.log(`Syncing ${owner}/${repoName} (${branch})`);

            // fetch repo tree
            const treeRes = await fetch(
                `https://api.github.com/repos/${owner}/${repoName}/git/trees/${branch}?recursive=1`,
                { headers: { Authorization: `token ${connection.accessToken}` } }
            );
            const tree = await treeRes.json();
            if (!tree.tree) continue;

            // filter code files
            const codeFiles = tree.tree.filter(
                f => f.type === "blob" && /\.(js|ts|tsx|json|go|py|sql|md)$/i.test(f.path)
            );

            for (const file of codeFiles) {
                const fileRes = await fetch(
                    `https://api.github.com/repos/${owner}/${repoName}/contents/${file.path}`,
                    { headers: { Authorization: `token ${connection.accessToken}` } }
                );
                const data = await fileRes.json();
                if (!data.content) continue;

                const content = Buffer.from(data.content, "base64").toString("utf8");

                // split into chunks
                const size = 800;
                for (let i = 0; i < content.length; i += size) {
                    const chunk = content.slice(i, i + size);
                    await addDocuments([{
                        id: `${repoName}-${file.path}-${i}`,
                        text: chunk,
                        metadata: { repo: repoName, file: file.path, chunk: i, branch },
                    }], userId);
                }

                totalFiles++;
            }

            totalRepos++;
        }

        res.json({
            message: "Synced all repos into Supabase pgvector",
            repos: totalRepos,
            files: totalFiles,
        });
    } catch (err) {
        console.error("Error in /sync-all-repos-code:", err);
        res.status(500).json({ error: "Failed to sync repos", details: err.message });
    }
});


// Sync a specific branch of a repo with commit metadata
router.post("/repos/:owner/:repo/sync-branch", ClerkExpressRequireAuth(), async (req, res) => {
    try {
        const { userId } = req.auth;
        const { owner, repo } = req.params;
        const { branch } = req.body;

        if (!branch) return res.status(400).json({ error: "Branch parameter is required" });

        const connection = await GithubConnection.findOne({ userId });
        if (!connection || !connection.accessToken) return res.status(403).json({ error: "No GitHub token" });

        const authHeader = `Bearer ${connection.accessToken}`;

        // 1. Delete old branch data
        await deleteByBranch(repo, branch, userId);

        // 2. Fetch commit history for this branch
        const fileLastCommit = {};
        try {
            const commitsRes = await fetch(
                `https://api.github.com/repos/${owner}/${repo}/commits?sha=${branch}&per_page=15`,
                { headers: { Authorization: authHeader, "User-Agent": "SEAM-App" } }
            );
            const commits = await commitsRes.json();

            if (Array.isArray(commits)) {
                for (const commit of commits.slice(0, 10)) {
                    const commitSha = commit.sha;
                    const commitDate = commit.commit?.author?.date;
                    const commitAuthor = commit.commit?.author?.name;
                    const commitEmail = commit.commit?.author?.email;
                    const commitUser = commit.author?.login;

                    const commitDetailsRes = await fetch(
                        `https://api.github.com/repos/${owner}/${repo}/commits/${commitSha}`,
                        { headers: { Authorization: authHeader, "User-Agent": "SEAM-App" } }
                    );
                    const commitDetails = await commitDetailsRes.json();

                    if (Array.isArray(commitDetails.files)) {
                        for (const f of commitDetails.files) {
                            if (!fileLastCommit[f.filename]) {
                                fileLastCommit[f.filename] = {
                                    sha: commitSha,
                                    author: commitAuthor,
                                    email: commitEmail,
                                    username: commitUser,
                                    lastEdited: commitDate
                                };
                            }
                        }
                    }
                }
            }
        } catch (commitErr) {
            console.warn("Could not fetch commit details, continuing without metadata:", commitErr.message);
        }

        // 3. Fetch repo tree for branch
        const treeRes = await fetch(
            `https://api.github.com/repos/${owner}/${repo}/git/trees/${branch}?recursive=1`,
            { headers: { Authorization: authHeader, "User-Agent": "SEAM-App" } }
        );
        const tree = await treeRes.json();
        if (!tree.tree || !Array.isArray(tree.tree)) return res.json({ message: "No files found in branch" });

        // 4. Filter code files
        const codeFiles = tree.tree.filter(
            f => f.type === "blob" && /\.(js|ts|tsx|jsx|json|go|py|sql|md|css|html|java|c|cpp|h|rs)$/i.test(f.path)
        );

        let totalFiles = 0;

        // 5. Process each file
        for (const file of codeFiles) {
            try {
                const fileRes = await fetch(
                    `https://api.github.com/repos/${owner}/${repo}/contents/${file.path}?ref=${branch}`,
                    { headers: { Authorization: authHeader, "User-Agent": "SEAM-App" } }
                );
                const data = await fileRes.json();
                if (!data.content) continue;

                const content = Buffer.from(data.content, "base64").toString("utf8");
                const commitMeta = fileLastCommit[file.path] || {};

                // Split into chunks
                const size = 800;
                for (let i = 0; i < content.length; i += size) {
                    const chunk = content.slice(i, i + size);
                    await addDocuments([{
                        id: `${repo}-${branch}-${file.path.replace(/[^a-zA-Z0-9-_]/g, "_")}-${i}`,
                        text: chunk,
                        metadata: {
                            repo,
                            branch,
                            file: file.path,
                            chunk: i,
                            author: commitMeta.author || "Unknown",
                            email: commitMeta.email || "Unknown",
                            username: commitMeta.username || "Unknown",
                            commit_sha: commitMeta.sha || "Unknown",
                            last_edited: commitMeta.lastEdited || "Unknown",
                        },
                    }], userId);
                }

                totalFiles++;
            } catch (fileErr) {
                console.error(`Failed to process file ${file.path}:`, fileErr.message);
            }
        }
        console.log(`Synced ${totalFiles} files from ${repo}/${branch} with commit metadata`);
        res.json({ message: `Synced ${totalFiles} files from ${repo}/${branch} with commit metadata` });
    } catch (err) {
        console.error("Error syncing branch:", err);
        res.status(500).json({ error: "Failed to sync branch", details: err.message });
    }
});


router.get(
    "/repos/:owner/:repo/branches",
    ClerkExpressRequireAuth(),
    async (req, res) => {
        try {
            const { userId } = req.auth;
            if (!userId) return res.status(403).json({ error: "Unauthorized" });

            const { owner, repo } = req.params;

            // Fetch user's GitHub connection
            const connection = await GithubConnection.findOne({ userId });
            if (!connection || !connection.accessToken) {
                return res.status(403).json({ error: "No GitHub token" });
            }

            console.log("Fetching branches for:", owner, repo);

            // Fetch branches from GitHub API
            const response = await fetch(
                `https://api.github.com/repos/${owner}/${repo}/branches`,
                {
                    headers: {
                        Authorization: `token ${connection.accessToken}`,
                        Accept: "application/vnd.github+json",
                    },
                }
            );

            const data = await response.json();

            if (!response.ok) {
                return res
                    .status(response.status)
                    .json({ error: data.message || "GitHub API error" });
            }

            // Return only branch names
            const branches = Array.isArray(data) ? data.map((b) => ({ name: b.name })) : [];
            res.json(branches);
        } catch (err) {
            console.error("Error fetching branches:", err);
            res.status(500).json({ error: "Failed to fetch branches", details: err.message });
        }
    }
);

export default router;