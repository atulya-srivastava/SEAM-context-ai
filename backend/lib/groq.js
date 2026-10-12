import { ChatGroq } from "@langchain/groq";
import dotenv from "dotenv";

dotenv.config();

// LangChain ChatGroq model — plugs directly into LCEL chains via the pipe (|) operator
export const chatModel = new ChatGroq({
  apiKey: process.env.GROQ_API_KEY,
  model: process.env.GROQ_MODEL || "openai/gpt-oss-20b",
  temperature: 0,
});