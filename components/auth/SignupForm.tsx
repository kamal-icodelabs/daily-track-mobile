"use client";

import { useRouter } from "next/navigation";
import { useState } from "react";
import { Eye, EyeOff, Lock, Mail, User, type LucideIcon } from "lucide-react";
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
          autoComplete={isPassword ? "new-password" : "off"}
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

export function SignupForm() {
  const router = useRouter();
  const { login } = useAuth();
  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [confirm, setConfirm] = useState("");

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    console.log("Signup requested", { name, email, password, confirm });
    // Roles are assigned by the admin. For the mock, sign up as the
    // default developer account; the admin panel can later promote them.
    login("meera.iyer@icodelabs.com");
    router.push("/dashboard");
  };

  return (
    <form onSubmit={handleSubmit} className="space-y-4">
      <Field
        label="Full name"
        type="text"
        placeholder="Jane Doe"
        value={name}
        onChange={setName}
        icon={User}
      />
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
        placeholder="Create a password"
        value={password}
        onChange={setPassword}
        icon={Lock}
      />
      <Field
        label="Confirm password"
        type="password"
        placeholder="Repeat password"
        value={confirm}
        onChange={setConfirm}
        icon={Lock}
      />
      <button
        type="submit"
        className="w-full rounded-xl bg-[var(--accent)] py-3.5 text-sm font-semibold text-[var(--bg)] shadow-lg shadow-[var(--accent-soft)] transition-transform active:scale-[0.98]"
      >
        Create Account
      </button>
    </form>
  );
}
