"use client";

import type { BuildEvent, BuildStatus } from "./types";
import { read, uid, write } from "./simDb";
import { postBuildToSlack } from "./slackService";

/**
 * Simulated Jenkins service. Mirrors the Jenkins webhook contract
 * (`jobName`, `status`, `buildNumber`, `logUrl`) plus the client-side
 * "Run build" trigger used to demo the flow without a real CI server.
 *
 * Swap point for production: a real Jenkins webhook hits
 * `POST /api/webhooks/jenkins` (see app/api/webhooks/jenkins/route.ts)
 * and this module's outcome is persisted server-side.
 */

const BUILDS_KEY = "jenkins:builds";

export interface JenkinsWebhookPayload {
  jobName: string;
  status: BuildStatus;
  buildNumber?: number;
  logUrl: string;
}

export function listBuilds(): BuildEvent[] {
  return read<BuildEvent[]>(BUILDS_KEY, []);
}

function persistBuilds(builds: BuildEvent[]): void {
  write(BUILDS_KEY, builds.slice(0, 40));
}

/** Coerce + sanitize an incoming webhook payload (also used by the route). */
export function normalizeWebhookPayload(
  raw: Record<string, unknown>
): JenkinsWebhookPayload | null {
  if (
    typeof raw?.jobName !== "string" ||
    !["started", "success", "failed"].includes(String(raw?.status))
  ) {
    return null;
  }
  return {
    jobName: String(raw.jobName).trim(),
    status: String(raw.status) as BuildStatus,
    buildNumber:
      typeof raw.buildNumber === "number" ? raw.buildNumber : undefined,
    logUrl:
      typeof raw.logUrl === "string" ? raw.logUrl : `#/job/${String(raw.jobName)}/`,
  };
}

/**
 * Process a build event: record it, announce to #deployment (and #general
 * on failure), and return the stored event.
 */
export function processBuild(
  input: JenkinsWebhookPayload,
  triggeredBy?: string
): BuildEvent {
  const builds = listBuilds();
  const buildNumber =
    input.buildNumber ?? builds.reduce((max, b) => Math.max(max, b.buildNumber), 0) + 1;
  const event: BuildEvent = {
    id: uid("bld"),
    source: "jenkins",
    jobName: input.jobName,
    status: input.status,
    buildNumber,
    logUrl: input.logUrl,
    triggeredBy,
    timestamp: new Date().toISOString(),
    postedToChannelIds: [],
  };

  const posted = postBuildToSlack(event);
  const stored = { ...posted.build, postedToChannelIds: posted.posted };
  persistBuilds([stored, ...builds]);
  return stored;
}

/** Client-side demo trigger (stands in for the real webhook). */
export function runSimulatedBuild(
  input: { jobName: string; status: BuildStatus },
  triggeredBy: string
): BuildEvent {
  return processBuild(
    {
      jobName: input.jobName,
      status: input.status,
      logUrl: `https://ci.example.com/job/${encodeURIComponent(input.jobName)}/lastSuccessfulBuild/console`,
    },
    triggeredBy
  );
}