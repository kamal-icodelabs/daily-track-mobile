"use client";

import { Plug, RefreshCw, X } from "lucide-react";
import { useIntegrations } from "@/lib/integrations/useIntegrations";

export function IntegrationsPanel() {
  const { adapters, isConnected, connect, disconnect } = useIntegrations();

  return (
    <div className="space-y-2.5">
      {adapters.map(({ integration }) => {
        const active = isConnected(integration.id);
        return (
          <div
            key={integration.id}
            className="rounded-2xl border border-[var(--border)] bg-[var(--surface)] p-3.5 shadow-sm"
          >
            <div className="flex items-center gap-3">
              <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-[var(--accent-soft)] text-[var(--accent)]">
                <Plug size={18} />
              </div>
              <div className="min-w-0 flex-1">
                <p className="text-sm font-bold text-[var(--text)]">
                  {integration.name}
                </p>
                <p className="text-xs text-[var(--text-muted)]">
                  {integration.description}
                </p>
              </div>
              <button
                onClick={() =>
                  active
                    ? disconnect(integration.id)
                    : connect(integration.id)
                }
                className={`flex shrink-0 items-center gap-1.5 rounded-lg px-3 py-2 text-xs font-semibold transition-colors ${
                  active
                    ? "bg-[var(--surface-2)] text-[var(--text)]"
                    : "bg-[var(--accent)] text-white"
                }`}
              >
                {active ? (
                  <>
                    <X size={13} /> Disconnect
                  </>
                ) : (
                  <>
                    <RefreshCw size={13} /> Connect
                  </>
                )}
              </button>
            </div>
            {active ? (
              <ul className="mt-2.5 space-y-1 border-t border-[var(--border)] pt-2.5">
                {integration.capabilities.map((cap) => (
                  <li
                    key={cap}
                    className="flex items-center gap-1.5 text-xs text-[var(--text-muted)]"
                  >
                    <span className="h-1.5 w-1.5 rounded-full bg-[var(--success)]" />
                    {cap}
                  </li>
                ))}
              </ul>
            ) : null}
          </div>
        );
      })}
    </div>
  );
}
