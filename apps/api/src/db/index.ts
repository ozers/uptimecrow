import { drizzle } from "drizzle-orm/postgres-js";
import postgres from "postgres";
import Redis from "ioredis";
import * as schema from "./schema.js";

const databaseUrl = process.env.DATABASE_URL;
if (!databaseUrl) {
  throw new Error("DATABASE_URL environment variable is required");
}

const queryClient = postgres(databaseUrl);
export const db = drizzle(queryClient, { schema });

const redisUrl = process.env.REDIS_URL;
if (!redisUrl) {
  throw new Error("REDIS_URL environment variable is required");
}

export const redis = new Redis(redisUrl, {
  maxRetriesPerRequest: null, // Required by BullMQ
});
