import type {
  Project,
  Task,
  Team,
  User,
  WeekPlan,
  WorkLog,
} from "@/lib/data/types";

export const USERS: User[] = [
  {
    id: "u-admin",
    name: "Alex Morgan",
    email: "admin@dayly.com",
    role: "admin",
    teamId: null,
    avatarColor: "#ef4444",
    initials: "AM",
    isTester: false,
  },
  {
    id: "u-pm1",
    name: "Sara Chen",
    email: "sara@dayly.com",
    role: "manager",
    teamId: "team-frontend",
    avatarColor: "#007acc",
    initials: "SC",
    isTester: false,
  },
  {
    id: "u-pm2",
    name: "David Okafor",
    email: "david@dayly.com",
    role: "manager",
    teamId: "team-backend",
    avatarColor: "#2aa198",
    initials: "DO",
    isTester: false,
  },
  {
    id: "u-dev1",
    name: "Priya Sharma",
    email: "priya@dayly.com",
    role: "employee",
    teamId: "team-frontend",
    avatarColor: "#8a63d2",
    initials: "PS",
    isTester: false,
  },
  {
    id: "u-dev2",
    name: "Leo Martins",
    email: "leo@dayly.com",
    role: "employee",
    teamId: "team-frontend",
    avatarColor: "#fe8019",
    initials: "LM",
    isTester: false,
  },
  {
    id: "u-dev3",
    name: "Nina Patel",
    email: "nina@dayly.com",
    role: "employee",
    teamId: "team-backend",
    avatarColor: "#b8bb26",
    initials: "NP",
    isTester: true,
  },
  {
    id: "u-dev4",
    name: "Omar Haddad",
    email: "omar@dayly.com",
    role: "employee",
    teamId: "team-backend",
    avatarColor: "#f6b93b",
    initials: "OH",
    isTester: true,
  },
];

export const TEAMS: Team[] = [
  { id: "team-frontend", name: "Frontend", managerId: "u-pm1", memberIds: ["u-dev1", "u-dev2"] },
  { id: "team-backend", name: "Backend", managerId: "u-pm2", memberIds: ["u-dev3", "u-dev4"] },
];

export const PROJECTS: Project[] = [
  {
    id: "p-web",
    name: "Web App Redesign",
    color: "#007acc",
    managerId: "u-pm1",
    memberIds: ["u-dev1", "u-dev2", "u-dev3"],
    description: "Complete redesign of dayly web dashboard with new design system, responsive layouts, and QA-gated delivery.",
    client: { name: "Acme Corp", origin: "USA — San Francisco" },
    documents: [
      { id: "d1", name: "PRD — Web Redesign v2.pdf" },
      { id: "d2", name: "Figma — Design System" },
      { id: "d3", name: "Brand Guidelines" },
    ],
    flow: "Discovery → Wireframes → Design System → Frontend build → QA → UAT → Launch",
    clientProvided: ["Old codebase access", "Brand assets & logo pack", "User research report"],
    delivery: { startDate: isoDaysAgo(14), endDate: isoDaysAgo(-28), approvedHours: 160, weeklyHours: 40 },
    weeklyPlans: [
      { week: 1, startDate: isoDaysAgo(14), endDate: isoDaysAgo(8), plannedHours: 40, goals: ["Setup project & design system"] },
      { week: 2, startDate: isoDaysAgo(7), endDate: isoDaysAgo(1), plannedHours: 40, goals: ["Build landing & auth flows"] },
      { week: 3, startDate: isoDaysAgo(0), endDate: isoDaysAgo(-6), plannedHours: 40, goals: ["QA & responsive polish"] },
      { week: 4, startDate: isoDaysAgo(-7), endDate: isoDaysAgo(-13), plannedHours: 40, goals: ["UAT & launch"] },
    ],
    teamSpec: { frontendIds: ["u-dev1", "u-dev2"], backendIds: ["u-dev3"], coordinatorId: "u-pm1" },
    timeline: [
      { id: "tl1", module: "Design System", feature: "Tokens & component library", estimatedHours: 24, estimatedDays: 3, status: "done" },
      { id: "tl2", module: "Landing", feature: "New header & hero", estimatedHours: 16, estimatedDays: 2, status: "in_progress", assigneeId: "u-dev1" },
      { id: "tl3", module: "Mobile Nav", feature: "Responsive navigation fix", estimatedHours: 12, estimatedDays: 1.5, status: "planned" },
    ],
  },
  {
    id: "p-api",
    name: "API Platform",
    color: "#2aa198",
    managerId: "u-pm2",
    memberIds: ["u-dev3", "u-dev4"],
    description: "Backend API platform for task logging, auth and integrations.",
    client: { name: "Northwind Labs", origin: "Germany — Berlin" },
    documents: [{ id: "d4", name: "API Spec — OpenAPI.yaml" }],
    flow: "Spec → DB schema → Endpoints → Auth → Testing → Deploy",
    clientProvided: ["Legacy API docs", "DB dump"],
    delivery: { startDate: isoDaysAgo(20), endDate: isoDaysAgo(-20), approvedHours: 200, weeklyHours: 35 },
    weeklyPlans: [
      { week: 1, startDate: isoDaysAgo(20), endDate: isoDaysAgo(14), plannedHours: 35, goals: ["DB modeling & auth"] },
      { week: 2, startDate: isoDaysAgo(13), endDate: isoDaysAgo(7), plannedHours: 35, goals: ["Task & logging endpoints"] },
      { week: 3, startDate: isoDaysAgo(6), endDate: isoDaysAgo(0), plannedHours: 35, goals: ["Integrations & tests"] },
    ],
    teamSpec: { frontendIds: [], backendIds: ["u-dev3", "u-dev4"], coordinatorId: "u-pm2" },
    timeline: [
      { id: "tl4", module: "Auth", feature: "JWT login & session", estimatedHours: 20, estimatedDays: 2.5, status: "done" },
      { id: "tl5", module: "Tasks API", feature: "CRUD + work-hour logging", estimatedHours: 32, estimatedDays: 4, status: "in_progress", assigneeId: "u-dev3" },
      { id: "tl6", module: "CI", feature: "Pipeline & deploy", estimatedHours: 14, estimatedDays: 2, status: "planned" },
    ],
  },
  {
    id: "p-mobile",
    name: "Mobile App",
    color: "#8a63d2",
    managerId: "u-pm1",
    memberIds: ["u-dev1", "u-dev2", "u-dev4"],
    description: "React Native companion app with offline-first task capture.",
    client: { name: "Sakura Co.", origin: "Japan — Tokyo" },
    documents: [{ id: "d5", name: "Mobile PRD.pdf" }, { id: "d6", name: "UI Kit — Mobile.fig" }],
    flow: "Research → Prototyping → Build → Device testing → Release",
    clientProvided: ["iOS TestFlight access", "Icon set"],
    delivery: { startDate: isoDaysAgo(10), endDate: isoDaysAgo(-10), approvedHours: 120, weeklyHours: 30 },
    weeklyPlans: [
      { week: 1, startDate: isoDaysAgo(10), endDate: isoDaysAgo(4), plannedHours: 30, goals: ["Shell & navigation"] },
      { week: 2, startDate: isoDaysAgo(3), endDate: isoDaysAgo(-3), plannedHours: 30, goals: ["Task sync & logging"] },
    ],
    teamSpec: { frontendIds: ["u-dev1", "u-dev2"], backendIds: ["u-dev4"], coordinatorId: "u-pm1" },
    timeline: [
      { id: "tl7", module: "Onboarding", feature: "Checklist flow", estimatedHours: 18, estimatedDays: 2, status: "done" },
      { id: "tl8", module: "Sync", feature: "Offline queue & sync", estimatedHours: 24, estimatedDays: 3, status: "planned" },
    ],
  },
];

function isoDaysAgo(n: number): string {
  const d = new Date();
  d.setDate(d.getDate() - n);
  const yyyy = d.getFullYear();
  const mm = String(d.getMonth() + 1).padStart(2, "0");
  const dd = String(d.getDate()).padStart(2, "0");
  return `${yyyy}-${mm}-${dd}`;
}

const today = isoDaysAgo(0);

export const INITIAL_TASKS: Task[] = [
  { id: "t1", ticketId: "TS-01", title: "Design new landing header", source: "Assigned", status: "in_testing", projectId: "p-web", assigneeId: "u-dev3", createdById: "u-pm1", dueDate: today, createdAt: isoDaysAgo(3), kind: "feature", module: "Landing", estimatedHours: 16 },
  { id: "t2", ticketId: "TS-02", title: "Implement auth flow UI", source: "Manual", status: "ready_for_testing", projectId: "p-web", assigneeId: "u-dev1", createdById: "u-dev1", dueDate: today, createdAt: isoDaysAgo(1), kind: "feature", module: "Auth", estimatedHours: 12 },
  { id: "t3", ticketId: "TS-03", title: "Fix responsive navigation", source: "Assigned", status: "in_progress", projectId: "p-mobile", assigneeId: "u-dev2", createdById: "u-pm1", dueDate: isoDaysAgo(1), createdAt: isoDaysAgo(2), kind: "bug", module: "Mobile Nav", estimatedHours: 6 },
  { id: "t4", ticketId: "TS-04", title: "Build task work-hour logging API", source: "Assigned", status: "done", projectId: "p-api", assigneeId: "u-dev3", createdById: "u-pm2", dueDate: isoDaysAgo(1), createdAt: isoDaysAgo(5), kind: "feature", module: "Tasks API", estimatedHours: 20 },
  { id: "t5", ticketId: "TS-05", title: "Refactor database queries", source: "Manual", status: "in_progress", projectId: "p-api", assigneeId: "u-dev3", createdById: "u-dev3", dueDate: today, createdAt: isoDaysAgo(2), kind: "improvement", module: "Tasks API", estimatedHours: 10 },
  { id: "t6", ticketId: "TS-06", title: "Write integration tests", source: "Assigned", status: "todo", projectId: "p-api", assigneeId: "u-dev4", createdById: "u-pm2", dueDate: isoDaysAgo(2), createdAt: isoDaysAgo(4), kind: "task", module: "CI", estimatedHours: 8 },
  { id: "t7", ticketId: "TS-07", title: "Set up CI pipeline", source: "Assigned", status: "failed", projectId: "p-api", assigneeId: "u-dev4", createdById: "u-pm2", dueDate: isoDaysAgo(3), createdAt: isoDaysAgo(6), kind: "rnd", module: "CI", estimatedHours: 14 },
  { id: "t8", ticketId: "TS-08", title: "Onboarding checklist flow", source: "Manual", status: "done", projectId: "p-mobile", assigneeId: "u-dev1", createdById: "u-dev1", dueDate: isoDaysAgo(2), createdAt: isoDaysAgo(4), kind: "feature", module: "Onboarding", estimatedHours: 18 },
];

export const INITIAL_WORK_LOGS: WorkLog[] = [
  { id: "w1", taskId: "t1", userId: "u-dev1", hours: 2, date: isoDaysAgo(1), note: "Header layout" },
  { id: "w2", taskId: "t1", userId: "u-dev1", hours: 3, date: today, note: "Responsive pass" },
  { id: "w3", taskId: "t4", userId: "u-dev3", hours: 4, date: isoDaysAgo(2) },
  { id: "w4", taskId: "t5", userId: "u-dev3", hours: 3.5, date: isoDaysAgo(1) },
  { id: "w5", taskId: "t5", userId: "u-dev3", hours: 2, date: today },
  { id: "w6", taskId: "t7", userId: "u-dev4", hours: 5, date: isoDaysAgo(3) },
  { id: "w7", taskId: "t6", userId: "u-dev4", hours: 1.5, date: isoDaysAgo(1) },
];

function isoMondayAgo(weeksAgo: number): string {
  const d = new Date();
  const day = d.getDay();
  const diff = (d.getDay() + 6) % 7; // days since Monday
  d.setDate(d.getDate() - diff - weeksAgo * 7);
  const yyyy = d.getFullYear();
  const mm = String(d.getMonth() + 1).padStart(2, "0");
  const dd = String(d.getDate()).padStart(2, "0");
  return `${yyyy}-${mm}-${dd}`;
}

export const INITIAL_WEEK_PLANS: WeekPlan[] = [
  {
    id: "wp-f1",
    weekStart: isoMondayAgo(0),
    ownerId: "u-pm1",
    goals: [
      { id: "g1", text: "Ship landing page redesign" },
      { id: "g2", text: "Onboard 1 new frontend dev" },
      { id: "g3", text: "Complete mobile nav fixes" },
    ],
    createdAt: isoDaysAgo(6),
  },
  {
    id: "wp-b1",
    weekStart: isoMondayAgo(0),
    ownerId: "u-pm2",
    goals: [
      { id: "g4", text: "Launch task logging API" },
      { id: "g5", text: "Refactor slow DB queries" },
    ],
    createdAt: isoDaysAgo(6),
  },
];

/** Simple login you can only reach via the auth form or by admin-assigned accounts. */
export function findUserByEmail(email: string): User | undefined {
  return USERS.find((u) => u.email.toLowerCase() === email.trim().toLowerCase());
}

export function daysBack(n: number): string {
  return isoDaysAgo(n);
}
