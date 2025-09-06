import Chat from '../models/chatModel.js';


export const createChat = async (req, res) => {
  try {
    const { title, messages } = req.body;
    // A new chat can be started with an optional title and initial messages
    const newChat = new Chat({ title, messages: messages || [] });
    await newChat.save();
    res.status(201).json({ message: 'Chat created successfully', chat: newChat });
  } catch (error) {
    res.status(500).json({ message: 'Error creating chat', error: error.message });
  }
};

// 2. Get all chat sessions (metadata, not all messages)
export const getAllChats = async (req, res) => {
  try {
    // We select '-messages' to exclude the messages array for performance reasons.
    // This provides a lightweight list of chats.
    const chats = await Chat.find().select('-messages').sort({ updatedAt: -1 });
    res.status(200).json(chats);
  } catch (error) {
    res.status(500).json({ message: 'Error fetching chats', error: error.message });
  }
};

// 3. Get a single chat session by ID, including all its messages
export const getChatById = async (req, res) => {
  try {
    const chat = await Chat.findById(req.params.chatId);
    if (!chat) {
      return res.status(404).json({ message: 'Chat not found' });
    }
    res.status(200).json(chat);
  } catch (error) {
    res.status(500).json({ message: 'Error fetching chat', error: error.message });
  }
};

// 4. Update a chat session (e.g., rename the title)
export const updateChat = async (req, res) => {
  try {
    const { title } = req.body;
    const updatedChat = await Chat.findByIdAndUpdate(
      req.params.chatId,
      { title, updatedAt: Date.now() },
      { new: true } // Returns the updated document
    );
    if (!updatedChat) {
      return res.status(404).json({ message: 'Chat not found' });
    }
    res.status(200).json({ message: 'Chat updated successfully', chat: updatedChat });
  } catch (error) {
    res.status(500).json({ message: 'Error updating chat', error: error.message });
  }
};

// 5. Delete a chat session
export const deleteChat = async (req, res) => {
  try {
    const deletedChat = await Chat.findByIdAndDelete(req.params.chatId);
    if (!deletedChat) {
      return res.status(404).json({ message: 'Chat not found' });
    }
    res.status(200).json({ message: 'Chat deleted successfully' });
  } catch (error) {
    res.status(500).json({ message: 'Error deleting chat', error: error.message });
  }
};


// --- Message Controller Functions ---

// 6. Add a new message to a chat
export const addMessageToChat = async (req, res) => {
  try {
    const { content, role } = req.body;
    if (!content || !role) {
      return res.status(400).json({ message: 'Message content and role are required' });
    }

    const chat = await Chat.findById(req.params.chatId);
    if (!chat) {
      return res.status(404).json({ message: 'Chat not found' });
    }

    const newMessage = { content, role };
    chat.messages.push(newMessage);
    await chat.save();

    res.status(201).json({ message: 'Message added successfully', chat });
  } catch (error) {
    res.status(500).json({ message: 'Error adding message', error: error.message });
  }
};

// 7. Get all messages from a specific chat
export const getMessagesFromChat = async (req, res) => {
    try {
        const chat = await Chat.findById(req.params.chatId);
        if (!chat) {
            return res.status(404).json({ message: 'Chat not found' });
        }
        res.status(200).json(chat.messages);
    } catch (error) {
        res.status(500).json({ message: 'Error fetching messages', error: error.message });
    }
};


// 8. Update a message within a chat
export const updateMessageInChat = async (req, res) => {
    try {
        const { content } = req.body;
        const chat = await Chat.findById(req.params.chatId);

        if (!chat) {
            return res.status(404).json({ message: 'Chat not found' });
        }

        // 'id' is a mongoose helper to find a subdocument by its _id
        const message = chat.messages.id(req.params.messageId);
        if (!message) {
            return res.status(404).json({ message: 'Message not found' });
        }

        message.content = content;
        await chat.save();

        res.status(200).json({ message: 'Message updated successfully', chat });
    } catch (error) {
        res.status(500).json({ message: 'Error updating message', error: error.message });
    }
};

// 9. Delete a message from a chat
export const deleteMessageInChat = async (req, res) => {
    try {
        const chat = await Chat.findById(req.params.chatId);
        if (!chat) {
            return res.status(404).json({ message: 'Chat not found' });
        }

        const message = chat.messages.id(req.params.messageId);
        if (!message) {
            return res.status(404).json({ message: 'Message not found' });
        }
        
        message.remove();
        await chat.save();

        res.status(200).json({ message: 'Message deleted successfully', chat });
    } catch (error) {
        res.status(500).json({ message: 'Error deleting message', error: error.message });
    }
};

