"use client";

import Link from "next/link";
import { useMemo, useState } from "react";
import { motion } from "framer-motion";
import {
  Activity,
  Bug,
  CalendarX,
  Check,
  ChevronDown,
  ClipboardCheck,
  Cloud,
  Code,
  Filter,
  Layers,
  Palette,
  Search,
  Server,
  SlidersHorizontal,
  UserX,
  Users,
  type LucideIcon,
} from "lucide-react";
import { Header } from "@/components/layout/Header";
import { Sheet } from "react-modal-sheet";
import { EmployeeDetailModal } from "@/components/tracking/EmployeeDetailModal";
import { DailyStatusIconBadge } from "@/components/tracking/DailyStatusPicker";
import { useAuth } from "@/lib/auth";
import { useData } from "@/lib/data/store";
import type { DailyStatus, User } from "@/lib/data/types";

type SortKey = "name" | "tasks" | "hours";

const PROFILE_ICON: Record<string, LucideIcon> = {
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
  if (u.profile) return u.profile;
  if (u.isTester) return "qa";
  if (u.teamId === "team-design") return "designer";
  if (u.teamId === "team-frontend") return "frontend";
  if (u.teamId === "team-cloud") return "cloud";
  if (u.teamId === "team-backend") return "fullstack";
  return "backend";
}

function leaveOf(u: User): "active" | "on_leave" {
  return (u.leaveStatus as "active" | "on_leave") ?? "active";
}

export default function TrackingPage() {
  const { user, users } = useAuth();
  const { tasks, workLogs, projects, getDailyStatus } = useData();

  const [search, setSearch] = useState("");
  const [projectFilter, setProjectFilter] = useState("all");
  const [sortBy, setSortBy] = useState<SortKey>("tasks");
  const [profileFilter, setProfileFilter] = useState<string>("all");
  const [leaveFilter, setLeaveFilter] = useState<"all" | "active" | "on_leave">("all");
  const [dailyFilter, setDailyFilter] = useState<string>("all");
  const [filtersOpen, setFiltersOpen] = useState(false);
  const [modalEmployee, setModalEmployee] = useState<User | null>(null);

  const employees = useMemo(
    () => users.filter((u) => u.role === "employee"),
    [users]
  );
  const projectsById = useMemo(
    () => new Map(projects.map((p) => [p.id, p])),
    [projects]
  );

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
        (e) =>
          e.name.toLowerCase().includes(q) || e.email.toLowerCase().includes(q)
      );
    }

    if (projectFilter !== "all") {
      list = list.filter((e) =>
        tasks.some(
          (t) => t.assigneeId === e.id && t.projectId === projectFilter
        )
      );
    }

    if (profileFilter !== "all") {
      list = list.filter((e) => profileOf(e) === profileFilter);
    }

    if (leaveFilter !== "all") {
      list = list.filter((e) => leaveOf(e) === leaveFilter);
    }

    if (dailyFilter !== "all") {
      list = list.filter((e) => getDailyStatus(e.id) === dailyFilter);
    }

    list = [...list].sort((a, b) => {
      if (sortBy === "name") return a.name.localeCompare(b.name);
      if (sortBy === "hours") return hoursForUser(b.id) - hoursForUser(a.id);
      return tasksForUser(b.id).length - tasksForUser(a.id).length;
    });

    return list;
  }, [employees, search, projectFilter, profileFilter, leaveFilter, dailyFilter, sortBy, tasks, hoursForUser, tasksForUser, getDailyStatus]);

  // Global stats (independent of filters)
  const activeCount = employees.filter((e) => tasksForUser(e.id).length > 0).length;
  const idleCount = employees.length - activeCount;
  const qaCount = employees.filter((e) => e.isTester).length;

  const allEmployeeProjectIds = useMemo(() => {
    const ids = new Set<string>();
    for (const t of tasks) if (t.projectId) ids.add(t.projectId);
    return [...ids]
      .map((id) => projectsById.get(id)!)
      .filter(Boolean);
  }, [tasks, projectsById]);

  return (
    <div className="flex h-full flex-col">
      <Header
        title="Tracking"
        subtitle="All team members & their assignments"
        actionIcon={ClipboardCheck}
      />

      <div className="flex-1 space-y-4 overflow-y-auto px-4 py-4 pb-28">
        {/* Overview stat cards */}
        <div className="grid grid-cols-3 gap-3">
          <StatCard
            icon={Users}
            label="Total"
            value={employees.length}
            sub="Employees"
            tint="rgba(99,102,241,0.18)"
            iconTint="bg-[var(--accent-soft)] text-[var(--accent)]"
          />
          <StatCard
            icon={Activity}
            label="Active"
            value={activeCount}
            sub={`Working`}
            tint="rgba(16,185,129,0.16)"
            iconTint="bg-[var(--success)]/15 text-[var(--success)]"
          />
          <StatCard
            icon={Bug}
            label="QA Team"
            value={qaCount}
            sub="Engineers"
            tint="rgba(219,39,119,0.15)"
            iconTint="bg-pink-500/15 text-pink-600"
          />
        </div>

        {/* Team Filters — polished */}
        <div className="overflow-hidden rounded-2xl border border-[var(--border)] bg-[var(--surface)] shadow-sm">
          <div className="relative p-4">
            <div className="pointer-events-none absolute inset-0 opacity-[0.06]" style={{ background: `radial-gradient(600px 180px at 0% 0%, var(--accent) 0%, transparent 70%)` }} />
            <div className="relative flex items-center justify-between">
              <div className="flex items-center gap-3">
                <span className="flex h-9 w-9 items-center justify-center rounded-xl bg-[var(--accent)] text-[var(--bg)] shadow-md">
                  <Users size={16} />
                </span>
                <div>
                  <h3 className="text-sm font-bold leading-none text-[var(--text)]">Team Filters</h3>
                  <p className="mt-0.5 text-xs text-[var(--text-muted)]">Filter by profile & leave</p>
                </div>
              </div>
              {(profileFilter !== "all" || leaveFilter !== "all" || dailyFilter !== "all") ? (
                <button
                  type="button"
                  onClick={() => {
                    setProfileFilter("all");
                    setLeaveFilter("all");
                    setDailyFilter("all");
                  }}
                  className="rounded-full bg-[var(--text)] px-3.5 py-1.5 text-xs font-bold text-[var(--bg)] shadow-sm active:scale-95"
                >
                  Clear
                </button>
              ) : (
                <span className="rounded-full bg-[var(--surface-2)] px-3 py-1.5 text-xs font-bold text-[var(--text-muted)]">
                  {filteredEmployees.length}/{employees.length}
                </span>
              )}
            </div>
            {(profileFilter !== "all" || leaveFilter !== "all" || dailyFilter !== "all") && (
              <div className="mt-3 rounded-xl bg-[var(--accent-soft)] px-3 py-2">
                <p className="text-xs font-semibold text-[var(--accent)]">
                  Showing {filteredEmployees.length} of {employees.length} employees
                </p>
              </div>
            )}
          </div>

          <div className="border-t border-[var(--border)] bg-[var(--surface-2)]/40 p-3">
            <div className="grid grid-cols-1 gap-3">
              <div className="rounded-xl border border-[var(--border)]/60 bg-[var(--surface)] p-3 shadow-sm">
                <p className="mb-2.5 flex items-center gap-1.5 text-xs font-bold uppercase tracking-wider text-[var(--text-muted)]">
                  <Code size={13} /> Engineering
                </p>
                <div className="flex flex-wrap gap-2">
                  {[
                    { k: "frontend", label: "Frontend", Icon: Code, color: "#2563eb" },
                    { k: "backend", label: "Backend", Icon: Server, color: "#16a34a" },
                    { k: "fullstack", label: "Fullstack", Icon: Layers, color: "#0d9488" },
                  ].map(({ k, label, Icon, color }) => {
                    const count = employees.filter((e) => profileOf(e) === k).length;
                    const active = profileFilter === k;
                    return (
                      <button
                        key={k}
                        type="button"
                        onClick={() => setProfileFilter((prev) => (prev === k ? "all" : k))}
                        className={`group inline-flex items-center gap-1.5 rounded-xl px-3 py-2 text-xs font-bold transition-all active:scale-95 ${active ? "text-white shadow-md" : "bg-[var(--surface-2)] text-[var(--text)] hover:bg-[var(--surface)] border border-transparent hover:border-[var(--border)]"}`}
                        style={{ background: active ? color : undefined }}
                      >
                        <Icon size={13} style={{ color: active ? "white" : color }} />
                        <span>{label}</span>
                        <span className={`rounded-md px-1.5 py-0.5 text-[10px] font-bold ${active ? "bg-white/20 text-white" : "bg-[var(--surface)] text-[var(--text-muted)] border border-[var(--border)]"}`}>
                          {count}
                        </span>
                      </button>
                    );
                  })}
                </div>
              </div>

              <div className="rounded-xl border border-[var(--border)]/60 bg-[var(--surface)] p-3 shadow-sm">
                <p className="mb-2.5 flex items-center gap-1.5 text-xs font-bold uppercase tracking-wider text-[var(--text-muted)]">
                  <Palette size={13} /> Design & Ops
                </p>
                <div className="flex flex-wrap gap-2">
                  {[
                    { k: "designer", label: "Designer", Icon: Palette, color: "#b45309" },
                    { k: "qa", label: "QA", Icon: Bug, color: "#db2777" },
                    { k: "cloud", label: "Cloud", Icon: Cloud, color: "#0284c7" },
                  ].map(({ k, label, Icon, color }) => {
                    const count = employees.filter((e) => profileOf(e) === k).length;
                    const active = profileFilter === k;
                    return (
                      <button
                        key={k}
                        type="button"
                        onClick={() => setProfileFilter((prev) => (prev === k ? "all" : k))}
                        className={`group inline-flex items-center gap-1.5 rounded-xl px-3 py-2 text-xs font-bold transition-all active:scale-95 ${active ? "text-white shadow-md" : "bg-[var(--surface-2)] text-[var(--text)] hover:bg-[var(--surface)] border border-transparent hover:border-[var(--border)]"}`}
                        style={{ background: active ? color : undefined }}
                      >
                        <Icon size={13} style={{ color: active ? "white" : color }} />
                        <span>{label}</span>
                        <span className={`rounded-md px-1.5 py-0.5 text-[10px] font-bold ${active ? "bg-white/20 text-white" : "bg-[var(--surface)] text-[var(--text-muted)] border border-[var(--border)]"}`}>
                          {count}
                        </span>
                      </button>
                    );
                  })}
                </div>
                <div className="mt-3 flex flex-wrap gap-2 border-t border-[var(--border)]/50 pt-3">
                  {[
                    { v: "active" as const, label: "Active", count: employees.filter((e) => leaveOf(e) !== "on_leave").length, color: "#10b981", Icon: Check },
                    { v: "on_leave" as const, label: "On Leave", count: employees.filter((e) => leaveOf(e) === "on_leave").length, color: "#f59e0b", Icon: CalendarX },
                  ].map(({ v, label, count, color, Icon }) => {
                    const active = leaveFilter === v;
                    return (
                      <button
                        key={v}
                        type="button"
                        onClick={() => setLeaveFilter((prev) => (prev === v ? "all" : v))}
                        className={`inline-flex items-center gap-1.5 rounded-full px-3 py-1.5 text-xs font-bold transition-all active:scale-95 ${active ? "text-white shadow-sm" : "bg-[var(--surface-2)] border border-[var(--border)] text-[var(--text-muted)]"}`}
                        style={{ background: active ? color : undefined }}
                      >
                        <Icon size={12} style={{ color: active ? "white" : color }} />
                        {label} <span className={`rounded px-1 py-0.5 text-[10px] ${active ? "bg-white/20 text-white" : "bg-[var(--surface)] text-[var(--text-muted)]"}`}>{count}</span>
                      </button>
                    );
                  })}
                </div>
              </div>
            </div>
          </div>
        </div>

                {/* Unassigned Tasks Alert (only if exists) */}
        {unassignedTasks.length > 0 && (
          <div className="rounded-2xl border border-[var(--danger)]/20 bg-[var(--danger)]/5 p-4">
            <div className="mb-2.5 flex items-center gap-2">
              <span className="flex h-8 w-8 items-center justify-center rounded-lg bg-[var(--danger)]/15 text-[var(--danger)]">
                <UserX size={16} />
              </span>
              <p className="text-sm font-bold text-[var(--danger)]">
                {unassignedTasks.length} task{unassignedTasks.length > 1 ? "s" : ""} without assignee
              </p>
            </div>
            <div className="space-y-1.5">
              {unassignedTasks.slice(0, 3).map((t) => (
                <div key={t.id} className="flex items-center gap-2 rounded-lg bg-[var(--surface)] px-2.5 py-2">
                  <span className="shrink-0 rounded bg-[var(--danger)]/10 px-2 py-0.5 font-mono text-xs font-bold text-[var(--danger)]">
                    {t.ticketId}
                  </span>
                  <span className="truncate text-xs text-[var(--text)]">
                    {t.title}
                  </span>
                </div>
              ))}
              {unassignedTasks.length > 3 && (
                <p className="pl-2 text-xs text-[var(--text-muted)]">
                  +{unassignedTasks.length - 3} more unassigned...
                </p>
              )}
            </div>
          </div>
        )}

        {/* Search & Sort Controls */}

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
              className="w-full rounded-xl border border-[var(--border)] bg-[var(--surface)] py-3 pl-9 pr-3 text-sm text-[var(--text)] placeholder:text-[var(--text-muted)]/50 focus:border-[var(--accent)] focus:outline-none"
            />
          </div>
          <button
            type="button"
            onClick={() => setFiltersOpen(true)}
            className="flex w-full items-center justify-between rounded-xl border border-[var(--border)] bg-[var(--surface)] px-4 py-3 active:bg-[var(--surface-2)]"
          >
            <span className="flex items-center gap-2 text-xs font-semibold text-[var(--text)]">
              <span className="flex h-7 w-7 items-center justify-center rounded-lg bg-[var(--accent-soft)] text-[var(--accent)]">
                <Filter size={14} />
              </span>
              Filters
              {(projectFilter !== "all" || sortBy !== "tasks") && (
                <span className="rounded-full bg-[var(--accent)] px-1.5 py-0.5 text-[10px] font-bold text-[var(--bg)]">
                  {(projectFilter !== "all" ? 1 : 0) + (sortBy !== "tasks" ? 1 : 0)}
                </span>
              )}
            </span>
            <span className="flex items-center gap-2 text-xs text-[var(--text-muted)]">
              <span className="hidden sm:inline">
                {projectFilter === "all" ? "All projects" : projectsById.get(projectFilter)?.name ?? "Project"} ·{" "}
                {sortBy === "tasks" ? "Task count" : sortBy === "name" ? "Name" : "Hours"}
              </span>
              <SlidersHorizontal size={14} />
            </span>
          </button>
        </div>

        {filteredEmployees.length === 0 ? (
          <div className="flex flex-col items-center pt-12 text-center">
            <ClipboardCheck
              size={32}
              className="mb-3 text-[var(--text-muted)]/40"
            />
            <p className="text-sm text-[var(--text-muted)]">
              No employees match your filters.
            </p>
          </div>
        ) : (
          <div className="space-y-2">
            {filteredEmployees.map((emp) => {
              const empTasks = tasksForUser(emp.id);
              const activeTasks = empTasks.filter((t) => t.status !== "done");
              const doneTasks = empTasks.filter((t) => t.status === "done");
              const empHours = hoursForUser(emp.id);
              const isOpen = modalEmployee?.id === emp.id;

              return (
                <motion.div
                  key={emp.id}
                  initial={{ opacity: 0, y: 8 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ duration: 0.25 }}
                  className="overflow-hidden rounded-2xl border border-[var(--border)] bg-[var(--surface)] shadow-sm"
                >
                    <div className="flex items-center gap-3 px-4 py-3">
                    <Link
                      href={`/tracking/${emp.id}`}
                      aria-label={`View ${emp.name}'s profile`}
                      className="group relative shrink-0"
                    >
                      <span
                        className="relative flex h-10 w-10 items-center justify-center rounded-full text-sm font-bold text-white transition-transform group-hover:scale-105"
                        style={{ background: emp.avatarColor }}
                      >
                        {emp.initials}
                        <span
                          className={`pointer-events-none absolute -bottom-0.5 -right-0.5 h-3 w-3 rounded-full border-2 border-[var(--surface)] ${leaveOf(emp) === "on_leave" ? "bg-amber-500" : "bg-[var(--success)]"}`}
                        />
                      </span>
                      <span className="pointer-events-none absolute -inset-1 rounded-full bg-[var(--accent-soft)] opacity-0 transition-opacity group-hover:opacity-100" />
                    </Link>

                    <button
                      onClick={() =>
                        setModalEmployee(isOpen ? null : emp)
                      }
                      className="flex min-w-0 flex-1 items-center gap-3 text-left"
                      aria-label={`Open ${emp.name}'s details`}
                    >
                      <div className="min-w-0 flex-1">
                        <div className="flex items-center gap-1.5">
                          <p className="truncate text-sm font-semibold text-[var(--text)]">
                            {emp.name}
                          </p>
                          {(() => {
                            const pk = profileOf(emp);
                            const PIcon = PROFILE_ICON[pk] ?? Users;
                            return (
                              <span
                                className="flex h-5 w-5 shrink-0 items-center justify-center rounded-full text-white"
                                style={{ background: PROFILE_COLOR[pk] ?? "var(--text-muted)" }}
                                title={pk}
                              >
                                <PIcon size={11} />
                              </span>
                            );
                          })()}
                          {getDailyStatus(emp.id) && (
                            <DailyStatusIconBadge status={getDailyStatus(emp.id) as DailyStatus} showLabel={false} />
                          )}
                        </div>
                        <p className="mt-0.5 text-[11px] text-[var(--text-muted)]">
                          {empTasks.length === 0
                            ? "No tasks assigned"
                            : `${activeTasks.length} active · ${doneTasks.length} done`}
                        </p>
                      </div>
                      <div className="flex shrink-0 items-center gap-2">
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
                </motion.div>
              );
            })}
          </div>
        )}
      </div>

      <EmployeeDetailModal
        employee={modalEmployee}
        tasks={tasks}
        workLogs={workLogs}
        projects={projects}
        onClose={() => setModalEmployee(null)}
      />

      {/* Filters — same bottom-sheet pattern as detail modal */}
      <Sheet isOpen={filtersOpen} onClose={() => setFiltersOpen(false)} detent="content" disableScrollLocking>
        <Sheet.Container>
          <Sheet.Header>
            <Sheet.DragIndicator />
          </Sheet.Header>
          <Sheet.Content>
            <div className="px-5 pb-8 pt-1">
              <div className="mb-4 flex items-center justify-between">
                <p className="text-base font-bold text-[var(--text)]">Filters</p>
                <button
                  type="button"
                  onClick={() => {
                    setProjectFilter("all");
                    setSortBy("tasks");
                    setProfileFilter("all");
                    setLeaveFilter("all");
                    setDailyFilter("all");
                  }}
                  className="rounded-full bg-[var(--surface-2)] px-3 py-1 text-xs font-semibold text-[var(--text-muted)] active:bg-[var(--border)]"
                >
                  Clear
                </button>
              </div>

              {/* Project */}
              <div>
                <p className="mb-2 flex items-center gap-1.5 text-xs font-bold uppercase tracking-wider text-[var(--text-muted)]">
                  <Filter size={12} /> Project
                </p>
                <div className="space-y-1">
                  {[{ value: "all", label: "All projects" } as const, ...allEmployeeProjectIds.map((p) => ({ value: p.id, label: p.name, color: p.color } as const))].map((o) => {
                    const active = o.value === projectFilter;
                    return (
                      <button
                        key={o.value}
                        type="button"
                        onClick={() => setProjectFilter(o.value as string)}
                        className={`flex w-full items-center gap-3 rounded-xl px-4 py-3 text-left transition-colors ${active ? "bg-[var(--accent-soft)]" : "bg-[var(--surface)] active:bg-[var(--surface-2)]"}`}
                      >
                        <span className={`flex h-7 w-7 shrink-0 items-center justify-center rounded-lg ${active ? "bg-[var(--accent)]/15 text-[var(--accent)]" : "bg-[var(--surface-2)] text-[var(--text-muted)]"}`}>
                          {(o as unknown as { color?: string }).color ? (
                            <span className="h-2.5 w-2.5 rounded-full" style={{ background: (o as unknown as { color: string }).color }} />
                          ) : (
                            <Filter size={13} />
                          )}
                        </span>
                        <span className={`flex-1 text-sm font-medium ${active ? "text-[var(--accent)]" : "text-[var(--text)]"}`}>{o.label}</span>
                        {active && (
                          <span className="flex h-5 w-5 items-center justify-center rounded-full bg-[var(--accent)] text-[var(--bg)]">
                            <Check size={12} strokeWidth={3} />
                          </span>
                        )}
                      </button>
                    );
                  })}
                </div>
              </div>

              {/* Sort */}
              <div className="mt-5">
                <p className="mb-2 flex items-center gap-1.5 text-xs font-bold uppercase tracking-wider text-[var(--text-muted)]">
                  <SlidersHorizontal size={12} /> Sort by
                </p>
                <div className="space-y-1">
                  {[
                    { value: "tasks", label: "Task count" },
                    { value: "name", label: "Name" },
                    { value: "hours", label: "Hours" },
                  ].map((o) => {
                    const active = o.value === sortBy;
                    return (
                      <button
                        key={o.value}
                        type="button"
                        onClick={() => setSortBy(o.value as SortKey)}
                        className={`flex w-full items-center gap-3 rounded-xl px-4 py-3 text-left transition-colors ${active ? "bg-[var(--accent-soft)]" : "bg-[var(--surface)] active:bg-[var(--surface-2)]"}`}
                      >
                        <span className={`flex h-7 w-7 shrink-0 items-center justify-center rounded-lg ${active ? "bg-[var(--accent)]/15 text-[var(--accent)]" : "bg-[var(--surface-2)] text-[var(--text-muted)]"}`}>
                          <SlidersHorizontal size={13} />
                        </span>
                        <span className={`flex-1 text-sm font-medium ${active ? "text-[var(--accent)]" : "text-[var(--text)]"}`}>{o.label}</span>
                        {active && (
                          <span className="flex h-5 w-5 items-center justify-center rounded-full bg-[var(--accent)] text-[var(--bg)]">
                            <Check size={12} strokeWidth={3} />
                          </span>
                        )}
                      </button>
                    );
                  })}
                </div>
              </div>

              {/* Daily status — present/absent etc in filter menu */}
              <div className="mt-5">
                <p className="mb-2 flex items-center gap-1.5 text-xs font-bold uppercase tracking-wider text-[var(--text-muted)]">
                  <CalendarX size={12} /> Daily status
                </p>
                <div className="space-y-1">
                  {[
                    { value: "all" as const, label: "All statuses" },
                    { value: "present" as const, label: "Present" },
                    { value: "wfh" as const, label: "WFH" },
                    { value: "absent" as const, label: "Absent" },
                    { value: "on_leave" as const, label: "On Leave" },
                    { value: "half_day" as const, label: "Half Day" },
                  ].map((o) => {
                    const active = dailyFilter === o.value;
                    const meta =
                      o.value === "present"
                        ? "bg-[var(--success)]/15 text-[var(--success)]"
                        : o.value === "wfh"
                          ? "bg-sky-500/15 text-sky-600"
                          : o.value === "absent"
                            ? "bg-[var(--danger)]/15 text-[var(--danger)]"
                            : o.value === "on_leave"
                              ? "bg-amber-500/15 text-amber-600"
                              : o.value === "half_day"
                                ? "bg-violet-500/15 text-violet-500"
                                : "bg-[var(--surface-2)] text-[var(--text-muted)]";
                    const cnt = o.value === "all" ? employees.length : employees.filter((e) => getDailyStatus(e.id) === o.value).length;
                    return (
                      <button
                        key={o.value}
                        type="button"
                        onClick={() => setDailyFilter(o.value)}
                        className={`flex w-full items-center gap-3 rounded-xl px-4 py-3 text-left transition-colors ${active ? "bg-[var(--accent-soft)]" : "bg-[var(--surface)] active:bg-[var(--surface-2)]"}`}
                      >
                        <span className={`flex h-7 w-7 shrink-0 items-center justify-center rounded-lg ${active ? "bg-[var(--accent)]/15 text-[var(--accent)]" : meta}`}>
                          <CalendarX size={13} />
                        </span>
                        <span className={`flex-1 text-sm font-medium ${active ? "text-[var(--accent)]" : "text-[var(--text)]"}`}>
                          {o.label} · {cnt}
                        </span>
                        {active && (
                          <span className="flex h-5 w-5 items-center justify-center rounded-full bg-[var(--accent)] text-[var(--bg)]">
                            <Check size={12} strokeWidth={3} />
                          </span>
                        )}
                      </button>
                    );
                  })}
                </div>
              </div>

              <button
                type="button"
                onClick={() => setFiltersOpen(false)}
                className="mt-6 flex w-full items-center justify-center rounded-xl bg-[var(--accent)] py-3 text-sm font-bold text-[var(--bg)] shadow-lg shadow-[var(--accent-soft)] active:scale-[0.98]"
              >
                Show {filteredEmployees.length} employees
              </button>
            </div>
          </Sheet.Content>
        </Sheet.Container>
        <Sheet.Backdrop onTap={() => setFiltersOpen(false)} />
      </Sheet>
    </div>
  );
}

function StatCard({
  icon: Icon,
  label,
  value,
  sub,
  tint,
  iconTint,
}: {
  icon: LucideIcon;
  label: string;
  value: number;
  sub: string;
  tint: string;
  iconTint: string;
}) {
  return (
    <motion.div
      initial={{ opacity: 0, y: 12 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.3 }}
      whileTap={{ scale: 0.98 }}
      className="relative overflow-hidden rounded-2xl border border-[var(--border)] bg-[var(--surface)] p-3 shadow-sm"
    >
      <div
        className="pointer-events-none absolute inset-0"
        style={{
          background: `linear-gradient(225deg, ${tint} 0%, rgba(255,255,255,0) 70%)`,
        }}
      />
      <div className="relative flex items-center justify-center">
        <span
          className={`flex h-9 w-9 items-center justify-center rounded-xl ${iconTint}`}
        >
          <Icon size={18} />
        </span>
      </div>
      <p className="relative mt-2 text-center text-2xl font-bold text-[var(--text)]">
        {value}
      </p>
      <p className="relative mt-0.5 text-center text-[10px] font-bold uppercase tracking-wide text-[var(--text-muted)]">
        {label}
      </p>
      <p className="relative text-center text-[11px] text-[var(--text-muted)]">{sub}</p>
    </motion.div>
  );
}