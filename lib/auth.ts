// ─── AgriAI Authentication (cookie sessions, bcrypt, login rate-limiting) ────

import crypto from "crypto";
import bcrypt from "bcryptjs";
import { NextRequest, NextResponse } from "next/server";
import { getDB, mutate, uid } from "./db";
import type { AdminUser } from "./types";

export const SESSION_COOKIE = "agriai_session";
const SESSION_TTL_MS = 7 * 24 * 60 * 60 * 1000; // 7 days

// ─── Passwords ───────────────────────────────────────────────────────────────

export function hashPassword(password: string): string {
  return bcrypt.hashSync(password, 10);
}

export function verifyPassword(password: string, hash: string): boolean {
  try {
    return bcrypt.compareSync(password, hash);
  } catch {
    return false;
  }
}

// ─── Login rate limiting (in-memory, per IP) ────────────────────────────────

interface Attempt {
  count: number;
  resetAt: number;
}

const attempts = new Map<string, Attempt>();
const MAX_ATTEMPTS = 5;
const WINDOW_MS = 15 * 60 * 1000;

export function isRateLimited(ip: string): boolean {
  const now = Date.now();
  const rec = attempts.get(ip);
  if (!rec || now > rec.resetAt) return false;
  return rec.count >= MAX_ATTEMPTS;
}

export function recordFailedAttempt(ip: string): void {
  const now = Date.now();
  const rec = attempts.get(ip);
  if (!rec || now > rec.resetAt) {
    attempts.set(ip, { count: 1, resetAt: now + WINDOW_MS });
  } else {
    rec.count += 1;
  }
  if (attempts.size > 5000) {
    for (const [k, v] of attempts) {
      if (Date.now() > v.resetAt) attempts.delete(k);
    }
  }
}

export function clearAttempts(ip: string): void {
  attempts.delete(ip);
}

// ─── Sessions ────────────────────────────────────────────────────────────────

export function createSessionToken(): string {
  return crypto.randomBytes(32).toString("hex");
}

export function findUserByEmail(email: string): AdminUser | undefined {
  const db = getDB();
  const e = email.trim().toLowerCase();
  return db.users.find((u) => u.email.toLowerCase() === e);
}

export function findUserById(id: string): AdminUser | undefined {
  return getDB().users.find((u) => u.id === id);
}

export function startSession(email: string, ip?: string, ua?: string): string {
  const token = createSessionToken();
  mutate((db) => {
    // prune expired sessions
    db.sessions = db.sessions.filter((s) => s.expiresAt > Date.now());
    db.sessions.push({
      token,
      email: email.toLowerCase(),
      createdAt: Date.now(),
      expiresAt: Date.now() + SESSION_TTL_MS,
      ip,
      ua: ua ? ua.slice(0, 200) : undefined,
    });
  });
  return token;
}

export function endSession(token: string): void {
  mutate((db) => {
    db.sessions = db.sessions.filter((s) => s.token !== token);
  });
}

/** Validate the session cookie on a request; returns the admin user or null. */
export function getSessionUser(req: NextRequest): AdminUser | null {
  const token = req.cookies.get(SESSION_COOKIE)?.value;
  if (!token) return null;
  const db = getDB();
  const session = db.sessions.find(
    (s) => s.token === token && s.expiresAt > Date.now()
  );
  if (!session) return null;
  const user = findUserByEmail(session.email);
  if (!user) return null;
  // refresh lastLogin occasionally
  if (!user.lastLogin || Date.now() - user.lastLogin > 60_000) {
    mutate((d) => {
      const u = d.users.find((x) => x.id === user.id);
      if (u) u.lastLogin = Date.now();
    });
  }
  return user;
}

/** Attach the session cookie to a response. */
export function withSessionCookie(
  res: NextResponse,
  token: string,
  remember: boolean
): NextResponse {
  const maxAge = remember ? SESSION_TTL_MS / 1000 : 60 * 60 * 8;
  res.cookies.set(SESSION_COOKIE, token, {
    httpOnly: true,
    sameSite: "lax",
    secure: process.env.NODE_ENV === "production",
    path: "/",
    maxAge,
  });
  return res;
}

export function clearSessionCookie(res: NextResponse): NextResponse {
  res.cookies.set(SESSION_COOKIE, "", {
    httpOnly: true,
    sameSite: "lax",
    path: "/",
    maxAge: 0,
  });
  return res;
}

export function clientIp(req: NextRequest): string {
  const fwd = req.headers.get("x-forwarded-for");
  if (fwd) return fwd.split(",")[0].trim();
  return req.headers.get("x-real-ip") || "unknown";
}

export function publicUser(u: AdminUser) {
  return { id: u.id, name: u.name, email: u.email, role: u.role, createdAt: u.createdAt, lastLogin: u.lastLogin };
}

/** Convenience: create a new admin user (used by the admin panel). */
export function createUser(
  name: string,
  email: string,
  password: string,
  role: "admin" | "editor"
): AdminUser {
  const user: AdminUser = {
    id: uid("usr"),
    name: name.trim(),
    email: email.trim().toLowerCase(),
    passwordHash: hashPassword(password),
    role,
    createdAt: Date.now(),
  };
  mutate((db) => {
    db.users.push(user);
  });
  return user;
}
