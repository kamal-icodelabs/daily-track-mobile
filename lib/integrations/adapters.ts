import type { Integration } from "@/lib/data/types";

/**
 * 3rd-party integration adapters.
 *
 * In the future these map 1:1 to real API clients (Slack Web API,
 * Google Calendar API, GitHub REST API, ...). Right now each adapter
 * exposes metadata plus a `connect`/`disconnect` stub that returns
 * immediately, so the UI can demonstrate the full connection flow
 * without any real credentials.
 *
 * To integrate for real later: give each adapter an `init({ token })`,
 * replace the stub `connect` with a real OAuth/API handshake, and have
 * the DataProvider pull tasks/calendar/meetings from these adapters.
 */
export interface IntegrationAdapter {
  integration: Integration;
  /**
   * Establish the connection. Stub for now — resolves to true.
   */
  connect(): Promise<boolean>;
  /**
   * Tear down the connection. Stub for now — resolves immediately.
   */
  disconnect(): Promise<void>;
}

export const INTEGRATION_ADAPTERS: IntegrationAdapter[] = [
  {
    integration: {
      id: "slack",
      name: "Slack",
      description: "Push daily task summaries & reminders to a channel.",
      icon: "slack",
      connected: false,
      capabilities: [
        "Post daily task summary",
        "Send due-date reminders",
        "Notify on task completion",
      ],
    },
    connect: async () => {
      return true;
    },
    disconnect: async () => {},
  },
  {
    integration: {
      id: "google-calendar",
      name: "Google Calendar",
      description: "Sync meetings & events into your Dayly calendar.",
      icon: "calendar",
      connected: false,
      capabilities: [
        "Sync meetings & events",
        "Two-way event sync",
        "Join meeting links",
      ],
    },
    connect: async () => {
      return true;
    },
    disconnect: async () => {},
  },
  {
    integration: {
      id: "github",
      name: "GitHub",
      description: "Link issues to tasks and track PRs.",
      icon: "github",
      connected: false,
      capabilities: [
        "Link GitHub issues to tasks",
        "Track linked pull requests",
        "Auto-update task status",
      ],
    },
    connect: async () => {
      return true;
    },
    disconnect: async () => {},
  },
];
