import crypto from "crypto";

export const API_KEY_PREFIX = "uc_live_";
export const API_KEY_DISPLAY_PREFIX_LENGTH = 12; // e.g. "uc_live_aBcD"

// Generate a new API key. Returns { key, hash, prefix } — the plaintext key is
// only shown once at creation time; we persist hash + prefix.
export function generateApiKey(): { key: string; hash: string; prefix: string } {
  // 32 bytes of entropy → 43-char base64url; plenty of randomness.
  const random = crypto.randomBytes(32).toString("base64url");
  const key = `${API_KEY_PREFIX}${random}`;
  const hash = hashApiKey(key);
  const prefix = key.slice(0, API_KEY_DISPLAY_PREFIX_LENGTH);
  return { key, hash, prefix };
}

export function hashApiKey(key: string): string {
  return crypto.createHash("sha256").update(key).digest("hex");
}

export function looksLikeApiKey(token: string): boolean {
  return token.startsWith(API_KEY_PREFIX);
}
