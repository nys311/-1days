import React, { createContext, useCallback, useContext, useEffect, useMemo, useState } from "react";
import { THEME_REGISTRY, DEFAULT_THEME_ID, getTheme } from "./registry";
import { THEME_VAR_KEYS, cssVarName } from "./vars";
import type { ThemeManifest } from "./types";

const STORAGE_KEY = "m1d.theme";

interface ThemeContextValue {
  theme: ThemeManifest;
  themeId: string;
  setThemeId: (id: string) => void;
  available: ThemeManifest[];
}

const ThemeContext = createContext<ThemeContextValue | null>(null);

function readStoredThemeId(): string {
  try {
    return localStorage.getItem(STORAGE_KEY) || DEFAULT_THEME_ID;
  } catch {
    return DEFAULT_THEME_ID;
  }
}

export const ThemeProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [themeId, setThemeIdState] = useState<string>(readStoredThemeId);
  const theme = useMemo(() => getTheme(themeId), [themeId]);

  useEffect(() => {
    const root = document.documentElement;
    root.setAttribute("data-theme", theme.id);
    for (const key of THEME_VAR_KEYS) {
      root.style.setProperty(cssVarName(key), theme.vars[key]);
    }
  }, [theme]);

  const setThemeId = useCallback((id: string) => {
    setThemeIdState(id);
    try {
      localStorage.setItem(STORAGE_KEY, id);
    } catch {
      /* localStorage unavailable — theme choice just won't persist */
    }
  }, []);

  const value = useMemo<ThemeContextValue>(
    () => ({ theme, themeId, setThemeId, available: THEME_REGISTRY }),
    [theme, themeId, setThemeId]
  );

  return <ThemeContext.Provider value={value}>{children}</ThemeContext.Provider>;
};

export function useTheme(): ThemeContextValue {
  const ctx = useContext(ThemeContext);
  if (!ctx) throw new Error("useTheme phải được gọi bên trong <ThemeProvider>");
  return ctx;
}
