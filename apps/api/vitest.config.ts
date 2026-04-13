import { defineConfig } from "vitest/config";

export default defineConfig({
  test: {
    env: {
      DATABASE_URL: "postgres://test:test@localhost:5432/test",
      REDIS_URL: "redis://localhost:6379",
      JWT_SECRET: "test-secret-at-least-thirty-two-chars-long-xxx",
      NODE_ENV: "test",
    },
  },
});
