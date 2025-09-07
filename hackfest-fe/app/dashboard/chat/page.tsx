"use client";

import { useState } from "react";
import ChatList from "@/app/dashboard/_component/ChatList";
import ChatWindow from "@/app/dashboard/_component/ChatWindow";
import MessageInput from "@/app/dashboard/_component/MessageInput";

export default function ChatPage() {
  const [selectedChatId, setSelectedChatId] = useState<string | null>(null);
  const [messages, setMessages] = useState<Array<any>>([]);

  // Called when a chat is selected from ChatList
  const handleSelectChat = (chatId: string, chatMessages: any[]) => {
    setSelectedChatId(chatId);
    setMessages(chatMessages);
  };

  // Called when a new message is sent/received
  const handleMessageSent = (chatId: string, userMsg: string, botMsg: string) => {
    setSelectedChatId(chatId);
    setMessages((prev) => [
      ...prev,
      { role: "user", content: userMsg },
      { role: "bot", content: botMsg },
    ]);
  };

  return (
    <div className="flex h-screen text-white">
      <ChatList onSelectChat={handleSelectChat} />
      <div className="flex-1 flex flex-col">
        <ChatWindow chatId={selectedChatId} messages={messages} />
        {selectedChatId && (
          <MessageInput chatId={selectedChatId} onMessageSent={handleMessageSent} />
        )}
      </div>
    </div>
  );
}
