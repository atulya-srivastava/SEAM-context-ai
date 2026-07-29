import Chat from '../models/chatModel.js';
import { ClerkExpressRequireAuth } from '@clerk/clerk-sdk-node';
import { chatModel } from '../lib/groq.js';
import { SystemMessage, HumanMessage } from "@langchain/core/messages";

const SEAM_SYSTEM_PROMPT = `You are SEAM (Context AI), an intelligent workspace assistant and developer context bot.
Your role is to help users navigate and manage their development workspace and team integrations:
- GitHub Context: Searching code, analyzing repositories, explaining commits, branches, PRs, and issue tracking.
- Team Integrations: Sending messages and syncing context with Slack, Notion, Gmail, MS Teams, Google Drive, and webhooks.
- General AI Assistance: Answering technical queries, debugging code, explaining concepts, and assisting developers.

When asked questions such as "what can you do?", "who are you?", or general questions, introduce yourself as SEAM, summarize how you assist with GitHub, Slack, Notion, and workspace context, and offer your help naturally. Always respond dynamically and conversationally without hardcoded responses.`;

export const handleGeneralChat = async (req, res) => {
  try {
    const { prompt } = req.body;
    if (!prompt) return res.status(400).json({ error: "Prompt is required" });

    const response = await chatModel.invoke([
      new SystemMessage(SEAM_SYSTEM_PROMPT),
      new HumanMessage(prompt),
    ]);
    return res.json({ text: response.content });
  } catch (error) {
    console.error("General AI Error:", error);
    return res.status(500).json({ error: error.message });
  }
};


// 1. Create a new chat
export const createChat = async (req, res) => {
  try {
    const { title, messages } = req.body;
    const userId = req.auth.userId;

    const newChat = new Chat({ userId, title, messages: messages || [] });
    await newChat.save();
    res.status(201).json({ message: 'Chat created successfully', chat: newChat });
  } catch (error) {
    res.status(500).json({ message: 'Error creating chat', error: error.message });
  }
};

// 2. Get all chat sessions for the logged-in user (metadata only)
export const getAllChats = async (req, res) => {
  try {
    const userId = req.auth.userId;
    const chats = await Chat.find({ userId }).select('-messages').sort({ updatedAt: -1 });
    res.status(200).json(chats);
  } catch (error) {
    res.status(500).json({ message: 'Error fetching chats', error: error.message });
  }
};

// 3. Get a single chat by ID (must belong to the user)
export const getChatById = async (req, res) => {
  try {
    const userId = req.auth.userId;
    const chat = await Chat.findOne({ _id: req.params.chatId, userId });
    if (!chat) return res.status(404).json({ message: 'Chat not found' });

    res.status(200).json(chat);
  } catch (error) {
    res.status(500).json({ message: 'Error fetching chat', error: error.message });
  }
};

// 4. Update a chat (rename title)
export const updateChat = async (req, res) => {
  try {
    const { title } = req.body;
    const userId = req.auth.userId;

    const updatedChat = await Chat.findOneAndUpdate(
      { _id: req.params.chatId, userId },
      { title, updatedAt: Date.now() },
      { new: true }
    );

    if (!updatedChat) return res.status(404).json({ message: 'Chat not found' });
    res.status(200).json({ message: 'Chat updated successfully', chat: updatedChat });
  } catch (error) {
    res.status(500).json({ message: 'Error updating chat', error: error.message });
  }
};

// 5. Delete a chat
export const deleteChat = async (req, res) => {
  try {
    const userId = req.auth.userId;

    const deletedChat = await Chat.findOneAndDelete({ _id: req.params.chatId, userId });
    if (!deletedChat) return res.status(404).json({ message: 'Chat not found' });

    res.status(200).json({ message: 'Chat deleted successfully' });
  } catch (error) {
    res.status(500).json({ message: 'Error deleting chat', error: error.message });
  }
};

// --- MESSAGE CONTROLLERS ---

// 6. Add a new message to a chat
export const addMessageToChat = async (req, res) => {
  try {
    const { content, role } = req.body;
    if (!content || !role) return res.status(400).json({ message: 'Message content and role are required' });

    const userId = req.auth.userId;
    const chat = await Chat.findOne({ _id: req.params.chatId, userId });
    if (!chat) return res.status(404).json({ message: 'Chat not found' });

    const newMessage = { content, role };
    chat.messages.push(newMessage);
    await chat.save();

    res.status(201).json({ message: 'Message added successfully', chat });
  } catch (error) {
    res.status(500).json({ message: 'Error adding message', error: error.message });
  }
};

// 7. Get all messages from a chat
export const getMessagesFromChat = async (req, res) => {
  try {
    const userId = req.auth.userId;
    const chat = await Chat.findOne({ _id: req.params.chatId, userId });
    if (!chat) return res.status(404).json({ message: 'Chat not found' });

    res.status(200).json(chat.messages);
  } catch (error) {
    res.status(500).json({ message: 'Error fetching messages', error: error.message });
  }
};

// 8. Update a message
export const updateMessageInChat = async (req, res) => {
  try {
    const { content } = req.body;
    const userId = req.auth.userId;

    const chat = await Chat.findOne({ _id: req.params.chatId, userId });
    if (!chat) return res.status(404).json({ message: 'Chat not found' });

    const message = chat.messages.id(req.params.messageId);
    if (!message) return res.status(404).json({ message: 'Message not found' });

    message.content = content;
    await chat.save();

    res.status(200).json({ message: 'Message updated successfully', chat });
  } catch (error) {
    res.status(500).json({ message: 'Error updating message', error: error.message });
  }
};

// 9. Delete a message
export const deleteMessageInChat = async (req, res) => {
  try {
    const userId = req.auth.userId;
    const chat = await Chat.findOne({ _id: req.params.chatId, userId });
    if (!chat) return res.status(404).json({ message: 'Chat not found' });

    chat.messages.pull(req.params.messageId);
    await chat.save();

    res.status(200).json({ message: 'Message deleted successfully', chat });
  } catch (error) {
    res.status(500).json({ message: 'Error deleting message', error: error.message });
  }
};
