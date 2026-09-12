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
    <div className="pointer-events-none fixed inset-x-0 top-0 z-[70] mx-auto flex w-full max-w-[430px] flex-col items-center px-3 pt-[calc(env(safe-area-inset-top)+8px)]">
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
    const t = setTimeout(() => onClose(toast.id), 3000);
    return () => clearTimeout(t);
  }, [toast.id, onClose]);

  const Icon = ICONS[toast.kind] ?? Info;
  const time = new Date().toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" });

  return (
    <motion.button
      type="button"
      onClick={() => onClose(toast.id)}
      initial={{ opacity: 0, y: -24, scale: 0.94 }}
      animate={{ opacity: 1, y: 0, scale: 1 }}
      exit={{ opacity: 0, y: -20, scale: 0.96 }}
      transition={{ type: "spring", stiffness: 420, damping: 28, mass: 0.8 }}
      className="pointer-events-auto mb-2 flex w-full max-w-[360px] items-start gap-3 rounded-[18px] border border-white/10 bg-[var(--surface)]/95 px-3.5 py-3 text-left shadow-[0_8px_32px_rgba(0,0,0,0.18),0_1px_3px_rgba(0,0,0,0.08)] backdrop-blur-2xl"
      style={{ backdropFilter: "blur(20px) saturate(180%)" }}
    >
      <span className="flex h-8 w-8 shrink-0 items-center justify-center rounded-full bg-[var(--accent)] text-[var(--bg)] shadow-sm">
        <Icon size={14} strokeWidth={2.2} />
      </span>
      <span className="min-w-0 flex-1">
        <span className="flex items-center justify-between gap-2">
          <span className="truncate text-[13px] font-bold leading-none text-[var(--text)]">{toast.title}</span>
          <span className="shrink-0 text-[11px] font-medium text-[var(--text-muted)]">{time}</span>
        </span>
        <span className="mt-0.5 block line-clamp-2 text-xs leading-snug text-[var(--text-muted)]">{toast.body}</span>
      </span>
    </motion.button>
  );
}