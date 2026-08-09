"use client";

// ─── Admin API helpers ───────────────────────────────────────────────────────

export async function api<T = unknown>(
  url: string,
  options: RequestInit = {}
): Promise<{ ok: boolean; status: number; data: T & { error?: string } }> {
  const res = await fetch(url, {
    ...options,
    headers: {
      "Content-Type": "application/json",
      ...(options.headers || {}),
    },
    cache: "no-store",
  });
  let data: T & { error?: string } = {} as T & { error?: string };
  try {
    data = await res.json();
  } catch {
    /* non-json */
  }
  return { ok: res.ok, status: res.status, data };
}

export function errorMessage(r: { data: { error?: string } }, fallback: string): string {
  return r.data?.error || fallback;
}
