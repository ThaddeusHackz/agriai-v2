"use client";

// ─── AgriAI Studio — AI crop visualizer (Cloudflare Flux) ────────────────────
// Type a crop or farm scene → Cloudflare Workers AI (Flux-1-schnell) renders a
// photoreal image. Gracefully explains when Cloudflare keys aren't configured.

import React, { useState } from "react";
import { motion } from "framer-motion";
import { Sparkles, Loader2, Download, Wand2, ImageOff } from "lucide-react";
import Section from "./Section";
import { useSite } from "@/lib/site-context";

const SUGGESTIONS = [
  "Healthy maize field at sunrise in Ghana",
  "Cocoa farm with ripe pods, golden hour",
  "Drip irrigation on a tomato farm",
  "Lush green cassava plantation",
];

export default function CropStudio() {
  const { settings } = useSite();
  const [prompt, setPrompt] = useState("");
  const [image, setImage] = useState<string | null>(null);
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const generate = async (text?: string) => {
    const p = (text ?? prompt).trim();
    if (!p || busy) return;
    setBusy(true);
    setError(null);
    try {
      const res = await fetch("/api/generate", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ prompt: p }),
      });
      const data = await res.json();
      if (res.ok && data.image) {
        setImage(data.image);
      } else {
        setError(data.error || "Generation failed — try again.");
      }
    } catch {
      setError("Network error — check your connection and retry.");
    } finally {
      setBusy(false);
    }
  };

  const download = () => {
    if (!image) return;
    const a = document.createElement("a");
    a.href = image;
    a.download = `agriai-${Date.now()}.png`;
    a.click();
  };

  return (
    <Section
      id="studio"
      title="AgriAI Studio"
      subtitle="See your farm before you plant it — AI-generated crop imagery powered by Cloudflare Workers AI (Flux)."
      show={settings.showSections.studio}
    >
      <motion.div
        initial={{ opacity: 0, y: 22 }}
        whileInView={{ opacity: 1, y: 0 }}
        viewport={{ once: true }}
        transition={{ duration: 0.5 }}
        className="max-w-3xl mx-auto"
      >
        <div className="aura-border p-6 md:p-8">
          <div className="flex flex-col sm:flex-row gap-3">
            <div className="relative flex-1">
              <Wand2 className="absolute left-4 top-1/2 -translate-y-1/2 w-4.5 h-4.5 text-[var(--primary)]" />
              <input
                className="input !pl-11 !py-3.5"
                placeholder="Describe a crop or farm scene… e.g. 'healthy maize field at sunrise in Ghana'"
                value={prompt}
                onChange={(e) => setPrompt(e.target.value)}
                onKeyDown={(e) => e.key === "Enter" && generate()}
              />
            </div>
            <button
              onClick={() => generate()}
              disabled={busy || !prompt.trim()}
              className="btn btn-primary px-6 py-3.5 text-[0.9rem]"
            >
              {busy ? <Loader2 className="w-4.5 h-4.5 animate-spin" /> : <Sparkles className="w-4.5 h-4.5" />}
              {busy ? "Creating…" : "Generate"}
            </button>
          </div>

          {/* suggestions */}
          <div className="mt-4 flex flex-wrap gap-2">
            {SUGGESTIONS.map((s) => (
              <button key={s} className="chip text-[0.75rem]" onClick={() => { setPrompt(s); generate(s); }}>
                {s}
              </button>
            ))}
          </div>

          {error && (
            <div className="mt-4 flex items-start gap-2.5 text-[0.85rem] text-[#ffb4a2] bg-[rgba(255,107,107,0.08)] border border-[rgba(255,107,107,0.25)] rounded-2xl px-4 py-3">
              <ImageOff className="w-4.5 h-4.5 shrink-0 mt-0.5" />
              <span>{error}</span>
            </div>
          )}

          {/* result */}
          {image && (
            <motion.div
              initial={{ opacity: 0, scale: 0.97 }}
              animate={{ opacity: 1, scale: 1 }}
              className="mt-6 relative rounded-3xl overflow-hidden border border-[var(--border-strong)] group"
            >
              {/* eslint-disable-next-line @next/next/no-img-element */}
              <img src={image} alt={prompt || "AI-generated farm scene"} className="w-full h-auto max-h-[480px] object-cover" />
              <div className="absolute inset-x-0 bottom-0 bg-gradient-to-t from-black/70 to-transparent p-4 flex items-center justify-between gap-3">
                <span className="text-[0.8rem] font-medium text-white/90 truncate">
                  ✨ {prompt || "Generated scene"}
                </span>
                <button onClick={download} className="btn btn-primary !py-2 !px-4 text-[0.8rem] shrink-0">
                  <Download className="w-4 h-4" /> Save
                </button>
              </div>
            </motion.div>
          )}
        </div>
      </motion.div>
    </Section>
  );
}
