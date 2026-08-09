import type { Metadata, Viewport } from "next";
import "./globals.css";
import { Toaster } from "sonner";

export const metadata: Metadata = {
  metadataBase: new URL(process.env.NEXT_PUBLIC_SITE_URL || "https://agriai.onrender.com"),
  title: {
    default: "AgriAI 2.0 — Intelligent Farming Assistant for Ghana",
    template: "%s · AgriAI",
  },
  description:
    "AgriAI is Ghana's intelligent farming assistant: multilingual AI chat (English, Twi, Ga, Ewe, Hausa, French), voice input & output, web search, crop disease detection, live market prices and weather — built for Ghanaian farmers.",
  keywords: [
    "AgriAI", "Ghana farming", "agriculture AI", "crop disease detection",
    "maize planting", "cocoa price Ghana", "Twi farming assistant",
    "market prices Ghana", "farm advisor",
  ],
  openGraph: {
    type: "website",
    siteName: "AgriAI",
    title: "AgriAI 2.0 — The Future of Farming in Ghana",
    description: "AI that speaks your language. Multilingual farming assistant with voice, web search, disease detection & market prices.",
    images: ["/images/og.png"],
  },
  twitter: {
    card: "summary_large_image",
    title: "AgriAI 2.0 — The Future of Farming in Ghana",
    description: "AI that speaks your language. Multilingual farming assistant for Ghana.",
    images: ["/images/og.png"],
  },
  robots: { index: true, follow: true },
};

export const viewport: Viewport = {
  width: "device-width",
  initialScale: 1,
  themeColor: "#00c853",
};

export default function RootLayout({
  children,
}: Readonly<{ children: React.ReactNode }>) {
  return (
    <html lang="en">
      <body className="min-h-screen bg-white">
        {children}
        <Toaster position="top-center" richColors closeButton />
      </body>
    </html>
  );
}
