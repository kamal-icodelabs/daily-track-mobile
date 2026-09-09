"use client";

import Link from "next/link";
import { motion } from "framer-motion";
import { CalendarDays, ChevronRight, Clock } from "lucide-react";
import { CALENDAR_EVENTS } from "@/lib/mockData";

export function CalendarPreview({ index = 0 }: { index?: number }) {
  const upcoming = CALENDAR_EVENTS.slice(0, 3);

  return (
    <motion.div
      initial={{ opacity: 0, y: 12 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.3, delay: index * 0.06 }}
      className="rounded-2xl border border-[var(--border)] bg-[var(--surface)] p-4 shadow-sm"
    >
      <div className="mb-3 flex items-center justify-between">
        <div className="flex items-center gap-2">
          <CalendarDays size={17} className="text-[var(--accent)]" />
          <h3 className="text-sm font-bold text-[var(--text)]">Today&apos;s schedule</h3>
        </div>
        <Link
          href="/calendar"
          className="flex items-center gap-0.5 text-xs font-medium text-[var(--accent)]"
        >
          View calendar <ChevronRight size={14} />
        </Link>
      </div>

      <div className="space-y-2">
        {upcoming.map((event) => (
          <div
            key={event.id}
            className="flex items-center gap-3 rounded-xl bg-[var(--surface-2)] px-3 py-2.5"
          >
            <div className="flex w-10 shrink-0 flex-col items-center rounded-lg bg-[var(--accent-soft)] py-1">
              <span className="text-xs font-bold text-[var(--accent)]">
                {event.time}
              </span>
            </div>
            <div className="min-w-0 flex-1">
              <p className="truncate text-sm font-semibold text-[var(--text)]">
                {event.title}
              </p>
              <p className="flex items-center gap-1 text-xs text-[var(--text-muted)]">
                <Clock size={11} />
                {event.time} – {event.endTime}
              </p>
            </div>
          </div>
        ))}
      </div>
    </motion.div>
  );
}
