"use client";

import type { BuildEvent } from "./types";
import type { BriefingData, TeamWrapupData } from "./types";
import type { Task, TaskActivity, WorkLog } from "@/lib/data/types";
import { dateKey } from "./simDb";

/**
 * Scheduler evaluation + summary builders for the 11 AM standup prompt,
 * the 6 PM personal briefing, and the once-per-day team wrap-up that gets
 * posted to the Slack #general channel.
 *
 * Prompt timestamps are persisted per user (lastStandupPromptDate /
 * lastBriefingPromptDate) so each fires at most once per day.
 */

export interface PromptGuards {
  lastStandup: string | null;
  lastBriefing: string | null;
  lastTeamWrap: string | null;
}

export interface DailyPromptState {
  showStandup: boolean;
  showBriefing: boolean;
  runTeamWrap: boolean;
}

const STANDUP_MINUTES = 11 * 60; // 11:00
const BRIEFING_MINUTES = 18 * 60; // 18:00

function minutesOf(date: Date): number {
  return date.getHours() * 60 + date.getMinutes() + date.getSeconds() / 60;
}

export function evaluateDailyPrompts(
  now: Date,
  guards: PromptGuards
): DailyPromptState {
  const today = dateKey(now);
  const minute = minutesOf(now);
  return {
    showStandup: minute >= STANDUP_MINUTES && guards.lastStandup !== today,
    showBriefing: minute >= BRIEFING_MINUTES && guards.lastBriefing !== today,
    runTeamWrap: minute >= BRIEFING_MINUTES && guards.lastTeamWrap !== today,
  };
}

export function buildBriefingData(
  tasks: Task[],
  workLogs: WorkLog[],
  builds: BuildEvent[],
  userId: string
): BriefingData {
  const today = dateKey();
  const mine = tasks.filter((t) => t.assigneeId === userId);
  const completedToday = mine.filter((t) => t.status === "done").length;
  const inProgress = mine.filter((t) => t.status === "in_progress").length;
  const pending = mine.filter(
    (t) => !["done", "in_progress"].includes(t.status)
  ).length;
  const hoursToday = workLogs
    .filter((l) => l.userId === userId && l.date === today)
    .reduce((sum, l) => sum + (l.hours || 0), 0);
  const totalBuilds = builds.length;
  const buildsPassed = builds.filter((b) => b.status === "success").length;
  const buildsFailed = builds.filter((b) => b.status === "failed").length;

  return {
    completedToday,
    inProgress,
    pending,
    hoursToday,
    buildsPassed,
    buildsFailed,
    totalBuilds,
  };
}

export function buildTeamWrapup(
  tasks: Task[],
  activity: TaskActivity[],
  builds: BuildEvent[]
): TeamWrapupData {
  const today = dateKey();
  const completedToday = activity.filter(
    (a) => a.type === "completed" && dateKey(new Date(a.createdAt)) === today
  ).length;
  const inProgress = tasks.filter((t) => t.status === "in_progress").length;
  const passedBuilds = builds.filter((b) => b.status === "success").length;
  const failedBuilds = builds.filter((b) => b.status === "failed").length;
  const activeProjects = new Set(
    tasks.filter((t) => t.projectId).map((t) => t.projectId)
  ).size;

  return {
    completedToday,
    inProgress,
    passedBuilds,
    failedBuilds,
    activeProjects,
  };
}