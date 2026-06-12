"use client";

import { useState, useRef, useEffect, FormEvent } from "react";
import {
    Plus,
    Search,
    MessageSquare,
    ThumbsUp,
    ThumbsDown,
    Copy,
    Send,
    MoreHorizontal,
    User,
    Bot,
    PanelLeftClose,
    PanelLeftOpen,
    Menu,
    Github,
    Zap,
} from "lucide-react";
import { useAuth } from "@clerk/nextjs";
import toast from "react-hot-toast";
import TextareaAutosize from "react-textarea-autosize";

// TypeScript declaration for CDN scripts
declare global {
    interface Window {
        marked: { parse: (text: string, options?: object) => string };
        hljs: { highlightAll: () => void };
    }
}

// Type for a single chat message
interface Message {
    sender: "user" | "ai";
    text: string;
    type?: "github" | "integration" | "general";
    data?: any; // For storing GitHub response data
}

// GitHub Response Interface
interface GitHubResponse {
    question: string;
    summary: string;
    project_name?: string;
    language?: string;
    database?: string;
    features?: string[];
    files?: string[];
    author?: string;
    contributor?: string;
    lastEdited?: string;
    commitUrl?: string;
    matches?: Array<{
        text: string;
        score: number;
        metadata: {
            username: string;
            repo: string;
            branch: string;
            file: string;
        };
    }>;
}

// --- CONFIGURATION ARRAY ---
const INTEGRATIONS_CONFIG = [
    {
        id: "slack",
        label: "Slack",
        url: process.env.NEXT_PUBLIC_SLACK_WEBHOOK_URL as string,
        createPayload: (chatInput: string, sessionId: string) => ({
            action: "sendMessage",
            chatInput,
            sessionId,
        }),
    }, {
        id: "drive",
        label: "drive",
        url: process.env.NEXT_PUBLIC_DRIVE_WEBHOOK_URL as string,
        createPayload: (chatInput: string, sessionId: string) => ({
            action: "sendMessage",
            chatInput,
            sessionId,
        }),
    },
    {
        id: "notion",
        label: "Notion",
        url: process.env.NEXT_PUBLIC_NOTION_WEBHOOK_URL as string,
        createPayload: (chatInput: string, sessionId: string) => ({
            sessionID: sessionId,
            chatInput,
        }),
    },
    {
        id: "gmail",
        label: "Gmail",
        url: process.env.NEXT_PUBLIC_GMAIL_WEBHOOK_URL as string,
        createPayload: (chatInput: string, sessionId: string) => ({
            sessionId,
            chatInput,
        }),
    },
    {
        id: "teams",
        label: "MS Teams",
        url: process.env.NEXT_PUBLIC_TEAMS_WEBHOOK_URL as string,
        createPayload: (chatInput: string, sessionId: string) => ({
            sessionId,
            chatInput,
        }),
    },
];

// Helper to safely render markdown
const renderMarkdown = (text: string) => {
    if (typeof window !== "undefined" && typeof window.marked !== "undefined") {
        return window.marked.parse(text, { gfm: true, breaks: true });
    }
    return text.replace(/\n/g, "<br />");
};

const UnifiedChatPage = () => {
    const [messages, setMessages] = useState<Message[]>([
        {
            sender: "ai",
            text: `Hello! I'm SEAM, your AI assistant. I can help you with:
      
• **GitHub Repository Analysis** - Ask questions about your repos
• **Slack, Google Drive, Notion, Gmail & Teams Integration** - Connect with your tools
• **General AI Assistance** - Chat about anything

How can I help you today?`,
            type: "general",
        },
    ]);

    const [input, setInput] = useState("");
    const [isLoading, setIsLoading] = useState(false);
    const [isSidebarOpen, setIsSidebarOpen] = useState(true);
    const [currentMode, setCurrentMode] = useState<"auto" | "github" | "integration">("auto");
    const { getToken } = useAuth();
    const [activeIntegrations, setActiveIntegrations] = useState({
        slack: false,
        drive: false,
        notion: false,
        gmail: false,
        teams: false,
    });
    const [isSimplifyEnabled, setIsSimplifyEnabled] = useState(false);

    const chatContainerRef = useRef<HTMLDivElement>(null);

    const handleIntegrationToggle = (
        integrationId: "slack" | "notion" | "gmail" | "teams" | "drive"
    ) => {
        setActiveIntegrations((prev) => ({
            ...prev,
            [integrationId]: !prev[integrationId],
        }));
    };

    useEffect(() => {
        if (chatContainerRef.current) {
            chatContainerRef.current.scrollTop =
                chatContainerRef.current.scrollHeight;
        }
    }, [messages]);

    useEffect(() => {
        const loadScript = (src: string, id: string, onLoad?: () => void) => {
            if (document.getElementById(id)) {
                if (onLoad) onLoad();
                return;
            }
            const script = document.createElement("script");
            script.src = src;
            script.id = id;
            script.async = true;
            if (onLoad) {
                script.onload = onLoad;
            }
            document.body.appendChild(script);
        };

        const loadStyle = (href: string, id: string) => {
            if (document.getElementById(id)) return;
            const link = document.createElement("link");
            link.rel = "stylesheet";
            link.href = href;
            link.id = id;
            document.head.appendChild(link);
        };

        loadScript(
            "https://cdn.jsdelivr.net/npm/marked/marked.min.js",
            "marked-script"
        );

        loadScript(
            "https://cdnjs.cloudflare.com/ajax/libs/highlight.js/11.9.0/highlight.min.js",
            "hljs-script",
            () => {
                if (window.hljs) {
                    window.hljs.highlightAll();
                }
            }
        );

        loadStyle(
            "https://cdnjs.cloudflare.com/ajax/libs/highlight.js/11.9.0/styles/atom-one-dark.min.css",
            "hljs-style"
        );
    }, []);

    useEffect(() => {
        if (typeof window !== "undefined" && typeof window.hljs !== "undefined") {
            window.hljs.highlightAll();
        }
    }, [messages, isLoading]);

    // Determine which API to use based on input
    const determineAPIMode = (input: string): "github" | "integration" | "general" => {
        const githubKeywords = [
            "repo", "repository", "commit", "branch", "file", "code", "github",
            "project", "contributor", "author", "merge", "pull request", "diff",
            "clone", "fork", "push", "pull", "main", "master", "develop"
        ];

        const lowerInput = input.toLowerCase();
        const hasGithubKeywords = githubKeywords.some(keyword =>
            lowerInput.includes(keyword)
        );

        // Priority 1: GitHub-related content always goes to GitHub API
        if (hasGithubKeywords) {
            return "github";
        }

        // Priority 2: If integrations are active and it's NOT GitHub content
        const hasActiveIntegrations = Object.values(activeIntegrations).some(Boolean);
        if (hasActiveIntegrations) {
            return "integration";
        }

        // Priority 3: General AI for everything else
        return "general";
    };

   

    // GitHub API Handler
    const handleGitHubAPI = async (question: string) => {
        try {


            // Mock token for demo - replace with actual auth
            const token = await getToken();

            const res = await fetch(`${process.env.NEXT_PUBLIC_API_URL}/api/github/ask`, {
                method: "POST",
                headers: {
                    "Content-Type": "application/json",
                    Authorization: `Bearer ${token}`,
                },
                body: JSON.stringify({ question }),
            });

            if (!res.ok) {
                throw new Error(`GitHub API error: ${res.statusText}`);
            }

            const data: GitHubResponse = await res.json();
            return data;
        } catch (error) {
            throw new Error(`Failed to fetch from GitHub API: ${error}`);
        }
    };

    // Integrations API Handler
    const handleIntegrationsAPI = async (currentInput: string) => {
        const activeIds = Object.entries(activeIntegrations)
            .filter(([_, isActive]) => isActive)
            .map(([id]) => id);

        const activeWebhooks = INTEGRATIONS_CONFIG.filter((integration) =>
            activeIds.includes(integration.id)
        );

        const promises = activeWebhooks.map((webhook) => {
            const sessionId = `session-${webhook.id}-${Date.now()}`;
            const payload = webhook.createPayload(currentInput, sessionId);

            return fetch(webhook.url, {
                method: "POST",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify(payload),
            }).then((res) => {
                if (!res.ok) {
                    return res
                        .json()
                        .then((err) =>
                            Promise.reject({ label: webhook.label, error: err })
                        );
                }
                return res
                    .json()
                    .then((data) => ({ ...data, label: webhook.label }));
            });
        });

        const results = await Promise.allSettled(promises);

        let successfulOutputs: string[] = [];
        let failedOutputs: string[] = [];

        results.forEach((result) => {
            if (result.status === "fulfilled" && result.value.output) {
                successfulOutputs.push(
                    `**${result.value.label} Response:**\n${result.value.output}`
                );
            } else if (result.status === "rejected") {
                failedOutputs.push(
                    `**${result.reason.label} Request Failed:**\n${result.reason.error?.message || "Unknown error"
                    }`
                );
            }
        });

        let aiText = "";
        if (successfulOutputs.length > 0) {
            aiText = successfulOutputs.join("\n\n---\n\n");
            if (failedOutputs.length > 0) {
                aiText += "\n\n---\n\n" + failedOutputs.join("\n\n");
            }
        } else if (failedOutputs.length > 0) {
            aiText = failedOutputs.join("\n\n");
        } else {
            aiText = "Sorry, couldn't get a response from the selected integrations.";
        }

        return aiText;
    };

    // Simplify response through Gemini
    const simplifyResponse = async (originalResponse: string) => {
        const GEMINI_API_KEY = process.env.NEXT_PUBLIC_GEMINI_API_KEY;

        if (!GEMINI_API_KEY) {
            return originalResponse; // Return original if no API key
        }

        try {
            const model = "gemini-1.5-flash-latest";
            const simplifyPrompt = `Please analyze the following response and provide a simplified, concise version that highlights only the essential points and key information. Make it easy to understand and focus on the most important aspects:

${originalResponse}`;

            const response = await fetch(
                `https://generativelanguage.googleapis.com/v1beta/models/${model}:generateContent?key=${GEMINI_API_KEY}`,
                {
                    method: "POST",
                    headers: { "Content-Type": "application/json" },
                    body: JSON.stringify({
                        contents: [{ parts: [{ text: simplifyPrompt }] }],
                    }),
                }
            );

            if (!response.ok) {
                return originalResponse; // Return original if API fails
            }

            const data = await response.json();
            return data.candidates[0]?.content?.parts[0]?.text || originalResponse;
        } catch (error) {
            console.error("Error simplifying response:", error);
            return originalResponse; // Return original if error occurs
        }
    };

    // General AI Handler (Gemini)
    const handleGeneralAI = async (currentInput: string) => {
        const GEMINI_API_KEY = process.env.NEXT_PUBLIC_GEMINI_API_KEY;

        if (!GEMINI_API_KEY) {
            return new Promise<string>((resolve) => {
                setTimeout(() => {
                    resolve("Hello! I am SEAM, your intelligent search assistant. To use live Gemini responses, please set the `NEXT_PUBLIC_GEMINI_API_KEY` environment variable in your `.env` file. Currently, I am running in local demonstration mode.");
                }, 500);
            });
        }

        const model = "gemini-1.5-flash-latest"; // Using a standard model name
        const response = await fetch(
            `https://generativelanguage.googleapis.com/v1beta/models/${model}:generateContent?key=${GEMINI_API_KEY}`,
            {
                method: "POST",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({
                    contents: [{ parts: [{ text: currentInput }] }],
                }),
            }
        );

        if (!response.ok) {
            const errorData = await response.json();
            throw new Error(errorData.error?.message || "API request failed.");
        }

        const data = await response.json();
        return data.candidates[0]?.content?.parts[0]?.text || "Sorry, I couldn't get a response.";
    };

    // Master Form Submit Function
    const handleFormSubmit = async (e: FormEvent) => {
        e.preventDefault();
        if (input.trim() === "" || isLoading) return;

        const userMessage: Message = { sender: "user", text: input };
        setMessages((prev) => [...prev, userMessage]);

        const currentInput = input;
        setInput("");
        setIsLoading(true);

        try {
            let apiMode = currentMode === "auto" ? determineAPIMode(currentInput) :
                currentMode === "github" ? "github" :
                    Object.values(activeIntegrations).some(Boolean) ? "integration" : "general";

            let aiResponse: Message = {
                sender: "ai",
                text: "",
                type: apiMode
            };

            switch (apiMode) {
                case "github":
                    const githubData = await handleGitHubAPI(currentInput);
                    aiResponse.data = githubData;
                    let githubText = githubData.summary || "No summary available";
                    aiResponse.text = isSimplifyEnabled ? await simplifyResponse(githubText) : githubText;
                    break;

                case "integration":
                    const integrationResponse = await handleIntegrationsAPI(currentInput);
                    aiResponse.text = isSimplifyEnabled ? await simplifyResponse(integrationResponse) : integrationResponse;
                    break;

                case "general":
                default:
                    const generalResponse = await handleGeneralAI(currentInput);
                    aiResponse.text = isSimplifyEnabled ? await simplifyResponse(generalResponse) : generalResponse;
                    break;
            }

            setMessages((prev) => [...prev, aiResponse]);
        } catch (error) {
            const message = error instanceof Error ? error.message : "An unknown error occurred.";
            setMessages((prev) => [
                ...prev,
                {
                    sender: "ai",
                    text: `Sorry, something went wrong.\n\nError: ${message}`,
                    type: "general"
                },
            ]);
        } finally {
            setIsLoading(false);
        }
    };

    // Render GitHub Response
    const renderGitHubResponse = (data: GitHubResponse) => (
        <div className="space-y-4">
            {/* Project Info */}
            {(data.project_name || data.language || data.database || data.features?.length) && (
                <div className="bg-blue-900/40 p-4 rounded-lg border border-blue-700 text-sm">
                    <h2 className="font-semibold mb-2 text-blue-300">📌 Project Info</h2>
                    {data.project_name && <p><b>Project:</b> {data.project_name}</p>}
                    {data.language && <p><b>Language:</b> {data.language}</p>}
                    {data.database && <p><b>Database:</b> {data.database}</p>}
                    {data.features?.length && <p><b>Features:</b> {data.features.join(", ")}</p>}
                    {data.files?.length && <p><b>Files:</b> {data.files.join(", ")}</p>}
                </div>
            )}

            {/* Commit Info */}
            {(data.author || data.contributor || data.lastEdited || data.commitUrl) && (
                <div className="bg-green-900/40 p-4 rounded-lg border border-green-700 text-sm">
                    <h2 className="font-semibold mb-2 text-green-300">📝 Commit Info</h2>
                    {data.author && <p><b>Author:</b> {data.author}</p>}
                    {data.contributor && <p><b>Contributor:</b> {data.contributor}</p>}
                    {data.lastEdited && <p><b>Last Edited:</b> {new Date(data.lastEdited).toLocaleString()}</p>}
                    {data.commitUrl && (
                        <p>
                            <b>Commit URL:</b>{" "}
                            <a href={data.commitUrl} target="_blank" rel="noopener noreferrer" className="text-blue-400 underline">
                                {data.commitUrl}
                            </a>
                        </p>
                    )}
                </div>
            )}

            {/* Matches */}
            {data.matches?.length && (
                <div className="bg-gray-800 p-4 rounded-lg border border-gray-700">
                    <h2 className="font-semibold mb-2 text-gray-200">🔎 Matches</h2>
                    <div className="space-y-4">
                        {data.matches.map((match, idx) => {
                            const fileUrl = `https://github.com/${match.metadata.username}/${match.metadata.repo}/blob/${match.metadata.branch}/${match.metadata.file}`;
                            return (
                                <a
                                    key={idx}
                                    href={fileUrl}
                                    target="_blank"
                                    rel="noopener noreferrer"
                                    className="block p-4 border rounded-lg bg-gray-900 hover:bg-gray-700 transition"
                                >
                                    <p className="text-sm text-gray-400 mb-2">
                                        <b>Repo:</b> {match.metadata.repo} <br />
                                        <b>File:</b> {match.metadata.file} <br />
                                        <b>Branch:</b> {match.metadata.branch} <br />
                                        <b>Score:</b> {match.score.toFixed(3)}
                                    </p>
                                    <pre className="text-xs bg-black text-green-400 p-2 rounded-lg overflow-x-auto">
                                        {match.text.slice(0, 300)}...
                                    </pre>
                                </a>
                            );
                        })}
                    </div>
                </div>
            )}
        </div>
    );

    const sidebarLinks = [
        { title: "GitHub Repository Analysis", icon: Github },
        { title: "Integration Chat", icon: Zap },
        { title: "General AI Chat", icon: MessageSquare, active: true },
    ];

    const SidebarContent = () => (
        <div className="flex flex-col h-full">
            <div>
                <div className="flex items-center justify-between mb-6">
                    <h1 className="text-xl font-bold tracking-wider text-white">SEAM</h1>
                </div>
                <div className="flex items-center gap-2">
                    <button
                        onClick={() => {
                            setMessages([{
                                sender: "ai",
                                text: `Hello! I'm SEAM, your AI assistant. I can help you with:
                
• **GitHub Repository Analysis** - Ask questions about your repos
• **Slack,Google Drive , Notion, Gmail & Teams Integration** - Connect with your tools  
• **General AI Assistance** - Chat about anything

How can I help you today?`,
                                type: "general",
                            }]);
                        }}
                        className="flex-grow bg-gradient-to-r from-yellow-400 to-orange-500 text-white py-2.5 px-4 rounded-lg flex items-center justify-center gap-2 text-sm font-semibold hover:from-yellow-500 hover:to-orange-600 transition-all shadow-md"
                    >
                        <Plus size={18} />
                        New chat
                    </button>
                    <button className="p-3 rounded-lg border border-gray-700 text-gray-300 hover:bg-gray-700 transition-colors">
                        <Search size={18} />
                    </button>
                </div>

                {/* Mode Selector */}
                <div className="mt-4 p-3 bg-gray-800/50 rounded-lg border border-gray-700">
                    <p className="text-xs text-gray-400 mb-2">API Mode:</p>
                    <select
                        value={currentMode}
                        onChange={(e) => setCurrentMode(e.target.value as "auto" | "github" | "integration")}
                        className="w-full bg-gray-700 text-white p-2 rounded text-sm border border-gray-600"
                    >
                        <option value="auto">Auto-detect</option>
                        <option value="github">GitHub Only</option>
                        <option value="integration">Integrations Only</option>
                    </select>
                </div>

                <div className="mt-4 border-b border-gray-700 pb-2 mb-2">
                    <button className="w-full text-left text-sm font-semibold text-gray-400 hover:text-white p-2 rounded-md">
                        Your conversations
                    </button>
                </div>
                <nav className="flex-1 flex-col gap-1 overflow-y-auto pr-1 -mr-1">
                    {sidebarLinks.map((link, index) => (
                        <a
                            key={index}
                            href="#"
                            className={`flex items-center justify-between p-2.5 rounded-lg text-sm font-medium transition-colors ${link.active
                                ? "bg-blue-500/10 text-blue-400"
                                : "text-gray-300 hover:bg-gray-700"
                                }`}
                        >
                            <div className="flex items-center gap-3 truncate">
                                <link.icon size={16} />
                                <span className="truncate">{link.title}</span>
                            </div>
                            {link.active && (
                                <button className="p-1 text-gray-500 hover:text-gray-300">
                                    <MoreHorizontal size={16} />
                                </button>
                            )}
                        </a>
                    ))}
                </nav>
            </div>
            <div className="border-t border-gray-700 pt-4">
                <a
                    href="#"
                    className="flex items-center gap-3 p-2 rounded-lg hover:bg-gray-700 transition-colors mt-2"
                >
                    <div className="w-9 h-9 rounded-full bg-gradient-to-tr from-purple-400 to-blue-500 flex items-center justify-center text-white font-bold text-sm">
                        AN
                    </div>
                    <span className="text-sm font-semibold text-gray-200">
                        Andrea Nelson
                    </span>
                </a>
            </div>
        </div>
    );

    return (
      <>
        <style>{`
        .markdown-content pre { 
          background-color: #282c34 !important; 
          padding: 1rem; 
          border-radius: 8px; 
          overflow-x: auto; 
          font-family: 'Courier New', Courier, monospace; 
        }
        .markdown-content code:not(pre > code) { 
          background-color: #374151; 
          padding: 0.2rem 0.4rem; 
          border-radius: 0.25rem; 
          font-size: 0.9em; 
          color: #d1d5db; 
        }
        .markdown-content h1, .markdown-content h2, .markdown-content h3 { 
          font-weight: 600; 
          margin-top: 1.25em; 
          margin-bottom: 0.5em; 
          line-height: 1.2; 
          color: #f3f4f6;
        }
        .markdown-content ul, .markdown-content ol { 
          padding-left: 1.75rem; 
          margin: 0.5em 0; 
        }
        .markdown-content ul { 
          list-style-type: disc; 
        } 
        .markdown-content ol { 
          list-style-type: decimal; 
        }
        .markdown-content p { 
          margin-bottom: 0.75rem; 
        overflow-wrap: break-word;
        word-break: break-word;
        } 
        .markdown-content strong { 
          font-weight: 600; 
          color: #f9fafb;
        }
      `}</style>
        <div className="flex h-screen w-full bg-gradient-to-b from-black to-gray-900 text-gray-200 font-sans">
          {/* Desktop Sidebar */}
          <aside
            className={`h-full bg-gray-900/70 backdrop-blur-sm border-r border-gray-700/50 transition-all duration-300 hidden lg:flex flex-col justify-between ${
              isSidebarOpen ? "w-80 p-4" : "w-0 p-0 overflow-hidden"
            }`}
          >
            <SidebarContent />
          </aside>

          {/* Mobile Sidebar (Overlay) */}
          <div
            className={`fixed inset-0 bg-black/50 z-30 lg:hidden transition-opacity duration-300 ${
              isSidebarOpen ? "opacity-100" : "opacity-0 pointer-events-none"
            }`}
            onClick={() => setIsSidebarOpen(false)}
          ></div>
          <aside
            className={`fixed top-0 left-0 h-full bg-gray-900 border-r border-gray-700 p-4 flex flex-col justify-between z-40 transition-transform duration-300 lg:hidden ${
              isSidebarOpen ? "translate-x-0" : "-translate-x-full w-80"
            }`}
          >
            <SidebarContent />
          </aside>

          {/* ===== Main Chat Area ===== */}
          <main className="flex-1 flex flex-col relative">
            <button
              onClick={() => setIsSidebarOpen(!isSidebarOpen)}
              className="absolute top-5 left-5 z-10 p-2 bg-gray-700/50 rounded-md hover:bg-gray-600/70 transition-colors"
            >
              {isSidebarOpen ? (
                <>
                  <span className="lg:hidden">
                    <Menu size={20} />
                  </span>
                  <span className="hidden lg:block">
                    <PanelLeftClose size={20} />
                  </span>
                </>
              ) : (
                <>
                  <span className="lg:hidden">
                    <Menu size={20} />
                  </span>
                  <span className="hidden lg:block">
                    <PanelLeftOpen size={20} />
                  </span>
                </>
              )}
            </button>

            <div
              ref={chatContainerRef}
              className="flex-1 overflow-y-auto p-4 sm:p-6 md:p-10"
            >
              <div className="max-w-4xl mx-auto flex flex-col gap-10 pt-10">
                {messages.map((msg, index) => (
                  <div key={index} className="flex items-start gap-4">
                    <div
                      className={`flex-shrink-0 w-10 h-10 rounded-full flex items-center justify-center font-bold text-white ${
                        msg.sender === "ai"
                          ? msg.type === "github"
                            ? "bg-gradient-to-tr from-purple-500 to-pink-500"
                            : msg.type === "integration"
                            ? "bg-gradient-to-tr from-green-400 to-blue-500"
                            : "bg-gradient-to-tr from-yellow-400 to-orange-500"
                          : "bg-gradient-to-tr from-purple-400 to-blue-500"
                      }`}
                    >
                      {msg.sender === "ai" ? (
                        msg.type === "github" ? (
                          <Github size={20} />
                        ) : (
                          <Bot size={24} />
                        )
                      ) : (
                        <User size={24} />
                      )}
                    </div>
                    <div className="flex flex-col gap-2 max-w-2xl">
                      <div className="flex items-center gap-2">
                        <p className="font-bold text-gray-50">
                          {msg.sender === "ai" ? "SEAM" : "You"}
                        </p>
                        {msg.sender === "ai" && msg.type && (
                          <span
                            className={`px-2 py-1 text-xs rounded-full ${
                              msg.type === "github"
                                ? "bg-purple-500/20 text-purple-300"
                                : msg.type === "integration"
                                ? "bg-green-500/20 text-green-300"
                                : "bg-blue-500/20 text-blue-300"
                            }`}
                          >
                            {msg.type === "github"
                              ? "GitHub API"
                              : msg.type === "integration"
                              ? "Integrations"
                              : "General AI"}
                          </span>
                        )}
                      </div>
                      <div className="bg-gray-800 p-5 rounded-lg border border-gray-700 text-gray-200">
                        <div
                          className="markdown-content"
                          dangerouslySetInnerHTML={{
                            __html: renderMarkdown(msg.text),
                          }}
                        />

                        {/* GitHub-specific data rendering */}
                        {msg.type === "github" && msg.data && (
                          <div className="mt-4">
                            {renderGitHubResponse(msg.data)}
                          </div>
                        )}

                        {msg.sender === "ai" && (
                          <div className="flex items-center gap-3 text-gray-400 mt-4 pt-3 border-t border-gray-600">
                            <button className="p-1 hover:text-blue-400 transition-colors">
                              <ThumbsUp size={16} />
                            </button>
                            <button className="p-1 hover:text-red-400 transition-colors">
                              <ThumbsDown size={16} />
                            </button>
                            <button
                              className="p-1 hover:text-gray-200 transition-colors"
                              onClick={() => {
                                navigator.clipboard.writeText(msg.text);
                                toast.success("Response copied to clipboard!");
                              }}
                            >
                              <Copy size={16} />
                            </button>
                          </div>
                        )}
                      </div>
                    </div>
                  </div>
                ))}
                {isLoading && (
                  <div className="flex items-start gap-4">
                    <div className="flex-shrink-0 w-10 h-10 rounded-full flex items-center justify-center font-bold text-white bg-gradient-to-tr from-yellow-400 to-orange-500">
                      <Bot size={24} />
                    </div>
                    <div className="flex flex-col gap-2 max-w-2xl">
                      <p className="font-bold text-gray-50">SEAM</p>
                      <div className="bg-gray-800 p-5 rounded-lg border border-gray-700">
                        <div className="flex items-center justify-center gap-2">
                          <div className="w-2 h-2 bg-gray-400 rounded-full animate-pulse"></div>
                          <div className="w-2 h-2 bg-gray-400 rounded-full animate-pulse [animation-delay:0.2s]"></div>
                          <div className="w-2 h-2 bg-gray-400 rounded-full animate-pulse [animation-delay:0.4s]"></div>
                        </div>
                      </div>
                    </div>
                  </div>
                )}
              </div>
            </div>

            {/* ===== Input Form ===== */}
            <div className="mt-auto p-4 sm:p-5 bg-gray-900/50 backdrop-blur-sm border-t border-gray-700/50">
              <div className="max-w-4xl mx-auto">
                {/* Quick Action Buttons */}
                <div className="flex items-center gap-2 mb-3 overflow-x-auto pb-2">
                  {/* DUMMY GITHUB BUTTON ADDED HERE */}
                  <button
                    onClick={() =>
                      setCurrentMode(
                        currentMode === "github" ? "auto" : "github"
                      )
                    }
                    className={`flex items-center gap-2 px-3 py-1.5 rounded-full text-sm font-medium transition-colors border ${
                      currentMode === "github"
                        ? "bg-purple-500/20 text-purple-300 border-purple-500"
                        : "bg-gray-700 text-gray-300 border-transparent hover:bg-gray-600"
                    }`}
                  >
                    <Github size={14} />
                    <span>Query GitHub</span>
                  </button>

                  {/* Integration Toggles */}
                  {Object.keys(activeIntegrations).map((key) => (
                    <button
                      key={key}
                      onClick={() =>
                        handleIntegrationToggle(
                          key as
                            | "slack"
                            | "notion"
                            | "gmail"
                            | "teams"
                            | "drive"
                        )
                      }
                      className={`flex items-center gap-2 px-3 py-1.5 rounded-full text-sm font-medium transition-colors border ${
                        activeIntegrations[
                          key as keyof typeof activeIntegrations
                        ]
                          ? "bg-green-500/20 text-green-300 border-green-500"
                          : "bg-gray-700 text-gray-300 border-transparent hover:bg-gray-600"
                      }`}
                    >
                      <span>{key.charAt(0).toUpperCase() + key.slice(1)}</span>
                    </button>
                  ))}

                  {/* Simplify Toggle Button */}
                  <button
                    onClick={() => setIsSimplifyEnabled(!isSimplifyEnabled)}
                    className={`flex items-center gap-2 px-3 py-1.5 rounded-full text-sm font-medium transition-colors border ${
                      isSimplifyEnabled
                        ? "bg-yellow-500/20 text-yellow-300 border-yellow-500"
                        : "bg-gray-700 text-gray-300 border-transparent hover:bg-gray-600"
                    }`}
                  >
                    <Zap size={14} />
                    <span>Simplify</span>
                  </button>
                </div>

                <form onSubmit={handleFormSubmit} className="relative">
                  {/* <textarea
                    value={input}
                    onChange={(e) => setInput(e.target.value)}
                    onKeyDown={(e) => {
                      if (e.key === "Enter" && !e.shiftKey) {
                        e.preventDefault();
                        handleFormSubmit(e as any);
                      }
                    }}
                    placeholder={
                      currentMode === "github"
                        ? "e.g., 'Summarize the file structure of my latest repo'"
                        : "Ask SEAM anything..."
                    }
                    className="w-full bg-transparent border border-gray-600 rounded-lg p-4 pr-16 resize-none focus:outline-none focus:ring-2 focus:ring-blue-500 transition-shadow text-base"
                    rows={1}
                    disabled={isLoading}
                  /> */}
                  <TextareaAutosize
                    value={input}
                    onChange={(e : any) => setInput(e.target.value)}
                    onKeyDown={(e: any) => {
                      if (e.key === "Enter" && !e.shiftKey) {
                        e.preventDefault();
                        handleFormSubmit(e as any);
                      }
                    }}
                    placeholder={
                      currentMode === "github"
                        ? "e.g., 'Summarize the file structure of my latest repo'"
                        : "Ask SEAM anything..."
                    }
                    className="w-full bg-transparent border border-gray-600 rounded-xl p-4 pr-16 resize-none focus:outline-none focus:ring-2 focus:ring-blue-500 transition-shadow text-base"
                    disabled={isLoading}
                    minRows={1} 
                    maxRows={6} 
                  />
                  <button
                    type="submit"
                    disabled={isLoading || input.trim() === ""}
                    className="absolute right-4 top-1/2 -translate-y-1/2 p-2.5 rounded-full bg-gradient-to-br from-blue-500 to-purple-600 text-white disabled:opacity-50 disabled:cursor-not-allowed hover:from-blue-600 hover:to-purple-700 transition-all shadow-lg"
                  >
                    <Send size={20} />
                  </button>
                </form>
              </div>
            </div>
          </main>
        </div>
      </>
    );
};

export default UnifiedChatPage;