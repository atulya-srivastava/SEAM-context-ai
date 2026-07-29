// apps/backend/index.js
import express from "express";
import cors from "cors";
import dotenv from "dotenv";
import session from "express-session";
import passport from "passport";
import { Strategy as GitHubStrategy } from "passport-github2";
import { ClerkExpressWithAuth, ClerkExpressRequireAuth } from "@clerk/clerk-sdk-node";
import connectDB from "./config/db.js";
import GithubConnection from "./models/GithubConnection.js";
import fetch from "node-fetch";
import GithubRoutes from "./routes/github.js"
import chatRoutes from "./routes/chatRoutes.js"
import { classifyIntent, loadClassifier } from "./classifier/classify.js"


import MongoStore from "connect-mongo";

dotenv.config();
const app = express();
const corsOptions = {
    origin: process.env.FRONTEND_URL, // Specify the allowed origin
    credentials: true, // Allow credentials
};

app.use(cors(corsOptions));

app.use(express.json());

// Clerk middleware (protects routes)
app.use(
    ClerkExpressWithAuth()
);

// Session setup
const sessionOptions = {
    secret: process.env.SESSION_SECRET || "seam-secret-key",
    resave: false,
    saveUninitialized: false,
};

const mongoUri = process.env.MONGO_DB_URI;
if (mongoUri) {
    sessionOptions.store = MongoStore.create({
        mongoUrl: mongoUri,
    });
}

app.use(session(sessionOptions));
app.use(passport.initialize());
app.use(passport.session());


app.use('/api/chats', chatRoutes);
app.use("/api/github", GithubRoutes);

// Intent classification endpoint (DistilBERT)
app.post("/api/classify", async (req, res) => {
    try {
        const { text } = req.body;
        if (!text) return res.status(400).json({ error: "text is required" });
        const intent = await classifyIntent(text);
        res.json({ intent });
    } catch (err) {
        console.error("Classification error:", err);
        res.json({ intent: "general" }); // fallback to general on error
    }
});

// GitHub OAuth Strategy
passport.use(
    new GitHubStrategy(
        {
            clientID: process.env.GITHUB_CLIENT_ID,
            clientSecret: process.env.GITHUB_CLIENT_SECRET,
            callbackURL: process.env.GITHUB_CALLBACK_URL,
            state: false,
        },
        (accessToken, refreshToken, profile, done) => {
            // TODO: Save token in DB associated with Clerk orgId
            return done(null, { profile, accessToken });
        }
    )
);

passport.serializeUser((user, done) => done(null, user));
passport.deserializeUser((obj, done) => done(null, obj));

// ---------- ROUTES ----------

// Health check
app.get("/", (req, res) => res.json({ status: "Backend running ✅" }));

// GitHub OAuth Login
app.get("/auth/github", (req, res) => {
    const { userId } = req.query;
    if (!userId) {
        return res.status(400).send("userId query parameter is required for GitHub authentication.");
    }
    const clientId = process.env.GITHUB_CLIENT_ID;
    const callbackUrl = process.env.GITHUB_CALLBACK_URL || `${req.protocol}://${req.get('host')}/auth/github/callback`;
    const githubAuthUrl = `https://github.com/login/oauth/authorize?client_id=${clientId}&scope=repo,user&state=${encodeURIComponent(userId)}&redirect_uri=${encodeURIComponent(callbackUrl)}`;
    return res.redirect(githubAuthUrl);
});

// GitHub OAuth Callback
app.get("/auth/github/callback", async (req, res) => {
    const frontendUrl = process.env.FRONTEND_URL || "http://localhost:3000";
    const { code, state, error, error_description } = req.query;

    if (error) {
        console.error("❌ GitHub OAuth authorization denied/error:", error, error_description);
        return res.redirect(`${frontendUrl}/dashboard/settings?githubStatus=failed&error=${encodeURIComponent(error_description || error)}`);
    }

    const userId = state;
    if (!userId || !code) {
        console.warn("⚠️ Missing code or userId (state) in callback query parameters.");
        return res.redirect(`${frontendUrl}/dashboard/settings?githubStatus=failed&error=missing_parameters`);
    }

    try {
        const callbackUrl = process.env.GITHUB_CALLBACK_URL || `${req.protocol}://${req.get('host')}/auth/github/callback`;
        
        // Exchange code for access_token
        const tokenRes = await fetch("https://github.com/login/oauth/access_token", {
            method: "POST",
            headers: {
                "Content-Type": "application/json",
                Accept: "application/json",
            },
            body: JSON.stringify({
                client_id: process.env.GITHUB_CLIENT_ID,
                client_secret: process.env.GITHUB_CLIENT_SECRET,
                code,
                redirect_uri: callbackUrl,
            }),
        });

        const tokenData = await tokenRes.json();

        if (!tokenData.access_token) {
            console.error("❌ Failed to exchange code for GitHub token:", tokenData);
            return res.redirect(`${frontendUrl}/dashboard/settings?githubStatus=failed&error=${encodeURIComponent(tokenData.error_description || "token_exchange_failed")}`);
        }

        const accessToken = tokenData.access_token;

        // Fetch user profile from GitHub API
        const profileRes = await fetch("https://api.github.com/user", {
            headers: {
                Authorization: `Bearer ${accessToken}`,
                "User-Agent": "SEAM-App",
            },
        });

        if (!profileRes.ok) {
            console.error("❌ Failed to fetch user profile from GitHub:", profileRes.statusText);
            return res.redirect(`${frontendUrl}/dashboard/settings?githubStatus=failed&error=profile_fetch_failed`);
        }

        const profileData = await profileRes.json();
        const githubUsername = profileData.login;

        // Upsert into MongoDB
        await GithubConnection.findOneAndUpdate(
            { userId },
            { userId, githubUsername, accessToken },
            { upsert: true, new: true }
        );

        console.log(`✅ GitHub account @${githubUsername} successfully connected for user ${userId}`);
        return res.redirect(`${frontendUrl}/dashboard/settings?githubStatus=success&username=${encodeURIComponent(githubUsername)}`);
    } catch (err) {
        console.error("❌ GitHub OAuth callback error:", err);
        return res.redirect(`${frontendUrl}/dashboard/settings?githubStatus=failed&error=${encodeURIComponent(err.message)}`);
    }
});

app.get("/api/github/repos", ClerkExpressRequireAuth(), async (req, res) => {
    const { userId } = req.auth;

    const connection = await GithubConnection.findOne({ userId });
    if (!connection) {
        return res.status(403).json({ error: "No GitHub connection found" });
    }

    const ghRes = await fetch("https://api.github.com/user/repos", {
        headers: { Authorization: `token ${connection.accessToken}` },
    });

    const repos = await ghRes.json();
    res.json(repos);
});

app.get("/api/github/issues", ClerkExpressRequireAuth(), async (req, res) => {
    const { userId } = req.auth;
    const connection = await GithubConnection.findOne({ userId });

    if (!connection) {
        return res.status(403).json({ error: "No GitHub connection found" });
    }

    const ghRes = await fetch("https://api.github.com/issues", {
        headers: { Authorization: `token ${connection.accessToken}` },
    });

    const issues = await ghRes.json();
    res.json(issues);
});



// Example protected route with Clerk
app.get("/api/org-data", ClerkExpressRequireAuth(), (req, res) => {
    res.json({ orgId: req.auth.orgId, userId: req.auth.userId });
});

// ----------------------------

connectDB();
app.listen(3001, () => console.log("✅ Backend running at http://localhost:3001"));
