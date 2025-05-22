const crypto = require("crypto");
require("dotenv").config();

const algorithm = "aes-256-cbc";
const key = Buffer.from(process.env.ENCRYPTION_KEY, "hex"); // 32 bytes (64 hex characters)
const iv = Buffer.from(process.env.ENCRYPTION_IV, "hex"); // 16 bytes (32 hex characters)

function encrypt(text) {
  const cipher = crypto.createCipheriv(algorithm, key, iv);
  let encrypted = cipher.update(text, "utf8", "hex");
  encrypted += cipher.final("hex");
  return encrypted;
}

function decrypt(encryptedText) {
  const decipher = crypto.createDecipheriv(algorithm, key, iv);
  let decrypted = decipher.update(encryptedText, "hex", "utf8");
  decrypted += decipher.final("utf8");
  return decrypted;
}

function hash(text) {
  return crypto.createHash("sha256").update(text).digest("hex");
}

module.exports = { encrypt, decrypt, hash };
