"use client";
import { useEffect, useState } from "react";
import { useAuth } from "@clerk/nextjs";
import { useRouter } from "next/navigation";

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
    const { getToken } = useAuth();
    const router = useRouter();

    const [repos, setRepos] = useState<Repo[]>([]);
    const [modalOpen, setModalOpen] = useState(false);
    const [selectedRepo, setSelectedRepo] = useState<Repo | null>(null);
    const [branches, setBranches] = useState<Branch[]>([]);
    const [loading, setLoading] = useState(false);
    const [syncing, setSyncing] = useState(false);

    useEffect(() => {
        const fetchRepos = async () => {
            try {
                const token = await getToken();
                const res = await fetch(`${process.env.NEXT_PUBLIC_API_URL}/api/github/all-repos`, {
                    headers: { Authorization: `Bearer ${token}` },
                });
                const data = await res.json();
                setRepos(data);
            } catch (err) {
                console.error("Error fetching repos:", err);
            }
        };
        fetchRepos();
    }, [getToken]);

    const handleOpenModal = async (repo: Repo) => {
        setSelectedRepo(repo);
        setModalOpen(true);
        setLoading(true);
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
            setLoading(false);
        }
    };

    const handleSyncBranch = async (branchName: string) => {
        if (!selectedRepo) return;
        setSyncing(true);
        try {
            const token = await getToken();
            const res = await fetch(
                `${process.env.NEXT_PUBLIC_API_URL}/api/github/repos/${selectedRepo.owner.login}/${selectedRepo.name}/sync-branch`,
                {
                    method: "POST",
                    headers: { "Content-Type": "application/json", Authorization: `Bearer ${token}` },
                    body: JSON.stringify({ branch: branchName }),
                }
            );
            const data = await res.json();
            if (res.ok) router.push("/dashboard/ask");
            else alert(data.error || "Failed to sync branch");
        } catch (err) {
            console.error("Error syncing branch:", err);
        } finally {
            setSyncing(false);
            setModalOpen(false);
        }
    };

    return (
        <div className="pt-[80px] p-4 min-h-screen bg-gray-900 text-white">
            <h1 className="text-3xl font-bold mb-6">Sync Repositories</h1>

            {/* Grid of repos */}
            <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-6">
                {repos.map((repo) => (
                    <div
                        key={repo.id}
                        className="bg-gray-800 p-5 rounded-lg shadow-md hover:shadow-xl transform hover:scale-105 transition cursor-pointer"
                        onClick={() => handleOpenModal(repo)}
                    >
                        <h2 className="text-lg font-semibold mb-2">{repo.name}</h2>
                        <p className="text-sm text-gray-400 truncate">{repo.full_name}</p>
                    </div>
                ))}
            </div>

            {/* Modal */}
            {modalOpen && selectedRepo && (
                <div className="fixed inset-0 bg-black/70 z-50 flex items-center justify-center p-4">
                    <div className="bg-gray-800 w-full max-w-md rounded-lg shadow-xl relative overflow-hidden">
                        {/* Header */}
                        <div className="flex justify-between items-center p-4 border-b border-gray-700">
                            <h2 className="text-lg font-bold">{selectedRepo.name}</h2>
                            <button
                                onClick={() => setModalOpen(false)}
                                className="text-gray-400 hover:text-white transition text-2xl font-bold"
                            >
                                &times;
                            </button>
                        </div>

                        {/* Body */}
                        <div className="p-4 max-h-96 overflow-y-auto">
                            {loading ? (
                                <p className="text-center text-gray-400">Loading branches...</p>
                            ) : branches.length > 0 ? (
                                <ul className="space-y-2">
                                    {branches.map((b) => (
                                        <li key={b.name}>
                                            <button
                                                onClick={() => handleSyncBranch(b.name)}
                                                disabled={syncing}
                                                className="w-full px-4 py-2 bg-gray-700 hover:bg-gray-600 rounded transition text-left flex justify-between items-center"
                                            >
                                                {b.name}
                                                <span className="text-sm text-gray-400">Sync</span>
                                            </button>
                                        </li>
                                    ))}
                                </ul>
                            ) : (
                                <p className="text-center text-gray-400">No branches found</p>
                            )}
                        </div>

                        {/* Footer */}
                        <div className="p-4 border-t border-gray-700 flex justify-end gap-3">
                            <button
                                onClick={() => setModalOpen(false)}
                                className="px-4 py-2 bg-gray-600 hover:bg-gray-500 rounded transition"
                            >
                                Close
                            </button>
                        </div>

                        {/* Syncing Loader */}
                        {syncing && (
                            <div className="absolute inset-0 bg-black/50 flex items-center justify-center">
                                <div className="loader ease-linear rounded-full border-8 border-t-8 border-gray-200 h-16 w-16"></div>
                                <style jsx>{`
                  .loader {
                    border-top-color: #4f46e5;
                    animation: spin 1s linear infinite;
                  }
                  @keyframes spin {
                    0% { transform: rotate(0deg); }
                    100% { transform: rotate(360deg); }
                  }
                `}</style>
                            </div>
                        )}
                    </div>
                </div>
            )}
        </div>
    );
}
