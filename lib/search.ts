// ─── Web search (Tavily) with graceful fallback ──────────────────────────────

import { tavilyApiKey } from "./env";

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

async function keylessSearch(query: string): Promise<SearchResult> {
  const sources: SearchSource[] = [];
  try {
    const wiki = await fetch(
      `https://en.wikipedia.org/w/api.php?action=opensearch&search=${encodeURIComponent(query)}&limit=4&namespace=0&format=json&origin=*`,
      { signal: AbortSignal.timeout(10000) }
    );
    if (wiki.ok) {
      const data = (await wiki.json()) as [string, string[], string[], string[]];
      const titles = data[1] || [];
      const descs = data[2] || [];
      const urls = data[3] || [];
      titles.forEach((title, i) => {
        if (urls[i]) sources.push({ title, url: urls[i], snippet: descs[i] || "" });
      });
    }
  } catch (err) {
    console.error("[search] wikipedia failed:", (err as Error).message);
  }
  try {
    const ddg = await fetch(
      `https://api.duckduckgo.com/?q=${encodeURIComponent(query)}&format=json&no_html=1&skip_disambig=1`,
      { signal: AbortSignal.timeout(10000) }
    );
    if (ddg.ok) {
      const data = (await ddg.json()) as {
        AbstractText?: string;
        AbstractURL?: string;
        Heading?: string;
        RelatedTopics?: { Text?: string; FirstURL?: string }[];
      };
      if (data.AbstractURL && data.Heading) {
        sources.unshift({
          title: data.Heading,
          url: data.AbstractURL,
          snippet: data.AbstractText || "",
        });
      }
      for (const t of data.RelatedTopics || []) {
        if (t.FirstURL && t.Text && sources.length < 6) {
          sources.push({ title: t.Text.slice(0, 80), url: t.FirstURL, snippet: t.Text });
        }
      }
    }
  } catch (err) {
    console.error("[search] duckduckgo failed:", (err as Error).message);
  }
  return { sources, demo: sources.length === 0 };
}

export async function searchWeb(query: string): Promise<SearchResult> {
  const key = tavilyApiKey();
  if (!key) {
    return keylessSearch(query);
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
    return keylessSearch(query);
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
