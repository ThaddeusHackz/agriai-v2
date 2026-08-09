// ─── AgriAI 2.0 shared types ────────────────────────────────────────────────

export interface ChatMessage {
  id: string;
  role: "user" | "assistant";
  content: string;
  language: string;
  mode: string;
  sources?: Source[];
  ts: number;
  feedback?: "up" | "down";
  demo?: boolean;
}

export interface Source {
  title: string;
  url: string;
  snippet?: string;
}

export interface ChatRecord {
  id: string;
  sessionId: string;
  title: string;
  language: string;
  mode: string;
  messages: ChatMessage[];
  createdAt: number;
  updatedAt: number;
}

export interface AdminUser {
  id: string;
  name: string;
  email: string;
  passwordHash: string;
  role: "admin" | "editor";
  createdAt: number;
  lastLogin?: number;
}

export interface Session {
  token: string;
  email: string;
  createdAt: number;
  expiresAt: number;
  ip?: string;
  ua?: string;
}

export interface PriceEntry {
  id: string;
  crop: string;
  market: string;
  price: number;
  unit: string;
  date: string; // ISO date
  trend: "up" | "down" | "stable";
  note?: string;
}

export interface KnowledgeEntry {
  id: string;
  question: string;
  answer: string;
  category: string;
  keywords: string[];
  updatedAt: number;
}

export interface FeedbackEntry {
  id: string;
  chatId: string;
  messageId: string;
  value: "up" | "down";
  comment?: string;
  createdAt: number;
}

export interface Subscriber {
  id: string;
  email: string;
  name?: string;
  createdAt: number;
}

export interface ContactEntry {
  id: string;
  name: string;
  email: string;
  subject: string;
  message: string;
  read: boolean;
  createdAt: number;
}

export interface AppSettings {
  siteName: string;
  tagline: string;
  heroTitle: string;
  heroSubtitle: string;
  heroBadge: string;
  announcement: string;
  announcementEnabled: boolean;
  primaryColor: string;
  deepColor: string;
  accentColor: string;
  showSections: {
    features: boolean;
    prices: boolean;
    weather: boolean;
    disease: boolean;
    how: boolean;
    testimonials: boolean;
    team: boolean;
    faq: boolean;
    newsletter: boolean;
  };
  chat: {
    model: string;
    visionModel: string;
    temperature: number;
    maxTokens: number;
    webSearchDefault: boolean;
    defaultMode: "standard" | "expert" | "agent";
    placeholder: string;
    quickPrompts: string[];
    systemPrompt: string;
    expertPrompt: string;
    agentPrompt: string;
  };
  stats: { label: string; value: string }[];
  contactEmail: string;
  footerText: string;
  updatedAt: number;
}

export interface Analytics {
  visits: { date: string; count: number; unique: number }[];
  questions: { q: string; count: number }[];
  totalChats: number;
  totalMessages: number;
  totalFeedbackUp: number;
  totalFeedbackDown: number;
  totalSubscribers: number;
  firstSeen: number;
}

export interface Database {
  version: number;
  settings: AppSettings;
  users: AdminUser[];
  sessions: Session[];
  chats: ChatRecord[];
  feedback: FeedbackEntry[];
  prices: PriceEntry[];
  knowledge: KnowledgeEntry[];
  subscribers: Subscriber[];
  contacts: ContactEntry[];
  analytics: Analytics;
  meta: { seededAt: number };
}
