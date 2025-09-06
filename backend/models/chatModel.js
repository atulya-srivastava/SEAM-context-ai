import mongoose from 'mongoose'; 

// This schema represents an individual message within a chat.
const messageSchema = new mongoose.Schema({
  content: {
    type: String,
    required: true,
  },
  role: {
    type: String,
    enum: ['user', 'bot'], // The role can only be 'user' or 'bot'
    required: true,
  },
  timestamp: {
    type: Date,
    default: Date.now, // Automatically sets the current date and time
  },
});

// This schema represents a complete chat session, which contains a series of messages.
const chatSchema = new mongoose.Schema({
  title: {
    type: String,
    default: 'New Chat', // Default title for a new chat session
  },
  messages: [messageSchema], // An array of message documents
  createdAt: {
    type: Date,
    default: Date.now,
  },
  updatedAt: {
    type: Date,
    default: Date.now,
  }
});

// Pre-save middleware to update the 'updatedAt' timestamp whenever a chat is modified.
chatSchema.pre('save', function(next) {
  this.updatedAt = Date.now();
  next();
});

const Chat = mongoose.model('Chat', chatSchema);

export default Chat;
