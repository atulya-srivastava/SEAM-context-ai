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
  return iv.toString('hex') + ':' + encrypted.toString('hex');
}

function decrypt(text) {
  if (!text || !text.includes(':')) return text;
  try {
    const textParts = text.split(':');
    const iv = Buffer.from(textParts.shift(), 'hex');
    const encryptedText = Buffer.from(textParts.join(':'), 'hex');
    const decipher = crypto.createDecipheriv(ALGORITHM, getEncryptionKey(), iv);
    let decrypted = decipher.update(encryptedText);
    decrypted = Buffer.concat([decrypted, decipher.final()]);
    return decrypted.toString();
  } catch (err) {
    console.error("⚠️ Failed to decrypt GitHub token:", err);
    return text; // Return raw value if decryption fails (e.g. for legacy plain tokens)
  }
}

const GithubConnectionSchema = new mongoose.Schema({
  userId: { type: String, required: true },  // Clerk user
  githubUsername: { type: String, required: true },
  accessToken: { 
    type: String, 
    required: true,
    get: decrypt,
    set: encrypt
  },
  createdAt: { type: Date, default: Date.now },
}, {
  toJSON: { getters: true },
  toObject: { getters: true }
});

export default mongoose.model("GithubConnection", GithubConnectionSchema);
