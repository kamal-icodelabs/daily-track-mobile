"use client";

import { useMemo, useState } from "react";
import Link from "next/link";
import { useParams, useRouter } from "next/navigation";
import { motion } from "framer-motion";
import {
  ArrowLeft,
  Bug,
  CalendarDays,
  Clock,
  FileText,
  FolderKanban,
  Layers,
  Plus,
  ShieldCheck,
  UserMinus,
  Users,
} from "lucide-react";
import { Header } from "@/components/layout/Header";
import { AddTaskSheet } from "@/components/tasks/AddTaskSheet";
import { STATUS_META } from "@/components/tasks/TaskCard";
import { PickerDropdown } from "@/components/layout/PickerDropdown";
import { useAuth } from "@/lib/auth";
import { useData } from "@/lib/data/store";
import { useIsAdmin } from "@/lib/permissions";
import { TASK_KIND_META } from "@/lib/data/types";
import type { User } from "@/lib/data/types";

function roleBadge(u: Pick<User, "role" | "isTester">): string {
  if (u.role === "admin") return "Admin";
  if (u.role === "manager") return "PM";
  return u.isTester ? "QA" : "Dev";
}

function TeamRow({
  label,
  ids,
  usersById,
  projectId,
  hoursForUserOn,
}: {
  label: string;
  ids: string[];
  usersById: Map<string, User>;
  projectId: string;
  hoursForUserOn: (uid: string, pid: string) => number;
}) {
  return (
    <div>
      <p className="text-[11px] font-semibold text-[var(--text-muted)]">{label}</p>
      {ids.length ? (
        <div className="mt-1 flex flex-wrap gap-1.5">
          {ids.map((id) => {
            const u = usersById.get(id);
            if (!u) return null;
            return (
              <span
                key={id}
                className="inline-flex items-center gap-1.5 rounded-full border border-[var(--border)] bg-[var(--surface)] px-2 py-1 text-xs"
              >
                <span
                  className="flex h-5 w-5 items-center justify-center rounded-full text-[10px] font-bold text-white"
                  style={{ background: u.avatarColor }}
                >
                  {u.initials}
                </span>
                {u.name} <span className="text-[var(--text-muted)]">{hoursForUserOn(id, projectId)}h</span>
              </span>
            );
          })}
        </div>
      ) : (
        <p className="text-xs text-[var(--text-muted)]">— none —</p>
      )}
    </div>
  );
}

export default function ProjectDetailPage() {
  const params = useParams<{ projectId: string }>();
  const router = useRouter();
  const { user, users } = useAuth();
  const isAdmin = useIsAdmin();
  const {
    projects,
    tasks,
    workLogs,
    addProjectMember,
    removeProjectMember,
    assignTask,
    addTask,
    addTimelineItem,
  } = useData();

  const me = user!;
  const isManager = isAdmin || me.role === "manager";

  const projectId = params.projectId;
  const project = projects.find((p) => p.id === projectId) ?? null;

  const usersById = useMemo(() => new Map(users.map((u) => [u.id, u])), [users]);
  const tasksOf = useMemo(() => tasks.filter((t) => t.projectId === projectId), [tasks, projectId]);
  const memberUsers = useMemo(
    () => (project ? users.filter((u) => project.memberIds.includes(u.id)) : []),
    [users, project]
  );
  const nonMembers = useMemo(
    () => (project ? users.filter((u) => !project.memberIds.includes(u.id)) : []),
    [users, project]
  );

  const spent = useMemo(() => {
    const ids = new Set(tasksOf.map((t) => t.id));
    return workLogs.filter((l) => ids.has(l.taskId)).reduce((s, l) => s + l.hours, 0);
  }, [workLogs, tasksOf]);

  const approved = project?.delivery?.approvedHours ?? 0;
  const pct = approved ? Math.min(100, Math.round((spent / approved) * 100)) : 0;

  const hoursForUserOn = (userId: string, pid: string) => {
    const ids = new Set(tasks.filter((t) => t.projectId === pid).map((t) => t.id));
    return workLogs.filter((l) => l.userId === userId && ids.has(l.taskId)).reduce((s, l) => s + l.hours, 0);
  };

  const kindCounts = useMemo(() => {
    const acc: Record<string, number> = {};
    for (const t of tasksOf) {
      const k = t.kind ?? "task";
      acc[k] = (acc[k] ?? 0) + 1;
    }
    return acc;
  }, [tasksOf]);

  const moduleGroups = useMemo(() => {
    const acc: Record<string, number> = {};
    for (const t of tasksOf) {
      const m = t.module ?? "—";
      acc[m] = (acc[m] ?? 0) + 1;
    }
    return acc;
  }, [tasksOf]);

  const bugCount = (kindCounts["bug"] ?? 0) + (kindCounts["issue"] ?? 0);
  const failedCount = tasksOf.filter((t) => t.status === "failed").length;

  // local UI state
  const [addSheet, setAddSheet] = useState(false);
  const [toast, setToast] = useState<string | null>(null);
  const [assigneeOverrides, setAssigneeOverrides] = useState<Record<string, string>>({});
  const [draft, setDraft] = useState({ module: "", feature: "", hrs: "", days: "" });

  // auto-dismiss toast
  if (toast) {
    // slight trick: schedule clear outside render loop via timeout only once
    // we handle with effect-like check: if toast set, schedule once
    // but to keep simple we use setTimeout inside handler callers instead
  }

  const showToast = (msg: string) => {
    setToast(msg);
    setTimeout(() => setToast(null), 2600);
  };

  if (!project) {
    return (
      <div className="flex h-full flex-col">
        <Header title="Project" subtitle="Not found" actionIcon={ArrowLeft} onAction={() => router.back()} actionLabel="Back" />
        <div className="flex flex-1 flex-col items-center justify-center px-6 text-center">
          <FolderKanban size={36} className="mb-3 text-[var(--text-muted)]/40" />
          <p className="text-sm text-[var(--text-muted)]">Project not found.</p>
          <Link href="/projects" className="mt-4 rounded-xl bg-[var(--accent)] px-5 py-2.5 text-sm font-semibold text-white">
            Back to projects
          </Link>
        </div>
      </div>
    );
  }

  // permission: employee can only view if member or isManager
  const canView = isManager || project.memberIds.includes(me.id);
  if (!canView) {
    return (
      <div className="flex h-full flex-col">
        <Header title={project.name} subtitle="No access" actionIcon={ArrowLeft} onAction={() => router.back()} actionLabel="Back" />
        <div className="flex flex-1 flex-col items-center justify-center px-6 text-center">
          <ShieldCheck size={36} className="mb-3 text-[var(--text-muted)]/40" />
          <p className="text-sm text-[var(--text-muted)]">You don&apos;t have access to this project.</p>
          <Link href="/projects" className="mt-4 rounded-xl bg-[var(--accent)] px-5 py-2.5 text-sm font-semibold text-white">
            Back
          </Link>
        </div>
      </div>
    );
  }

  return (
    <div className="flex h-full flex-col">
      <Header
        title={project.name}
        subtitle={project.client ? `${project.client.name} · ${project.client.origin}` : "Project detail"}
        actionIcon={ArrowLeft}
        onAction={() => router.back()}
        actionLabel="Back"
      />

      <div className="flex-1 space-y-4 overflow-y-auto px-4 py-4 pb-28">
        {/* Hero */}
        <motion.div
          initial={{ opacity: 0, y: 8 }}
          animate={{ opacity: 1, y: 0 }}
          className="overflow-hidden rounded-2xl border border-[var(--border)] bg-[var(--surface)] shadow-sm"
          style={{ background: `linear-gradient(135deg, ${project.color}18, var(--surface))` }}
        >
          <div className="p-4">
            <div className="flex items-center gap-2">
              <span className="h-3 w-3 rounded-full" style={{ background: project.color }} />
              <h1 className="text-lg font-bold text-[var(--text)]">{project.name}</h1>
            </div>
            {project.description ? (
              <p className="mt-1 text-sm text-[var(--text)]">{project.description}</p>
            ) : (
              <p className="mt-1 text-sm text-[var(--text-muted)]">No description.</p>
            )}
            {project.client && (
              <div className="mt-2 flex flex-wrap gap-2">
                <span className="rounded-full bg-[var(--accent-soft)] px-2.5 py-1 text-xs font-semibold text-[var(--accent)]">
                  {project.client.name}
                </span>
                <span className="rounded-full border border-[var(--border)] bg-[var(--surface)] px-2.5 py-1 text-xs text-[var(--text-muted)]">
                  {project.client.origin}
                </span>
              </div>
            )}
            <div className="mt-3 flex gap-2 text-xs">
              <span className="rounded-full bg-[var(--surface-2)] px-2.5 py-1 text-[var(--text-muted)]">
                {tasksOf.length} tickets
              </span>
              <span className="rounded-full bg-[var(--surface-2)] px-2.5 py-1 text-[var(--text-muted)]">
                {memberUsers.length} members
              </span>
              {approved ? (
                <span className="rounded-full bg-[var(--text)] px-2.5 py-1 font-semibold text-[var(--bg)]">
                  {spent}h / {approved}h
                </span>
              ) : null}
            </div>
            {approved ? (
              <div className="mt-3">
                <div className="flex items-center justify-between text-[11px]">
                  <span className="text-[var(--text-muted)]">Hours · {spent} / {approved} · {pct}%</span>
                  <span className={pct >= 90 ? "text-[var(--danger)]" : pct >= 70 ? "text-amber-600" : "text-[var(--text-muted)]"}>
                    {approved - spent >= 0 ? `${approved - spent}h left` : `${spent - approved}h over`}
                  </span>
                </div>
                <div className="mt-1 h-2 w-full overflow-hidden rounded-full bg-black/5">
                  <div
                    className="h-full rounded-full transition-all"
                    style={{ width: `${pct}%`, background: pct >= 90 ? "var(--danger)" : project.color }}
                  />
                </div>
              </div>
            ) : null}
          </div>
        </motion.div>

        {/* 1. Detail & docs */}
        <section className="rounded-2xl border border-[var(--border)] bg-[var(--surface)] p-4 shadow-sm">
          <div className="mb-2 flex items-center gap-1.5 text-sm font-bold text-[var(--text)]">
            <FileText size={15} className="text-[var(--accent)]" /> Detail
          </div>
          <div className="space-y-2 text-sm">
            {project.documents && project.documents.length > 0 ? (
              <div>
                <p className="text-xs font-semibold text-[var(--text-muted)]">Supported documents</p>
                <ul className="mt-1 list-disc pl-4 text-[var(--text)]">
                  {project.documents.map((d) => (
                    <li key={d.id} className="text-sm">{d.name}</li>
                  ))}
                </ul>
              </div>
            ) : (
              <p className="text-xs text-[var(--text-muted)]">No documents linked.</p>
            )}
            {project.flow ? (
              <div>
                <p className="text-xs font-semibold text-[var(--text-muted)]">Flow</p>
                <p className="mt-0.5 text-sm text-[var(--text)]">{project.flow}</p>
              </div>
            ) : null}
            {project.clientProvided && project.clientProvided.length > 0 ? (
              <div>
                <p className="text-xs font-semibold text-[var(--text-muted)]">What client provided</p>
                <ul className="mt-1 list-disc pl-4">
                  {project.clientProvided.map((c, idx) => (
                    <li key={idx} className="text-sm text-[var(--text)]">{c}</li>
                  ))}
                </ul>
              </div>
            ) : null}
          </div>
        </section>

        {/* 2. Delivery */}
        <section className="rounded-2xl border border-[var(--border)] bg-[var(--surface)] p-4 shadow-sm">
          <div className="mb-3 flex items-center gap-1.5 text-sm font-bold text-[var(--text)]">
            <CalendarDays size={15} className="text-[var(--accent)]" /> Delivery & time
          </div>
          {project.delivery ? (
            <>
              <div className="grid grid-cols-2 gap-2">
                <div className="rounded-xl bg-[var(--surface-2)] p-3">
                  <p className="text-[11px] text-[var(--text-muted)]">Time period</p>
                  <p className="mt-0.5 text-sm font-semibold text-[var(--text)]">
                    {project.delivery.startDate ?? "—"} → {project.delivery.endDate ?? "—"}
                  </p>
                </div>
                <div className="rounded-xl bg-[var(--surface-2)] p-3">
                  <p className="text-[11px] text-[var(--text-muted)]">Approved by client</p>
                  <p className="mt-0.5 text-sm font-semibold text-[var(--text)]">
                    {project.delivery.approvedHours}h total · {project.delivery.weeklyHours}h / week
                  </p>
                </div>
              </div>

              <div className="mt-3 rounded-xl bg-[var(--surface-2)] p-3">
                <p className="text-xs font-semibold text-[var(--text-muted)]">Per week plan</p>
                {project.weeklyPlans && project.weeklyPlans.length ? (
                  <div className="mt-2 space-y-2">
                    {project.weeklyPlans.map((w) => (
                      <div key={w.week} className="rounded-xl border border-[var(--border)] bg-[var(--surface)] p-2.5">
                        <div className="flex items-center justify-between">
                          <span className="rounded-full bg-[var(--accent-soft)] px-2 py-0.5 text-xs font-bold text-[var(--accent)]">Week {w.week}</span>
                          <span className="text-xs text-[var(--text-muted)]">
                            {w.startDate} → {w.endDate} · {w.plannedHours}h
                          </span>
                        </div>
                        <p className="mt-1 text-sm text-[var(--text)]">{w.goals.length ? w.goals.join(" · ") : "No goals"}</p>
                      </div>
                    ))}
                  </div>
                ) : (
                  <p className="mt-1 text-sm text-[var(--text-muted)]">No weekly breakdown.</p>
                )}
              </div>

              <div className="mt-3 rounded-xl bg-[var(--text)] p-3 text-[var(--bg)]">
                <div className="flex items-center justify-between text-sm">
                  <span className="opacity-80">Time spent / estimation</span>
                  <span className="font-bold">{spent}h / {approved}h</span>
                </div>
                <div className="mt-2 h-2 w-full overflow-hidden rounded-full bg-white/20">
                  <div className="h-full rounded-full bg-white" style={{ width: `${Math.min(100, pct)}%` }} />
                </div>
                <p className="mt-1 text-[11px] opacity-70">Every developer’s logged hours reflect here automatically.</p>
              </div>
            </>
          ) : (
            <p className="text-sm text-[var(--text-muted)]">No delivery info yet — add start/end dates and approved hours when creating the project.</p>
          )}
        </section>

        {/* 3. Team */}
        <section className="rounded-2xl border border-[var(--border)] bg-[var(--surface)] p-4 shadow-sm">
          <div className="mb-3 flex items-center gap-1.5 text-sm font-bold text-[var(--text)]">
            <Users size={15} className="text-[var(--accent)]" /> Who will work
          </div>
          {project.teamSpec ? (
            <div className="space-y-3">
              <TeamRow label="Frontend" ids={project.teamSpec.frontendIds} usersById={usersById} projectId={project.id} hoursForUserOn={hoursForUserOn} />
              <TeamRow label="Backend" ids={project.teamSpec.backendIds} usersById={usersById} projectId={project.id} hoursForUserOn={hoursForUserOn} />
              <div className="rounded-xl border border-[var(--border)] bg-[var(--surface-2)] p-3">
                <p className="flex items-center gap-1 text-xs font-semibold text-[var(--text-muted)]">
                  <ShieldCheck size={13} className="text-[var(--accent)]" /> Coordinator — senior (code review, GitHub merge, full access)
                </p>
                {project.teamSpec.coordinatorId ? (
                  <div className="mt-2 flex items-center gap-3">
                    <span
                      className="flex h-10 w-10 items-center justify-center rounded-full text-sm font-bold text-white"
                      style={{ background: usersById.get(project.teamSpec.coordinatorId)?.avatarColor }}
                    >
                      {usersById.get(project.teamSpec.coordinatorId)?.initials}
                    </span>
                    <div>
                      <p className="text-sm font-semibold text-[var(--text)]">{usersById.get(project.teamSpec.coordinatorId)?.name}</p>
                      <p className="text-xs text-[var(--text-muted)]">Has access to every file · merges on GitHub</p>
                    </div>
                  </div>
                ) : (
                  <p className="mt-1 text-sm text-[var(--text-muted)]">No coordinator assigned.</p>
                )}
              </div>
            </div>
          ) : (
            <p className="text-sm text-[var(--text-muted)]">No structured team yet.</p>
          )}

          <div className="mt-4">
            <p className="text-xs font-semibold text-[var(--text-muted)]">All members</p>
            <div className="mt-2 space-y-2">
              {memberUsers.map((m) => (
                <div key={m.id} className="flex items-center gap-3 rounded-xl bg-[var(--surface-2)] p-2.5">
                  <span className="flex h-8 w-8 items-center justify-center rounded-full text-xs font-bold text-white" style={{ background: m.avatarColor }}>
                    {m.initials}
                  </span>
                  <div className="min-w-0 flex-1">
                    <p className="text-sm font-semibold text-[var(--text)]">{m.name}</p>
                    <p className="text-xs text-[var(--text-muted)]">{roleBadge(m)} · {hoursForUserOn(m.id, project.id)}h on this project</p>
                  </div>
                  {isManager ? (
                    <button
                      onClick={() => {
                        removeProjectMember(project.id, m.id);
                        showToast(`${m.name} removed`);
                      }}
                      className="flex h-8 w-8 items-center justify-center rounded-lg text-[var(--text-muted)] active:bg-white"
                    >
                      <UserMinus size={15} />
                    </button>
                  ) : null}
                </div>
              ))}
              {memberUsers.length === 0 ? <p className="text-sm text-[var(--text-muted)]">No members.</p> : null}
            </div>
          </div>

          {isManager && nonMembers.length > 0 ? (
            <div className="mt-3">
              <PickerDropdown
                label="Add member"
                value="__none"
                onChange={(v) => {
                  if (v === "__none" || !v) return;
                  addProjectMember(project.id, v);
                  showToast(`${usersById.get(v)?.name} added`);
                }}
                icon={<Users size={13} />}
                placeholder="+ Add member…"
                options={[
                  { value: "__none", label: "+ Add member…" },
                  ...nonMembers.map((u) => ({
                    value: u.id,
                    label: `${u.name} · ${roleBadge(u)}`,
                  })),
                ]}
              />
            </div>
          ) : null}
        </section>

        {/* 4. Timeline */}
        <section className="rounded-2xl border border-[var(--border)] bg-[var(--surface)] p-4 shadow-sm">
          <div className="mb-3 flex items-center justify-between">
            <div className="flex items-center gap-1.5 text-sm font-bold text-[var(--text)]"><Layers size={15} className="text-[var(--accent)]" /> Timeline</div>
            <span className="rounded-full bg-[var(--surface-2)] px-2 py-1 text-xs text-[var(--text-muted)]">{(project.timeline ?? []).length} milestones</span>
          </div>
          {(project.timeline ?? []).length ? (
            <div className="space-y-2">
              {project.timeline!.map((it) => (
                <div key={it.id} className="rounded-xl border border-[var(--border)] bg-[var(--surface-2)] p-3">
                  <div className="flex items-start justify-between gap-2">
                    <div>
                      <p className="text-sm font-semibold text-[var(--text)]">{it.module} — {it.feature}</p>
                      <p className="mt-0.5 flex items-center gap-2 text-xs text-[var(--text-muted)]">
                        <Clock size={12} /> {it.estimatedHours}h · {it.estimatedDays} days
                      </p>
                      {it.assigneeId ? <p className="text-xs text-[var(--text-muted)]">Assignee: {usersById.get(it.assigneeId)?.name}</p> : null}
                    </div>
                    <span className={`shrink-0 rounded-full px-2.5 py-1 text-xs font-semibold ${it.status === "done" ? "bg-[var(--success)]/15 text-[var(--success)]" : it.status === "in_progress" ? "bg-[var(--accent-soft)] text-[var(--accent)]" : "bg-black/5 text-[var(--text-muted)]"}`}>
                      {it.status}
                    </span>
                  </div>
                </div>
              ))}
            </div>
          ) : (
            <p className="rounded-xl bg-[var(--surface-2)] p-3 text-sm text-[var(--text-muted)]">No milestones yet. Add a module/feature below.</p>
          )}

          {isManager ? (
            <div className="mt-4 rounded-xl border border-dashed border-[var(--border)] bg-[var(--surface-2)] p-3">
              <p className="mb-2 text-xs font-semibold text-[var(--text-muted)]">Add milestone</p>
              <div className="grid grid-cols-2 gap-2">
                <input value={draft.module} onChange={(e) => setDraft((p) => ({ ...p, module: e.target.value }))} placeholder="Module (e.g. Auth)" className="rounded-xl border border-[var(--border)] bg-[var(--surface)] px-3 py-2 text-sm text-[var(--text)]" />
                <input value={draft.feature} onChange={(e) => setDraft((p) => ({ ...p, feature: e.target.value }))} placeholder="Feature (e.g. Login UI)" className="rounded-xl border border-[var(--border)] bg-[var(--surface)] px-3 py-2 text-sm text-[var(--text)]" />
                <input type="number" value={draft.hrs} onChange={(e) => setDraft((p) => ({ ...p, hrs: e.target.value }))} placeholder="Hours" className="rounded-xl border border-[var(--border)] bg-[var(--surface)] px-3 py-2 text-sm text-[var(--text)]" />
                <input type="number" value={draft.days} onChange={(e) => setDraft((p) => ({ ...p, days: e.target.value }))} placeholder="Days" className="rounded-xl border border-[var(--border)] bg-[var(--surface)] px-3 py-2 text-sm text-[var(--text)]" />
              </div>
              <button
                onClick={() => {
                  if (!draft.module.trim() || !draft.feature.trim()) return showToast("Module & feature required");
                  addTimelineItem(project.id, {
                    module: draft.module.trim(),
                    feature: draft.feature.trim(),
                    estimatedHours: parseFloat(draft.hrs) || 0,
                    estimatedDays: parseFloat(draft.days) || 0,
                    status: "planned",
                  });
                  setDraft({ module: "", feature: "", hrs: "", days: "" });
                  showToast("Milestone added");
                }}
                className="mt-2 flex w-full items-center justify-center gap-1 rounded-xl bg-[var(--accent)] py-2.5 text-sm font-semibold text-white"
              >
                <Plus size={14} /> Add
              </button>
            </div>
          ) : null}
        </section>

        {/* 5. Stats */}
        <section className="rounded-2xl border border-[var(--border)] bg-[var(--surface)] p-4 shadow-sm">
          <div className="mb-3 flex items-center gap-1.5 text-sm font-bold text-[var(--text)]"><Bug size={15} className="text-[var(--accent)]" /> Project stats</div>
          <div className="grid grid-cols-3 gap-2">
            <div className="rounded-xl bg-[var(--surface-2)] p-3 text-center"><p className="text-xl font-bold text-[var(--text)]">{spent}h</p><p className="text-[11px] text-[var(--text-muted)]">Spent</p></div>
            <div className="rounded-xl bg-[var(--surface-2)] p-3 text-center"><p className="text-xl font-bold text-[var(--text)]">{approved || "—"}</p><p className="text-[11px] text-[var(--text-muted)]">Approved</p></div>
            <div className="rounded-xl bg-[var(--surface-2)] p-3 text-center"><p className="text-xl font-bold text-[var(--text)]">{bugCount}</p><p className="text-[11px] text-[var(--text-muted)]">Bugs/Issues</p></div>
          </div>
          <div className="mt-3 grid grid-cols-2 gap-2">
            <div className="rounded-xl bg-[var(--surface-2)] p-3">
              <p className="text-xs font-semibold text-[var(--text-muted)]">By kind</p>
              <div className="mt-2 flex flex-wrap gap-1.5">
                {Object.entries(kindCounts).length ? Object.entries(kindCounts).map(([k, c]) => (
                  <span key={k} className={`rounded-full px-2.5 py-1 text-xs font-medium ${TASK_KIND_META[k as keyof typeof TASK_KIND_META]?.bg ?? "bg-white text-[var(--text-muted)]"}`}>{TASK_KIND_META[k as keyof typeof TASK_KIND_META]?.label ?? k}: {c}</span>
                )) : <span className="text-sm text-[var(--text-muted)]">No tasks</span>}
              </div>
            </div>
            <div className="rounded-xl bg-[var(--surface-2)] p-3">
              <p className="text-xs font-semibold text-[var(--text-muted)]">By module</p>
              <div className="mt-2 space-y-1.5">
                {Object.entries(moduleGroups).slice(0, 6).map(([m, c]) => (
                  <div key={m} className="flex items-center justify-between text-sm"><span className="truncate text-[var(--text)]">{m}</span><span className="font-bold text-[var(--text-muted)]">{c}</span></div>
                ))}
                {Object.entries(moduleGroups).length === 0 ? <span className="text-sm text-[var(--text-muted)]">—</span> : null}
              </div>
            </div>
          </div>
          <div className="mt-3 flex flex-wrap gap-2 text-xs">
            <span className="rounded-full bg-amber-500/15 px-3 py-1.5 font-medium text-amber-600">Failed: {failedCount}</span>
            <span className="rounded-full border border-[var(--border)] bg-[var(--surface-2)] px-3 py-1.5 text-[var(--text-muted)]">QA bug fails: {tasksOf.filter((t) => t.kind === "bug" && t.status === "failed").length}</span>
            <span className="rounded-full border border-[var(--border)] bg-[var(--surface-2)] px-3 py-1.5 text-[var(--text-muted)]">Total tickets: {tasksOf.length}</span>
          </div>
        </section>

        {/* Tickets */}
        <section className="rounded-2xl border border-[var(--border)] bg-[var(--surface)] p-4 shadow-sm">
          <div className="mb-3 flex items-center justify-between">
            <div className="flex items-center gap-1.5 text-sm font-bold text-[var(--text)]"><FolderKanban size={15} className="text-[var(--accent)]" /> Tickets · {tasksOf.length}</div>
            {isManager ? (
              <button onClick={() => setAddSheet(true)} className="flex items-center gap-1 rounded-lg bg-[var(--accent-soft)] px-2.5 py-1.5 text-xs font-semibold text-[var(--accent)]"><Plus size={13} /> Add ticket</button>
            ) : null}
          </div>
          {tasksOf.length === 0 ? (
            <p className="rounded-xl bg-[var(--surface-2)] p-3 text-sm text-[var(--text-muted)]">No tickets yet. Add one with kind = bug / rnd etc to feed stats.</p>
          ) : (
            <div className="space-y-2">
              {tasksOf.map((t) => {
                const canAssignQA = t.status === "ready_for_testing" || t.status === "in_testing";
                const taskHours = workLogs.filter((l) => l.taskId === t.id).reduce((s, l) => s + l.hours, 0);
                return (
                  <div key={t.id} className="rounded-xl border border-[var(--border)] bg-[var(--surface-2)] p-3">
                    <p className="truncate text-sm font-semibold text-[var(--text)]">{t.title}</p>
                    <div className="mt-1.5 flex flex-wrap items-center gap-1.5">
                      <span className={`${STATUS_META[t.status].badge} rounded-full px-2 py-0.5 text-[11px] font-medium`}>{STATUS_META[t.status].label}</span>
                      <span className={`rounded-full px-2 py-0.5 text-[11px] font-medium ${TASK_KIND_META[t.kind ?? "task"]?.bg}`}>{TASK_KIND_META[t.kind ?? "task"]?.label}</span>
                      {t.module ? <span className="rounded-full bg-white px-2 py-0.5 text-[11px] text-[var(--text-muted)]">{t.module}</span> : null}
                      <span className="flex items-center gap-1 rounded-full bg-white px-2 py-0.5 text-[11px] text-[var(--text-muted)]"><Clock size={11} />{taskHours}h{t.estimatedHours ? ` / ${t.estimatedHours}h est` : ""}</span>
                      <span className="text-[11px] text-[var(--text-muted)]">{usersById.get(t.assigneeId ?? "")?.name ?? "Unassigned"}</span>
                    </div>
                    {isManager ? (
                      <div className="mt-2">
                        <PickerDropdown
                          label="Reassign"
                          value={assigneeOverrides[t.id] ?? t.assigneeId ?? "__none"}
                          onChange={(v) => {
                            if (v === "__none" || !v) return;
                            const r = assignTask(t.id, v);
                            showToast(r.message);
                            if (r.ok) setAssigneeOverrides((p) => ({ ...p, [t.id]: v }));
                          }}
                          icon={<Users size={13} />}
                          placeholder="— reassign —"
                          options={[
                            { value: "__none", label: "— reassign —" },
                            ...memberUsers.map((m) => ({
                              value: m.id,
                              label: `${m.name}${m.isTester && !canAssignQA ? " (QA only in testing)" : ""}`,
                            })),
                          ]}
                        />
                      </div>
                    ) : null}
                  </div>
                );
              })}
            </div>
          )}
        </section>

        <div className="flex justify-center">
          <Link href="/projects" className="rounded-xl border border-[var(--border)] bg-[var(--surface)] px-5 py-2.5 text-sm font-medium text-[var(--text-muted)]">
            Back to projects
          </Link>
        </div>
      </div>

      <AddTaskSheet
        open={addSheet}
        onClose={() => setAddSheet(false)}
        onAdd={(input) => {
          addTask({ ...input, projectId });
          showToast("Ticket added");
          setAddSheet(false);
        }}
        assignableUsers={memberUsers}
        projects={projects}
      />

      {toast ? (
        <div className="pointer-events-none fixed bottom-24 left-1/2 z-40 -translate-x-1/2">
          <div className="animate-toast-in whitespace-nowrap rounded-full bg-[var(--text)] px-4 py-2.5 text-sm font-medium text-[var(--bg)] shadow-xl">{toast}</div>
        </div>
      ) : null}
    </div>
  );
}
