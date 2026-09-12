"use client";

import {
  createContext,
  useContext,
  useMemo,
  useState,
  type ReactNode,
} from "react";
import {
  INITIAL_TASKS,
  INITIAL_WEEK_PLANS,
  INITIAL_WORK_LOGS,
  PROJECTS,
  TEAMS,
} from "@/lib/data/mock";
import { useAuth } from "@/lib/auth";
import type {
  DailyStatus,
  DailyStatusEntry,
  DeleteResult,
  Project,
  ProjectDocument,
  ProjectTimelineItem,
  Task,
  TaskActivity,
  TaskKind,
  TaskSource,
  Team,
  ToggleResult,
  User,
  WeekPlan,
  WorkLog,
} from "@/lib/data/types";

export type TaskStatus =
  | "todo"
  | "in_progress"
  | "ready_for_testing"
  | "in_testing"
  | "done"
  | "failed";

interface DataContextValue {
  tasks: Task[];
  workLogs: WorkLog[];
  weekPlans: WeekPlan[];
  projects: Project[];
  teams: Team[];
  activity: TaskActivity[];
  addTask: (input: {
    title: string;
    source: TaskSource;
    projectId?: string | null;
    assigneeId?: string | null;
    dueDate?: string | null;
    kind?: TaskKind;
    module?: string | null;
    estimatedHours?: number | null;
  }) => void;
  createProject: (input: {
    name: string;
    color?: string;
    description?: string;
    clientName?: string;
    clientOrigin?: string;
    documents?: string[]; // names
    flow?: string;
    clientProvided?: string[];
    startDate?: string | null;
    endDate?: string | null;
    approvedHours?: number;
    weeklyHours?: number;
    weeklyGoals?: string[][]; // per week goals
    frontendIds?: string[];
    backendIds?: string[];
    coordinatorId?: string | null;
    timeline?: { module: string; feature: string; estimatedHours: number; estimatedDays: number }[];
  }) => Project;
  /** Reopen an approved ticket back to in_progress (QA/PM only). */
  toggleTask: (id: string) => ToggleResult;
  /** todo -> in_progress. Hours are mandatory to leave "todo". */
  startTask: (id: string, hours: number, note?: string) => ToggleResult;
  /** Developer submits finished work; optional end-of-day hours update. */
  submitForTesting: (
    id: string,
    hours?: number,
    note?: string
  ) => ToggleResult;
  /** Tester takes a submitted ticket: ready_for_testing -> in_testing. */
  startTesting: (id: string, testerId?: string) => ToggleResult;
  /** QA approves: in_testing -> done. */
  approveTask: (id: string, note?: string) => ToggleResult;
  /** QA rejects: in_testing -> failed. */
  failTask: (id: string, note?: string) => ToggleResult;
  /** Developer resumes a failed ticket: failed -> in_progress. */
  reworkTask: (id: string) => ToggleResult;
  /** Developer asks QA to bounce a submitted/in-testing ticket to todo. */
  requestMoveBack: (id: string, note: string) => ToggleResult;
  /** QA approves the move-back request: -> todo. */
  approveMoveBack: (id: string) => ToggleResult;
  deleteTask: (id: string, note?: string) => DeleteResult;
  /** Assign a ticket. Assigning to a tester is only allowed once the
   *  ticket is in ready_for_testing / in_testing. */
  assignTask: (
    id: string,
    assigneeId: string
  ) => { ok: boolean; message: string };
  logHours: (input: {
    taskId: string;
    userId: string;
    hours: number;
    note?: string;
    date?: string;
  }) => void;
  addProjectMember: (projectId: string, userId: string) => void;
  removeProjectMember: (projectId: string, userId: string) => void;
  createWeekPlan: (ownerId: string, goals: string[], weekStart?: string) => void;
  setWeekPlanGoals: (planId: string, goals: string[]) => void;
  addTimelineItem: (projectId: string, item: Omit<ProjectTimelineItem, "id">) => void;
  removeTimelineItem: (projectId: string, itemId: string) => void;
  updateTimelineItem: (projectId: string, itemId: string, patch: Partial<ProjectTimelineItem>) => void;
  dailyStatuses: DailyStatusEntry[];
  setDailyStatus: (userId: string, status: DailyStatus, date?: string) => void;
  getDailyStatus: (userId: string, date?: string) => DailyStatus | null;
}

const DataContext = createContext<DataContextValue | undefined>(undefined);

function todayIso(): string {
  const d = new Date();
  const yyyy = d.getFullYear();
  const mm = String(d.getMonth() + 1).padStart(2, "0");
  const dd = String(d.getDate()).padStart(2, "0");
  return `${yyyy}-${mm}-${dd}`;
}

function isTester(u: User | null): boolean {
  return !!u?.isTester || u?.role === "admin" || u?.role === "manager";
}

export function DataProvider({ children }: { children: ReactNode }) {
  const { user, users } = useAuth();
  const [tasks, setTasks] = useState<Task[]>(INITIAL_TASKS);
  const [workLogs, setWorkLogs] = useState<WorkLog[]>(INITIAL_WORK_LOGS);
  const [weekPlans, setWeekPlans] = useState<WeekPlan[]>(INITIAL_WEEK_PLANS);
  const [projects, setProjects] = useState<Project[]>(PROJECTS);
  const [activity, setActivity] = useState<TaskActivity[]>([]);
  const [dailyStatuses, setDailyStatuses] = useState<DailyStatusEntry[]>(() => {
    if (typeof window === "undefined") return [];
    try {
      const raw = window.localStorage.getItem("dailyStatuses");
      return raw ? (JSON.parse(raw) as DailyStatusEntry[]) : [];
    } catch {
      return [];
    }
  });

  const recordActivity = (
    input: Omit<TaskActivity, "id" | "createdAt">
  ) => {
    setActivity((prev) => [
      {
        ...input,
        id: `act-${Date.now()}-${Math.random().toString(36).slice(2, 6)}`,
        createdAt: new Date().toISOString(),
      },
      ...prev,
    ]);
  };

  const addTask: DataContextValue["addTask"] = (input) => {
    const actor = user;
    // Generate next ticketId: find highest existing number and increment
    const maxNum = tasks.reduce((max, t) => {
      const match = t.ticketId.match(/^TS-(\d+)$/);
      return match ? Math.max(max, parseInt(match[1], 10)) : max;
    }, 0);
    const ticketId = `TS-${String(maxNum + 1).padStart(2, "0")}`;
    const task: Task = {
      id: `task-${Date.now()}`,
      ticketId,
      title: input.title,
      source: input.source,
      status: "todo",
      projectId: input.projectId ?? null,
      assigneeId: input.assigneeId ?? null,
      createdById: actor?.id ?? "anon",
      dueDate: input.dueDate ?? todayIso(),
      createdAt: new Date().toISOString(),
      kind: input.kind ?? "task",
      module: input.module ?? null,
      estimatedHours: input.estimatedHours ?? null,
    };
    setTasks((prev) => [task, ...prev]);
    recordActivity({
      taskId: task.id,
      taskTitle: task.title,
      userId: actor?.id ?? "anon",
      type: "created",
      toStatus: "todo",
    });
  };

  const createProject: DataContextValue["createProject"] = (input) => {
    const manager = user!;
    const id = `p-${Date.now()}`;
    const color = input.color ?? "#4f46e5";
    // Build weekly plans if dates + weeklyHours provided
    let weeklyPlans: Project["weeklyPlans"] = undefined;
    if (input.startDate && input.endDate && input.approvedHours) {
      const start = new Date(input.startDate);
      const end = new Date(input.endDate);
      const msPerWeek = 7 * 24 * 60 * 60 * 1000;
      const weeks = Math.max(1, Math.ceil((end.getTime() - start.getTime()) / msPerWeek));
      const weeklyHours = input.weeklyHours ?? Math.ceil(input.approvedHours / weeks);
      weeklyPlans = Array.from({ length: weeks }, (_, i) => {
        const wStart = new Date(start);
        wStart.setDate(start.getDate() + i * 7);
        const wEnd = new Date(wStart);
        wEnd.setDate(wStart.getDate() + 6);
        if (wEnd > end) wEnd.setTime(end.getTime());
        const fmt = (d: Date) => `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, "0")}-${String(d.getDate()).padStart(2, "0")}`;
        return {
          week: i + 1,
          startDate: fmt(wStart),
          endDate: fmt(wEnd),
          plannedHours: i === weeks - 1 ? input.approvedHours! - weeklyHours * (weeks - 1) : weeklyHours,
          goals: input.weeklyGoals?.[i] ?? [],
        };
      });
    }
    const docs: ProjectDocument[] = (input.documents ?? [])
      .filter((n) => n.trim())
      .map((name, idx) => ({ id: `doc-${Date.now()}-${idx}`, name: name.trim() }));
    const timeline: ProjectTimelineItem[] = (input.timeline ?? []).map((t, idx) => ({
      id: `tl-${Date.now()}-${idx}`,
      module: t.module,
      feature: t.feature,
      estimatedHours: t.estimatedHours,
      estimatedDays: t.estimatedDays,
      status: "planned" as const,
    }));
    const teamSpec = {
      frontendIds: input.frontendIds ?? [],
      backendIds: input.backendIds ?? [],
      coordinatorId: input.coordinatorId ?? null,
    };
    const memberSet = new Set<string>([...teamSpec.frontendIds, ...teamSpec.backendIds, ...(teamSpec.coordinatorId ? [teamSpec.coordinatorId] : [])]);
    // Ensure manager is included if not already
    if (!memberSet.has(manager.id)) memberSet.add(manager.id);
    const project: Project = {
      id,
      name: input.name.trim(),
      color,
      managerId: manager.id,
      memberIds: Array.from(memberSet),
      description: input.description?.trim() || undefined,
      client: input.clientName ? { name: input.clientName.trim(), origin: (input.clientOrigin ?? "").trim() } : undefined,
      documents: docs.length ? docs : undefined,
      flow: input.flow?.trim() || undefined,
      clientProvided: (input.clientProvided ?? []).filter((s) => s.trim()).map((s) => s.trim()),
      delivery: input.startDate || input.endDate || input.approvedHours ? {
        startDate: input.startDate ?? null,
        endDate: input.endDate ?? null,
        approvedHours: input.approvedHours ?? 0,
        weeklyHours: input.weeklyHours ?? 0,
      } : undefined,
      weeklyPlans,
      teamSpec,
      timeline: timeline.length ? timeline : undefined,
    };
    setProjects((prev) => [project, ...prev]);
    return project;
  };

  const deleteTask: DataContextValue["deleteTask"] = (id, note) => {
    const task = tasks.find((t) => t.id === id);
    if (!task)
      return { ok: false, code: "notfound", message: "Ticket not found." };

    const actor = user;
    const role = actor?.role;
    const canDelete =
      role === "admin" || role === "manager" || task.createdById === actor?.id;
    if (!canDelete) {
      return {
        ok: false,
        code: "forbidden",
        message: "You can only delete tickets you created.",
      };
    }
    if (role === "employee" && !note?.trim()) {
      return {
        ok: false,
        code: "note",
        message: "Add a note explaining the deletion.",
      };
    }

    setTasks((prev) => prev.filter((t) => t.id !== id));
    setWorkLogs((prev) => prev.filter((w) => w.taskId !== id));
    recordActivity({
      taskId: task.id,
      taskTitle: task.title,
      userId: actor?.id ?? "anon",
      type: "deleted",
      note: note?.trim(),
      fromStatus: task.status,
    });
    return { ok: true, message: "Ticket deleted." };
  };

  const pushLog = (taskId: string, userId: string, hours: number, note?: string) => {
    const log: WorkLog = {
      id: `log-${Date.now()}-${Math.random().toString(36).slice(2, 6)}`,
      taskId,
      userId,
      hours,
      date: todayIso(),
      note,
    };
    setWorkLogs((prev) => [...prev, log]);
    const task = tasks.find((t) => t.id === taskId);
    recordActivity({
      taskId,
      taskTitle: task?.title ?? "Ticket",
      userId,
      type: "hours",
      hours,
      note,
    });
  };

  const setStatus = (id: string, status: TaskStatus) => {
    setTasks((prev) => prev.map((t) => (t.id === id ? { ...t, status } : t)));
  };

  const clearMoveRequest = (id: string) => {
    setTasks((prev) =>
      prev.map((t) => (t.id === id ? { ...t, moveRequest: undefined } : t))
    );
  };

  const findTask = (id: string) => tasks.find((t) => t.id === id);

  const toggleTask: DataContextValue["toggleTask"] = (id) => {
    const task = findTask(id);
    if (!task) return { ok: false, code: "notfound", message: "Ticket not found." };
    const actor = user;
    if (!isTester(actor)) {
      return { ok: false, code: "forbidden", message: "Only QA/PM can reopen approved tickets." };
    }
    if (task.status !== "done") {
      return { ok: false, code: "notfound", message: "Only approved tickets can be reopened." };
    }
    setStatus(id, "in_progress");
    recordActivity({
      taskId: id,
      taskTitle: task.title,
      userId: actor?.id ?? "anon",
      type: "reopened",
      fromStatus: "done",
      toStatus: "in_progress",
    });
    return { ok: true, code: "reopened", message: "Ticket reopened." };
  };

  const startTask: DataContextValue["startTask"] = (id, hours, note) => {
    const task = findTask(id);
    if (!task) return { ok: false, code: "notfound", message: "Ticket not found." };
    if (task.status !== "todo") {
      return { ok: false, code: "notfound", message: "Ticket is not in To-do." };
    }
    if (!hours || hours <= 0) {
      return { ok: false, code: "hours", message: "Log working hours before moving this ticket." };
    }
    const actor = user;
    pushLog(id, actor?.id ?? "anon", hours, note);
    setStatus(id, "in_progress");
    recordActivity({
      taskId: id,
      taskTitle: task.title,
      userId: actor?.id ?? "anon",
      type: "started",
      fromStatus: "todo",
      toStatus: "in_progress",
    });
    return { ok: true, code: "started", message: `Started · ${hours}h logged.` };
  };

  const submitForTesting: DataContextValue["submitForTesting"] = (id, hours, note) => {
    const task = findTask(id);
    if (!task) return { ok: false, code: "notfound", message: "Ticket not found." };
    if (task.status !== "in_progress") {
      return { ok: false, code: "notfound", message: "Only in-progress tickets can be submitted." };
    }
    const actor = user;
    if (hours && hours > 0) pushLog(id, actor?.id ?? "anon", hours, note);
    setStatus(id, "ready_for_testing");
    recordActivity({
      taskId: id,
      taskTitle: task.title,
      userId: actor?.id ?? "anon",
      type: "submitted",
      fromStatus: "in_progress",
      toStatus: "ready_for_testing",
      note,
    });
    return { ok: true, code: "submitted", message: "Submitted for testing." };
  };

  const startTesting: DataContextValue["startTesting"] = (id, testerId) => {
    const task = findTask(id);
    if (!task) return { ok: false, code: "notfound", message: "Ticket not found." };
    const actor = user;
    if (!isTester(actor)) {
      return { ok: false, code: "forbidden", message: "Only a tester can take a ticket into testing." };
    }
    if (task.status !== "ready_for_testing") {
      return { ok: false, code: "notfound", message: "Ticket must be submitted for testing first." };
    }
    const assignee = testerId ?? actor?.id ?? null;
    setTasks((prev) =>
      prev.map((t) => (t.id === id ? { ...t, status: "in_testing", assigneeId: assignee } : t))
    );
    recordActivity({
      taskId: id,
      taskTitle: task.title,
      userId: actor?.id ?? "anon",
      type: "in_testing",
      fromStatus: "ready_for_testing",
      toStatus: "in_testing",
    });
    return { ok: true, code: "in_testing", message: "Moved into testing." };
  };

  const approveTask: DataContextValue["approveTask"] = (id, note) => {
    const task = findTask(id);
    if (!task) return { ok: false, code: "notfound", message: "Ticket not found." };
    const actor = user;
    if (!isTester(actor)) {
      return { ok: false, code: "forbidden", message: "Only QA/PM can approve tickets." };
    }
    if (task.status !== "in_testing") {
      return { ok: false, code: "notfound", message: "Ticket must be in testing to approve." };
    }
    setStatus(id, "done");
    clearMoveRequest(id);
    recordActivity({
      taskId: id,
      taskTitle: task.title,
      userId: actor?.id ?? "anon",
      type: "completed",
      fromStatus: "in_testing",
      toStatus: "done",
      note,
    });
    return { ok: true, code: "done", message: "Approved." };
  };

  const failTask: DataContextValue["failTask"] = (id, note) => {
    const task = findTask(id);
    if (!task) return { ok: false, code: "notfound", message: "Ticket not found." };
    const actor = user;
    if (!isTester(actor)) {
      return { ok: false, code: "forbidden", message: "Only QA/PM can fail tickets." };
    }
    if (task.status !== "in_testing") {
      return { ok: false, code: "notfound", message: "Ticket must be in testing to fail." };
    }
    setStatus(id, "failed");
    clearMoveRequest(id);
    recordActivity({
      taskId: id,
      taskTitle: task.title,
      userId: actor?.id ?? "anon",
      type: "failed",
      fromStatus: "in_testing",
      toStatus: "failed",
      note: note?.trim(),
    });
    return { ok: true, code: "failed", message: note ? `Failed — QA note: ${note}` : "Failed." };
  };

  const reworkTask: DataContextValue["reworkTask"] = (id) => {
    const task = findTask(id);
    if (!task) return { ok: false, code: "notfound", message: "Ticket not found." };
    const actor = user;
    const owning =
      task.createdById === actor?.id ||
      task.assigneeId === actor?.id ||
      actor?.role === "admin" ||
      actor?.role === "manager";
    if (!owning) return { ok: false, code: "forbidden", message: "You can only rework your own tickets." };
    if (task.status !== "failed") {
      return { ok: false, code: "notfound", message: "Only failed tickets can be reworked." };
    }
    setStatus(id, "in_progress");
    clearMoveRequest(id);
    recordActivity({
      taskId: id,
      taskTitle: task.title,
      userId: actor?.id ?? "anon",
      type: "started",
      fromStatus: "failed",
      toStatus: "in_progress",
    });
    return { ok: true, code: "started", message: "Moved back into development." };
  };

  const requestMoveBack: DataContextValue["requestMoveBack"] = (id, note) => {
    const task = findTask(id);
    if (!task) return { ok: false, code: "notfound", message: "Ticket not found." };
    const actor = user;
    if (actor?.role === "admin" || actor?.role === "manager") {
      // PM/admin can bounce directly.
      setStatus(id, "todo");
      clearMoveRequest(id);
      recordActivity({
        taskId: id,
        taskTitle: task.title,
        userId: actor?.id ?? "anon",
        type: "move_approved",
        fromStatus: task.status,
        toStatus: "todo",
        note: note?.trim(),
      });
      return { ok: true, code: "moved_back", message: "Ticket moved back to To-do." };
    }
    const owning =
      task.createdById === actor?.id || task.assigneeId === actor?.id;
    if (!owning) return { ok: false, code: "forbidden", message: "You can only request moves on your own tickets." };
    if (!note?.trim()) {
      return { ok: false, code: "hours", message: "Add a note explaining the move-back request." };
    }
    if (task.status !== "ready_for_testing" && task.status !== "in_testing") {
      return { ok: false, code: "notfound", message: "Only submitted or in-testing tickets can request a move." };
    }
    setTasks((prev) =>
      prev.map((t) =>
        t.id === id
          ? {
              ...t,
              moveRequest: {
                userId: actor?.id ?? "anon",
                note: note.trim(),
                requestedAt: new Date().toISOString(),
              },
            }
          : t
      )
    );
    recordActivity({
      taskId: id,
      taskTitle: task.title,
      userId: actor?.id ?? "anon",
      type: "move_requested",
      note: note.trim(),
      fromStatus: task.status,
    });
    return { ok: true, code: "moved_back", message: "Move-back request sent to QA." };
  };

  const approveMoveBack: DataContextValue["approveMoveBack"] = (id) => {
    const task = findTask(id);
    if (!task) return { ok: false, code: "notfound", message: "Ticket not found." };
    const actor = user;
    if (!isTester(actor)) {
      return { ok: false, code: "forbidden", message: "Only QA/PM can approve move-back requests." };
    }
    if (!task.moveRequest) {
      return { ok: false, code: "notfound", message: "No pending move-back request." };
    }
    setStatus(id, "todo");
    recordActivity({
      taskId: id,
      taskTitle: task.title,
      userId: actor?.id ?? "anon",
      type: "move_approved",
      fromStatus: task.status,
      toStatus: "todo",
      note: task.moveRequest.note,
    });
    clearMoveRequest(id);
    return { ok: true, code: "moved_back", message: "Move-back approved — ticket is in To-do." };
  };

  const assignTask: DataContextValue["assignTask"] = (id, assigneeId) => {
    const task = findTask(id);
    if (!task) return { ok: false, message: "Ticket not found." };
    const assignee = users.find((u) => u.id === assigneeId);
    const actor = user;
    const isManager =
      actor?.role === "admin" || actor?.role === "manager" || actor?.id === task.createdById;
    if (!isManager) {
      return { ok: false, message: "Only the PM/creator can reassign a ticket." };
    }
    if (assignee?.isTester) {
      const allowed = task.status === "ready_for_testing" || task.status === "in_testing";
      if (!allowed) {
        return {
          ok: false,
          message: "A ticket can only be assigned to a tester once it is in testing.",
        };
      }
    }
    setTasks((prev) => prev.map((t) => (t.id === id ? { ...t, assigneeId } : t)));
    return { ok: true, message: "Assignment updated." };
  };

  const logHours: DataContextValue["logHours"] = (input) => {
    const log: WorkLog = {
      id: `log-${Date.now()}`,
      taskId: input.taskId,
      userId: input.userId,
      hours: input.hours,
      date: input.date ?? todayIso(),
      note: input.note,
    };
    setWorkLogs((prev) => [...prev, log]);
    const task = tasks.find((t) => t.id === input.taskId);
    recordActivity({
      taskId: input.taskId,
      taskTitle: task?.title ?? "Ticket",
      userId: input.userId,
      type: "hours",
      hours: input.hours,
      note: input.note,
    });
  };

  const addProjectMember: DataContextValue["addProjectMember"] = (projectId, userId) => {
    setProjects((prev) =>
      prev.map((p) =>
        p.id === projectId && !p.memberIds.includes(userId)
          ? { ...p, memberIds: [...p.memberIds, userId] }
          : p
      )
    );
  };

  const removeProjectMember: DataContextValue["removeProjectMember"] = (projectId, userId) => {
    setProjects((prev) =>
      prev.map((p) =>
        p.id === projectId
          ? { ...p, memberIds: p.memberIds.filter((m) => m !== userId) }
          : p
      )
    );
  };

  const createWeekPlan = (
    ownerId: string,
    goals: string[],
    weekStart?: string
  ) => {
    setWeekPlans((prev) => [
      ...prev,
      {
        id: `wp-${Date.now()}`,
        weekStart: weekStart ?? todayIso(),
        ownerId,
        goals: goals.map((text, i) => ({ id: `goal-${Date.now()}-${i}`, text })),
        createdAt: new Date().toISOString(),
      },
    ]);
  };

  const setWeekPlanGoals = (planId: string, goals: string[]) => {
    setWeekPlans((prev) =>
      prev.map((p) =>
        p.id === planId
          ? {
              ...p,
              goals: goals.map((text, i) => ({
                id: `goal-${Date.now()}-${i}`,
                text,
              })),
            }
          : p
      )
    );
  };

  const addTimelineItem: DataContextValue["addTimelineItem"] = (projectId, item) => {
    setProjects((prev) =>
      prev.map((p) =>
        p.id === projectId
          ? { ...p, timeline: [...(p.timeline ?? []), { ...item, id: `tl-${Date.now()}` }] }
          : p
      )
    );
  };
  const removeTimelineItem: DataContextValue["removeTimelineItem"] = (projectId, itemId) => {
    setProjects((prev) =>
      prev.map((p) =>
        p.id === projectId ? { ...p, timeline: (p.timeline ?? []).filter((t) => t.id !== itemId) } : p
      )
    );
  };
  const updateTimelineItem: DataContextValue["updateTimelineItem"] = (projectId, itemId, patch) => {
    setProjects((prev) =>
      prev.map((p) =>
        p.id === projectId
          ? { ...p, timeline: (p.timeline ?? []).map((t) => (t.id === itemId ? { ...t, ...patch } : t)) }
          : p
      )
    );
  };

  const setDailyStatus: DataContextValue["setDailyStatus"] = (userId, status, date) => {
    const d = date ?? todayIso();
    setDailyStatuses((prev) => {
      const filtered = prev.filter((e) => !(e.userId === userId && e.date === d));
      const entry: DailyStatusEntry = { userId, date: d, status, updatedAt: new Date().toISOString() };
      const next = [...filtered, entry];
      try {
        window.localStorage.setItem("dailyStatuses", JSON.stringify(next));
      } catch {
        // ignore
      }
      return next;
    });
  };

  const getDailyStatus: DataContextValue["getDailyStatus"] = (userId, date) => {
    const d = date ?? todayIso();
    const found = dailyStatuses.find((e) => e.userId === userId && e.date === d);
    return found?.status ?? null;
  };

  const value: DataContextValue = useMemo(
    () => ({
      tasks,
      workLogs,
      weekPlans,
      projects,
      teams: TEAMS,
      activity,
      addTask,
      createProject,
      toggleTask,
      startTask,
      submitForTesting,
      startTesting,
      approveTask,
      failTask,
      reworkTask,
      requestMoveBack,
      approveMoveBack,
      deleteTask,
      assignTask,
      logHours,
      addProjectMember,
      removeProjectMember,
      createWeekPlan,
      setWeekPlanGoals,
      addTimelineItem,
      removeTimelineItem,
      updateTimelineItem,
      dailyStatuses,
      setDailyStatus,
      getDailyStatus,
    }),
    // eslint-disable-next-line react-hooks/exhaustive-deps
    [tasks, workLogs, weekPlans, projects, activity, user, dailyStatuses]
  );

  return <DataContext.Provider value={value}>{children}</DataContext.Provider>;
}

export function useData(): DataContextValue {
  const ctx = useContext(DataContext);
  if (!ctx) {
    throw new Error("useData must be used within a DataProvider");
  }
  return ctx;
}