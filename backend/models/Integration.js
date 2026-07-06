// models/Integration.js
import mongoose from "mongoose";
import crypto from "crypto";

const ALGORITHM = "aes-256-cbc";
const IV_LENGTH = 16;

const getEncryptionKey = () => {
  const secret = process.env.ENCRYPTION_KEY || process.env.SESSION_SECRET || "default_seam_secret_key_change_in_prod";
  return crypto.createHash("sha256").update(secret).digest();
};

function encrypt(text) {
  if (!text) return text;
  const iv = crypto.randomBytes(IV_LENGTH);
  const cipher = crypto.createCipheriv(ALGORITHM, getEncryptionKey(), iv);
  let encrypted = cipher.update(text);
  encrypted = Buffer.concat([encrypted, cipher.final()]);
  return iv.toString("hex") + ":" + encrypted.toString("hex");
}

function decrypt(text) {
  if (!text || !text.includes(":")) return text;
  try {
    const textParts = text.split(":");
    const iv = Buffer.from(textParts.shift(), "hex");
    const encryptedText = Buffer.from(textParts.join(":"), "hex");
    const decipher = crypto.createDecipheriv(ALGORITHM, getEncryptionKey(), iv);
    let decrypted = decipher.update(encryptedText);
    decrypted = Buffer.concat([decrypted, decipher.final()]);
    return decrypted.toString();
  } catch (err) {
    console.error("⚠️ Failed to decrypt integration token:", err);
    return text; // fallback for legacy plain tokens
  }
}

const IntegrationSchema = new mongoose.Schema({
  orgId: { type: String, required: true },
  userId: { type: String, required: true },
  provider: { type: String, required: true }, // "github", "notion", "google", "slack", etc.
  username: { type: String },
  accessToken: {
    type: String,
    required: true,
    get: decrypt,
    set: encrypt,
  },
  refreshToken: {
    type: String,
    get: decrypt,
    set: encrypt,
  },
}, {
  timestamps: true,
  toJSON: { getters: true },
  toObject: { getters: true },
});

export default mongoose.model("Integration", IntegrationSchema);

