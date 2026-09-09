"use client";

import { motion } from "framer-motion";

export interface NavIconData {
  name: string;
  paths: string[];
}

/** House / dashboard */
const HOME: NavIconData = {
  name: "home",
  paths: [
    "M3 10.5 12 3l9 7.5",
    "M5 9.5V21h14V9.5",
    "M9 21v-6h6v6",
  ],
};

/** Clipboard with a checkmark / tracking */
const TRACKING: NavIconData = {
  name: "tracking",
  paths: [
    "M9 2h6v4H9z",
    "M16 4h2a2 2 0 0 1 2 2v14a2 2 0 0 1-2 2H6a2 2 0 0 1-2-2V6a2 2 0 0 1 2-2h2",
    "m9 14 2 2 4-4",
  ],
};

/** Folder kanban / projects */
const PROJECTS: NavIconData = {
  name: "projects",
  paths: [
    "M4 20h16a2 2 0 0 0 2-2V8a2 2 0 0 0-2-2h-7.93a2 2 0 0 1-1.66-.9l-.82-1.2A2 2 0 0 0 7.93 3H4a2 2 0 0 0-2 2v13c0 1.1.9 2 2 2Z",
    "M8 10v4",
    "M12 10v2",
    "M16 10v6",
  ],
};

/** Calendar / calendar */
const CALENDAR: NavIconData = {
  name: "calendar",
  paths: [
    "M3 3h18v18H3z",
    "M8 2v3",
    "M16 2v3",
    "M3 9h18",
  ],
};

/** User / profile */
const PROFILE: NavIconData = {
  name: "profile",
  paths: [
    "M19 21v-2a4 4 0 0 0-4-4H9a4 4 0 0 0-4 4v2",
    "M8 8a4 4 0 1 0 8 0a4 4 0 1 0-8 0",
  ],
};

export const NAV_ICONS: Record<string, NavIconData> = {
  "/dashboard": HOME,
  "/tracking": TRACKING,
  "/projects": PROJECTS,
  "/calendar": CALENDAR,
  "/profile": PROFILE,
};

function StaticIcon({ data, size }: { data: NavIconData; size: number }) {
  return (
    <svg
      width={size}
      height={size}
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth={1.8}
      strokeLinecap="round"
      strokeLinejoin="round"
    >
      {data.paths.map((d, i) => (
        <path key={i} d={d} />
      ))}
    </svg>
  );
}

function DrawIcon({
  data,
  size,
  strokeWidth,
}: {
  data: NavIconData;
  size: number;
  strokeWidth: number;
}) {
  const step = 0.55 / data.paths.length;
  return (
    <svg
      width={size}
      height={size}
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth={strokeWidth}
      strokeLinecap="round"
      strokeLinejoin="round"
    >
      {data.paths.map((d, i) => (
        <motion.path
          key={i}
          d={d}
          stroke="currentColor"
          initial={{ pathLength: 0, opacity: 0 }}
          animate={{ pathLength: 1, opacity: 1 }}
          transition={{
            pathLength: { type: "spring", stiffness: 260, damping: 22, delay: i * step },
            opacity: { duration: 0.1, delay: i * step },
          }}
        />
      ))}
    </svg>
  );
}

/**
 * Animated stroke icon. When `active`, the glyph fresh-mounts a draw-in
 * animation (staggered `pathLength`) so it visibly "reforms" on each switch.
 */
export function AnimatedNavIcon({
  data,
  active,
  size = 22,
}: {
  data: NavIconData;
  active: boolean;
  size?: number;
}) {
  return active ? (
    <DrawIcon data={data} size={size} strokeWidth={2.2} />
  ) : (
    <StaticIcon data={data} size={size} />
  );
}
