"use client";

import { useMemo, useRef, useState } from "react";
import {
  CheckCheck,
  ChevronDown,
  ClipboardList,
  Filter,
  Plus,
  Search,
  SlidersHorizontal,
  Sparkles,
  Users,
} from "lucide-react";
import { Header } from "@/components/layout/Header";
import { TaskCard, type TaskAction } from "@/components/tasks/TaskCard";
import { AddTaskSheet } from "@/components/tasks/AddTaskSheet";
import { LogHoursSheet } from "@/components/tasks/LogHoursSheet";
import { DeleteNoteSheet } from "@/components/tasks/DeleteNoteSheet";
import { NoteSheet } from "@/components/tasks/NoteSheet";
import { PickerDropdown } from "@/components/layout/PickerDropdown";
import { StandupPrompt } from "@/components/integrations/StandupPrompt";
import { useAuth } from "@/lib/auth";
import { useData } from "@/lib/data/store";
import { useCan, useRole } from "@/lib/permissions";
import type { Task } from "@/lib/data/types";

type NotePurpose = "fail" | "moveback" | "approve";
type SortKey = "name" | "hours" | "tasks";

function isTesterUser(role: string, isTesterFlag: boolean): boolean {
  return role === "admin" || role === "manager" || isTesterFlag;
}

function todayIso(): string {
  return new Date().toISOString().slice(0, 10);
}

export default function TodayPage() {
  const { user, users } = useAuth();
  const role = useRole();
  const can = useCan();
  const {
    tasks,
    workLogs,
    projects,
    teams,
    addTask,
    startTask,
    submitForTesting,
    startTesting,
    approveTask,
    failTask,
    reworkTask,
    requestMoveBack,
    approveMoveBack,
    toggleTask,
    deleteTask,
    logHours,
  } = useData();

  const [sheetOpen, setSheetOpen] = useState(false);
  const [showCompleted, setShowCompleted] = useState(true);
  const [startTarget, setStartTarget] = useState<Task | null>(null);
  const [submitTarget, setSubmitTarget] = useState<Task | null>(null);
  const [logTarget, setLogTarget] = useState<Task | null>(null);
  const [deleteTarget, setDeleteTarget] = useState<Task | null>(null);
  const [noteTarget, setNoteTarget] = useState<{ task: Task; purpose: NotePurpose } | null>(null);
  const [toast, setToast] = useState<string | null>(null);
  const toastTimer = useRef<ReturnType<typeof setTimeout> | null>(null);
  const submitQueue = useRef<Task[] | null>(null);

  // PM view state
  const [search, setSearch] = useState("");
  const [projectFilter, setProjectFilter] = useState("all");
  const [sortBy, setSortBy] = useState<SortKey>("hours");
  const [openEmployee, setOpenEmployee] = useState<string | null>(null);

  const me = user!;
  const isTester = isTesterUser(role, me.isTester);
  const isPMView = can.canViewAllData;

  const scopedTasks = useMemo(() => {
    if (can.canViewAllData) return tasks;
    if (me.isTester) {
      return tasks.filter(
        (t) =>
          t.assigneeId === me.id ||
          t.createdById === me.id ||
          t.status === "ready_for_testing" ||
          t.status === "in_testing"
      );
    }
    return tasks.filter(
      (t) => t.assigneeId === me.id || t.createdById === me.id
    );
  }, [tasks, can.canViewAllData, me.id, me.isTester]);

  const pending = useMemo(
    () => scopedTasks.filter((t) => t.status !== "done"),
    [scopedTasks]
  );
  const completed = useMemo(
    () => scopedTasks.filter((t) => t.status === "done"),
    [scopedTasks]
  );
  const inProgressCount = pending.filter((t) => t.status === "in_progress").length;

  const usersById = useMemo(() => new Map(users.map((u) => [u.id, u])), [users]);
  const projectsById = useMemo(() => new Map(projects.map((p) => [p.id, p])), [projects]);

  const assignableUsers = useMemo(() => {
    if (can.canViewAllData || role === "manager") return users;
    const myTeam = teams.find((t) => t.id === me.teamId);
    const teamIds = new Set([me.id, ...(myTeam?.memberIds ?? [])]);
    return users.filter((u) => teamIds.has(u.id));
  }, [users, teams, can.canViewAllData, role, me.id, me.teamId]);

  const today = todayIso();

  const canLogOn = (task: Task) =>
    can.canSeeOtherHours || task.assigneeId === me.id || task.createdById === me.id;

  const hoursForTask = (task: Task) =>
    workLogs
      .filter((l) => l.taskId === task.id && (can.canSeeOtherHours ? true : l.userId === me.id))
      .reduce((s, l) => s + l.hours, 0);

  const hoursForUser = (userId: string) =>
    workLogs
      .filter((l) => l.userId === userId)
      .reduce((s, l) => s + l.hours, 0);

  const showToast = (message: string) => {
    if (toastTimer.current) clearTimeout(toastTimer.current);
    setToast(message);
    toastTimer.current = setTimeout(() => setToast(null), 2600);
  };

  const isOwner = (task: Task) => task.assigneeId === me.id || task.createdById === me.id;
  const canManage = role === "admin" || role === "manager";

  const getActions = (task: Task): TaskAction[] => {
    const a: TaskAction[] = [];
    switch (task.status) {
      case "todo":
        if (canManage || isOwner(task)) a.push({ key: "start", label: "Start", tone: "primary" });
        break;
      case "in_progress":
        if (canManage || isOwner(task)) a.push({ key: "submit", label: "Submit for testing", tone: "primary" });
        break;
      case "ready_for_testing":
        if (isTester || canManage) a.push({ key: "test", label: "Take into testing", tone: "primary" });
        if (isOwner(task) && !isTester) a.push({ key: "requestMoveBack", label: "Request move back", tone: "subtle" });
        break;
      case "in_testing":
        if (isTester || canManage) {
          if (task.moveRequest) a.push({ key: "approveMoveBack", label: "Approve move back", tone: "subtle" });
          a.push({ key: "approve", label: "Approve", tone: "success" });
          a.push({ key: "fail", label: "Fail", tone: "danger" });
        }
        if (isOwner(task) && !isTester) a.push({ key: "requestMoveBack", label: "Request move back", tone: "subtle" });
        break;
      case "failed":
        if (isOwner(task)) a.push({ key: "rework", label: "Rework", tone: "primary" });
        break;
      case "done":
        if (isTester || canManage) a.push({ key: "reopenTask", label: "Reopen", tone: "subtle" });
        break;
    }
    return a;
  };

  const handleAction = (task: Task, action: string) => {
    switch (action) {
      case "start": setStartTarget(task); break;
      case "submit": setSubmitTarget(task); break;
      case "test": { const r = startTesting(task.id); showToast(r.message); break; }
      case "approve": setNoteTarget({ task, purpose: "approve" }); break;
      case "fail": setNoteTarget({ task, purpose: "fail" }); break;
      case "rework": { const r = reworkTask(task.id); showToast(r.message); break; }
      case "requestMoveBack": setNoteTarget({ task, purpose: "moveback" }); break;
      case "approveMoveBack": { const r = approveMoveBack(task.id); showToast(r.message); break; }
      case "reopenTask": { const r = toggleTask(task.id); showToast(r.message); break; }
    }
  };

  const onNoteSave = (note: string) => {
    if (!noteTarget) return;
    const { task, purpose } = noteTarget;
    let r: ReturnType<typeof approveTask>;
    if (purpose === "fail") r = failTask(task.id, note);
    else if (purpose === "moveback") r = requestMoveBack(task.id, note);
    else r = approveTask(task.id, note);
    showToast(r.message);
    setNoteTarget(null);
  };

  const submitNext = () => {
    if (!submitQueue.current || submitQueue.current.length === 0) {
      submitQueue.current = null;
      return;
    }
    const next = submitQueue.current[0];
    submitQueue.current = submitQueue.current.slice(1);
    if (next && next.status === "in_progress" && isOwner(next)) {
      setSubmitTarget(next);
    } else {
      submitNext();
    }
  };

  const submitAllInProgress = () => {
    const targets = scopedTasks.filter((t) => t.status === "in_progress" && (canManage || isOwner(t)));
    if (targets.length === 0) { showToast("Nothing ready to submit"); return; }
    submitQueue.current = targets;
    submitNext();
  };

  const handleAdd = (input: { title: string; source: "Manual" | "Assigned"; assigneeId: string | null; projectId: string | null; kind: import("@/lib/data/types").TaskKind; module: string | null; estimatedHours: number | null }) => {
    addTask(input);
    setSheetOpen(false);
    showToast("Task added");
  };

  const onDelete = (task: Task) => {
    const r = deleteTask(task.id);
    if (r.ok) return showToast(r.message);
    if (r.code === "note") return setDeleteTarget(task);
    showToast(r.message);
  };

  const confirmDelete = (note?: string) => {
    if (!deleteTarget) return;
    const r = deleteTask(deleteTarget.id, note);
    showToast(r.message);
    setDeleteTarget(null);
  };

  const notePurposeMeta = (p: NotePurpose) => {
    if (p === "fail") return { title: "Fail ticket", subtitle: "Mark this ticket as failed. The note is shown to the developer & PM.", required: true, confirm: "Fail ticket", tone: "danger" as const };
    if (p === "moveback") return { title: "Request move back", subtitle: "Send a move-back request to QA. The ticket can't move back on its own.", required: true, confirm: "Send request", tone: "primary" as const };
    return { title: "Approve ticket", subtitle: "Approve this ticket and move it to Done.", required: false, confirm: "Approve", tone: "primary" as const };
  };

  const ordered = useMemo(() => {
    const order: Record<Task["status"], number> = { todo: 0, in_progress: 1, ready_for_testing: 2, in_testing: 3, failed: 4, done: 5 };
    return [...scopedTasks].sort((a, b) => order[a.status] - order[b.status]);
  }, [scopedTasks]);

  // --- PM team data ---
  const employees = useMemo(() => users.filter((u) => u.role === "employee"), [users]);

  const employeeTaskMap = useMemo(() => {
    const map = new Map<string, Task[]>();
    for (const emp of employees) {
      map.set(
        emp.id,
        tasks.filter((t) => t.assigneeId === emp.id)
      );
    }
    return map;
  }, [employees, tasks]);

  const employeeProjectsMap = useMemo(() => {
    const map = new Map<string, Set<string>>();
    for (const emp of employees) {
      const ids = new Set<string>();
      for (const t of employeeTaskMap.get(emp.id) ?? []) {
        if (t.projectId) ids.add(t.projectId);
      }
      map.set(emp.id, ids);
    }
    return map;
  }, [employees, employeeTaskMap]);

  const filteredEmployees = useMemo(() => {
    let list = employees;

    // Name search
    if (search.trim()) {
      const q = search.toLowerCase();
      list = list.filter(
        (e) => e.name.toLowerCase().includes(q) || e.email.toLowerCase().includes(q)
      );
    }

    // Project filter
    if (projectFilter !== "all") {
      list = list.filter((e) => employeeProjectsMap.get(e.id)?.has(projectFilter));
    }

    // Sort
    list = [...list].sort((a, b) => {
      if (sortBy === "name") return a.name.localeCompare(b.name);
      if (sortBy === "hours") return hoursForUser(b.id) - hoursForUser(a.id);
      const aCount = (employeeTaskMap.get(a.id) ?? []).filter((t) => t.status !== "done").length;
      const bCount = (employeeTaskMap.get(b.id) ?? []).filter((t) => t.status !== "done").length;
      return bCount - aCount;
    });

    return list;
  }, [employees, search, projectFilter, sortBy, employeeProjectsMap, employeeTaskMap, hoursForUser]);

  const busyCount = filteredEmployees.filter((e) => hoursForUser(e.id) >= 6).length;
  const idleCount = filteredEmployees.filter((e) => (employeeTaskMap.get(e.id) ?? []).length === 0).length;

  const allEmployeeProjects = useMemo(() => {
    const seen = new Set<string>();
    for (const emp of employees) {
      for (const pId of employeeProjectsMap.get(emp.id) ?? []) seen.add(pId);
    }
    return projects.filter((p) => seen.has(p.id));
  }, [employees, employeeProjectsMap, projects]);

  // --- Render ---
  return (
    <div className="flex h-full flex-col">
      <Header
        title="Today"
        subtitle={new Date().toLocaleDateString("en-US", { weekday: "long", month: "long", day: "numeric" })}
        actionIcon={isPMView ? undefined : Plus}
        onAction={isPMView ? undefined : () => setSheetOpen(true)}
        actionLabel={isPMView ? undefined : "Add ticket"}
      />

      <div className="flex-1 overflow-y-auto px-4 py-4 pb-28">
        {isPMView ? null : (
          <div className="mb-3">
            <StandupPrompt />
          </div>
        )}
        {isPMView ? (
          /* ================= PM TEAM VIEW ================= */
          <div className="space-y-4">
            {/* Summary cards */}
            <div className="grid grid-cols-3 gap-2">
              {[
                { label: "Team", value: filteredEmployees.length },
                { label: "Busy (6h+)", value: busyCount },
                { label: "Idle", value: idleCount },
              ].map((s) => (
                <div key={s.label} className="rounded-xl border border-[var(--border)] bg-[var(--surface)] p-2.5 text-center">
                  <p className="text-lg font-bold text-[var(--text)]">{s.value}</p>
                  <p className="text-[11px] text-[var(--text-muted)]">{s.label}</p>
                </div>
              ))}
            </div>

            {/* Filter bar */}
            <div className="space-y-2">
              <div className="relative">
                <Search size={15} className="absolute left-3 top-1/2 -translate-y-1/2 text-[var(--text-muted)]" />
                <input
                  value={search}
                  onChange={(e) => setSearch(e.target.value)}
                  placeholder="Search by name…"
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
                    { value: "all", label: "All projects" },
                    ...allEmployeeProjects.map((p) => ({
                      value: p.id,
                      label: p.name,
                      color: p.color,
                    })),
                  ]}
                />
                <PickerDropdown
                  label="Sort"
                  value={sortBy}
                  onChange={(v) => setSortBy(v as SortKey)}
                  icon={<SlidersHorizontal size={13} />}
                  placeholder="Sort"
                  options={[
                    { value: "hours", label: "Sort by hours" },
                    { value: "name", label: "Sort by name" },
                    { value: "tasks", label: "Sort by task count" },
                  ]}
                />
              </div>
            </div>

            {/* Employee accordions */}
            {filteredEmployees.length === 0 ? (
              <div className="flex flex-col items-center pt-12 text-center">
                <Users size={32} className="mb-3 text-[var(--text-muted)]/40" />
                <p className="text-sm text-[var(--text-muted)]">No employees match your filters.</p>
              </div>
            ) : (
              <div className="space-y-2">
                {filteredEmployees.map((emp, i) => {
                  const empTasks = employeeTaskMap.get(emp.id) ?? [];
                  const empProjectIds = employeeProjectsMap.get(emp.id) ?? new Set();
                  const activeTasks = empTasks.filter((t) => t.status !== "done");
                  const doneTasks = empTasks.filter((t) => t.status === "done");
                  const empHours = hoursForUser(emp.id);
                  const isOpen = openEmployee === emp.id;
                  const projectNames = [...empProjectIds].map((pId) => projectsById.get(pId)?.name ?? pId);

                  return (
                    <div
                      key={emp.id}
                      className="overflow-hidden rounded-2xl border border-[var(--border)] bg-[var(--surface)] shadow-sm"
                    >
                      {/* Accordion header */}
                      <button
                        onClick={() => setOpenEmployee(isOpen ? null : emp.id)}
                        className="flex w-full items-center gap-3 px-3.5 py-3 text-left"
                      >
                        <span
                          className="flex h-10 w-10 shrink-0 items-center justify-center rounded-full text-sm font-bold text-white"
                          style={{ background: emp.avatarColor }}
                        >
                          {emp.initials}
                        </span>
                        <div className="min-w-0 flex-1">
                          <div className="flex items-center gap-1.5">
                            <p className="truncate text-sm font-semibold text-[var(--text)]">{emp.name}</p>
                            {emp.isTester ? (
                              <span className="shrink-0 rounded-full bg-violet-500/15 px-1.5 py-0.5 text-[10px] font-semibold text-violet-500">QA</span>
                            ) : null}
                          </div>
                          <p className="text-[11px] text-[var(--text-muted)]">
                            {activeTasks.length} active · {projectNames.length > 0 ? projectNames.join(", ") : "No project"}
                          </p>
                        </div>
                        <div className="flex shrink-0 items-center gap-2">
                          <span className={`text-xs font-bold ${empHours >= 8 ? "text-[var(--success)]" : empHours >= 5 ? "text-[var(--accent)]" : "text-[var(--text-muted)]"}`}>
                            {empHours}h
                          </span>
                          {empHours >= 6 ? (
                            <span className="h-2 w-2 rounded-full bg-[var(--success)]" />
                          ) : empHours === 0 ? (
                            <span className="h-2 w-2 rounded-full bg-[var(--text-muted)]/30" />
                          ) : null}
                          <ChevronDown size={16} className={`shrink-0 text-[var(--text-muted)] transition-transform duration-200 ${isOpen ? "rotate-180" : ""}`} />
                        </div>
                      </button>

                      {/* Accordion body */}
                      {isOpen ? (
                        <div className="border-t border-[var(--border)] px-3.5 pb-3 pt-2.5">
                          {empTasks.length === 0 ? (
                            <p className="py-4 text-center text-sm text-[var(--text-muted)]">No tickets assigned.</p>
                          ) : (
                            <div className="space-y-2">
                              {activeTasks.length > 0 ? (
                                <p className="px-0.5 text-[11px] font-semibold uppercase tracking-wide text-[var(--text-muted)]">Active</p>
                              ) : null}
                              {activeTasks.map((t) => (
                                <TaskCard
                                  key={t.id}
                                  task={t}
                                  assigneeName={emp.name}
                                  hours={hoursForTask(t)}
                                  actions={getActions(t)}
                                  onAction={handleAction}
                                  onDelete={onDelete}
                                  onLogHours={canLogOn(t) ? () => setLogTarget(t) : undefined}
                                />
                              ))}

                              {doneTasks.length > 0 ? (
                                <p className="mt-1 px-0.5 pt-1 text-[11px] font-semibold uppercase tracking-wide text-[var(--text-muted)]">
                                  Done · {doneTasks.length}
                                </p>
                              ) : null}
                            </div>
                          )}

                          {/* Hour summary bar */}
                          <div className="mt-3 rounded-xl bg-[var(--surface-2)] px-3 py-2">
                            <div className="flex items-center justify-between text-[11px]">
                              <span className="text-[var(--text-muted)]">Hours logged</span>
                              <span className={`font-semibold ${empHours >= 8 ? "text-[var(--success)]" : empHours >= 5 ? "text-[var(--accent)]" : "text-[var(--text-muted)]"}`}>
                                {empHours}h / 8h
                              </span>
                            </div>
                            <div className="mt-1.5 h-1.5 w-full overflow-hidden rounded-full bg-black/5">
                              <div
                                className={`h-full rounded-full transition-all ${empHours >= 8 ? "bg-[var(--success)]" : empHours >= 5 ? "bg-[var(--accent)]" : "bg-[var(--text-muted)]/30"}`}
                                style={{ width: `${Math.min(100, (empHours / 8) * 100)}%` }}
                              />
                            </div>
                          </div>
                        </div>
                      ) : null}
                    </div>
                  );
                })}
              </div>
            )}
          </div>
        ) : (
          /* ================= INDIVIDUAL VIEW ================= */
          scopedTasks.length === 0 ? (
            <div className="flex flex-col items-center justify-center px-6 pt-16 text-center">
              <div className="mb-4 flex h-20 w-20 items-center justify-center rounded-3xl bg-[var(--accent-soft)]">
                <ClipboardList size={40} className="text-[var(--accent)]" />
              </div>
              <h3 className="text-lg font-bold text-[var(--text)]">No tickets yet</h3>
              <p className="mt-1 max-w-[260px] text-sm text-[var(--text-muted)]">
                Tap the + button to add your first ticket.
              </p>
              <button
                onClick={() => setSheetOpen(true)}
                className="mt-5 rounded-xl bg-[var(--accent)] px-6 py-3 text-sm font-semibold text-white shadow-lg shadow-[var(--accent-soft)] transition-transform active:scale-[0.98]"
              >
                Add a ticket
              </button>
            </div>
          ) : (
            <div className="space-y-5">
              <section className="space-y-2.5">
                <div className="mb-1 flex items-center gap-2 px-1">
                  <Sparkles size={15} className="text-[var(--accent)]" />
                  <h2 className="text-sm font-semibold text-[var(--text-muted)]">
                    {me.isTester ? "Testing & work" : "Your tickets"} · {scopedTasks.length}
                  </h2>
                </div>

                {ordered.map((task) => (
                  <TaskCard
                    key={task.id}
                    task={task}
                    assigneeName={usersById.get(task.assigneeId ?? "")?.name}
                    hours={hoursForTask(task)}
                    actions={getActions(task)}
                    onAction={handleAction}
                    onDelete={onDelete}
                    onLogHours={canLogOn(task) ? () => setLogTarget(task) : undefined}
                  />
                ))}

                {inProgressCount > 0 && !me.isTester ? (
                  <div className="pt-3">
                    <button
                      onClick={submitAllInProgress}
                      className="flex w-full items-center justify-center gap-2 rounded-2xl bg-[var(--accent)] py-4 text-[15px] font-semibold text-white shadow-lg shadow-[var(--accent-soft)] transition-transform active:scale-[0.98]"
                    >
                      <ClipboardList size={18} />
                      Submit in-progress ({inProgressCount}) for testing
                    </button>
                  </div>
                ) : null}
              </section>

              {pending.length === 0 ? (
                <p className="px-1 text-sm text-[var(--text-muted)]">All done for now — nice work!</p>
              ) : null}

              {completed.length > 0 ? (
                <section className="border-t border-[var(--border)] pt-4">
                  <button
                    onClick={() => setShowCompleted((s) => !s)}
                    className="mb-2 flex w-full items-center justify-between px-1"
                  >
                    <span className="flex items-center gap-2">
                      <CheckCheck size={15} className="text-[var(--success)]" />
                      <h2 className="text-sm font-semibold text-[var(--text-muted)]">Approved · {completed.length}</h2>
                    </span>
                    <ChevronDown size={18} className={`text-[var(--text-muted)] transition-transform duration-200 ${showCompleted ? "rotate-180" : ""}`} />
                  </button>
                  {showCompleted ? (
                    <div className="space-y-2.5">
                      {completed.map((task) => (
                        <TaskCard
                          key={task.id}
                          task={task}
                          assigneeName={usersById.get(task.assigneeId ?? "")?.name}
                          hours={hoursForTask(task)}
                          actions={getActions(task)}
                          onAction={handleAction}
                          onDelete={onDelete}
                        />
                      ))}
                    </div>
                  ) : null}
                </section>
              ) : null}
            </div>
          )
        )}
      </div>

      <AddTaskSheet
        open={sheetOpen}
        onClose={() => setSheetOpen(false)}
        onAdd={handleAdd}
        assignableUsers={assignableUsers}
        projects={projects}
      />

      <LogHoursSheet
        open={!!startTarget}
        taskTitle={startTarget?.title ?? ""}
        mode="start"
        onClose={() => setStartTarget(null)}
        onSave={(hours, note) => {
          if (startTarget) { const r = startTask(startTarget.id, hours, note); showToast(r.message); }
          setStartTarget(null);
        }}
      />

      <LogHoursSheet
        open={!!submitTarget}
        taskTitle={submitTarget?.title ?? ""}
        mode="submit"
        hoursRequired={false}
        onClose={() => setSubmitTarget(null)}
        onSave={(hours, note) => {
          if (submitTarget) { const r = submitForTesting(submitTarget.id, hours || undefined, note); showToast(r.message); }
          setSubmitTarget(null);
          submitNext();
        }}
        onSkip={() => {
          if (submitTarget) { const r = submitForTesting(submitTarget.id); showToast(r.message); }
          setSubmitTarget(null);
          submitNext();
        }}
      />

      <LogHoursSheet
        open={!!logTarget}
        taskTitle={logTarget?.title ?? ""}
        mode="log"
        onClose={() => setLogTarget(null)}
        onSave={(hours, note) => {
          if (logTarget) { logHours({ taskId: logTarget.id, userId: me.id, hours, note }); showToast(`${hours}h logged`); }
          setLogTarget(null);
        }}
      />

      <DeleteNoteSheet
        open={!!deleteTarget}
        taskTitle={deleteTarget?.title ?? ""}
        noteRequired={role === "employee"}
        onClose={() => setDeleteTarget(null)}
        onConfirm={confirmDelete}
      />

      {noteTarget ? (
        <NoteSheet
          open
          taskTitle={noteTarget.task.title}
          title={notePurposeMeta(noteTarget.purpose).title}
          subtitle={notePurposeMeta(noteTarget.purpose).subtitle}
          noteRequired={notePurposeMeta(noteTarget.purpose).required}
          noteLabel={noteTarget.purpose === "fail" ? "Failure reason" : "Note for QA & PM"}
          confirmLabel={notePurposeMeta(noteTarget.purpose).confirm}
          confirmTone={notePurposeMeta(noteTarget.purpose).tone}
          onClose={() => setNoteTarget(null)}
          onConfirm={onNoteSave}
        />
      ) : null}

      {toast ? (
        <div className="pointer-events-none fixed bottom-24 left-1/2 z-40 -translate-x-1/2">
          <div className="animate-toast-in rounded-full bg-[var(--text)] px-4 py-2.5 text-sm font-medium text-[var(--bg)] shadow-xl">
            {toast}
          </div>
        </div>
      ) : null}
    </div>
  );
}


