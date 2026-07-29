"use client";

import { useEffect } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import toast from "react-hot-toast";
import { useAuth } from "@clerk/nextjs";
import { Sliders, FolderGit2, MessageSquareText, Zap } from "lucide-react";

export default function DashboardClient() {
  const searchParams = useSearchParams();
  const githubStatus = searchParams.get("githubStatus");
  const router = useRouter();
  const { userId } = useAuth();

  useEffect(() => {
    if (githubStatus === "success") {
      toast.success("GitHub Connected Successfully!");
      router.push("/dashboard/settings?githubStatus=success");
    } else if (githubStatus === "failed") {
      toast.error("❌ GitHub Connection Failed");
      router.push("/dashboard/settings?githubStatus=failed");
    }
  }, [githubStatus, router]);

  return (
    <div className="min-h-screen bg-gradient-to-b from-black via-gray-950 to-gray-900 text-white flex flex-col items-center justify-center p-6">
      <div className="max-w-3xl w-full text-center space-y-8">
        <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-purple-500/10 border border-purple-500/20 text-purple-300 text-xs font-semibold">
          <Zap className="w-3.5 h-3.5" /> SEAM AI Workspace
        </div>
        
        <h1 className="text-4xl font-extrabold tracking-tight bg-clip-text text-transparent bg-gradient-to-r from-white via-gray-200 to-purple-300">
          Welcome to SEAM
        </h1>
        <p className="text-gray-400 text-sm max-w-lg mx-auto">
          Manage integrations, index your codebases, and ask intelligent questions across your repositories.
        </p>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-6 pt-6">
          <button
            onClick={() => router.push("/dashboard/settings")}
            className="p-6 rounded-2xl bg-gray-900/60 border border-white/10 hover:border-purple-500/50 hover:bg-gray-900 transition text-left space-y-3 group"
          >
            <div className="p-3 bg-purple-500/10 border border-purple-500/20 rounded-xl w-fit text-purple-400 group-hover:scale-110 transition">
              <Sliders className="w-6 h-6" />
            </div>
            <div>
              <h3 className="text-lg font-bold text-white">Integrations</h3>
              <p className="text-xs text-gray-400 mt-1">Connect GitHub, Slack, Email, and Notion.</p>
            </div>
          </button>

          <button
            onClick={() => router.push("/dashboard/repos")}
            className="p-6 rounded-2xl bg-gray-900/60 border border-white/10 hover:border-purple-500/50 hover:bg-gray-900 transition text-left space-y-3 group"
          >
            <div className="p-3 bg-indigo-500/10 border border-indigo-500/20 rounded-xl w-fit text-indigo-400 group-hover:scale-110 transition">
              <FolderGit2 className="w-6 h-6" />
            </div>
            <div>
              <h3 className="text-lg font-bold text-white">Repositories</h3>
              <p className="text-xs text-gray-400 mt-1">Select and sync branches into vector storage.</p>
            </div>
          </button>

          <button
            onClick={() => router.push("/dashboard/ask")}
            className="p-6 rounded-2xl bg-gray-900/60 border border-white/10 hover:border-purple-500/50 hover:bg-gray-900 transition text-left space-y-3 group"
          >
            <div className="p-3 bg-emerald-500/10 border border-emerald-500/20 rounded-xl w-fit text-emerald-400 group-hover:scale-110 transition">
              <MessageSquareText className="w-6 h-6" />
            </div>
            <div>
              <h3 className="text-lg font-bold text-white">Ask SEAM</h3>
              <p className="text-xs text-gray-400 mt-1">Query code changes, commit authors, and logic.</p>
            </div>
          </button>
        </div>
      </div>
    </div>
  );
}
