/**
 * Server-Side Authenticated Encryption (AES-256-GCM)
 * 
 * Used strictly on the server to encrypt/decrypt provider credentials
 * before persisting to Supabase PostgreSQL.
 * 
 * Encrypted payload format: "v1:<iv_hex>:<authTag_hex>:<ciphertext_hex>"
 */

import crypto from "crypto";

const ALGORITHM = "aes-256-gcm";
const CURRENT_VERSION = "v1";

function getMasterKey(): Buffer {
  const rawSecret =
    process.env.ENCRYPTION_SECRET ||
    process.env.BETTER_AUTH_SECRET ||
    "indic8_secure_dev_vault_master_key_32bytes!!";

  // Derive a reliable 32-byte key via SHA-256
  return crypto.createHash("sha256").update(rawSecret).digest();
}

export function encryptCredentials(payload: Record<string, string>): string {
  const masterKey = getMasterKey();
  const iv = crypto.randomBytes(12); // 96-bit IV recommended for GCM
  const cipher = crypto.createCipheriv(ALGORITHM, masterKey, iv);

  const jsonString = JSON.stringify(payload);
  let encrypted = cipher.update(jsonString, "utf8", "hex");
  encrypted += cipher.final("hex");

  const authTag = cipher.getAuthTag();

  return `${CURRENT_VERSION}:${iv.toString("hex")}:${authTag.toString("hex")}:${encrypted}`;
}

export function decryptCredentials(encryptedPayload: string): Record<string, string> {
  const parts = encryptedPayload.split(":");
  if (parts.length !== 4) {
    throw new Error("Invalid encrypted credentials format.");
  }

  const [version, ivHex, authTagHex, ciphertextHex] = parts;

  if (version !== "v1") {
    throw new Error(`Unsupported credentials encryption version: ${version}`);
  }

  const masterKey = getMasterKey();
  const iv = Buffer.from(ivHex, "hex");
  const authTag = Buffer.from(authTagHex, "hex");

  const decipher = crypto.createDecipheriv(ALGORITHM, masterKey, iv);
  decipher.setAuthTag(authTag);

  let decrypted = decipher.update(ciphertextHex, "hex", "utf8");
  decrypted += decipher.final("utf8");

  return JSON.parse(decrypted);
}
