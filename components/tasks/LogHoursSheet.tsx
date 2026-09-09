"use client";

import { useState } from "react";
import { Check, Clock, X } from "lucide-react";

type Mode = "log" | "start" | "submit";

interface LogHoursSheetProps {
  open: boolean;
  taskTitle: string;
  mode?: Mode;
  hoursRequired?: boolean;
  onClose: () => void;
  onSave: (hours: number, note?: string) => void;
  onSkip?: () => void;
  maxHours?: number;
}

const TITLE: Record<Mode, string> = {
  log: "Log hours",
  start: "Start ticket",
  submit: "Submit for testing",
};

const SUBTITLE: Record<Mode, string> = {
  log: "Log working hours on this ticket.",
  start: "Working hours are required to start this ticket from To-do.",
  submit:
    "End of day — update working hours and hand the ticket to QA.",
};

export function LogHoursSheet({
  open,
  taskTitle,
  mode = "log",
  hoursRequired = true,
  onClose,
  onSave,
  onSkip,
  maxHours = 24,
}: LogHoursSheetProps) {
  const [hours, setHours] = useState("");
  const [note, setNote] = useState("");

  if (!open) return null;

  const submit = () => {
    const value = parseFloat(hours);
    if (hoursRequired && (isNaN(value) || value <= 0 || value > maxHours)) return;
    const final = hoursRequired || value > 0 ? (isNaN(value) ? 0 : value) : 0;
    onSave(final, note.trim() || undefined);
    setHours("");
    setNote("");
  };

  return (
    <div className="fixed inset-0 z-30 flex items-end justify-center sm:items-center">
      <div className="absolute inset-0 bg-black/50 animate-fade-in" onClick={onClose} />
      <div className="relative z-10 w-full max-w-[430px] rounded-t-3xl border border-b-0 border-[var(--border)] bg-[var(--surface)] p-5 animate-sheet-up sm:rounded-3xl sm:border-b">
        <div className="mx-auto mb-4 h-1.5 w-10 rounded-full bg-[var(--border)] sm:hidden" />
        <div className="mb-4 flex items-center justify-between">
          <h2 className="flex items-center gap-2 text-lg font-bold text-[var(--text)]">
            <Clock size={18} className="text-[var(--accent)]" />
            {TITLE[mode]}
          </h2>
          <button
            onClick={onClose}
            aria-label="Close"
            className="flex h-9 w-9 items-center justify-center rounded-xl text-[var(--text-muted)] active:bg-[var(--surface-2)]"
          >
            <X size={20} />
          </button>
        </div>

        <p className="mb-4 text-sm text-[var(--text-muted)]">{SUBTITLE[mode]}</p>
        <p className="mb-4 truncate text-sm font-semibold text-[var(--text)]">{taskTitle}</p>

        <label className="block">
          <span className="mb-1.5 block text-sm font-medium text-[var(--text-muted)]">
            Hours {hoursRequired ? "(required)" : "(optional)"}
          </span>
          <input
            autoFocus
            type="number"
            inputMode="decimal"
            min="0"
            max={maxHours}
            step="0.5"
            value={hours}
            onChange={(e) => setHours(e.target.value)}
            placeholder="e.g. 2.5"
            className="w-full rounded-xl border border-[var(--border)] bg-[var(--surface-2)] px-4 py-3 text-[var(--text)] placeholder:text-[var(--text-muted)]/60 focus:border-[var(--accent)] focus:outline-none focus:ring-2 focus:ring-[var(--accent-soft)]"
          />
        </label>

        <label className="mt-3 block">
          <span className="mb-1.5 block text-sm font-medium text-[var(--text-muted)]">
            Note (optional)
          </span>
          <input
            value={note}
            onChange={(e) => setNote(e.target.value)}
            placeholder="What did you work on?"
            className="w-full rounded-xl border border-[var(--border)] bg-[var(--surface-2)] px-4 py-3 text-[var(--text)] placeholder:text-[var(--text-muted)]/60 focus:border-[var(--accent)] focus:outline-none focus:ring-2 focus:ring-[var(--accent-soft)]"
          />
        </label>

        <button
          onClick={submit}
          disabled={hoursRequired && !hours}
          className="mt-4 flex w-full items-center justify-center gap-2 rounded-xl bg-[var(--accent)] py-3.5 text-sm font-semibold text-white shadow-lg shadow-[var(--accent-soft)] transition-transform active:scale-[0.98] disabled:opacity-40 disabled:active:scale-100"
        >
          <Clock size={18} />
          {hoursRequired ? "Save & move ticket" : mode === "submit" ? "Submit to QA" : "Save hours"}
        </button>

        {!hoursRequired && onSkip ? (
          <button
            onClick={() => {
              onSkip();
              setHours("");
              setNote("");
            }}
            className="mt-2 flex w-full items-center justify-center gap-2 rounded-xl border border-[var(--border)] bg-[var(--surface-2)] py-3 text-sm font-semibold text-[var(--text-muted)] transition-transform active:scale-[0.98]"
          >
            <Check size={17} />
            Submit without hours
          </button>
        ) : null}
      </div>
    </div>
  );
}

