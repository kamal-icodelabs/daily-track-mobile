export type ThemeId =
  | "light"
  | "stealth-dark"
  | "vibrant"
  | "pastel"
  | "hill";

/**
 * All CSS custom properties that make up a theme. These are injected as
 * `[data-theme="id"]` blocks on <html> and cascade into every component
 * (including the bottom nav, which consumes `--nav`).
 */
export interface ThemeVariables {
  "--bg": string;
  "--bg-glow": string;
  "--surface": string;
  "--surface-2": string;
  "--border": string;
  "--text": string;
  "--text-muted": string;
  "--accent": string;
  "--accent-2": string;
  "--accent-soft": string;
  "--danger": string;
  "--success": string;
  "--warning": string;
  "--shadow": string;
  "--nav": string;
}

export interface Theme {
  id: ThemeId;
  name: string;
  description: string;
  /** Show "Recommended" badge in the picker for the primary light/dark options. */
  recommended: boolean;
  /** Flag non-default high-saturation themes so the UI can note them. */
  saturated?: boolean;
  variables: ThemeVariables;
}

export const THEMES: Theme[] = [
  {
    id: "light",
    name: "Light",
    description: "Crisp, clean and focused",
    recommended: true,
    variables: {
      "--bg": "#ffffff",
      "--bg-glow":
        "radial-gradient(1200px 600px at 85% -10%, rgba(79, 70, 229, 0.08), transparent 60%)",
      "--surface": "#f6f7f9",
      "--surface-2": "#ffffff",
      "--border": "#e5e7eb",
      "--text": "#111827",
      "--text-muted": "#6b7280",
      "--accent": "#4f46e5",
      "--accent-2": "#7c3aed",
      "--accent-soft": "rgba(79, 70, 229, 0.12)",
      "--danger": "#ef4444",
      "--success": "#10b981",
      "--warning": "#f59e0b",
      "--shadow": "rgba(17, 24, 39, 0.08)",
      "--nav": "#ffffff",
    },
  },
  {
    id: "stealth-dark",
    name: "Stealth Dark",
    description: "Near-black, high-contrast dark",
    recommended: true,
    variables: {
      "--bg": "#0b0d0f",
      "--bg-glow":
        "radial-gradient(1100px 500px at 90% -10%, rgba(34, 211, 238, 0.12), transparent 55%)",
      "--surface": "#131518",
      "--surface-2": "#1c1f24",
      "--border": "#262a31",
      "--text": "#e6edf3",
      "--text-muted": "#8b949e",
      "--accent": "#22d3ee",
      "--accent-2": "#2dd4bf",
      "--accent-soft": "rgba(34, 211, 238, 0.14)",
      "--danger": "#f87171",
      "--success": "#34d399",
      "--warning": "#fbbf24",
      "--shadow": "rgba(0, 0, 0, 0.55)",
      "--nav": "#0f1114",
    },
  },
  {
    id: "vibrant",
    name: "Vibrant",
    description: "Bold, energetic and colorful",
    recommended: false,
    saturated: true,
    variables: {
      "--bg": "#0f0a1e",
      "--bg-glow":
        "radial-gradient(1200px 600px at 90% -10%, rgba(168, 85, 247, 0.28), transparent 55%),\n    radial-gradient(900px 500px at 0% 110%, rgba(255, 126, 182, 0.18), transparent 55%)",
      "--surface": "#1a1230",
      "--surface-2": "#241a42",
      "--border": "#342a52",
      "--text": "#f5f3ff",
      "--text-muted": "#a8a0c8",
      "--accent": "#a855f7",
      "--accent-2": "#ff7eb6",
      "--accent-soft": "rgba(168, 85, 247, 0.2)",
      "--danger": "#fb7185",
      "--success": "#34d399",
      "--warning": "#fbbf24",
      "--shadow": "rgba(31, 12, 62, 0.6)",
      "--nav": "#140d28",
    },
  },
  {
    id: "pastel",
    name: "Pastel",
    description: "Soft, gentle and friendly",
    recommended: false,
    variables: {
      "--bg": "#fbf4f7",
      "--bg-glow":
        "radial-gradient(1200px 600px at 90% -10%, rgba(236, 72, 153, 0.12), transparent 55%),\n    radial-gradient(900px 500px at 0% 110%, rgba(167, 139, 250, 0.12), transparent 55%)",
      "--surface": "#ffffff",
      "--surface-2": "#f6eef3",
      "--border": "#f0e0ec",
      "--text": "#4a3b52",
      "--text-muted": "#8a7689",
      "--accent": "#ec4899",
      "--accent-2": "#a78bfa",
      "--accent-soft": "rgba(236, 72, 153, 0.1)",
      "--danger": "#f472b6",
      "--success": "#34d399",
      "--warning": "#fbbf24",
      "--shadow": "rgba(190, 140, 180, 0.18)",
      "--nav": "#ffffff",
    },
  },
  {
    id: "hill",
    name: "Hill",
    description: "Calm, low-key and soothing",
    recommended: false,
    variables: {
      "--bg": "#f2fbfa",
      "--bg-glow":
        "radial-gradient(1200px 600px at 90% -10%, rgba(45, 212, 191, 0.14), transparent 55%),\n    radial-gradient(900px 500px at 0% 110%, rgba(125, 211, 252, 0.12), transparent 55%)",
      "--surface": "#ffffff",
      "--surface-2": "#eef9f7",
      "--border": "#dceeec",
      "--text": "#14555a",
      "--text-muted": "#5a8688",
      "--accent": "#0d9488",
      "--accent-2": "#0ea5e9",
      "--accent-soft": "rgba(13, 148, 136, 0.1)",
      "--danger": "#f87171",
      "--success": "#10b981",
      "--warning": "#f59e0b",
      "--shadow": "rgba(70, 150, 145, 0.16)",
      "--nav": "#ffffff",
    },
  },
];

export const THEME_BY_ID: Record<ThemeId, Theme> = THEMES.reduce(
  (acc, t) => {
    acc[t.id] = t;
    return acc;
  },
  {} as Record<ThemeId, Theme>
);

/** Default when the user has no stored preference. */
export const DEFAULT_THEME: ThemeId = "light";
/** Default when the OS prefers dark mode and no preference is stored. */
export const SYSTEM_DARK_THEME: ThemeId = "stealth-dark";
export const THEME_STORAGE_KEY = "dailytask-theme";

/** Generate the `[data-theme="id"] { --var: value; ... }` CSS block for a theme. */
export function buildThemeCss(theme: Theme): string {
  const vars = Object.entries(theme.variables)
    .map(([key, value]) => `${key}: ${value};`)
    .join("\n  ");
  return `[data-theme="${theme.id}"] {\n  ${vars}\n}`;
}

/** Concatenated CSS for every theme, injected once by the provider. */
export const ALL_THEME_CSS = THEMES.map(buildThemeCss).join("\n\n");
