import type { Context, Next } from "hono";
import { getCookie } from "hono/cookie";
import { verifyToken, type JwtPayload } from "../utils/auth.js";

declare module "hono" {
  interface ContextVariableMap {
    user: JwtPayload;
  }
}

export async function authMiddleware(c: Context, next: Next) {
  const token =
    getCookie(c, "token") ||
    c.req.header("Authorization")?.replace("Bearer ", "");

  if (!token) {
    return c.json({ error: "Unauthorized" }, 401);
  }

  try {
    const payload = await verifyToken(token);
    c.set("user", payload);
    return next();
  } catch {
    return c.json({ error: "Invalid or expired token" }, 401);
  }
}
