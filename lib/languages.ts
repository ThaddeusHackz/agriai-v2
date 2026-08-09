// ─── Language support for Ghana & West Africa ───────────────────────────────

export interface LanguageInfo {
  code: string;
  name: string;
  native: string;
  flag: string;
  speechHint: string;
}

export const LANGUAGES: LanguageInfo[] = [
  { code: "en", name: "English", native: "English", flag: "🇬🇭", speechHint: "en-GH" },
  { code: "tw", name: "Twi", native: "Twi (Akan)", flag: "🌿", speechHint: "en-GH" },
  { code: "ga", name: "Ga", native: "Ga", flag: "🏙️", speechHint: "en-GH" },
  { code: "ee", name: "Ewe", native: "Eʋegbe", flag: "🌊", speechHint: "en-GH" },
  { code: "ha", name: "Hausa", native: "Hausa", flag: "🐪", speechHint: "en-GH" },
  { code: "fr", name: "French", native: "Français", flag: "🇫🇷", speechHint: "fr-FR" },
];

export function getLanguage(code: string): LanguageInfo {
  return LANGUAGES.find((l) => l.code === code) ?? LANGUAGES[0];
}

/** Instruction embedded in the AI system prompt so Groq replies in-language. */
export function languageInstruction(code: string): string {
  const map: Record<string, string> = {
    en: "English",
    tw: "Twi (Akan) — write using Twi words and phrasing, keeping agricultural terms clear",
    ga: "Ga",
    ee: "Ewe",
    ha: "Hausa",
    fr: "French",
  };
  const name = map[code] ?? "English";
  return code === "en"
    ? "Reply in English."
    : `Reply in ${name}. Keep technical farming terms in parentheses in English where helpful.`;
}
