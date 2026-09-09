"use client";

import type { LucideIcon } from "lucide-react";

interface HeaderProps {
  title: string;
  subtitle?: string;
  actionIcon?: LucideIcon;
  onAction?: () => void;
  actionLabel?: string;
}

export function Header({
  title,
  subtitle,
  actionIcon: ActionIcon,
  onAction,
  actionLabel = "Action",
}: HeaderProps) {
  return (
    <header className="sticky top-0 z-20 flex items-center justify-between gap-3 border-b border-[var(--border)] bg-[var(--bg)]/90 px-4 py-3 backdrop-blur-md">
      <div className="min-w-0">
        <h1 className="text-xl font-bold leading-tight text-[var(--text)]">
          {title}
        </h1>
        {subtitle ? (
          <p className="truncate text-sm text-[var(--text-muted)]">{subtitle}</p>
        ) : null}
      </div>
      {ActionIcon ? (
        <button
          onClick={onAction}
          aria-label={actionLabel}
          className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-[var(--surface)] text-[var(--text)] transition-colors active:bg-[var(--accent-soft)] active:text-[var(--accent)]"
        >
          <ActionIcon size={20} />
        </button>
      ) : null}
    </header>
  );
}
