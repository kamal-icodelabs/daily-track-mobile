"use client";

import { CheckCircle2, Clock, Home, CalendarX, XCircle } from "lucide-react";
import { PickerDropdown } from "@/components/layout/PickerDropdown";
import { DAILY_STATUS_META, type DailyStatus } from "@/lib/data/types";

const STATUS_ICON: Record<DailyStatus, React.ReactNode> = {
  present: <CheckCircle2 size={13} />,
  wfh: <Home size={13} />,
  absent: <XCircle size={13} />,
  on_leave: <CalendarX size={13} />,
  half_day: <Clock size={13} />,
};

const OPTIONS: { value: DailyStatus; label: string }[] = [
  { value: "present", label: "Present" },
  { value: "wfh", label: "WFH" },
  { value: "absent", label: "Absent" },
  { value: "on_leave", label: "On Leave" },
  { value: "half_day", label: "Half Day" },
];

export function DailyStatusPicker({
  value,
  onChange,
  label = "Today's status",
}: {
  value: DailyStatus | null;
  onChange: (v: DailyStatus) => void;
  label?: string;
}) {
  return (
    <PickerDropdown
      label={label}
      value={(value ?? "present") as string}
      onChange={(v) => onChange(v as DailyStatus)}
      icon={value ? STATUS_ICON[value as DailyStatus] : <CheckCircle2 size={13} />}
      placeholder="Select status"
      options={OPTIONS.map((o) => ({
        value: o.value,
        label: o.label,
        icon: STATUS_ICON[o.value],
      }))}
    />
  );
}

export function DailyStatusBadge({ status }: { status: DailyStatus | null }) {
  if (!status) return null;
  const meta = DAILY_STATUS_META[status];
  return (
    <span className={`inline-flex items-center gap-1 rounded-full px-2 py-0.5 text-[11px] font-semibold ${meta.bg}`}>
      <span className={`h-2 w-2 rounded-full ${meta.dot}`} />
      {meta.label}
    </span>
  );
}

export function DailyStatusIconBadge({ status, showLabel = true }: { status: DailyStatus | null; showLabel?: boolean }) {
  if (!status) return null;
  const meta = DAILY_STATUS_META[status];
  return (
    <span className={`inline-flex items-center gap-1 rounded-full px-2 py-0.5 text-[10px] font-bold ${meta.bg}`}>
      {STATUS_ICON[status]}
      {showLabel ? meta.label : null}
    </span>
  );
}
