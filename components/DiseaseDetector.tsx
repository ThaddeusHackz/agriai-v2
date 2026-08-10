"use client";

// ─── Crop Disease Detection ──────────────────────────────────────────────────
// Upload a photo of a crop/leaf → Gemini vision model returns the disease,
// confidence, description and treatment plan. Fully offline-safe.

import React, { useRef, useState } from "react";
import { motion } from "framer-motion";
import { Upload, ImagePlus, Leaf, AlertTriangle, CheckCircle2, Loader2, Bug } from "lucide-react";
import Section from "./Section";
import { useSite } from "@/lib/site-context";

interface Result {
  detected: string;
  confidence: number;
  description: string;
  treatment: string[];
  demo: boolean;
}

export default function DiseaseDetector() {
  const { settings } = useSite();
  const [preview, setPreview] = useState<string | null>(null);
  const [analyzing, setAnalyzing] = useState(false);
  const [result, setResult] = useState<Result | null>(null);
  const [error, setError] = useState("");
  const fileRef = useRef<HTMLInputElement>(null);

  const analyze = async (dataUrl: string) => {
    setAnalyzing(true);
    setError("");
    setResult(null);
    try {
      const res = await fetch("/api/vision", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ image: dataUrl, language: "en" }),
      });
      const data = await res.json();
      if (!res.ok) {
        setError(data.error || "Analysis failed");
      } else {
        setResult(data);
      }
    } catch {
      setError("Analysis failed — check your connection.");
    } finally {
      setAnalyzing(false);
    }
  };

  const onFile = (file: File | undefined | null) => {
    if (!file) return;
    if (!file.type.startsWith("image/")) {
      setError("Please choose an image file (JPG/PNG).");
      return;
    }
    if (file.size > 4 * 1024 * 1024) {
      setError("Image too large — max 4MB.");
      return;
    }
    const reader = new FileReader();
    reader.onload = () => {
      const dataUrl = String(reader.result);
      setPreview(dataUrl);
      analyze(dataUrl);
    };
    reader.readAsDataURL(file);
  };

  const trySample = async () => {
    try {
      const res = await fetch("/images/sample-disease.jpg");
      const blob = await res.blob();
      const file = new File([blob], "sample-disease.jpg", { type: "image/jpeg" });
      onFile(file);
    } catch {
      setError("Could not load sample image.");
    }
  };

  return (
    <Section
      id="disease-detection"
      title="Crop Disease Detection"
      subtitle="Take a photo of a sick crop — AgriAI's vision model identifies the disease, confidence level and the exact treatment plan."
      show={settings.showSections.disease}
    >
      <div className="grid lg:grid-cols-2 gap-6 items-start">
        {/* Upload */}
        <motion.div
          initial={{ opacity: 0, y: 22 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          transition={{ duration: 0.5 }}
          className="card rounded-3xl p-6"
        >
          <div
            onDragOver={(e) => e.preventDefault()}
            onDrop={(e) => {
              e.preventDefault();
              onFile(e.dataTransfer.files?.[0]);
            }}
            onClick={() => fileRef.current?.click()}
            className="border-2 border-dashed border-[var(--border)] hover:border-[var(--primary)] rounded-3xl p-10 text-center cursor-pointer transition group bg-[var(--surface)]/50"
          >
            {preview ? (
              <div className="relative">
                <img
                  src={preview}
                  alt="Crop preview"
                  className="max-h-64 mx-auto rounded-2xl object-contain shadow-md"
                />
                <div className="mt-3 text-[0.82rem] text-[var(--muted)] font-medium">
                  Click to upload another image
                </div>
              </div>
            ) : (
              <div>
                <span className="inline-flex w-16 h-16 rounded-3xl items-center justify-center mb-4 text-white shadow-lg group-hover:scale-105 transition" style={{ background: "var(--primary)" }}>
                  <ImagePlus className="w-8 h-8" />
                </span>
                <div className="font-bold text-[1.05rem] text-[var(--deep)]">Drop a crop photo here</div>
                <p className="mt-1.5 text-[0.85rem] text-[var(--muted)]">
                  or click to browse · JPG/PNG · max 4MB
                </p>
              </div>
            )}
            <input
              ref={fileRef}
              type="file"
              accept="image/*"
              className="hidden"
              onChange={(e) => onFile(e.target.files?.[0])}
            />
          </div>

          <div className="mt-4 flex items-center justify-center gap-3">
            <button onClick={trySample} disabled={analyzing} className="btn btn-ghost text-[0.85rem] px-5 py-2.5">
              <Leaf className="w-4 h-4" /> Try sample image
            </button>
            <span className="text-[0.78rem] text-[var(--muted)]">
              Maize leaf sample
            </span>
          </div>

          {error && (
            <div className="mt-4 flex items-center gap-2 text-[0.85rem] text-[#b3261e] bg-[#fdecea] border border-[#f5c6c2] rounded-2xl px-4 py-3">
              <AlertTriangle className="w-4 h-4 shrink-0" /> {error}
            </div>
          )}
        </motion.div>

        {/* Result */}
        <motion.div
          initial={{ opacity: 0, y: 22 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          transition={{ duration: 0.5, delay: 0.1 }}
          className="card rounded-3xl p-6 min-h-[300px]"
        >
          {analyzing && (
            <div className="flex flex-col items-center justify-center h-64 text-center">
              <Loader2 className="w-10 h-10 animate-spin mb-4" style={{ color: "var(--primary)" }} />
              <div className="font-semibold text-[var(--deep)]">Analyzing your crop…</div>
              <p className="text-[0.82rem] text-[var(--muted)] mt-1">Powered by Google Gemini vision</p>
            </div>
          )}

          {!analyzing && !result && (
            <div className="flex flex-col items-center justify-center h-64 text-center text-[var(--muted)]">
              <Bug className="w-10 h-10 mb-4 opacity-40" />
              <div className="font-semibold text-[0.95rem]">Detection result appears here</div>
              <p className="text-[0.82rem] mt-1 max-w-xs">
                Upload a photo of maize, cassava, tomato, cocoa or any crop to get an instant diagnosis.
              </p>
            </div>
          )}

          {!analyzing && result && (
            <div className="fade-up">
              <div className="flex items-start justify-between gap-3">
                <div className="flex items-center gap-3">
                  <span className={`inline-flex w-11 h-11 rounded-2xl items-center justify-center text-white ${result.demo ? "bg-[#b7791f]" : ""}`} style={!result.demo ? { background: result.confidence >= 60 ? "var(--primary)" : "var(--accent)" } : undefined}>
                    {result.demo ? <AlertTriangle className="w-5 h-5" /> : <CheckCircle2 className="w-5 h-5" />}
                  </span>
                  <div>
                    <div className="text-[0.7rem] font-bold uppercase tracking-wider text-[var(--muted)]">Diagnosis</div>
                    <h3 className="font-bold text-[1.1rem] text-[var(--deep)] leading-tight">{result.detected}</h3>
                  </div>
                </div>
              </div>

              {!result.demo && (
                <div className="mt-4">
                  <div className="flex justify-between text-[0.78rem] font-semibold mb-1.5">
                    <span className="text-[var(--muted)]">Confidence</span>
                    <span style={{ color: result.confidence >= 60 ? "var(--primary-strong)" : "#b7791f" }}>
                      {Math.round(result.confidence)}%
                    </span>
                  </div>
                  <div className="h-2.5 rounded-full bg-[var(--surface-2)] overflow-hidden">
                    <div
                      className="h-full rounded-full transition-all duration-700"
                      style={{
                        width: `${result.confidence}%`,
                        background: result.confidence >= 60 ? "var(--primary)" : "var(--accent)",
                      }}
                    />
                  </div>
                </div>
              )}

              {result.description && (
                <p className="mt-4 text-[0.9rem] leading-relaxed text-[var(--muted)]">{result.description}</p>
              )}

              {result.treatment.length > 0 && (
                <div className="mt-4">
                  <div className="text-[0.7rem] font-bold uppercase tracking-wider text-[var(--muted)] mb-2">
                    Recommended treatment
                  </div>
                  <ol className="space-y-2">
                    {result.treatment.map((t, i) => (
                      <li key={i} className="flex gap-2.5 text-[0.88rem] leading-relaxed">
                        <span className="shrink-0 w-5 h-5 rounded-full text-white text-[0.68rem] font-bold flex items-center justify-center mt-0.5" style={{ background: "var(--primary)" }}>
                          {i + 1}
                        </span>
                        <span className="text-[var(--text)]">{t}</span>
                      </li>
                    ))}
                  </ol>
                </div>
              )}
            </div>
          )}
        </motion.div>
      </div>
    </Section>
  );
}
