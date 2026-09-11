"use client";

import { useState } from "react";
import { FolderKanban, Hash, Plus } from "lucide-react";
import { useSimulatedIntegrations } from "@/lib/integrations/IntegrationProvider";
import { useData } from "@/lib/data/store";
import type { SlackChannel } from "@/lib/integrations/types";
import { PickerDropdown } from "@/components/layout/PickerDropdown";

const TYPE_STYLES: Record<SlackChannel["type"], string> = {
  general: "bg-[var(--accent-soft)] text-[var(--accent)]",
  deployment: "bg-[var(--success)]/15 text-[var(--success)]",
  custom: "bg-[var(--surface-2)] text-[var(--text-muted)]",
};

/**
 * Slack workspace channels. Managers + admins can create channels
 * (simulated `conversations.create`); everyone sees the list.
 */
export function ChannelsSection() {
  const { channels, createChannel } = useSimulatedIntegrations();
  const { projects } = useData();
  const [name, setName] = useState("");
  const [projectId, setProjectId] = useState<string>("");

  const submit = (e: React.FormEvent) => {
    e.preventDefault();
    const trimmed = name.trim();
    if (!trimmed) return;
    createChannel({ name: trimmed, projectId: projectId || null });
    setName("");
    setProjectId("");
  };

  return (
    <div className="rounded-2xl border border-[var(--border)] bg-[var(--surface)] p-4 shadow-sm">
      <p className="text-sm font-semibold text-[var(--text)]">Slack channels</p>
      <p className="mb-3 text-xs text-[var(--text-muted)]">
        Build results and daily wrap-ups are posted here (simulated).
      </p>

      <ul className="mb-3 space-y-2">
        {channels.map((channel) => (
          <li
            key={channel.id}
            className="flex items-center gap-3 rounded-xl border border-[var(--border)] bg-[var(--surface-2)]/60 px-3 py-2"
          >
            <Hash size={15} className="text-[var(--text-muted)]" />
            <span className="flex-1 truncate text-sm font-medium text-[var(--text)]">
              {channel.name}
            </span>
            <span
              className={`rounded-full px-2 py-0.5 text-[10px] font-semibold uppercase tracking-wide ${TYPE_STYLES[channel.type]}`}
            >
              {channel.type}
            </span>
          </li>
        ))}
      </ul>

      <form onSubmit={submit} className="space-y-2">
        <input
          value={name}
          onChange={(e) => setName(e.target.value)}
          placeholder="New channel name"
          className="w-full rounded-xl border border-[var(--border)] bg-[var(--surface-2)] px-3 py-2 text-sm text-[var(--text)] outline-none transition-colors placeholder:text-[var(--text-muted)] focus:border-[var(--accent)]"
        />
        <div className="flex items-center gap-2">
          <div className="flex-1">
            <PickerDropdown
              label="Project link"
              value={projectId || "__none"}
              onChange={(v) => setProjectId(v === "__none" ? "" : v)}
              icon={<FolderKanban size={13} />}
              placeholder="No project link"
              options={[
                { value: "__none", label: "No project link" },
                ...projects.map((project) => ({
                  value: project.id,
                  label: project.name,
                  color: project.color,
                })),
              ]}
            />
          </div>
          <button
            type="submit"
            disabled={!name.trim()}
            className="flex items-center gap-1.5 rounded-xl border border-[var(--accent)] bg-[var(--accent-soft)] px-3 py-2 text-sm font-semibold text-[var(--accent)] transition-transform active:scale-[0.97] disabled:opacity-40"
          >
            <Plus size={14} />
            Create
          </button>
        </div>
      </form>
    </div>
  );
}