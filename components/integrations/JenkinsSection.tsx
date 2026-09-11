"use client";

import { useState } from "react";
import { Activity, CircleDot, Hammer, Rocket } from "lucide-react";
import { useSimulatedIntegrations } from "@/lib/integrations/IntegrationProvider";
import type { BuildEvent, BuildStatus } from "@/lib/integrations/types";
import { PickerDropdown } from "@/components/layout/PickerDropdown";

const STATUS_STYLES: Record<BuildStatus, string> = {
  started: "bg-[var(--accent-soft)] text-[var(--accent)]",
  success: "bg-[var(--success)]/15 text-[var(--success)]",
  failed: "bg-[var(--danger)]/15 text-[var(--danger)]",
};

const STATUS_DOT: Record<BuildStatus, string> = {
  started: "bg-[var(--accent)]",
  success: "bg-[var(--success)]",
  failed: "bg-[var(--danger)]",
};

/**
 * Jenkins build feed + "run build" simulator (manager/admin only can run).
 * Announcements go to #deployment — mirrored live from the build feed.
 */
export function JenkinsSection({ canRun }: { canRun: boolean }) {
  const { builds, simulateBuild } = useSimulatedIntegrations();
  const [jobName, setJobName] = useState("dailytask-mobile");
  const [status, setStatus] = useState<BuildStatus>("success");

  const submit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!jobName.trim()) return;
    simulateBuild({ jobName: jobName.trim(), status });
  };

  return (
    <div className="rounded-2xl border border-[var(--border)] bg-[var(--surface)] p-4 shadow-sm">
      <div className="flex items-center gap-2">
        <Hammer size={16} className="text-[var(--text-muted)]" />
        <p className="text-sm font-semibold text-[var(--text)]">Jenkins builds</p>
      </div>
      <p className="mb-3 mt-0.5 text-xs text-[var(--text-muted)]">
        Webhook results land here and are posted to Slack.
      </p>

      {canRun ? (
        <form onSubmit={submit} className="mb-4 flex flex-wrap items-center gap-2">
          <input
            value={jobName}
            onChange={(e) => setJobName(e.target.value)}
            placeholder="Job name"
            className="min-w-0 flex-1 rounded-xl border border-[var(--border)] bg-[var(--surface-2)] px-3 py-2 text-sm text-[var(--text)] outline-none transition-colors placeholder:text-[var(--text-muted)] focus:border-[var(--accent)]"
          />
          <div className="min-w-[130px]">
            <PickerDropdown
              label="Status"
              value={status}
              onChange={(v) => setStatus(v as BuildStatus)}
              icon={<Activity size={13} />}
              placeholder="Status"
              options={[
                { value: "success", label: "Success" },
                { value: "failed", label: "Failed" },
                { value: "started", label: "Started" },
              ]}
            />
          </div>
          <button
            type="submit"
            disabled={!jobName.trim()}
            className="flex items-center gap-1.5 rounded-xl bg-[var(--accent)] px-3 py-2 text-sm font-semibold text-white transition-transform active:scale-[0.97] disabled:opacity-40"
          >
            <Rocket size={14} />
            Run
          </button>
        </form>
      ) : null}

      {builds.length === 0 ? (
        <p className="rounded-xl border border-dashed border-[var(--border)] px-3 py-4 text-center text-xs text-[var(--text-muted)]">
          No builds yet — run one, or wait for the Jenkins webhook.
        </p>
      ) : (
        <ul className="space-y-2">
          {builds.slice(0, 8).map((build) => (
            <BuildRow key={build.id} build={build} />
          ))}
        </ul>
      )}
    </div>
  );
}

function BuildRow({ build }: { build: BuildEvent }) {
  const time = new Date(build.timestamp).toLocaleTimeString([], {
    hour: "2-digit",
    minute: "2-digit",
  });
  const announced = build.postedToChannelIds.length > 0 ? "→ #deployment" : "";
  const general =
    build.status === "failed" && build.postedToChannelIds.length > 1
      ? " + #general"
      : "";
  return (
    <li className="flex items-center gap-3 rounded-xl border border-[var(--border)] bg-[var(--surface-2)]/60 px-3 py-2">
      <span
        className={`h-2 w-2 shrink-0 rounded-full ${STATUS_DOT[build.status]}`}
      />
      <div className="min-w-0 flex-1">
        <p className="truncate text-sm font-medium text-[var(--text)]">
          #{build.buildNumber} · {build.jobName}
        </p>
        <p className="flex items-center gap-1 text-[11px] text-[var(--text-muted)]">
          <CircleDot size={11} />
          {time} {announced}
          {general}
        </p>
      </div>
      <span
        className={`rounded-full px-2 py-0.5 text-[10px] font-semibold uppercase tracking-wide ${STATUS_STYLES[build.status]}`}
      >
        {build.status}
      </span>
    </li>
  );
}