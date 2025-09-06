// apps/backend/index.js
import express from "express";
import cors from "cors";
import dotenv from "dotenv";
import session from "express-session";
import passport from "passport";
import { Strategy as GitHubStrategy } from "passport-github2";
import { ClerkExpressWithAuth, ClerkExpressRequireAuth } from "@clerk/clerk-sdk-node";
import connectDB from "./db.js";
import GithubConnection from "./models/GithubConnection.js";
import fetch from "node-fetch";
import GithubRoutes from "./routes/github.js"
import NotionRoutes from "./routes/notion.js"
import chatRoutes from "./routes/chatRoutes.js"




dotenv.config();
const app = express();
const corsOptions = {
    origin: 'http://localhost:3000', // Specify the allowed origin
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
app.use("/api/github", GithubRoutes)
app.use("/api/notion", NotionRoutes);

// GitHub OAuth Strategy
passport.use(
    new GitHubStrategy(
        {
            clientID: process.env.GITHUB_CLIENT_ID,
            clientSecret: process.env.GITHUB_CLIENT_SECRET,
            callbackURL: process.env.GITHUB_CALLBACK_URL,
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
app.get("/auth/github", passport.authenticate("github", { scope: ["repo"] }));

// GitHub Callback
app.get(
    "/auth/github/callback",
    passport.authenticate("github", { failureRedirect: "/" }),
    async (req, res) => {
        const { userId } = req.auth || {}; // Clerk userId
        const { profile, accessToken } = req.user;

        if (!userId) {
            // Failed Clerk session
            return res.redirect("http://localhost:3000/dashboard?githubStatus=failed");
        }

        await GithubConnection.findOneAndUpdate(
            { userId },
            { userId, githubUsername: profile.username, accessToken },
            { upsert: true, new: true }
        );

        // Redirect with success query param
        res.redirect("http://localhost:3000/dashboard?githubStatus=success");
    }
);

app.get("/api/github/repos", ClerkExpressRequireAuth(), async (req, res) => {
    const { orgId, userId } = req.auth;

    const connection = await GithubConnection.findOne({ orgId, userId });
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
    const { orgId, userId } = req.auth;
    const connection = await GithubConnection.findOne({ orgId, userId });

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
