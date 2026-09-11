"use client";

import { useEffect, useRef, useState } from "react";
import { Check, ChevronDown, Sparkles } from "lucide-react";
import { THEMES } from "@/lib/themes";
import { useTheme } from "@/components/theme/ThemeProvider";
import type { Theme, ThemeVariables } from "@/lib/themes";

/** Mini live preview rendered with a specific theme's own variables, so users
 *  can compare palettes before switching (independent of the current theme). */
function LivePreview({ variables }: { variables: ThemeVariables }) {
  const { "--bg": bg, "--surface": surface, "--border": border } = variables;
  return (
    <div
      className="relative h-9 w-12 shrink-0 overflow-hidden rounded-lg border"
      style={{ background: bg, borderColor: border }}
    >
      <div
        className="absolute inset-x-1 top-1 h-1.5 rounded-[3px]"
        style={{ background: surface, border: `1px solid ${border}` }}
      />
      <div
        className="absolute bottom-1 left-1 h-2 w-2 rounded-full"
        style={{ background: variables["--accent"] }}
      />
    </div>
  );
}

export function ThemeSwitcher() {
  const { theme, setTheme } = useTheme();
  const [open, setOpen] = useState(false);
  const rootRef = useRef<HTMLDivElement>(null);

  const current = THEMES.find((t) => t.id === theme) ?? THEMES[0];

  useEffect(() => {
    if (!open) return;
    const onClickOutside = (e: MouseEvent) => {
      if (rootRef.current && !rootRef.current.contains(e.target as Node)) {
        setOpen(false);
      }
    };
    document.addEventListener("mousedown", onClickOutside);
    return () => document.removeEventListener("mousedown", onClickOutside);
  }, [open]);

  const select = (id: Theme["id"]) => {
    setTheme(id);
    setOpen(false);
  };

  return (
    <div className="relative" ref={rootRef}>
      <button
        type="button"
        onClick={() => setOpen((o) => !o)}
        aria-haspopup="listbox"
        aria-expanded={open}
        className="flex w-full items-center gap-3 rounded-xl border border-[var(--border)] bg-[var(--surface-2)] px-3 py-2.5 text-left transition-colors focus:border-[var(--accent)] focus:outline-none focus:ring-2 focus:ring-[var(--accent-soft)]"
      >
        <LivePreview variables={current.variables} />
        <span className="min-w-0 flex-1">
          <span className="block truncate text-sm font-semibold text-[var(--text)]">
            {current.name}
            {current.recommended ? (
              <span className="ml-1.5 inline-flex items-center gap-0.5 rounded-full bg-[var(--accent-soft)] px-1.5 py-0.5 text-[9px] font-bold uppercase tracking-wide text-[var(--accent)]">
                <Sparkles size={8} />
                Recommended
              </span>
            ) : null}
          </span>
          <span className="block truncate text-xs text-[var(--text-muted)]">
            {current.description}
          </span>
        </span>
        <ChevronDown
          size={18}
          className={`shrink-0 text-[var(--text-muted)] transition-transform duration-200 ${
            open ? "rotate-180" : ""
          }`}
        />
      </button>

      {open ? (
        <ul
          role="listbox"
          className="absolute inset-x-0 top-full z-20 mt-2 max-h-72 overflow-y-auto rounded-xl border border-[var(--border)] bg-[var(--surface)] p-1.5 shadow-xl animate-fade-in"
        >
          {THEMES.map((t) => {
            const active = theme === t.id;
            return (
              <li key={t.id} role="option" aria-selected={active}>
                <button
                  type="button"
                  onClick={() => select(t.id)}
                  className={`flex w-full items-center gap-3 rounded-lg px-2.5 py-2.5 text-left transition-colors ${
                    active ? "bg-[var(--accent-soft)]" : "hover:bg-[var(--surface-2)]"
                  }`}
                >
                  <LivePreview variables={t.variables} />
                  <span className="min-w-0 flex-1">
                    <span className="flex items-center gap-1.5">
                      <span className="block truncate text-sm font-medium text-[var(--text)]">
                        {t.name}
                      </span>
                      {t.recommended ? (
                        <span className="shrink-0 rounded-md bg-[var(--accent-soft)] px-1 py-0.5 text-[9px] font-bold uppercase tracking-wide text-[var(--accent)]">
                          Recommended
                        </span>
                      ) : null}
                    </span>
                    <span className="block truncate text-xs text-[var(--text-muted)]">
                      {t.description}
                    </span>
                  </span>
                  {active ? (
                    <Check
                      size={16}
                      className="shrink-0 text-[var(--accent)]"
                      strokeWidth={3}
                    />
                  ) : null}
                </button>
              </li>
            );
          })}
        </ul>
      ) : null}
    </div>
  );
}
