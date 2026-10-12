"use client";
import { useEffect, useState } from "react";
import { useAuth } from "@clerk/nextjs";
import { useRouter } from "next/navigation";
import toast from "react-hot-toast";
import { RotateCw, Loader2 } from "lucide-react";

interface Repo {
    id: number;
    name: string;
    full_name: string;
    owner: { login: string };
}

interface Branch {
    name: string;
}

export default function GithubReposPage() {
    const { getToken, userId } = useAuth();
    const router = useRouter();

    const [repos, setRepos] = useState<Repo[]>([]);
    const [refreshing, setRefreshing] = useState(false);
    const [modalOpen, setModalOpen] = useState(false);
    const [selectedRepo, setSelectedRepo] = useState<Repo | null>(null);
    const [branches, setBranches] = useState<Branch[]>([]);
    const [loadingBranches, setLoadingBranches] = useState(false);
    const [syncing, setSyncing] = useState(false);
    const [syncPercent, setSyncPercent] = useState(0);

    const cacheKey = userId ? `seam_repos_${userId}` : "seam_repos";

    const fetchRepos = async (force = false) => {
        if (!force && typeof window !== "undefined") {
            try {
                const cached = localStorage.getItem(cacheKey);
                if (cached) {
                    const parsed = JSON.parse(cached);
                    if (Array.isArray(parsed) && parsed.length > 0) {
                        setRepos(parsed);
                        return;
                    }
                }
            } catch (_) {}
        }

        if (force) setRefreshing(true);

        try {
            const token = await getToken();
            const res = await fetch(`${process.env.NEXT_PUBLIC_API_URL}/api/github/all-repos`, {
                headers: { Authorization: `Bearer ${token}` },
            });
            const data = await res.json();
            if (Array.isArray(data)) {
                setRepos(data);
                if (typeof window !== "undefined") {
                    localStorage.setItem(cacheKey, JSON.stringify(data));
                }
                if (force) toast.success("Refreshed repositories");
            } else if (data.error) {
                toast.error(data.error);
            }
        } catch (err) {
            console.error("Error fetching repos:", err);
            if (force) toast.error("Failed to refresh");
        } finally {
            setRefreshing(false);
        }
    };

    useEffect(() => {
        fetchRepos(false);
    }, [userId]);

    const handleOpenModal = async (repo: Repo) => {
        setSelectedRepo(repo);
        setModalOpen(true);
        setLoadingBranches(true);
        try {
            const token = await getToken();
            const res = await fetch(
                `${process.env.NEXT_PUBLIC_API_URL}/api/github/repos/${repo.owner.login}/${repo.name}/branches`,
                { headers: { Authorization: `Bearer ${token}` } }
            );
            const data = await res.json();
            setBranches(Array.isArray(data) ? data : []);
        } catch (err) {
            console.error("Error fetching branches:", err);
        } finally {
            setLoadingBranches(false);
        }
    };

    const handleSyncBranch = async (branchName: string) => {
        if (!selectedRepo) return;
        setSyncing(true);
        setSyncPercent(0);

        try {
            const token = await getToken();
            const res = await fetch(
                `${process.env.NEXT_PUBLIC_API_URL}/api/github/repos/${selectedRepo.owner.login}/${selectedRepo.name}/sync-branch`,
                {
                    method: "POST",
                    headers: {
                        "Content-Type": "application/json",
                        "Accept": "text/event-stream",
                        Authorization: `Bearer ${token}`,
                    },
                    body: JSON.stringify({ branch: branchName }),
                }
            );

            if (!res.ok) {
                const errData = await res.json().catch(() => ({}));
                throw new Error(errData.error || "Failed to sync branch");
            }

            const reader = res.body?.getReader();
            if (reader) {
                const decoder = new TextDecoder();
                let buffer = "";

                while (true) {
                    const { done, value } = await reader.read();
                    if (done) break;

                    buffer += decoder.decode(value, { stream: true });
                    const parts = buffer.split("\n\n");
                    buffer = parts.pop() || "";

                    for (const part of parts) {
                        for (const rawLine of part.split("\n")) {
                            const line = rawLine.trim();
                            if (line.startsWith("data: ")) {
                                try {
                                    const data = JSON.parse(line.slice(6));
                                    if (data.error) throw new Error(data.error);
                                    if (typeof data.percent === "number") {
                                        setSyncPercent(data.percent);
                                    }
                                } catch (e: any) {
                                    if (e.message && !e.message.includes("JSON")) throw e;
                                }
                            }
                        }
                    }
                }
            }

            toast.success(`Synced ${selectedRepo.name}`);
            router.push("/dashboard/ask");
        } catch (err: any) {
            console.error("Error syncing branch:", err);
            toast.error(err?.message || "Failed to sync branch");
        } finally {
            setSyncing(false);
            setModalOpen(false);
        }
    };

    return (
        <div className="p-6 min-h-[calc(100vh-80px)] bg-gray-900 text-white w-full max-w-full">
            <div className="flex items-center justify-between mb-6">
                <h1 className="text-2xl font-bold">Sync Repositories</h1>
                <button
                    onClick={() => fetchRepos(true)}
                    disabled={refreshing}
                    className="flex items-center gap-1.5 px-3 py-1.5 text-xs bg-gray-800 hover:bg-gray-750 text-gray-300 rounded border border-gray-700 transition cursor-pointer"
                >
                    <RotateCw className={`w-3.5 h-3.5 ${refreshing ? "animate-spin" : ""}`} />
                    <span>Refresh</span>
                </button>
            </div>

            {/* Grid of repos */}
            <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4">
                {repos.map((repo) => (
                    <div
                        key={repo.id}
                        className="bg-gray-800 p-4 rounded-lg hover:bg-gray-750 border border-gray-700/60 transition cursor-pointer"
                        onClick={() => handleOpenModal(repo)}
                    >
                        <h2 className="text-base font-semibold mb-1 truncate">{repo.name}</h2>
                        <p className="text-xs text-gray-400 truncate">{repo.full_name}</p>
                    </div>
                ))}
            </div>

            {/* Modal */}
            {modalOpen && selectedRepo && (
                <div className="fixed inset-0 bg-black/70 z-50 flex items-center justify-center p-4">
                    <div className="bg-gray-800 w-full max-w-md rounded-lg shadow-xl relative overflow-hidden">
                        <div className="flex justify-between items-center p-4 border-b border-gray-700">
                            <h2 className="text-base font-bold">{selectedRepo.name}</h2>
                            <button
                                onClick={() => setModalOpen(false)}
                                className="text-gray-400 hover:text-white text-xl cursor-pointer"
                            >
                                &times;
                            </button>
                        </div>

                        <div className="p-4 max-h-80 overflow-y-auto">
                            {loadingBranches ? (
                                <p className="text-center text-xs text-gray-400">Loading branches...</p>
                            ) : branches.length > 0 ? (
                                <ul className="space-y-1.5">
                                    {branches.map((b) => (
                                        <li key={b.name}>
                                            <button
                                                onClick={() => handleSyncBranch(b.name)}
                                                disabled={syncing}
                                                className="w-full px-3 py-2 bg-gray-700/60 hover:bg-gray-700 rounded text-xs flex justify-between items-center transition cursor-pointer"
                                            >
                                                <span>{b.name}</span>
                                                <span className="text-gray-400">Sync</span>
                                            </button>
                                        </li>
                                    ))}
                                </ul>
                            ) : (
                                <p className="text-center text-xs text-gray-400">No branches found</p>
                            )}
                        </div>

                        {/* Minimal Loading Screen during chunking */}
                        {syncing && (
                            <div className="absolute inset-0 bg-gray-900/95 flex flex-col items-center justify-center gap-2 p-4">
                                <Loader2 className="w-5 h-5 text-indigo-400 animate-spin" />
                                <span className="text-sm font-semibold">{syncPercent}%</span>
                                <div className="w-32 bg-gray-700 rounded-full h-1">
                                    <div
                                        className="bg-indigo-500 h-1 rounded-full transition-all duration-300"
                                        style={{ width: `${Math.max(2, syncPercent)}%` }}
                                    />
                                </div>
                            </div>
                        )}
                    </div>
                </div>
            )}
        </div>
    );
}
