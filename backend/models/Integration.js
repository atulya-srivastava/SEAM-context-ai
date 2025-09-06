// models/Integration.js
import mongoose from "mongoose";

const IntegrationSchema = new mongoose.Schema({
  orgId: { type: String, required: true },
  userId: { type: String, required: true },
  provider: { type: String, required: true }, // "github", "notion", "google"
  username: { type: String },
  accessToken: { type: String, required: true },
  refreshToken: { type: String }, // optional for providers that support refresh
}, { timestamps: true });

export default mongoose.model("Integration", IntegrationSchema);
