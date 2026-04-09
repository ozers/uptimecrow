import { Hono } from "hono";
import { setCookie, deleteCookie } from "hono/cookie";
import bcrypt from "bcrypt";
import { eq } from "drizzle-orm";
import { db } from "../db/index.js";
import { users, organizations } from "../db/schema.js";
import { createToken } from "../utils/auth.js";
import { registerSchema, loginSchema } from "@uptimecrow/shared";
import { authMiddleware } from "../middleware/auth.js";

export const authRoutes = new Hono();

authRoutes.post("/register", async (c) => {
  const body = await c.req.json();
  const parsed = registerSchema.safeParse(body);
  if (!parsed.success) {
    return c.json({ error: "Validation failed", details: parsed.error.flatten() }, 400);
  }

  const { email, password, name } = parsed.data;

  // Check if email already exists
  const existing = await db.select().from(users).where(eq(users.email, email)).limit(1);
  if (existing.length > 0) {
    return c.json({ error: "Email already registered" }, 409);
  }

  const passwordHash = await bcrypt.hash(password, 12);

  // Create user
  const [user] = await db
    .insert(users)
    .values({ email, name, passwordHash })
    .returning({ id: users.id, email: users.email, name: users.name });

  // Create default organization
  const slug = email.split("@")[0].replace(/[^a-z0-9-]/g, "-").slice(0, 50);
  const [org] = await db
    .insert(organizations)
    .values({
      name: `${name}'s Org`,
      slug: `${slug}-${user.id.slice(0, 6)}`,
      ownerId: user.id,
    })
    .returning({ id: organizations.id });

  const token = await createToken({ sub: user.id, email: user.email, orgId: org.id });

  setCookie(c, "token", token, {
    httpOnly: true,
    secure: process.env.NODE_ENV === "production",
    sameSite: "lax",
    maxAge: 7 * 24 * 60 * 60, // 7 days
    path: "/",
  });

  return c.json({ user: { id: user.id, email: user.email, name: user.name }, token }, 201);
});

authRoutes.post("/login", async (c) => {
  const body = await c.req.json();
  const parsed = loginSchema.safeParse(body);
  if (!parsed.success) {
    return c.json({ error: "Validation failed", details: parsed.error.flatten() }, 400);
  }

  const { email, password } = parsed.data;

  const [user] = await db
    .select()
    .from(users)
    .where(eq(users.email, email))
    .limit(1);

  if (!user) {
    return c.json({ error: "Invalid email or password" }, 401);
  }

  const valid = await bcrypt.compare(password, user.passwordHash);
  if (!valid) {
    return c.json({ error: "Invalid email or password" }, 401);
  }

  // Get user's org
  const [org] = await db
    .select()
    .from(organizations)
    .where(eq(organizations.ownerId, user.id))
    .limit(1);

  if (!org) {
    return c.json({ error: "No organization found" }, 500);
  }

  const token = await createToken({ sub: user.id, email: user.email, orgId: org.id });

  setCookie(c, "token", token, {
    httpOnly: true,
    secure: process.env.NODE_ENV === "production",
    sameSite: "lax",
    maxAge: 7 * 24 * 60 * 60,
    path: "/",
  });

  return c.json({
    user: { id: user.id, email: user.email, name: user.name },
    token,
  });
});

authRoutes.post("/logout", (c) => {
  deleteCookie(c, "token", { path: "/" });
  return c.json({ ok: true });
});

authRoutes.get("/me", authMiddleware, async (c) => {
  const { sub } = c.get("user");

  const [user] = await db
    .select({
      id: users.id,
      email: users.email,
      name: users.name,
      plan: users.plan,
      createdAt: users.createdAt,
    })
    .from(users)
    .where(eq(users.id, sub))
    .limit(1);

  if (!user) {
    return c.json({ error: "User not found" }, 404);
  }

  return c.json({ user });
});
