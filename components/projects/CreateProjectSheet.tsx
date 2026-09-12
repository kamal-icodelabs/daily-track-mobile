"use client";

import { useMemo, useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { Clock, FileText, Layers, Plus, ShieldCheck, Trash2, Users, X, Zap } from "lucide-react";
import { useAuth } from "@/lib/auth";
import { PickerDropdown } from "@/components/layout/PickerDropdown";

const COLORS = ["#4f46e5", "#007acc", "#2aa198", "#8a63d2", "#ef4444", "#f59e0b", "#10b981", "#ec4899"];

interface TimelineDraft {
  module: string;
  feature: string;
  estimatedHours: string;
  estimatedDays: string;
}

interface CreateProjectSheetProps {
  open: boolean;
  onClose: () => void;
  onCreate: (input: {
    name: string;
    color?: string;
    description?: string;
    clientName?: string;
    clientOrigin?: string;
    documents?: string[];
    flow?: string;
    clientProvided?: string[];
    startDate?: string | null;
    endDate?: string | null;
    approvedHours?: number;
    weeklyHours?: number;
    weeklyGoals?: string[][];
    frontendIds?: string[];
    backendIds?: string[];
    coordinatorId?: string | null;
    timeline?: { module: string; feature: string; estimatedHours: number; estimatedDays: number }[];
  }) => void;
}

export function CreateProjectSheet({ open, onClose, onCreate }: CreateProjectSheetProps) {
  const { users } = useAuth();

  // Section 1: Project detail
  const [name, setName] = useState("");
  const [color, setColor] = useState(COLORS[0]);
  const [description, setDescription] = useState("");
  const [clientName, setClientName] = useState("");
  const [clientOrigin, setClientOrigin] = useState("");
  const [docs, setDocs] = useState<string[]>([""]);
  const [flow, setFlow] = useState("");
  const [clientProvided, setClientProvided] = useState<string[]>([""]);

  // Section 2: Delivery
  const [startDate, setStartDate] = useState("");
  const [endDate, setEndDate] = useState("");
  const [approvedHours, setApprovedHours] = useState("");
  const [weeklyHours, setWeeklyHours] = useState("");
  const [perWeekPlan, setPerWeekPlan] = useState("");

  // Section 3: Team
  const [frontendIds, setFrontendIds] = useState<string[]>([]);
  const [backendIds, setBackendIds] = useState<string[]>([]);
  const [coordinatorId, setCoordinatorId] = useState("");

  // Section 4: Timeline
  const [timeline, setTimeline] = useState<TimelineDraft[]>([
    { module: "", feature: "", estimatedHours: "", estimatedDays: "" },
  ]);

  const employees = useMemo(() => users.filter((u) => u.role === "employee"), [users]);
  const allUsers = users;

  const toggleMulti = (id: string, list: string[], setter: (v: string[]) => void) => {
    setter(list.includes(id) ? list.filter((x) => x !== id) : [...list, id]);
  };

  const parseWeeklyGoals = (): string[][] | undefined => {
    if (!perWeekPlan.trim()) return undefined;
    return perWeekPlan
      .split("\n")
      .map((line) => line.split(",").map((s) => s.trim()).filter(Boolean))
      .filter((arr) => arr.length > 0);
  };

  const handleCreate = () => {
    const trimmed = name.trim();
    if (!trimmed) return;
    const docsClean = docs.map((d) => d.trim()).filter(Boolean);
    const providedClean = clientProvided.map((s) => s.trim()).filter(Boolean);
    const timelineClean = timeline
      .filter((t) => t.module.trim() && t.feature.trim())
      .map((t) => ({
        module: t.module.trim(),
        feature: t.feature.trim(),
        estimatedHours: parseFloat(t.estimatedHours) || 0,
        estimatedDays: parseFloat(t.estimatedDays) || 0,
      }));

    onCreate({
      name: trimmed,
      color,
      description: description.trim() || undefined,
      clientName: clientName.trim() || undefined,
      clientOrigin: clientOrigin.trim() || undefined,
      documents: docsClean,
      flow: flow.trim() || undefined,
      clientProvided: providedClean,
      startDate: startDate || null,
      endDate: endDate || null,
      approvedHours: approvedHours ? parseFloat(approvedHours) : undefined,
      weeklyHours: weeklyHours ? parseFloat(weeklyHours) : undefined,
      weeklyGoals: parseWeeklyGoals(),
      frontendIds,
      backendIds,
      coordinatorId: coordinatorId || null,
      timeline: timelineClean,
    });
    // reset
    setName(""); setColor(COLORS[0]); setDescription(""); setClientName(""); setClientOrigin("");
    setDocs([""]); setFlow(""); setClientProvided([""]);
    setStartDate(""); setEndDate(""); setApprovedHours(""); setWeeklyHours(""); setPerWeekPlan("");
    setFrontendIds([]); setBackendIds([]); setCoordinatorId("");
    setTimeline([{ module: "", feature: "", estimatedHours: "", estimatedDays: "" }]);
    onClose();
  };

  const inputCls =
    "w-full rounded-xl border border-[var(--border)] bg-[var(--surface-2)] px-3 py-2.5 text-sm text-[var(--text)] placeholder:text-[var(--text-muted)]/60 focus:border-[var(--accent)] focus:outline-none focus:ring-2 focus:ring-[var(--accent-soft)]";
  const labelCls = "mb-1.5 block text-xs font-semibold text-[var(--text-muted)]";

  return (
    <AnimatePresence>
      {open ? (
        <motion.div
          key="create-project-sheet"
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          transition={{ duration: 0.22 }}
          className="fixed inset-0 z-40 flex items-end justify-center sm:items-center"
        >
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            transition={{ duration: 0.32, ease: [0.22, 1, 0.36, 1] }}
            className="absolute inset-0 bg-black/50"
            onClick={onClose}
          />
          <motion.div
            initial={{ y: "100%" }}
            animate={{ y: "0%" }}
            exit={{ y: "100%" }}
            transition={{
              type: "spring",
              damping: 30,
              stiffness: 300,
              mass: 0.9,
              duration: 0.42,
            }}
            className="relative z-10 flex max-h-[92svh] w-full max-w-[430px] flex-col overflow-hidden rounded-t-3xl border border-b-0 border-[var(--border)] bg-[var(--surface)] sm:rounded-3xl sm:border-b"
          >
        <div className="shrink-0 border-b border-[var(--border)] px-5 pb-3 pt-4">
          <div className="mx-auto mb-3 h-1.5 w-10 rounded-full bg-[var(--border)] sm:hidden" />
          <div className="flex items-center justify-between">
            <h2 className="text-lg font-bold text-[var(--text)]">New project</h2>
            <button onClick={onClose} aria-label="Close" className="flex h-9 w-9 items-center justify-center rounded-xl text-[var(--text-muted)] active:bg-[var(--surface-2)]">
              <X size={20} />
            </button>
          </div>
          <p className="mt-1 text-xs text-[var(--text-muted)]">Admin & PM only — all sections optional except name.</p>
        </div>

        <div className="flex-1 space-y-6 overflow-y-auto px-5 py-4">
          {/* 1. Project detail */}
          <section>
            <div className="mb-2 flex items-center gap-2 text-sm font-bold text-[var(--text)]">
              <FileText size={16} className="text-[var(--accent)]" /> 1. Project detail
            </div>
            <div className="space-y-3">
              <div>
                <label className={labelCls}>Project name *</label>
                <input value={name} onChange={(e) => setName(e.target.value)} placeholder="e.g. Fintech Dashboard" className={inputCls} />
              </div>
              <div>
                <label className={labelCls}>Color</label>
                <div className="flex flex-wrap gap-2">
                  {COLORS.map((c) => (
                    <button
                      key={c}
                      onClick={() => setColor(c)}
                      className={`h-8 w-8 rounded-full border-2 ${color === c ? "border-[var(--text)] scale-110" : "border-transparent"}`}
                      style={{ background: c }}
                      aria-label={c}
                    />
                  ))}
                </div>
              </div>
              <div>
                <label className={labelCls}>Description</label>
                <textarea value={description} onChange={(e) => setDescription(e.target.value)} placeholder="What is this project about?" rows={2} className={inputCls} />
              </div>
              <div className="grid grid-cols-2 gap-2">
                <div>
                  <label className={labelCls}>Client name</label>
                  <input value={clientName} onChange={(e) => setClientName(e.target.value)} placeholder="Acme Corp" className={inputCls} />
                </div>
                <div>
                  <label className={labelCls}>Client origin</label>
                  <input value={clientOrigin} onChange={(e) => setClientOrigin(e.target.value)} placeholder="USA — SF" className={inputCls} />
                </div>
              </div>
              <div>
                <label className={labelCls}>Supported documents</label>
                <div className="space-y-1.5">
                  {docs.map((d, i) => (
                    <div key={i} className="flex gap-1.5">
                      <input value={d} onChange={(e) => setDocs((prev) => prev.map((v, idx) => (idx === i ? e.target.value : v)))} placeholder="PRD.pdf / Figma link" className={inputCls + " flex-1"} />
                      <button onClick={() => setDocs((prev) => prev.filter((_, idx) => idx !== i))} className="flex h-10 w-10 items-center justify-center rounded-xl border border-[var(--border)] text-[var(--text-muted)]">
                        <Trash2 size={14} />
                      </button>
                    </div>
                  ))}
                  <button onClick={() => setDocs((p) => [...p, ""])} className="flex items-center gap-1 text-xs font-semibold text-[var(--accent)]">
                    <Plus size={12} /> Add document
                  </button>
                </div>
              </div>
              <div>
                <label className={labelCls}>Flow</label>
                <textarea value={flow} onChange={(e) => setFlow(e.target.value)} placeholder="Discovery → Design → Build → QA → Launch" rows={2} className={inputCls} />
              </div>
              <div>
                <label className={labelCls}>What client provided</label>
                <div className="space-y-1.5">
                  {clientProvided.map((c, i) => (
                    <div key={i} className="flex gap-1.5">
                      <input value={c} onChange={(e) => setClientProvided((prev) => prev.map((v, idx) => (idx === i ? e.target.value : v)))} placeholder="Old codebase / Assets" className={inputCls + " flex-1"} />
                      <button onClick={() => setClientProvided((prev) => prev.filter((_, idx) => idx !== i))} className="flex h-10 w-10 items-center justify-center rounded-xl border border-[var(--border)] text-[var(--text-muted)]">
                        <Trash2 size={14} />
                      </button>
                    </div>
                  ))}
                  <button onClick={() => setClientProvided((p) => [...p, ""])} className="flex items-center gap-1 text-xs font-semibold text-[var(--accent)]">
                    <Plus size={12} /> Add item
                  </button>
                </div>
              </div>
            </div>
          </section>

          {/* 2. Delivery */}
          <section className="border-t border-[var(--border)] pt-4">
            <div className="mb-2 flex items-center gap-2 text-sm font-bold text-[var(--text)]">
              <Clock size={16} className="text-[var(--accent)]" /> 2. Delivery & time
            </div>
            <div className="space-y-3">
              <div className="grid grid-cols-2 gap-2">
                <div>
                  <label className={labelCls}>Start date</label>
                  <input type="date" value={startDate} onChange={(e) => setStartDate(e.target.value)} className={inputCls} />
                </div>
                <div>
                  <label className={labelCls}>End date</label>
                  <input type="date" value={endDate} onChange={(e) => setEndDate(e.target.value)} className={inputCls} />
                </div>
              </div>
              <div className="grid grid-cols-2 gap-2">
                <div>
                  <label className={labelCls}>Approved hours (client)</label>
                  <input type="number" value={approvedHours} onChange={(e) => setApprovedHours(e.target.value)} placeholder="e.g. 160" className={inputCls} />
                </div>
                <div>
                  <label className={labelCls}>Hours / week</label>
                  <input type="number" value={weeklyHours} onChange={(e) => setWeeklyHours(e.target.value)} placeholder="e.g. 40" className={inputCls} />
                </div>
              </div>
              <div>
                <label className={labelCls}>Per week plan (one line per week, comma-separated goals)</label>
                <textarea value={perWeekPlan} onChange={(e) => setPerWeekPlan(e.target.value)} placeholder={"Week 1: Setup, Design system\nWeek 2: Build landing, Auth"} rows={3} className={inputCls} />
                <p className="mt-1 text-[11px] text-[var(--text-muted)]">Example: &quot;Setup project, Design tokens&quot; on line 1 → week 1 goals.</p>
              </div>
            </div>
          </section>

          {/* 3. Team */}
          <section className="border-t border-[var(--border)] pt-4">
            <div className="mb-2 flex items-center gap-2 text-sm font-bold text-[var(--text)]">
              <Users size={16} className="text-[var(--accent)]" /> 3. Who will work
            </div>
            <div className="space-y-3">
              <div>
                <label className={labelCls}>Frontend</label>
                <div className="flex flex-wrap gap-1.5">
                  {employees.map((u) => (
                    <button
                      key={u.id}
                      onClick={() => toggleMulti(u.id, frontendIds, setFrontendIds)}
                      className={`rounded-full px-3 py-1.5 text-xs font-medium border ${frontendIds.includes(u.id) ? "bg-[var(--accent)] text-white border-[var(--accent)]" : "bg-[var(--surface-2)] text-[var(--text-muted)] border-[var(--border)]"}`}
                    >
                      {u.name}
                    </button>
                  ))}
                  {employees.length === 0 ? <span className="text-xs text-[var(--text-muted)]">No employees</span> : null}
                </div>
              </div>
              <div>
                <label className={labelCls}>Backend</label>
                <div className="flex flex-wrap gap-1.5">
                  {employees.map((u) => (
                    <button
                      key={u.id}
                      onClick={() => toggleMulti(u.id, backendIds, setBackendIds)}
                      className={`rounded-full px-3 py-1.5 text-xs font-medium border ${backendIds.includes(u.id) ? "bg-[var(--accent)] text-white border-[var(--accent)]" : "bg-[var(--surface-2)] text-[var(--text-muted)] border-[var(--border)]"}`}
                    >
                      {u.name}
                    </button>
                  ))}
                </div>
              </div>
              <div>
                <label className={labelCls}>Coordinator — senior (code review & GitHub merge, full access)</label>
                <PickerDropdown
                  label="Coordinator"
                  value={coordinatorId || "__none"}
                  onChange={(v) => setCoordinatorId(v === "__none" ? "" : v)}
                  icon={<ShieldCheck size={13} />}
                  placeholder="No coordinator"
                  options={[
                    { value: "__none", label: "No coordinator" },
                    ...allUsers.map((u) => ({
                      value: u.id,
                      label: `${u.name} · ${u.role === "admin" ? "Admin" : u.role === "manager" ? "PM" : u.isTester ? "QA" : "Dev"}`,
                    })),
                  ]}
                />
                <p className="mt-1 text-[11px] text-[var(--text-muted)]">Coordinator has access to every file & merges on GitHub.</p>
              </div>
            </div>
          </section>

          {/* 4. Timeline */}
          <section className="border-t border-[var(--border)] pt-4">
            <div className="mb-2 flex items-center gap-2 text-sm font-bold text-[var(--text)]">
              <Layers size={16} className="text-[var(--accent)]" /> 4. Timeline — feature / module
            </div>
            <div className="space-y-2">
              {timeline.map((row, i) => (
                <div key={i} className="rounded-xl border border-[var(--border)] bg-[var(--surface-2)] p-2.5">
                  <div className="grid grid-cols-2 gap-2">
                    <input value={row.module} onChange={(e) => setTimeline((prev) => prev.map((r, idx) => (idx === i ? { ...r, module: e.target.value } : r)))} placeholder="Module (e.g. Auth)" className={inputCls} />
                    <input value={row.feature} onChange={(e) => setTimeline((prev) => prev.map((r, idx) => (idx === i ? { ...r, feature: e.target.value } : r)))} placeholder="Feature (e.g. Login UI)" className={inputCls} />
                  </div>
                  <div className="mt-2 grid grid-cols-[1fr_1fr_auto] gap-2">
                    <input type="number" value={row.estimatedHours} onChange={(e) => setTimeline((prev) => prev.map((r, idx) => (idx === i ? { ...r, estimatedHours: e.target.value } : r)))} placeholder="Hours" className={inputCls} />
                    <input type="number" value={row.estimatedDays} onChange={(e) => setTimeline((prev) => prev.map((r, idx) => (idx === i ? { ...r, estimatedDays: e.target.value } : r)))} placeholder="Days" className={inputCls} />
                    <button onClick={() => setTimeline((prev) => prev.filter((_, idx) => idx !== i))} className="flex h-10 w-10 items-center justify-center rounded-xl border border-[var(--border)] text-[var(--text-muted)]">
                      <Trash2 size={14} />
                    </button>
                  </div>
                </div>
              ))}
              <button onClick={() => setTimeline((p) => [...p, { module: "", feature: "", estimatedHours: "", estimatedDays: "" }])} className="flex items-center gap-1 text-xs font-semibold text-[var(--accent)]">
                <Plus size={12} /> Add milestone
              </button>
            </div>
          </section>
        </div>

        <div className="shrink-0 border-t border-[var(--border)] bg-[var(--surface)] p-4">
          <button
            onClick={handleCreate}
            disabled={!name.trim()}
            className="flex w-full items-center justify-center gap-2 rounded-xl bg-[var(--accent)] py-3.5 text-sm font-semibold text-[var(--bg)] shadow-lg shadow-[var(--accent-soft)] transition-transform active:scale-[0.98] disabled:opacity-40"
          >
            <Zap size={16} />
            Create project
          </button>
        </div>
          </motion.div>
        </motion.div>
      ) : null}
    </AnimatePresence>
  );
}
