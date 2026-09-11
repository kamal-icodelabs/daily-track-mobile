"use client";

/**
 * Tiny persistence + date helpers shared by all simulators. In production
 * these map to a DB (calendar tokens, channels, builds, messages) but a
 * localStorage-backed key-value store keeps the whole pipeline
 * self-contained so every feature works with no credentials.
 */

const NS = "dailytask-sim";

export function read<T>(key: string, fallback: T): T {
  if (typeof window === "undefined") return fallback;
  try {
    const raw = window.localStorage.getItem(`${NS}:${key}`);
    if (raw === null) return fallback;
    return JSON.parse(raw) as T;
  } catch {
    return fallback;
  }
}

export function write<T>(key: string, value: T): void {
  if (typeof window === "undefined") return;
  try {
    window.localStorage.setItem(`${NS}:${key}`, JSON.stringify(value));
  } catch {
    // storage full / private mode — fail silently like the rest of the app
  }
}

export function uid(prefix = "id"): string {
  return `${prefix}_${Date.now().toString(36)}${Math.random()
    .toString(36)
    .slice(2, 7)}`;
}

export function pad(n: number): string {
  return n < 10 ? `0${n}` : `${n}`;
}

/** Local `yyyy-mm-dd` for the given Date (defaults to now). */
export function dateKey(d: Date = new Date()): string {
  return `${d.getFullYear()}-${pad(d.getMonth() + 1)}-${pad(d.getDate())}`;
}

/** ISO date-time string `yyyy-mm-ddTHH:MM:SS` built from a date + hour/minute. */
export function isoAt(date: Date, hour: number, minute = 0): string {
  return `${dateKey(date)}T${pad(hour)}:${pad(minute)}:00`;
}

/** Minutes since midnight for a Date. */
export function minutesOf(d: Date): number {
  return d.getHours() * 60 + d.getMinutes() + d.getSeconds() / 60;
}

/** Monday of the current week (local). */
export function startOfWeek(date: Date = new Date()): Date {
  const d = new Date(date);
  d.setHours(0, 0, 0, 0);
  const day = d.getDay();
  const diff = day === 0 ? -6 : 1 - day;
  d.setDate(d.getDate() + diff);
  return d;
}

export function addDays(date: Date, days: number): Date {
  const d = new Date(date);
  d.setDate(d.getDate() + days);
  return d;
}

export function formatTime(iso: string): string {
  const [h, m] = iso.split("T")[1]?.split(":") ?? ["", ""];
  const hours = Number(h);
  if (Number.isNaN(hours)) return iso;
  const suffix = hours >= 12 ? "PM" : "AM";
  const shown = ((hours + 11) % 12) + 1;
  return `${shown}:${m}${suffix}`;
}

/** `x min` or `y hr z min` until now. */
export function minutesUntil(iso: string, now: Date = new Date()): number {
  const target = new Date(iso.replace(" ", "T")).getTime();
  const deltaMs = target - now.getTime();
  return Math.max(0, Math.round(deltaMs / 60000));
}

export function humanTimeLeft(minutes: number): string {
  if (minutes < 0) minutes = 0;
  if (minutes < 1) return "less than a minute";
  if (minutes < 60) return `${minutes} min`;
  const h = Math.floor(minutes / 60);
  const m = minutes % 60;
  return m === 0 ? `${h} hr` : `${h} hr ${m} min`;
}

