"use client";

import React from "react";
import { X, Megaphone } from "lucide-react";
import { useSite } from "@/lib/site-context";

export default function AnnouncementBar() {
  const { settings } = useSite();
  const [dismissed, setDismissed] = React.useState(false);
  if (!settings.announcementEnabled || dismissed || !settings.announcement) return null;

  return (
    <div
      className="relative text-white text-center text-[0.86rem] font-semibold py-2.5 px-10 overflow-hidden"
      style={{ background: "linear-gradient(90deg, var(--deep-bg), #0a4a28, var(--deep-bg))" }}
    >
      <div
        className="absolute inset-0 opacity-30"
        style={{ background: "linear-gradient(90deg, transparent, rgba(0,230,118,0.5), transparent)", animation: "shimmer 3.5s linear infinite", backgroundSize: "400px 100%" }}
      />
      <span className="relative">
        <Megaphone className="inline w-4 h-4 mr-2 -mt-0.5" style={{ color: "var(--primary)" }} />
        {settings.announcement}
      </span>
      <button
        onClick={() => setDismissed(true)}
        className="absolute right-3 top-1/2 -translate-y-1/2 p-1 rounded-full hover:bg-white/15 transition"
        aria-label="Dismiss"
      >
        <X className="w-4 h-4" />
      </button>
    </div>
  );
}
