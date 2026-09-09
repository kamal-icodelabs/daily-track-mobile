"use client";

interface AuthTabsProps {
  mode: "login" | "signup";
  onChange: (mode: "login" | "signup") => void;
}

export function AuthTabs({ mode, onChange }: AuthTabsProps) {
  const tabs: { id: "login" | "signup"; label: string }[] = [
    { id: "login", label: "Login" },
    { id: "signup", label: "Sign Up" },
  ];

  return (
    <div className="relative grid grid-cols-2 rounded-2xl bg-[var(--surface)] p-1">
      <div
        className="absolute inset-y-1 left-1 w-[calc(50%-4px)] rounded-xl bg-[var(--surface-2)] shadow-sm transition-transform duration-300 ease-out"
        style={{
          transform:
            mode === "signup" ? "translateX(100%)" : "translateX(0)",
        }}
      />
      {tabs.map((tab) => {
        const active = mode === tab.id;
        return (
          <button
            key={tab.id}
            onClick={() => onChange(tab.id)}
            className={`relative z-10 rounded-xl py-2.5 text-sm font-semibold transition-colors ${
              active ? "text-[var(--accent)]" : "text-[var(--text-muted)]"
            }`}
          >
            {tab.label}
          </button>
        );
      })}
    </div>
  );
}
