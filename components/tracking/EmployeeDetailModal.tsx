"use client";

import Link from "next/link";
import {
  ArrowUpRight,
  Bug,
  CalendarX,
  CheckCircle2,
  Clock3,
  Cloud,
  Code,
  Layers,
  ListTodo,
  Mail,
  Palette,
  Server,
  Target,
  UserX,
  Zap,
} from "lucide-react";
import { Sheet } from "react-modal-sheet";
import { STATUS_META } from "@/components/tasks/TaskCard";
import { DailyStatusBadge } from "@/components/tracking/DailyStatusPicker";
import { useData } from "@/lib/data/store";
import type { Project, Task, User, WorkLog } from "@/lib/data/types";

interface EmployeeDetailModalProps {
  employee: User | null;
  tasks: Task[];
  workLogs: WorkLog[];
  projects: Project[];
  onClose: () => void;
}

const STATUS_ORDER: Record<Task["status"], number> = {
  todo: 0,
  in_progress: 1,
  ready_for_testing: 2,
  in_testing: 3,
  failed: 4,
  done: 5,
};

const TEAM_ROLE: Record<string, string> = {
  "team-frontend": "Frontend Developer",
  "team-backend": "Fullstack Developer",
  "team-design": "Designer",
  "team-qa": "QA Engineer",
};

const PROFILE_ICON: Record<string, React.ComponentType<{ size?: number; className?: string }>> = {
  qa: Bug,
  designer: Palette,
  frontend: Code,
  backend: Server,
  fullstack: Layers,
  cloud: Cloud,
};

const PROFILE_COLOR: Record<string, string> = {
  qa: "#db2777",
  designer: "#b45309",
  frontend: "#2563eb",
  backend: "#16a34a",
  fullstack: "#0d9488",
  cloud: "#0284c7",
};

function profileOf(u: User): string {
  if ((u as unknown as { profile?: string }).profile) return (u as unknown as { profile: string }).profile;
  if (u.isTester) return "qa";
  if (u.teamId === "team-design") return "designer";
  if (u.teamId === "team-frontend") return "frontend";
  if (u.teamId === "team-cloud") return "cloud";
  if (u.teamId === "team-backend") return "fullstack";
  return "backend";
}

function leaveOf(u: User): "active" | "on_leave" {
  return ((u as unknown as { leaveStatus?: string }).leaveStatus as "active" | "on_leave") ?? "active";
}

function getRoleLabel(u: User): string {
  if (u.role === "admin") return "Admin";
  if (u.role === "manager") return "Project Manager";
  return TEAM_ROLE[u.teamId ?? ""] ?? "Developer";
}

export function EmployeeDetailModal({
  employee,
  tasks,
  workLogs,
  projects,
  onClose,
}: EmployeeDetailModalProps) {
  return (
    <Sheet isOpen={!!employee} onClose={onClose} detent="content" disableScrollLocking>
      <Sheet.Container>
        <Sheet.Header>
          <Sheet.DragIndicator />
        </Sheet.Header>

        <Sheet.Content>
          {employee ? (
            <Body
              employee={employee}
              tasks={tasks}
              workLogs={workLogs}
              projects={projects}
              onClose={onClose}
            />
          ) : null}
        </Sheet.Content>
      </Sheet.Container>

      <Sheet.Backdrop onTap={onClose} />
    </Sheet>
  );
}

/* ─── Main body rendered inside the sheet ─── */

function Body({
  employee,
  tasks,
  workLogs,
  projects,
  onClose,
}: {
  employee: User;
  tasks: Task[];
  workLogs: WorkLog[];
  projects: Project[];
  onClose: () => void;
}) {
  const empTasks = tasks.filter((t) => t.assigneeId === employee.id);
  const activeTasks = empTasks.filter((t) => t.status !== "done");
  const doneTasks = empTasks.filter((t) => t.status === "done");
  const failedTasks = empTasks.filter((t) => t.status === "failed");

  const totalHours = workLogs
    .filter((l) => l.userId === employee.id)
    .reduce((s, l) => s + l.hours, 0);
  const today = new Date().toISOString().slice(0, 10);
  const todayHours = workLogs
    .filter((l) => l.userId === employee.id && l.date === today)
    .reduce((s, l) => s + l.hours, 0);

  const { getDailyStatus } = useData();
  const dailyStatus = getDailyStatus(employee.id);

  const projectsById = new Map(projects.map((p) => [p.id, p]));
  const sortedTasks = [...empTasks].sort(
    (a, b) => STATUS_ORDER[a.status] - STATUS_ORDER[b.status]
  );

  const pct = Math.min(100, (totalHours / 8) * 100);
  const barColor =
    totalHours >= 8
      ? "bg-[var(--success)]"
      : totalHours >= 5
        ? "bg-[var(--accent)]"
        : "bg-[var(--text-muted)]/25";

  return (
    <div className="pb-8">
      {/* ── Profile header ── */}
      <div className="relative overflow-hidden px-5 pb-5 pt-2">
        <div
          className="pointer-events-none absolute inset-0 opacity-[0.08]"
          style={{
            background: `linear-gradient(135deg, ${employee.avatarColor} 0%, transparent 70%)`,
          }}
        />
        <div className="relative flex items-end gap-4">
          <span
            className="flex h-[4.5rem] w-[4.5rem] shrink-0 items-center justify-center rounded-[1.25rem] text-xl font-extrabold text-white shadow-lg"
            style={{
              background: employee.avatarColor,
              boxShadow: `0 8px 24px -4px ${employee.avatarColor}44`,
            }}
          >
            {employee.initials}
          </span>
          <div className="min-w-0 flex-1 pb-0.5">
            <div className="flex flex-wrap items-center gap-1.5">
              <p className="truncate text-lg font-bold text-[var(--text)]">
                {employee.name}
              </p>
              {(() => {
                const pk = profileOf(employee);
                const PIcon = PROFILE_ICON[pk] ?? Server;
                return (
                  <span className="inline-flex items-center gap-1 rounded-full px-1.5 py-0.5 text-[10px] font-bold text-white" style={{ background: PROFILE_COLOR[pk] ?? "var(--text-muted)" }}>
                    <PIcon size={11} />
                    {pk === "qa" ? "QA" : pk === "designer" ? "Designer" : pk === "frontend" ? "Frontend" : pk === "backend" ? "Backend" : pk === "fullstack" ? "Fullstack" : "Cloud"}
                  </span>
                );
              })()}
              {leaveOf(employee) === "on_leave" ? (
                <span className="inline-flex items-center gap-1 rounded-full bg-amber-500/15 px-1.5 py-0.5 text-[10px] font-bold text-amber-600">
                  <CalendarX size={11} /> On Leave
                </span>
              ) : (
                <span className="inline-flex items-center gap-1 rounded-full bg-[var(--success)]/10 px-1.5 py-0.5 text-[10px] font-bold text-[var(--success)]">Active</span>
              )}
              <DailyStatusBadge status={dailyStatus} />
            </div>
            <p className="mt-0.5 text-[13px] font-medium text-[var(--text-muted)]">
              {getRoleLabel(employee)}
            </p>
            <p className="mt-0.5 flex items-center gap-1 truncate text-xs text-[var(--text-muted)]/70">
              <Mail size={11} />
              {employee.email}
            </p>
          </div>
          <button
            onClick={onClose}
            aria-label="Close"
            className="mb-1 flex h-8 w-8 shrink-0 items-center justify-center rounded-full bg-[var(--surface-2)] text-[var(--text-muted)] transition-colors hover:text-[var(--text)]"
          >
            ✕
          </button>
        </div>
      </div>

      {/* ── Stat cards ── */}
      <div className="grid grid-cols-4 gap-2 px-5">
        <StatPill
          icon={<Zap size={13} />}
          value={activeTasks.length}
          label="Active"
          color="var(--accent)"
        />
        <StatPill
          icon={<CheckCircle2 size={13} />}
          value={doneTasks.length}
          label="Done"
          color="var(--success)"
        />
        <StatPill
          icon={<Clock3 size={13} />}
          value={`${todayHours}h`}
          label="Today"
          color="var(--text)"
        />
        <StatPill
          icon={<Target size={13} />}
          value={totalHours}
          label="Total"
          color={totalHours >= 8 ? "var(--success)" : "var(--accent)"}
        />
      </div>

      {/* ── Hours bar ── */}
      <div className="mx-5 mt-3 rounded-xl bg-[var(--surface)] p-3">
        <div className="flex items-center justify-between text-[11px]">
          <span className="text-[var(--text-muted)]">Daily hours</span>
          <span className="font-bold text-[var(--text)]">
            {totalHours}
            <span className="font-normal text-[var(--text-muted)]"> / 8h</span>
          </span>
        </div>
        <div className="mt-2 h-1.5 w-full overflow-hidden rounded-full bg-[var(--surface-2)]">
          <div
            className={`h-full rounded-full transition-all duration-500 ${barColor}`}
            style={{ width: `${pct}%` }}
          />
        </div>
      </div>

      {/* ── Tasks ── */}
      <div className="px-5">
        <div className="mt-5 flex items-center justify-between">
          <p className="text-xs font-bold uppercase tracking-wider text-[var(--text-muted)]">
            Assigned tasks
          </p>
          {empTasks.length > 0 ? (
            <span className="rounded-full bg-[var(--surface-2)] px-2 py-0.5 text-[10px] font-bold text-[var(--text-muted)]">
              {empTasks.length}
            </span>
          ) : null}
        </div>

        {sortedTasks.length === 0 ? (
          <div className="mt-3 rounded-2xl border border-dashed border-[var(--border)] px-4 py-10 text-center">
            <UserX
              size={28}
              className="mx-auto mb-2 text-[var(--text-muted)]/25"
            />
            <p className="text-sm font-medium text-[var(--text-muted)]">
              No tasks assigned yet
            </p>
            <p className="mt-0.5 text-[11px] text-[var(--text-muted)]/50">
              Assign tasks from Projects or Today.
            </p>
          </div>
        ) : (
          <div className="mt-3 space-y-2">
            {sortedTasks.map((t) => {
              const project = t.projectId
                ? projectsById.get(t.projectId)
                : null;
              const meta = STATUS_META[t.status];
              const isDone = t.status === "done";
              const isFailed = t.status === "failed";

              return (
                <div
                  key={t.id}
                  className={`relative overflow-hidden rounded-xl border border-[var(--border)] bg-[var(--surface)] pl-1`}
                >
                  {/* Status accent bar */}
                  <div
                    className="absolute bottom-0 left-0 top-0 w-[3px] rounded-l-xl"
                    style={{
                      background: isDone
                        ? "var(--success)"
                        : isFailed
                          ? "var(--danger)"
                          : "var(--accent)",
                    }}
                  />

                  <div className="px-3 py-2.5 pl-3.5">
                    {/* Row 1: ticket + title + hours */}
                    <div className="flex items-center gap-2">
                      <span className="shrink-0 rounded bg-[var(--surface-2)] px-1.5 py-0.5 font-mono text-[10px] font-bold text-[var(--text-muted)]">
                        {t.ticketId}
                      </span>
                      <p
                        className={`min-w-0 flex-1 truncate text-[13px] font-semibold text-[var(--text)] ${
                          isDone ? "line-through opacity-50" : ""
                        }`}
                      >
                        {t.title}
                      </p>
                      {t.estimatedHours ? (
                        <span className="shrink-0 text-[11px] font-medium text-[var(--text-muted)]/60">
                          {t.estimatedHours}h
                        </span>
                      ) : null}
                    </div>

                    {/* Row 2: status + project + move request */}
                    <div className="mt-1.5 flex items-center gap-1.5">
                      <span
                        className={`rounded-full px-1.5 py-0.5 text-[10px] font-medium ${meta.badge}`}
                      >
                        {meta.label}
                      </span>
                      {project ? (
                        <span className="flex items-center gap-1 rounded-full bg-[var(--surface-2)] px-1.5 py-0.5 text-[10px] font-medium text-[var(--text-muted)]">
                          <span
                            className="h-1.5 w-1.5 rounded-full"
                            style={{ background: project.color }}
                          />
                          {project.name}
                        </span>
                      ) : null}
                      {t.moveRequest ? (
                        <span className="rounded-full bg-amber-500/15 px-1.5 py-0.5 text-[10px] font-semibold text-amber-600">
                          Move request
                        </span>
                      ) : null}
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </div>

      {/* ── Footer CTA ── */}
      <div className="px-5 pt-5">
        <Link
          href={`/tracking/${employee.id}`}
          onClick={onClose}
          className="flex w-full items-center justify-center gap-2 rounded-xl bg-[var(--accent)] py-3 text-sm font-bold text-white shadow-lg shadow-[var(--accent-soft)] transition-transform active:scale-[0.98]"
        >
          View full profile
          <ArrowUpRight size={15} />
        </Link>
      </div>
    </div>
  );
}

/* ─── Small stat pill (icon + value + label) ─── */

function StatPill({
  icon,
  value,
  label,
  color,
}: {
  icon: React.ReactNode;
  value: string | number;
  label: string;
  color: string;
}) {
  return (
    <div className="flex flex-col items-center gap-1 rounded-xl bg-[var(--surface)] py-2.5">
      <span
        className="flex h-6 w-6 items-center justify-center rounded-full"
        style={{ color, background: `${color}18` }}
      >
        {icon}
      </span>
      <span className="text-sm font-bold text-[var(--text)]">{value}</span>
      <span className="text-[10px] text-[var(--text-muted)]">{label}</span>
    </div>
  );
}
