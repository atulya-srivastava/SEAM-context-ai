import express from 'express'; // Changed from require to import
import * as chatController from '../controllers/chatcontrollers.js';

const router = express.Router();

// --- Chat Routes ---

// GET all chat sessions
// Route: GET /api/chats
router.get('/', chatController.getAllChats);

// GET a single chat session by its ID
// Route: GET /api/chats/:chatId
router.get('/:chatId', chatController.getChatById);

// POST to create a new chat session
// Route: POST /api/chats
router.post('/', chatController.createChat);

// PUT to update a chat session's details (e.g., its title)
// Route: PUT /api/chats/:chatId
router.put('/:chatId', chatController.updateChat);

// DELETE a chat session by its ID
// Route: DELETE /api/chats/:chatId
router.delete('/:chatId', chatController.deleteChat);


// --- Message Routes ---

// POST to add a new message to a specific chat session
// Route: POST /api/chats/:chatId/messages
router.post('/:chatId/messages', chatController.addMessageToChat);

// GET all messages from a specific chat session
// This is often handled by getChatById, but a dedicated route can be useful.
// Route: GET /api/chats/:chatId/messages
router.get('/:chatId/messages', chatController.getMessagesFromChat);

// PUT to update a specific message within a chat
// Route: PUT /api/chats/:chatId/messages/:messageId
router.put('/:chatId/messages/:messageId', chatController.updateMessageInChat);

// DELETE a specific message from a chat
// Route: DELETE /api/chats/:chatId/messages/:messageId
router.delete('/:chatId/messages/:messageId', chatController.deleteMessageInChat);

export default router; // Changed from module.exports to export default

