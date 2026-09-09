"use client";

import { motion } from "framer-motion";
import type { LucideIcon } from "lucide-react";

interface StatCardProps {
  label: string;
  value: string | number;
  sub?: string;
  icon: LucideIcon;
  accent?: "accent" | "success" | "danger" | "warn";
  index?: number;
}

const ACCENT_MAP: Record<string, string> = {
  accent: "bg-[var(--accent-soft)] text-[var(--accent)]",
  success: "bg-[var(--success)]/15 text-[var(--success)]",
  danger: "bg-[var(--danger)]/15 text-[var(--danger)]",
  warn: "bg-amber-500/15 text-amber-500",
};

export function StatCard({
  label,
  value,
  sub,
  icon: Icon,
  accent = "accent",
  index = 0,
}: StatCardProps) {
  return (
    <motion.div
      initial={{ opacity: 0, y: 12 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.3, delay: index * 0.06 }}
      className="rounded-2xl border border-[var(--border)] bg-[var(--surface)] p-4 shadow-sm"
    >
      <div className="flex items-center justify-between">
        <div
          className={`flex h-9 w-9 items-center justify-center rounded-xl ${ACCENT_MAP[accent]}`}
        >
          <Icon size={18} />
        </div>
      </div>
      <p className="mt-3 text-2xl font-bold text-[var(--text)]">{value}</p>
      <p className="text-sm font-medium text-[var(--text-muted)]">{label}</p>
      {sub ? <p className="mt-0.5 text-xs text-[var(--text-muted)]">{sub}</p> : null}
    </motion.div>
  );
}
