// ─── Unsplash image search with graceful fallback ─────────────────────────────
// Reads UNSPLASH_ACCESS_KEY from the environment. When the key is absent (e.g.
// local dev) or the request fails, returns an empty set with demo:true so the UI
// can fall back gracefully — the product always works, with live images on Render
// once the key is set there. See render.yaml / .env.example.

export interface CropImage {
  id: string;
  alt: string;
  thumb: string; // small preview URL
  full: string; // larger display URL
  credit: string; // photographer name
  creditUrl: string; // photographer profile (Unsplash attribution)
  downloadUrl: string; // ping this when displaying — per Unsplash API guidelines
}

export interface ImageResult {
  images: CropImage[];
  demo: boolean;
}

/**
 * Search Unsplash for photos matching query (e.g. a crop name).
 * Returns up to count landscape images with attribution data.
 */
export async function getImages(query: string, count = 4): Promise<ImageResult> {
  const key = process.env.UNSPLASH_ACCESS_KEY;
  const q = query.trim();
  if (!key || !q) {
    return { images: [], demo: true };
  }
  try {
    const url = new URL("https://api.unsplash.com/search/photos");
    url.searchParams.set("query", q);
    url.searchParams.set("per_page", String(Math.min(Math.max(count, 1), 12)));
    url.searchParams.set("orientation", "landscape");
    url.searchParams.set("content_filter", "high");

    const res = await fetch(url, {
      headers: {
        Authorization: `Client-ID ${key}`,
        "Accept-Version": "v1",
      },
      signal: AbortSignal.timeout(12000),
      cache: "no-store",
    });
    if (!res.ok) throw new Error(`unsplash ${res.status}`);
    const data = (await res.json()) as {
      results?: {
        id?: string;
        alt_description?: string | null;
        urls?: { regular?: string; small?: string };
        user?: { name?: string; links?: { html?: string } };
        links?: { download_location?: string };
      }[];
    };

    const images: CropImage[] = (data.results || [])
      .filter((r) => r.urls?.regular)
      .map((r) => ({
        id: r.id || r.urls!.regular!,
        alt: r.alt_description || q,
        thumb: r.urls?.small || r.urls!.regular!,
        full: r.urls!.regular!,
        credit: r.user?.name || "Unsplash",
        creditUrl: r.user?.links?.html || "https://unsplash.com",
        downloadUrl: r.links?.download_location
          ? `${r.links.download_location}?client_id=${key}`
          : "",
      }));

    return { images, demo: false };
  } catch (err) {
    console.error("[images] Unsplash failed:", (err as Error).message);
    return { images: [], demo: true };
  }
}
