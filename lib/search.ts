// ─── Web search (Tavily) with graceful fallback ──────────────────────────────

export interface SearchSource {
  title: string;
  url: string;
  snippet?: string;
}

export interface SearchResult {
  answer?: string;
  sources: SearchSource[];
  demo: boolean;
}

export async function searchWeb(query: string): Promise<SearchResult> {
  const key = process.env.TAVILY_API_KEY;
  if (!key) {
    return { sources: [], demo: true };
  }
  try {
    const res = await fetch("https://api.tavily.com/search", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        api_key: key,
        query,
        search_depth: "advanced",
        include_answer: true,
        include_images: false,
        max_results: 6,
      }),
      signal: AbortSignal.timeout(15000),
    });
    if (!res.ok) throw new Error(`tavily ${res.status}`);
    const data = (await res.json()) as {
      answer?: string;
      results?: { title?: string; url?: string; content?: string }[];
    };
    return {
      answer: data.answer || undefined,
      sources: (data.results || [])
        .filter((r) => r.title && r.url)
        .map((r) => ({ title: r.title!, url: r.url!, snippet: r.content?.slice(0, 300) })),
      demo: false,
    };
  } catch (err) {
    console.error("[search] Tavily failed:", (err as Error).message);
    return { sources: [], demo: true };
  }
}

/** Compact text block fed to the LLM as grounding context. */
export function contextBlock(result: SearchResult): string {
  const parts: string[] = [];
  if (result.answer) parts.push(`Summary: ${result.answer}`);
  result.sources.forEach((s, i) => {
    parts.push(`[${i + 1}] ${s.title}\n${s.snippet || ""}\nURL: ${s.url}`);
  });
  return parts.join("\n\n");
}
