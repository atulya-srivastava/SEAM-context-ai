"use client";

import { useState, useRef, useEffect, FormEvent } from "react";
import type { NextPage } from "next";
import {
  Plus,
  Search,
  MessageSquare,
  Settings,
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
} from "lucide-react";

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
}

const ChatPage: NextPage = () => {
  // State management
  const [messages, setMessages] = useState<Message[]>([
    {
      sender: "user",
      text: "Create a chatbot using python language what will be step for that",
    },
    {
      sender: "ai",
      text: `Sure, I can help you get started with creating a chatbot in Python. Here are the basic steps you'll need to follow:

1.  **Install the required libraries:** You'll need to install the transformers library from Hugging Face to use GPT. You can install it using \`pip\`.

2.  **Load the pre-trained model:** GPT comes in several sizes and versions, so you'll need to choose the one that fits your needs.
      
Here is an example of a simple "Hello World" in Python:
\`\`\`python
def hello_world():
    print("Hello, World!")

hello_world()
\`\`\`
These are just the basic steps. Good luck!`,
    },
  ]);

  const [input, setInput] = useState("");
  const [isLoading, setIsLoading] = useState(false);
  const [isSidebarOpen, setIsSidebarOpen] = useState(true);

  // Ref for auto-scrolling
  const chatContainerRef = useRef<HTMLDivElement>(null);

  // Effect for scrolling to the latest message
  useEffect(() => {
    if (chatContainerRef.current) {
      chatContainerRef.current.scrollTop =
        chatContainerRef.current.scrollHeight;
    }
  }, [messages]);

  // Effect for loading CDN scripts
  useEffect(() => {
    const loadScript = (src: string, id: string) => {
      if (document.getElementById(id)) return;
      const script = document.createElement("script");
      script.src = src;
      script.id = id;
      script.async = true;
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
      "hljs-script"
    );
    loadStyle(
      "https://cdnjs.cloudflare.com/ajax/libs/highlight.js/11.9.0/styles/atom-one-dark.min.css",
      "hljs-style"
    );
  }, []);

  // Effect for applying syntax highlighting
  useEffect(() => {
    if (typeof window !== "undefined" && typeof window.hljs !== "undefined") {
      window.hljs.highlightAll();
    }
  }, [messages, isLoading]);

  // --- GEMINI API INTEGRATION ---
  const GEMINI_API_KEY = "";

  const handleSendMessage = async (e: FormEvent) => {
    e.preventDefault();
    if (input.trim() === "" || isLoading) return;

    const userMessage: Message = { sender: "user", text: input };
    setMessages((prev) => [...prev, userMessage]);
    setInput("");
    setIsLoading(true);

    try {
    //   if (GEMINI_API_KEY === "YOUR_GEMINI_API_KEY_HERE") {
    //     setTimeout(() => {
    //       const aiMessage: Message = {
    //         sender: "ai",
    //         text: "Please set your Gemini API key to get a real response.",
    //       };
    //       setMessages((prev) => [...prev, aiMessage]);
    //       setIsLoading(false);
    //     }, 1000);
    //     return;
    //   }

      const model = "gemini-2.5-flash-preview-05-20";
      const response = await fetch(
        `https://generativelanguage.googleapis.com/v1beta/models/${model}:generateContent?key=${GEMINI_API_KEY}`,
        {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ contents: [{ parts: [{ text: input }] }] }),
        }
      );

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.error?.message || "API request failed.");
      }

      const data = await response.json();
      const aiText =
        data.candidates[0]?.content?.parts[0]?.text ||
        "Sorry, I couldn't get a response.";
      setMessages((prev) => [...prev, { sender: "ai", text: aiText }]);
    } catch (error) {
      const message =
        error instanceof Error ? error.message : "An unknown error occurred.";
      setMessages((prev) => [
        ...prev,
        {
          sender: "ai",
          text: `Sorry, something went wrong.\n\nError: ${message}`,
        },
      ]);
    } finally {
      setIsLoading(false);
    }
  };

  // Helper for formatting markdown content
  const formatMessageText = (text: string) => {
    if (typeof window !== "undefined" && typeof window.marked !== "undefined") {
      return window.marked.parse(text, { gfm: true, breaks: true });
    }
    return text.replace(/\n/g, "<br />");
  };

  // Dummy data for sidebar links
  const sidebarLinks = [
    { title: "Create Hotel Game Environment...", icon: MessageSquare },
    { title: "Create Chatbot GPT...", icon: MessageSquare, active: true },
    { title: "How Does GPT Work?", icon: MessageSquare },
  ];

  const SidebarContent = () => (
    <div className="flex flex-col h-full">
      <div>
        <div className="flex items-center justify-between mb-6">
          <h1 className="text-xl font-bold tracking-wider text-white">SEAM</h1>
        </div>
        <div className="flex items-center gap-2">
          <button className="flex-grow bg-gradient-to-r from-yellow-400 to-orange-500 text-white py-2.5 px-4 rounded-lg flex items-center justify-center gap-2 text-sm font-semibold hover:from-yellow-500 hover:to-orange-600 transition-all shadow-md">
            <Plus size={18} />
            New chat
          </button>
          <button className="p-3 rounded-lg border border-gray-700 text-gray-300 hover:bg-gray-700 transition-colors">
            <Search size={18} />
          </button>
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
              className={`flex items-center justify-between p-2.5 rounded-lg text-sm font-medium transition-colors ${
                link.active
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
          className="flex items-center gap-3 p-2 rounded-lg hover:bg-gray-700 transition-colors"
        >
          <Settings size={20} className="text-gray-400" />
          <span className="text-sm font-semibold text-gray-200">Settings</span>
        </a>
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
        .markdown-content pre { background-color: #282c34 !important; padding: 1rem; border-radius: 8px; overflow-x: auto; font-family: 'Courier New', Courier, monospace; }
        .markdown-content code:not(pre > code) { background-color: #374151; padding: 0.2rem 0.4rem; border-radius: 0.25rem; font-size: 0.9em; color: #d1d5db; }
        .markdown-content h1, .markdown-content h2, .markdown-content h3 { font-weight: 600; margin-top: 1.25em; margin-bottom: 0.5em; line-height: 1.2; color: #f3f4f6;}
        .markdown-content ul, .markdown-content ol { padding-left: 1.75rem; margin: 0.5em 0; }
        .markdown-content ul { list-style-type: disc; } .markdown-content ol { list-style-type: decimal; }
        .markdown-content p { margin-bottom: 0.75rem; } .markdown-content strong { font-weight: 600; color: #f9fafb;}
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
            {isSidebarOpen && (
              <span className="lg:hidden">
                <Menu size={20} />
              </span>
            )}
            {!isSidebarOpen && (
              <span className="lg:hidden">
                <Menu size={20} />
              </span>
            )}
            {isSidebarOpen && (
              <span className="hidden lg:block">
                <PanelLeftClose size={20} />
              </span>
            )}
            {!isSidebarOpen && (
              <span className="hidden lg:block">
                <PanelLeftOpen size={20} />
              </span>
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
                        ? "bg-gradient-to-tr from-yellow-400 to-orange-500"
                        : "bg-gradient-to-tr from-purple-400 to-blue-500"
                    }`}
                  >
                    {msg.sender === "ai" ? (
                      <Bot size={24} />
                    ) : (
                      <User size={24} />
                    )}
                  </div>
                  <div className="flex flex-col gap-2 max-w-2xl">
                    <p className="font-bold text-gray-50">
                      {msg.sender === "ai" ? "SEAM" : "You"}
                    </p>
                    <div className="bg-gray-800 p-5 rounded-lg border border-gray-700 text-gray-200">
                      <div
                        className="markdown-content"
                        dangerouslySetInnerHTML={{
                          __html: formatMessageText(msg.text),
                        }}
                      />
                    </div>
                    {msg.sender === "ai" && (
                      <div className="flex items-center gap-3 text-gray-400 mt-2">
                        <button className="p-1 hover:text-blue-400">
                          <ThumbsUp size={16} />
                        </button>
                        <button className="p-1 hover:text-red-400">
                          <ThumbsDown size={16} />
                        </button>
                        <button className="p-1 hover:text-gray-200">
                          <Copy size={16} />
                        </button>
                      </div>
                    )}
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

          <div className="px-4 sm:px-6 md:px-10 pb-4">
            <div className="max-w-4xl mx-auto">
              <form onSubmit={handleSendMessage} className="relative">
                <input
                  type="text"
                  value={input}
                  onChange={(e) => setInput(e.target.value)}
                  placeholder="Send a message..."
                  className="w-full pl-4 pr-16 py-4 text-gray-200 bg-gray-700 border-2 border-gray-600 rounded-xl focus:outline-none focus:ring-2 focus:ring-blue-500 transition-shadow"
                  disabled={isLoading}
                />
                <button
                  type="submit"
                  className="absolute right-3 top-1/2 -translate-y-1/2 bg-blue-600 text-white p-3 rounded-lg hover:bg-blue-700 transition-colors disabled:bg-blue-400 disabled:cursor-not-allowed shadow-md hover:shadow-lg"
                  disabled={!input.trim() || isLoading}
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

export default ChatPage;
