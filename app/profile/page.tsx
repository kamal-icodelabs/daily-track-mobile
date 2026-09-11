"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import {
  BadgeCheck,
  CalendarDays,
  CheckCircle2,
  ChevronRight,
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
import { GoogleCalendarSection } from "@/components/integrations/GoogleCalendarSection";
import { ChannelsSection } from "@/components/integrations/ChannelsSection";
import { JenkinsSection } from "@/components/integrations/JenkinsSection";
import { useAuth } from "@/lib/auth";
import { useIsAdmin, useCan } from "@/lib/permissions";

export default function ProfilePage() {
  const router = useRouter();
  const { user, logout } = useAuth();
  const isAdmin = useIsAdmin();
  const can = useCan();

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
            <GoogleCalendarSection />
            {can.canManageProjects ? <ChannelsSection /> : null}
            <JenkinsSection canRun={can.canManageProjects} />
          </div>
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
