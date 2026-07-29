"use client";

import { useState, useEffect, Suspense } from "react";
import { useAuth } from "@clerk/nextjs";
import { useRouter, useSearchParams } from "next/navigation";
import toast from "react-hot-toast";
import {
  Github,
  Slack,
  Mail,
  FileText,
  Layers,
  CheckCircle2,
  XCircle,
  ExternalLink,
  RefreshCw,
  Key,
  ShieldCheck,
  Zap,
} from "lucide-react";

interface GithubStatusResponse {
  connected: boolean;
  githubUsername: string | null;
  createdAt?: string;
}

function SettingsContent() {
  const { userId, getToken } = useAuth();
  const router = useRouter();
  const searchParams = useSearchParams();

  const [githubStatus, setGithubStatus] = useState<GithubStatusResponse>({
    connected: false,
    githubUsername: null,
  });
  const [loading, setLoading] = useState(true);
  const [patModalOpen, setPatModalOpen] = useState(false);
  const [patToken, setPatToken] = useState("");
  const [submittingPat, setSubmittingPat] = useState(false);
  const [disconnecting, setDisconnecting] = useState(false);

  // Fetch GitHub Connection Status
  const fetchStatus = async () => {
    try {
      setLoading(true);
      const token = await getToken();
      const res = await fetch(
        `${process.env.NEXT_PUBLIC_API_URL || "http://localhost:3001"}/api/github/status`,
        {
          headers: { Authorization: `Bearer ${token}` },
        }
      );
      if (res.ok) {
        const data: GithubStatusResponse = await res.json();
        setGithubStatus(data);
      }
    } catch (err) {
      console.error("Error checking GitHub status:", err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchStatus();
  }, [getToken]);

  // Handle OAuth callback URL status params
  useEffect(() => {
    const statusParam = searchParams.get("githubStatus");
    const usernameParam = searchParams.get("username");
    const errorParam = searchParams.get("error");

    if (statusParam === "success") {
      toast.success(
        usernameParam
          ? `GitHub connected successfully as @${usernameParam}!`
          : "GitHub connected successfully!"
      );
      fetchStatus();
      // Remove query parameters from URL without reloading
      router.replace("/dashboard/settings");
    } else if (statusParam === "failed") {
      toast.error(
        errorParam
          ? `GitHub Connection Failed: ${decodeURIComponent(errorParam)}`
          : "GitHub connection failed. Please try again."
      );
      router.replace("/dashboard/settings");
    }
  }, [searchParams, router]);

  // Initiate OAuth Flow
  const handleConnectOAuth = () => {
    if (!userId) {
      toast.error("Please log in first.");
      return;
    }
    const backendUrl = process.env.NEXT_PUBLIC_API_URL || "http://localhost:3001";
    window.location.href = `${backendUrl}/auth/github?userId=${encodeURIComponent(userId)}`;
  };

  // Submit Personal Access Token
  const handleConnectPAT = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!patToken.trim()) {
      toast.error("Please enter a valid Personal Access Token.");
      return;
    }

    try {
      setSubmittingPat(true);
      const token = await getToken();
      const res = await fetch(
        `${process.env.NEXT_PUBLIC_API_URL || "http://localhost:3001"}/api/github/connect-pat`,
        {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
            Authorization: `Bearer ${token}`,
          },
          body: JSON.stringify({ token: patToken.trim() }),
        }
      );

      const data = await res.json();

      if (res.ok && data.connected) {
        toast.success(`GitHub connected as @${data.githubUsername}!`);
        setPatModalOpen(false);
        setPatToken("");
        fetchStatus();
      } else {
        toast.error(data.error || "Failed to connect GitHub token.");
      }
    } catch (err) {
      console.error("PAT Submit error:", err);
      toast.error("An error occurred while connecting GitHub PAT.");
    } finally {
      setSubmittingPat(false);
    }
  };

  // Disconnect GitHub
  const handleDisconnect = async () => {
    if (!confirm("Are you sure you want to disconnect GitHub?")) return;

    try {
      setDisconnecting(true);
      const token = await getToken();
      const res = await fetch(
        `${process.env.NEXT_PUBLIC_API_URL || "http://localhost:3001"}/api/github/disconnect`,
        {
          method: "DELETE",
          headers: { Authorization: `Bearer ${token}` },
        }
      );

      if (res.ok) {
        toast.success("GitHub disconnected.");
        setGithubStatus({ connected: false, githubUsername: null });
      } else {
        toast.error("Failed to disconnect GitHub.");
      }
    } catch (err) {
      console.error("Disconnect error:", err);
      toast.error("Error disconnecting GitHub.");
    } finally {
      setDisconnecting(false);
    }
  };

  return (
    <div className="min-h-screen bg-gradient-to-b from-black via-gray-950 to-gray-900 text-white px-6 md:px-16 py-10">
      <div className="max-w-6xl mx-auto space-y-10">
        
        {/* Header */}
        <div className="border-b border-white/10 pb-6 flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
          <div>
            <h1 className="text-3xl font-extrabold tracking-tight bg-clip-text text-transparent bg-gradient-to-r from-white via-gray-200 to-gray-400">
              Integrations & Services
            </h1>
            <p className="text-gray-400 text-sm mt-1">
              Connect your repositories, messaging channels, and documents to power SEAM AI context.
            </p>
          </div>
          <button
            onClick={fetchStatus}
            disabled={loading}
            className="flex items-center gap-2 px-3 py-1.5 rounded-lg text-xs font-medium bg-white/5 border border-white/10 hover:bg-white/10 transition text-gray-300"
          >
            <RefreshCw className={`w-3.5 h-3.5 ${loading ? "animate-spin text-purple-400" : ""}`} />
            Refresh Status
          </button>
        </div>

        {/* Integration Grid */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">

          {/* GITHUB CARD (ACTIVE & FULLY FUNCTIONAL) */}
          <div className="relative group bg-gray-900/60 backdrop-blur-xl border border-white/10 hover:border-purple-500/50 rounded-2xl p-6 transition-all duration-300 shadow-xl flex flex-col justify-between">
            <div className="space-y-4">
              <div className="flex justify-between items-start">
                <div className="p-3 bg-white/5 border border-white/10 rounded-xl group-hover:bg-purple-500/10 transition">
                  <Github className="w-8 h-8 text-white group-hover:text-purple-400 transition" />
                </div>
                {loading ? (
                  <span className="px-2.5 py-1 text-xs rounded-full bg-white/5 text-gray-400 animate-pulse">
                    Checking...
                  </span>
                ) : githubStatus.connected ? (
                  <span className="flex items-center gap-1.5 px-3 py-1 text-xs font-semibold rounded-full bg-emerald-500/10 text-emerald-400 border border-emerald-500/20">
                    <CheckCircle2 className="w-3.5 h-3.5" />
                    Connected
                  </span>
                ) : (
                  <span className="flex items-center gap-1.5 px-3 py-1 text-xs font-semibold rounded-full bg-gray-800 text-gray-400 border border-gray-700">
                    <XCircle className="w-3.5 h-3.5" />
                    Not Connected
                  </span>
                )}
              </div>

              <div>
                <h3 className="text-xl font-bold text-white flex items-center gap-2">
                  GitHub
                  <Zap className="w-4 h-4 text-purple-400" />
                </h3>
                <p className="text-xs text-gray-400 mt-1 leading-relaxed">
                  Sync public & private repositories, branches, and commit histories into vector embeddings for deep AI context search.
                </p>
              </div>

              {githubStatus.connected && (
                <div className="p-3 rounded-lg bg-purple-950/30 border border-purple-500/20 text-xs space-y-1">
                  <div className="text-gray-300 font-medium flex items-center justify-between">
                    <span>Account:</span>
                    <span className="font-mono text-purple-300">@{githubStatus.githubUsername}</span>
                  </div>
                  {githubStatus.createdAt && (
                    <div className="text-gray-400 text-[11px]">
                      Connected: {new Date(githubStatus.createdAt).toLocaleDateString()}
                    </div>
                  )}
                </div>
              )}
            </div>

            {/* Actions */}
            <div className="mt-6 pt-4 border-t border-white/10 space-y-2">
              {githubStatus.connected ? (
                <div className="flex gap-2">
                  <button
                    onClick={() => router.push("/dashboard/repos")}
                    className="flex-1 py-2 px-3 bg-purple-600 hover:bg-purple-500 text-white rounded-lg text-xs font-semibold transition flex items-center justify-center gap-1.5 shadow-md shadow-purple-900/30"
                  >
                    <ExternalLink className="w-3.5 h-3.5" />
                    Sync Repos
                  </button>
                  <button
                    onClick={handleDisconnect}
                    disabled={disconnecting}
                    className="py-2 px-3 bg-red-500/10 hover:bg-red-500/20 border border-red-500/20 text-red-400 rounded-lg text-xs font-semibold transition"
                  >
                    {disconnecting ? "..." : "Disconnect"}
                  </button>
                </div>
              ) : (
                <div className="space-y-2">
                  <button
                    onClick={handleConnectOAuth}
                    className="w-full py-2.5 px-4 bg-gradient-to-r from-purple-600 to-indigo-600 hover:from-purple-500 hover:to-indigo-500 text-white rounded-lg text-xs font-semibold transition flex items-center justify-center gap-2 shadow-lg shadow-purple-900/30"
                  >
                    <Github className="w-4 h-4" />
                    Connect via GitHub OAuth
                  </button>
                  <button
                    onClick={() => setPatModalOpen(true)}
                    className="w-full py-2 px-3 bg-white/5 hover:bg-white/10 border border-white/10 text-gray-300 rounded-lg text-xs font-medium transition flex items-center justify-center gap-1.5"
                  >
                    <Key className="w-3.5 h-3.5 text-purple-400" />
                    Connect via Personal Access Token
                  </button>
                </div>
              )}
            </div>
          </div>

          {/* SLACK CARD */}
          <div className="bg-gray-900/40 backdrop-blur-xl border border-white/5 rounded-2xl p-6 flex flex-col justify-between">
            <div className="space-y-4">
              <div className="flex justify-between items-start">
                <div className="p-3 bg-white/5 border border-white/10 rounded-xl">
                  <Slack className="w-8 h-8 text-emerald-400" />
                </div>
                <span className="px-3 py-1 text-xs font-semibold rounded-full bg-gray-800 text-gray-400 border border-gray-700">
                  Coming Soon
                </span>
              </div>
              <div>
                <h3 className="text-xl font-bold text-white">Slack</h3>
                <p className="text-xs text-gray-400 mt-1 leading-relaxed">
                  Index workspace messages, channel threads, and technical decisions to provide conversational team context.
                </p>
              </div>
            </div>
            <div className="mt-6 pt-4 border-t border-white/5">
              <button
                onClick={() => toast("Slack integration is coming soon in the next release!", { icon: "🚀" })}
                className="w-full py-2 px-3 bg-white/5 hover:bg-white/10 border border-white/10 text-gray-400 rounded-lg text-xs font-medium transition"
              >
                Configure Slack
              </button>
            </div>
          </div>

          {/* EMAIL CARD */}
          <div className="bg-gray-900/40 backdrop-blur-xl border border-white/5 rounded-2xl p-6 flex flex-col justify-between">
            <div className="space-y-4">
              <div className="flex justify-between items-start">
                <div className="p-3 bg-white/5 border border-white/10 rounded-xl">
                  <Mail className="w-8 h-8 text-blue-400" />
                </div>
                <span className="px-3 py-1 text-xs font-semibold rounded-full bg-gray-800 text-gray-400 border border-gray-700">
                  Coming Soon
                </span>
              </div>
              <div>
                <h3 className="text-xl font-bold text-white">Email (SMTP / Gmail)</h3>
                <p className="text-xs text-gray-400 mt-1 leading-relaxed">
                  Extract security alerts, code review emails, and project correspondence automatically into SEAM knowledge base.
                </p>
              </div>
            </div>
            <div className="mt-6 pt-4 border-t border-white/5">
              <button
                onClick={() => toast("Email integration is coming soon in the next release!", { icon: "📧" })}
                className="w-full py-2 px-3 bg-white/5 hover:bg-white/10 border border-white/10 text-gray-400 rounded-lg text-xs font-medium transition"
              >
                Connect Email
              </button>
            </div>
          </div>

          {/* NOTION CARD */}
          <div className="bg-gray-900/40 backdrop-blur-xl border border-white/5 rounded-2xl p-6 flex flex-col justify-between">
            <div className="space-y-4">
              <div className="flex justify-between items-start">
                <div className="p-3 bg-white/5 border border-white/10 rounded-xl">
                  <FileText className="w-8 h-8 text-amber-400" />
                </div>
                <span className="px-3 py-1 text-xs font-semibold rounded-full bg-gray-800 text-gray-400 border border-gray-700">
                  Coming Soon
                </span>
              </div>
              <div>
                <h3 className="text-xl font-bold text-white">Notion Workspace</h3>
                <p className="text-xs text-gray-400 mt-1 leading-relaxed">
                  Sync product spec documents, engineering guides, and architecture RFCs directly into vector search.
                </p>
              </div>
            </div>
            <div className="mt-6 pt-4 border-t border-white/5">
              <button
                onClick={() => toast("Notion workspace integration is coming soon!", { icon: "📝" })}
                className="w-full py-2 px-3 bg-white/5 hover:bg-white/10 border border-white/10 text-gray-400 rounded-lg text-xs font-medium transition"
              >
                Connect Notion
              </button>
            </div>
          </div>

          {/* LINEAR / JIRA CARD */}
          <div className="bg-gray-900/40 backdrop-blur-xl border border-white/5 rounded-2xl p-6 flex flex-col justify-between">
            <div className="space-y-4">
              <div className="flex justify-between items-start">
                <div className="p-3 bg-white/5 border border-white/10 rounded-xl">
                  <Layers className="w-8 h-8 text-pink-400" />
                </div>
                <span className="px-3 py-1 text-xs font-semibold rounded-full bg-gray-800 text-gray-400 border border-gray-700">
                  Coming Soon
                </span>
              </div>
              <div>
                <h3 className="text-xl font-bold text-white">Linear / Jira</h3>
                <p className="text-xs text-gray-400 mt-1 leading-relaxed">
                  Index issue tickets, sprint goals, and task assignees to map bug reports directly to code snippets.
                </p>
              </div>
            </div>
            <div className="mt-6 pt-4 border-t border-white/5">
              <button
                onClick={() => toast("Linear/Jira integration is coming soon!", { icon: "🎯" })}
                className="w-full py-2 px-3 bg-white/5 hover:bg-white/10 border border-white/10 text-gray-400 rounded-lg text-xs font-medium transition"
              >
                Connect Issues
              </button>
            </div>
          </div>

        </div>

        {/* Security Note Banner */}
        <div className="p-4 rounded-xl bg-purple-950/20 border border-purple-500/20 flex items-center gap-3 text-xs text-purple-300">
          <ShieldCheck className="w-5 h-5 text-purple-400 flex-shrink-0" />
          <p>
            All access tokens and credentials are securely encrypted using AES-256 before being stored. Tokens are never exposed to client-side scripts.
          </p>
        </div>

      </div>

      {/* PAT MODAL */}
      {patModalOpen && (
        <div className="fixed inset-0 bg-black/80 backdrop-blur-md z-50 flex items-center justify-center p-4">
          <div className="bg-gray-900 border border-white/10 w-full max-w-lg rounded-2xl shadow-2xl p-6 space-y-6 relative">
            <div className="flex justify-between items-center border-b border-white/10 pb-4">
              <h2 className="text-lg font-bold text-white flex items-center gap-2">
                <Key className="w-5 h-5 text-purple-400" />
                Connect GitHub via Personal Access Token
              </h2>
              <button
                onClick={() => setPatModalOpen(false)}
                className="text-gray-400 hover:text-white transition"
              >
                &times;
              </button>
            </div>

            <form onSubmit={handleConnectPAT} className="space-y-4">
              <div>
                <label className="block text-xs font-semibold text-gray-300 mb-1">
                  GitHub Personal Access Token (PAT)
                </label>
                <input
                  type="password"
                  value={patToken}
                  onChange={(e) => setPatToken(e.target.value)}
                  placeholder="ghp_xxxxxxxxxxxxxxxxxxxxxxxx"
                  className="w-full px-4 py-2.5 rounded-lg bg-black/50 border border-white/15 text-white placeholder-gray-500 text-sm focus:outline-none focus:border-purple-500"
                  required
                />
                <p className="text-[11px] text-gray-400 mt-1.5 flex items-center gap-1">
                  Requires <code className="bg-gray-800 px-1 py-0.5 rounded text-purple-300">repo</code> scope.
                  <a
                    href="https://github.com/settings/tokens/new?scopes=repo&description=SEAM%20Integration"
                    target="_blank"
                    rel="noreferrer"
                    className="text-purple-400 hover:underline flex items-center gap-0.5 ml-1"
                  >
                    Generate Token <ExternalLink className="w-3 h-3" />
                  </a>
                </p>
              </div>

              <div className="flex justify-end gap-3 pt-4 border-t border-white/10">
                <button
                  type="button"
                  onClick={() => setPatModalOpen(false)}
                  className="px-4 py-2 bg-gray-800 hover:bg-gray-700 text-gray-300 rounded-lg text-xs font-semibold transition"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={submittingPat}
                  className="px-5 py-2 bg-purple-600 hover:bg-purple-500 text-white rounded-lg text-xs font-semibold transition shadow-lg shadow-purple-900/40"
                >
                  {submittingPat ? "Connecting..." : "Save Connection"}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

    </div>
  );
}

export default function SettingsPage() {
  return (
    <Suspense fallback={
      <div className="min-h-screen bg-black text-white flex items-center justify-center p-10">
        <div className="flex items-center gap-3 text-gray-400 text-sm">
          <RefreshCw className="w-5 h-5 animate-spin text-purple-400" />
          Loading settings...
        </div>
      </div>
    }>
      <SettingsContent />
    </Suspense>
  );
}
