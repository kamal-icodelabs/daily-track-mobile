import type { BuildEvent, SlackMessageBlock, TeamWrapupData } from "./types";

/**
 * Pure Block Kit builders. Kept free of any browser APIs so the same
 * functions can run in the client simulators AND the `/api/webhooks`
 * route handler without a client directive.
 */

export function buildBlockKitForBuild(build: BuildEvent): SlackMessageBlock[] {
  const status = build.status;
  const blocks: SlackMessageBlock[] = [
    {
      id: `${build.id}-h`,
      kind: "header",
      text: `Build #${build.buildNumber} · ${build.jobName}`,
    },
    {
      id: `${build.id}-s`,
      kind: "section",
      text:
        status === "success"
          ? ":white_check_mark: Build passed"
          : status === "failed"
            ? ":x: Build FAILED"
            : ":arrows_counterclockwise: Build started",
      accent: status === "success" ? "ok" : status === "failed" ? "fail" : "neutral",
    },
    { id: `${build.id}-d`, kind: "divider", text: "──────────" },
    {
      id: `${build.id}-a`,
      kind: "actions",
      text: "View console output",
      url: build.logUrl,
    },
  ];
  return blocks;
}

export function buildTeamWrapupBlocks(data: TeamWrapupData): SlackMessageBlock[] {
  return [
    { id: "wrap-h", kind: "header", text: "End of day — team wrap-up" },
    {
      id: "wrap-s",
      kind: "section",
      text: [
        `:white_check_mark: ${data.completedToday} tickets completed`,
        `:hammer_and_wrench: ${data.inProgress} still in progress`,
        `:rocket: ${data.passedBuilds} builds passed`,
        `:x: ${data.failedBuilds} builds failed`,
        `:briefcase: ${data.activeProjects} active projects`,
      ].join("\n"),
      accent: data.failedBuilds > 0 ? "neutral" : "ok",
    },
  ];
}