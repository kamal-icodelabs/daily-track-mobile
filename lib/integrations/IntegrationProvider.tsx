"use client";

import {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useRef,
  useState,
  type ReactNode,
} from "react";
import { useAuth } from "@/lib/auth";
import { useData } from "@/lib/data/store";
import * as calendarService from "@/lib/integrations/calendarService";
import * as slackService from "@/lib/integrations/slackService";
import * as jenkinsService from "@/lib/integrations/jenkinsService";
import {
  buildBriefingData,
  buildTeamWrapup,
  evaluateDailyPrompts,
} from "@/lib/integrations/briefing";
import { dateKey, formatTime, read, uid, write } from "@/lib/integrations/simDb";
import type {
  BriefingData,
  BuildEvent,
  BuildStatus,
  CalendarConnection,
  CalendarEventItem,
  SimToast,
  SlackChannel,
} from "@/lib/integrations/types";
import { Toaster } from "@/components/integrations/Toaster";
import { BriefingModal } from "@/components/integrations/BriefingModal";

/**
 * Orchestrates the simulated Google Calendar + Slack/Jenkins pipeline:
 *  - per-user calendar connection with simulated OAuth + token refresh
 *  - Slack workspace (channels, messages) + build announcements
 *  - Jenkins build registry
 *  - 30-second scheduler that fires the 11 AM standup prompt, the 6 PM
 *    personal briefing modal, the once-per-day team wrap-up to #general,
 *    and in-app "push-style" reminders shortly before events.
 *
 * All persistence is localStorage (see simDb.ts) so every feature runs
 * with zero credentials; swap the service layer for real APIs later.
 */

const GUARDS_KEY = "guards";
const TEAMWRAP_KEY = "teamWrapDate";
const REMINDER_MINUTES_KEY = "reminderMinutes";
const NOTIFIED_KEY = "notified";

const guardsKey = (userId: string) => `${GUARDS_KEY}:${userId}`;
const notifiedKey = (userId: string) => `${NOTIFIED_KEY}:${userId}`;

interface PromptGuards {
  lastStandup: string | null;
  lastBriefing: string | null;
}

interface IntegrationContextValue {
  // ── Calendar ──
  connection: CalendarConnection | null;
  connectCalendar: () => Promise<void>;
  disconnectCalendar: () => Promise<void>;
  fetchEvents: (range: "today" | "week") => Promise<CalendarEventItem[]>;
  // ── Slack ──
  channels: SlackChannel[];
  createChannel: (input: { name: string; projectId?: string | null }) => SlackChannel;
  // ── Jenkins ──
  builds: BuildEvent[];
  simulateBuild: (input: { jobName: string; status: BuildStatus }) => void;
  // ── Prompts & reminders ──
  showStandupPrompt: boolean;
  showBriefingPrompt: boolean;
  briefingData: BriefingData | null;
  dismissStandup: () => void;
  dismissBriefing: () => void;
  reminderMinutes: number;
  setReminderMinutes: (minutes: number) => void;
  toasts: SimToast[];
  dismissToast: (id: string) => void;
  notifications: SimToast[];
  clearNotifications: () => void;
  unreadCount: number;
  markAllRead: () => void;
}

const IntegrationContext = createContext<IntegrationContextValue | undefined>(
  undefined
);

export function IntegrationProvider({ children }: { children: ReactNode }) {
  const { user } = useAuth();
  const { tasks, workLogs, activity } = useData();

  const [connection, setConnection] = useState<CalendarConnection | null>(null);
  // Channels/builds/reminderMinutes start empty and are loaded in an effect
  // after hydration. Reading localStorage in a lazy initializer would render
  // different first-pass HTML on the server vs client → React hydration
  // mismatch on page refreshes for logged-in users.
  const [channels, setChannels] = useState<SlackChannel[]>([]);
  const [builds, setBuilds] = useState<BuildEvent[]>([]);
  const [showStandupPrompt, setShowStandupPrompt] = useState(false);
  const [showBriefingPrompt, setShowBriefingPrompt] = useState(false);
  const [briefingData, setBriefingData] = useState<BriefingData | null>(null);
  const [reminderMinutes, setReminderMinutesState] = useState<number>(10);
  const [toasts, setToasts] = useState<SimToast[]>([]);
  const [notifications, setNotifications] = useState<SimToast[]>(() => {
    if (typeof window === "undefined") return [];
    try {
      const raw = window.localStorage.getItem("notifications_history");
      return raw ? (JSON.parse(raw) as SimToast[]) : [];
    } catch {
      return [];
    }
  });
  const [unreadCount, setUnreadCount] = useState<number>(() => {
    if (typeof window === "undefined") return 0;
    try {
      const raw = window.localStorage.getItem("notifications_unread");
      return raw ? (JSON.parse(raw) as number) : 0;
    } catch {
      return 0;
    }
  });

  const buildsRef = useRef(builds);
  buildsRef.current = builds;

  // Hydrate the calendar connection when the signed-in user changes.
  useEffect(() => {
    if (!user) {
      setConnection(null);
      return;
    }
    setConnection(calendarService.getConnection(user.id));
  }, [user?.id]);

  // Load storage-backed workspace state once after mount.
  useEffect(() => {
    setChannels(slackService.listChannels());
    setBuilds(jenkinsService.listBuilds());
    const stored = read<number>(REMINDER_MINUTES_KEY, 10);
    if (typeof stored === "number" && stored > 0) {
      setReminderMinutesState(stored);
    }
  }, []);

  const pushToast = useCallback(
    (toast: Omit<SimToast, "id">) => {
      const id = uid("toast");
      const full: SimToast = { ...toast, id, timestamp: new Date().toISOString() } as SimToast & { timestamp: string };
      // visible toasts (max 2, iOS style one at a time but allow 2)
      setToasts((prev) => [...prev.slice(-1), full]);
      // history (persisted, max 50)
      setNotifications((prev) => {
        const next = [full, ...prev].slice(0, 50);
        try {
          window.localStorage.setItem("notifications_history", JSON.stringify(next));
        } catch {}
        return next;
      });
      setUnreadCount((prev) => {
        const next = prev + 1;
        try {
          window.localStorage.setItem("notifications_unread", JSON.stringify(next));
        } catch {}
        return next;
      });
    },
    []
  );

  const dismissToast = useCallback((id: string) => {
    setToasts((prev) => prev.filter((t) => t.id !== id));
  }, []);

  const clearNotifications = useCallback(() => {
    setNotifications([]);
    try {
      window.localStorage.removeItem("notifications_history");
    } catch {}
  }, []);

  const markAllRead = useCallback(() => {
    setUnreadCount(0);
    try {
      window.localStorage.setItem("notifications_unread", JSON.stringify(0));
    } catch {}
  }, []);

  const setReminderMinutes = useCallback((minutes: number) => {
    setReminderMinutesState(minutes);
    write<number>(REMINDER_MINUTES_KEY, minutes);
  }, []);

  const connectCalendar = useCallback(async () => {
    if (!user) return;
    const conn = await calendarService.connectCalendar(user.id, user.email);
    setConnection(conn);
    pushToast({
      kind: "info",
      title: "Google Calendar connected",
      body: `${user.email} · events will show on the Calendar page.`,
    });
  }, [user, pushToast]);

  const disconnectCalendar = useCallback(async () => {
    if (!user) return;
    await calendarService.disconnectCalendar(user.id);
    setConnection(null);
    pushToast({
      kind: "info",
      title: "Google Calendar disconnected",
      body: "Access revoked (simulated OAuth).",
    });
  }, [user, pushToast]);

  const fetchEvents = useCallback(
    async (range: "today" | "week") => {
      if (!user?.id) return [];
      const valid = await calendarService.ensureCalendarValid(
        user.id,
        connection
      );
      if (valid !== connection) setConnection(valid);
      return calendarService.fetchEvents(user.id, range);
    },
    [user?.id, connection]
  );

  const createChannel = useCallback(
    (input: { name: string; projectId?: string | null }) => {
      if (!user) throw new Error("not signed in");
      const channel = slackService.createChannel({
        name: input.name,
        projectId: input.projectId ?? null,
        createdBy: user.id,
      });
      setChannels(slackService.listChannels());
      pushToast({
        kind: "slack",
        title: `#${channel.name} created`,
        body: `Simulated conversations.create — ready for Jenkins + team posts.`,
      });
      return channel;
    },
    [user, pushToast]
  );

  const simulateBuild = useCallback(
    (input: { jobName: string; status: BuildStatus }) => {
      if (!user) return;
      const build = jenkinsService.runSimulatedBuild(input, user.name);
      setBuilds(jenkinsService.listBuilds());
      const emoji =
        build.status === "success" ? "passed" : build.status === "failed" ? "failed" : "started";
      pushToast({
        kind: "build",
        title: `Build #${build.buildNumber} ${emoji}`,
        body: `${build.jobName} → posted to #deployment${
          build.status === "failed" ? " + alert to #general" : ""
        }.`,
      });
    },
    [user, pushToast]
  );

  // 30-second scheduler: prompts, reminders, team wrap-up, token refresh.
  useEffect(() => {
    if (!user) return;

    const tick = async () => {
      const stored = calendarService.getConnection(user.id);
      const conn = await calendarService.ensureCalendarValid(user.id, stored);
      // Compare by identity-breaking fields, not object identity, so
      // re-reading from storage doesn't re-render the whole tree.
      if (
        stored?.connected !== conn?.connected ||
        stored?.email !== conn?.email ||
        stored?.tokenExpiry !== conn?.tokenExpiry
      ) {
        setConnection(conn);
      }

      const storedGuards = read<PromptGuards>(guardsKey(user.id), {
        lastStandup: null,
        lastBriefing: null,
      });
      const lastTeamWrap = read<string | null>(TEAMWRAP_KEY, null);
      const evalNow = evaluateDailyPrompts(new Date(), {
        lastStandup: storedGuards.lastStandup,
        lastBriefing: storedGuards.lastBriefing,
        lastTeamWrap,
      });

      if (evalNow.showStandup) {
        setShowStandupPrompt(true);
        write(guardsKey(user.id), {
          ...storedGuards,
          lastStandup: dateKey(),
        });
      }

      if (evalNow.showBriefing) {
        setBriefingData(
          buildBriefingData(tasks, workLogs, buildsRef.current, user.id)
        );
        setShowBriefingPrompt(true);
        write(guardsKey(user.id), {
          ...storedGuards,
          lastBriefing: dateKey(),
        });
      }

      if (evalNow.runTeamWrap) {
        const wrap = buildTeamWrapup(tasks, activity, buildsRef.current);
        slackService.postTeamWrapup(wrap);
        write(TEAMWRAP_KEY, dateKey());
        pushToast({
          kind: "slack",
          title: "#general · 6 PM wrap-up",
          body: `${wrap.completedToday} completed · ${wrap.inProgress} in progress · ${wrap.passedBuilds} builds passed.`,
        });
      }

      if (conn?.connected) {
        const notified = read<string[]>(notifiedKey(user.id), []);
        const due = calendarService.getDueReminders(
          new Date(),
          reminderMinutes,
          notified
        );
        if (due.length > 0) {
          const nextNotified = [...notified];
          const today = dateKey();
          for (const event of due) {
            const reminderKey = `${event.id}:${today}`;
            if (!nextNotified.includes(reminderKey)) {
              nextNotified.push(reminderKey);
              pushToast({
                kind: "reminder",
                title: `${event.summary} · ${formatTime(event.start)}`,
                body: event.hangoutLink
                  ? "Starts soon — join via meeting link."
                  : "Starts soon on your calendar.",
              });
            }
          }
          write(notifiedKey(user.id), nextNotified);
        }
      }
    };

    tick();
    const timer = setInterval(tick, 30_000);
    return () => clearInterval(timer);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [user?.id, reminderMinutes, tasks, workLogs, activity, pushToast]);

  const value = useMemo<IntegrationContextValue>(
    () => ({
      connection,
      connectCalendar,
      disconnectCalendar,
      fetchEvents,
      channels,
      createChannel,
      builds,
      simulateBuild,
      showStandupPrompt,
      showBriefingPrompt,
      briefingData,
      dismissStandup: () => setShowStandupPrompt(false),
      dismissBriefing: () => setShowBriefingPrompt(false),
      reminderMinutes,
      setReminderMinutes,
      toasts,
      dismissToast,
      notifications,
      clearNotifications,
      unreadCount,
      markAllRead,
    }),
    [
      connection,
      connectCalendar,
      disconnectCalendar,
      fetchEvents,
      channels,
      createChannel,
      builds,
      simulateBuild,
      showStandupPrompt,
      showBriefingPrompt,
      briefingData,
      reminderMinutes,
      setReminderMinutes,
      toasts,
      dismissToast,
      notifications,
      clearNotifications,
      unreadCount,
      markAllRead,
    ]
  );

  return (
    <IntegrationContext.Provider value={value}>
      {children}
      <BriefingModal />
      <Toaster />
    </IntegrationContext.Provider>
  );
}

export function useSimulatedIntegrations(): IntegrationContextValue {
  const ctx = useContext(IntegrationContext);
  if (!ctx) {
    throw new Error(
      "useSimulatedIntegrations must be used within IntegrationProvider"
    );
  }
  return ctx;
}