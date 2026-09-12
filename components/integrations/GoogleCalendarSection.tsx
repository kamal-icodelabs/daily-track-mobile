"use client";

import { useState } from "react";
import { CalendarDays, CheckCircle2, Link2, Loader2 } from "lucide-react";
import { useSimulatedIntegrations } from "@/lib/integrations/IntegrationProvider";

/**
 * Connect / disconnect the (simulated) Google Calendar account. Shown on
 * the Profile page; feeds the Calendar page with events once connected.
 */
export function GoogleCalendarSection() {
  const { connection, connectCalendar, disconnectCalendar } =
    useSimulatedIntegrations();
  const [busy, setBusy] = useState(false);

  const handleConnect = async () => {
    setBusy(true);
    await connectCalendar();
    setBusy(false);
  };

  const handleDisconnect = async () => {
    setBusy(true);
    await disconnectCalendar();
    setBusy(false);
  };

  if (connection?.connected) {
    const expiry = connection.tokenExpiry
      ? new Date(connection.tokenExpiry).toLocaleTimeString([], {
          hour: "2-digit",
          minute: "2-digit",
        })
      : "—";
    return (
      <div className="rounded-2xl border border-[var(--border)] bg-[var(--surface)] p-4 shadow-sm">
        <div className="flex items-center gap-3">
          <span className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-[var(--success)]/15 text-[var(--success)]">
            <CalendarDays size={18} />
          </span>
          <div className="min-w-0 flex-1">
            <p className="flex items-center gap-1.5 text-sm font-semibold text-[var(--text)]">
              <CheckCircle2 size={14} className="text-[var(--success)]" />
              Connected
            </p>
            <p className="truncate text-xs text-[var(--text-muted)]">
              {connection.email}
            </p>
          </div>
          <button
            onClick={handleDisconnect}
            disabled={busy}
            className="rounded-xl border border-[var(--danger)]/30 px-3 py-2 text-xs font-semibold text-[var(--danger)] transition-colors active:bg-[var(--danger)]/10 disabled:opacity-50"
          >
            {busy ? <Loader2 size={14} className="animate-spin" /> : "Disconnect"}
          </button>
        </div>
        <p className="mt-3 text-xs text-[var(--text-muted)]">
          Access token refreshes automatically. Expiry {expiry} · events sync
          to the Calendar page.
        </p>
      </div>
    );
  }

  return (
    <div className="rounded-2xl border border-[var(--border)] bg-[var(--surface)] p-4 shadow-sm">
      <div className="flex items-center gap-3">
        <span className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-[var(--accent-soft)] text-[var(--accent)]">
          <Link2 size={18} />
        </span>
        <div className="min-w-0 flex-1">
          <p className="text-sm font-semibold text-[var(--text)]">
            Google Calendar
          </p>
          <p className="text-xs text-[var(--text-muted)]">
            Meetings, standups & reminders in one view.
          </p>
        </div>
      </div>
      <button
        onClick={handleConnect}
        disabled={busy}
        className="mt-3 flex w-full items-center justify-center gap-2 rounded-xl bg-[var(--accent)] py-2.5 text-sm font-semibold text-[var(--bg)] transition-transform active:scale-[0.98] disabled:opacity-60"
      >
        {busy ? (
          <Loader2 size={15} className="animate-spin" />
        ) : (
          <Link2 size={15} />
        )}
        {busy ? "Connecting…" : "Connect Google Calendar"}
      </button>
      <p className="mt-2 text-[11px] text-[var(--text-muted)]">
        Simulated OAuth — no real Google credentials needed.
      </p>
    </div>
  );
}