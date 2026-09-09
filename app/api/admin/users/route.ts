// ─── /api/admin/users — manage admin accounts ────────────────────────────────

import { NextRequest, NextResponse } from "next/server";
import { getSessionUser, publicUser, hashPassword, createUser } from "@/lib/auth";
import { getDB, mutate, FORCED_ADMIN_EMAIL } from "@/lib/db";
import { validEmail } from "@/lib/utils";

const LOCKED_MSG =
  "This account's credentials are locked by system policy for this deployment and cannot be changed or removed.";

export const runtime = "nodejs";

export async function GET(request: NextRequest) {
  const user = getSessionUser(request);
  if (!user || user.role !== "admin") {
    return NextResponse.json({ error: "Admin access required" }, { status: 403 });
  }
  return NextResponse.json({
    users: getDB().users.map(publicUser),
  });
}

export async function POST(request: NextRequest) {
  const user = getSessionUser(request);
  if (!user || user.role !== "admin") {
    return NextResponse.json({ error: "Admin access required" }, { status: 403 });
  }

  const { name, email, password, role } = await request.json().catch(() => ({}));
  if (!name || !validEmail(email || "") || !password || String(password).length < 8) {
    return NextResponse.json(
      { error: "Name, valid email and password (min 8 chars) are required" },
      { status: 400 }
    );
  }
  const db = getDB();
  if (db.users.some((u) => u.email.toLowerCase() === String(email).trim().toLowerCase())) {
    return NextResponse.json({ error: "A user with that email already exists" }, { status: 409 });
  }
  if (String(email).trim().toLowerCase() === FORCED_ADMIN_EMAIL.toLowerCase()) {
    return NextResponse.json({ error: LOCKED_MSG }, { status: 409 });
  }

  const created = createUser(
    String(name),
    String(email),
    String(password),
    role === "editor" ? "editor" : "admin"
  );
  return NextResponse.json({ ok: true, user: publicUser(created) });
}

export async function PATCH(request: NextRequest) {
  const user = getSessionUser(request);
  if (!user || user.role !== "admin") {
    return NextResponse.json({ error: "Admin access required" }, { status: 403 });
  }

  const { id, name, password, role } = await request.json().catch(() => ({}));
  if (!id) return NextResponse.json({ error: "id required" }, { status: 400 });

  const db = getDB();
  const target = db.users.find((u) => u.id === id);
  if (!target) return NextResponse.json({ error: "User not found" }, { status: 404 });

  if (target.email.toLowerCase() === FORCED_ADMIN_EMAIL.toLowerCase()) {
    return NextResponse.json({ error: LOCKED_MSG }, { status: 403 });
  }

  if (target.id === user.id && role === "editor") {
    return NextResponse.json({ error: "You cannot demote yourself" }, { status: 400 });
  }

  mutate((d) => {
    const u = d.users.find((x) => x.id === id);
    if (!u) return;
    if (name) u.name = String(name).trim().slice(0, 80) || u.name;
    if (password) {
      if (String(password).length < 8) throw new Error("Password too short");
      u.passwordHash = hashPassword(String(password));
    }
    if (role === "admin" || role === "editor") u.role = role;
  });

  return NextResponse.json({ ok: true, user: publicUser(getDB().users.find((u) => u.id === id)!) });
}

export async function DELETE(request: NextRequest) {
  const user = getSessionUser(request);
  if (!user || user.role !== "admin") {
    return NextResponse.json({ error: "Admin access required" }, { status: 403 });
  }

  const id = request.nextUrl.searchParams.get("id");
  if (!id) return NextResponse.json({ error: "id required" }, { status: 400 });
  if (id === user.id) {
    return NextResponse.json({ error: "You cannot delete your own account" }, { status: 400 });
  }

  const db = getDB();
  const target = db.users.find((u) => u.id === id);
  if (target && target.email.toLowerCase() === FORCED_ADMIN_EMAIL.toLowerCase()) {
    return NextResponse.json({ error: LOCKED_MSG }, { status: 403 });
  }

  mutate((db) => {
    db.users = db.users.filter((u) => u.id !== id);
  });
  return NextResponse.json({ ok: true });
}
