"use client";

import React from "react";
import { motion } from "framer-motion";
import { GraduationCap, Code2, Calculator, BrainCircuit } from "lucide-react";
import Section from "./Section";
import { useSite } from "@/lib/site-context";

const TEAM = [
  {
    icon: Code2,
    name: "Nana Ware Henry Opoku",
    role: "Chief Programmer & Full Stack Developer",
  },
  {
    icon: BrainCircuit,
    name: "Thaddeus Nii Teiko Tagoe",
    role: "Overseer & Programmer",
  },
  {
    icon: Calculator,
    name: "Comfort Poedza",
    role: "Finance & Operations",
  },
  {
    icon: GraduationCap,
    name: "Edmond Nana Yaw Boateng",
    role: "Algorithms & AI",
  },
];

export default function Team() {
  const { settings } = useSite();
  return (
    <Section
      id="team"
      title="The AgriAI Team"
      subtitle="Four students of the University of Ghana building the future of African agriculture."
      show={settings.showSections.team}
    >
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        {TEAM.map((m, i) => (
          <motion.div
            key={m.name}
            initial={{ opacity: 0, y: 22 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            transition={{ duration: 0.45, delay: i * 0.08 }}
            className="card rounded-3xl p-6 text-center hover:-translate-y-1 hover:shadow-[var(--shadow-lift)] transition-all duration-300"
          >
            <span
              className="inline-flex w-14 h-14 rounded-2xl items-center justify-center text-white shadow-md mb-4"
              style={{ background: "linear-gradient(135deg, var(--primary), var(--deep))" }}
            >
              <m.icon className="w-6 h-6" />
            </span>
            <div className="font-bold text-[0.95rem] text-[var(--deep)] leading-snug">{m.name}</div>
            <div className="mt-1 text-[0.78rem] text-[var(--muted)] leading-relaxed">{m.role}</div>
          </motion.div>
        ))}
      </div>
    </Section>
  );
}
