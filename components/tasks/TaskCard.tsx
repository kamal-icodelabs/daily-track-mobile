"use client";

import { CheckCircle2, Clock, Trash2 } from "lucide-react";
import type { Task, TaskStatus } from "@/lib/data/types";

export interface TaskAction {
  key: string;
  label: string;
  tone?: "primary" | "success" | "danger" | "subtle";
}

interface TaskCardProps {
  task: Task;
  assigneeName?: string;
  hours: number;
  actions?: TaskAction[];
  onAction?: (task: Task, actionKey: string) => void;
  onDelete?: (task: Task) => void;
  onLogHours?: (task: Task) => void;
}

export const STATUS_META: Record<
  TaskStatus,
  { label: string; dot: string; badge: string }
> = {
  todo: { label: "To do", dot: "bg-[var(--text-muted)]", badge: "bg-[var(--surface-2)] text-[var(--text-muted)]" },
  in_progress: { label: "In progress", dot: "bg-[var(--accent)]", badge: "bg-[var(--accent-soft)] text-[var(--accent)]" },
  ready_for_testing: { label: "Ready for testing", dot: "bg-violet-500", badge: "bg-violet-500/15 text-violet-500" },
  in_testing: { label: "Testing", dot: "bg-amber-500", badge: "bg-amber-500/15 text-amber-500" },
  done: { label: "Done", dot: "bg-[var(--success)]", badge: "bg-[var(--success)]/15 text-[var(--success)]" },
  failed: { label: "Failed", dot: "bg-[var(--danger)]", badge: "bg-[var(--danger)]/15 text-[var(--danger)]" },
};

export function TaskCard({
  task,
  assigneeName,
  hours,
  actions,
  onAction,
  onDelete,
  onLogHours,
}: TaskCardProps) {
  const meta = STATUS_META[task.status];

  return (
    <div className="animate-task-enter rounded-2xl border border-[var(--border)] bg-[var(--surface)] p-3 shadow-sm">
      <div className="flex items-start gap-3">
        <div className={`mt-1.5 h-2.5 w-2.5 shrink-0 rounded-full ${meta.dot}`} />
        <div className="min-w-0 flex-1">
          <div className="flex items-center gap-2">
            <span className="shrink-0 rounded-md bg-[var(--surface-2)] px-1.5 py-0.5 font-mono text-[11px] font-bold text-[var(--text-muted)]">
              {task.ticketId}
            </span>
            <p
              className={`truncate text-[15px] font-medium text-[var(--text)] ${
                task.status === "done" ? "line-through opacity-70" : ""
              }`}
            >
              {task.title}
            </p>
          </div>
          <div className="mt-1 flex flex-wrap items-center gap-1.5">
            <span
              className={`inline-flex items-center rounded-full px-2 py-0.5 text-[11px] font-medium ${meta.badge}`}
            >
              {meta.label}
            </span>
            <span
              className={`inline-flex items-center rounded-full px-2 py-0.5 text-[11px] font-medium ${
                task.source === "Manual"
                  ? "bg-[var(--accent-soft)] text-[var(--accent)]"
                  : "bg-pink-500/10 text-pink-500"
              }`}
            >
              {task.source}
            </span>
            {assigneeName ? (
              <span className="inline-flex items-center rounded-full bg-[var(--surface-2)] px-2 py-0.5 text-[11px] font-medium text-[var(--text-muted)]">
                {assigneeName}
              </span>
            ) : null}
            <span className="inline-flex items-center gap-0.5 rounded-full bg-[var(--surface-2)] px-2 py-0.5 text-[11px] font-medium text-[var(--text-muted)]">
              <Clock size={11} />
              {hours}h
            </span>
          </div>
          {task.moveRequest ? (
            <span className="mt-1.5 inline-flex items-center gap-1 rounded-lg bg-amber-500/15 px-2 py-1 text-[11px] font-medium text-amber-500">
              Move-back requested
            </span>
          ) : null}
        </div>

        {onDelete ? (
          <button
            onClick={() => onDelete(task)}
            aria-label="Delete task"
            className="flex h-9 w-9 shrink-0 items-center justify-center rounded-xl text-[var(--text-muted)] transition-colors hover:text-[var(--danger)] active:bg-[var(--surface-2)]"
          >
            <Trash2 size={18} />
          </button>
        ) : null}
      </div>

      <div className="mt-2.5 flex flex-wrap items-center gap-1.5">
        {onLogHours ? (
          <button
            onClick={() => onLogHours(task)}
            className="inline-flex items-center gap-1 rounded-lg bg-[var(--accent-soft)] px-2.5 py-1.5 text-xs font-semibold text-[var(--accent)] transition-transform active:scale-95"
          >
            <Clock size={13} />
            Log hours
          </button>
        ) : null}
        {actions?.map((a) => {
          const toneBase =
            a.tone === "danger"
              ? "bg-[var(--danger)] text-white"
              : a.tone === "success"
              ? "bg-[var(--success)] text-white"
              : a.tone === "subtle"
              ? "bg-[var(--surface-2)] text-[var(--text-muted)]"
              : "bg-[var(--accent)] text-white";
          return (
            <button
              key={a.key}
              onClick={() => onAction?.(task, a.key)}
              className={`inline-flex items-center gap-1 rounded-lg px-2.5 py-1.5 text-xs font-semibold transition-transform active:scale-95 ${toneBase}`}
            >
              {a.key === "reopenTask" || a.key === "approveMoveBack" ? (
                <CheckCircle2 size={13} />
              ) : null}
              {a.label}
            </button>
          );
        })}
      </div>
    </div>
  );
}