// ─── POST /api/admin/login — admin authentication ────────────────────────────

import { NextRequest, NextResponse } from "next/server";
import {
  clientIp,
  clearAttempts,
  isRateLimited,
  recordFailedAttempt,
  startSession,
  verifyPassword,
  withSessionCookie,
  findUserByEmail,
  publicUser,
} from "@/lib/auth";
import { mutate } from "@/lib/db";

export const runtime = "nodejs";

export async function POST(request: NextRequest) {
  const ip = clientIp(request);

  if (isRateLimited(ip)) {
    return NextResponse.json(
      { error: "Too many failed attempts. Try again in 15 minutes." },
      { status: 429 }
    );
  }

  let body: { email?: string; password?: string; remember?: boolean } = {};
  try {
    body = await request.json();
  } catch {
    return NextResponse.json({ error: "Invalid request" }, { status: 400 });
  }

  const email = (body.email || "").trim().toLowerCase();
  const password = body.password || "";
  if (!email || !password) {
    return NextResponse.json({ error: "Email and password are required" }, { status: 400 });
  }

  const user = findUserByEmail(email);
  if (!user || !verifyPassword(password, user.passwordHash)) {
    recordFailedAttempt(ip);
    return NextResponse.json({ error: "Invalid email or password" }, { status: 401 });
  }

  clearAttempts(ip);
  const token = startSession(user.email, ip, request.headers.get("user-agent") || undefined);
  mutate((db) => {
    const u = db.users.find((x) => x.id === user.id);
    if (u) u.lastLogin = Date.now();
  });

  const res = NextResponse.json({
    ok: true,
    user: publicUser(user),
  });
  return withSessionCookie(res, token, Boolean(body.remember));
}
