// ─── Environment helpers ─────────────────────────────────────────────────────
// Keys are often pasted with quotes, whitespace, or under Google/Cloudflare
// alias names. We accept every common alias and never log secret values.

function firstEnv(...names: string[]): string {
  for (const name of names) {
    const raw = process.env[name];
    if (typeof raw !== "string") continue;
    const cleaned = raw.trim().replace(/^['"]+|['"]+$/g, "");
    if (cleaned && !/^YOUR_|CHANGE_ME|placeholder/i.test(cleaned)) return cleaned;
  }
  return "";
}

export function geminiApiKey(): string {
  return firstEnv(
    "GEMINI_API_KEY",
    "GOOGLE_API_KEY",
    "GOOGLE_GENERATIVE_AI_API_KEY",
    "GOOGLE_GENAI_API_KEY",
    "GOOGLE_GEMINI_API_KEY"
  );
}

export function cloudflareApiKey(): string {
  return firstEnv("CLOUDFLARE_API_KEY", "CLOUDFLARE_API_TOKEN", "CF_API_TOKEN", "CF_API_KEY");
}

export function cloudflareAccountId(): string {
  return firstEnv("CLOUDFLARE_ACCOUNT_ID", "CF_ACCOUNT_ID");
}

export function openweatherApiKey(): string {
  return firstEnv("OPENWEATHER_API_KEY", "OPENWEATHERMAP_API_KEY", "WEATHER_API_KEY");
}

export function tavilyApiKey(): string {
  return firstEnv("TAVILY_API_KEY");
}

export function elevenLabsApiKey(): string {
  return firstEnv("ELEVENLABS_API_KEY");
}

export function unsplashAccessKey(): string {
  return firstEnv("UNSPLASH_ACCESS_KEY");
}

export function providerStatus() {
  return {
    gemini: Boolean(geminiApiKey()),
    cloudflare: Boolean(cloudflareApiKey() && cloudflareAccountId()),
    openweather: Boolean(openweatherApiKey()),
    tavily: Boolean(tavilyApiKey()),
    elevenlabs: Boolean(elevenLabsApiKey()),
    unsplash: Boolean(unsplashAccessKey()),
    database: Boolean(firstEnv("DATABASE_URL")),
  };
}
