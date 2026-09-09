"use client";

import { useState } from "react";
import { Plus, X } from "lucide-react";
import type { Project, TaskSource, User } from "@/lib/data/types";

interface AddTaskSheetProps {
  open: boolean;
  onClose: () => void;
  onAdd: (input: {
    title: string;
    source: TaskSource;
    assigneeId: string | null;
    projectId: string | null;
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

  if (!open) return null;

  const submit = () => {
    const trimmed = title.trim();
    if (!trimmed) return;
    onAdd({
      title: trimmed,
      source,
      assigneeId: assigneeId || null,
      projectId: projectId || null,
    });
    setTitle("");
    setSource("Manual");
    setAssigneeId("");
    setProjectId("");
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
            <label className="mb-1.5 block text-sm font-medium text-[var(--text-muted)]">
              Assign to
            </label>
            <select
              value={assigneeId}
              onChange={(e) => setAssigneeId(e.target.value)}
              className={selectClass}
            >
              <option value="">Unassigned</option>
              {assignableUsers.map((u) => (
                <option key={u.id} value={u.id}>
                  {u.name} · {u.role}
                </option>
              ))}
            </select>
          </div>

          <div>
            <label className="mb-1.5 block text-sm font-medium text-[var(--text-muted)]">
              Project
            </label>
            <select
              value={projectId}
              onChange={(e) => setProjectId(e.target.value)}
              className={selectClass}
            >
              <option value="">No project</option>
              {projects.map((p) => (
                <option key={p.id} value={p.id}>
                  {p.name}
                </option>
              ))}
            </select>
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
