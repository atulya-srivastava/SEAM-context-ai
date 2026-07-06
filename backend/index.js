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

// Session (needed for passport GitHub)
app.use(session({ secret: process.env.SESSION_SECRET, resave: false, saveUninitialized: false }));
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

// GitHub Login
app.get("/auth/github", (req, res, next) => {
    const { userId } = req.query;
    passport.authenticate("github", {
        scope: ["repo"],
        state: userId
    })(req, res, next);
});

// GitHub Callback
app.get("/auth/github/callback", (req, res, next) => {
    passport.authenticate("github", (err, user, info) => {
        if (err) {
            console.error("❌ Passport authentication error:", err);
            return res.redirect(`${process.env.FRONTEND_URL || "http://localhost:3000"}/dashboard?githubStatus=failed&error=${encodeURIComponent(err.message)}`);
        }
        if (!user) {
            console.warn("⚠️ No user returned from passport:", info);
            return res.redirect(`${process.env.FRONTEND_URL || "http://localhost:3000"}/dashboard?githubStatus=failed`);
        }
        req.logIn(user, async (loginErr) => {
            if (loginErr) {
                console.error("❌ Passport login error:", loginErr);
                return res.redirect(`${process.env.FRONTEND_URL || "http://localhost:3000"}/dashboard?githubStatus=failed`);
            }
            
            const userId = req.query.state;
            const { profile, accessToken } = user;

            if (!userId) {
                console.warn("⚠️ No userId (state) found in callback query parameters.");
                return res.redirect(`${process.env.FRONTEND_URL || "http://localhost:3000"}/dashboard?githubStatus=failed&error=missing_userid`);
            }

            try {
                await GithubConnection.findOneAndUpdate(
                    { userId },
                    { userId, githubUsername: profile.username, accessToken },
                    { upsert: true, new: true }
                );
                return res.redirect(`${process.env.FRONTEND_URL || "http://localhost:3000"}/dashboard?githubStatus=success`);
            } catch (dbErr) {
                console.error("❌ DB save error:", dbErr);
                return res.redirect(`${process.env.FRONTEND_URL || "http://localhost:3000"}/dashboard?githubStatus=failed`);
            }
        });
    })(req, res, next);
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
