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
    "AgriAI is Ghana's intelligent farming assistant: multilingual AI chat (English, Twi, Ga, Ewe, Hausa, French), voice input & output, web search, crop disease detection, AI crop visualizer, live market prices and weather — built for Ghanaian farmers by Thaddeus Tagoe.",
  keywords: [
    "AgriAI", "Ghana farming", "agriculture AI", "crop disease detection",
    "maize planting", "cocoa price Ghana", "Twi farming assistant",
    "market prices Ghana", "farm advisor", "AI crop visualizer",
  ],
  openGraph: {
    type: "website",
    siteName: "AgriAI",
    title: "AgriAI 2.0 — The Future of Farming in Ghana",
    description: "AI that speaks your language. Multilingual farming assistant with voice, web search, disease detection, AI visualizer & market prices.",
    images: ["/images/og.png"],
  },
  twitter: {
    card: "summary_large_image",
    title: "AgriAI 2.0 — The Future of Farming in Ghana",
    description: "AI that speaks your language. Multilingual farming assistant for Ghana.",
    images: ["/images/og.png"],
  },
  icons: {
    icon: "/images/logo-3d.png",
    apple: "/images/logo-3d.png",
  },
  robots: { index: true, follow: true },
};

export const viewport: Viewport = {
  width: "device-width",
  initialScale: 1,
  themeColor: "#050d08",
};

export default function RootLayout({
  children,
}: Readonly<{ children: React.ReactNode }>) {
  return (
    <html lang="en">
      <head>
        <link rel="preconnect" href="https://fonts.googleapis.com" />
        <link rel="preconnect" href="https://fonts.gstatic.com" crossOrigin="anonymous" />
        <link
          href="https://fonts.googleapis.com/css2?family=Sora:wght@400;500;600;700;800&family=Inter:wght@400;500;600;700&display=swap"
          rel="stylesheet"
        />
      </head>
      <body className="min-h-screen">
        {children}
        <Toaster position="top-center" richColors closeButton theme="dark" />
      </body>
    </html>
  );
}
