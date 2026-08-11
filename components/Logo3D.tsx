"use client";

// ─── AgriAI 3D Logo — a slowly-spinning 3D emblem with orbit rings ───────────
// Pure CSS 3D (perspective + preserve-3d) driven by Framer Motion:
// the core coin spins on its Y axis with a gentle X wobble, two orbit rings
// rotate in opposite planes, and the whole badge floats. Works anywhere.

import React from "react";
import { motion } from "framer-motion";
import { Leaf } from "lucide-react";

export default function Logo3D({
  size = 40,
  className = "",
  glow = true,
}: {
  size?: number;
  className?: string;
  glow?: boolean;
}) {
  const icon = Math.round(size * 0.5);

  return (
    <div
      className={`relative shrink-0 ${className}`}
      style={{ width: size, height: size, perspective: 500 }}
      aria-hidden
    >
      {/* soft glow under the badge */}
      {glow && (
        <div
          className="absolute rounded-full blur-md"
          style={{
            inset: "-30%",
            background:
              "radial-gradient(circle, color-mix(in srgb, var(--primary) 55%, transparent) 0%, transparent 70%)",
          }}
        />
      )}

      {/* floating wrapper */}
      <motion.div
        className="absolute inset-0"
        style={{ transformStyle: "preserve-3d" }}
        animate={{ y: [0, -3.5, 0] }}
        transition={{ duration: 4.5, repeat: Infinity, ease: "easeInOut" }}
      >
        {/* spinning 3D coin */}
        <motion.div
          className="absolute inset-0 rounded-full flex items-center justify-center"
          style={{
            transformStyle: "preserve-3d",
            background: "linear-gradient(140deg, var(--primary) 0%, var(--primary-strong) 55%, #009e4f 100%)",
            boxShadow:
              "0 0 22px color-mix(in srgb, var(--primary) 45%, transparent), inset 0 -3px 8px rgba(0,0,0,0.30), inset 0 3px 8px rgba(255,255,255,0.35)",
          }}
          animate={{ rotateY: [0, 360], rotateX: [0, 10, 0, -10, 0] }}
          transition={{
            rotateY: { duration: 8, repeat: Infinity, ease: "linear" },
            rotateX: { duration: 5.5, repeat: Infinity, ease: "easeInOut" },
          }}
        >
          {/* front face */}
          <motion.div style={{ transform: `translateZ(${size * 0.09}px)`, transformStyle: "preserve-3d" }}>
            <Leaf
              style={{ width: icon, height: icon, color: "#03230f" }}
              strokeWidth={2.6}
              className="drop-shadow-[0_1px_1px_rgba(255,255,255,0.35)]"
            />
          </motion.div>
          {/* back face (pre-mirrored so it reads correctly when spun around) */}
          <motion.div
            style={{
              transform: `rotateY(180deg) translateZ(${size * 0.09}px)`,
              transformStyle: "preserve-3d",
            }}
          >
            <Leaf
              style={{ width: icon, height: icon, color: "#03230f", transform: "scaleX(-1)" }}
              strokeWidth={2.6}
              className="drop-shadow-[0_1px_1px_rgba(255,255,255,0.35)]"
            />
          </motion.div>
        </motion.div>

        {/* orbit ring 1 (equator) */}
        <motion.div
          className="absolute rounded-full border"
          style={{
            inset: "-16%",
            borderColor: "color-mix(in srgb, var(--primary) 55%, transparent)",
            borderStyle: "solid",
            transform: "rotateX(74deg)",
            transformStyle: "preserve-3d",
          }}
          animate={{ rotateZ: 360 }}
          transition={{ duration: 6.5, repeat: Infinity, ease: "linear" }}
        />

        {/* orbit ring 2 (pole) */}
        <motion.div
          className="absolute rounded-full border border-dashed"
          style={{
            inset: "-24%",
            borderColor: "color-mix(in srgb, var(--accent) 50%, transparent)",
            transform: "rotateY(64deg) rotateZ(24deg)",
            transformStyle: "preserve-3d",
          }}
          animate={{ rotateX: -360 }}
          transition={{ duration: 11, repeat: Infinity, ease: "linear" }}
        />
      </motion.div>
    </div>
  );
}
