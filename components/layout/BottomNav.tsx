"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { motion } from "framer-motion";
import { AnimatedNavIcon, NAV_ICONS } from "@/components/layout/NavIcons";
import { useSimulatedIntegrations } from "@/lib/integrations/IntegrationProvider";
import { useAuth } from "@/lib/auth";
import { useData } from "@/lib/data/store";
import { DAILY_STATUS_META, type DailyStatus } from "@/lib/data/types";
import { CheckCircle2, Clock, Home, CalendarX, XCircle } from "lucide-react";

interface NavItem {
  href: string;
  label: string;
  exact?: boolean;
}

const NAV_ITEMS: NavItem[] = [
  { href: "/dashboard", label: "Home", exact: true },
  { href: "/tracking", label: "Tracking", exact: true },
  { href: "/projects", label: "Projects", exact: true },
  { href: "/calendar", label: "Calendar" },
  { href: "/profile", label: "Profile" },
];

const DAILY_ICON: Record<DailyStatus, React.ComponentType<{ size?: number; className?: string; strokeWidth?: number }>> = {
  present: CheckCircle2,
  wfh: Home,
  absent: XCircle,
  on_leave: CalendarX,
  half_day: Clock,
};

/** Floating, frosted-glass pill dock with a morphing indicator blob. */
export function BottomNav() {
  const pathname = usePathname();
  const { connection } = useSimulatedIntegrations();
  const isCalendarConnected = !!connection?.connected;
  const { user } = useAuth();
  const { getDailyStatus } = useData();

  const visibleItems = isCalendarConnected ? NAV_ITEMS : NAV_ITEMS.filter((i) => i.href !== "/calendar");

  const isActive = (item: NavItem) =>
    item.exact ? pathname === item.href : pathname.startsWith(item.href);

  const dailyStatus = user ? (getDailyStatus(user.id) as DailyStatus | null) : null;
  const showProfileStatus = !!user && (user.role === "employee" || user.role === "manager");
  const effectiveStatus: DailyStatus | null =
    dailyStatus ?? (user?.leaveStatus === "on_leave" ? "on_leave" : null);
  const profileMeta = effectiveStatus ? DAILY_STATUS_META[effectiveStatus] : null;
  const ProfileStatusIcon = effectiveStatus ? DAILY_ICON[effectiveStatus] : null;

  return (
    <div
      className="shrink-0 px-4 pt-1"
      style={{
        paddingBottom: "calc(env(safe-area-inset-bottom) + 12px)",
      }}
    >
      <div className="relative mx-auto flex max-w-[400px] items-stretch justify-around rounded-[26px] border border-[var(--border)] bg-[var(--nav)]/85 shadow-lg shadow-[var(--shadow)] backdrop-blur-xl ring-1 ring-black/[0.03]">
        {visibleItems.map((item) => {
          const active = isActive(item);
          return (
            <Link
              key={item.href}
              href={item.href}
              className="relative flex flex-1 flex-col items-center justify-center gap-0.5 py-2.5"
            >
              {/* Morphing indicator blob */}
              {active ? (
                <motion.span
                  layoutId="nav-blob"
                  transition={{
                    type: "spring",
                    stiffness: 400,
                    damping: 32,
                    mass: 0.9,
                  }}
                  className="absolute inset-x-[14px] top-1/2 -z-0 h-9 -translate-y-1/2 rounded-full bg-[var(--accent-soft)] shadow-[0_2px_10px_var(--accent-soft)]"
                />
              ) : null}

              <span
                className={`relative z-10 flex h-9 w-[52px] items-center justify-center rounded-2xl transition-colors duration-200 ${
                  active ? "text-[var(--accent)]" : "text-[var(--text-muted)]"
                }`}
              >
                <motion.span
                  className="inline-flex"
                  animate={active ? { scale: [1, 1.12, 1] } : { scale: 1 }}
                  transition={{ duration: 0.45, times: [0, 0.5, 1], ease: "easeOut" }}
                >
                  <AnimatedNavIcon
                    data={NAV_ICONS[item.href]}
                    active={active}
                    size={22}
                  />
                </motion.span>
                {item.href === "/profile" && showProfileStatus && effectiveStatus && ProfileStatusIcon && profileMeta ? (
                  <span
                    className={`absolute -right-0.5 -top-0.5 flex h-[18px] w-[18px] items-center justify-center rounded-full border-2 border-[var(--nav)] text-white shadow-md ${profileMeta.dot}`}
                    title={profileMeta.label}
                  >
                    <ProfileStatusIcon size={11} strokeWidth={2.5} />
                  </span>
                ) : null}
              </span>
              <span
                className={`relative z-10 text-[10px] font-semibold tracking-tight transition-colors duration-200 ${
                  active ? "text-[var(--accent)]" : "text-[var(--text-muted)]"
                }`}
              >
                {item.label}
              </span>
            </Link>
          );
        })}

        {/* Subtle inner hairline affordance */}
        <div className="pointer-events-none absolute inset-x-3 top-px h-px bg-[var(--border)]/60" />
      </div>
    </div>
  );
}
