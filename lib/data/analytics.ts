import type { Task, User, WorkLog } from "@/lib/data/types";

export interface DayPoint {
  date: string;
  label: string;
  hours: number;
}

export interface DevWorkload {
  userId: string;
  name: string;
  hours: number;
  tasks: number;
  color: string;
}

export interface StatusBreakdown {
  status: Task["status"];
  count: number;
}

export function overallProgress(tasks: Task[]): number {
  if (tasks.length === 0) return 0;
  const done = tasks.filter((t) => t.status === "done").length;
  return Math.round((done / tasks.length) * 100);
}

export function statusBreakdown(tasks: Task[]): StatusBreakdown[] {
  const STATUSES: Task["status"][] = [
    "todo",
    "in_progress",
    "ready_for_testing",
    "in_testing",
    "done",
    "failed",
  ];
  const counts: Record<Task["status"], number> = {
    todo: 0,
    in_progress: 0,
    ready_for_testing: 0,
    in_testing: 0,
    done: 0,
    failed: 0,
  };
  for (const t of tasks) counts[t.status] += 1;
  return STATUSES.map((status) => ({ status, count: counts[status] }));
}

export function projectProgress(tasks: Task[]): {
  projectId: string;
  done: number;
  total: number;
  pct: number;
}[] {
  const byProject = new Map<string, Task[]>();
  for (const t of tasks) {
    const key = t.projectId ?? "unassigned";
    byProject.set(key, [...(byProject.get(key) ?? []), t]);
  }
  return Array.from(byProject.entries()).map(([projectId, list]) => {
    const done = list.filter((t) => t.status === "done").length;
    return {
      projectId,
      done,
      total: list.length,
      pct: list.length ? Math.round((done / list.length) * 100) : 0,
    };
  });
}

/**
 * Aggregate logged hours per day for the trailing `days` days
 * (optionally filtered to a subset of users).
 */
export function hoursPerDay(
  logs: WorkLog[],
  days: number,
  userIds?: Set<string>
): DayPoint[] {
  const out: DayPoint[] = [];
  const now = new Date();
  for (let i = days - 1; i >= 0; i--) {
    const d = new Date(now);
    d.setDate(now.getDate() - i);
    const key = `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, "0")}-${String(
      d.getDate()
    ).padStart(2, "0")}`;
    const hours = logs
      .filter((l) => l.date === key && (!userIds || userIds.has(l.userId)))
      .reduce((sum, l) => sum + l.hours, 0);
    out.push({
      date: key,
      label: d.toLocaleDateString(undefined, { weekday: "short" }),
      hours: Math.round(hours * 10) / 10,
    });
  }
  return out;
}

export function workloadPerDev(
  tasks: Task[],
  logs: WorkLog[],
  users: User[]
): DevWorkload[] {
  const devs = users.filter((u) => u.role === "employee");
  return devs.map((u) => {
    const hours = logs
      .filter((l) => l.userId === u.id)
      .reduce((sum, l) => sum + l.hours, 0);
    const assigned = tasks.filter((t) => t.assigneeId === u.id).length;
    return {
      userId: u.id,
      name: u.name.split(" ")[0],
      hours: Math.round(hours * 10) / 10,
      tasks: assigned,
      color: u.avatarColor,
    };
  });
}

export function totalHours(logs: WorkLog[]): number {
  return logs.reduce((sum, l) => sum + l.hours, 0);
}
