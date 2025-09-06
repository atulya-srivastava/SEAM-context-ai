"use client";
import { useState } from "react";
import { marked } from "marked";
import DOMPurify from "dompurify";
import { useAuth } from "@clerk/nextjs";

export default function App() {
    const [question, setQuestion] = useState("");
    const [response, setResponse] = useState(null);
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
                    Authorization: `Bearer ${token}`, // added authorization
                },
                body: JSON.stringify({ question }),
            });
            const data = await res.json();
            console.log("Response Data:", data);
            setResponse(data);
        } catch (err) {
            console.error("❌ Error:", err);
        } finally {
            setLoading(false);
        }
    };

    return (
        <div className="min-h-screen  p-6 pt-[80px]">
            <div className="max-w-3xl mx-auto bg-white shadow-lg rounded-2xl p-6">
                <h1 className="text-2xl font-bold mb-4">Ask your GitHub Repo</h1>

                {/* Input */}
                <div className="flex gap-2">
                    <input
                        type="text"
                        value={question}
                        onChange={(e) => setQuestion(e.target.value)}
                        placeholder="Ask a question like 'What changed in posts.sql?'"
                        className="flex-1 border rounded-lg px-3 py-2"
                    />
                    <button
                        onClick={handleAsk}
                        disabled={loading}
                        className="bg-blue-600 text-white px-4 py-2 rounded-lg hover:bg-blue-700 disabled:bg-gray-400"
                    >
                        {loading ? "Asking..." : "Ask"}
                    </button>
                </div>

                {/* Answer Section */}
                {response && (
                    <div className="mt-6 space-y-6">
                        {/* Question */}
                        <div>
                            <h2 className="text-lg font-semibold">Question</h2>
                            <p className="text-gray-700">{response.question}</p>
                        </div>

                        {/* Summary (user-friendly explanation) */}
                        <div>
                            <h2 className="text-lg font-semibold">Answer</h2>
                            <div
                                className="prose max-w-none bg-gray-50 p-3 rounded-lg border"
                                dangerouslySetInnerHTML={{
                                    __html: DOMPurify.sanitize(marked(response.summary || "")),
                                }}
                            />
                        </div>

                        {/* Project Info */}
                        {(response.project_name ||
                            response.language ||
                            response.database) && (
                                <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
                                    <h2 className="text-lg font-semibold mb-2">📌 Project Info</h2>
                                    {response.project_name && (
                                        <p>
                                            <span className="font-medium">Project:</span>{" "}
                                            {response.project_name}
                                        </p>
                                    )}
                                    {response.language && (
                                        <p>
                                            <span className="font-medium">Language:</span>{" "}
                                            {response.language}
                                        </p>
                                    )}
                                    {response.database && (
                                        <p>
                                            <span className="font-medium">Database:</span>{" "}
                                            {response.database}
                                        </p>
                                    )}
                                    {response.features?.length > 0 && (
                                        <p>
                                            <span className="font-medium">Features:</span>{" "}
                                            {response.features.join(", ")}
                                        </p>
                                    )}
                                    {response.files?.length > 0 && (
                                        <p>
                                            <span className="font-medium">Files:</span>{" "}
                                            {response.files.join(", ")}
                                        </p>
                                    )}
                                </div>
                            )}

                        {/* Commit Info */}
                        {(response.contributor ||
                            response.lastEdited ||
                            response.commitUrl ||
                            response.author) && (
                                <div className="bg-green-50 border border-green-200 rounded-lg p-4">
                                    <h2 className="text-lg font-semibold mb-2">📝 Commit Info</h2>
                                    {response.author && (
                                        <p>
                                            <span className="font-medium">Author:</span>{" "}
                                            {response.author}
                                        </p>
                                    )}
                                    {response.contributor && (
                                        <p>
                                            <span className="font-medium">Contributor:</span>{" "}
                                            {response.contributor}
                                        </p>
                                    )}
                                    {response.lastEdited && (
                                        <p>
                                            <span className="font-medium">Last Edited:</span>{" "}
                                            {new Date(response.lastEdited).toLocaleString()}
                                        </p>
                                    )}
                                    {response.commitUrl && (
                                        <p>
                                            <span className="font-medium">Commit URL:</span>{" "}
                                            <a
                                                href={response.commitUrl}
                                                target="_blank"
                                                rel="noopener noreferrer"
                                                className="text-blue-600 underline"
                                            >
                                                {response.commitUrl}
                                            </a>
                                        </p>
                                    )}
                                </div>
                            )}

                        {/* Matches */}
                        {response.matches?.length > 0 && (
                            <div>
                                <h2 className="text-lg font-semibold">🔎 Matches</h2>
                                <div className="space-y-4">
                                    {response.matches.map((m, idx) => {
                                        // Build GitHub file URL (latest branch OR exact commit)
                                        const fileUrl = `https://github.com/${m.metadata.username}/${m.metadata.repo}/blob/${m.metadata.branch}/${m.metadata.file}`;

                                        return (
                                            <a
                                                key={idx}
                                                href={fileUrl}
                                                target="_blank"
                                                rel="noopener noreferrer"
                                                className="block p-4 border rounded-lg bg-gray-50 shadow-sm hover:bg-gray-100 transition"
                                            >
                                                <p className="text-sm text-gray-600 mb-2">
                                                    <span className="font-medium">Repo:</span> {m.metadata.repo} <br />
                                                    <span className="font-medium">File:</span> {m.metadata.file} <br />
                                                    <span className="font-medium">Branch:</span> {m.metadata.branch} <br />
                                                    <span className="font-medium">Score:</span> {m.score.toFixed(3)}
                                                </p>
                                                <pre className="text-xs bg-black text-green-400 p-2 rounded-lg overflow-x-auto">
                                                    {m.text.slice(0, 400)}...
                                                </pre>
                                            </a>
                                        );
                                    })}
                                </div>
                            </div>
                        )}

                    </div>
                )}
            </div>
        </div>
    );
}
