"use client";

import { BottomNav } from "@/components/layout/BottomNav";

export function MobileShell({ children }: { children: React.ReactNode }) {
  return (
    <div className="w-full bg-[var(--bg)] text-[var(--text)] sm:min-h-screen sm:flex sm:items-stretch sm:justify-center sm:bg-[var(--border)]">
      <div className="relative flex h-[100svh] w-full max-w-[430px] flex-col overflow-hidden bg-[var(--bg)] sm:my-0 sm:h-[100svh] sm:shadow-2xl sm:ring-1 sm:ring-black/10 [box-shadow:0_0_0_1px_var(--border)]">
        <div className="relative flex-1 overflow-y-auto">
          {children}
        </div>
        <BottomNav />
      </div>
    </div>
  );
}
