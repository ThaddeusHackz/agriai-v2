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
      className="relative text-white text-center text-[0.86rem] font-medium py-2.5 px-10"
      style={{ background: "linear-gradient(90deg, var(--deep), var(--primary-strong))" }}
    >
      <Megaphone className="inline w-4 h-4 mr-2 -mt-0.5" />
      {settings.announcement}
      <button
        onClick={() => setDismissed(true)}
        className="absolute right-3 top-1/2 -translate-y-1/2 p-1 rounded-full hover:bg-white/20 transition"
        aria-label="Dismiss"
      >
        <X className="w-4 h-4" />
      </button>
    </div>
  );
}
