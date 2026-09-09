export type TaskSource = "Manual" | "Assigned";

export interface Task {
  id: string;
  title: string;
  source: TaskSource;
  done: boolean;
}

export interface CalendarEvent {
  id: string;
  time: string;
  endTime: string;
  title: string;
  location?: string;
  meetingLink?: string;
  reminder: boolean;
}

export type LogEntryType = "task" | "meeting" | "focus";

export interface DayLogEntry {
  id: string;
  title: string;
  type: LogEntryType;
  time?: string;
}

export interface DayLog {
  date: string;
  label: string;
  entries: DayLogEntry[];
}

export const INITIAL_TASKS: Task[] = [
  { id: "t1", title: "Morning standup with team", source: "Assigned", done: false },
  { id: "t2", title: "Review pull request #214", source: "Assigned", done: false },
  { id: "t3", title: "Plan sprint for next week", source: "Manual", done: false },
  { id: "t4", title: "Reply to client emails", source: "Manual", done: false },
  { id: "t5", title: "Write project update", source: "Manual", done: false },
];

export const CALENDAR_EVENTS: CalendarEvent[] = [
  {
    id: "e1",
    time: "09:30",
    endTime: "10:00",
    title: "Daily Standup",
    meetingLink: "https://meet.example.com/standup",
    reminder: true,
  },
  {
    id: "e2",
    time: "11:00",
    endTime: "12:00",
    title: "Product Design Review",
    location: "Conference Room B",
    meetingLink: "https://meet.example.com/design",
    reminder: true,
  },
  {
    id: "e3",
    time: "14:30",
    endTime: "15:00",
    title: "1:1 with Manager",
    meetingLink: "https://meet.example.com/oneonone",
    reminder: false,
  },
  {
    id: "e4",
    time: "16:00",
    endTime: "17:00",
    title: "Focus block - Code",
    location: "No meetings",
    reminder: true,
  },
];

export const WEEK_EVENTS: CalendarEvent[] = [
  ...CALENDAR_EVENTS,
  {
    id: "e5",
    time: "10:00",
    endTime: "11:00",
    title: "Sprint Planning",
    meetingLink: "https://meet.example.com/sprint",
    reminder: true,
  },
  {
    id: "e6",
    time: "13:00",
    endTime: "14:00",
    title: "Client Sync Call",
    meetingLink: "https://meet.example.com/client",
    reminder: true,
  },
  {
    id: "e7",
    time: "15:30",
    endTime: "16:00",
    title: "Team Retro",
    meetingLink: "https://meet.example.com/retro",
    reminder: false,
  },
];

function daysAgo(n: number): string {
  const d = new Date();
  d.setDate(d.getDate() - n);
  const yyyy = d.getFullYear();
  const mm = String(d.getMonth() + 1).padStart(2, "0");
  const dd = String(d.getDate()).padStart(2, "0");
  return `${yyyy}-${mm}-${dd}`;
}

export const LOG_DAYS: DayLog[] = [
  {
    date: daysAgo(0),
    label: "Today",
    entries: [
      { id: "l1", title: "Morning standup with team", type: "meeting" },
      { id: "l2", title: "Review pull request #214", type: "task" },
      { id: "l3", title: "Focus block - Code", type: "focus" },
    ],
  },
  {
    date: daysAgo(1),
    label: "Yesterday",
    entries: [
      { id: "l4", title: "Refactor auth module", type: "task" },
      { id: "l5", title: "Design review — dashboard", type: "meeting" },
      { id: "l6", title: "Write unit tests", type: "task" },
      { id: "l7", title: "Focus block - docs", type: "focus" },
    ],
  },
  {
    date: daysAgo(2),
    label: "2 days ago",
    entries: [
      { id: "l8", title: "Update API endpoints", type: "task" },
      { id: "l9", title: "Standup", type: "meeting" },
    ],
  },
  {
    date: daysAgo(3),
    label: "3 days ago",
    entries: [
      { id: "l10", title: "Fix mobile layout bugs", type: "task" },
      { id: "l11", title: "Focus block - deep work", type: "focus" },
      { id: "l12", title: "Client email follow-up", type: "task" },
    ],
  },
  {
    date: daysAgo(4),
    label: "4 days ago",
    entries: [
      { id: "l13", title: "Sprint planning", type: "meeting" },
      { id: "l14", title: "Research new libraries", type: "task" },
    ],
  },
];

export function formatTodayHeader(): string {
  return new Intl.DateTimeFormat(undefined, {
    weekday: "long",
    month: "long",
    day: "numeric",
  }).format(new Date());
}
