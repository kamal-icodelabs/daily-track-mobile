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

export type LogEntryType = "task" | "meeting" | "focus";

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

export interface Project {
  id: string;
  name: string;
  color: string;
  managerId: string;
  /** Users (developers + testers) assigned to work on this project. */
  memberIds: string[];
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
