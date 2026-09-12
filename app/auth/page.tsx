"use client";

import { useState } from "react";
import { CheckSquare } from "lucide-react";
import { AuthTabs } from "@/components/auth/AuthTabs";
import { LoginForm } from "@/components/auth/LoginForm";
import { SignupForm } from "@/components/auth/SignupForm";

export default function AuthPage() {
  const [mode, setMode] = useState<"login" | "signup">("login");

  return (
    <main className="flex min-h-[100svh] w-full flex-col items-center justify-center bg-[var(--bg)] px-6 py-8 text-[var(--text)]">
      <div className="w-full max-w-sm">
        <div className="mb-8 flex flex-col items-center text-center">
          <div className="mb-3 flex h-14 w-14 items-center justify-center rounded-2xl bg-[var(--accent)] text-[var(--bg)] shadow-lg shadow-[var(--accent-soft)]">
            <CheckSquare size={28} />
          </div>
          <h1 className="text-2xl font-bold">Dayly</h1>
          <p className="mt-1 text-sm text-[var(--text-muted)]">
            Plan your day, log your work.
          </p>
        </div>

        <div className="rounded-3xl border border-[var(--border)] bg-[var(--surface)] p-5 shadow-sm">
          <AuthTabs mode={mode} onChange={setMode} />
          <div key={mode} className="page-enter mt-5">
            {mode === "login" ? <LoginForm /> : <SignupForm />}
          </div>
        </div>

        <p className="mt-6 text-center text-xs text-[var(--text-muted)]">
          Mock UI — no real authentication yet.
        </p>
      </div>
    </main>
  );
}
