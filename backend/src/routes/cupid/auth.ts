import { Router, type IRouter, type Request, type Response } from "express";
import bcrypt from "bcryptjs";
import { db, cupidUsersTable } from "../../lib/db/src/index";
import { eq } from "drizzle-orm";
import {
  clearSession,
  getSessionId,
  createSession,
  SESSION_COOKIE,
  SESSION_TTL,
  type CupidSessionData,
} from "../../lib/cupid-auth";
import { z } from "zod";

const router: IRouter = Router();

const registerSchema = z.object({
  username: z.string().min(3, "Username must be at least 3 characters").max(30),
  password: z.string().min(6, "Password must be at least 6 characters"),
  firstName: z.string().optional(),
  lastName: z.string().optional(),
});

const loginSchema = z.object({
  username: z.string().min(1),
  password: z.string().min(1),
});

function setSessionCookie(res: Response, sid: string) {
  res.cookie(SESSION_COOKIE, sid, {
    httpOnly: true,
    secure: process.env.NODE_ENV === "production",
    sameSite: "lax",
    path: "/",
    maxAge: SESSION_TTL,
  });
}

// Get current user
router.get("/auth/user", (req: Request, res: Response) => {
  res.json({
    user: req.isAuthenticated() ? req.user : null,
  });
});

// Register
router.post("/auth/register", async (req: Request, res: Response) => {
  const parsed = registerSchema.safeParse(req.body);
  if (!parsed.success) {
    res.status(400).json({ error: parsed.error.errors[0]?.message || "Invalid input" });
    return;
  }

  const { username, password, firstName, lastName } = parsed.data;

  // Check if username already exists
  const existing = await db.query.cupidUsersTable.findFirst({
    where: eq(cupidUsersTable.username, username),
  });
  if (existing) {
    res.status(409).json({ error: "Username already taken" });
    return;
  }

  const passwordHash = await bcrypt.hash(password, 10);

  const [user] = await db
    .insert(cupidUsersTable)
    .values({
      username,
      passwordHash,
      firstName: firstName || null,
      lastName: lastName || null,
    })
    .returning();

  const sessionData: CupidSessionData = {
    user: {
      id: user.id,
      username: user.username,
      firstName: user.firstName,
      lastName: user.lastName,
    },
  };

  const sid = await createSession(sessionData);
  setSessionCookie(res, sid);
  res.status(201).json({ user: sessionData.user });
});

// Login
router.post("/auth/login", async (req: Request, res: Response) => {
  const parsed = loginSchema.safeParse(req.body);
  if (!parsed.success) {
    res.status(400).json({ error: "Username and password are required" });
    return;
  }

  const { username, password } = parsed.data;

  const user = await db.query.cupidUsersTable.findFirst({
    where: eq(cupidUsersTable.username, username),
  });
  if (!user) {
    res.status(401).json({ error: "Invalid username or password" });
    return;
  }

  const valid = await bcrypt.compare(password, user.passwordHash);
  if (!valid) {
    res.status(401).json({ error: "Invalid username or password" });
    return;
  }

  const sessionData: CupidSessionData = {
    user: {
      id: user.id,
      username: user.username,
      firstName: user.firstName,
      lastName: user.lastName,
    },
  };

  const sid = await createSession(sessionData);
  setSessionCookie(res, sid);
  res.json({ user: sessionData.user });
});

// Logout
router.post("/auth/logout", async (req: Request, res: Response) => {
  const sid = getSessionId(req);
  await clearSession(res, sid);
  res.json({ success: true });
});

export default router;
