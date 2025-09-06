"use client";

import { useState } from "react";
import { marked } from "marked";
import DOMPurify from "dompurify";
import { useAuth } from "@clerk/nextjs";
import { Bot, User, Send } from "lucide-react";
import { PlaceholdersAndVanishInput } from "@/components/ui/placeholders-and-vanish-input";

// Helper to safely render markdown
const renderMarkdown = (text: string) => {
    return DOMPurify.sanitize(marked(text || "", { gfm: true, breaks: true }));
};

export default function App() {
    const [question, setQuestion] = useState("");
    const [response, setResponse] = useState<any>(null);
    const [loading, setLoading] = useState(false);
    const { getToken } = useAuth();

    const handleAsk = async () => {
        if (!question.trim()) return;
        const token = await getToken();
        setLoading(true);
        try {
            const res = await fetch("http://localhost:3001/api/github/ask", {
                method: "POST",
                headers: {
                    "Content-Type": "application/json",
                    Authorization: `Bearer ${token}`,
                },
                body: JSON.stringify({ question }),
            });
            const data = await res.json();
            setResponse(data);
        } catch (err) {
            console.error("❌ Error:", err);
        } finally {
            setLoading(false);
        }
    };

    return (
        <div className="flex h-screen w-full bg-gradient-to-b from-black to-gray-900 text-gray-200 font-sans">
            {/* ===== Main Chat Area ===== */}
            <main className="flex-1 flex flex-col relative">
                {/* Chat Messages */}
                <div className="flex-1 overflow-y-auto p-6 md:p-10">
                    <div className="max-w-4xl mx-auto flex flex-col gap-10 pt-10">
                        {/* User Question */}
                        {response && (
                            <div className="flex items-start gap-4">
                                <div className="flex-shrink-0 w-10 h-10 rounded-full flex items-center justify-center font-bold text-white bg-gradient-to-tr from-purple-400 to-blue-500">
                                    <User size={24} />
                                </div>
                                <div className="flex flex-col gap-2 max-w-2xl">
                                    <p className="font-bold text-gray-50">You</p>
                                    <div className="bg-gray-800 p-5 rounded-lg border border-gray-700 text-gray-200">
                                        {response.question}
                                    </div>
                                </div>
                            </div>
                        )}

                        {/* AI Response */}
                        {response && (
                            <div className="flex items-start gap-4">
                                <div className="flex-shrink-0 w-10 h-10 rounded-full flex items-center justify-center font-bold text-white bg-gradient-to-tr from-yellow-400 to-orange-500">
                                    <Bot size={24} />
                                </div>
                                <div className="flex flex-col gap-2 max-w-2xl">
                                    <p className="font-bold text-gray-50">SEAM</p>

                                    {/* Summary */}
                                    {response.summary && (
                                        <div className="bg-gray-800 p-5 rounded-lg border border-gray-700 text-gray-200 markdown-content">
                                            <div dangerouslySetInnerHTML={{ __html: renderMarkdown(response.summary) }} />
                                        </div>
                                    )}

                                    {/* Project Info */}
                                    {(response.project_name || response.language || response.database || response.features?.length > 0) && (
                                        <div className="bg-blue-900/40 p-4 rounded-lg border border-blue-700 text-sm">
                                            <h2 className="font-semibold mb-2 text-blue-300">📌 Project Info</h2>
                                            {response.project_name && <p><b>Project:</b> {response.project_name}</p>}
                                            {response.language && <p><b>Language:</b> {response.language}</p>}
                                            {response.database && <p><b>Database:</b> {response.database}</p>}
                                            {response.features?.length > 0 && <p><b>Features:</b> {response.features.join(", ")}</p>}
                                            {response.files?.length > 0 && <p><b>Files:</b> {response.files.join(", ")}</p>}
                                        </div>
                                    )}

                                    {/* Commit Info */}
                                    {(response.author || response.contributor || response.lastEdited || response.commitUrl) && (
                                        <div className="bg-green-900/40 p-4 rounded-lg border border-green-700 text-sm">
                                            <h2 className="font-semibold mb-2 text-green-300">📝 Commit Info</h2>
                                            {response.author && <p><b>Author:</b> {response.author}</p>}
                                            {response.contributor && <p><b>Contributor:</b> {response.contributor}</p>}
                                            {response.lastEdited && <p><b>Last Edited:</b> {new Date(response.lastEdited).toLocaleString()}</p>}
                                            {response.commitUrl && (
                                                <p>
                                                    <b>Commit URL:</b>{" "}
                                                    <a href={response.commitUrl} target="_blank" rel="noopener noreferrer" className="text-blue-400 underline">
                                                        {response.commitUrl}
                                                    </a>
                                                </p>
                                            )}
                                        </div>
                                    )}

                                    {/* Matches */}
                                    {response.matches?.length > 0 && (
                                        <div className="bg-gray-800 p-4 rounded-lg border border-gray-700">
                                            <h2 className="font-semibold mb-2 text-gray-200">🔎 Matches</h2>
                                            <div className="space-y-4">
                                                {response.matches.map((m: any, idx: number) => {
                                                    const fileUrl = `https://github.com/${m.metadata.username}/${m.metadata.repo}/blob/${m.metadata.branch}/${m.metadata.file}`;
                                                    return (
                                                        <a
                                                            key={idx}
                                                            href={fileUrl}
                                                            target="_blank"
                                                            rel="noopener noreferrer"
                                                            className="block p-4 border rounded-lg bg-gray-900 hover:bg-gray-700 transition"
                                                        >
                                                            <p className="text-sm text-gray-400 mb-2">
                                                                <b>Repo:</b> {m.metadata.repo} <br />
                                                                <b>File:</b> {m.metadata.file} <br />
                                                                <b>Branch:</b> {m.metadata.branch} <br />
                                                                <b>Score:</b> {m.score.toFixed(3)}
                                                            </p>
                                                            <pre className="text-xs bg-black text-green-400 p-2 rounded-lg overflow-x-auto">
                                                                {m.text.slice(0, 300)}...
                                                            </pre>
                                                        </a>
                                                    );
                                                })}
                                            </div>
                                        </div>
                                    )}
                                </div>
                            </div>
                        )}

                        {/* Loading State */}
                        {loading && (
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

                {/* Input Box */}
                <div className="fixed bottom-3 left-0 right-0 px-4 sm:px-6 md:px-10 pb-4 bg-transparent">
                    <div className="max-w-4xl mx-auto">
                        <div className="relative">
                            <PlaceholdersAndVanishInput
                                placeholders={[
                                    "Ask a question about your repo...",
                                    "What changed in the main branch?",
                                    "Who contributed to this file?",
                                    "Summarize the last commit",
                                    "Which database is being used?",
                                ]}
                                onChange={(e) => setQuestion(e.target.value)}
                                onSubmit={(e) => {
                                    e.preventDefault();
                                    if (!question.trim()) return;
                                    handleAsk();
                                }}
                                className="w-full pl-4 pr-16 py-4 text-gray-200 bg-transparent border-2 border-gray-600 rounded-xl focus:outline-none focus:ring-2 focus:ring-blue-500 transition-shadow"
                                disabled={loading}
                            />
                        </div>
                    </div>
                </div>




            </main>
        </div>
    );
}
