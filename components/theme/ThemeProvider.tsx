"use client";

import {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useState,
} from "react";
import {
  ALL_THEME_CSS,
  DEFAULT_THEME,
  SYSTEM_DARK_THEME,
  THEME_BY_ID,
  THEME_STORAGE_KEY,
  THEMES,
  type Theme,
  type ThemeId,
} from "@/lib/themes";

interface ThemeContextValue {
  theme: ThemeId;
  setTheme: (theme: ThemeId) => void;
}

const ThemeContext = createContext<ThemeContextValue | undefined>(undefined);

function getSystemTheme(): ThemeId {
  if (typeof window === "undefined") return DEFAULT_THEME;
  try {
    return window.matchMedia &&
      window.matchMedia("(prefers-color-scheme: dark)").matches
      ? SYSTEM_DARK_THEME
      : DEFAULT_THEME;
  } catch {
    return DEFAULT_THEME;
  }
}

function getInitialTheme(): ThemeId {
  if (typeof window === "undefined") return DEFAULT_THEME;
  try {
    const stored = window.localStorage.getItem(THEME_STORAGE_KEY);
    if (stored && THEME_BY_ID[stored as ThemeId]) return stored as ThemeId;
  } catch {
    // fall through to system preference
  }
  return getSystemTheme();
}

export function ThemeProvider({ children }: { children: React.ReactNode }) {
  const [theme, setThemeState] = useState<ThemeId>(getInitialTheme);

  useEffect(() => {
    document.documentElement.setAttribute("data-theme", theme);
  }, [theme]);

  const setTheme = useCallback((t: ThemeId) => {
    setThemeState(t);
    try {
      window.localStorage.setItem(THEME_STORAGE_KEY, t);
    } catch {
      // ignore storage access errors
    }
  }, []);

  const value = useMemo(() => ({ theme, setTheme }), [theme, setTheme]);

  return (
    <ThemeContext.Provider value={value}>
      {/* Inject every theme's CSS variables once; the active `data-theme`
          attribute on <html> selects which block applies. */}
      <style dangerouslySetInnerHTML={{ __html: ALL_THEME_CSS }} />
      {children}
    </ThemeContext.Provider>
  );
}

export function useTheme(): ThemeContextValue {
  const ctx = useContext(ThemeContext);
  if (!ctx) {
    throw new Error("useTheme must be used within a ThemeProvider");
  }
  return ctx;
}

export function useCurrentTheme(): Theme {
  const { theme } = useTheme();
  return THEME_BY_ID[theme] ?? THEME_BY_ID[DEFAULT_THEME];
}

export { THEMES };
