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
  FolderKanban,
  Layers,
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
  "team-cloud": "Cloud Engineer",
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

/* ─── Main body — organised, card-based layout ─── */

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
  const activeTasks = empTasks.filter((t) => t.status === "todo" || t.status === "in_progress");
  const reviewTasks = empTasks.filter((t) => t.status === "ready_for_testing" || t.status === "in_testing");
  const doneTasks = empTasks.filter((t) => t.status === "done");
  const failedTasks = empTasks.filter((t) => t.status === "failed");

  const totalHours = workLogs.filter((l) => l.userId === employee.id).reduce((s, l) => s + l.hours, 0);
  const today = new Date().toISOString().slice(0, 10);
  const todayHours = workLogs.filter((l) => l.userId === employee.id && l.date === today).reduce((s, l) => s + l.hours, 0);

  const { getDailyStatus } = useData();
  const dailyStatus = getDailyStatus(employee.id);

  const projectsById = new Map(projects.map((p) => [p.id, p]));
  const employeeProjects = projects.filter((p) => p.memberIds.includes(employee.id));

  const pct = Math.min(100, (totalHours / 8) * 100);
  const barColor =
    totalHours >= 8 ? "bg-[var(--success)]" : totalHours >= 5 ? "bg-[var(--accent)]" : "bg-[var(--text-muted)]/25";

  const pk = profileOf(employee);
  const PIcon = PROFILE_ICON[pk] ?? Server;

  return (
    <div className="space-y-4 pb-8">
      {/* ── Profile card ── */}
      <div className="mx-5 mt-1 rounded-2xl border border-[var(--border)] bg-[var(--surface)] p-4 shadow-sm">
        <div className="flex items-start gap-4">
          <span
            className="flex h-14 w-14 shrink-0 items-center justify-center rounded-2xl text-lg font-extrabold text-white shadow-md"
            style={{ background: employee.avatarColor, boxShadow: `0 8px 20px -4px ${employee.avatarColor}40` }}
          >
            {employee.initials}
          </span>
          <div className="min-w-0 flex-1">
            <div className="flex flex-wrap items-center gap-1.5">
              <p className="truncate text-[15px] font-bold text-[var(--text)]">{employee.name}</p>
              <span className="inline-flex items-center gap-1 rounded-full px-2 py-0.5 text-[10px] font-bold text-white" style={{ background: PROFILE_COLOR[pk] ?? "var(--text-muted)" }}>
                <PIcon size={11} /> {pk === "qa" ? "QA" : pk === "designer" ? "Designer" : pk === "frontend" ? "Frontend" : pk === "backend" ? "Backend" : pk === "fullstack" ? "Fullstack" : "Cloud"}
              </span>
            </div>
            <p className="mt-1 text-xs font-medium text-[var(--text-muted)]">{getRoleLabel(employee)}</p>
            <p className="mt-1 flex items-center gap-1 truncate text-xs text-[var(--text-muted)]/70">
              <Mail size={11} /> {employee.email}
            </p>
            <div className="mt-2 flex flex-wrap items-center gap-1.5">
              {leaveOf(employee) === "on_leave" ? (
                <span className="inline-flex items-center gap-1 rounded-full bg-amber-500/15 px-2 py-0.5 text-[11px] font-semibold text-amber-600">
                  <CalendarX size={11} /> On Leave
                </span>
              ) : (
                <span className="inline-flex items-center gap-1 rounded-full bg-[var(--success)]/10 px-2 py-0.5 text-[11px] font-semibold text-[var(--success)]">
                  <span className="h-1.5 w-1.5 rounded-full bg-[var(--success)]" /> Active
                </span>
              )}
              <DailyStatusBadge status={dailyStatus} />
            </div>
          </div>
          <button
            onClick={onClose}
            aria-label="Close"
            className="flex h-8 w-8 shrink-0 items-center justify-center rounded-full bg-[var(--surface-2)] text-[var(--text-muted)] hover:text-[var(--text)]"
          >
            ✕
          </button>
        </div>
      </div>

      {/* ── Overview stats ── */}
      <div className="mx-5 rounded-2xl border border-[var(--border)] bg-[var(--surface)] p-4">
        <p className="mb-3 flex items-center gap-1.5 text-xs font-bold uppercase tracking-wider text-[var(--text-muted)]">
          <Target size={12} /> Overview
        </p>
        <div className="grid grid-cols-4 gap-2">
          <StatPill icon={<Zap size={13} />} value={activeTasks.length} label="Active" color="var(--accent)" />
          <StatPill icon={<Clock3 size={13} />} value={reviewTasks.length} label="Review" color="#8b5cf6" />
          <StatPill icon={<CheckCircle2 size={13} />} value={doneTasks.length} label="Done" color="var(--success)" />
          <StatPill icon={<CalendarX size={13} />} value={failedTasks.length} label="Failed" color="var(--danger)" />
        </div>
        <div className="mt-3 grid grid-cols-2 gap-2 rounded-xl bg-[var(--surface-2)] p-3">
          <div className="text-center">
            <p className="text-lg font-bold text-[var(--text)]">{todayHours}h</p>
            <p className="text-[11px] text-[var(--text-muted)]">Today</p>
          </div>
          <div className="text-center border-l border-[var(--border)]">
            <p className="text-lg font-bold text-[var(--text)]">{totalHours}h</p>
            <p className="text-[11px] text-[var(--text-muted)]">Total</p>
          </div>
        </div>
        <div className="mt-3">
          <div className="flex items-center justify-between text-[11px]">
            <span className="font-medium text-[var(--text-muted)]">Daily progress</span>
            <span className="font-bold text-[var(--text)]">
              {totalHours}<span className="font-normal text-[var(--text-muted)]"> / 8h</span>
            </span>
          </div>
          <div className="mt-1.5 h-1.5 w-full overflow-hidden rounded-full bg-[var(--surface-2)]">
            <div className={`h-full rounded-full transition-all duration-500 ${barColor}`} style={{ width: `${pct}%` }} />
          </div>
        </div>
      </div>

      {/* ── Projects ── */}
      <div className="mx-5 rounded-2xl border border-[var(--border)] bg-[var(--surface)] p-4">
        <p className="mb-2 flex items-center gap-1.5 text-xs font-bold uppercase tracking-wider text-[var(--text-muted)]">
          <FolderKanban size={12} /> Projects · {employeeProjects.length}
        </p>
        {employeeProjects.length === 0 ? (
          <p className="rounded-xl border border-dashed border-[var(--border)] bg-[var(--surface-2)] px-3 py-3 text-center text-xs text-[var(--text-muted)]">
            Not assigned to any project
          </p>
        ) : (
          <div className="flex flex-wrap gap-1.5">
            {employeeProjects.map((p) => (
              <span key={p.id} className="inline-flex items-center gap-1.5 rounded-full border border-[var(--border)] bg-[var(--surface-2)] px-2.5 py-1 text-xs font-medium text-[var(--text)]">
                <span className="h-2 w-2 rounded-full" style={{ background: p.color }} />
                {p.name}
              </span>
            ))}
          </div>
        )}
      </div>

      {/* ── Tasks grouped ── */}
      <div className="mx-5">
        <p className="mb-2 flex items-center gap-1.5 px-1 text-xs font-bold uppercase tracking-wider text-[var(--text-muted)]">
          <Layers size={12} /> Tasks · {empTasks.length}
        </p>
        {empTasks.length === 0 ? (
          <div className="rounded-2xl border border-dashed border-[var(--border)] bg-[var(--surface)] px-4 py-10 text-center">
            <UserX size={28} className="mx-auto mb-2 text-[var(--text-muted)]/25" />
            <p className="text-sm font-medium text-[var(--text-muted)]">No tasks assigned yet</p>
            <p className="mt-0.5 text-[11px] text-[var(--text-muted)]/50">Assign tasks from Projects or Today.</p>
          </div>
        ) : (
          <div className="space-y-3">
            {[
              { key: "active", label: "Active", icon: Zap, color: "var(--accent)", tasks: activeTasks },
              { key: "review", label: "In Review", icon: Clock3, color: "#8b5cf6", tasks: reviewTasks },
              { key: "done", label: "Done", icon: CheckCircle2, color: "var(--success)", tasks: doneTasks },
              { key: "failed", label: "Failed", icon: CalendarX, color: "var(--danger)", tasks: failedTasks },
            ]
              .filter((g) => g.tasks.length > 0)
              .map((group) => (
                <div key={group.key} className="rounded-2xl border border-[var(--border)] bg-[var(--surface)] p-3">
                  <div className="mb-2 flex items-center gap-1.5">
                    <span className="flex h-6 w-6 items-center justify-center rounded-full text-white" style={{ background: group.color }}>
                      <group.icon size={12} />
                    </span>
                    <p className="text-xs font-bold text-[var(--text)]">
                      {group.label} · {group.tasks.length}
                    </p>
                  </div>
                  <div className="space-y-2">
                    {group.tasks.map((t) => {
                      const project = t.projectId ? projectsById.get(t.projectId) : null;
                      const meta = STATUS_META[t.status];
                      return (
                        <div key={t.id} className="rounded-xl border border-[var(--border)] bg-[var(--surface-2)]/60 px-3 py-2.5">
                          <div className="flex items-center gap-2">
                            <span className="shrink-0 rounded bg-[var(--surface)] px-1.5 py-0.5 font-mono text-[10px] font-bold text-[var(--text-muted)]">
                              {t.ticketId}
                            </span>
                            <p className={`min-w-0 flex-1 truncate text-[13px] font-semibold ${t.status === "done" ? "text-[var(--text-muted)] line-through" : "text-[var(--text)]"}`}>
                              {t.title}
                            </p>
                            {t.estimatedHours ? <span className="shrink-0 text-[11px] text-[var(--text-muted)]">{t.estimatedHours}h</span> : null}
                          </div>
                          <div className="mt-1.5 flex flex-wrap items-center gap-1.5">
                            <span className={`rounded-full px-2 py-0.5 text-[10px] font-medium ${meta.badge}`}>{meta.label}</span>
                            {project ? (
                              <span className="inline-flex items-center gap-1 rounded-full bg-[var(--surface)] px-2 py-0.5 text-[10px] font-medium text-[var(--text-muted)]">
                                <span className="h-1.5 w-1.5 rounded-full" style={{ background: project.color }} /> {project.name}
                              </span>
                            ) : null}
                          </div>
                        </div>
                      );
                    })}
                  </div>
                </div>
              ))}
          </div>
        )}
      </div>

      {/* ── Footer CTA ── */}
      <div className="mx-5">
        <Link
          href={`/tracking/${employee.id}`}
          onClick={onClose}
          className="flex w-full items-center justify-center gap-2 rounded-xl bg-[var(--accent)] py-3 text-sm font-bold text-[var(--bg)] shadow-lg shadow-[var(--accent-soft)]"
        >
          View full profile <ArrowUpRight size={15} />
        </Link>
      </div>
    </div>
  );
}

/* ─── Small stat pill ─── */

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
    <div className="flex flex-col items-center gap-1 rounded-xl bg-[var(--surface-2)] py-2.5">
      <span className="flex h-7 w-7 items-center justify-center rounded-full" style={{ color, background: `${color}18` }}>
        {icon}
      </span>
      <span className="text-sm font-bold text-[var(--text)]">{value}</span>
      <span className="text-[10px] font-semibold uppercase tracking-wide text-[var(--text-muted)]">{label}</span>
    </div>
  );
}
