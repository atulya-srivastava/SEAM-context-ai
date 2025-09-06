"use client";

import { useState } from "react";
import { Send } from "lucide-react";
import { PlaceholdersAndVanishInput } from "@/components/ui/placeholders-and-vanish-input";

export function RepoAskInput({ handleAsk, loading }: { handleAsk: () => void; loading: boolean }) {
  const [question, setQuestion] = useState("");

  const placeholders = [
    "Ask a question about your repo...",
    "What changes happened in main branch?",
    "Who contributed to this file?",
    "Explain this commit in simple terms",
    "Which database is used in this project?",
  ];

  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setQuestion(e.target.value);
  };

  const onSubmit = (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    if (!question.trim()) return;
    handleAsk();
  };

  return (
    <div className="px-4 sm:px-6 md:px-10 pb-4">
      <div className="max-w-4xl mx-auto">
        <form onSubmit={onSubmit} className="relative">
          <PlaceholdersAndVanishInput
            placeholders={placeholders}
            onChange={handleChange}
            onSubmit={onSubmit}
            className="w-full pl-4 pr-16 py-4 text-gray-200 bg-gray-700 border-2 border-gray-600 rounded-xl focus:outline-none focus:ring-2 focus:ring-blue-500 transition-shadow"
            disabled={loading}
          />
          <button
            type="submit"
            disabled={!question.trim() || loading}
            className="absolute right-3 top-1/2 -translate-y-1/2 bg-blue-600 text-white p-3 rounded-lg hover:bg-blue-700 transition-colors disabled:bg-blue-400 disabled:cursor-not-allowed shadow-md hover:shadow-lg"
          >
            <Send size={20} />
          </button>
        </form>
      </div>
    </div>
  );
}
