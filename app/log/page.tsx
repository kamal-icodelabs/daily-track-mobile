"use client";

import { useMemo, useState } from "react";
import {
  CalendarCheck,
  CheckCircle2,
  ChevronDown,
  Clock,
  FlaskConical,
  GitCommitHorizontal,
  History,
  MessageSquareText,
  RotateCcw,
  Send,
  Trash2,
  XCircle,
} from "lucide-react";
import { Header } from "@/components/layout/Header";
import { useAuth } from "@/lib/auth";
import { useData } from "@/lib/data/store";
import { useCan } from "@/lib/permissions";
import type { TaskActivityType } from "@/lib/data/types";

const TYPE_META: Record<
  TaskActivityType,
  { icon: typeof Clock; label: string; dot: string; labelClass: string }
> = {
  created: { icon: GitCommitHorizontal, label: "Created", dot: "bg-[var(--accent)]", labelClass: "text-[var(--accent)]" },
  started: { icon: Clock, label: "Started", dot: "bg-[var(--accent)]", labelClass: "text-[var(--accent)]" },
  submitted: { icon: Send, label: "Submitted for testing", dot: "bg-violet-500", labelClass: "text-violet-500" },
  in_testing: { icon: FlaskConical, label: "In testing", dot: "bg-amber-500", labelClass: "text-amber-500" },
  completed: { icon: CheckCircle2, label: "Approved", dot: "bg-[var(--success)]", labelClass: "text-[var(--success)]" },
  failed: { icon: XCircle, label: "Failed", dot: "bg-[var(--danger)]", labelClass: "text-[var(--danger)]" },
  move_requested: { icon: MessageSquareText, label: "Move-back requested", dot: "bg-amber-500", labelClass: "text-amber-500" },
  move_approved: { icon: RotateCcw, label: "Move-back approved", dot: "bg-[var(--success)]", labelClass: "text-[var(--success)]" },
  reopened: { icon: RotateCcw, label: "Reopened", dot: "bg-amber-500", labelClass: "text-amber-500" },
  hours: { icon: Clock, label: "Hours logged", dot: "bg-[var(--accent)]", labelClass: "text-[var(--accent)]" },
  deleted: { icon: Trash2, label: "Deleted", dot: "bg-[var(--danger)]", labelClass: "text-[var(--danger)]" },
};

export default function LogPage() {
  const { user, users } = useAuth();
  const can = useCan();
  const { workLogs, tasks, activity } = useData();
  const [collapsed, setCollapsed] = useState<Record<string, boolean>>({});

  const me = user!;
  const usersById = useMemo(
    () => new Map(users.map((u) => [u.id, u])),
    [users]
  );
  const tasksById = useMemo(() => new Map(tasks.map((t) => [t.id, t])), [tasks]);

  // Employees see only their own logs; managers/admins see everyone's.
  const scopedLogs = useMemo(
    () =>
      can.canSeeOtherHours
        ? workLogs
        : workLogs.filter((l) => l.userId === me.id),
    [workLogs, can.canSeeOtherHours, me.id]
  );

  // Group by date, newest first. Dates only with logs.
  const days = useMemo(() => {
    const map = new Map<string, typeof scopedLogs>();
    for (const log of scopedLogs) {
      const arr = map.get(log.date) ?? [];
      arr.push(log);
      map.set(log.date, arr);
    }
    return Array.from(map.entries())
      .sort((a, b) => b[0].localeCompare(a[0]))
      .map(([date, logs]) => ({ date, logs }));
  }, [scopedLogs]);

  const scopedActivity = useMemo(
    () =>
      can.canSeeOtherHours
        ? activity
        : activity.filter((a) => a.userId === me.id),
    [activity, can.canSeeOtherHours, me.id]
  );

  const toggle = (date: string) =>
    setCollapsed((prev) => ({ ...prev, [date]: !prev[date] }));

  return (
    <div className="flex h-full flex-col">
      <Header title="Log" subtitle="Past tasks & hours" actionIcon={CalendarCheck} />

      <div className="flex-1 space-y-3 overflow-y-auto px-4 py-4 pb-28">
        {days.length === 0 ? (
          <div className="flex flex-col items-center justify-center px-6 pt-16 text-center">
            <div className="mb-4 flex h-20 w-20 items-center justify-center rounded-3xl bg-[var(--accent-soft)]">
              <Clock size={40} className="text-[var(--accent)]" />
            </div>
            <h3 className="text-lg font-bold text-[var(--text)]">
              No hours logged yet
            </h3>
            <p className="mt-1 max-w-[260px] text-sm text-[var(--text-muted)]">
              Log hours on your tasks from the Today tab and they&apos;ll show up
              here.
            </p>
          </div>
        ) : (
          days.map((day) => {
            const total = day.logs.reduce((s, l) => s + l.hours, 0);
            const isCollapsed = collapsed[day.date];
            return (
              <div
                key={day.date}
                className="overflow-hidden rounded-2xl border border-[var(--border)] bg-[var(--surface)] shadow-sm"
              >
                <button
                  onClick={() => toggle(day.date)}
                  className="flex w-full items-center gap-3 px-4 py-3.5 text-left"
                >
                  <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-xl bg-[var(--accent-soft)]">
                    <CalendarCheck size={16} className="text-[var(--accent)]" />
                  </div>
                  <div className="min-w-0 flex-1">
                    <p className="text-sm font-bold text-[var(--text)]">
                      {dayLabel(day.date)}
                    </p>
                    <p className="text-xs text-[var(--text-muted)]">
                      {day.logs.length} log{day.logs.length === 1 ? "" : "s"} ·{" "}
                      {total}h
                    </p>
                  </div>
                  <ChevronDown
                    size={18}
                    className={`text-[var(--text-muted)] transition-transform duration-200 ${
                      isCollapsed ? "" : "rotate-180"
                    }`}
                  />
                </button>
                {isCollapsed ? null : (
                  <div className="space-y-1 border-t border-[var(--border)] px-2 py-2">
                    {day.logs.map((log) => {
                      const userName = usersById.get(log.userId)?.name;
                      return (
                        <div
                          key={log.id}
                          className="flex items-center gap-3 rounded-xl px-2 py-2"
                        >
                          <span className="h-2 w-2 shrink-0 rounded-full bg-[var(--accent)]" />
                          <div className="min-w-0 flex-1">
                            <p className="truncate text-[15px] text-[var(--text)]">
                              {tasksById.get(log.taskId)?.title ?? "Deleted task"}
                            </p>
                            {log.note ? (
                              <p className="truncate text-xs text-[var(--text-muted)]">
                                {log.note}
                              </p>
                            ) : null}
                          </div>
                          {can.canSeeOtherHours ? (
                            <span className="shrink-0 text-[11px] text-[var(--text-muted)]">
                              {userName}
                            </span>
                          ) : null}
                          <span className="flex shrink-0 items-center gap-1 rounded-lg bg-[var(--accent-soft)] px-2 py-0.5 text-xs font-semibold text-[var(--accent)]">
                            <Clock size={12} />
                            {log.hours}h
                          </span>
                        </div>
                      );
                    })}
                  </div>
                )}
              </div>
            );
          })
        )}

        {/* Ticket status & activity — audit trail shown to the PM */}
        <section className="border-t border-[var(--border)] pt-5">
          <div className="mb-3 flex items-center gap-2 px-1">
            <History size={17} className="text-[var(--accent)]" />
            <h2 className="text-sm font-semibold text-[var(--text-muted)]">
              Ticket status &amp; activity
            </h2>
            {can.canSeeOtherHours ? (
              <span className="ml-auto rounded-full bg-[var(--surface-2)] px-2 py-0.5 text-[11px] text-[var(--text-muted)]">
                All users
              </span>
            ) : null}
          </div>

          {scopedActivity.length === 0 ? (
            <p className="px-1 text-sm text-[var(--text-muted)]">
              No ticket activity yet.
            </p>
          ) : (
            <div className="space-y-2">
              {scopedActivity.map((a) => {
                const actorName = usersById.get(a.userId)?.name;
                const meta = TYPE_META[a.type];
                const AIcon = meta.icon;
                return (
                  <div
                    key={a.id}
                    className="rounded-2xl border border-[var(--border)] bg-[var(--surface)] p-3 shadow-sm"
                  >
                    <div className="flex items-start gap-3">
                      <div className="mt-0.5 flex h-8 w-8 shrink-0 items-center justify-center rounded-lg bg-[var(--surface-2)]">
                        <AIcon size={15} className={meta.labelClass} />
                      </div>
                      <div className="min-w-0 flex-1">
                        <p className="truncate text-[15px] font-semibold text-[var(--text)]">
                          {a.taskTitle}
                        </p>
                        <p className="mt-0.5 flex items-center gap-1.5 text-xs text-[var(--text-muted)]">
                          <span className="font-semibold capitalize text-[var(--text)]">
                            {meta.label.toLowerCase()}
                          </span>
                          {a.hours ? (
                            <span className="font-semibold text-[var(--accent)]">
                              {a.hours}h
                            </span>
                          ) : null}
                          {can.canSeeOtherHours ? (
                            <span>by {actorName}</span>
                          ) : null}
                          <span className="ml-auto shrink-0">
                            {formatTime(a.createdAt)}
                          </span>
                        </p>
                        {a.note ? (
                          <p className="mt-1.5 rounded-lg bg-[var(--surface-2)] px-2.5 py-1.5 text-xs text-[var(--text-muted)]">
                            {a.note}
                          </p>
                        ) : null}
                      </div>
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </section>
      </div>
    </div>
  );
}

function formatTime(iso: string): string {
  const d = new Date(iso);
  const today = new Date();
  const sameDay =
    d.getDate() === today.getDate() &&
    d.getMonth() === today.getMonth() &&
    d.getFullYear() === today.getFullYear();
  const time = d.toLocaleTimeString("en-US", {
    hour: "numeric",
    minute: "2-digit",
  });
  if (sameDay) return time;
  return `${d.toLocaleDateString("en-US", { month: "short", day: "numeric" })} · ${time}`;
}

function dayLabel(iso: string): string {
  const d = new Date(iso + "T00:00:00");
  const today = new Date();
  today.setHours(0, 0, 0, 0);
  const diff = Math.round((today.getTime() - d.getTime()) / 86400000);
  if (diff === 0) return "Today";
  if (diff === 1) return "Yesterday";
  return d.toLocaleDateString("en-US", {
    weekday: "short",
    month: "short",
    day: "numeric",
  });
}
