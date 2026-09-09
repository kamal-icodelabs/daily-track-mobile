"use client";

import { createContext, useContext, useMemo, useState } from "react";
import {
  INTEGRATION_ADAPTERS,
  type IntegrationAdapter,
} from "@/lib/integrations/adapters";

const STORAGE_KEY = "dailytask-integrations";

interface IntegrationsContextValue {
  adapters: IntegrationAdapter[];
  connectedIds: string[];
  connected: IntegrationAdapter[];
  connect: (id: string) => Promise<void>;
  disconnect: (id: string) => Promise<void>;
  isConnected: (id: string) => boolean;
}

const IntegrationsContext = createContext<IntegrationsContextValue | undefined>(
  undefined
);

export function IntegrationsProvider({
  children,
}: {
  children: React.ReactNode;
}) {
  const [connectedIds, setConnectedIds] = useState<string[]>(() => {
    if (typeof window === "undefined") return [];
    try {
      const raw = window.localStorage.getItem(STORAGE_KEY);
      if (raw) return JSON.parse(raw) as string[];
    } catch {
      // ignore
    }
    return [];
  });

  const persist = (ids: string[]) => {
    try {
      window.localStorage.setItem(STORAGE_KEY, JSON.stringify(ids));
    } catch {
      // ignore
    }
  };

  const connect = async (id: string) => {
    const adapter = INTEGRATION_ADAPTERS.find((a) => a.integration.id === id);
    if (!adapter) return;
    // async on purpose so calling code can show a loading state
    const ok = await adapter.connect();
    if (ok) {
      setConnectedIds((prev) => {
        const next = prev.includes(id) ? prev : [...prev, id];
        persist(next);
        return next;
      });
    }
  };

  const disconnect = async (id: string) => {
    const adapter = INTEGRATION_ADAPTERS.find((a) => a.integration.id === id);
    if (adapter) await adapter.disconnect();
    setConnectedIds((prev) => {
      const next = prev.filter((x) => x !== id);
      persist(next);
      return next;
    });
  };

  const value: IntegrationsContextValue = useMemo(
    () => ({
      adapters: INTEGRATION_ADAPTERS,
      connectedIds,
      connected: INTEGRATION_ADAPTERS.filter((a) =>
        connectedIds.includes(a.integration.id)
      ),
      connect,
      disconnect,
      isConnected: (id: string) => connectedIds.includes(id),
    }),
    [connectedIds]
  );

  return (
    <IntegrationsContext.Provider value={value}>
      {children}
    </IntegrationsContext.Provider>
  );
}

export function useIntegrations(): IntegrationsContextValue {
  const ctx = useContext(IntegrationsContext);
  if (!ctx) {
    throw new Error("useIntegrations must be used within IntegrationsProvider");
  }
  return ctx;
}
