export type ThemeId =
  | "light"
  | "stealth-dark"
  | "midnight"
  | "tokyo-night"
  | "one-light";

/**
 * All CSS custom properties that make up a theme. These are injected as
 * `[data-theme="id"]` blocks on <html> and cascade into every component
 * (including the bottom nav, which consumes `--nav`).
 *
 * The design language follows Cursor's official themes (Dark, Light, Midnight):
 * - surfaces are neutral graphite/gray monochrome (never saturated)
 * - `--border` / `--text-muted` / `--accent-soft` are the ink color at low
 *   alpha (8-digit hex) for subtle, cohesive hierarchy
 * - accents belong to a professional steel/ice-blue family
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
  variables: ThemeVariables;
}

export const THEMES: Theme[] = [
  {
    id: "light",
    name: "Light",
    description: "Cursor Light — crisp graphite on near-white",
    recommended: true,
    variables: {
      "--bg": "#FCFCFC",
      "--bg-glow":
        "radial-gradient(1200px 600px at 85% -10%, rgba(60, 124, 171, 0.07), transparent 60%)",
      "--surface": "#F3F3F3",
      "--surface-2": "#FCFCFC",
      "--border": "#14141413",
      "--text": "#141414",
      "--text-muted": "#6b6b76",
      "--accent": "#3C7CAB",
      "--accent-2": "#6F9BA6",
      "--accent-soft": "#3C7CAB1C",
      "--danger": "#CF2D56",
      "--success": "#1F8A65",
      "--warning": "#C08532",
      "--shadow": "#1414141E",
      "--nav": "#FCFCFC",
    },
  },
  {
    id: "stealth-dark",
    name: "Stealth",
    description: "Cursor Dark — near-black graphite, ice-blue accent",
    recommended: true,
    variables: {
      "--bg": "#181818",
      "--bg-glow":
        "radial-gradient(1100px 500px at 90% -10%, rgba(136, 192, 208, 0.10), transparent 55%)",
      "--surface": "#141414",
      "--surface-2": "#1c1c1c",
      "--border": "#E4E4E413",
      "--text": "#e6e6e6",
      "--text-muted": "#9a9a9a",
      "--accent": "#81A1C1",
      "--accent-2": "#88C0D0",
      "--accent-soft": "#81A1C126",
      "--danger": "#E34671",
      "--success": "#3FA266",
      "--warning": "#D2943E",
      "--shadow": "#00000066",
      "--nav": "#161616",
    },
  },
  {
    id: "midnight",
    name: "Midnight",
    description: "Cursor Midnight — soft Nordic dark",
    recommended: false,
    variables: {
      "--bg": "#1e2127",
      "--bg-glow":
        "radial-gradient(1200px 600px at 90% -10%, rgba(136, 192, 208, 0.10), transparent 55%)",
      "--surface": "#191c22",
      "--surface-2": "#1e2129",
      "--border": "#272c36",
      "--text": "#d8dee9",
      "--text-muted": "#7b88a1",
      "--accent": "#88c0d0",
      "--accent-2": "#8fbcbb",
      "--accent-soft": "#88c0d028",
      "--danger": "#bf616a",
      "--success": "#a3be8c",
      "--warning": "#ebcb8b",
      "--shadow": "#00000066",
      "--nav": "#1c2028",
    },
  },
  {
    id: "tokyo-night",
    name: "Tokyo Night",
    description: "Iconic deep-indigo night palette",
    recommended: false,
    variables: {
      "--bg": "#1a1b26",
      "--bg-glow":
        "radial-gradient(1200px 600px at 90% -10%, rgba(122, 162, 247, 0.12), transparent 55%)",
      "--surface": "#24283b",
      "--surface-2": "#292e42",
      "--border": "#414868",
      "--text": "#c0caf5",
      "--text-muted": "#a0a8c8",
      "--accent": "#7aa2f7",
      "--accent-2": "#7dcfff",
      "--accent-soft": "#7aa2f728",
      "--danger": "#f7768e",
      "--success": "#9ece6a",
      "--warning": "#e0af68",
      "--shadow": "#00000066",
      "--nav": "#232742",
    },
  },
  {
    id: "one-light",
    name: "One Light",
    description: "Warm paper-light, gentle and readable",
    recommended: false,
    variables: {
      "--bg": "#fafafa",
      "--bg-glow":
        "radial-gradient(1200px 600px at 85% -10%, rgba(64, 120, 242, 0.06), transparent 60%)",
      "--surface": "#ffffff",
      "--surface-2": "#f0f0f0",
      "--border": "#e5e5e5",
      "--text": "#383a42",
      "--text-muted": "#8a8b92",
      "--accent": "#4078f2",
      "--accent-2": "#0184bc",
      "--accent-soft": "#4078f21c",
      "--danger": "#e45649",
      "--success": "#50a14f",
      "--warning": "#c18401",
      "--shadow": "rgba(0, 0, 0, 0.08)",
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