"use client";

import { useState } from "react";
import { FolderKanban, Plus, User as UserIcon, X } from "lucide-react";
import type { Project, TaskKind, TaskSource, User } from "@/lib/data/types";
import { TASK_KINDS, TASK_KIND_META } from "@/lib/data/types";
import { PickerDropdown } from "@/components/layout/PickerDropdown";

interface AddTaskSheetProps {
  open: boolean;
  onClose: () => void;
  onAdd: (input: {
    title: string;
    source: TaskSource;
    assigneeId: string | null;
    projectId: string | null;
    kind: TaskKind;
    module: string | null;
    estimatedHours: number | null;
  }) => void;
  assignableUsers: User[];
  projects: Project[];
}

export function AddTaskSheet({
  open,
  onClose,
  onAdd,
  assignableUsers,
  projects,
}: AddTaskSheetProps) {
  const [title, setTitle] = useState("");
  const [source, setSource] = useState<TaskSource>("Manual");
  const [assigneeId, setAssigneeId] = useState<string>("");
  const [projectId, setProjectId] = useState<string>("");
  const [kind, setKind] = useState<TaskKind>("task");
  const [moduleName, setModuleName] = useState("");
  const [estimatedHours, setEstimatedHours] = useState("");

  if (!open) return null;

  const selectedProject = projects.find((p) => p.id === projectId) ?? null;
  const timelineModules = selectedProject?.timeline ?? [];

  const submit = () => {
    const trimmed = title.trim();
    if (!trimmed) return;
    onAdd({
      title: trimmed,
      source,
      assigneeId: assigneeId || null,
      projectId: projectId || null,
      kind,
      module: moduleName.trim() || null,
      estimatedHours: estimatedHours ? parseFloat(estimatedHours) : null,
    });
    setTitle("");
    setSource("Manual");
    setAssigneeId("");
    setProjectId("");
    setKind("task");
    setModuleName("");
    setEstimatedHours("");
  };

  const selectClass =
    "w-full rounded-xl border border-[var(--border)] bg-[var(--surface-2)] px-3 py-2.5 text-sm text-[var(--text)] focus:border-[var(--accent)] focus:outline-none";

  return (
    <div className="fixed inset-0 z-30 flex items-end justify-center sm:items-center">
      <div
        className="absolute inset-0 bg-black/50 animate-fade-in"
        onClick={onClose}
      />
      <div className="relative z-10 max-h-[90svh] w-full max-w-[430px] overflow-y-auto rounded-t-3xl border border-b-0 border-[var(--border)] bg-[var(--surface)] p-5 animate-sheet-up sm:rounded-3xl sm:border-b">
        <div className="mx-auto mb-4 h-1.5 w-10 rounded-full bg-[var(--border)] sm:hidden" />
        <div className="mb-4 flex items-center justify-between">
          <h2 className="text-lg font-bold text-[var(--text)]">Add task</h2>
          <button
            onClick={onClose}
            aria-label="Close"
            className="flex h-9 w-9 items-center justify-center rounded-xl text-[var(--text-muted)] active:bg-[var(--surface-2)]"
          >
            <X size={20} />
          </button>
        </div>

        <div className="space-y-3">
          <input
            autoFocus
            value={title}
            onChange={(e) => setTitle(e.target.value)}
            onKeyDown={(e) => {
              if (e.key === "Enter") submit();
            }}
            placeholder="What do you need to do?"
            className="w-full rounded-xl border border-[var(--border)] bg-[var(--surface-2)] px-4 py-3 text-[var(--text)] placeholder:text-[var(--text-muted)]/60 focus:border-[var(--accent)] focus:outline-none focus:ring-2 focus:ring-[var(--accent-soft)]"
          />

          <div className="flex gap-2">
            {(["Manual", "Assigned"] as TaskSource[]).map((s) => (
              <button
                key={s}
                onClick={() => setSource(s)}
                className={`flex-1 rounded-xl border py-2 text-sm font-medium transition-colors ${
                  source === s
                    ? "border-[var(--accent)] bg-[var(--accent-soft)] text-[var(--accent)]"
                    : "border-[var(--border)] text-[var(--text-muted)]"
                }`}
              >
                {s}
              </button>
            ))}
          </div>

          <div>
            <label className="mb-1.5 block text-sm font-medium text-[var(--text-muted)]">Type</label>
            <div className="flex flex-wrap gap-1.5">
              {TASK_KINDS.map((k) => (
                <button
                  key={k}
                  onClick={() => setKind(k)}
                  className={`rounded-full px-3 py-1.5 text-xs font-semibold border transition-colors ${
                    kind === k ? "border-[var(--accent)] bg-[var(--accent)] text-white" : "border-[var(--border)] bg-[var(--surface-2)] text-[var(--text-muted)]"
                  }`}
                >
                  {TASK_KIND_META[k].label}
                </button>
              ))}
            </div>
            <p className="mt-1 text-[11px] text-[var(--text-muted)]">Pick R&D / Bug / Issue so QA stats are accurate.</p>
          </div>

          <div className="grid grid-cols-2 gap-2">
            <div>
              <label className="mb-1.5 block text-sm font-medium text-[var(--text-muted)]">Module</label>
              <input value={moduleName} onChange={(e) => setModuleName(e.target.value)} placeholder="e.g. Auth" className={selectClass} list="module-suggestions" />
              {timelineModules.length > 0 ? (
                <div className="mt-1.5 flex flex-wrap gap-1">
                  {Array.from(new Set(timelineModules.map((t) => t.module))).slice(0, 4).map((m) => (
                    <button
                      key={m}
                      type="button"
                      onClick={() => setModuleName(m)}
                      className={`rounded-full px-2 py-1 text-[11px] font-medium border ${moduleName === m ? "bg-[var(--accent-soft)] border-[var(--accent)] text-[var(--accent)]" : "bg-[var(--surface-2)] border-[var(--border)] text-[var(--text-muted)]"}`}
                    >
                      {m}
                    </button>
                  ))}
                </div>
              ) : null}
            </div>
            <div>
              <label className="mb-1.5 block text-sm font-medium text-[var(--text-muted)]">Est. hours</label>
              <input type="number" inputMode="decimal" value={estimatedHours} onChange={(e) => setEstimatedHours(e.target.value)} placeholder="e.g. 8" className={selectClass} />
            </div>
          </div>

          <div>
            <label className="mb-1.5 block text-sm font-medium text-[var(--text-muted)]">
              Assign to
            </label>
            <PickerDropdown
              label="Assignee"
              value={assigneeId || "__none"}
              onChange={(v) => setAssigneeId(v === "__none" ? "" : v)}
              icon={<UserIcon size={13} />}
              placeholder="Unassigned"
              options={[
                { value: "__none", label: "Unassigned" },
                ...assignableUsers.map((u) => ({
                  value: u.id,
                  label: `${u.name} · ${u.role}`,
                })),
              ]}
            />
          </div>

          <div>
            <label className="mb-1.5 block text-sm font-medium text-[var(--text-muted)]">
              Project
            </label>
            <PickerDropdown
              label="Project"
              value={projectId || "__none"}
              onChange={(v) => setProjectId(v === "__none" ? "" : v)}
              icon={<FolderKanban size={13} />}
              placeholder="No project"
              options={[
                { value: "__none", label: "No project" },
                ...projects.map((p) => ({
                  value: p.id,
                  label: p.name,
                  color: p.color,
                })),
              ]}
            />
          </div>
        </div>

        <button
          onClick={submit}
          disabled={!title.trim()}
          className="mt-4 flex w-full items-center justify-center gap-2 rounded-xl bg-[var(--accent)] py-3.5 text-sm font-semibold text-white shadow-lg shadow-[var(--accent-soft)] transition-transform active:scale-[0.98] disabled:opacity-40 disabled:active:scale-100"
        >
          <Plus size={18} />
          Add task
        </button>
      </div>
    </div>
  );
}
