"use client";

import type { CalendarConnection, CalendarEventItem } from "./types";
import { addDays, dateKey, isoAt, read, startOfWeek, uid, write } from "./simDb";

/**
 * Simulated Google Calendar service.
 *
 * Mirrors the Google Calendar API surface the real app will use
 * (OAuth connect/refresh + `calendar.events.list`), but backed by
 * localStorage so the whole flow works with zero credentials.
 *
 * Swap points for production:
 *  - `connectCalendar`  → real OAuth2 consent + code exchange
 *  - `refreshToken`     → real token refresh call
 *  - `fetchEvents`      → GET /calendar/v3/calendars/primary/events
 */

/** Simulated access-token lifetime: 1 hour, like the real API. */
const TOKEN_TTL_MS = 60 * 60 * 1000;
const EVENTS_TTL_MS = 10 * 60 * 1000;

const keyFor = (userId: string) => `calendar:${userId}`;
const cacheKeyFor = (userId: string, range: string) =>
  `calendar-cache:${userId}:${range}`;

/** Obfuscate a string so stored tokens are never plaintext. */
function obfuscate(input: string): string {
  const enc = new TextEncoder().encode(input);
  let bin = "";
  enc.forEach((byte) => {
    bin += String.fromCharCode(byte);
  });
  return `sim.${btoa(bin)}.${uid("t").slice(-6)}`;
}

function simulateNetwork(): Promise<void> {
  return new Promise((resolve) => setTimeout(resolve, 700));
}

/** Simulated OAuth consent + token issuance. */
export async function connectCalendar(userId: string, email: string): Promise<CalendarConnection> {
  await simulateNetwork();
  const now = Date.now();
  const conn: CalendarConnection = {
    connected: true,
    email,
    accessToken: obfuscate(`access:${email}`),
    refreshToken: obfuscate(`refresh:${email}`),
    tokenExpiry: now + TOKEN_TTL_MS,
    connectedAt: new Date(now).toISOString(),
  };
  write(keyFor(userId), conn);
  return conn;
}

/** Simulated revoke access. */
export async function disconnectCalendar(userId: string): Promise<void> {
  await simulateNetwork();
  window.localStorage.removeItem(`dailytask-sim:${keyFor(userId)}`);
}

export function getConnection(userId: string): CalendarConnection | null {
  return read<CalendarConnection | null>(keyFor(userId), null);
}

/** Simulated token refresh when the access token is about to expire. */
export async function ensureCalendarValid(
  userId: string,
  conn: CalendarConnection | null
): Promise<CalendarConnection | null> {
  if (!conn?.connected) return null;
  if (!conn.tokenExpiry || conn.tokenExpiry >= Date.now() + 5 * 60 * 1000) {
    return conn;
  }
  await simulateNetwork();
  const next: CalendarConnection = {
    ...conn,
    accessToken: obfuscate(`access:${conn.email}`),
    tokenExpiry: Date.now() + TOKEN_TTL_MS,
  };
  write(keyFor(userId), next);
  return next;
}

/**
 * Build a realistic day of events relative to `date`, shaped like
 * `calendar.events.list` items.
 */
function buildDayEvents(date: Date): CalendarEventItem[] {
  const base: Array<
    Omit<CalendarEventItem, "id" | "start" | "end"> & {
      hour: number;
      minutes: number;
      duration: number;
    }
  > = [
    {
      summary: "Daily Standup",
      hour: 9,
      minutes: 30,
      duration: 30,
      location: "Zoom · Engineering",
      hangoutLink: "https://meet.google.com/sim-dayly-standup",
      isMeeting: true,
      isStandup: true,
    },
    {
      summary: "Product Design Review",
      hour: 11,
      minutes: 0,
      duration: 60,
      location: "Conference Room B",
      hangoutLink: "https://meet.google.com/sim-design-review",
      isMeeting: true,
      isStandup: false,
    },
    {
      summary: "1:1 with Manager",
      hour: 14,
      minutes: 30,
      duration: 30,
      hangoutLink: "https://meet.google.com/sim-1on1",
      isMeeting: true,
      isStandup: false,
    },
    {
      summary: "Focus Block — Ship TS-09",
      hour: 16,
      minutes: 0,
      duration: 60,
      location: "No meetings · deep work",
      isMeeting: false,
      isStandup: false,
    },
  ];

  return base.map((e) => ({
    ...e,
    // Deterministic per day so reminder keys stay stable across ticks.
    id: `evt-${dateKey(date)}-${e.hour}-${e.minutes}`,
    start: isoAt(date, e.hour, e.minutes),
    end: isoAt(date, e.hour + Math.floor((e.minutes + e.duration) / 60), (e.minutes + e.duration) % 60),
  }));
}

/** Simulated `calendar.events.list` with a short TTL cache. */
export async function fetchEvents(
  userId: string,
  range: "today" | "week"
): Promise<CalendarEventItem[]> {
  await simulateNetwork();
  const cacheKey = cacheKeyFor(userId, range);
  const cached = read<{ at: number; data: CalendarEventItem[] }>(cacheKey, {
    at: 0,
    data: [],
  });
  if (cached.at && cached.at + EVENTS_TTL_MS >= Date.now()) {
    return cached.data;
  }

  const events: CalendarEventItem[] = [];
  if (range === "today") {
    events.push(...buildDayEvents(new Date()));
  } else {
    const monday = startOfWeek();
    for (let i = 0; i < 5; i += 1) {
      const day = addDays(monday, i);
      const base = buildDayEvents(day);
      const rotated =
        i % 2 === 0 ? base : base.slice(2).concat(base.slice(0, 2));
      events.push(...rotated);
    }
  }

  write(cacheKey, { at: Date.now(), data: events });
  return events;
}

/**
 * Synchronous reminder sweep used by the 30-second scheduler tick:
 * returns today's events starting within `reminderMinutes` that haven't
 * been announced yet (`notified` holds `eventId:dateKey` entries).
 */
export function getDueReminders(
  now: Date,
  reminderMinutes: number,
  notified: string[]
): CalendarEventItem[] {
  const todayKey = dateKey();
  const windowEnd = now.getTime() + reminderMinutes * 60 * 1000;
  return buildDayEvents(now).filter((e) => {
    const start = new Date(e.start.replace(" ", "T")).getTime();
    if (start <= now.getTime()) return false;
    if (start > windowEnd) return false;
    return !notified.includes(`${e.id}:${todayKey}`);
  });
}