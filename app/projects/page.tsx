"use client";

import { useEffect, useMemo, useState } from "react";
import { motion } from "framer-motion";
import {
  ArrowLeftRight,
  ChevronDown,
  FolderKanban,
  Plus,
  UserMinus,
  Users,
} from "lucide-react";
import { Header } from "@/components/layout/Header";
import { AddTaskSheet } from "@/components/tasks/AddTaskSheet";
import { STATUS_META } from "@/components/tasks/TaskCard";
import { NoteSheet } from "@/components/tasks/NoteSheet";
import { useAuth } from "@/lib/auth";
import { useData } from "@/lib/data/store";
import { useIsAdmin } from "@/lib/permissions";
import type { Task, User } from "@/lib/data/types";

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
  } = useData();

  const [addSheet, setAddSheet] = useState<{ open: boolean; projectId: string | null }>({
    open: false,
    projectId: null,
  });
  const [moveBackTarget, setMoveBackTarget] = useState<Task | null>(null);
  const [toast, setToast] = useState<string | null>(null);
  const [assigneeOverrides, setAssigneeOverrides] = useState<Record<string, string>>({});
  const [openProject, setOpenProject] = useState<string | null>(null);

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

  // Pending move-back requests across everything the PM can see.
  const pendingMoves = useMemo(() => tasks.filter((t) => t.moveRequest), [tasks]);

  return (
    <div className="flex h-full flex-col">
      <Header title="Projects" subtitle="Teams, members & tickets" actionIcon={FolderKanban} />

      <div className="flex-1 space-y-5 overflow-y-auto px-4 py-4 pb-28">
        {!isManager ? (
          <p className="rounded-2xl border border-[var(--border)] bg-[var(--surface)] p-4 text-sm text-[var(--text-muted)]">
            You&apos;re viewing the projects you&apos;re assigned to. The project
            manager manages members and testing here.
          </p>
        ) : null}

        {/* Move-back requests queue */}
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
                  <p className="truncate text-sm font-semibold text-[var(--text)]">
                    {t.title}
                  </p>
                  <p className="mt-0.5 text-xs text-[var(--text-muted)]">
                    {t.moveRequest?.note} — by{" "}
                    {usersById.get(t.moveRequest?.userId ?? "")?.name ?? "someone"}
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

        {/* Projects */}
        {visibleProjects.map((project, i) => {
          const memberUsers = users.filter((u) => membersOf(project.id).includes(u.id));
          const projectTasks = tasksOf(project.id);
          const nonMembers = users.filter((u) => !membersOf(project.id).includes(u.id));
          const isOpen = openProject === project.id;
          return (
            <motion.section
              key={project.id}
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.3, delay: i * 0.04 }}
              className="overflow-hidden rounded-2xl border border-[var(--border)] bg-[var(--surface)] shadow-sm"
            >
              <button
                onClick={() => setOpenProject(isOpen ? null : project.id)}
                className="flex w-full items-center justify-between px-4 py-3 text-left"
                style={{
                  background: `linear-gradient(135deg, ${project.color}22, transparent)`,
                }}
              >
                <div className="flex min-w-0 items-center gap-2">
                  <span className="h-3 w-3 shrink-0 rounded-full" style={{ background: project.color }} />
                  <h3 className="truncate text-[15px] font-bold text-[var(--text)]">
                    {project.name}
                  </h3>
                </div>
                <div className="flex shrink-0 items-center gap-2">
                  <span className="text-xs text-[var(--text-muted)]">
                    {projectTasks.length} tickets · {memberUsers.length} members
                  </span>
                  <motion.span
                    animate={{ rotate: isOpen ? 180 : 0 }}
                    transition={{ duration: 0.25 }}
                    className="flex h-6 w-6 items-center justify-center rounded-full bg-black/5 text-[var(--text-muted)]"
                  >
                    <ChevronDown size={16} />
                  </motion.span>
                </div>
              </button>

              {isOpen ? (
                <motion.div
                  initial={{ height: 0, opacity: 0 }}
                  animate={{ height: "auto", opacity: 1 }}
                  transition={{ duration: 0.28, ease: "easeOut" }}
                  className="overflow-hidden"
                >
                  <div className="space-y-3 p-4">
                    {/* Members */}
                    <div>
                      <div className="mb-1.5 flex items-center gap-1.5 text-xs font-semibold text-[var(--text-muted)]">
                        <Users size={13} /> Members
                      </div>
                      <div className="space-y-1.5">
                        {memberUsers.map((m) => (
                          <div key={m.id} className="flex items-center gap-2.5">
                            <span
                              className="flex h-7 w-7 shrink-0 items-center justify-center rounded-full text-[11px] font-bold text-white"
                              style={{ background: m.avatarColor }}
                            >
                              {m.initials}
                            </span>
                            <div className="min-w-0 flex-1">
                              <p className="truncate text-sm font-medium text-[var(--text)]">{m.name}</p>
                              <p className="truncate text-[11px] text-[var(--text-muted)]">
                                {roleBadge(m)} · {hoursForUserOn(m.id, project.id)}h here ·{" "}
                                {projectTasks.filter((t) => t.assigneeId === m.id).length} tickets
                              </p>
                            </div>
                            {isManager ? (
                              <button
                                onClick={() => removeProjectMember(project.id, m.id)}
                                aria-label={`Remove ${m.name}`}
                                className="flex h-8 w-8 items-center justify-center rounded-lg text-[var(--text-muted)] active:bg-[var(--surface-2)]"
                              >
                                <UserMinus size={15} />
                              </button>
                            ) : null}
                          </div>
                        ))}
                        {memberUsers.length === 0 ? (
                          <p className="text-xs text-[var(--text-muted)]">No members yet.</p>
                        ) : null}
                      </div>

                      {isManager && nonMembers.length > 0 ? (
                        <div className="mt-2">
                          <select
                            defaultValue=""
                            onChange={(e) => {
                              if (!e.target.value) return;
                              addProjectMember(project.id, e.target.value);
                              setToast(`${usersById.get(e.target.value)?.name} added to ${project.name}`);
                              e.target.value = "";
                            }}
                            className="w-full rounded-xl border border-[var(--border)] bg-[var(--surface-2)] px-3 py-2 text-sm text-[var(--text)] focus:border-[var(--accent)] focus:outline-none"
                          >
                            <option value="">+ Assign a member…</option>
                            {nonMembers.map((u) => (
                              <option key={u.id} value={u.id}>
                                {u.name} · {roleBadge(u)}
                              </option>
                            ))}
                          </select>
                        </div>
                      ) : null}
                    </div>

                    {/* Tickets */}
                    <div className="border-t border-[var(--border)] pt-3">
                      <div className="mb-1.5 flex items-center justify-between">
                        <div className="flex items-center gap-1.5 text-xs font-semibold text-[var(--text-muted)]">
                          <FolderKanban size={13} /> Tickets
                        </div>
                        {isManager ? (
                          <button
                            onClick={(e) => {
                              e.stopPropagation();
                              setAddSheet({ open: true, projectId: project.id });
                            }}
                            className="flex items-center gap-1 rounded-lg bg-[var(--accent-soft)] px-2 py-1 text-xs font-semibold text-[var(--accent)]"
                          >
                            <Plus size={13} /> Add ticket
                          </button>
                        ) : null}
                      </div>

                      {projectTasks.length === 0 ? (
                        <p className="text-xs text-[var(--text-muted)]">No tickets yet.</p>
                      ) : (
                        <div className="space-y-1.5">
                          {projectTasks.map((t) => {
                            const canAssignQA =
                              t.status === "ready_for_testing" || t.status === "in_testing";
                            return (
                              <div key={t.id} className="rounded-xl border border-[var(--border)] p-2.5">
                                <div className="min-w-0">
                                  <p className="truncate text-sm font-medium text-[var(--text)]">
                                    {t.title}
                                  </p>
                                  <div className="mt-1 flex items-center gap-1.5">
                                    <span className={`${STATUS_META[t.status].badge} rounded-full px-2 py-0.5 text-[11px] font-medium`}>
                                      {STATUS_META[t.status].label}
                                    </span>
                                    <span className="text-[11px] text-[var(--text-muted)]">
                                      {usersById.get(t.assigneeId ?? "")?.name ?? "Unassigned"}
                                    </span>
                                  </div>
                                </div>

                                {isManager ? (
                                  <div className="mt-2">
                                    <select
                                      value={
                                        assigneeOverrides[t.id] ??
                                        t.assigneeId ??
                                        ""
                                      }
                                      onChange={(e) => {
                                        const next = e.target.value;
                                        if (!next) return;
                                        const r = assignTask(t.id, next);
                                        setToast(r.message);
                                        if (r.ok) {
                                          setAssigneeOverrides((prev) => ({
                                            ...prev,
                                            [t.id]: next,
                                          }));
                                        }
                                      }}
                                      className="w-full rounded-lg border border-[var(--border)] bg-[var(--surface-2)] px-2 py-1.5 text-xs text-[var(--text)]"
                                    >
                                      <option value="">— reassign —</option>
                                      {memberUsers.map((m) => (
                                        <option key={m.id} value={m.id}>
                                          {m.name}
                                          {m.isTester && !canAssignQA ? " (QA only in testing)" : ""}
                                        </option>
                                      ))}
                                    </select>
                                    {!canAssignQA ? (
                                      <p className="mt-1 text-[11px] text-[var(--text-muted)]">
                                        QA assignment unlocks once the ticket is handed off for testing.
                                      </p>
                                    ) : null}
                                  </div>
                                ) : null}
                              </div>
                            );
                          })}
                        </div>
                      )}
                    </div>
                  </div>
                </motion.div>
              ) : null}
            </motion.section>
          );
        })}

        {/* Developer multi-project overview */}
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
                    <span
                      className="flex h-7 w-7 shrink-0 items-center justify-center rounded-full text-[11px] font-bold text-white"
                      style={{ background: u.avatarColor }}
                    >
                      {u.initials}
                    </span>
                    <div className="min-w-0 flex-1">
                      <p className="truncate text-sm font-medium text-[var(--text)]">
                        {u.name}
                        {u.isTester ? (
                          <span className="ml-1.5 text-[11px] font-semibold text-violet-500">QA</span>
                        ) : null}
                      </p>
                      <p className="truncate text-[11px] text-[var(--text-muted)]">
                        {theirProjects.map((p) => p.name).join(" · ") || "No project"}
                      </p>
                    </div>
                    <div className="flex gap-1">
                      {theirProjects.map((p) => (
                        <span
                          key={p.id}
                          title={p.name}
                          className="h-2.5 w-2.5 rounded-full"
                          style={{ background: p.color }}
                        />
                      ))}
                    </div>
                  </div>
                );
              })}
          </div>
        </section>
      </div>

      <AddTaskSheet
        open={addSheet.open}
        onClose={() => setAddSheet({ open: false, projectId: null })}
        onAdd={(input) => {
          const projectId = addSheet.projectId ?? input.projectId;
          addTask({ ...input, projectId });
          setToast("Ticket added.");
          setAddSheet({ open: false, projectId: null });
        }}
        assignableUsers={
          addSheet.projectId
            ? users.filter((u) => membersOf(addSheet.projectId!).includes(u.id))
            : users
        }
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
            setToast(r.message);
            setMoveBackTarget(null);
          }}
        />
      ) : null}

      {toast ? (
        <div className="pointer-events-none fixed bottom-24 left-1/2 z-40 -translate-x-1/2">
          <div className="animate-toast-in whitespace-nowrap rounded-full bg-[var(--text)] px-4 py-2.5 text-sm font-medium text-[var(--bg)] shadow-xl">
            {toast}
          </div>
        </div>
      ) : null}
    </div>
  );
}

function roleBadge(u: Pick<User, "role" | "isTester">): string {
  if (u.role === "admin") return "Admin";
  if (u.role === "manager") return "PM";
  return u.isTester ? "QA" : "Dev";
}