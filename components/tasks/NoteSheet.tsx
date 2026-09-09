"use client";

import { useState } from "react";
import { AlertTriangle, MessageSquareText, X } from "lucide-react";

interface NoteSheetProps {
  open: boolean;
  title: string;
  subtitle: string;
  taskTitle: string;
  noteRequired: boolean;
  noteLabel?: string;
  confirmLabel?: string;
  confirmTone?: "primary" | "danger";
  onClose: () => void;
  onConfirm: (note: string) => void;
}

export function NoteSheet({
  open,
  title,
  subtitle,
  taskTitle,
  noteRequired,
  noteLabel = "Note",
  confirmLabel = "Confirm",
  confirmTone = "primary",
  onClose,
  onConfirm,
}: NoteSheetProps) {
  const [note, setNote] = useState("");

  if (!open) return null;

  const confirm = () => {
    onConfirm(note.trim());
    setNote("");
  };

  return (
    <div className="fixed inset-0 z-30 flex items-end justify-center sm:items-center">
      <div className="absolute inset-0 bg-black/50 animate-fade-in" onClick={onClose} />
      <div className="relative z-10 w-full max-w-[430px] rounded-t-3xl border border-b-0 border-[var(--border)] bg-[var(--surface)] p-5 animate-sheet-up sm:rounded-3xl sm:border-b">
        <div className="mx-auto mb-4 h-1.5 w-10 rounded-full bg-[var(--border)] sm:hidden" />
        <div className="mb-4 flex items-center justify-between">
          <h2 className="flex items-center gap-2 text-lg font-bold text-[var(--text)]">
            {confirmTone === "danger" ? (
              <AlertTriangle size={18} className="text-[var(--danger)]" />
            ) : (
              <MessageSquareText size={18} className="text-[var(--accent)]" />
            )}
            {title}
          </h2>
          <button
            onClick={onClose}
            aria-label="Close"
            className="flex h-9 w-9 items-center justify-center rounded-xl text-[var(--text-muted)] active:bg-[var(--surface-2)]"
          >
            <X size={20} />
          </button>
        </div>

        <p className="mb-1 text-sm text-[var(--text-muted)]">{subtitle}</p>
        <p className="mb-4 truncate text-sm font-semibold text-[var(--text)]">
          {taskTitle}
        </p>

        <label className="block">
          <span className="mb-1.5 block text-sm font-medium text-[var(--text-muted)]">
            {noteLabel} {noteRequired ? "(required)" : "(optional)"}
          </span>
          <textarea
            autoFocus
            value={note}
            onChange={(e) => setNote(e.target.value)}
            rows={3}
            placeholder="Add a note for the project manager / QA…"
            className="w-full resize-none rounded-xl border border-[var(--border)] bg-[var(--surface-2)] px-4 py-3 text-[var(--text)] placeholder:text-[var(--text-muted)]/60 focus:border-[var(--accent)] focus:outline-none focus:ring-2 focus:ring-[var(--accent-soft)]"
          />
        </label>

        <button
          onClick={confirm}
          disabled={noteRequired && !note.trim()}
          className={`mt-4 flex w-full items-center justify-center gap-2 rounded-xl py-3.5 text-sm font-semibold text-white transition-transform active:scale-[0.98] disabled:opacity-40 disabled:active:scale-100 ${
            confirmTone === "danger" ? "bg-[var(--danger)]" : "bg-[var(--accent)]"
          }`}
        >
          {confirmLabel}
        </button>
      </div>
    </div>
  );
}