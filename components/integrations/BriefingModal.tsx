"use client";

import { AnimatePresence, motion } from "framer-motion";
import {
  CalendarCheck,
  CheckCircle2,
  CircleDot,
  Clock3,
  X,
} from "lucide-react";
import { useSimulatedIntegrations } from "@/lib/integrations/IntegrationProvider";

/**
 * 6 PM end-of-day briefing bottom sheet (spec: personal briefing with
 * today's completed/in-progress work + build status). Fires once per day.
 */
export function BriefingModal() {
  const { showBriefingPrompt, briefingData, dismissBriefing } =
    useSimulatedIntegrations();

  return (
    <AnimatePresence>
      {showBriefingPrompt && briefingData ? (
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          className="fixed inset-0 z-[60] flex items-end justify-center bg-black/40 backdrop-blur-sm"
          onClick={dismissBriefing}
        >
          <motion.div
            initial={{ y: 320 }}
            animate={{ y: 0 }}
            exit={{ y: 320 }}
            transition={{ type: "spring", stiffness: 320, damping: 32 }}
            className="w-full max-w-[430px] rounded-t-3xl border border-[var(--border)] bg-[var(--bg)] p-5 pb-8 shadow-2xl shadow-[var(--shadow)]"
            onClick={(e) => e.stopPropagation()}
          >
            <span className="mx-auto mb-4 block h-1.5 w-10 rounded-full bg-[var(--border)]" />

            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2.5">
                <span className="flex h-10 w-10 items-center justify-center rounded-xl bg-[var(--accent-soft)] text-[var(--accent)]">
                  <CalendarCheck size={19} />
                </span>
                <div>
                  <p className="text-base font-bold text-[var(--text)]">
                    Quick Briefing
                  </p>
                  <p className="text-xs text-[var(--text-muted)]">
                    Your day at a glance · 6 PM
                  </p>
                </div>
              </div>
              <button
                onClick={dismissBriefing}
                aria-label="Close briefing"
                className="rounded-lg p-1.5 text-[var(--text-muted)] transition-colors hover:text-[var(--text)]"
              >
                <X size={18} />
              </button>
            </div>

            <div className="mt-4 grid grid-cols-2 gap-2.5">
              <Stat
                icon={<CheckCircle2 size={16} />}
                label="Completed today"
                value={briefingData.completedToday}
                tint="text-[var(--success)]"
              />
              <Stat
                icon={<CircleDot size={16} />}
                label="In progress"
                value={briefingData.inProgress}
                tint="text-[var(--accent)]"
              />
              <Stat
                icon={<Clock3 size={16} />}
                label="Hours logged"
                value={briefingData.hoursToday.toFixed(1)}
                tint="text-[var(--text)]"
              />
              <Stat
                icon={<CircleDot size={16} />}
                label="Pending"
                value={briefingData.pending}
                tint="text-[var(--text-muted)]"
              />
            </div>

            <div className="mt-3 flex items-center justify-between rounded-xl bg-[var(--surface-2)] px-3 py-2.5 text-xs">
              <span className="text-[var(--text-muted)]">Builds</span>
              <span className="flex items-center gap-1.5">
                <CheckCircle2 size={13} className="text-[var(--success)]" />
                <span className="font-semibold text-[var(--success)]">
                  {briefingData.buildsPassed}
                </span>
                <span className="text-[var(--text-muted)]">passed</span>
                <span className="mx-1 text-[var(--border)]">·</span>
                <CircleDot size={13} className="text-[var(--danger)]" />
                <span className="font-semibold text-[var(--danger)]">
                  {briefingData.buildsFailed}
                </span>
                <span className="text-[var(--text-muted)]">failed</span>
              </span>
            </div>

            <button
              onClick={dismissBriefing}
              className="mt-4 w-full rounded-2xl bg-[var(--accent)] py-3 text-sm font-semibold text-[var(--bg)] transition-transform active:scale-[0.98]"
            >
              Arrived — thanks
            </button>
            <p className="mt-2 text-center text-[11px] text-[var(--text-muted)]">
              Once per day · a team wrap-up is also posted to #general.
            </p>
          </motion.div>
        </motion.div>
      ) : null}
    </AnimatePresence>
  );
}

function Stat({
  icon,
  label,
  value,
  tint,
}: {
  icon: React.ReactNode;
  label: string;
  value: string | number;
  tint: string;
}) {
  return (
    <div className="rounded-2xl border border-[var(--border)] bg-[var(--surface)] p-3">
      <span className="flex items-center gap-1 text-xs text-[var(--text-muted)]">
        <span className={tint}>{icon}</span>
        {label}
      </span>
      <p className="mt-1 text-xl font-bold text-[var(--text)]">{value}</p>
    </div>
  );
}