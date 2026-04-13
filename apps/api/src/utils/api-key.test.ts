import { describe, it, expect } from "vitest";
import {
  generateApiKey,
  hashApiKey,
  looksLikeApiKey,
  API_KEY_PREFIX,
  API_KEY_DISPLAY_PREFIX_LENGTH,
} from "./api-key.js";

describe("generateApiKey", () => {
  it("produces a key with the uc_live_ prefix", () => {
    const { key } = generateApiKey();
    expect(key.startsWith(API_KEY_PREFIX)).toBe(true);
  });

  it("returns a matching hash for the generated key", () => {
    const { key, hash } = generateApiKey();
    expect(hashApiKey(key)).toBe(hash);
  });

  it("returns the first 12 characters as the display prefix", () => {
    const { key, prefix } = generateApiKey();
    expect(prefix).toBe(key.slice(0, API_KEY_DISPLAY_PREFIX_LENGTH));
    expect(prefix.length).toBe(API_KEY_DISPLAY_PREFIX_LENGTH);
  });

  it("produces unique keys on repeated calls", () => {
    const a = generateApiKey();
    const b = generateApiKey();
    expect(a.key).not.toBe(b.key);
    expect(a.hash).not.toBe(b.hash);
  });

  it("hash is deterministic for the same plaintext", () => {
    expect(hashApiKey("uc_live_fixed")).toBe(hashApiKey("uc_live_fixed"));
    expect(hashApiKey("uc_live_fixed")).not.toBe(hashApiKey("uc_live_other"));
  });
});

describe("looksLikeApiKey", () => {
  it("accepts strings starting with uc_live_", () => {
    expect(looksLikeApiKey("uc_live_abc123")).toBe(true);
  });

  it("rejects JWTs and other Bearer tokens", () => {
    expect(looksLikeApiKey("eyJhbGciOiJIUzI1NiJ9")).toBe(false);
    expect(looksLikeApiKey("")).toBe(false);
    expect(looksLikeApiKey("uc_test_abc")).toBe(false);
  });
});
