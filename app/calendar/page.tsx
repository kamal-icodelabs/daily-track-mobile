"use client";

import { useMemo, useState } from "react";
import { CalendarDays } from "lucide-react";
import { Header } from "@/components/layout/Header";
import { EventCard } from "@/components/calendar/EventCard";
import { CALENDAR_EVENTS, WEEK_EVENTS } from "@/lib/mockData";
import { useAuth } from "@/lib/auth";
import { useData } from "@/lib/data/store";
import { useCan } from "@/lib/permissions";

type Range = "today" | "week";

export default function CalendarPage() {
  const [range, setRange] = useState<Range>("today");
  const { user } = useAuth();
  const can = useCan();
  const { tasks } = useData();

  const me = user!;

  // Meetings/blockers are seeded events; tasks with due dates are appended
  // so the calendar reflects the real work scope for the current role.
  const events = useMemo(() => {
    const base = range === "today" ? CALENDAR_EVENTS : WEEK_EVENTS;

    const scoped = can.canViewAllData
      ? tasks
      : tasks.filter((t) => t.assigneeId === me.id || t.createdById === me.id);

    const taskEvents = scoped
      .filter((t) => t.dueDate)
      .map((t) => ({
        id: `task-${t.id}`,
        time: "Due",
        endTime: shortDate(t.dueDate!),
        title: t.title,
        location: t.status === "done" ? "Completed" : `Task · ${t.status}`,
        reminder: t.status !== "done",
      }));

    // De-duplicate by title so we don't show both the seed and an identical
    // task, and keep a stable, readable order.
    const seen = new Set<string>();
    return [...base, ...taskEvents].filter((e) => {
      const key = e.title.toLowerCase();
      if (seen.has(key)) return false;
      seen.add(key);
      return true;
    });
  }, [range, tasks, can.canViewAllData, me.id]);

  return (
    <div className="flex h-full flex-col">
      <Header title="Calendar" subtitle="Schedule & deadlines" actionIcon={CalendarDays} />

      <div className="flex-1 overflow-y-auto px-4 py-4 pb-28">
        <div className="mb-4 inline-flex rounded-xl bg-[var(--surface)] p-1">
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

        <h2 className="mb-2 px-1 text-sm font-semibold text-[var(--text-muted)]">
          {range === "today" ? "Today's events & deadlines" : "This week"}
        </h2>
        <div className="space-y-2.5">
          {events.map((event) => (
            <EventCard key={event.id} event={event} />
          ))}
        </div>
      </div>
    </div>
  );
}

function shortDate(iso: string): string {
  const d = new Date(iso + "T00:00:00");
  return d.toLocaleDateString("en-US", { month: "short", day: "numeric" });
}
