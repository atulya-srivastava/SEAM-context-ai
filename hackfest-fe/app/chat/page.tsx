"use client";

import { useState, useRef, useEffect, FormEvent } from "react";
import type { NextPage } from "next";
import {
  Plus,
  Search,
  MessageSquare,
  Send,
  MoreHorizontal,
  User,
  Bot,
  PanelLeftClose,
  PanelLeftOpen,
  Menu,
} from "lucide-react";
import { useAuth } from "@clerk/nextjs";
import toast from "react-hot-toast";
import { marked } from "marked";
import DOMPurify from "dompurify";

const renderMarkdown = (text: string) => {
  return DOMPurify.sanitize(marked(text || "", { gfm: true, breaks: true }));
};

declare global {
  interface Window {
    marked: { parse: (text: string, options?: object) => string };
    hljs: { highlightAll: () => void };
  }
}

interface Message {
  _id?: string;
  role: "user" | "bot";
  content: string;
  timestamp?: string;
  meta?: Record<string, any>;
}
interface Chat {
  _id: string;
  title: string;
}

const ChatPage: NextPage = () => {
  const [chats, setChats] = useState<Chat[]>([]);
  const [activeChatId, setActiveChatId] = useState<string | null>(null);
  const [messages, setMessages] = useState<Message[]>([]);
  const [input, setInput] = useState("");
  const [isLoading, setIsLoading] = useState(false);
  const [isSidebarOpen, setIsSidebarOpen] = useState(true);
  const [isChatMenuOpen, setIsChatMenuOpen] = useState<string | null>(null);
  const [renameChatId, setRenameChatId] = useState<string | null>(null);
  const [newTitle, setNewTitle] = useState("");

  const { getToken } = useAuth();

  const chatContainerRef = useRef<HTMLDivElement>(null);

  // Scroll to bottom on new message
  useEffect(() => {
    if (chatContainerRef.current) {
      chatContainerRef.current.scrollTop = chatContainerRef.current.scrollHeight;
    }
  }, [messages]);

  // Load CDN scripts
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
    loadScript("https://cdn.jsdelivr.net/npm/marked/marked.min.js", "marked-script");
    loadScript("https://cdnjs.cloudflare.com/ajax/libs/highlight.js/11.9.0/highlight.min.js", "hljs-script");
    loadStyle("https://cdnjs.cloudflare.com/ajax/libs/highlight.js/11.9.0/styles/atom-one-dark.min.css", "hljs-style");
  }, []);

  // Highlight code after messages change
  useEffect(() => {
    if (typeof window !== "undefined" && window.hljs) {
      window.hljs.highlightAll();
    }
  }, [messages, isLoading]);

  // Fetch all chats from backend
  const fetchChats = async () => {
    const token = await getToken();
    try {
      const res = await fetch("http://localhost:3001/api/chats", {
        method: "GET",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${token}`
        }
      });

      const data = await res.json();
      console.log("Fetched chats:", data);
      setChats(data || []);
    } catch (err) {
      console.error("Failed to fetch chats", err);
    }
  };

  useEffect(() => {
    fetchChats();
  }, []);

  // Fetch messages for active chat
  const fetchMessages = async (chatId: string) => {
    const token = await getToken();
    try {
      const res = await fetch(`http://localhost:3001/api/chats/${chatId}/messages`, {
        method: "GET",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${token}`
        }
      });
      const data = await res.json();
      console.log("Fetched messages:", data);
      setMessages(data || []);
    } catch (err) {
      console.error("Failed to fetch messages", err);
    }
  };

  // Create new chat
  const createNewChat = async () => {
    const token = await getToken();
    try {
      const res = await fetch("http://localhost:3001/api/chats", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${token}`
        }
      });
      const data = await res.json();
      setChats((prev) => [data.chat, ...prev]);
      setActiveChatId(data.chat._id);
      setMessages([]);
    } catch (err) {
      console.error("Failed to create new chat", err);
    }
  };

  const renameChat = async (chatId: string, title: string) => {
    const token = await getToken();
    try {
      const res = await fetch(`http://localhost:3001/api/chats/${chatId}`, {
        method: "PUT", // <-- update uses PUT
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify({ title }),
      });



      if (!res.ok) throw new Error("Failed to rename chat");

      toast.success("Chat renamed successfully");

      const data = await res.json();
      setChats((prev) =>
        prev.map((chat) => (chat._id === chatId ? data.chat : chat))
      );
    } catch (err) {
      console.error("Failed to rename chat", err);
    }
  };

  const deleteChat = async (chatId: string) => {
    const token = await getToken();
    try {
      const res = await fetch(`http://localhost:3001/api/chats/${chatId}`, {
        method: "DELETE",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${token}`,
        },
      });

      if (!res.ok) throw new Error("Failed to delete chat");
      toast.success("Chat Deleted successfully");

      setChats((prev) => prev.filter((chat) => chat._id !== chatId));
      if (activeChatId === chatId) {
        setActiveChatId(null);
        setMessages([]);
      }
    } catch (err) {
      console.error("Failed to delete chat", err);
    }
  };



  // Send message
  const handleSendMessage = async (e: FormEvent) => {
    e.preventDefault();
    if (!input.trim() || !activeChatId) return;

    const userMessage: Message = { role: "user", content: input };
    setMessages((prev) => [...prev, userMessage]);
    setInput("");
    setIsLoading(true);
    const token = await getToken();

    try {
      const res = await fetch("http://localhost:3001/api/github/ask", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${token}`
        },
        body: JSON.stringify({ chatId: activeChatId, question: input }),
      });
      const data = await res.json();

      const botMessage: Message = {
        role: "bot",
        content: data.summary || "No response"
      };

      setMessages((prev) => [...prev, botMessage]);
    } catch (err) {
      console.error(err);
      setMessages((prev) => [
        ...prev,
        { role: "bot", content: "Something went wrong. Please try again." },
      ]);
    } finally {
      setIsLoading(false);
    }
  };

  // Format markdown
  const formatMessageText = (text?: string) => {
    if (!text) return ""; // <- Prevents marked from crashing
    if (typeof window !== "undefined" && window.marked) {
      return window.marked.parse(text, { gfm: true, breaks: true });
    }
    return text.replace(/\n/g, "<br />");
  };
  // Sidebar content
  const SidebarContent = () => (
    <div className="flex flex-col h-full">
      <div>
        <div className="flex items-center justify-between mb-6">
          <h1 className="text-xl font-bold tracking-wider text-white">SEAM</h1>
        </div>
        <div className="flex items-center gap-2">
          <button
            onClick={createNewChat}
            className="flex-grow bg-gradient-to-r from-yellow-400 to-orange-500 text-white py-2.5 px-4 rounded-lg flex items-center justify-center gap-2 text-sm font-semibold hover:from-yellow-500 hover:to-orange-600 transition-all shadow-md"
          >
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
          {chats.map((chat) => (
            <a
              key={chat._id}
              href="#"
              onClick={(e) => {
                e.preventDefault();
                setActiveChatId(chat._id);
                fetchMessages(chat._id);
              }}
              className={`flex items-center justify-between p-2.5 rounded-lg text-sm font-medium transition-colors ${chat._id === activeChatId
                ? "bg-blue-500/10 text-blue-400"
                : "text-gray-300 hover:bg-gray-700"
                }`}
            >
              <div className="flex items-center gap-3 truncate">
                <MessageSquare size={16} />
                <span className="truncate">{chat.title}</span>
              </div>
              {chat._id === activeChatId && (
                <div className="relative">
                  <button
                    onClick={() =>
                      setIsChatMenuOpen(isChatMenuOpen === chat._id ? null : chat._id)
                    }
                    className="p-1 text-gray-500 hover:text-gray-300"
                  >
                    <MoreHorizontal size={16} />
                  </button>

                  {isChatMenuOpen === chat._id && (
                    <div className="absolute right-0 mt-2 w-40 bg-gray-800 border border-gray-700 rounded-lg shadow-lg z-50">
                      <button
                        className="block w-full text-left px-4 py-2 text-sm hover:bg-gray-700"
                        onClick={() => {
                          setRenameChatId(chat._id);
                          setNewTitle(chat.title);
                          setIsChatMenuOpen(null);
                        }}
                      >
                        Rename
                      </button>
                      <button
                        className="block w-full text-left px-4 py-2 text-sm hover:bg-gray-700 text-red-400"
                        onClick={() => {
                          deleteChat(chat._id);
                          setIsChatMenuOpen(null);
                        }}
                      >
                        Delete
                      </button>
                    </div>
                  )}
                </div>
              )}

            </a>
          ))}
        </nav>
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
        {/* Sidebar */}
        <aside
          className={`h-full bg-gray-900/70 backdrop-blur-sm border-r border-gray-700/50 transition-all duration-300 hidden lg:flex flex-col justify-between ${isSidebarOpen ? "w-80 p-4" : "w-0 p-0 overflow-hidden"
            }`}
        >
          <SidebarContent />
        </aside>

        <div
          className={`fixed inset-0 bg-black/50 z-30 lg:hidden transition-opacity duration-300 ${isSidebarOpen ? "opacity-100" : "opacity-0 pointer-events-none"
            }`}
          onClick={() => setIsSidebarOpen(false)}
        ></div>
        <aside
          className={`fixed top-0 left-0 h-full bg-gray-900 border-r border-gray-700 p-4 flex flex-col justify-between z-40 transition-transform duration-300 lg:hidden ${isSidebarOpen ? "translate-x-0" : "-translate-x-full w-80"
            }`}
        >
          <SidebarContent />
        </aside>

        {/* Chat Area */}
        <main className="flex-1 flex flex-col relative">
          <button
            onClick={() => setIsSidebarOpen(!isSidebarOpen)}
            className="absolute top-5 left-5 z-10 p-2 bg-gray-700/50 rounded-md hover:bg-gray-600/70 transition-colors"
          >
            {isSidebarOpen ? (
              <span className="hidden lg:block">
                <PanelLeftClose size={20} />
              </span>
            ) : (
              <span className="hidden lg:block">
                <PanelLeftOpen size={20} />
              </span>
            )}
            <span className="lg:hidden">
              <Menu size={20} />
            </span>
          </button>

          <div ref={chatContainerRef} className="flex-1 overflow-y-auto p-4 sm:p-6 md:p-10">
            <div className="max-w-4xl mx-auto flex flex-col gap-10 pt-10">
              {messages.map((msg, index) => (
                <div key={msg._id || index} className="flex items-start gap-4">
                  <div
                    className={`flex-shrink-0 w-10 h-10 rounded-full flex items-center justify-center font-bold text-white ${msg.role === "bot"
                      ? "bg-gradient-to-tr from-yellow-400 to-orange-500"
                      : "bg-gradient-to-tr from-purple-400 to-blue-500"
                      }`}
                  >
                    {msg.role === "bot" ? <Bot size={24} /> : <User size={24} />}
                  </div>

                  <div className="flex flex-col gap-2 max-w-2xl">
                    <p className="font-bold text-gray-50">
                      {msg.role === "bot" ? "SEAM" : "You"}
                    </p>

                    {/* User Message */}
                    {msg.role === "user" && (
                      <div className="bg-gray-800 p-5 rounded-lg border border-gray-700 text-gray-200">
                        {msg.content}
                      </div>
                    )}

                    {/* Bot Message with markdown + extras */}
                    {msg.role === "bot" && (
                      <>
                        {/* Markdown summary */}
                        <div className="bg-gray-800 p-5 rounded-lg border border-gray-700 text-gray-200 markdown-content">
                          <div
                            dangerouslySetInnerHTML={{
                              __html: renderMarkdown(msg.content),
                            }}
                          />
                        </div>

                        {/* If bot sent project info */}
                        {msg.meta! && (
                          <div className="bg-blue-900/40 p-4 rounded-lg border border-blue-700 text-sm">
                            <h2 className="font-semibold mb-2 text-blue-300">📌 Project Info</h2>
                            {msg.meta.project_name && (
                              <p><b>Project:</b> {msg.meta.project_name}</p>
                            )}
                            {msg.meta.language && (
                              <p><b>Language:</b> {msg.meta.language}</p>
                            )}
                            {msg.meta.database && (
                              <p><b>Database:</b> {msg.meta.database}</p>
                            )}
                            {msg.meta.features?.length > 0 && (
                              <p><b>Features:</b> {msg.meta.features.join(", ")}</p>
                            )}
                            {msg.meta.files?.length > 0 && (
                              <p><b>Files:</b> {msg.meta.files.join(", ")}</p>
                            )}
                          </div>
                        )}

                        {/* If bot sent commit info */}
                        {msg.meta?.commit && Object.keys(msg.meta.commit).length > 0 && (
                          <div className="bg-green-900/40 p-4 rounded-lg border border-green-700 text-sm">
                            <h2 className="font-semibold mb-2 text-green-300">📝 Commit Info</h2>
                            {msg.meta.commit.author && <p><b>Author:</b> {msg.meta.author}</p>}
                            {msg.meta.contributor && <p><b>Contributor:</b> {msg.meta.contributor}</p>}
                            {msg.meta.commit.lastEdited && (
                              <p><b>Last Edited:</b> {new Date(msg.meta.commit.lastEdited).toLocaleString()}</p>
                            )}
                            {msg.meta.commit.commitUrl && (
                              <p>
                                <b>Commit URL:</b>{" "}
                                <a
                                  href={msg.meta.commit.commitUrl}
                                  target="_blank"
                                  rel="noopener noreferrer"
                                  className="text-blue-400 underline"
                                >
                                  {msg.meta.commit.commitUrl}
                                </a>
                              </p>
                            )}
                          </div>
                        )}

                        {/* If bot sent matches */}
                        {msg.meta?.matches?.length > 0 && (
                          <div className="bg-gray-800 p-4 rounded-lg border border-gray-700">
                            <h2 className="font-semibold mb-2 text-gray-200">🔎 Matches</h2>
                            <div className="space-y-4">
                              {msg.meta.matches.map((m: any, idx: number) => {
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
                      </>
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
      {renameChatId && (
        <div className="fixed inset-0 flex items-center justify-center bg-black/50 z-50">
          <div className="bg-gray-900 p-6 rounded-lg shadow-lg w-96">
            <h2 className="text-lg font-semibold mb-4 text-white">Rename Chat</h2>
            <input
              type="text"
              value={newTitle}
              onChange={(e) => setNewTitle(e.target.value)}
              className="w-full p-2 border border-gray-600 rounded bg-gray-800 text-gray-200 mb-4"
            />
            <div className="flex justify-end gap-2">
              <button
                onClick={() => setRenameChatId(null)}
                className="px-4 py-2 bg-gray-700 rounded hover:bg-gray-600"
              >
                Cancel
              </button>
              <button
                onClick={() => {
                  if (renameChatId && newTitle.trim()) {
                    renameChat(renameChatId, newTitle);
                  }
                  setRenameChatId(null);
                  window.location.reload();
                }}
                className="px-4 py-2 bg-blue-600 text-white rounded hover:bg-blue-700"
              >
                Save
              </button>
            </div>
          </div>
        </div>
      )}

    </>
  );
};

export default ChatPage;
