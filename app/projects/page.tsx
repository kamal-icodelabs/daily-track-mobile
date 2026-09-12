"use client";

import { useEffect, useMemo, useState } from "react";
import { motion } from "framer-motion";
import Link from "next/link";
import {
  ArrowLeftRight,
  Bug,
  CalendarDays,
  ChevronDown,
  Clock,
  ExternalLink,
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
import { NoteSheet } from "@/components/tasks/NoteSheet";
import { CreateProjectSheet } from "@/components/projects/CreateProjectSheet";
import { useAuth } from "@/lib/auth";
import { useData } from "@/lib/data/store";
import { useIsAdmin } from "@/lib/permissions";
import { useSimulatedIntegrations } from "@/lib/integrations/IntegrationProvider";
import { TASK_KIND_META } from "@/lib/data/types";
import type { Task, User, Project } from "@/lib/data/types";

export default function ProjectsPage() {
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
    approveMoveBack,
    createProject,
    addTimelineItem,
  } = useData();

  const [addSheet, setAddSheet] = useState<{ open: boolean; projectId: string | null }>({
    open: false,
    projectId: null,
  });
  const [createOpen, setCreateOpen] = useState(false);
  const [moveBackTarget, setMoveBackTarget] = useState<Task | null>(null);
  const [toast, setToast] = useState<string | null>(null);
  const { pushToast } = useSimulatedIntegrations();
  const notify = (msg: string) => {
    notify(msg);
    pushToast({ kind: "info", title: msg, body: msg });
  };
  const [assigneeOverrides, setAssigneeOverrides] = useState<Record<string, string>>({});
  const [openProject, setOpenProject] = useState<string | null>(null);
  const [timelineDraft, setTimelineDraft] = useState<Record<string, { module: string; feature: string; hrs: string; days: string }>>({});

  useEffect(() => {
    if (!toast) return;
    const t = setTimeout(() => setToast(null), 2600);
    return () => clearTimeout(t);
  }, [toast]);

  const me = user!;
  const isManager = isAdmin || me.role === "manager";

  const usersById = useMemo(() => new Map(users.map((u) => [u.id, u])), [users]);

  const membersOf = (projectId: string) =>
    projects.find((p) => p.id === projectId)?.memberIds ?? [];

  const tasksOf = (projectId: string) => tasks.filter((t) => t.projectId === projectId);

  const hoursForProject = (projectId: string) => {
    const ids = new Set(tasksOf(projectId).map((t) => t.id));
    return workLogs.filter((l) => ids.has(l.taskId)).reduce((s, l) => s + l.hours, 0);
  };

  const hoursForUserOn = (userId: string, projectId: string) => {
    const ids = new Set(tasksOf(projectId).map((t) => t.id));
    return workLogs
      .filter((l) => l.userId === userId && ids.has(l.taskId))
      .reduce((s, l) => s + l.hours, 0);
  };

  const visibleProjects = useMemo(() => {
    if (isManager) return projects;
    return projects.filter((p) => p.memberIds.includes(me.id));
  }, [projects, isManager, me.id]);

  const pendingMoves = useMemo(() => tasks.filter((t) => t.moveRequest), [tasks]);

  return (
    <div className="flex h-full flex-col">
      <Header
        title="Projects"
        subtitle="Teams, members & tickets"
        actionIcon={isManager ? Plus : FolderKanban}
        onAction={isManager ? () => setCreateOpen(true) : undefined}
        actionLabel={isManager ? "New project" : undefined}
      />

      <div className="flex-1 space-y-5 overflow-y-auto px-4 py-4 pb-28">
        {isManager ? (
          <button
            onClick={() => setCreateOpen(true)}
            className="flex w-full items-center justify-center gap-2 rounded-2xl border border-dashed border-[var(--border)] bg-[var(--surface)] py-3 text-sm font-semibold text-[var(--accent)] active:bg-[var(--surface-2)]"
          >
            <Plus size={16} /> Create project
          </button>
        ) : (
          <p className="rounded-2xl border border-[var(--border)] bg-[var(--surface)] p-4 text-sm text-[var(--text-muted)]">
            You&apos;re viewing the projects you&apos;re assigned to. The project manager manages members and testing here.
          </p>
        )}

        {pendingMoves.length > 0 ? (
          <section>
            <div className="mb-2 flex items-center gap-2 px-1">
              <ArrowLeftRight size={16} className="text-amber-500" />
              <h2 className="text-sm font-semibold text-[var(--text-muted)]">
                Move-back requests · {pendingMoves.length}
              </h2>
            </div>
            <div className="space-y-2">
              {pendingMoves.map((t) => (
                <div
                  key={t.id}
                  className="rounded-2xl border border-amber-500/30 bg-amber-500/5 p-3"
                >
                  <p className="truncate text-sm font-semibold text-[var(--text)]">{t.title}</p>
                  <p className="mt-0.5 text-xs text-[var(--text-muted)]">
                    {t.moveRequest?.note} — by {usersById.get(t.moveRequest?.userId ?? "")?.name ?? "someone"}
                  </p>
                  <div className="mt-2 flex items-center gap-2">
                    <span className={`${STATUS_META[t.status].badge} rounded-full px-2 py-0.5 text-[11px] font-medium`}>
                      {STATUS_META[t.status].label}
                    </span>
                    {isManager ? (
                      <button
                        onClick={() => setMoveBackTarget(t)}
                        className="rounded-lg bg-[var(--success)] px-3 py-1.5 text-xs font-semibold text-white active:scale-95"
                      >
                        Approve move-back
                      </button>
                    ) : null}
                  </div>
                </div>
              ))}
            </div>
          </section>
        ) : null}

        {visibleProjects.map((project, i) => {
          const memberUsers = users.filter((u) => membersOf(project.id).includes(u.id));
          const projectTasks = tasksOf(project.id);
          const nonMembers = users.filter((u) => !membersOf(project.id).includes(u.id));
          const isOpen = openProject === project.id;
          const spent = hoursForProject(project.id);
          const approved = project.delivery?.approvedHours ?? 0;
          const pct = approved ? Math.min(100, Math.round((spent / approved) * 100)) : 0;

          // stats per kind / module
          const kindCounts = projectTasks.reduce((acc, t) => {
            const k = t.kind ?? "task";
            acc[k] = (acc[k] ?? 0) + 1;
            return acc;
          }, {} as Record<string, number>);
          const bugCount = (kindCounts["bug"] ?? 0) + (kindCounts["issue"] ?? 0);
          const failedCount = projectTasks.filter((t) => t.status === "failed").length;
          const moduleGroups = projectTasks.reduce((acc, t) => {
            const m = t.module ?? "—";
            acc[m] = (acc[m] ?? 0) + 1;
            return acc;
          }, {} as Record<string, number>);

          const timelineDraftVal = timelineDraft[project.id] ?? { module: "", feature: "", hrs: "", days: "" };

          return (
            <motion.section
              key={project.id}
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.3, delay: i * 0.04 }}
              className="overflow-hidden rounded-2xl border border-[var(--border)] bg-[var(--surface)] shadow-sm"
            >
              <div
                className="flex w-full items-center justify-between px-4 py-3"
                style={{
                  background: `linear-gradient(135deg, ${project.color}22, transparent)`,
                }}
              >
                <button
                  onClick={() => setOpenProject(isOpen ? null : project.id)}
                  className="flex min-w-0 flex-1 items-center gap-2 text-left"
                >
                  <span className="h-3 w-3 shrink-0 rounded-full" style={{ background: project.color }} />
                  <div className="min-w-0">
                    <h3 className="truncate text-[15px] font-bold text-[var(--text)]">{project.name}</h3>
                    {project.client ? (
                      <p className="truncate text-[11px] text-[var(--text-muted)]">
                        {project.client.name} · {project.client.origin}
                      </p>
                    ) : null}
                  </div>
                </button>
                <div className="flex shrink-0 items-center gap-2">
                  <span className="hidden text-xs text-[var(--text-muted)] sm:inline">
                    {projectTasks.length} tickets · {memberUsers.length} members
                  </span>
                  <Link
                    href={`/projects/${project.id}`}
                    onClick={(e) => e.stopPropagation()}
                    className="flex h-8 shrink-0 items-center gap-1.5 whitespace-nowrap rounded-full bg-[var(--accent)] px-3.5 text-xs font-bold text-[var(--bg)] shadow-md shadow-[var(--accent-soft)] ring-1 ring-black/5 active:scale-95"
                    title="Open full detail page"
                  >
                    <ExternalLink size={14} strokeWidth={2.2} /> Detail
                  </Link>
                  <button
                    onClick={() => setOpenProject(isOpen ? null : project.id)}
                    className="flex h-6 w-6 items-center justify-center rounded-full bg-black/5 text-[var(--text-muted)]"
                  >
                    <motion.span animate={{ rotate: isOpen ? 180 : 0 }} transition={{ duration: 0.25 }} className="flex">
                      <ChevronDown size={16} />
                    </motion.span>
                  </button>
                </div>
              </div>

              {/* mini hours bar */}
              {approved ? (
                <div className="px-4 pb-2 pt-2">
                  <div className="flex items-center justify-between pt-4 text-[11px]">
                    <span className="text-[var(--text-muted)]">
                      Hours · {spent} / {approved} · {pct}%
                    </span>
                    <span className={pct >= 90 ? "text-[var(--danger)]" : pct >= 70 ? "text-amber-600" : "text-[var(--text-muted)]"}>
                      {approved - spent >= 0 ? `${approved - spent}h left` : `${spent - approved}h over`}
                    </span>
                  </div>
                  <div className="mt-1 h-1.5 w-full overflow-hidden rounded-full bg-black/5">
                    <div
                      className="h-full rounded-full transition-all"
                      style={{ width: `${pct}%`, background: pct >= 90 ? "var(--danger)" : project.color }}
                    />
                  </div>
                </div>
              ) : null}

              {isOpen ? (
                <motion.div
                  initial={{ height: 0, opacity: 0 }}
                  animate={{ height: "auto", opacity: 1 }}
                  transition={{ duration: 0.28, ease: "easeOut" }}
                  className="overflow-hidden"
                >
                  <div className="space-y-3 p-4">
                    {/* Accordion: only stats — full docs/flow/weekly/timeline/team on detail page (single Detail pill in header) */}
                    {/* 5. Stats */}
                    <section className="rounded-xl border border-[var(--border)] bg-[var(--surface-2)] p-3">
                      <div className="mb-2 flex items-center gap-1.5 text-xs font-bold text-[var(--text)]"><Bug size={13} className="text-[var(--accent)]" /> Stats</div>
                      <div className="grid grid-cols-3 gap-2">
                        <div className="rounded-lg bg-[var(--surface)] p-2 text-center">
                          <p className="text-lg font-bold text-[var(--text)]">{spent}h</p>
                          <p className="text-[11px] text-[var(--text-muted)]">Spent</p>
                        </div>
                        <div className="rounded-lg bg-[var(--surface)] p-2 text-center">
                          <p className="text-lg font-bold text-[var(--text)]">{approved || "—"}</p>
                          <p className="text-[11px] text-[var(--text-muted)]">Approved</p>
                        </div>
                        <div className="rounded-lg bg-[var(--surface)] p-2 text-center">
                          <p className="text-lg font-bold text-[var(--text)]">{bugCount}</p>
                          <p className="text-[11px] text-[var(--text-muted)]">Bugs / Issues</p>
                        </div>
                      </div>
                      <div className="mt-2 grid grid-cols-2 gap-2">
                        <div className="rounded-lg bg-[var(--surface)] p-2">
                          <p className="text-[11px] font-semibold text-[var(--text-muted)]">By kind</p>
                          <div className="mt-1 flex flex-wrap gap-1">
                            {Object.entries(kindCounts).length ? Object.entries(kindCounts).map(([k, c]) => (
                              <span key={k} className={`rounded-full px-2 py-0.5 text-[11px] font-medium ${TASK_KIND_META[k as keyof typeof TASK_KIND_META]?.bg ?? "bg-[var(--surface-2)] text-[var(--text-muted)]"}`}>
                                {TASK_KIND_META[k as keyof typeof TASK_KIND_META]?.label ?? k}: {c}
                              </span>
                            )) : <span className="text-xs text-[var(--text-muted)]">No tasks</span>}
                          </div>
                        </div>
                        <div className="rounded-lg bg-[var(--surface)] p-2">
                          <p className="text-[11px] font-semibold text-[var(--text-muted)]">By module</p>
                          <div className="mt-1 space-y-1">
                            {Object.entries(moduleGroups).slice(0, 4).map(([m, c]) => (
                              <div key={m} className="flex items-center justify-between text-xs">
                                <span className="truncate text-[var(--text)]">{m}</span>
                                <span className="font-semibold text-[var(--text-muted)]">{c}</span>
                              </div>
                            ))}
                            {Object.entries(moduleGroups).length === 0 ? <span className="text-xs text-[var(--text-muted)]">—</span> : null}
                          </div>
                        </div>
                      </div>
                      <div className="mt-2 flex gap-2 text-xs">
                        <span className="rounded-full bg-amber-500/15 px-2 py-1 font-medium text-amber-600">Failed: {failedCount}</span>
                        <span className="rounded-full bg-[var(--surface)] border border-[var(--border)] px-2 py-1 text-[var(--text-muted)]">QA reported bugs: {projectTasks.filter((t) => t.kind === "bug" && t.status === "failed").length}</span>
                      </div>
                    </section>
                  </div>
                </motion.div>
              ) : null}
            </motion.section>
          );
        })}

        <section className="rounded-2xl border border-[var(--border)] bg-[var(--surface)] p-4 shadow-sm">
          <div className="mb-2 flex items-center gap-2">
            <Users size={16} className="text-[var(--accent)]" />
            <h2 className="text-sm font-semibold text-[var(--text-muted)]">Who works where</h2>
          </div>
          <div className="space-y-2">
            {users
              .filter((u) => u.role === "employee")
              .map((u) => {
                const theirProjects = projects.filter((p) => p.memberIds.includes(u.id));
                return (
                  <div key={u.id} className="flex items-center gap-2.5">
                    <span className="flex h-7 w-7 shrink-0 items-center justify-center rounded-full text-[11px] font-bold text-white" style={{ background: u.avatarColor }}>
                      {u.initials}
                    </span>
                    <div className="min-w-0 flex-1">
                      <p className="truncate text-sm font-medium text-[var(--text)]">
                        {u.name}
                        {u.isTester ? <span className="ml-1.5 text-[11px] font-semibold text-violet-500">QA</span> : null}
                      </p>
                      <p className="truncate text-[11px] text-[var(--text-muted)]">{theirProjects.map((p) => p.name).join(" · ") || "No project"}</p>
                    </div>
                    <div className="flex gap-1">
                      {theirProjects.map((p) => (
                        <span key={p.id} title={p.name} className="h-2.5 w-2.5 rounded-full" style={{ background: p.color }} />
                      ))}
                    </div>
                  </div>
                );
              })}
          </div>
        </section>
      </div>

      <CreateProjectSheet
        open={createOpen}
        onClose={() => setCreateOpen(false)}
        onCreate={(input) => {
          const p = createProject(input);
          notify(`Project "${p.name}" created`);
          setOpenProject(p.id);
        }}
      />

      <AddTaskSheet
        open={addSheet.open}
        onClose={() => setAddSheet({ open: false, projectId: null })}
        onAdd={(input) => {
          const projectId = addSheet.projectId ?? input.projectId;
          addTask({ ...input, projectId });
          notify("Ticket added.");
          setAddSheet({ open: false, projectId: null });
        }}
        assignableUsers={addSheet.projectId ? users.filter((u) => membersOf(addSheet.projectId!).includes(u.id)) : users}
        projects={projects}
      />

      {moveBackTarget ? (
        <NoteSheet
          open
          title="Approve move-back"
          subtitle="Move this ticket back to the To-do column."
          taskTitle={moveBackTarget.title}
          noteRequired={false}
          confirmLabel="Move to To-do"
          onClose={() => setMoveBackTarget(null)}
          onConfirm={() => {
            const r = approveMoveBack(moveBackTarget.id);
            notify(r.message);
            setMoveBackTarget(null);
          }}
        />
      ) : null}

      {toast ? (
        <div className="pointer-events-none fixed bottom-24 left-1/2 z-40 -translate-x-1/2">
          <div className="animate-toast-in whitespace-nowrap rounded-full bg-[var(--text)] px-4 py-2.5 text-sm font-medium text-[var(--bg)] shadow-xl">{toast}</div>
        </div>
      ) : null}
    </div>
  );
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
              <span key={id} className="inline-flex items-center gap-1.5 rounded-full border border-[var(--border)] bg-[var(--surface)] px-2 py-1 text-xs">
                <span className="flex h-5 w-5 items-center justify-center rounded-full text-[10px] font-bold text-white" style={{ background: u.avatarColor }}>
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

function roleBadge(u: Pick<User, "role" | "isTester">): string {
  if (u.role === "admin") return "Admin";
  if (u.role === "manager") return "PM";
  return u.isTester ? "QA" : "Dev";
}
