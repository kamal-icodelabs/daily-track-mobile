"use client";

import { useEffect } from "react";
import { AnimatePresence, motion } from "framer-motion";
import { Bell, Hash, Info, Rocket } from "lucide-react";
import { useSimulatedIntegrations } from "@/lib/integrations/IntegrationProvider";
import type { SimToast } from "@/lib/integrations/types";

const ICONS: Record<SimToast["kind"], typeof Bell> = {
  reminder: Bell,
  build: Rocket,
  slack: Hash,
  info: Info,
};

/**
 * In-app "push-style" notification toasts. Rendered by
 * IntegrationProvider so reminders appear no matter which page you're on.
 */
export function Toaster() {
  const { toasts, dismissToast } = useSimulatedIntegrations();

  return (
    <div className="pointer-events-none fixed inset-x-0 top-3 z-[70] mx-auto w-full max-w-[430px] px-4">
      <AnimatePresence>
        {toasts.map((toast) => (
          <ToastItem key={toast.id} toast={toast} onClose={dismissToast} />
        ))}
      </AnimatePresence>
    </div>
  );
}

function ToastItem({
  toast,
  onClose,
}: {
  toast: SimToast;
  onClose: (id: string) => void;
}) {
  useEffect(() => {
    const t = setTimeout(() => onClose(toast.id), 6500);
    return () => clearTimeout(t);
  }, [toast.id, onClose]);

  const Icon = ICONS[toast.kind] ?? Info;

  return (
    <motion.button
      type="button"
      onClick={() => onClose(toast.id)}
      initial={{ opacity: 0, y: -18, scale: 0.96 }}
      animate={{ opacity: 1, y: 0, scale: 1 }}
      exit={{ opacity: 0, y: -12, scale: 0.96 }}
      transition={{ type: "spring", stiffness: 380, damping: 30 }}
      className="pointer-events-auto mb-2 flex w-full items-start gap-3 rounded-2xl border border-[var(--border)] bg-[var(--surface)]/95 p-3 text-left shadow-xl shadow-[var(--shadow)] backdrop-blur-xl"
    >
      <span className="flex h-9 w-9 shrink-0 items-center justify-center rounded-xl bg-[var(--accent-soft)] text-[var(--accent)]">
        <Icon size={17} />
      </span>
      <span className="min-w-0">
        <span className="block truncate text-sm font-semibold text-[var(--text)]">
          {toast.title}
        </span>
        <span className="block truncate text-xs text-[var(--text-muted)]">
          {toast.body}
        </span>
      </span>
    </motion.button>
  );
}