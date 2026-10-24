"use client";

import React, {
  createContext,
  useContext,
  useState,
  useEffect,
  useCallback,
  ReactNode,
} from "react";
import { useAuth } from "@clerk/nextjs";

export interface Message {
  id?: string;
  sender: "user" | "ai";
  text: string;
  type?: "github" | "integration" | "general";
  data?: any; // For storing GitHub response data
  timestamp?: number;
}

export interface ChatSession {
  id: string;
  title: string;
  createdAt: number;
  updatedAt: number;
  messages: Message[];
}

export interface IntegrationsState {
  slack: boolean;
  drive: boolean;
  notion: boolean;
  gmail: boolean;
  teams: boolean;
}

export const DEFAULT_WELCOME_MESSAGE: Message = {
  sender: "ai",
  text: `Hello! I'm SEAM, your AI assistant. I can help you with:
      
• **GitHub Repository Analysis** - Ask questions about your repos
• **Slack, Google Drive, Notion, Gmail & Teams Integration** - Connect with your tools
• **General AI Assistance** - Chat about anything

How can I help you today?`,
  type: "general",
};

interface ChatContextType {
  messages: Message[];
  setMessages: React.Dispatch<React.SetStateAction<Message[]>>;
  input: string;
  setInput: React.Dispatch<React.SetStateAction<string>>;
  isLoading: boolean;
  setIsLoading: React.Dispatch<React.SetStateAction<boolean>>;
  currentMode: "auto" | "github" | "integration";
  setCurrentMode: React.Dispatch<React.SetStateAction<"auto" | "github" | "integration">>;
  activeIntegrations: IntegrationsState;
  setActiveIntegrations: React.Dispatch<React.SetStateAction<IntegrationsState>>;
  handleIntegrationToggle: (integrationId: keyof IntegrationsState) => void;
  isSimplifyEnabled: boolean;
  setIsSimplifyEnabled: React.Dispatch<React.SetStateAction<boolean>>;
  chatSessions: ChatSession[];
  currentSessionId: string;
  createNewChat: () => void;
  selectSession: (sessionId: string) => void;
  deleteSession: (sessionId: string) => void;
  clearAllChats: () => void;
  isHydrated: boolean;
}

const ChatContext = createContext<ChatContextType | undefined>(undefined);

function generateSessionId(): string {
  return `session_${Date.now()}_${Math.random().toString(36).substring(2, 9)}`;
}

function deriveSessionTitle(messages: Message[]): string {
  const firstUserMessage = messages.find((m) => m.sender === "user");
  if (!firstUserMessage || !firstUserMessage.text.trim()) {
    return "New Conversation";
  }
  const cleanText = firstUserMessage.text.trim().replace(/\n+/g, " ");
  return cleanText.length > 36 ? `${cleanText.substring(0, 36)}...` : cleanText;
}

export const ChatProvider: React.FC<{ children: ReactNode }> = ({ children }) => {
  const { userId } = useAuth();
  const storageUserKey = userId || "guest";

  const [currentSessionId, setCurrentSessionId] = useState<string>(() => generateSessionId());
  const [messages, setMessages] = useState<Message[]>([DEFAULT_WELCOME_MESSAGE]);
  const [chatSessions, setChatSessions] = useState<ChatSession[]>([]);
  const [input, setInput] = useState<string>("");
  const [isLoading, setIsLoading] = useState<boolean>(false);
  const [currentMode, setCurrentMode] = useState<"auto" | "github" | "integration">("auto");
  const [activeIntegrations, setActiveIntegrations] = useState<IntegrationsState>({
    slack: false,
    drive: false,
    notion: false,
    gmail: false,
    teams: false,
  });
  const [isSimplifyEnabled, setIsSimplifyEnabled] = useState<boolean>(false);
  const [isHydrated, setIsHydrated] = useState<boolean>(false);

  // Storage keys scoped to user
  const SESSIONS_STORAGE_KEY = `seam_chat_sessions_${storageUserKey}`;
  const ACTIVE_SESSION_ID_KEY = `seam_active_session_id_${storageUserKey}`;
  const DRAFT_INPUT_KEY = `seam_draft_input_${storageUserKey}`;
  const SETTINGS_STORAGE_KEY = `seam_chat_settings_${storageUserKey}`;

  // 1. Initial hydration from localStorage
  useEffect(() => {
    try {
      if (typeof window === "undefined") return;

      const savedSessionsRaw = localStorage.getItem(SESSIONS_STORAGE_KEY);
      const savedActiveId = localStorage.getItem(ACTIVE_SESSION_ID_KEY);
      const savedInput = localStorage.getItem(DRAFT_INPUT_KEY);
      const savedSettingsRaw = localStorage.getItem(SETTINGS_STORAGE_KEY);

      let loadedSessions: ChatSession[] = [];
      if (savedSessionsRaw) {
        try {
          const parsed = JSON.parse(savedSessionsRaw);
          if (Array.isArray(parsed)) {
            loadedSessions = parsed;
          }
        } catch (e) {
          console.error("Failed to parse saved chat sessions:", e);
        }
      }

      if (savedSettingsRaw) {
        try {
          const parsedSettings = JSON.parse(savedSettingsRaw);
          if (parsedSettings.currentMode) setCurrentMode(parsedSettings.currentMode);
          if (parsedSettings.activeIntegrations) setActiveIntegrations(parsedSettings.activeIntegrations);
          if (typeof parsedSettings.isSimplifyEnabled === "boolean") {
            setIsSimplifyEnabled(parsedSettings.isSimplifyEnabled);
          }
        } catch (e) {
          console.error("Failed to parse saved settings:", e);
        }
      }

      if (savedInput) {
        setInput(savedInput);
      }

      setChatSessions(loadedSessions);

      // Determine active session
      if (loadedSessions.length > 0) {
        const foundActive = loadedSessions.find((s) => s.id === savedActiveId);
        if (foundActive) {
          setCurrentSessionId(foundActive.id);
          setMessages(foundActive.messages.length > 0 ? foundActive.messages : [DEFAULT_WELCOME_MESSAGE]);
        } else {
          // Default to the most recently updated session
          const mostRecent = loadedSessions[0];
          setCurrentSessionId(mostRecent.id);
          setMessages(mostRecent.messages.length > 0 ? mostRecent.messages : [DEFAULT_WELCOME_MESSAGE]);
        }
      } else {
        // First time or no saved sessions: create initial session
        const initialId = generateSessionId();
        const initialSession: ChatSession = {
          id: initialId,
          title: "New Conversation",
          createdAt: Date.now(),
          updatedAt: Date.now(),
          messages: [DEFAULT_WELCOME_MESSAGE],
        };
        setCurrentSessionId(initialId);
        setMessages([DEFAULT_WELCOME_MESSAGE]);
        setChatSessions([initialSession]);
      }
    } catch (err) {
      console.error("Error during ChatContext hydration:", err);
    } finally {
      setIsHydrated(true);
    }
  }, [storageUserKey]);

  // 2. Synchronize current session messages to chatSessions & localStorage
  useEffect(() => {
    if (!isHydrated || typeof window === "undefined") return;

    setChatSessions((prevSessions: ChatSession[]) => {
      const existingIndex = prevSessions.findIndex((s: ChatSession) => s.id === currentSessionId);
      const title = deriveSessionTitle(messages);

      let updatedSessions: ChatSession[];
      if (existingIndex >= 0) {
        updatedSessions = [...prevSessions];
        updatedSessions[existingIndex] = {
          ...updatedSessions[existingIndex],
          title: prevSessions[existingIndex].title !== "New Conversation" &&
                 prevSessions[existingIndex].title.trim() !== ""
            ? prevSessions[existingIndex].title
            : title,
          messages,
          updatedAt: Date.now(),
        };
      } else {
        const newSession: ChatSession = {
          id: currentSessionId,
          title,
          createdAt: Date.now(),
          updatedAt: Date.now(),
          messages,
        };
        updatedSessions = [newSession, ...prevSessions];
      }

      try {
        localStorage.setItem(SESSIONS_STORAGE_KEY, JSON.stringify(updatedSessions));
        localStorage.setItem(ACTIVE_SESSION_ID_KEY, currentSessionId);
      } catch (err) {
        console.error("Failed to save sessions to localStorage:", err);
      }

      return updatedSessions;
    });
  }, [messages, currentSessionId, isHydrated, SESSIONS_STORAGE_KEY, ACTIVE_SESSION_ID_KEY]);

  // 3. Persist draft input
  useEffect(() => {
    if (!isHydrated || typeof window === "undefined") return;
    try {
      localStorage.setItem(DRAFT_INPUT_KEY, input);
    } catch (err) {
      console.error("Failed to save draft input:", err);
    }
  }, [input, isHydrated, DRAFT_INPUT_KEY]);

  // 4. Persist mode & toggles
  useEffect(() => {
    if (!isHydrated || typeof window === "undefined") return;
    try {
      localStorage.setItem(
        SETTINGS_STORAGE_KEY,
        JSON.stringify({
          currentMode,
          activeIntegrations,
          isSimplifyEnabled,
        })
      );
    } catch (err) {
      console.error("Failed to save settings:", err);
    }
  }, [currentMode, activeIntegrations, isSimplifyEnabled, isHydrated, SETTINGS_STORAGE_KEY]);

  // Create a brand new chat session
  const createNewChat = useCallback(() => {
    const newId = generateSessionId();
    const newSession: ChatSession = {
      id: newId,
      title: "New Conversation",
      createdAt: Date.now(),
      updatedAt: Date.now(),
      messages: [DEFAULT_WELCOME_MESSAGE],
    };

    setChatSessions((prev: ChatSession[]) => [newSession, ...prev]);
    setCurrentSessionId(newId);
    setMessages([DEFAULT_WELCOME_MESSAGE]);
    setInput("");

    if (typeof window !== "undefined") {
      try {
        localStorage.setItem(ACTIVE_SESSION_ID_KEY, newId);
        localStorage.setItem(DRAFT_INPUT_KEY, "");
      } catch (err) {
        console.error("Failed to update active session key:", err);
      }
    }
  }, [ACTIVE_SESSION_ID_KEY, DRAFT_INPUT_KEY]);

  // Select an existing chat session from history
  const selectSession = useCallback(
    (sessionId: string) => {
      const target = chatSessions.find((s: ChatSession) => s.id === sessionId);
      if (target) {
        setCurrentSessionId(target.id);
        setMessages(target.messages.length > 0 ? target.messages : [DEFAULT_WELCOME_MESSAGE]);
        if (typeof window !== "undefined") {
          try {
            localStorage.setItem(ACTIVE_SESSION_ID_KEY, target.id);
          } catch (err) {
            console.error("Failed to save active session ID:", err);
          }
        }
      }
    },
    [chatSessions, ACTIVE_SESSION_ID_KEY]
  );

  // Delete a chat session
  const deleteSession = useCallback(
    (sessionId: string) => {
      setChatSessions((prev: ChatSession[]) => {
        const filtered = prev.filter((s: ChatSession) => s.id !== sessionId);
        if (typeof window !== "undefined") {
          try {
            localStorage.setItem(SESSIONS_STORAGE_KEY, JSON.stringify(filtered));
          } catch (err) {
            console.error("Failed to update sessions in localStorage:", err);
          }
        }

        // If the deleted session was active, switch to another or create a new one
        if (sessionId === currentSessionId) {
          if (filtered.length > 0) {
            const nextActive = filtered[0];
            setCurrentSessionId(nextActive.id);
            setMessages(nextActive.messages.length > 0 ? nextActive.messages : [DEFAULT_WELCOME_MESSAGE]);
            if (typeof window !== "undefined") {
              try {
                localStorage.setItem(ACTIVE_SESSION_ID_KEY, nextActive.id);
              } catch (e) {
                console.error(e);
              }
            }
          } else {
            const newId = generateSessionId();
            const fallbackSession: ChatSession = {
              id: newId,
              title: "New Conversation",
              createdAt: Date.now(),
              updatedAt: Date.now(),
              messages: [DEFAULT_WELCOME_MESSAGE],
            };
            setCurrentSessionId(newId);
            setMessages([DEFAULT_WELCOME_MESSAGE]);
            return [fallbackSession];
          }
        }
        return filtered;
      });
    },
    [currentSessionId, SESSIONS_STORAGE_KEY, ACTIVE_SESSION_ID_KEY]
  );

  // Clear all chats
  const clearAllChats = useCallback(() => {
    const newId = generateSessionId();
    const freshSession: ChatSession = {
      id: newId,
      title: "New Conversation",
      createdAt: Date.now(),
      updatedAt: Date.now(),
      messages: [DEFAULT_WELCOME_MESSAGE],
    };
    setChatSessions([freshSession]);
    setCurrentSessionId(newId);
    setMessages([DEFAULT_WELCOME_MESSAGE]);
    setInput("");

    if (typeof window !== "undefined") {
      try {
        localStorage.removeItem(SESSIONS_STORAGE_KEY);
        localStorage.setItem(ACTIVE_SESSION_ID_KEY, newId);
        localStorage.setItem(DRAFT_INPUT_KEY, "");
      } catch (err) {
        console.error("Failed to clear chats:", err);
      }
    }
  }, [SESSIONS_STORAGE_KEY, ACTIVE_SESSION_ID_KEY, DRAFT_INPUT_KEY]);

  // Handle integration toggle
  const handleIntegrationToggle = useCallback((integrationId: keyof IntegrationsState) => {
    setActiveIntegrations((prev: IntegrationsState) => ({
      ...prev,
      [integrationId]: !prev[integrationId],
    }));
  }, []);

  return (
    <ChatContext.Provider
      value={{
        messages,
        setMessages,
        input,
        setInput,
        isLoading,
        setIsLoading,
        currentMode,
        setCurrentMode,
        activeIntegrations,
        setActiveIntegrations,
        handleIntegrationToggle,
        isSimplifyEnabled,
        setIsSimplifyEnabled,
        chatSessions,
        currentSessionId,
        createNewChat,
        selectSession,
        deleteSession,
        clearAllChats,
        isHydrated,
      }}
    >
      {children}
    </ChatContext.Provider>
  );
};

export const useChat = () => {
  const context = useContext(ChatContext);
  if (!context) {
    throw new Error("useChat must be used within a ChatProvider");
  }
  return context;
};
