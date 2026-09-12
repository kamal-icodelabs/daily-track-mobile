"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import {
  BadgeCheck,
  Bell,
  CalendarDays,
  CheckCircle2,
  ChevronRight,
  Clock,
  ListTodo,
  LogOut,
  Mail,
  Palette,
  Plug,
  Shield,
  User,
} from "lucide-react";
import { Header } from "@/components/layout/Header";
import { ThemeSwitcher } from "@/components/theme/ThemeSwitcher";
import { WorkAppsSection } from "@/components/integrations/WorkAppsSection";
import { GoogleCalendarSection } from "@/components/integrations/GoogleCalendarSection";
import { ChannelsSection } from "@/components/integrations/ChannelsSection";
import { JenkinsSection } from "@/components/integrations/JenkinsSection";
import { useAuth } from "@/lib/auth";
import { useIsAdmin, useCan } from "@/lib/permissions";
import { useSimulatedIntegrations } from "@/lib/integrations/IntegrationProvider";
import { useData } from "@/lib/data/store";
import { DailyStatusPicker } from "@/components/tracking/DailyStatusPicker";
import type { DailyStatus } from "@/lib/data/types";

export default function ProfilePage() {
  const router = useRouter();
  const { user, logout } = useAuth();
  const isAdmin = useIsAdmin();
  const can = useCan();
  const { connection, unreadCount, pushToast } = useSimulatedIntegrations();
  const isCalendarConnected = !!connection?.connected;
  const { getDailyStatus, setDailyStatus } = useData();
  const myStatus = getDailyStatus(user!.id) as DailyStatus | null;

  const handleLogout = () => {
    logout();
    router.push("/auth");
  };

  const me = user!;

  return (
    <div className="flex h-full flex-col">
      <Header title="Profile" subtitle="You, role & settings" actionIcon={User} />

      <div className="flex-1 space-y-6 overflow-y-auto px-4 py-4 pb-28">
        {/* User card */}
        <div className="flex items-center gap-4 rounded-2xl border border-[var(--border)] bg-[var(--surface)] p-4 shadow-sm">
          <div
            className="flex h-16 w-16 shrink-0 items-center justify-center rounded-full text-xl font-bold text-white"
            style={{ background: me.avatarColor }}
          >
            {me.initials}
          </div>
          <div className="min-w-0">
            <div className="flex items-center gap-1.5">
              <p className="truncate text-base font-bold text-[var(--text)]">
                {me.name}
              </p>
              <BadgeCheck size={16} className="shrink-0 text-[var(--accent)]" />
            </div>
            <p className="flex items-center gap-1.5 truncate text-sm text-[var(--text-muted)]">
              <Mail size={13} />
              {me.email}
            </p>
            <span
              className="mt-1.5 inline-block rounded-full px-2 py-0.5 text-[11px] font-semibold uppercase tracking-wide text-white"
              style={{ background: me.avatarColor }}
            >
              {roleLabel(me.role)}
            </span>
          </div>
        </div>

        {/* Daily status — every employee can update */}
        <section className="rounded-2xl border border-[var(--border)] bg-[var(--surface)] p-4 shadow-sm">
          <div className="mb-2 flex items-center gap-2">
            <Clock size={16} className="text-[var(--accent)]" />
            <h2 className="text-sm font-semibold text-[var(--text)]">Today&apos;s status</h2>
            <span className="ml-auto rounded-full bg-[var(--accent-soft)] px-2 py-0.5 text-[10px] font-bold text-[var(--accent)]">
              {new Date().toLocaleDateString(undefined, { weekday: "short", day: "numeric", month: "short" })}
            </span>
          </div>
          <p className="mb-3 text-xs text-[var(--text-muted)]">Set your daily presence — visible on Tracking for the whole team.</p>
          <DailyStatusPicker
            value={myStatus}
            onChange={(v) => {
              setDailyStatus(user!.id, v);
              pushToast({ kind: "info", title: `Status: ${v}`, body: `${user!.name} is now ${v.replace("_", " ")}` });
            }}
            label="Status"
          />
          <p className="mt-2 text-[11px] text-[var(--text-muted)]">Options: Present · WFH · Absent · On Leave · Half Day — saved for today.</p>
        </section>

        {/* Notifications */}
        <Link
          href="/notifications"
          className="flex items-center gap-3 rounded-2xl border border-[var(--border)] bg-[var(--surface)] p-3.5 shadow-sm active:scale-[0.98]"
        >
          <div className="relative flex h-10 w-10 items-center justify-center rounded-xl bg-[var(--accent-soft)] text-[var(--accent)]">
            <Bell size={18} />
            {unreadCount > 0 && (
              <span className="absolute -right-1 -top-1 flex h-5 min-w-[20px] items-center justify-center rounded-full bg-[var(--danger)] px-1 text-[11px] font-bold text-white">
                {unreadCount > 9 ? "9+" : unreadCount}
              </span>
            )}
          </div>
          <div className="flex-1">
            <p className="text-sm font-semibold text-[var(--text)]">Notifications</p>
            <p className="text-xs text-[var(--text-muted)]">
              {unreadCount > 0 ? `${unreadCount} unread · tap to view` : "All caught up · iOS banners for 3s"}
            </p>
          </div>
          <ChevronRight size={18} className="text-[var(--text-muted)]" />
        </Link>

        {/* Quick links */}
        <section className="space-y-2.5">
          {!can.canManageUsers ? (
            <Link
              href="/today"
              className="flex items-center gap-3 rounded-2xl border border-[var(--border)] bg-[var(--surface)] p-3.5 shadow-sm"
            >
              <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-[var(--accent-soft)] text-[var(--accent)]">
                <ListTodo size={18} />
              </div>
              <span className="flex-1 text-sm font-semibold text-[var(--text)]">
                My tasks
              </span>
              <ChevronRight size={18} className="text-[var(--text-muted)]" />
            </Link>
          ) : null}

          <Link
            href="/calendar"
            className="flex items-center gap-3 rounded-2xl border border-[var(--border)] bg-[var(--surface)] p-3.5 shadow-sm"
          >
            <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-[var(--accent-soft)] text-[var(--accent)]">
              <CalendarDays size={18} />
            </div>
            <span className="flex-1 text-sm font-semibold text-[var(--text)]">
              Calendar
            </span>
            <ChevronRight size={18} className="text-[var(--text-muted)]" />
          </Link>

          <Link
            href="/log"
            className="flex items-center gap-3 rounded-2xl border border-[var(--border)] bg-[var(--surface)] p-3.5 shadow-sm"
          >
            <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-[var(--accent-soft)] text-[var(--accent)]">
              <CheckCircle2 size={18} />
            </div>
            <span className="flex-1 text-sm font-semibold text-[var(--text)]">
              Work log & activity
            </span>
            <ChevronRight size={18} className="text-[var(--text-muted)]" />
          </Link>

          {isAdmin ? (
            <Link
              href="/admin"
              className="flex items-center gap-3 rounded-2xl border border-[var(--border)] bg-[var(--surface)] p-3.5 shadow-sm"
            >
              <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-[var(--accent-soft)] text-[var(--accent)]">
                <Shield size={18} />
              </div>
              <span className="flex-1 text-sm font-semibold text-[var(--text)]">
                Admin panel
              </span>
              <ChevronRight size={18} className="text-[var(--text-muted)]" />
            </Link>
          ) : null}
        </section>

        {/* Theme selector - prominent */}
        <section>
          <div className="mb-2 flex items-center gap-2 px-1">
            <Palette size={17} className="text-[var(--accent)]" />
            <h2 className="text-sm font-semibold text-[var(--text-muted)]">
              Theme
            </h2>
          </div>
          <div className="rounded-2xl border border-[var(--border)] bg-[var(--surface)] p-4 shadow-sm">
            <ThemeSwitcher />
          </div>
          <p className="mt-2 px-1 text-xs text-[var(--text-muted)]">
            Pick a vibe — saved instantly and applied across the whole app.
            Dark theme follows your system preference on first launch.
          </p>
        </section>

        {/* Integrations */}
        <section>
          <div className="mb-2 flex items-center gap-2 px-1">
            <Plug size={17} className="text-[var(--accent)]" />
            <h2 className="text-sm font-semibold text-[var(--text-muted)]">
              Integrations
            </h2>
          </div>
          <div className="space-y-2.5">
            <WorkAppsSection />
            {!isCalendarConnected && <GoogleCalendarSection />}
            {can.canManageProjects ? <ChannelsSection /> : null}
            <JenkinsSection canRun={can.canManageProjects} />
          </div>
          {isCalendarConnected && (
            <p className="mt-2 px-1 text-xs text-[var(--text-muted)]">
              Calendar connected — open it from the bottom navigation.
            </p>
          )}
          <p className="mt-2 px-1 text-xs text-[var(--text-muted)]">
            Simulated end-to-end flows — swap the service layer for real
            Google / Slack / Jenkins APIs later (no credentials needed now).
          </p>
        </section>

        {/* Logout */}
        <button
          onClick={handleLogout}
          className="flex w-full items-center justify-center gap-2 rounded-2xl border border-[var(--danger)]/30 bg-[var(--danger)]/10 py-3.5 text-sm font-semibold text-[var(--danger)] transition-transform active:scale-[0.98]"
        >
          <LogOut size={17} />
          Log out
        </button>
      </div>
    </div>
  );
}

function roleLabel(role: string): string {
  if (role === "admin") return "Admin";
  if (role === "manager") return "Project Manager";
  return "Developer";
}
