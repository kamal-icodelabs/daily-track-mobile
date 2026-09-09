"use client";

import { useEffect, useRef, useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { Check, ChevronDown, X } from "lucide-react";

export interface PickerOption<T extends string = string> {
  value: T;
  label: string;
  icon?: React.ReactNode;
  color?: string;
}

interface PickerDropdownProps<T extends string> {
  label?: string;
  value: T;
  onChange: (value: T) => void;
  options: PickerOption<T>[];
  icon: React.ReactNode;
  placeholder?: string;
  /** Controlled open state — lets the parent coordinate multiple dropdowns. */
  open?: boolean;
  onOpenChange?: (open: boolean) => void;
}

/**
 * A project-styled dropdown. Uses a bottom-sheet picker on small screens
 * and an in-place popover on larger screens so it matches the app's
 * sheet/animation language instead of a native <select>.
 */
export function PickerDropdown<T extends string>({
  label,
  value,
  onChange,
  options,
  icon,
  placeholder = "Select…",
  open: controlledOpen,
  onOpenChange,
}: PickerDropdownProps<T>) {
  const [internalOpen, setInternalOpen] = useState(false);
  const open = controlledOpen !== undefined ? controlledOpen : internalOpen;
  const setOpen = (next: boolean | ((o: boolean) => boolean)) => {
    const resolved =
      typeof next === "function" ? next(open) : next;
    if (controlledOpen !== undefined) {
      onOpenChange?.(resolved);
    } else {
      setInternalOpen(resolved);
    }
  };
  const triggerRef = useRef<HTMLDivElement>(null);
  const [popover, setPopover] = useState({ top: 0, right: 0, width: 0 });

  const selected = options.find((o) => o.value === value);

  const positionPopover = () => {
    const rect = triggerRef.current?.getBoundingClientRect();
    if (!rect) return;
    setPopover({ top: rect.bottom + 6, right: window.innerWidth - rect.right, width: rect.width });
  };

  useEffect(() => {
    if (!open) return;
    positionPopover();
    const onResize = () => positionPopover();
    window.addEventListener("resize", onResize);
    return () => window.removeEventListener("resize", onResize);
  }, [open]);

  return (
    <div className="relative flex-1" ref={triggerRef}>
      <button
        type="button"
        onClick={() => setOpen((o) => !o)}
        aria-haspopup="listbox"
        aria-expanded={open}
        className={`flex w-full items-center gap-2 rounded-xl border px-3 py-2.5 text-left transition-colors ${
          open
            ? "border-[var(--accent)] bg-[var(--accent-soft)]"
            : "border-[var(--border)] bg-[var(--surface)]"
        }`}
      >
        <span className="shrink-0 text-[var(--text-muted)]">{icon}</span>
        <span className="min-w-0 flex-1 truncate text-xs text-[var(--text)]">
          {selected ? selected.label : placeholder}
        </span>
        <motion.span
          animate={{ rotate: open ? 180 : 0 }}
          transition={{ duration: 0.2 }}
          className="shrink-0 text-[var(--text-muted)]"
        >
          <ChevronDown size={14} />
        </motion.span>
      </button>

      {/* Small-screen bottom sheet */}
      <AnimatePresence>
        {open ? (
          <>
            <motion.div
              key="scrim"
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              className="fixed inset-0 z-30 bg-black/50 md:hidden"
              onClick={() => setOpen(false)}
            />
            <motion.div
              key="sheet"
              initial={{ y: "100%" }}
              animate={{ y: 0 }}
              exit={{ y: "100%" }}
              transition={{ type: "tween", duration: 0.25, ease: "easeOut" }}
              className="fixed inset-x-0 bottom-0 z-40 rounded-t-3xl border border-b-0 border-[var(--border)] bg-[var(--surface)] p-4 shadow-xl md:hidden"
            >
              <div className="mx-auto mb-3 h-1.5 w-10 rounded-full bg-[var(--border)]" />
              <div className="mb-3 flex items-center justify-between">
                <p className="text-sm font-semibold text-[var(--text)]">
                  {label ?? "Select"}
                </p>
                <button
                  onClick={() => setOpen(false)}
                  aria-label="Close"
                  className="flex h-8 w-8 items-center justify-center rounded-lg text-[var(--text-muted)] active:bg-[var(--surface-2)]"
                >
                  <X size={18} />
                </button>
              </div>
              <div className="max-h-[50svh] space-y-1 overflow-y-auto pb-4">
                {options.map((o) => (
                  <button
                    key={o.value}
                    type="button"
                    onClick={() => {
                      onChange(o.value);
                      setOpen(false);
                    }}
                    className={`flex w-full items-center gap-2 rounded-xl px-3 py-3 text-left text-sm transition-colors ${
                      o.value === value
                        ? "bg-[var(--accent-soft)] text-[var(--accent)]"
                        : "text-[var(--text)]"
                    }`}
                  >
                    {o.color ? (
                      <span className="h-2.5 w-2.5 rounded-full" style={{ background: o.color }} />
                    ) : o.icon ? (
                      <span className="text-[var(--text-muted)]">{o.icon}</span>
                    ) : null}
                    <span className="flex-1 font-medium">{o.label}</span>
                    {o.value === value ? <Check size={16} /> : null}
                  </button>
                ))}
              </div>
            </motion.div>
          </>
        ) : null}
      </AnimatePresence>

      {/* Large-screen popover */}
      {open ? (
        <motion.div
          initial={{ opacity: 0, y: -6 }}
          animate={{ opacity: 1, y: 0 }}
          exit={{ opacity: 0, y: -6 }}
          transition={{ duration: 0.18 }}
          className="fixed z-40 hidden overflow-hidden rounded-xl border border-[var(--border)] bg-[var(--surface)] shadow-2xl md:block"
          style={{ top: popover.top, right: popover.right, width: popover.width }}
        >
          {options.map((o) => (
            <button
              key={o.value}
              type="button"
              onClick={() => {
                onChange(o.value);
                setOpen(false);
              }}
              className={`flex w-full items-center gap-2 px-3 py-2.5 text-left text-xs transition-colors ${
                o.value === value
                  ? "bg-[var(--accent-soft)] text-[var(--accent)]"
                  : "text-[var(--text)] hover:bg-[var(--surface-2)]"
              }`}
            >
              {o.color ? (
                <span className="h-2 w-2 shrink-0 rounded-full" style={{ background: o.color }} />
              ) : o.icon ? (
                <span className="text-[var(--text-muted)]">{o.icon}</span>
              ) : null}
              <span className="flex-1 font-medium">{o.label}</span>
              {o.value === value ? <Check size={14} /> : null}
            </button>
          ))}
        </motion.div>
      ) : null}
    </div>
  );
}
