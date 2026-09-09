"use client";

import { useEffect } from "react";
import { usePathname, useRouter } from "next/navigation";
import { useAuth } from "@/lib/auth";
import { MobileShell } from "@/components/layout/MobileShell";

export function AppShell({ children }: { children: React.ReactNode }) {
  const pathname = usePathname();
  const router = useRouter();
  const { user } = useAuth();
  const isAuth = pathname === "/auth";

  useEffect(() => {
    if (isAuth) {
      // already logged in — skip login screen
      if (user) router.replace("/dashboard");
    } else {
      // protect app routes
      if (!user) router.replace("/auth");
    }
  }, [user, isAuth, router]);

  if (isAuth) {
    return (
      <div className="min-h-screen bg-[var(--bg)] text-[var(--text)]">
        {children}
      </div>
    );
  }

  if (!user) {
    // redirecting to /auth — render nothing to avoid flashing app shell
    return (
      <div className="min-h-screen bg-[var(--bg)]" />
    );
  }

  return <MobileShell>{children}</MobileShell>;
}
