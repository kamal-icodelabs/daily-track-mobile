"use client";

import { useRouter } from "next/navigation";
import { useState } from "react";
import { Eye, EyeOff, Lock, type LucideIcon, Mail } from "lucide-react";
import { useAuth } from "@/lib/auth";

interface FieldProps {
  label: string;
  type: string;
  placeholder?: string;
  value: string;
  onChange: (v: string) => void;
  icon: LucideIcon;
}

function Field({
  label,
  type,
  placeholder,
  value,
  onChange,
  icon: Icon,
}: FieldProps) {
  const [show, setShow] = useState(false);
  const isPassword = type === "password";
  const effectiveType = isPassword && show ? "text" : type;

  return (
    <label className="block">
      <span className="mb-1.5 block text-sm font-medium text-[var(--text-muted)]">
        {label}
      </span>
      <div className="flex items-center gap-2 rounded-xl border border-[var(--border)] bg-[var(--surface)] px-3 transition-colors focus-within:border-[var(--accent)] focus-within:ring-2 focus-within:ring-[var(--accent-soft)]">
        <Icon size={18} className="shrink-0 text-[var(--text-muted)]" />
        <input
          type={effectiveType}
          value={value}
          onChange={(e) => onChange(e.target.value)}
          placeholder={placeholder}
          className="w-full bg-transparent py-3 text-[var(--text)] placeholder:text-[var(--text-muted)]/60 focus:outline-none"
          autoComplete={isPassword ? "current-password" : "off"}
        />
        {isPassword ? (
          <button
            type="button"
            onClick={() => setShow((s) => !s)}
            className="shrink-0 text-[var(--text-muted)]"
            aria-label={show ? "Hide password" : "Show password"}
          >
            {show ? <EyeOff size={18} /> : <Eye size={18} />}
          </button>
        ) : null}
      </div>
    </label>
  );
}

export function LoginForm() {
  const router = useRouter();
  const { login } = useAuth();
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState<string | null>(null);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    const user = login(email);
    if (!user) {
      setError("No account found for that email.");
      return;
    }
    console.log("Logged in as", user.email, "role:", user.role);
    router.push("/dashboard");
  };

  const quickFill = (demoEmail: string) => {
    setEmail(demoEmail);
    setPassword("demo-password");
    setError(null);
  };

  return (
    <form onSubmit={handleSubmit} className="space-y-4">
      <Field
        label="Email"
        type="email"
        placeholder="you@example.com"
        value={email}
        onChange={setEmail}
        icon={Mail}
      />
      <Field
        label="Password"
        type="password"
        placeholder="••••••••"
        value={password}
        onChange={setPassword}
        icon={Lock}
      />
      {error ? (
        <p className="text-sm font-medium text-[var(--danger)]">{error}</p>
      ) : null}
      <div className="flex justify-end">
        <button
          type="button"
          className="text-sm font-medium text-[var(--accent)] transition-opacity active:opacity-70"
        >
          Forgot password?
        </button>
      </div>
      <button
        type="submit"
        className="w-full rounded-xl bg-[var(--accent)] py-3.5 text-sm font-semibold text-white shadow-lg shadow-[var(--accent-soft)] transition-transform active:scale-[0.98]"
      >
        Login
      </button>

      <div className="rounded-xl bg-[var(--surface-2)] p-3 text-xs text-[var(--text-muted)]">
        <p className="mb-2 font-medium">Demo accounts assigned by admin:</p>
        <div className="flex flex-wrap gap-1.5">
          {[
            ["Admin", "admin@dayly.com"],
            ["Manager", "sara@dayly.com"],
            ["Developer", "priya@dayly.com"],
          ].map(([label, demoEmail]) => (
            <button
              key={demoEmail}
              type="button"
              onClick={() => quickFill(demoEmail)}
              className="rounded-md bg-[var(--accent-soft)] px-2 py-1 font-medium text-[var(--accent)] transition-opacity active:opacity-70"
            >
              {label}
            </button>
          ))}
        </div>
      </div>
    </form>
  );
}
