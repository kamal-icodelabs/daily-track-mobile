"use client";

import { useEffect, useRef, useState } from "react";
import { motion } from "framer-motion";
import { Check, ChevronDown } from "lucide-react";
import { Sheet } from "react-modal-sheet";

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
}

function useIsMobile() {
  const [isMobile, setIsMobile] = useState(
    () =>
      typeof window !== "undefined" &&
      window.matchMedia("(max-width: 767px)").matches
  );
  useEffect(() => {
    const mql = window.matchMedia("(max-width: 767px)");
    const update = () => setIsMobile(mql.matches);
    mql.addEventListener("change", update);
    return () => mql.removeEventListener("change", update);
  }, []);
  return isMobile;
}

/**
 * A project-styled dropdown. On small screens it opens as a swipeable
 * bottom sheet (react-modal-sheet, drag-to-dismiss); on large screens it
 * falls back to an in-place popover.
 */
export function PickerDropdown<T extends string>({
  label,
  value,
  onChange,
  options,
  icon,
  placeholder = "Select…",
}: PickerDropdownProps<T>) {
  const [open, setOpen] = useState(false);
  const isMobile = useIsMobile();
  const triggerRef = useRef<HTMLDivElement>(null);
  const [popover, setPopover] = useState({ top: 0, right: 0, width: 0 });

  const selected = options.find((o) => o.value === value);

  const positionPopover = () => {
    const rect = triggerRef.current?.getBoundingClientRect();
    if (!rect) return;
    setPopover({
      top: rect.bottom + 6,
      right: window.innerWidth - rect.right,
      width: rect.width,
    });
  };

  useEffect(() => {
    if (!open || isMobile) return;
    positionPopover();
    const onResize = () => positionPopover();
    window.addEventListener("resize", onResize);
    return () => window.removeEventListener("resize", onResize);
  }, [open, isMobile]);

  const pick = (o: PickerOption<T>) => {
    onChange(o.value);
    setOpen(false);
  };

  return (
    <div className="relative flex-1" ref={triggerRef}>
      <button
        type="button"
        onClick={() => setOpen((v) => !v)}
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

      {/* Small screens: swipeable bottom sheet */}
      {isMobile ? (
        <Sheet isOpen={open} onClose={() => setOpen(false)} detent="content" disableScrollLocking>
          <Sheet.Container>
            <Sheet.Header>
              <Sheet.DragIndicator />
            </Sheet.Header>
            <Sheet.Content>
              <div className="px-5 pb-8 pt-1">
                <div className="mb-3 flex items-center justify-between">
                  <p className="text-base font-bold text-[var(--text)]">
                    {label ?? "Select"}
                  </p>
                  <span className="rounded-full bg-[var(--surface-2)] px-2 py-0.5 text-[10px] font-bold text-[var(--text-muted)]">
                    {options.length} options
                  </span>
                </div>

                <div className="space-y-1">
                  {options.map((o) => {
                    const isActive = o.value === value;
                    return (
                      <button
                        key={o.value}
                        type="button"
                        onClick={() => pick(o)}
                        className={`flex w-full items-center gap-3 rounded-xl px-3.5 py-3 text-left transition-colors ${
                          isActive
                            ? "bg-[var(--accent-soft)]"
                            : "bg-[var(--surface)] active:bg-[var(--surface-2)]"
                        }`}
                      >
                        <span
                          className={`flex h-7 w-7 shrink-0 items-center justify-center rounded-lg ${
                            isActive
                              ? "bg-[var(--accent)]/15 text-[var(--accent)]"
                              : "bg-[var(--surface-2)] text-[var(--text-muted)]"
                          }`}
                        >
                          {o.color ? (
                            <span
                              className="h-2.5 w-2.5 rounded-full"
                              style={{ background: o.color }}
                            />
                          ) : (
                            o.icon ?? null
                          )}
                        </span>
                        <span
                          className={`flex-1 text-sm font-medium ${
                            isActive
                              ? "text-[var(--accent)]"
                              : "text-[var(--text)]"
                          }`}
                        >
                          {o.label}
                        </span>
                        {isActive ? (
                          <span className="flex h-5 w-5 items-center justify-center rounded-full bg-[var(--accent)] text-white">
                            <Check size={12} strokeWidth={3} />
                          </span>
                        ) : null}
                      </button>
                    );
                  })}
                </div>
              </div>
            </Sheet.Content>
          </Sheet.Container>
          <Sheet.Backdrop onTap={() => setOpen(false)} />
        </Sheet>
      ) : null}

      {/* Large screens: in-place popover */}
      {!isMobile && open ? (
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
              onClick={() => pick(o)}
              className={`flex w-full items-center gap-2 px-3 py-2.5 text-left text-xs transition-colors ${
                o.value === value
                  ? "bg-[var(--accent-soft)] text-[var(--accent)]"
                  : "text-[var(--text)] hover:bg-[var(--surface-2)]"
              }`}
            >
              {o.color ? (
                <span
                  className="h-2 w-2 shrink-0 rounded-full"
                  style={{ background: o.color }}
                />
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