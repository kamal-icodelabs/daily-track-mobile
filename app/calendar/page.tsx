"use client";

import { useEffect, useMemo, useState } from "react";
import { BellRing, CalendarDays, Loader2, Link2, Zap } from "lucide-react";
import { Header } from "@/components/layout/Header";
import { EventCard } from "@/components/calendar/EventCard";
import { StandupPrompt } from "@/components/integrations/StandupPrompt";
import { useSimulatedIntegrations } from "@/lib/integrations/IntegrationProvider";
import type { CalendarEventItem } from "@/lib/integrations/types";
import { useAuth } from "@/lib/auth";
import { useData } from "@/lib/data/store";
import { useCan } from "@/lib/permissions";

type Range = "today" | "week";

const REMIND_OPTIONS = [5, 10, 15, 30, 60];

export default function CalendarPage() {
  const [range, setRange] = useState<Range>("today");
  const { user } = useAuth();
  const can = useCan();
  const { tasks } = useData();
  const {
    connection,
    connectCalendar,
    fetchEvents,
    reminderMinutes,
    setReminderMinutes,
  } = useSimulatedIntegrations();

  const [events, setEvents] = useState<CalendarEventItem[]>([]);
  const [loading, setLoading] = useState(false);
  const [busy, setBusy] = useState(false);

  const me = user!;
  const connected = connection?.connected === true;

  useEffect(() => {
    if (!connected) {
      setEvents([]);
      return;
    }
    let alive = true;
    setLoading(true);
    fetchEvents(range).then((result) => {
      if (alive) {
        setEvents(result);
        setLoading(false);
      }
    });
    return () => {
      alive = false;
    };
  }, [range, connected, fetchEvents]);

  // Meetings/events come from the (simulated) Google feed; tasks with due
  // dates are appended so the calendar reflects the real work scope.
  const cards = useMemo(() => {
    const calendarCards = events.map(toCard);

    const scoped = can.canViewAllData
      ? tasks
      : tasks.filter((t) => t.assigneeId === me.id || t.createdById === me.id);

    const taskCards = scoped
      .filter((t) => t.dueDate)
      .map((t) => ({
        id: `task-${t.id}`,
        time: "Due",
        endTime: shortDate(t.dueDate!),
        title: t.title,
        location: t.status === "done" ? "Completed" : `Task · ${t.status}`,
        reminder: t.status !== "done",
      }));

    const seen = new Set<string>();
    return [...calendarCards, ...taskCards].filter((e) => {
      const key = e.title.toLowerCase();
      if (seen.has(key)) return false;
      seen.add(key);
      return true;
    });
  }, [events, tasks, can.canViewAllData, me.id]);

  const handleConnect = async () => {
    setBusy(true);
    await connectCalendar();
    setBusy(false);
  };

  return (
    <div className="flex h-full flex-col">
      <Header
        title="Calendar"
        subtitle={connected ? connection?.email : "Schedule & deadlines"}
        actionIcon={CalendarDays}
      />

      <div className="flex-1 overflow-y-auto px-4 py-4 pb-28">
        {!connected ? (
          <div className="flex flex-col items-center pt-6 text-center">
            <span className="flex h-16 w-16 items-center justify-center rounded-3xl bg-[var(--accent-soft)] text-[var(--accent)]">
              <CalendarDays size={28} />
            </span>
            <h2 className="mt-4 text-lg font-bold text-[var(--text)]">
              Connect Google Calendar
            </h2>
            <p className="mt-1 max-w-[280px] text-sm leading-relaxed text-[var(--text-muted)]">
              Your meetings, standups and deadlines — with reminders before
              each event — right inside Dayly.
            </p>
            <ul className="mt-5 w-full max-w-[300px] space-y-2.5 text-left">
              {[
                "Join meetings straight from an event",
                "Push-style reminders before they start",
                "11 AM standup prompt links to Today",
              ].map((benefit) => (
                <li
                  key={benefit}
                  className="flex items-center gap-2.5 rounded-xl border border-[var(--border)] bg-[var(--surface)] px-3 py-2.5 text-sm text-[var(--text)]"
                >
                  <Zap size={14} className="shrink-0 text-[var(--accent)]" />
                  {benefit}
                </li>
              ))}
            </ul>
            <button
              onClick={handleConnect}
              disabled={busy}
              className="mt-6 flex w-full max-w-[300px] items-center justify-center gap-2 rounded-2xl bg-[var(--accent)] py-3 text-sm font-semibold text-white transition-transform active:scale-[0.98] disabled:opacity-60"
            >
              {busy ? (
                <Loader2 size={16} className="animate-spin" />
              ) : (
                <Link2 size={16} />
              )}
              {busy ? "Connecting…" : "Connect Google Calendar"}
            </button>
            <p className="mt-2 text-[11px] text-[var(--text-muted)]">
              Simulated OAuth — instant, no real credentials.
            </p>
          </div>
        ) : (
          <>
            <StandupPrompt />

            <div className="mt-4 flex flex-wrap items-center gap-2">
              <div className="inline-flex rounded-xl bg-[var(--surface)] p-1">
                {(["today", "week"] as Range[]).map((r) => (
                  <button
                    key={r}
                    onClick={() => setRange(r)}
                    className={`rounded-lg px-4 py-1.5 text-sm font-medium capitalize transition-colors ${
                      range === r
                        ? "bg-[var(--surface-2)] text-[var(--accent)] shadow-sm"
                        : "text-[var(--text-muted)]"
                    }`}
                  >
                    {r === "today" ? "Today" : "This Week"}
                  </button>
                ))}
              </div>

              <label className="ml-auto flex items-center gap-1.5 text-xs text-[var(--text-muted)]">
                <BellRing size={13} className="text-[var(--accent)]" />
                <select
                  value={reminderMinutes}
                  onChange={(e) => setReminderMinutes(Number(e.target.value))}
                  className="rounded-lg border border-[var(--border)] bg-[var(--surface)] px-2 py-1.5 text-xs font-medium text-[var(--text)] outline-none"
                >
                  {REMIND_OPTIONS.map((m) => (
                    <option key={m} value={m}>
                      {m >= 60 ? "1 hr before" : `${m} min before`}
                    </option>
                  ))}
                </select>
              </label>
            </div>

            <h2 className="mb-2 mt-4 px-1 text-sm font-semibold text-[var(--text-muted)]">
              {range === "today" ? "Today's events & deadlines" : "This week"}
            </h2>
            <div className="space-y-2.5">
              {loading ? (
                <div className="flex items-center justify-center gap-2 py-10 text-sm text-[var(--text-muted)]">
                  <Loader2 size={16} className="animate-spin" />
                  Syncing calendar…
                </div>
              ) : (
                cards.map((event) => <EventCard key={event.id} event={event} />)
              )}
              {!loading && cards.length === 0 ? (
                <p className="rounded-2xl border border-dashed border-[var(--border)] px-4 py-8 text-center text-sm text-[var(--text-muted)]">
                  No events today. Enjoy the quiet.
                </p>
              ) : null}
            </div>
          </>
        )}
      </div>
    </div>
  );
}

function toCard(e: CalendarEventItem) {
  return {
    id: e.id,
    time: hhmm(e.start),
    endTime: hhmm(e.end),
    title: e.summary,
    location: e.location,
    meetingLink: e.hangoutLink ?? undefined,
    reminder: e.isMeeting,
  };
}

function hhmm(iso: string): string {
  return iso.split("T")[1]?.slice(0, 5) ?? iso;
}

function shortDate(iso: string): string {
  const d = new Date(iso + "T00:00:00");
  return d.toLocaleDateString("en-US", { month: "short", day: "numeric" });
}