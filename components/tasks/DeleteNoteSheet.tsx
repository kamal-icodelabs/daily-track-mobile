"use client";

import { useState } from "react";
import { Trash2, X } from "lucide-react";

interface DeleteNoteSheetProps {
  open: boolean;
  taskTitle: string;
  noteRequired: boolean;
  onClose: () => void;
  onConfirm: (note?: string) => void;
}

export function DeleteNoteSheet({
  open,
  taskTitle,
  noteRequired,
  onClose,
  onConfirm,
}: DeleteNoteSheetProps) {
  const [note, setNote] = useState("");

  if (!open) return null;

  const confirm = () => {
    onConfirm(note.trim() || undefined);
    setNote("");
  };

  return (
    <div className="fixed inset-0 z-30 flex items-end justify-center sm:items-center">
      <div className="absolute inset-0 bg-black/50 animate-fade-in" onClick={onClose} />
      <div className="relative z-10 w-full max-w-[430px] rounded-t-3xl border border-b-0 border-[var(--border)] bg-[var(--surface)] p-5 animate-sheet-up sm:rounded-3xl sm:border-b">
        <div className="mx-auto mb-4 h-1.5 w-10 rounded-full bg-[var(--border)] sm:hidden" />
        <div className="mb-4 flex items-center justify-between">
          <h2 className="flex items-center gap-2 text-lg font-bold text-[var(--danger)]">
            <Trash2 size={18} />
            Delete ticket
          </h2>
          <button
            onClick={onClose}
            aria-label="Close"
            className="flex h-9 w-9 items-center justify-center rounded-xl text-[var(--text-muted)] active:bg-[var(--surface-2)]"
          >
            <X size={20} />
          </button>
        </div>

        <p className="mb-4 truncate text-sm font-semibold text-[var(--text)]">
          {taskTitle}
        </p>
        <p className="mb-4 text-sm text-[var(--text-muted)]">
          This permanently removes the ticket and its time logs.
          {noteRequired
            ? " A note explaining the deletion is required and will be shown to your project manager."
            : " You can add a note for the project manager (optional)."}
        </p>

        <label className="block">
          <span className="mb-1.5 block text-sm font-medium text-[var(--text-muted)]">
            Deletion note {noteRequired ? "(required)" : "(optional)"}
          </span>
          <textarea
            autoFocus
            value={note}
            onChange={(e) => setNote(e.target.value)}
            rows={3}
            placeholder="Why is this ticket being deleted?"
            className="w-full resize-none rounded-xl border border-[var(--border)] bg-[var(--surface-2)] px-4 py-3 text-[var(--text)] placeholder:text-[var(--text-muted)]/60 focus:border-[var(--accent)] focus:outline-none focus:ring-2 focus:ring-[var(--accent-soft)]"
          />
        </label>

        <button
          onClick={confirm}
          disabled={noteRequired && !note.trim()}
          className="mt-4 flex w-full items-center justify-center gap-2 rounded-xl bg-[var(--danger)] py-3.5 text-sm font-semibold text-white transition-transform active:scale-[0.98] disabled:opacity-40 disabled:active:scale-100"
        >
          <Trash2 size={18} />
          Delete ticket
        </button>
      </div>
    </div>
  );
}
