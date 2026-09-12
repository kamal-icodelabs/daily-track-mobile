export type Role = "admin" | "manager" | "employee";

/**
 * Ticket pipeline:
 * - todo: backlog, not started
 * - in_progress: developer is working
 * - ready_for_testing: developer submitted; can be assigned to a tester
 * - in_testing: tester is working
 * - done: approved by QA
 * - failed: rejected by QA
 *
 * Once a ticket leaves "in_progress" it cannot be dragged backwards;
 * returning to "todo" requires a QA-approved move request with a note.
 */
export type TaskStatus =
  | "todo"
  | "in_progress"
  | "ready_for_testing"
  | "in_testing"
  | "done"
  | "failed";

export type TaskSource = "Manual" | "Assigned";

export type TaskKind = "feature" | "bug" | "issue" | "rnd" | "improvement" | "task";

export const TASK_KINDS: TaskKind[] = ["feature", "bug", "issue", "rnd", "improvement", "task"];

export type TaskKindMeta = { label: string; color: string; bg: string };

export const TASK_KIND_META: Record<TaskKind, TaskKindMeta> = {
  feature: { label: "Feature", color: "#4f46e5", bg: "bg-indigo-500/15 text-indigo-500" },
  bug: { label: "Bug", color: "#ef4444", bg: "bg-red-500/15 text-red-500" },
  issue: { label: "Issue", color: "#f59e0b", bg: "bg-amber-500/15 text-amber-500" },
  rnd: { label: "R&D", color: "#06b6d4", bg: "bg-cyan-500/15 text-cyan-600" },
  improvement: { label: "Improvement", color: "#10b981", bg: "bg-emerald-500/15 text-emerald-600" },
  task: { label: "Task", color: "#6b7280", bg: "bg-[var(--surface-2)] text-[var(--text-muted)]" },
};

export type LogEntryType = "task" | "meeting" | "focus";

export type LeaveStatus = "active" | "on_leave";

export type ProfileKind = "qa" | "designer" | "frontend" | "backend" | "fullstack" | "cloud";

export const PROFILE_META: Record<ProfileKind, { label: string; icon: string; color: string }> = {
  qa: { label: "QA", icon: "Bug", color: "#db2777" },
  designer: { label: "Designer", icon: "Palette", color: "#b45309" },
  frontend: { label: "Frontend", icon: "Code", color: "#2563eb" },
  backend: { label: "Backend", icon: "Server", color: "#16a34a" },
  fullstack: { label: "Fullstack", icon: "Layers", color: "#0d9488" },
  cloud: { label: "Cloud", icon: "Cloud", color: "#0284c7" },
};

export const LEAVE_META: Record<LeaveStatus, { label: string; dot: string }> = {
  active: { label: "Active", dot: "bg-[var(--success)]" },
  on_leave: { label: "On Leave", dot: "bg-amber-500" },
};

export type DailyStatus = "present" | "wfh" | "absent" | "on_leave" | "half_day";

export const DAILY_STATUS_META: Record<DailyStatus, { label: string; bg: string; dot: string }> = {
  present: { label: "Present", bg: "bg-[var(--success)]/15 text-[var(--success)]", dot: "bg-[var(--success)]" },
  wfh: { label: "WFH", bg: "bg-sky-500/15 text-sky-600", dot: "bg-sky-500" },
  absent: { label: "Absent", bg: "bg-[var(--danger)]/15 text-[var(--danger)]", dot: "bg-[var(--danger)]" },
  on_leave: { label: "On Leave", bg: "bg-amber-500/15 text-amber-600", dot: "bg-amber-500" },
  half_day: { label: "Half Day", bg: "bg-violet-500/15 text-violet-500", dot: "bg-violet-500" },
};

export interface DailyStatusEntry {
  userId: string;
  date: string; // ISO yyyy-mm-dd
  status: DailyStatus;
  updatedAt: string;
}

export interface User {
  id: string;
  name: string;
  email: string;
  role: Role;
  teamId: string | null;
  avatarColor: string;
  initials: string;
  /**
   * Tester (QA) flag. Testers share the "employee" role but can move
   * tickets into/out of testing and approve/fail/move-back requests.
   */
  isTester: boolean;
  leaveStatus?: LeaveStatus;
  profile?: ProfileKind;
}

/**
 * A request from a developer to bounce a submitted/in-testing ticket
 * backwards. The QA (or PM) must approve it before the ticket moves.
 */
export interface MoveRequest {
  userId: string; // requester
  note: string; // required reason
  requestedAt: string;
}

/**
 * A single work-hour record attached to a task. This is the
 * per-task time tracking trail the user asked for.
 */
export interface WorkLog {
  id: string;
  taskId: string;
  userId: string;
  hours: number;
  date: string; // ISO yyyy-mm-dd
  note?: string;
}

export interface ClientInfo {
  name: string;
  origin: string; // e.g. "USA — New York" or "India — Bangalore"
}

export interface ProjectDocument {
  id: string;
  name: string;
  url?: string;
}

export interface ProjectTeamSpec {
  frontendIds: string[];
  backendIds: string[];
  coordinatorId: string | null; // senior reviewer / merger with full repo access
}

export interface ProjectDelivery {
  startDate: string | null; // ISO yyyy-mm-dd
  endDate: string | null; // ISO yyyy-mm-dd
  approvedHours: number; // total hours approved by client
  weeklyHours: number; // hours per week planned
}

export interface ProjectWeeklyPlan {
  week: number; // 1-indexed
  startDate: string;
  endDate: string;
  plannedHours: number;
  goals: string[];
}

export interface ProjectTimelineItem {
  id: string;
  module: string;
  feature: string;
  estimatedHours: number;
  estimatedDays: number;
  status: "planned" | "in_progress" | "done";
  assigneeId?: string | null;
}

export interface Project {
  id: string;
  name: string;
  color: string;
  managerId: string;
  /** Users (developers + testers) assigned to work on this project. */
  memberIds: string[];
  // ── Extended spec (optional for backward compat) ──
  description?: string;
  client?: ClientInfo;
  documents?: ProjectDocument[];
  flow?: string; // high-level flow / architecture notes
  clientProvided?: string[]; // bullet list of what client gave us
  delivery?: ProjectDelivery;
  weeklyPlans?: ProjectWeeklyPlan[];
  teamSpec?: ProjectTeamSpec;
  timeline?: ProjectTimelineItem[];
}

export interface Task {
  id: string;
  ticketId: string; // e.g. "TS-01"
  title: string;
  description?: string;
  source: TaskSource;
  status: TaskStatus;
  projectId: string | null;
  assigneeId: string | null;
  createdById: string;
  dueDate: string | null; // ISO yyyy-mm-dd
  createdAt: string;
  /** Classification used for QA/bug stats: rnd, bug, issue, etc. */
  kind: TaskKind;
  /** Optional module link — ties task to a timeline module/feature. */
  module?: string | null;
  /** Estimated hours at creation (optional, for planning vs actual). */
  estimatedHours?: number | null;
  /**
   * Pending QA move-back request. Set by a developer asking to return the
   * ticket to "todo"; cleared when QA/PM approves (moves back) or a new
   * transition happens.
   */
  moveRequest?: MoveRequest;
}

export interface WeekPlanGoal {
  id: string;
  text: string;
}

export interface WeekPlan {
  id: string;
  weekStart: string; // ISO yyyy-mm-dd (Monday)
  ownerId: string;
  goals: WeekPlanGoal[];
  createdAt: string;
}

export interface Team {
  id: string;
  name: string;
  managerId: string;
  memberIds: string[];
}

/**
 * Central permission matrix keyed by role. Every role-aware UI check
 * goes through this so permissions are easy to audit and admin can
 * tweak them.
 */
export interface Permissions {
  canManageUsers: boolean; // assign roles / control accounts (admin only)
  canViewAllData: boolean; // see every user's tasks, logs, hours
  canCreateTask: boolean;
  canAssignTasks: boolean; // manager assigns to anyone; employee assigns self/team
  canPlanWeek: boolean;
  canCreateWeekPlanForTeam: boolean; // manager plan for team
  canSeeOtherHours: boolean; // employee cannot see other employees' hours
  canSeeAllProjects: boolean;
  canManageProjects: boolean;
  /**
   * Developer can move an in-progress ticket to ready_for_testing.
   */
  canSubmitForTesting: boolean;
  /**
   * Can act as QA: take tickets into testing, approve, fail, and approve
   * move-back requests. Employees only get this via the per-user
   * `isTester` flag (checked at the call site).
   */
  canTest: boolean;
  /**
   * Developer can send a move-back request (with note) to QA.
   */
  canRequestMoveBack: boolean;
}

export const ROLE_PERMISSIONS: Record<Role, Permissions> = {
  admin: {
    canManageUsers: true,
    canViewAllData: true,
    canCreateTask: true,
    canAssignTasks: true,
    canPlanWeek: true,
    canCreateWeekPlanForTeam: true,
    canSeeOtherHours: true,
    canSeeAllProjects: true,
    canManageProjects: true,
    canSubmitForTesting: true,
    canTest: true,
    canRequestMoveBack: false,
  },
  manager: {
    canManageUsers: false,
    canViewAllData: false,
    canCreateTask: true,
    canAssignTasks: true,
    canPlanWeek: true,
    canCreateWeekPlanForTeam: true,
    canSeeOtherHours: true,
    canSeeAllProjects: true,
    canManageProjects: true,
    canSubmitForTesting: true,
    canTest: true,
    canRequestMoveBack: false,
  },
  employee: {
    canManageUsers: false,
    canViewAllData: false,
    canCreateTask: true,
    canAssignTasks: true,
    canPlanWeek: false,
    canCreateWeekPlanForTeam: false,
    canSeeOtherHours: false,
    canSeeAllProjects: false,
    canManageProjects: false,
    canSubmitForTesting: true,
    canTest: false, // testers get this via user.isTester at the call site
    canRequestMoveBack: true,
  },
};

/**
 * Adapter interface for 3rd-party integrations. Implementers plug
 * into real APIs later; right now adapters are stubs with a
 * connection status.
 */
export interface Integration {
  id: string;
  name: string;
  description: string;
  icon: string;
  connected: boolean;
  /**
   * Human-readable representative checks performed by the stub.
   */
  capabilities: string[];
}

/**
 * A status/management event for a ticket. This is the audit trail shown to
 * Project Managers: creator, transitions, hours logged, and deletions with
 * their required note.
 */
export type TaskActivityType =
  | "created"
  | "started"
  | "submitted"
  | "in_testing"
  | "completed"
  | "failed"
  | "move_requested"
  | "move_approved"
  | "reopened"
  | "hours"
  | "deleted";

export interface TaskActivity {
  id: string;
  taskId: string;
  taskTitle: string;
  userId: string;
  type: TaskActivityType;
  note?: string;
  hours?: number;
  fromStatus?: TaskStatus;
  toStatus?: TaskStatus;
  createdAt: string;
}

/**
 * Result of a ticket workflow action (start, submit, take into testing,
 * approve, fail, move-back). `ok:false` means the action was blocked,
 * typically for lack of working hours or an invalid transition.
 */
export type ToggleResult =
  | {
      ok: true;
      code:
        | "started"
        | "submitted"
        | "in_testing"
        | "done"
        | "failed"
        | "moved_back"
        | "reopened";
      message: string;
    }
  | { ok: false; code: "hours" | "forbidden" | "notfound"; message: string };

/**
 * Result of deleting a ticket. Employees may only delete tickets they
 * created, and must supply a note; admins/PMs may delete any ticket.
 */
export type DeleteResult =
  | { ok: true; message: string }
  | {
      ok: false;
      code: "forbidden" | "note" | "notfound";
      message: string;
    };
