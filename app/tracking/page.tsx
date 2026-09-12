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
import { DailyStatusBadge } from "@/components/tracking/DailyStatusPicker";
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
        {/* Proper stat cards */}
        <div className="grid grid-cols-2 gap-3">
          <StatCard
            icon={Users}
            label="Total Employees"
            value={employees.length}
            sub={
              qaCount > 0
                ? `${qaCount} QA engineer${qaCount > 1 ? "s" : ""}`
                : "No QA testers yet"
            }
            tint="rgba(99,102,241,0.18)"
            iconTint="bg-[var(--accent-soft)] text-[var(--accent)]"
          />
          <StatCard
            icon={Activity}
            label="Active Employees"
            value={activeCount}
            sub={`${idleCount} idle`}
            tint="rgba(16,185,129,0.16)"
            iconTint="bg-[var(--success)]/15 text-[var(--success)]"
          />
        </div>

        {/* Unassigned / idle detail chips */}
        <div className="grid grid-cols-2 gap-3">
          <DetailChip
            icon={UserX}
            label="Unassigned tasks"
            value={unassignedTasks.length}
            tone="text-[var(--danger)]"
            chipBg="bg-[var(--danger)]/10"
          />
          <DetailChip
            icon={Activity}
            label="Idle employees"
            value={idleCount}
            tone="text-[var(--text-muted)]"
            chipBg="bg-[var(--surface-2)]"
          />
        </div>

        {/* Profile & leave legend — tap to filter */}
        <div className="rounded-2xl border border-[var(--border)] bg-[var(--surface)] p-3">
          <div className="mb-2 flex items-center justify-between">
            <p className="flex items-center gap-1.5 text-xs font-bold uppercase tracking-wider text-[var(--text-muted)]">
              <Users size={12} /> Profiles & leave
            </p>
            {(profileFilter !== "all" || leaveFilter !== "all" || dailyFilter !== "all") && (
              <button
                type="button"
                onClick={() => {
                  setProfileFilter("all");
                  setLeaveFilter("all");
                  setDailyFilter("all");
                }}
                className="rounded-full bg-[var(--surface-2)] px-2.5 py-1 text-[11px] font-semibold text-[var(--text-muted)] active:bg-[var(--border)]"
              >
                Clear filters
              </button>
            )}
          </div>
          <div className="flex flex-wrap gap-1.5">
            {[
              { k: "frontend", label: "Frontend", Icon: Code, color: "#2563eb" },
              { k: "backend", label: "Backend", Icon: Server, color: "#16a34a" },
              { k: "fullstack", label: "Fullstack", Icon: Layers, color: "#0d9488" },
              { k: "cloud", label: "Cloud", Icon: Cloud, color: "#0284c7" },
              { k: "designer", label: "Designer", Icon: Palette, color: "#b45309" },
              { k: "qa", label: "QA", Icon: Bug, color: "#db2777" },
            ].map(({ k, label, Icon, color }) => {
              const count = employees.filter((e) => profileOf(e) === k).length;
              const active = profileFilter === k;
              return (
                <button
                  key={k}
                  type="button"
                  onClick={() => setProfileFilter((prev) => (prev === k ? "all" : k))}
                  className={`inline-flex items-center gap-1 rounded-full px-2.5 py-1 text-xs font-semibold text-white transition-all active:scale-95 ${active ? "ring-2 ring-[var(--accent)] ring-offset-1 ring-offset-[var(--surface)] scale-[1.02]" : ""}`}
                  style={{ background: color, opacity: active || profileFilter === "all" ? 1 : 0.45 }}
                >
                  <Icon size={12} />
                  {label} · {count}
                </button>
              );
            })}
          </div>
          <div className="mt-2 flex flex-wrap gap-1.5 text-[11px]">
            {[
              { v: "active" as const, label: "Active", bg: "bg-[var(--success)]/10 text-[var(--success)]", dot: "bg-[var(--success)]", count: employees.filter((e) => leaveOf(e) !== "on_leave").length },
              { v: "on_leave" as const, label: "On Leave", bg: "bg-amber-500/15 text-amber-600", dot: "", count: employees.filter((e) => leaveOf(e) === "on_leave").length, Icon: CalendarX },
            ].map(({ v, label, bg, dot, count, Icon }) => {
              const active = leaveFilter === v;
              return (
                <button
                  key={v}
                  type="button"
                  onClick={() => setLeaveFilter((prev) => (prev === v ? "all" : v))}
                  className={`inline-flex items-center gap-1 rounded-full px-2 py-1 font-semibold transition-all active:scale-95 ${bg} ${active ? "ring-2 ring-[var(--accent)] ring-offset-1 ring-offset-[var(--surface)]" : ""}`}
                  style={{ opacity: active || leaveFilter === "all" ? 1 : 0.45 }}
                >
                  {dot ? <span className={`h-2 w-2 rounded-full ${dot}`} /> : Icon ? <Icon size={12} /> : null}
                  {label} · {count}
                </button>
              );
            })}
          </div>
          <div className="mt-2 flex flex-wrap gap-1.5">
            {(
              [
                { s: "present" as const, label: "Present" },
                { s: "wfh" as const, label: "WFH" },
                { s: "absent" as const, label: "Absent" },
                { s: "half_day" as const, label: "Half Day" },
                { s: "on_leave" as const, label: "On Leave (daily)" },
              ] as const
            ).map(({ s, label }) => {
              const cnt = employees.filter((e) => getDailyStatus(e.id) === s).length;
              if (cnt === 0 && dailyFilter !== s) return null;
              const active = dailyFilter === s;
              const meta =
                s === "present"
                  ? "bg-[var(--success)]/15 text-[var(--success)]"
                  : s === "wfh"
                    ? "bg-sky-500/15 text-sky-600"
                    : s === "absent"
                      ? "bg-[var(--danger)]/15 text-[var(--danger)]"
                      : s === "on_leave"
                        ? "bg-amber-500/15 text-amber-600"
                        : "bg-violet-500/15 text-violet-500";
              return (
                <button
                  key={s}
                  type="button"
                  onClick={() => setDailyFilter((prev) => (prev === s ? "all" : s))}
                  className={`inline-flex items-center gap-1 rounded-full px-2 py-1 text-[11px] font-semibold transition-all active:scale-95 ${meta} ${active ? "ring-2 ring-[var(--accent)] ring-offset-1 ring-offset-[var(--surface)]" : ""}`}
                  style={{ opacity: active || dailyFilter === "all" ? 1 : 0.45 }}
                >
                  {label} · {cnt}
                </button>
              );
            })}
            {!employees.some((e) => getDailyStatus(e.id)) && dailyFilter === "all" && (
              <span className="text-[11px] text-[var(--text-muted)]">No daily status set yet — each employee can set it from Profile.</span>
            )}
          </div>
          {(profileFilter !== "all" || leaveFilter !== "all" || dailyFilter !== "all") && (
            <p className="mt-2 text-[11px] text-[var(--text-muted)]">
              Showing {filteredEmployees.length} of {employees.length} employees
            </p>
          )}
        </div>

        {unassignedTasks.length > 0 ? (
          <div className="rounded-2xl border border-[var(--danger)]/20 bg-[var(--danger)]/5 p-3">
            <div className="flex items-center gap-2">
              <UserX size={15} className="shrink-0 text-[var(--danger)]" />
              <p className="text-xs font-semibold text-[var(--danger)]">
                {unassignedTasks.length} task
                {unassignedTasks.length > 1 ? "s" : ""} without an assignee
              </p>
            </div>
            <div className="mt-2 space-y-1">
              {unassignedTasks.slice(0, 3).map((t) => (
                <div key={t.id} className="flex items-center gap-2 text-[11px]">
                  <span className="shrink-0 rounded bg-[var(--surface-2)] px-1 py-0.5 font-mono font-bold text-[var(--text-muted)]">
                    {t.ticketId}
                  </span>
                  <span className="truncate text-[var(--text-muted)]">
                    {t.title}
                  </span>
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
          <button
            type="button"
            onClick={() => setFiltersOpen(true)}
            className="flex w-full items-center justify-between rounded-xl border border-[var(--border)] bg-[var(--surface)] px-3.5 py-2.5 active:bg-[var(--surface-2)]"
          >
            <span className="flex items-center gap-2 text-xs font-semibold text-[var(--text)]">
              <span className="flex h-7 w-7 items-center justify-center rounded-lg bg-[var(--accent-soft)] text-[var(--accent)]">
                <Filter size={14} />
              </span>
              Filters
              {(projectFilter !== "all" || sortBy !== "tasks") && (
                <span className="rounded-full bg-[var(--accent)] px-1.5 py-0.5 text-[10px] font-bold text-white">
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
                    <div className="flex items-center gap-3 px-3.5 py-3">
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
                        <div className="flex flex-wrap items-center gap-1.5">
                          <p className="truncate text-sm font-semibold text-[var(--text)]">
                            {emp.name}
                          </p>
                          {(() => {
                            const pk = profileOf(emp);
                            const PIcon = PROFILE_ICON[pk] ?? Users;
                            return (
                              <span
                                className="inline-flex shrink-0 items-center gap-1 rounded-full px-1.5 py-0.5 text-[10px] font-semibold text-white"
                                style={{ background: PROFILE_COLOR[pk] ?? "var(--text-muted)" }}
                              >
                                <PIcon size={11} />
                                {pk === "qa" ? "QA" : pk === "designer" ? "Designer" : pk === "frontend" ? "Frontend" : pk === "backend" ? "Backend" : pk === "fullstack" ? "Fullstack" : "Cloud"}
                              </span>
                            );
                          })()}
                          {leaveOf(emp) === "on_leave" ? (
                            <span className="inline-flex items-center gap-1 rounded-full bg-amber-500/15 px-1.5 py-0.5 text-[10px] font-semibold text-amber-600">
                              <CalendarX size={11} />
                              On Leave
                            </span>
                          ) : (
                            <span className="hidden sm:inline-flex items-center gap-1 rounded-full bg-[var(--success)]/10 px-1.5 py-0.5 text-[10px] font-semibold text-[var(--success)]">
                              Active
                            </span>
                          )}
                          <DailyStatusBadge status={getDailyStatus(emp.id)} />
                        </div>
                        <p className="mt-0.5 text-[11px] text-[var(--text-muted)]">
                          {empTasks.length === 0
                            ? "No tasks assigned"
                            : `${activeTasks.length} active \u00b7 ${doneTasks.length} done`}
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
                        className={`flex w-full items-center gap-3 rounded-xl px-3.5 py-3 text-left transition-colors ${active ? "bg-[var(--accent-soft)]" : "bg-[var(--surface)] active:bg-[var(--surface-2)]"}`}
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
                          <span className="flex h-5 w-5 items-center justify-center rounded-full bg-[var(--accent)] text-white">
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
                        className={`flex w-full items-center gap-3 rounded-xl px-3.5 py-3 text-left transition-colors ${active ? "bg-[var(--accent-soft)]" : "bg-[var(--surface)] active:bg-[var(--surface-2)]"}`}
                      >
                        <span className={`flex h-7 w-7 shrink-0 items-center justify-center rounded-lg ${active ? "bg-[var(--accent)]/15 text-[var(--accent)]" : "bg-[var(--surface-2)] text-[var(--text-muted)]"}`}>
                          <SlidersHorizontal size={13} />
                        </span>
                        <span className={`flex-1 text-sm font-medium ${active ? "text-[var(--accent)]" : "text-[var(--text)]"}`}>{o.label}</span>
                        {active && (
                          <span className="flex h-5 w-5 items-center justify-center rounded-full bg-[var(--accent)] text-white">
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
                className="mt-6 flex w-full items-center justify-center rounded-xl bg-[var(--accent)] py-3 text-sm font-bold text-white shadow-lg shadow-[var(--accent-soft)] active:scale-[0.98]"
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
      className="relative overflow-hidden rounded-2xl border border-[var(--border)] bg-[var(--surface)] p-3.5 shadow-sm"
    >
      <div
        className="pointer-events-none absolute inset-0"
        style={{
          background: `linear-gradient(225deg, ${tint} 0%, rgba(255,255,255,0) 70%)`,
        }}
      />
      <div className="relative flex items-center gap-2">
        <span
          className={`flex h-8 w-8 items-center justify-center rounded-xl ${iconTint}`}
        >
          <Icon size={16} />
        </span>
        <p className="text-[11px] font-semibold uppercase tracking-wide text-[var(--text-muted)]">
          {label}
        </p>
      </div>
      <p className="relative mt-2 text-3xl font-bold text-[var(--text)]">
        {value}
      </p>
      <p className="relative mt-0.5 text-xs text-[var(--text-muted)]">{sub}</p>
    </motion.div>
  );
}

function DetailChip({
  icon: Icon,
  label,
  value,
  tone,
  chipBg,
}: {
  icon: LucideIcon;
  label: string;
  value: number;
  tone: string;
  chipBg: string;
}) {
  return (
    <div className="flex items-center gap-2.5 rounded-2xl border border-[var(--border)] bg-[var(--surface)] px-3 py-2.5">
      <span
        className={`flex h-8 w-8 shrink-0 items-center justify-center rounded-xl ${chipBg} ${tone}`}
      >
        <Icon size={15} />
      </span>
      <div className="min-w-0">
        <p className="text-sm font-bold text-[var(--text)]">{value}</p>
        <p className="truncate text-[11px] text-[var(--text-muted)]">{label}</p>
      </div>
    </div>
  );
}