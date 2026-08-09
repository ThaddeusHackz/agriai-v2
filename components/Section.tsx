"use client";

import React from "react";
import { motion } from "framer-motion";

interface SectionProps {
  id?: string;
  title?: string;
  subtitle?: string;
  children: React.ReactNode;
  className?: string;
  show?: boolean;
}

export default function Section({ id, title, subtitle, children, className = "", show = true }: SectionProps) {
  if (!show) return null;
  return (
    <section id={id} className={`py-16 md:py-20 scroll-mt-24 ${className}`}>
      <div className="max-w-6xl mx-auto px-5 md:px-8">
        {(title || subtitle) && (
          <motion.div
            initial={{ opacity: 0, y: 18 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true, margin: "-60px" }}
            transition={{ duration: 0.5 }}
            className="text-center mb-10 md:mb-14"
          >
            {title && (
              <h2 className="text-3xl md:text-[2.6rem] font-bold tracking-tight text-[var(--deep)]">
                {title}
              </h2>
            )}
            {subtitle && (
              <p className="mt-3 text-[1.02rem] text-[var(--muted)] max-w-2xl mx-auto leading-relaxed">
                {subtitle}
              </p>
            )}
          </motion.div>
        )}
        {children}
      </div>
    </section>
  );
}
