/**
 * Integration types for the simulated Google Calendar + Slack/Jenkins
 * pipeline. Everything here mirrors the shapes the real APIs would
 * return, so swapping the simulators for production clients later only
 * changes the service layer, never the UI.
 */

/** Simulated Google Calendar connection (per user). */
export interface CalendarConnection {
  connected: boolean;
  email?: string;
  /**
   * Obfuscated (never plaintext) simulated tokens. In the simulator they
   * are base64-encoded stand-ins; a real build replaces these with the
   * encrypted OAuth token pair.
   */
  accessToken?: string;
  refreshToken?: string;
  /** ms timestamp when the access token expires. */
  tokenExpiry?: number;
  connectedAt?: string;
}

/** A single calendar event, shaped like a Google API `event` item. */
export interface CalendarEventItem {
  id: string;
  summary: string;
  /** ISO date-time, e.g. `2026-09-11T10:00:00`. */
  start: string;
  end: string;
  location?: string;
  /** Google Meet / Hangouts link. */
  hangoutLink?: string;
  isMeeting: boolean;
  isStandup: boolean;
}

export type SlackChannelType = "general" | "deployment" | "custom";

export interface SlackChannel {
  id: string;
  name: string;
  /** Fake `C…` Slack conversation id (from simulated `conversations.create`). */
  slackChannelId: string;
  type: SlackChannelType;
  projectId?: string | null;
  createdBy?: string;
  createdAt: string;
}

export type BuildStatus = "started" | "success" | "failed";

export interface BuildEvent {
  id: string;
  source: "jenkins";
  jobName: string;
  status: BuildStatus;
  buildNumber: number;
  logUrl: string;
  triggeredBy?: string;
  timestamp: string;
  /** Slack channel ids this build was announced to. */
  postedToChannelIds: string[];
}

/** A Block Kit style message segment — rendered as cards in the app. */
export interface SlackMessageBlock {
  id: string;
  kind: "header" | "section" | "divider" | "actions";
  text: string;
  accent?: "ok" | "fail" | "neutral";
  url?: string;
}

export interface SlackMessage {
  id: string;
  channelId: string;
  blocks: SlackMessageBlock[];
  timestamp: string;
  kind: "build" | "team-wrap" | "alert";
}

/** Personal 6 PM briefing data (one user's end-of-day). */
export interface BriefingData {
  completedToday: number;
  inProgress: number;
  pending: number;
  hoursToday: number;
  buildsPassed: number;
  buildsFailed: number;
  totalBuilds: number;
}

/** Team-wide 6 PM wrap-up posted to the general Slack channel. */
export interface TeamWrapupData {
  completedToday: number;
  inProgress: number;
  failedBuilds: number;
  passedBuilds: number;
  activeProjects: number;
}

export interface SimToast {
  id: string;
  kind: "reminder" | "build" | "slack" | "info";
  title: string;
  body: string;
  timestamp?: string;
}