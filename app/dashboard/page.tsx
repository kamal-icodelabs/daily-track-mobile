"use client";

import { useMemo } from "react";
import Link from "next/link";
import { motion } from "framer-motion";
import {
  Activity,
  ArrowRight,
  CalendarDays,
  CheckCircle2,
  Clock,
  ClipboardList,
  Gauge,
  Shield,
} from "lucide-react";
import {
  Bar,
  BarChart,
  CartesianGrid,
  Cell,
  Pie,
  PieChart,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
} from "recharts";
import { Header } from "@/components/layout/Header";
import { StatCard } from "@/components/dashboard/StatCard";
import { ChartCard } from "@/components/dashboard/ChartCard";
import { CalendarPreview } from "@/components/calendar/CalendarPreview";
import { useAuth } from "@/lib/auth";
import { useData } from "@/lib/data/store";
import { useCan } from "@/lib/permissions";
import {
  hoursPerDay,
  overallProgress,
  projectProgress,
  statusBreakdown,
  totalHours,
  workloadPerDev,
} from "@/lib/data/analytics";

const STATUS_COLORS: Record<string, string> = {
  todo: "var(--text-muted)",
  in_progress: "var(--accent)",
  ready_for_testing: "#8b5cf6",
  in_testing: "#f59e0b",
  done: "var(--success)",
  failed: "var(--danger)",
};

interface TooltipEntry {
  name?: string | number;
  value?: string | number;
}

function ChartTooltip({
  active,
  payload,
  label,
}: {
  active?: boolean;
  payload?: TooltipEntry[];
  label?: string | number;
}) {
  if (!active || !payload || !payload.length) return null;
  return (
    <div className="rounded-lg border border-[var(--border)] bg-[var(--surface-2)] px-3 py-2 text-xs shadow-lg">
      {label ? (
        <p className="font-semibold text-[var(--text)]">{label}</p>
      ) : null}
      {payload.map((p, i) => (
        <p key={i} className="text-[var(--text-muted)]">
          {p.name}: <span className="font-semibold text-[var(--text)]">{p.value}</span>
        </p>
      ))}
    </div>
  );
}

export default function DashboardPage() {
  const { user, users } = useAuth();
  const { tasks, workLogs, projects } = useData();
  const can = useCan();

  const me = user!;

  const scopedTasks = useMemo(() => {
    if (can.canViewAllData) return tasks;
    // manager: tasks in their projects; employee: their own tasks
    if (can.canSeeAllProjects) {
      const myProjectIds = new Set(
        projects.filter((p) => p.managerId === me.id).map((p) => p.id)
      );
      return tasks.filter((t) => myProjectIds.has(t.projectId ?? ""));
    }
    return tasks.filter((t) => t.assigneeId === me.id);
  }, [tasks, projects, can, me]);

  const scopedLogs = useMemo(() => {
    if (can.canSeeOtherHours) return workLogs;
    return workLogs.filter((l) => l.userId === me.id);
  }, [workLogs, can, me]);

  const weekHoursData = useMemo(
    () => hoursPerDay(scopedLogs, 7),
    [scopedLogs]
  );

  const statusData = useMemo(
    () => statusBreakdown(scopedTasks),
    [scopedTasks]
  );
  const progress = useMemo(() => overallProgress(scopedTasks), [scopedTasks]);
  const hoursTotal = useMemo(() => totalHours(scopedLogs), [scopedLogs]);
  const workload = useMemo(
    () => workloadPerDev(tasks, workLogs, users),
    [tasks, workLogs, users]
  );
  const projProg = useMemo(() => projectProgress(scopedTasks), [scopedTasks]);

  const doneCount = scopedTasks.filter((t) => t.status === "done").length;
  const inProgCount = scopedTasks.filter((t) => t.status === "in_progress").length;

  return (
    <div className="flex h-full flex-col">
      <Header
        title={`Hi, ${me.name.split(" ")[0]}`}
        subtitle={`${roleLabel(me)} dashboard`}
        actionIcon={can.canManageUsers ? Shield : undefined}
      />

      <div className="flex-1 space-y-4 overflow-y-auto px-4 py-4 pb-28">
        {/* Greeting + role */}
        <motion.div
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.3 }}
          className="flex items-center gap-3 rounded-2xl bg-[var(--accent-soft)] p-4"
        >
          <div
            className="flex h-12 w-12 shrink-0 items-center justify-center rounded-full text-lg font-bold text-white"
            style={{ background: me.avatarColor }}
          >
            {me.initials}
          </div>
          <div className="min-w-0 flex-1">
            <p className="font-bold text-[var(--text)]">{me.name}</p>
            <p className="text-sm text-[var(--text-muted)]">{me.email}</p>
          </div>
          <span
            className="shrink-0 rounded-full px-2.5 py-1 text-[11px] font-semibold uppercase tracking-wide"
            style={{ background: "var(--accent)", color: "var(--bg)" }}
          >
            {roleLabel(me)}
          </span>
        </motion.div>

        {/* Aggregate stats */}
        <div className="grid grid-cols-2 gap-3">
          <StatCard
            index={0}
            label="Tasks"
            value={scopedTasks.length}
            sub={`${doneCount} done · ${inProgCount} active`}
            icon={ClipboardList}
          />
          <StatCard
            index={1}
            label="Progress"
            value={`${progress}%`}
            sub="of your tasks completed"
            icon={Gauge}
            accent="success"
          />
          <StatCard
            index={2}
            label="Hours"
            value={hoursTotal.toFixed(1)}
            sub="last 7 days"
            icon={Clock}
            accent="warn"
          />
          <StatCard
            index={3}
            label="Active projects"
            value={projects.length}
            sub="across the org"
            icon={Activity}
          />
        </div>

        {/* Calendar preview — linked to full calendar page */}
        <CalendarPreview index={4} />

        {/* Charts */}
        <div className="grid grid-cols-1 gap-4">
          <ChartCard title="Hours logged" subtitle="Per day · last 7 days" index={5}>
            <div className="h-40 w-full">
              <ResponsiveContainer width="100%" height="100%">
                <BarChart data={weekHoursData} margin={{ top: 4, right: 4, left: -18, bottom: 0 }}>
                  <CartesianGrid vertical={false} stroke="var(--border)" strokeDasharray="3 3" />
                  <XAxis
                    dataKey="label"
                    tick={{ fill: "var(--text-muted)", fontSize: 11 }}
                    axisLine={false}
                    tickLine={false}
                  />
                  <YAxis
                    tick={{ fill: "var(--text-muted)", fontSize: 11 }}
                    axisLine={false}
                    tickLine={false}
                  />
                  <Tooltip content={<ChartTooltip />} cursor={{ fill: "var(--accent-soft)" }} />
                  <Bar dataKey="hours" name="hours" radius={[6, 6, 0, 0]} fill="var(--accent)" />
                </BarChart>
              </ResponsiveContainer>
            </div>
          </ChartCard>

          {can.canSeeOtherHours ? (
            <ChartCard title="Workload by developer" subtitle="hours logged this week" index={6}>
              <div className="h-40 w-full">
                <ResponsiveContainer width="100%" height="100%">
                  <BarChart data={workload} layout="vertical" margin={{ top: 4, right: 12, left: 4, bottom: 0 }}>
                    <CartesianGrid horizontal={false} stroke="var(--border)" strokeDasharray="3 3" />
                    <XAxis
                      type="number"
                      tick={{ fill: "var(--text-muted)", fontSize: 11 }}
                      axisLine={false}
                      tickLine={false}
                    />
                    <YAxis
                      type="category"
                      dataKey="name"
                      width={56}
                      tick={{ fill: "var(--text-muted)", fontSize: 11 }}
                      axisLine={false}
                      tickLine={false}
                    />
                    <Tooltip content={<ChartTooltip />} cursor={{ fill: "var(--accent-soft)" }} />
                    <Bar dataKey="hours" name="hours" radius={[0, 6, 6, 0]}>
                      {workload.map((w) => (
                        <Cell key={w.userId} fill={w.color} />
                      ))}
                    </Bar>
                  </BarChart>
                </ResponsiveContainer>
              </div>
            </ChartCard>
          ) : null}

          <ChartCard title="Task status" subtitle="Current breakdown" index={7}>
            <div className="flex items-center gap-4">
              <div className="h-36 w-36 shrink-0">
                <ResponsiveContainer width="100%" height="100%">
                  <PieChart>
                    <Pie
                      data={statusData}
                      dataKey="count"
                      nameKey="status"
                      innerRadius={40}
                      outerRadius={60}
                      paddingAngle={3}
                      stroke="transparent"
                    >
                      {statusData.map((s) => (
                        <Cell key={s.status} fill={STATUS_COLORS[s.status]} />
                      ))}
                    </Pie>
                    <Tooltip content={<ChartTooltip />} />
                  </PieChart>
                </ResponsiveContainer>
              </div>
              <div className="flex-1 space-y-2">
                {statusData.map((s) => (
                  <div key={s.status} className="flex items-center justify-between text-sm">
                    <span className="flex items-center gap-2 text-[var(--text-muted)]">
                      <span
                        className="h-2.5 w-2.5 rounded-full"
                        style={{ background: STATUS_COLORS[s.status] }}
                      />
                      {statusLabel(s.status)}
                    </span>
                    <span className="font-semibold text-[var(--text)]">{s.count}</span>
                  </div>
                ))}
              </div>
            </div>
          </ChartCard>

          <ChartCard title="Project progress" subtitle="% of tasks completed" index={8}>
            <div className="space-y-3">
              {projProg.map((p) => {
                const project = projects.find((x) => x.id === p.projectId);
                return (
                  <div key={p.projectId}>
                    <div className="mb-1 flex items-center justify-between text-sm">
                      <span className="font-medium text-[var(--text)]">
                        {project?.name ?? "Unassigned"}
                      </span>
                      <span className="text-[var(--text-muted)]">
                        {p.done}/{p.total} · {p.pct}%
                      </span>
                    </div>
                    <div className="h-2 overflow-hidden rounded-full bg-[var(--surface-2)]">
                      <motion.div
                        initial={{ width: 0 }}
                        animate={{ width: `${p.pct}%` }}
                        transition={{ duration: 0.7, ease: "easeOut" }}
                        className="h-full rounded-full"
                        style={{ background: project?.color ?? "var(--accent)" }}
                      />
                    </div>
                  </div>
                );
              })}
            </div>
          </ChartCard>
        </div>

        {/* Employee-only quick actions */}
        {can.canCreateWeekPlanForTeam ? (
          <ChartCard title="This week's plan" subtitle="Team goals" index={9}>
            <div className="space-y-2">
              <Link
                href="/today"
                className="flex items-center justify-between rounded-xl bg-[var(--accent-soft)] px-3 py-2.5 text-sm font-medium text-[var(--accent)]"
              >
                Manage plan & assign tasks
                <ArrowRight size={16} />
              </Link>
            </div>
          </ChartCard>
        ) : (
          <ChartCard title="Your focus" subtitle="Quick actions" index={9}>
            <div className="grid grid-cols-2 gap-2">
              <Link
                href="/today"
                className="flex items-center justify-center gap-2 rounded-xl bg-[var(--accent)] px-3 py-3 text-sm font-semibold text-white"
              >
                <CheckCircle2 size={16} />
                Today
              </Link>
              <Link
                href="/calendar"
                className="flex items-center justify-center gap-2 rounded-xl bg-[var(--surface-2)] px-3 py-3 text-sm font-semibold text-[var(--text)]"
              >
                <CalendarDays size={16} />
                Calendar
              </Link>
            </div>
          </ChartCard>
        )}
      </div>
    </div>
  );
}

function roleLabel(user: { role: string; isTester: boolean }): string {
  if (user.role === "admin") return "Admin";
  if (user.role === "manager") return "Project Manager";
  return user.isTester ? "QA Engineer" : "Developer";
}

function statusLabel(status: string): string {
  switch (status) {
    case "todo":
      return "To do";
    case "in_progress":
      return "In progress";
    case "ready_for_testing":
      return "Ready for testing";
    case "in_testing":
      return "Testing";
    case "failed":
      return "Failed";
    default:
      return "Done";
  }
}
