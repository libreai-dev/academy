"use client";

import {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useState,
} from "react";
import { COPY, type Copy, type Lang, type Theme } from "./lib/copy";

/**
 * Cross-page state for the Academy: the active theme (light/dark) and language
 * (EN/ES). Both persist to localStorage and survive route changes, so the header
 * controls stay in sync across the roadmap and every lesson. Theme is reflected
 * onto <html data-theme>, which drives the CSS-variable palette in globals.css.
 *
 * A no-flash inline script in layout.tsx applies the saved theme before React
 * hydrates; here we simply mirror it and keep it updated.
 */

const THEME_KEY = "libreai-academy-theme";
const LANG_KEY = "libreai-academy-lang";

interface AcademyContextValue {
  theme: Theme;
  lang: Lang;
  t: Copy;
  toggleTheme: () => void;
  setLang: (lang: Lang) => void;
}

const AcademyContext = createContext<AcademyContextValue | null>(null);

function readStored<T extends string>(key: string, allowed: readonly T[], fallback: T): T {
  if (typeof window === "undefined") return fallback;
  try {
    const v = window.localStorage.getItem(key) as T | null;
    if (v && allowed.includes(v)) return v;
  } catch {
    /* ignore */
  }
  return fallback;
}

export function AcademyProvider({ children }: { children: React.ReactNode }) {
  const [theme, setTheme] = useState<Theme>("light");
  const [lang, setLangState] = useState<Lang>("en");

  // Hydrate from storage / the DOM attribute after mount (avoids SSR mismatch).
  useEffect(() => {
    const domTheme = document.documentElement.getAttribute("data-theme") as Theme | null;
    setTheme(domTheme === "dark" ? "dark" : readStored(THEME_KEY, ["light", "dark"] as const, "light"));
    setLangState(readStored(LANG_KEY, ["en", "es"] as const, "en"));
  }, []);

  // Reflect theme to the DOM + storage whenever it changes.
  useEffect(() => {
    document.documentElement.setAttribute("data-theme", theme);
    try {
      window.localStorage.setItem(THEME_KEY, theme);
    } catch {
      /* ignore */
    }
  }, [theme]);

  useEffect(() => {
    document.documentElement.setAttribute("lang", lang);
    try {
      window.localStorage.setItem(LANG_KEY, lang);
    } catch {
      /* ignore */
    }
  }, [lang]);

  const toggleTheme = useCallback(
    () => setTheme((prev) => (prev === "light" ? "dark" : "light")),
    [],
  );
  const setLang = useCallback((next: Lang) => setLangState(next), []);

  const value = useMemo<AcademyContextValue>(
    () => ({ theme, lang, t: COPY[lang], toggleTheme, setLang }),
    [theme, lang, toggleTheme, setLang],
  );

  return <AcademyContext.Provider value={value}>{children}</AcademyContext.Provider>;
}

export function useAcademy(): AcademyContextValue {
  const ctx = useContext(AcademyContext);
  if (!ctx) throw new Error("useAcademy must be used within <AcademyProvider>");
  return ctx;
}
