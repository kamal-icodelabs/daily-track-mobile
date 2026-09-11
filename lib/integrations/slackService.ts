"use client";

import type {
  BuildEvent,
  SlackChannel,
  SlackMessage,
  SlackMessageBlock,
  TeamWrapupData,
} from "./types";
import { read, uid, write } from "./simDb";
import { buildBlockKitForBuild, buildTeamWrapupBlocks } from "./blockKit";

/**
 * Simulated Slack workspace (Web API surface: `conversations.list`,
 * `conversations.create`, `chat.postMessage`). Everything is stored
 * locally so the whole Slack story works with no `xoxb` token.
 *
 * Swap points for production: call `@slack/web-api` with the bot token
 * read from `SLACK_BOT_TOKEN`.
 */

export const GENERAL_CHANNEL_ID = "C0GENERAL";
export const DEPLOYMENT_CHANNEL_ID = "C0DEPLOY";

const CHANNELS_KEY = "slack:channels";
const messagesKey = (channelId: string) => `slack:messages:${channelId}`;

export function seedChannels(): SlackChannel[] {
  const existing = read<SlackChannel[]>(CHANNELS_KEY, []);
  if (existing.length > 0) return existing;
  const seeded: SlackChannel[] = [
    {
      id: "ch-general",
      name: "general",
      slackChannelId: GENERAL_CHANNEL_ID,
      type: "general",
      createdAt: "2026-01-01T00:00:00Z",
    },
    {
      id: "ch-deployment",
      name: "deployment",
      slackChannelId: DEPLOYMENT_CHANNEL_ID,
      type: "deployment",
      createdAt: "2026-01-01T00:00:00Z",
    },
  ];
  write(CHANNELS_KEY, seeded);
  return seeded;
}

export function listChannels(): SlackChannel[] {
  return seedChannels();
}

/** Simulated `conversations.create`. */
export function createChannel(input: {
  name: string;
  type?: "custom";
  projectId?: string | null;
  createdBy: string;
}): SlackChannel {
  const channels = seedChannels();
  const channel: SlackChannel = {
    id: uid("ch"),
    name: input.name.toLowerCase().replace(/\s+/g, "-"),
    slackChannelId: `C${Math.random().toString(36).slice(2, 10).toUpperCase()}`,
    type: input.type ?? "custom",
    projectId: input.projectId ?? null,
    createdBy: input.createdBy,
    createdAt: new Date().toISOString(),
  };
  write(CHANNELS_KEY, [...channels, channel]);
  return channel;
}

/** Simulated `chat.postMessage`. */
export function postMessage(
  channelId: string,
  kind: SlackMessage["kind"],
  blocks: SlackMessageBlock[]
): SlackMessage {
  const message: SlackMessage = {
    id: uid("msg"),
    channelId,
    blocks,
    timestamp: new Date().toISOString(),
    kind,
  };
  const messages = read<SlackMessage[]>(messagesKey(channelId), []);
  write(messagesKey(channelId), [message, ...messages].slice(0, 30));
  return message;
}

export function getChannelMessages(channelId: string): SlackMessage[] {
  return read<SlackMessage[]>(messagesKey(channelId), []);
}

/**
 * Announce a Jenkins build to #deployment. Failed builds also fire an
 * alert to #general (plus a toasty snack).
 */
export function postBuildToSlack(build: BuildEvent): { build: BuildEvent; posted: string[] } {
  const deployment = seedChannels().find(
    (c) => c.slackChannelId === DEPLOYMENT_CHANNEL_ID
  );
  const general = seedChannels().find(
    (c) => c.slackChannelId === GENERAL_CHANNEL_ID
  );

  const posted: string[] = [];
  if (deployment) {
    postMessage(deployment.slackChannelId, "build", buildBlockKitForBuild(build));
    posted.push(deployment.slackChannelId);
  }
  if (build.status === "failed" && general) {
    postMessage(
      general.slackChannelId,
      "alert",
      buildBlockKitForBuild(build)
    );
    posted.push(general.slackChannelId);
  }
  return { build: { ...build, postedToChannelIds: posted }, posted };
}

/** Simulated scheduled 6 PM team wrap-up to #general. */
export function postTeamWrapup(data: TeamWrapupData): SlackMessage | null {
  const general = seedChannels().find(
    (c) => c.slackChannelId === GENERAL_CHANNEL_ID
  );
  if (!general) return null;
  return postMessage(general.slackChannelId, "team-wrap", buildTeamWrapupBlocks(data));
}