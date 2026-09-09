"use client";

import Link from "next/link";
import { useMemo, useState } from "react";
import { motion } from "framer-motion";
import {
  ChevronDown,
  ClipboardCheck,
  Filter,
  FolderKanban,
  Search,
  SlidersHorizontal,
  UserX,
} from "lucide-react";
import { Header } from "@/components/layout/Header";
import { PickerDropdown } from "@/components/layout/PickerDropdown";
import { STATUS_META } from "@/components/tasks/TaskCard";
import { useAuth } from "@/lib/auth";
import { useData } from "@/lib/data/store";
import { useIsAdmin } from "@/lib/permissions";
import type { Task, TaskStatus } from "@/lib/data/types";

type SortKey = "name" | "tasks" | "hours";

const STATUS_ORDER: Record<TaskStatus, number> = {
  todo: 0,
  in_progress: 1,
  ready_for_testing: 2,
  in_testing: 3,
  failed: 4,
  done: 5,
};

export default function TrackingPage() {
  const { user, users } = useAuth();
  const isAdmin = useIsAdmin();
  const { tasks, workLogs, projects } = useData();

  const [search, setSearch] = useState("");
  const [projectFilter, setProjectFilter] = useState("all");
  const [sortBy, setSortBy] = useState<SortKey>("tasks");
  const [openEmployee, setOpenEmployee] = useState<string | null>(null);

  const me = user!;
  const isManager = isAdmin || me.role === "manager";

  const employees = useMemo(() => users.filter((u) => u.role === "employee"), [users]);
  const projectsById = useMemo(() => new Map(projects.map((p) => [p.id, p])), [projects]);

  const hoursForUser = (userId: string) =>
    workLogs.filter((l) => l.userId === userId).reduce((s, l) => s + l.hours, 0);

  const tasksForUser = (userId: string) =>
    tasks.filter((t) => t.assigneeId === userId);

  const unassignedTasks = useMemo(() => tasks.filter((t) => !t.assigneeId), [tasks]);

  const filteredEmployees = useMemo(() => {
    let list = employees;

    if (search.trim()) {
      const q = search.toLowerCase();
      list = list.filter(
        (e) => e.name.toLowerCase().includes(q) || e.email.toLowerCase().includes(q)
      );
    }

    if (projectFilter !== "all") {
      list = list.filter((e) =>
        tasks.some((t) => t.assigneeId === e.id && t.projectId === projectFilter)
      );
    }

    list = [...list].sort((a, b) => {
      if (sortBy === "name") return a.name.localeCompare(b.name);
      if (sortBy === "hours") return hoursForUser(b.id) - hoursForUser(a.id);
      return tasksForUser(b.id).length - tasksForUser(a.id).length;
    });

    return list;
  }, [employees, search, projectFilter, sortBy, tasks, hoursForUser, tasksForUser]);

  const withTasks = filteredEmployees.filter((e) => tasksForUser(e.id).length > 0).length;
  const idle = filteredEmployees.filter((e) => tasksForUser(e.id).length === 0).length;

  const allEmployeeProjectIds = useMemo(() => {
    const ids = new Set<string>();
    for (const t of tasks) if (t.projectId) ids.add(t.projectId);
    return [...ids].map((id) => projectsById.get(id)!).filter(Boolean);
  }, [tasks, projectsById]);

  return (
    <div className="flex h-full flex-col">
      <Header
        title="Tracking"
        subtitle="All team members & their assignments"
        actionIcon={ClipboardCheck}
      />

      <div className="flex-1 space-y-4 overflow-y-auto px-4 py-4 pb-28">
        <div className="grid grid-cols-4 gap-2">
          {[
            {
              label: "Team",
              value: employees.length,
              tint: "rgba(99,102,241,0.16)",
            },
            {
              label: "Active",
              value: withTasks,
              tint: "rgba(14,165,233,0.15)",
            },
            {
              label: "Idle",
              value: idle,
              tint: "rgba(245,158,11,0.14)",
            },
            {
              label: "Unassigned",
              value: unassignedTasks.length,
              tint: "rgba(239,68,68,0.14)",
            },
          ].map((s) => (
            <motion.div
              key={s.label}
              initial={{ opacity: 0, y: 12 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.3 }}
              whileTap={{ scale: 0.98 }}
              className="relative overflow-hidden rounded-xl border border-[var(--border)] bg-[var(--surface)] p-2.5 text-center"
            >
              {/* transparent tint, starts top-right at 45deg, fades toward bottom-left */}
              <div
                className="pointer-events-none absolute inset-0"
                style={{
                  background: `linear-gradient(225deg, ${s.tint} 0%, rgba(255,255,255,0) 70%)`,
                }}
              />
              <p className="relative text-lg font-bold text-[var(--text)]">{s.value}</p>
              <p className="relative text-[10px] font-medium text-[var(--text-muted)]">
                {s.label}
              </p>
            </motion.div>
          ))}
        </div>

        {unassignedTasks.length > 0 ? (
          <div className="rounded-2xl border border-[var(--danger)]/20 bg-[var(--danger)]/5 p-3">
            <div className="flex items-center gap-2">
              <UserX size={15} className="shrink-0 text-[var(--danger)]" />
              <p className="text-xs font-semibold text-[var(--danger)]">
                {unassignedTasks.length} task{unassignedTasks.length > 1 ? "s" : ""} without an
                assignee
              </p>
            </div>
            <div className="mt-2 space-y-1">
              {unassignedTasks.slice(0, 3).map((t) => (
                <div key={t.id} className="flex items-center gap-2 text-[11px]">
                  <span className="shrink-0 rounded bg-[var(--surface-2)] px-1 py-0.5 font-mono font-bold text-[var(--text-muted)]">
                    {t.ticketId}
                  </span>
                  <span className="truncate text-[var(--text-muted)]">{t.title}</span>
                </div>
              ))}
              {unassignedTasks.length > 3 ? (
                <p className="text-[11px] text-[var(--text-muted)]">
                  +{unassignedTasks.length - 3} more...
                </p>
              ) : null}
            </div>
          </div>
        ) : null}

        <div className="space-y-2">
          <div className="relative">
            <Search
              size={15}
              className="absolute left-3 top-1/2 -translate-y-1/2 text-[var(--text-muted)]"
            />
            <input
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              placeholder="Search by name..."
              className="w-full rounded-xl border border-[var(--border)] bg-[var(--surface)] py-2.5 pl-9 pr-3 text-sm text-[var(--text)] placeholder:text-[var(--text-muted)]/50 focus:border-[var(--accent)] focus:outline-none"
            />
          </div>
          <div className="flex gap-2">
            <PickerDropdown
              label="Project"
              value={projectFilter}
              onChange={setProjectFilter}
              icon={<Filter size={13} />}
              placeholder="All projects"
              options={[
                { value: "all" as const, label: "All projects" },
                ...allEmployeeProjectIds.map((p) => ({
                  value: p.id as string,
                  label: p.name,
                  color: p.color,
                })),
              ]}
            />
            <PickerDropdown
              label="Sort"
              value={sortBy}
              onChange={setSortBy}
              icon={<SlidersHorizontal size={13} />}
              placeholder="Sort"
              options={[
                { value: "tasks" as const, label: "Task count" },
                { value: "name" as const, label: "Name" },
                { value: "hours" as const, label: "Hours" },
              ]}
            />
          </div>
        </div>

        {filteredEmployees.length === 0 ? (
          <div className="flex flex-col items-center pt-12 text-center">
            <ClipboardCheck size={32} className="mb-3 text-[var(--text-muted)]/40" />
            <p className="text-sm text-[var(--text-muted)]">No employees match your filters.</p>
          </div>
        ) : (
          <div className="space-y-2">
            {filteredEmployees.map((emp) => {
              const empTasks = tasksForUser(emp.id);
              const activeTasks = empTasks.filter((t) => t.status !== "done");
              const doneTasks = empTasks.filter((t) => t.status === "done");
              const empHours = hoursForUser(emp.id);
              const isOpen = openEmployee === emp.id;

              const statusCounts = activeTasks.reduce(
                (acc, t) => {
                  acc[t.status] = (acc[t.status] || 0) + 1;
                  return acc;
                },
                {} as Record<string, number>
              );

              const sortedEmpTasks = [...empTasks].sort(
                (a, b) => STATUS_ORDER[a.status] - STATUS_ORDER[b.status]
              );

              return (
                <motion.div
                  key={emp.id}
                  initial={{ opacity: 0, y: 8 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ duration: 0.25 }}
                  className="overflow-hidden rounded-2xl border border-[var(--border)] bg-[var(--surface)] shadow-sm"
                >
                  <div className="flex items-center gap-3 px-3.5 py-3">
                    <Link
                      href={`/tracking/${emp.id}`}
                      aria-label={`View ${emp.name}'s profile`}
                      onClick={() => setOpenEmployee(null)}
                      className="group relative shrink-0"
                    >
                      <span
                        className="flex h-10 w-10 items-center justify-center rounded-full text-sm font-bold text-white transition-transform group-hover:scale-105"
                        style={{ background: emp.avatarColor }}
                      >
                        {emp.initials}
                      </span>
                      <span className="pointer-events-none absolute -inset-1 rounded-full bg-[var(--accent-soft)] opacity-0 transition-opacity group-hover:opacity-100" />
                    </Link>

                    <button
                      onClick={() => setOpenEmployee(isOpen ? null : emp.id)}
                      className="flex min-w-0 flex-1 items-center gap-3 text-left"
                    >
                      <div className="min-w-0 flex-1">
                        <div className="flex items-center gap-1.5">
                          <p className="truncate text-sm font-semibold text-[var(--text)]">
                            {emp.name}
                          </p>
                          {emp.isTester ? (
                            <span className="shrink-0 rounded-full bg-violet-500/15 px-1.5 py-0.5 text-[10px] font-semibold text-violet-500">
                              QA
                            </span>
                          ) : null}
                        </div>
                        <p className="text-[11px] text-[var(--text-muted)]">
                          {empTasks.length === 0
                            ? "No tasks assigned"
                            : `${activeTasks.length} active \u00b7 ${doneTasks.length} done`}
                        </p>
                      </div>
                      <div className="flex shrink-0 items-center gap-2">
                        {empTasks.length > 0 ? (
                          <div className="hidden items-center gap-1 sm:flex">
                            {Object.entries(statusCounts).map(([status, count]) => (
                              <span
                                key={status}
                                className={`rounded-full px-1.5 py-0.5 text-[10px] font-medium ${
                                  STATUS_META[status as TaskStatus].badge
                                }`}
                              >
                                {count}
                              </span>
                            ))}
                          </div>
                        ) : null}
                        <span
                          className={`text-xs font-bold ${
                            empHours >= 8
                              ? "text-[var(--success)]"
                              : empHours >= 5
                                ? "text-[var(--accent)]"
                                : "text-[var(--text-muted)]"
                          }`}
                        >
                          {empHours}h
                        </span>
                        <ChevronDown
                          size={16}
                          className={`shrink-0 text-[var(--text-muted)] transition-transform duration-200 ${
                            isOpen ? "rotate-180" : ""
                          }`}
                        />
                      </div>
                    </button>
                  </div>

                  {isOpen ? (
                    <div className="border-t border-[var(--border)] px-3.5 pb-3 pt-2.5">
                      {empTasks.length === 0 ? (
                        <div className="py-6 text-center">
                          <UserX
                            size={24}
                            className="mx-auto mb-2 text-[var(--text-muted)]/30"
                          />
                          <p className="text-sm text-[var(--text-muted)]">
                            No tasks assigned yet
                          </p>
                          <p className="mt-0.5 text-[11px] text-[var(--text-muted)]/60">
                            Assign tasks from Projects or Today.
                          </p>
                        </div>
                      ) : (
                        <div className="space-y-1.5">
                          {sortedEmpTasks.map((t) => {
                            const project = t.projectId
                              ? projectsById.get(t.projectId)
                              : null;
                            return (
                              <div
                                key={t.id}
                                className="flex items-center gap-2.5 rounded-xl border border-[var(--border)] p-2.5"
                              >
                                <span className="shrink-0 rounded-md bg-[var(--surface-2)] px-1.5 py-0.5 font-mono text-[11px] font-bold text-[var(--text-muted)]">
                                  {t.ticketId}
                                </span>
                                <div className="min-w-0 flex-1">
                                  <p
                                    className={`truncate text-sm font-medium text-[var(--text)] ${
                                      t.status === "done"
                                        ? "line-through opacity-60"
                                        : ""
                                    }`}
                                  >
                                    {t.title}
                                  </p>
                                  <div className="mt-0.5 flex items-center gap-1.5">
                                    <span
                                      className={`rounded-full px-1.5 py-0.5 text-[10px] font-medium ${
                                        STATUS_META[t.status].badge
                                      }`}
                                    >
                                      {STATUS_META[t.status].label}
                                    </span>
                                    {project ? (
                                      <span className="flex items-center gap-1 text-[10px] text-[var(--text-muted)]">
                                        <span
                                          className="h-1.5 w-1.5 rounded-full"
                                          style={{ background: project.color }}
                                        />
                                        {project.name}
                                      </span>
                                    ) : null}
                                  </div>
                                </div>
                                {t.moveRequest ? (
                                  <span className="shrink-0 rounded-full bg-amber-500/15 px-1.5 py-0.5 text-[10px] font-medium text-amber-500">
                                    Move request
                                  </span>
                                ) : null}
                              </div>
                            );
                          })}
                        </div>
                      )}

                      <div className="mt-3 rounded-xl bg-[var(--surface-2)] px-3 py-2">
                        <div className="flex items-center justify-between text-[11px]">
                          <span className="text-[var(--text-muted)]">Hours logged</span>
                          <span
                            className={`font-semibold ${
                              empHours >= 8
                                ? "text-[var(--success)]"
                                : empHours >= 5
                                  ? "text-[var(--accent)]"
                                  : "text-[var(--text-muted)]"
                            }`}
                          >
                            {empHours}h / 8h
                          </span>
                        </div>
                        <div className="mt-1.5 h-1.5 w-full overflow-hidden rounded-full bg-black/5">
                          <div
                            className={`h-full rounded-full transition-all ${
                              empHours >= 8
                                ? "bg-[var(--success)]"
                                : empHours >= 5
                                  ? "bg-[var(--accent)]"
                                  : "bg-[var(--text-muted)]/30"
                            }`}
                            style={{ width: `${Math.min(100, (empHours / 8) * 100)}%` }}
                          />
                        </div>
                      </div>
                    </div>
                  ) : null}
                </motion.div>
              );
            })}
          </div>
        )}
      </div>
    </div>
  );
}
