"use client";

import { read, write, uid } from "@/lib/integrations/simDb";

export type WorkAppId =
  | "slack"
  | "whatsapp"
  | "jira"
  | "notion"
  | "github"
  | "figma"
  | "linear"
  | "asana";

export interface WorkAppMeta {
  id: WorkAppId;
  name: string;
  description: string;
  color: string;
  /** placeholder for account hint */
  accountHint: string;
}

export interface WorkAppConnection {
  appId: WorkAppId;
  connected: boolean;
  account?: string;
  connectedAt?: string;
  accessToken?: string; // obfuscated
}

const STORAGE_KEY = "workAppsConnections";

export const WORK_APPS: WorkAppMeta[] = [
  {
    id: "slack",
    name: "Slack",
    description: "Team chat & deployment alerts",
    color: "#E01E5A",
    accountHint: "workspace.slack.com",
  },
  {
    id: "whatsapp",
    name: "WhatsApp",
    description: "Direct updates & standup reminders",
    color: "#25D366",
    accountHint: "+91 ••••• ••123",
  },
  {
    id: "jira",
    name: "Jira",
    description: "Issues, sprints & ticket sync",
    color: "#0052CC",
    accountHint: "atlassian.net",
  },
  {
    id: "notion",
    name: "Notion",
    description: "Docs, specs & knowledge base",
    color: "#000000",
    accountHint: "notion.so",
  },
  {
    id: "github",
    name: "GitHub",
    description: "Repos, PRs & code reviews",
    color: "#24292F",
    accountHint: "github.com",
  },
  {
    id: "figma",
    name: "Figma",
    description: "Design handoff & prototypes",
    color: "#A259FF",
    accountHint: "figma.com",
  },
  {
    id: "linear",
    name: "Linear",
    description: "Issue tracking & roadmap",
    color: "#5E6AD2",
    accountHint: "linear.app",
  },
  {
    id: "asana",
    name: "Asana",
    description: "Tasks & project timelines",
    color: "#FC636B",
    accountHint: "asana.com",
  },
];

function storageKey(userId: string): string {
  return `${STORAGE_KEY}:${userId}`;
}

function obfuscate(token: string): string {
  if (typeof window === "undefined") return token;
  try {
    return btoa(token).slice(0, 24) + "…";
  } catch {
    return token;
  }
}

export function listWorkApps(userId: string): WorkAppConnection[] {
  const stored = read<WorkAppConnection[]>(storageKey(userId), []);
  const map = new Map(stored.map((c) => [c.appId, c]));
  return WORK_APPS.map((meta) => map.get(meta.id) ?? { appId: meta.id, connected: false });
}

export function getWorkApp(userId: string, appId: WorkAppId): WorkAppConnection {
  return listWorkApps(userId).find((c) => c.appId === appId) ?? { appId, connected: false };
}

export function connectWorkApp(userId: string, appId: WorkAppId, accountEmail: string): WorkAppConnection {
  const connections = listWorkApps(userId);
  const updated = connections.map((c) =>
    c.appId === appId
      ? {
          appId,
          connected: true,
          account: accountEmail,
          connectedAt: new Date().toISOString(),
          accessToken: obfuscate(`sim_${appId}_${uid("tok")}_${Date.now()}`),
        }
      : c
  );
  write(storageKey(userId), updated);
  return updated.find((c) => c.appId === appId)!;
}

export function disconnectWorkApp(userId: string, appId: WorkAppId): WorkAppConnection {
  const connections = listWorkApps(userId);
  const updated = connections.map((c) => (c.appId === appId ? { appId, connected: false } : c));
  write(storageKey(userId), updated);
  return updated.find((c) => c.appId === appId)!;
}

export function isWorkAppConnected(userId: string, appId: WorkAppId): boolean {
  return !!getWorkApp(userId, appId).connected;
}
