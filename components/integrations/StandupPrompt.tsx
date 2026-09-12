"use client";

import Link from "next/link";
import { CalendarClock, X } from "lucide-react";
import { useSimulatedIntegrations } from "@/lib/integrations/IntegrationProvider";

/**
 * 11 AM non-blocking standup prompt (spec: "Align today's tasks").
 * Shown on the Calendar + Today pages until dismissed.
 */
export function StandupPrompt({ show = true }: { show?: boolean }) {
  const { showStandupPrompt, dismissStandup } = useSimulatedIntegrations();
  if (!show || !showStandupPrompt) return null;

  return (
    <div className="flex items-start gap-3 rounded-2xl border border-[var(--accent)]/30 bg-[var(--accent-soft)] p-3.5">
      <span className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-[var(--accent)] text-[var(--bg)]">
        <CalendarClock size={19} />
      </span>
      <div className="min-w-0 flex-1">
        <p className="text-sm font-bold text-[var(--text)]">
          Standup · align today
        </p>
        <p className="mt-0.5 text-xs leading-relaxed text-[var(--text-muted)]">
          It's 11 AM — review your assigned tickets and set today's plan.
        </p>
        <Link
          href="/today"
          className="mt-2 inline-flex items-center gap-1.5 rounded-xl bg-[var(--accent)] px-3 py-1.5 text-xs font-semibold text-[var(--bg)] transition-transform active:scale-[0.97]"
        >
          Open today
        </Link>
      </div>
      <button
        onClick={dismissStandup}
        aria-label="Dismiss standup prompt"
        className="rounded-lg p-1 text-[var(--text-muted)] transition-colors hover:text-[var(--text)]"
      >
        <X size={16} />
      </button>
    </div>
  );
}