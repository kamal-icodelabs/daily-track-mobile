"use client";

import { useMemo } from "react";
import Link from "next/link";
import { useParams, useRouter } from "next/navigation";
import { motion } from "framer-motion";
import {
  ArrowLeft,
  Briefcase,
  CalendarClock,
  Clock,
  FolderKanban,
  Mail,
  Timer,
  UserX,
} from "lucide-react";
import { Header } from "@/components/layout/Header";
import { STATUS_META } from "@/components/tasks/TaskCard";
import { useAuth } from "@/lib/auth";
import { useData } from "@/lib/data/store";
import { useIsAdmin } from "@/lib/permissions";
import type { TaskStatus } from "@/lib/data/types";

function toIso(d: Date): string {
  return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, "0")}-${String(
    d.getDate()
  ).padStart(2, "0")}`;
}

const STATUS_ORDER: Record<TaskStatus, number> = {
  todo: 0,
  in_progress: 1,
  ready_for_testing: 2,
  in_testing: 3,
  failed: 4,
  done: 5,
};

export default function EmployeeDetailPage() {
  const params = useParams<{ employeeId: string }>();
  const router = useRouter();
  const isAdmin = useIsAdmin();
  const { users } = useAuth();
  const { tasks, workLogs, projects, teams } = useData();

  const emp = users.find((u) => u.id === params.employeeId);

  const membersProjects = useMemo(() => {
    if (!emp) return [];
    return projects.filter((p) => p.memberIds.includes(emp.id));
  }, [projects, emp]);

  const empTasks = useMemo(() => {
    if (!emp) return [];
    return tasks
      .filter((t) => t.assigneeId === emp.id)
      .sort((a, b) => STATUS_ORDER[a.status] - STATUS_ORDER[b.status]);
  }, [tasks, emp]);

  const projectsById = useMemo(() => new Map(projects.map((p) => [p.id, p])), [projects]);
  const teamsById = useMemo(() => new Map(teams.map((t) => [t.id, t])), [teams]);

  const logsFor = (userId: string) => workLogs.filter((l) => l.userId === userId);

  const totalHours = emp ? logsFor(emp.id).reduce((s, l) => s + l.hours, 0) : 0;

  const hoursForTask = (taskId: string) =>
    emp ? logsFor(emp.id).filter((l) => l.taskId === taskId).reduce((s, l) => s + l.hours, 0) : 0;

  const hoursOnProject = (projectId: string) => {
    const taskIds = new Set(
      tasks.filter((t) => t.assigneeId === emp?.id && t.projectId === projectId).map((t) => t.id)
    );
    return emp
      ? logsFor(emp.id).filter((l) => taskIds.has(l.taskId)).reduce((s, l) => s + l.hours, 0)
      : 0;
  };

  const today = new Date();
  const todayIso = toIso(today);
  const yesterdayIso = toIso(new Date(today.getTime() - 86400000));
  const tomorrowIso = toIso(new Date(today.getTime() + 86400000));

  const todayHours = emp
    ? logsFor(emp.id).filter((l) => l.date === todayIso).reduce((s, l) => s + l.hours, 0)
    : 0;
  const yesterdayHours = emp
    ? logsFor(emp.id).filter((l) => l.date === yesterdayIso).reduce((s, l) => s + l.hours, 0)
    : 0;

  const todayTasks = empTasks.filter((t) => t.dueDate === todayIso);
  const tomorrowTasks = empTasks.filter((t) => t.dueDate === tomorrowIso);
  const yesterdayTasks = empTasks.filter((t) => t.dueDate === yesterdayIso);

  const activeTasks = empTasks.filter((t) => t.status !== "done");
  const doneTasks = empTasks.filter((t) => t.status === "done");

  if (!emp) {
    return (
      <div className="flex h-full flex-col">
        <Header title="Employee" subtitle="Not found" />
        <div className="flex flex-1 flex-col items-center justify-center px-6 text-center">
          <UserX size={36} className="mb-3 text-[var(--text-muted)]/40" />
          <p className="text-sm text-[var(--text-muted)]">
            We couldn&apos;t find that employee.
          </p>
          <Link
            href="/tracking"
            className="mt-4 rounded-xl bg-[var(--accent)] px-5 py-2.5 text-sm font-semibold text-white"
          >
            Back to tracking
          </Link>
        </div>
      </div>
    );
  }

  const teamName = emp.teamId ? teamsById.get(emp.teamId)?.name : null;

  return (
    <div className="flex h-full flex-col">
      <Header
        title="Employee"
        subtitle={emp.name}
        actionIcon={ArrowLeft}
        onAction={() => router.back()}
        actionLabel="Back"
      />

      <div className="flex-1 space-y-4 overflow-y-auto px-4 py-4 pb-28">
        {/* Profile card */}
        <div className="rounded-2xl border border-[var(--border)] bg-[var(--surface)] p-4 shadow-sm">
          <div className="flex items-center gap-4">
            <span
              className="flex h-16 w-16 shrink-0 items-center justify-center rounded-full text-xl font-bold text-white"
              style={{ background: emp.avatarColor }}
            >
              {emp.initials}
            </span>
            <div className="min-w-0 flex-1">
              <div className="flex items-center gap-2">
                <h2 className="truncate text-lg font-bold text-[var(--text)]">{emp.name}</h2>
                {emp.isTester ? (
                  <span className="shrink-0 rounded-full bg-violet-500/15 px-2 py-0.5 text-[11px] font-semibold text-violet-500">
                    QA
                  </span>
                ) : (
                  <span className="shrink-0 rounded-full bg-[var(--accent-soft)] px-2 py-0.5 text-[11px] font-semibold text-[var(--accent)]">
                    Developer
                  </span>
                )}
              </div>
              <p className="mt-0.5 flex items-center gap-1.5 text-xs text-[var(--text-muted)]">
                <Mail size={12} /> {emp.email}
              </p>
              {teamName ? (
                <p className="mt-0.5 flex items-center gap-1.5 text-xs text-[var(--text-muted)]">
                  <Briefcase size={12} /> {teamName} team
                </p>
              ) : null}
            </div>
          </div>

          <div className="mt-4 grid grid-cols-4 gap-2">
            {[
              { label: "Tasks", value: empTasks.length },
              { label: "Active", value: activeTasks.length },
              { label: "Done", value: doneTasks.length },
              { label: "Total hrs", value: totalHours.toFixed(1) },
            ].map((s) => (
              <div
                key={s.label}
                className="rounded-xl bg-[var(--surface-2)] p-2 text-center"
              >
                <p className="text-base font-bold text-[var(--text)]">{s.value}</p>
                <p className="text-[10px] text-[var(--text-muted)]">{s.label}</p>
              </div>
            ))}
          </div>
        </div>

        {/* Projects the employee is a member of */}
        <section>
          <div className="mb-2 flex items-center gap-2 px-1">
            <FolderKanban size={15} className="text-[var(--accent)]" />
            <h3 className="text-sm font-semibold text-[var(--text-muted)]">Projects</h3>
          </div>
          <div className="space-y-2">
            {membersProjects.length === 0 ? (
              <p className="rounded-2xl border border-[var(--border)] bg-[var(--surface)] p-4 text-sm text-[var(--text-muted)]">
                Not assigned to any project yet.
              </p>
            ) : (
              membersProjects.map((p) => {
                const pTasks = empTasks.filter((t) => t.projectId === p.id);
                const pHours = hoursOnProject(p.id);
                return (
                  <div
                    key={p.id}
                    className="rounded-2xl border border-[var(--border)] bg-[var(--surface)] p-3 shadow-sm"
                  >
                    <div className="flex items-center gap-2">
                      <span className="h-3 w-3 rounded-full" style={{ background: p.color }} />
                      <p className="flex-1 truncate text-sm font-semibold text-[var(--text)]">
                        {p.name}
                      </p>
                      <span className="text-xs text-[var(--text-muted)]">
                        {pTasks.length} tasks
                      </span>
                      <span className="text-xs font-bold text-[var(--text)]">
                        {pHours}h
                      </span>
                    </div>
                    <div className="mt-2 flex items-center gap-1.5">
                      {pTasks.map((t) => (
                        <span
                          key={t.id}
                          title={`${t.ticketId} - ${t.title}`}
                          className={`rounded px-1 py-0.5 text-[10px] font-mono font-bold ${STATUS_META[t.status].badge}`}
                        >
                          {t.ticketId}
                        </span>
                      ))}
                      {pTasks.length === 0 ? (
                        <span className="text-[11px] text-[var(--text-muted)]">
                          No tasks assigned yet
                        </span>
                      ) : null}
                    </div>
                  </div>
                );
              })
            )}
          </div>
        </section>

        {/* Scheduled: yesterday, today, tomorrow */}
        <section>
          <div className="mb-2 flex items-center gap-2 px-1">
            <CalendarClock size={15} className="text-[var(--accent)]" />
            <h3 className="text-sm font-semibold text-[var(--text-muted)]">
              Scheduled assignments
            </h3>
          </div>
          <div className="space-y-2">
            {[
              { label: "Yesterday", list: yesterdayTasks, hours: yesterdayHours, dim: true },
              { label: "Today", list: todayTasks, hours: todayHours, dim: false },
              { label: "Tomorrow", list: tomorrowTasks, hours: 0, dim: false },
            ].map((slot) => (
              <div
                key={slot.label}
                className="rounded-2xl border border-[var(--border)] bg-[var(--surface)] p-3 shadow-sm"
              >
                <div className="mb-1.5 flex items-center justify-between">
                  <p
                    className={`text-xs font-semibold ${
                      slot.dim ? "text-[var(--text-muted)]/60" : "text-[var(--text-muted)]"
                    }`}
                  >
                    {slot.label} · {slot.list.length} task{slot.list.length === 1 ? "" : "s"}
                  </p>
                  {slot.hours > 0 ? (
                    <span className="flex items-center gap-1 text-[11px] font-semibold text-[var(--text)]">
                      <Clock size={11} /> {slot.hours}h logged
                    </span>
                  ) : null}
                </div>
                {slot.list.length === 0 ? (
                  <p className="text-xs text-[var(--text-muted)]/60">
                    {slot.label === "Tomorrow"
                      ? "Nothing scheduled for tomorrow."
                      : `No tasks due ${slot.label.toLowerCase()}.`}
                  </p>
                ) : (
                  <div className="space-y-1.5">
                    {slot.list.map((t) => {
                      const project = t.projectId ? projectsById.get(t.projectId) : null;
                      return (
                        <div
                          key={t.id}
                          className="flex items-center gap-2.5 rounded-xl bg-[var(--surface-2)] p-2"
                        >
                          <span className="shrink-0 rounded bg-[var(--bg)] px-1.5 py-0.5 font-mono text-[11px] font-bold text-[var(--text-muted)]">
                            {t.ticketId}
                          </span>
                          <div className="min-w-0 flex-1">
                            <p className="truncate text-sm font-medium text-[var(--text)]">
                              {t.title}
                            </p>
                            <p className="flex items-center gap-1.5 text-[11px] text-[var(--text-muted)]">
                              <span className={`${STATUS_META[t.status].badge} rounded-full px-1.5 py-0.5 text-[10px] font-medium`}>
                                {STATUS_META[t.status].label}
                              </span>
                              {project ? (
                                <span className="flex items-center gap-1">
                                  <span
                                    className="h-1.5 w-1.5 rounded-full"
                                    style={{ background: project.color }}
                                  />
                                  {project.name}
                                </span>
                              ) : null}
                              {slot.label === "Today" && hoursForTask(t.id) > 0 ? (
                                <span className="flex items-center gap-0.5">
                                  <Timer size={10} /> {hoursForTask(t.id)}h
                                </span>
                              ) : null}
                            </p>
                          </div>
                        </div>
                      );
                    })}
                  </div>
                )}
              </div>
            ))}
          </div>
        </section>

        {/* All tasks with per-task time */}
        <section>
          <div className="mb-2 flex items-center gap-2 px-1">
            <FolderKanban size={15} className="text-[var(--accent)]" />
            <h3 className="text-sm font-semibold text-[var(--text-muted)]">
              All tasks · {empTasks.length}
            </h3>
          </div>

          <div className="space-y-2">
            {empTasks.length === 0 ? (
              <p className="rounded-2xl border border-[var(--border)] bg-[var(--surface)] p-4 text-sm text-[var(--text-muted)]">
                No tasks assigned.
              </p>
            ) : (
              empTasks.map((t) => {
                const project = t.projectId ? projectsById.get(t.projectId) : null;
                return (
                  <motion.div
                    key={t.id}
                    initial={{ opacity: 0, y: 8 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ duration: 0.2 }}
                    className="rounded-2xl border border-[var(--border)] bg-[var(--surface)] p-3 shadow-sm"
                  >
                    <div className="flex items-start gap-2.5">
                      <span className="mt-0.5 shrink-0 rounded bg-[var(--surface-2)] px-1.5 py-0.5 font-mono text-[11px] font-bold text-[var(--text-muted)]">
                        {t.ticketId}
                      </span>
                      <div className="min-w-0 flex-1">
                        <p
                          className={`truncate text-sm font-medium text-[var(--text)] ${
                            t.status === "done" ? "line-through opacity-60" : ""
                          }`}
                        >
                          {t.title}
                        </p>
                        <div className="mt-1 flex flex-wrap items-center gap-1.5 text-[11px]">
                          <span className={`${STATUS_META[t.status].badge} rounded-full px-1.5 py-0.5 font-medium`}>
                            {STATUS_META[t.status].label}
                          </span>
                          {project ? (
                            <span className="flex items-center gap-1 text-[var(--text-muted)]">
                              <span
                                className="h-1.5 w-1.5 rounded-full"
                                style={{ background: project.color }}
                              />
                              {project.name}
                            </span>
                          ) : null}
                          <span className="flex items-center gap-0.5 text-[var(--text-muted)]">
                            <Timer size={10} /> {hoursForTask(t.id)}h total
                          </span>
                        </div>
                      </div>
                    </div>
                  </motion.div>
                );
              })
            )}
          </div>
        </section>
      </div>
    </div>
  );
}
