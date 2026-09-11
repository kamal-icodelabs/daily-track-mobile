"use client";

import { useEffect, useState } from "react";
import {
  Bug,
  CheckCircle2,
  Code2,
  FileText,
  Hash,
  Layers,
  LayoutList,
  Link2,
  Loader2,
  MessageCircle,
  Palette,
} from "lucide-react";
import { useAuth } from "@/lib/auth";
import {
  WORK_APPS,
  listWorkApps,
  connectWorkApp,
  disconnectWorkApp,
  type WorkAppId,
  type WorkAppConnection,
  type WorkAppMeta,
} from "@/lib/integrations/workAppsService";

const ICON_MAP: Record<WorkAppId, React.ReactNode> = {
  slack: <Hash size={18} />,
  whatsapp: <MessageCircle size={18} />,
  jira: <Bug size={18} />,
  notion: <FileText size={18} />,
  github: <Code2 size={18} />,
  figma: <Palette size={18} />,
  linear: <Layers size={18} />,
  asana: <LayoutList size={18} />,
};

const BADGE_CONNECTED = "bg-[var(--success)]/15 text-[var(--success)]";
const BADGE_DISCONNECTED = "bg-[var(--surface-2)] text-[var(--text-muted)]";

export function WorkAppsSection() {
  const { user } = useAuth();
  const [connections, setConnections] = useState<WorkAppConnection[]>([]);
  const [busyId, setBusyId] = useState<WorkAppId | null>(null);
  const [toast, setToast] = useState<string | null>(null);

  const load = () => {
    if (!user) return;
    setConnections(listWorkApps(user.id));
  };

  useEffect(() => {
    load();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [user?.id]);

  useEffect(() => {
    if (!toast) return;
    const t = setTimeout(() => setToast(null), 2400);
    return () => clearTimeout(t);
  }, [toast]);

  const handleToggle = async (meta: WorkAppMeta) => {
    if (!user) return;
    const conn = connections.find((c) => c.appId === meta.id);
    const isConnected = !!conn?.connected;
    setBusyId(meta.id);
    // simulate OAuth delay
    await new Promise((r) => setTimeout(r, 700));
    if (isConnected) {
      disconnectWorkApp(user.id, meta.id);
      setToast(`${meta.name} disconnected`);
    } else {
      connectWorkApp(user.id, meta.id, user.email);
      setToast(`${meta.name} connected · ${user.email}`);
    }
    load();
    setBusyId(null);
  };

  if (!user) return null;

  const connectedCount = connections.filter((c) => c.connected).length;

  return (
    <div className="rounded-2xl border border-[var(--border)] bg-[var(--surface)] p-4 shadow-sm">
      <div className="mb-3 flex items-center justify-between">
        <div>
          <p className="text-sm font-semibold text-[var(--text)]">Work apps</p>
          <p className="text-xs text-[var(--text-muted)]">
            Connect Slack, WhatsApp, Jira, Notion & more — simulated OAuth, no credentials needed.
          </p>
        </div>
        <span className="shrink-0 rounded-full bg-[var(--accent-soft)] px-2.5 py-1 text-xs font-bold text-[var(--accent)]">
          {connectedCount}/{WORK_APPS.length}
        </span>
      </div>

      <div className="grid grid-cols-1 gap-2.5">
        {WORK_APPS.map((app) => {
          const conn = connections.find((c) => c.appId === app.id);
          const connected = !!conn?.connected;
          const busy = busyId === app.id;
          return (
            <div
              key={app.id}
              className="flex items-center gap-3 rounded-xl border border-[var(--border)] bg-[var(--surface-2)]/60 px-3 py-3"
            >
              <span
                className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl text-white"
                style={{ background: app.color }}
              >
                {ICON_MAP[app.id]}
              </span>
              <div className="min-w-0 flex-1">
                <div className="flex items-center gap-1.5">
                  <p className="truncate text-sm font-semibold text-[var(--text)]">{app.name}</p>
                  <span className={`rounded-full px-1.5 py-0.5 text-[10px] font-bold uppercase tracking-wide ${connected ? BADGE_CONNECTED : BADGE_DISCONNECTED}`}>
                    {connected ? "Connected" : "Not connected"}
                  </span>
                </div>
                <p className="truncate text-xs text-[var(--text-muted)]">{app.description}</p>
                {connected && conn?.account ? (
                  <p className="truncate text-[11px] text-[var(--text-muted)]/70">
                    {conn.account} · {app.accountHint}
                  </p>
                ) : (
                  <p className="truncate text-[11px] text-[var(--text-muted)]/60">{app.accountHint}</p>
                )}
              </div>
              <button
                onClick={() => handleToggle(app)}
                disabled={!!busyId}
                className={`shrink-0 rounded-xl px-3 py-2 text-xs font-semibold transition-transform active:scale-[0.97] disabled:opacity-50 ${
                  connected
                    ? "border border-[var(--danger)]/30 text-[var(--danger)] active:bg-[var(--danger)]/10"
                    : "bg-[var(--accent)] text-white shadow-md shadow-[var(--accent-soft)]"
                }`}
              >
                {busy ? (
                  <span className="flex items-center gap-1.5">
                    <Loader2 size={13} className="animate-spin" /> {connected ? "Removing…" : "Connecting…"}
                  </span>
                ) : connected ? (
                  "Disconnect"
                ) : (
                  <span className="flex items-center gap-1">
                    <Link2 size={12} /> Connect
                  </span>
                )}
              </button>
            </div>
          );
        })}
      </div>

      <div className="mt-3 flex items-center gap-1.5 text-[11px] text-[var(--text-muted)]">
        <CheckCircle2 size={12} className="text-[var(--success)]" />
        {connectedCount > 0 ? `${connectedCount} app${connectedCount > 1 ? "s" : ""} connected — posts & syncs are simulated.` : "Tap Connect to simulate OAuth for any app."}
      </div>

      {toast && (
        <div className="pointer-events-none fixed bottom-24 left-1/2 z-40 -translate-x-1/2">
          <div className="animate-toast-in whitespace-nowrap rounded-full bg-[var(--text)] px-4 py-2.5 text-sm font-medium text-[var(--bg)] shadow-xl">
            {toast}
          </div>
        </div>
      )}
    </div>
  );
}
