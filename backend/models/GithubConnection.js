import mongoose from "mongoose";

const GithubConnectionSchema = new mongoose.Schema({
  userId: { type: String, required: true },  // Clerk user
  githubUsername: { type: String, required: true },
  accessToken: { type: String, required: true },
  createdAt: { type: Date, default: Date.now },
});

export default mongoose.model("GithubConnection", GithubConnectionSchema);
