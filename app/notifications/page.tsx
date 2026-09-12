"use client";

import { useEffect } from "react";
import Link from "next/link";
import { motion } from "framer-motion";
import { ArrowLeft, Bell, CheckCheck, Hash, Info, Rocket, Trash2 } from "lucide-react";
import { Header } from "@/components/layout/Header";
import { useSimulatedIntegrations } from "@/lib/integrations/IntegrationProvider";
import type { SimToast } from "@/lib/integrations/types";

const ICONS: Record<SimToast["kind"], typeof Bell> = {
  reminder: Bell,
  build: Rocket,
  slack: Hash,
  info: Info,
};

function timeAgo(iso?: string): string {
  if (!iso) return "now";
  const d = new Date(iso);
  const diff = Date.now() - d.getTime();
  const mins = Math.floor(diff / 60000);
  if (mins < 1) return "now";
  if (mins < 60) return `${mins}m ago`;
  const hrs = Math.floor(mins / 60);
  if (hrs < 24) return `${hrs}h ago`;
  const days = Math.floor(hrs / 24);
  return `${days}d ago`;
}

export default function NotificationsPage() {
  const { notifications, clearNotifications, markAllRead, unreadCount } = useSimulatedIntegrations();

  useEffect(() => {
    if (unreadCount > 0) markAllRead();
  }, [unreadCount, markAllRead]);

  return (
    <div className="flex h-full flex-col">
      <Header
        title="Notifications"
        subtitle={notifications.length ? `${notifications.length} total · ${unreadCount} unread` : "All caught up"}
        actionIcon={ArrowLeft}
        onAction={() => window.history.back()}
        actionLabel="Back"
      />

      <div className="flex-1 overflow-y-auto px-4 py-4 pb-28">
        {notifications.length === 0 ? (
          <div className="flex flex-col items-center pt-16 text-center">
            <div className="flex h-16 w-16 items-center justify-center rounded-2xl bg-[var(--accent-soft)] text-[var(--accent)]">
              <Bell size={28} />
            </div>
            <h3 className="mt-4 text-base font-bold text-[var(--text)]">No notifications yet</h3>
            <p className="mt-1 max-w-[260px] text-sm text-[var(--text-muted)]">
              Reminders, builds and Slack posts will appear here. They also show as iOS-style banners at the top for 3 seconds.
            </p>
          </div>
        ) : (
          <>
            <div className="mb-3 flex items-center justify-between px-1">
              <p className="text-xs font-semibold text-[var(--text-muted)]">{notifications.length} notifications</p>
              <button
                onClick={clearNotifications}
                className="inline-flex items-center gap-1 rounded-full border border-[var(--border)] bg-[var(--surface)] px-3 py-1.5 text-xs font-semibold text-[var(--danger)] active:bg-[var(--surface-2)]"
              >
                <Trash2 size={12} /> Clear all
              </button>
            </div>

            <div className="space-y-2">
              {notifications.map((n, i) => {
                const Icon = ICONS[n.kind] ?? Info;
                const isRecent = i < unreadCount;
                return (
                  <motion.div
                    key={n.id}
                    initial={{ opacity: 0, y: 8 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ delay: i * 0.02 }}
                    className={`relative overflow-hidden rounded-2xl border bg-[var(--surface)] p-3 shadow-sm ${isRecent ? "border-[var(--accent)]/20" : "border-[var(--border)]"}`}
                  >
                    <div className="flex items-start gap-3">
                      <span className={`flex h-8 w-8 shrink-0 items-center justify-center rounded-full ${n.kind === "reminder" ? "bg-amber-500 text-white" : n.kind === "build" ? "bg-[var(--accent)] text-white" : n.kind === "slack" ? "bg-[#611f69] text-white" : "bg-[var(--accent-soft)] text-[var(--accent)]"}`}>
                        <Icon size={14} />
                      </span>
                      <div className="min-w-0 flex-1">
                        <div className="flex items-start justify-between gap-2">
                          <p className="truncate text-sm font-semibold text-[var(--text)]">{n.title}</p>
                          <span className="shrink-0 text-[11px] text-[var(--text-muted)]">{timeAgo(n.timestamp)}</span>
                        </div>
                        <p className="mt-0.5 text-xs leading-snug text-[var(--text-muted)]">{n.body}</p>
                        <span className={`mt-1 inline-flex rounded-full px-1.5 py-0.5 text-[10px] font-semibold capitalize ${n.kind === "build" ? "bg-[var(--accent-soft)] text-[var(--accent)]" : n.kind === "slack" ? "bg-violet-500/10 text-violet-600" : n.kind === "reminder" ? "bg-amber-500/10 text-amber-600" : "bg-[var(--surface-2)] text-[var(--text-muted)]"}`}>
                          {n.kind}
                        </span>
                      </div>
                    </div>
                  </motion.div>
                );
              })}
            </div>
          </>
        )}

        <div className="mt-6 flex justify-center">
          <Link href="/profile" className="rounded-xl bg-[var(--surface-2)] px-4 py-2 text-sm font-medium text-[var(--text-muted)]">
            Back to profile
          </Link>
        </div>
      </div>
    </div>
  );
}
