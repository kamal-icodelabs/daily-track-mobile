"use client";

import { Bell, BellOff, MapPin, Video } from "lucide-react";
import type { CalendarEvent } from "@/lib/mockData";

interface EventCardProps {
  event: CalendarEvent;
}

export function EventCard({ event }: EventCardProps) {
  return (
    <div className="animate-task-enter flex items-start gap-3 rounded-2xl border border-[var(--border)] bg-[var(--surface)] p-3.5 shadow-sm">
      <div className="flex w-14 shrink-0 flex-col items-center rounded-xl bg-[var(--accent-soft)] py-2">
        <span className="text-sm font-bold text-[var(--accent)]">
          {event.time}
        </span>
        <span className="text-[11px] text-[var(--accent)]/70">
          {event.endTime}
        </span>
      </div>

      <div className="min-w-0 flex-1">
        <p className="truncate text-[15px] font-semibold text-[var(--text)]">
          {event.title}
        </p>
        {event.location ? (
          <p className="mt-0.5 flex items-center gap-1 text-xs text-[var(--text-muted)]">
            <MapPin size={12} />
            {event.location}
          </p>
        ) : null}

        <div className="mt-2 flex items-center gap-2">
          {event.meetingLink ? (
            <button
              onClick={() => {
                console.log("Joining meeting", event.meetingLink);
              }}
              className="flex items-center gap-1.5 rounded-lg bg-[var(--accent)] px-3 py-1.5 text-xs font-semibold text-white transition-transform active:scale-95"
            >
              <Video size={13} />
              Join
            </button>
          ) : (
            <span className="flex items-center gap-1 text-xs text-[var(--text-muted)]">
              <MapPin size={12} />
              On-site
            </span>
          )}
          <span
            className="ml-auto flex items-center gap-1 text-xs"
            aria-label={event.reminder ? "Reminder on" : "Reminder off"}
          >
            {event.reminder ? (
              <Bell size={14} className="text-[var(--accent)]" />
            ) : (
              <BellOff size={14} className="text-[var(--text-muted)]" />
            )}
          </span>
        </div>
      </div>
    </div>
  );
}
