"use client";

import { useEffect } from "react";
import { useRouter } from "next/navigation";
import { motion } from "framer-motion";
import { Lock, Shield, UserCog } from "lucide-react";
import { Header } from "@/components/layout/Header";
import { useAuth } from "@/lib/auth";
import { useData } from "@/lib/data/store";
import { useIsAdmin, useCan } from "@/lib/permissions";
import type { Role } from "@/lib/data/types";

const ROLE_OPTIONS: { value: Role; label: string }[] = [
  { value: "admin", label: "Admin" },
  { value: "manager", label: "Manager" },
  { value: "employee", label: "Developer" },
];

export default function AdminPage() {
  const router = useRouter();
  const isAdmin = useIsAdmin();
  const can = useCan();
  const { users, assignRole, setTester } = useAuth();
  const { tasks, workLogs } = useData();

  useEffect(() => {
    if (!isAdmin) router.replace("/dashboard");
  }, [isAdmin, router]);

  if (!isAdmin) {
    return (
      <div className="flex h-full flex-col">
        <Header title="Admin" subtitle="Access control" actionIcon={UserCog} />
        <div className="flex flex-1 flex-col items-center justify-center px-6 text-center">
          <div className="mb-4 flex h-16 w-16 items-center justify-center rounded-full bg-[var(--danger)]/15">
            <Lock size={28} className="text-[var(--danger)]" />
          </div>
          <h3 className="text-lg font-bold text-[var(--text)]">Restricted</h3>
          <p className="mt-1 text-sm text-[var(--text-muted)]">
            Only the admin can manage users, roles, and access.
          </p>
        </div>
      </div>
    );
  }

  return (
    <div className="flex h-full flex-col">
      <Header title="Admin" subtitle="Users, roles & control" actionIcon={Shield} />

      <div className="flex-1 space-y-5 overflow-y-auto px-4 py-4 pb-28">
        {/* Overview */}
        <div className="grid grid-cols-3 gap-3">
          {[
            { label: "Users", value: users.length },
            { label: "Tasks", value: tasks.length },
            { label: "Hours logged", value: workLogs.reduce((s, l) => s + l.hours, 0).toFixed(0) },
          ].map((s, i) => (
            <motion.div
              key={s.label}
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.3, delay: i * 0.06 }}
              className="rounded-2xl border border-[var(--border)] bg-[var(--surface)] p-3 text-center shadow-sm"
            >
              <p className="text-xl font-bold text-[var(--text)]">{s.value}</p>
              <p className="text-xs text-[var(--text-muted)]">{s.label}</p>
            </motion.div>
          ))}
        </div>

        {/* User management */}
        <section>
          <div className="mb-2 flex items-center gap-2 px-1">
            <UserCog size={17} className="text-[var(--accent)]" />
            <h2 className="text-sm font-semibold text-[var(--text-muted)]">
              Manage users — assign roles &amp; control
            </h2>
          </div>

          <div className="space-y-2.5">
            {users.map((u, i) => {
              const userTasks = tasks.filter(
                (t) => t.assigneeId === u.id || t.createdById === u.id
              );
              const userHours = workLogs
                .filter((l) => l.userId === u.id)
                .reduce((s, l) => s + l.hours, 0);
              return (
                <motion.div
                  key={u.id}
                  initial={{ opacity: 0, y: 10 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ duration: 0.3, delay: i * 0.03 }}
                  className="rounded-2xl border border-[var(--border)] bg-[var(--surface)] p-3.5 shadow-sm"
                >
                  <div className="flex items-center gap-3">
                    <div
                      className="flex h-10 w-10 shrink-0 items-center justify-center rounded-full text-sm font-bold text-white"
                      style={{ background: u.avatarColor }}
                    >
                      {u.initials}
                    </div>
                    <div className="min-w-0 flex-1">
                      <p className="truncate text-sm font-bold text-[var(--text)]">
                        {u.name}
                      </p>
                      <p className="truncate text-xs text-[var(--text-muted)]">
                        {u.email} · {userTasks.length} tasks · {userHours}h logged
                      </p>
                    </div>
                  </div>

                  <div className="mt-3 flex items-center justify-between gap-3">
                    <span className="text-xs font-medium text-[var(--text-muted)]">
                      Role
                    </span>
                    <div className="flex gap-1.5">
                      {ROLE_OPTIONS.map((r) => {
                        const active = u.role === r.value;
                        return (
                          <button
                            key={r.value}
                            onClick={() => assignRole(u.id, r.value)}
                            className={`rounded-lg px-3 py-1.5 text-xs font-semibold transition-colors ${
                              active
                                ? "bg-[var(--accent)] text-white"
                                : "bg-[var(--surface-2)] text-[var(--text-muted)]"
                            }`}
                          >
                            {r.label}
                          </button>
                        );
                      })}
                    </div>
                  </div>

                  <p className="mt-2 text-[11px] text-[var(--text-muted)]">
                    Permission scope:{" "}
                    {roleScope(u.role)}
                  </p>

                  {u.role === "employee" ? (
                    <div className="mt-2 flex items-center justify-between gap-3 border-t border-[var(--border)] pt-2">
                      <span className="text-xs font-medium text-[var(--text-muted)]">
                        Testing duties
                      </span>
                      <button
                        onClick={() => setTester(u.id, !u.isTester)}
                        className={`relative h-6 w-11 shrink-0 rounded-full transition-colors ${
                          u.isTester ? "bg-violet-500" : "bg-[var(--surface-2)]"
                        }`}
                        aria-pressed={u.isTester}
                        aria-label={`Toggle QA for ${u.name}`}
                      >
                        <span
                          className={`absolute top-0.5 h-5 w-5 rounded-full bg-white shadow transition-transform ${
                            u.isTester ? "translate-x-[22px]" : "translate-x-0.5"
                          }`}
                        />
                      </button>
                      <span
                        className={`text-xs font-semibold ${
                          u.isTester ? "text-violet-500" : "text-[var(--text-muted)]"
                        }`}
                      >
                        {u.isTester ? "QA engineer" : "Developer"}
                      </span>
                    </div>
                  ) : null}
                </motion.div>
              );
            })}
          </div>
        </section>

        <p className="px-1 text-center text-[11px] text-[var(--text-muted)]">
          {can.canManageUsers
            ? "You have full control over every account."
            : "Admin access required."}
        </p>
      </div>
    </div>
  );
}

function roleScope(role: Role): string {
  switch (role) {
    case "admin":
      return "Sees & controls everything across all users and projects.";
    case "manager":
      return "Creates/assigns tasks, plans the week, tracks team progress.";
    case "employee":
      return "Creates tasks, assigns to self/team, logs hours on own tasks.";
  }
}
